import { alpaca } from "./alpaca.js";
import { db } from "./db.js";
import { getDailyBars, getQuote, getYtdReturnPct } from "./market.js";
// Bundled as a string via esbuild's text loader at build time.
import schemaSql from "./schema.sql";

export const handler = async () => {
  const startedAt = Date.now();
  try {
    await ensureSchema();
    await maybeMigrateToYahooIndices();

    // One-time backfill of historical data from Alpaca. Runs only if the
    // puller_meta marker isn't set. Independent of market hours - the
    // history data is useful regardless of whether the market is open now.
    await maybeBackfill();

    // Skip the live-pull part when the market is closed (weekends,
    // holidays, off-hours). FORCE_PULL=1 bypasses for manual runs.
    if (!process.env.FORCE_PULL) {
      const clock = await alpaca.clock();
      if (!clock.is_open) {
        console.log(
          `market closed, skipping live pull. next open: ${clock.next_open}`,
        );
        return {
          ok: true,
          skipped: "market_closed",
          ms: Date.now() - startedAt,
        };
      }
    }

    await pull();
    return { ok: true, ms: Date.now() - startedAt };
  } catch (err) {
    console.error("puller failed", err);
    throw err;
  } finally {
    await db.end().catch(() => {});
  }
};

async function ensureSchema() {
  await db.query(schemaSql);
}

async function getMeta(key: string): Promise<string | null> {
  const { rows } = await db.query<{ value: string }>(
    `SELECT value FROM puller_meta WHERE key = $1`,
    [key],
  );
  return rows[0]?.value ?? null;
}

async function setMeta(key: string, value: string) {
  await db.query(
    `INSERT INTO puller_meta (key, value, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
    [key, value],
  );
}

async function maybeMigrateToYahooIndices() {
  if (await getMeta("migrated_to_yahoo_indices")) return;
  console.log("migrating benchmarks from Alpaca ETFs to Yahoo indices...");

  const oldSymbols = ["SPY", "QQQ", "IWB", "IWM"];
  await db.query(
    `DELETE FROM performance_daily WHERE symbol = ANY($1)`,
    [oldSymbols],
  );
  await db.query(
    `DELETE FROM performance_intraday WHERE symbol = ANY($1)`,
    [oldSymbols],
  );
  // benchmark_snapshot has ON DELETE CASCADE on the benchmarks FK.
  await db.query(`DELETE FROM benchmarks WHERE symbol = ANY($1)`, [oldSymbols]);

  // Clear any per-benchmark backfill markers for the old symbols so we
  // don't leave dead state behind.
  await db.query(
    `DELETE FROM puller_meta
      WHERE key LIKE 'backfilled_benchmark_%'
        AND replace(key, 'backfilled_benchmark_', '') = ANY($1)`,
    [oldSymbols],
  );

  await setMeta("migrated_to_yahoo_indices", new Date().toISOString());
  console.log("migration complete; new benchmarks will backfill on this run");
}

async function maybeBackfill() {
  // Portfolio history backfill - one-time. Sets the "backfilled_history"
  // marker for backwards compatibility with old deploys.
  let portfolioStartISO: string | null = null;
  if (!(await getMeta("backfilled_history"))) {
    console.log("starting portfolio history backfill from Alpaca...");
    const history = await alpaca.portfolioHistory("5A", "1D");
    let portfolioRows = 0;
    for (let i = 0; i < history.timestamp.length; i++) {
      const equity = history.equity[i];
      if (equity == null) continue;
      const date = new Date(history.timestamp[i] * 1000)
        .toISOString()
        .slice(0, 10);
      await db.query(
        `INSERT INTO performance_daily (date, symbol, value)
         VALUES ($1, 'PORTFOLIO', $2)
         ON CONFLICT (date, symbol) DO UPDATE SET value = EXCLUDED.value`,
        [date, equity],
      );
      portfolioRows++;
    }
    portfolioStartISO =
      history.timestamp[0] != null
        ? new Date(history.timestamp[0] * 1000).toISOString()
        : null;
    await setMeta("backfilled_history", new Date().toISOString());
    console.log(`portfolio backfill complete: ${portfolioRows} rows`);
  }

  // Per-benchmark backfill - each benchmark gets its own marker, so when
  // you add a new benchmark to the seed (or insert a row manually), only
  // that one gets backfilled on the next puller run.
  const benchmarkSymbols = await getBenchmarkSymbols();
  for (const symbol of benchmarkSymbols) {
    const key = `backfilled_benchmark_${symbol}`;
    if (await getMeta(key)) continue;
    const start = portfolioStartISO ?? (await earliestPortfolioDateISO());
    console.log(`backfilling benchmark ${symbol} from ${start}...`);
    const bars = await getDailyBars(symbol, start);
    for (const b of bars) {
      await db.query(
        `INSERT INTO performance_daily (date, symbol, value)
         VALUES ($1, $2, $3)
         ON CONFLICT (date, symbol) DO UPDATE SET value = EXCLUDED.value`,
        [b.date, symbol, b.close],
      );
    }
    await setMeta(key, new Date().toISOString());
    console.log(`backfilled ${symbol}: ${bars.length} rows`);
  }

  // Orders backfill - one-time.
  if (!(await getMeta("backfilled_orders"))) {
    console.log("starting orders backfill from Alpaca...");
    const allOrders = await alpaca.filledOrders();
    const orderRows = await insertOrders(allOrders);
    await setMeta("backfilled_orders", new Date().toISOString());
    console.log(`orders backfill complete: ${orderRows} order rows inserted`);
  }
}

async function earliestPortfolioDateISO(): Promise<string> {
  const { rows } = await db.query<{ date: string | null }>(
    `SELECT (MIN(date))::text AS date FROM performance_daily WHERE symbol = 'PORTFOLIO'`,
  );
  const d = rows[0]?.date;
  if (d) return new Date(d + "T00:00:00Z").toISOString();
  // Fall back to ~5 years ago.
  return new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000).toISOString();
}

async function insertOrders(orders: { id: string; symbol: string; side: "buy" | "sell"; filled_qty: string; filled_avg_price: string | null; filled_at: string | null }[]): Promise<number> {
  let inserted = 0;
  for (const o of orders) {
    if (!o.filled_at || !o.filled_avg_price) continue;
    const r = await db.query(
      `INSERT INTO activity (id, symbol, side, qty, price, filled_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO NOTHING`,
      [
        o.id,
        o.symbol,
        o.side,
        Number(o.filled_qty),
        Number(o.filled_avg_price),
        o.filled_at,
      ],
    );
    if (r.rowCount && r.rowCount > 0) inserted++;
  }
  return inserted;
}

async function pull() {
  const benchmarkSymbols = await getBenchmarkSymbols();

  const [account, positions, benchmarks] = await Promise.all([
    alpaca.account(),
    alpaca.positions(),
    fetchBenchmarks(benchmarkSymbols),
  ]);

  const portfolioValue = Number(account.portfolio_value);
  const equity = Number(account.equity);

  // YTD vs configured starting equity. Alpaca's `last_equity` is yesterday's
  // close, not the year start, so we use STARTING_EQUITY instead.
  const startingEquity = Number(process.env.STARTING_EQUITY ?? "10000");
  const ytdReturnDollar = equity - startingEquity;
  const ytdReturnPct = startingEquity
    ? (ytdReturnDollar / startingEquity) * 100
    : 0;

  await db.query(
    `INSERT INTO account_snapshot
       (portfolio_value, cash, ytd_return_pct, ytd_return_dollar)
     VALUES ($1, $2, $3, $4)`,
    [portfolioValue, Number(account.cash), ytdReturnPct, ytdReturnDollar],
  );

  for (const b of benchmarks) {
    await db.query(
      `INSERT INTO benchmark_snapshot (symbol, current_price, ytd_pct, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (symbol) DO UPDATE SET
         current_price = EXCLUDED.current_price,
         ytd_pct       = EXCLUDED.ytd_pct,
         updated_at    = EXCLUDED.updated_at`,
      [b.symbol, b.price, b.ytdPct],
    );
  }

  await db.query("BEGIN");
  try {
    await db.query("DELETE FROM positions");
    for (const p of positions) {
      await db.query(
        `INSERT INTO positions
           (symbol, qty, avg_entry_price, current_price,
            market_value, unrealized_pl, unrealized_pl_pct, opened_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
        [
          p.symbol,
          Number(p.qty),
          Number(p.avg_entry_price),
          Number(p.current_price),
          Number(p.market_value),
          Number(p.unrealized_pl),
          Number(p.unrealized_plpc) * 100,
        ],
      );
    }
    await db.query("COMMIT");
  } catch (e) {
    await db.query("ROLLBACK");
    throw e;
  }

  // 90-day rolling window for routine runs. The one-time backfill below
  // pulls the rest of history; this window covers anything the backfill
  // missed (e.g. a brief Alpaca outage at backfill time).
  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const orders = await alpaca.filledOrders(since);
  const newOrderRows = await insertOrders(orders);
  const skipped = orders.length - orders.filter((o) => o.filled_at && o.filled_avg_price).length;
  if (skipped > 0) {
    console.log(`note: skipped ${skipped} order(s) missing filled_at or filled_avg_price`);
  }

  // Both write-paths in parallel: daily (one row per day, upserted) +
  // intraday (one row per minute, append-only).
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  await Promise.all([
    upsertDailyValue(today, "PORTFOLIO", portfolioValue),
    insertIntradayValue(now, "PORTFOLIO", portfolioValue),
    ...benchmarks.flatMap((b) => [
      upsertDailyValue(today, b.symbol, b.price),
      insertIntradayValue(now, b.symbol, b.price),
    ]),
  ]);

  console.log(
    `puller ok: ${positions.length} positions, ${orders.length} orders fetched (${newOrderRows} new), ${benchmarks.length} benchmarks`,
  );
}

async function getBenchmarkSymbols(): Promise<string[]> {
  const { rows } = await db.query<{ symbol: string }>(
    `SELECT symbol FROM benchmarks ORDER BY sort_order, symbol`,
  );
  return rows.map((r) => r.symbol);
}

async function fetchBenchmarks(symbols: string[]) {
  return Promise.all(
    symbols.map(async (symbol) => {
      const [price, ytdPct] = await Promise.all([
        getQuote(symbol),
        getYtdReturnPct(symbol),
      ]);
      return { symbol, price, ytdPct };
    }),
  );
}

async function upsertDailyValue(date: string, symbol: string, value: number) {
  await db.query(
    `INSERT INTO performance_daily (date, symbol, value)
     VALUES ($1, $2, $3)
     ON CONFLICT (date, symbol) DO UPDATE SET value = EXCLUDED.value`,
    [date, symbol, value],
  );
}

async function insertIntradayValue(ts: Date, symbol: string, value: number) {
  await db.query(
    `INSERT INTO performance_intraday (ts, symbol, value)
     VALUES ($1, $2, $3)
     ON CONFLICT (ts, symbol) DO NOTHING`,
    [ts, symbol, value],
  );
}

// Auto-invoke when not running inside AWS Lambda. Lambda imports the module
// and calls `handler` itself; everywhere else (Fargate, local dev, plain
// `node index.js`) we run it ourselves.
if (!process.env.AWS_LAMBDA_FUNCTION_NAME) {
  handler()
    .then((r) => console.log(JSON.stringify(r)))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
