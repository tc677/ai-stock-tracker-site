import { alpaca } from "./alpaca.js";
import { db } from "./db.js";
import { getQuote, getYtdReturnPct } from "./market.js";
// Bundled as a string via esbuild's text loader at build time.
import schemaSql from "./schema.sql";

export const handler = async () => {
  const startedAt = Date.now();
  try {
    await ensureSchema();
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
  // Idempotent - schema.sql uses CREATE TABLE IF NOT EXISTS.
  await db.query(schemaSql);
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

  // Alpaca's `last_equity` is yesterday's close, not the year start. Use a
  // configured starting balance instead, so the dashboard shows return
  // since account inception.
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
        [p.symbol, Number(p.qty), Number(p.avg_entry_price),
         Number(p.current_price), Number(p.market_value),
         Number(p.unrealized_pl), Number(p.unrealized_plpc) * 100],
      );
    }
    await db.query("COMMIT");
  } catch (e) {
    await db.query("ROLLBACK");
    throw e;
  }

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const orders = await alpaca.filledOrders(since);
  for (const o of orders) {
    if (!o.filled_at || !o.filled_avg_price) continue;
    await db.query(
      `INSERT INTO activity (id, symbol, side, qty, price, filled_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO NOTHING`,
      [o.id, o.symbol, o.side, Number(o.filled_qty),
       Number(o.filled_avg_price), o.filled_at],
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  await upsertDailyValue(today, "PORTFOLIO", portfolioValue);
  for (const b of benchmarks) {
    await upsertDailyValue(today, b.symbol, b.price);
  }

  console.log(
    `puller ok: ${positions.length} positions, ${orders.length} recent orders, ${benchmarks.length} benchmarks`,
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
