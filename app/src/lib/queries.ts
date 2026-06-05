import { db } from "./db";
import type {
  AccountSummary,
  Activity,
  Benchmark,
  MarketClock,
  PerformancePoint,
  PerformanceSeries,
  Position,
  TradeStats,
} from "./types";

export async function getSummary(): Promise<AccountSummary | null> {
  const { rows } = await db.query<{
    portfolio_value: string;
    cash: string;
    ytd_return_pct: string;
    ytd_return_dollar: string;
    updated_at: string;
  }>(
    `SELECT portfolio_value, cash, ytd_return_pct, ytd_return_dollar, updated_at
       FROM account_snapshot
       ORDER BY updated_at DESC
       LIMIT 1`,
  );
  const r = rows[0];
  if (!r) return null;
  return {
    portfolio_value: Number(r.portfolio_value),
    cash: Number(r.cash),
    ytd_return_pct: Number(r.ytd_return_pct),
    ytd_return_dollar: Number(r.ytd_return_dollar),
    updated_at: r.updated_at,
  };
}

export async function getBenchmarks(): Promise<Benchmark[]> {
  const { rows } = await db.query<{
    symbol: string;
    label: string;
    kind: string;
    ytd_pct: string;
    current_price: string;
  }>(
    `SELECT b.symbol, b.label, b.kind,
            COALESCE(s.ytd_pct, 0)       AS ytd_pct,
            COALESCE(s.current_price, 0) AS current_price
       FROM benchmarks b
       LEFT JOIN benchmark_snapshot s ON s.symbol = b.symbol
       ORDER BY b.sort_order, b.symbol`,
  );
  return rows.map((r) => ({
    ...r,
    ytd_pct: Number(r.ytd_pct),
    current_price: Number(r.current_price),
  }));
}

export async function getPositions(): Promise<Position[]> {
  const { rows } = await db.query<{
    symbol: string;
    qty: string;
    avg_entry_price: string;
    current_price: string;
    market_value: string;
    unrealized_pl: string;
    unrealized_pl_pct: string;
    opened_at: string;
  }>(
    `SELECT symbol, qty, avg_entry_price, current_price,
            market_value, unrealized_pl, unrealized_pl_pct, opened_at
       FROM positions
       ORDER BY market_value DESC`,
  );
  return rows.map((r) => ({
    ...r,
    qty: Number(r.qty),
    avg_entry_price: Number(r.avg_entry_price),
    current_price: Number(r.current_price),
    market_value: Number(r.market_value),
    unrealized_pl: Number(r.unrealized_pl),
    unrealized_pl_pct: Number(r.unrealized_pl_pct),
  }));
}

export async function getActivity(limit = 50): Promise<Activity[]> {
  const { rows } = await db.query<{
    id: string;
    symbol: string;
    side: "buy" | "sell";
    qty: string;
    price: string;
    filled_at: string;
  }>(
    `SELECT id, symbol, side, qty, price, filled_at
       FROM activity
       ORDER BY filled_at DESC
       LIMIT $1`,
    [limit],
  );
  // pg returns NUMERIC as strings; coerce to numbers so callers can do math.
  return rows.map((r) => ({
    ...r,
    qty: Number(r.qty),
    price: Number(r.price),
  }));
}

import { isIntraday, rangeSinceClause, type Range } from "./ranges";

// Most recent PORTFOLIO row in performance_daily strictly before today
// in Eastern Time. Used as the baseline for "Today" P/L on the hero.
// Returns null if no prior trading day exists.
export async function getPriorPortfolioClose(): Promise<number | null> {
  const { rows } = await db.query<{ value: string | null }>(
    `SELECT value::text AS value
       FROM performance_daily
      WHERE symbol = 'PORTFOLIO'
        AND date < ((now() AT TIME ZONE 'America/New_York')::date)
      ORDER BY date DESC
      LIMIT 1`,
  );
  const v = rows[0]?.value;
  return v != null ? Number(v) : null;
}

// Returns the day BEFORE the earliest trade, in Eastern Time. That gives the
// chart and comparison cards an "all cash" baseline to grow from, so the
// percentage change reflects the actual trading result rather than starting
// at the post-first-trade equity.
export async function getInceptionDate(): Promise<string | null> {
  // Subtract one calendar day from the earliest trade (in ET) so we have
  // an "all cash" baseline. Cast back to date so we return YYYY-MM-DD only,
  // avoiding timezone shifts when JS later parses it.
  const { rows } = await db.query<{ date: string | null }>(
    `SELECT (
       (MIN(filled_at) AT TIME ZONE 'America/New_York')::date - 1
     )::text AS date
     FROM activity`,
  );
  return rows[0]?.date ?? null;
}

// FIFO lot matcher over the activity table. Each sell consumes from the
// front of that symbol's open-buy queue; a fully-matched buy->sell pair
// counts as one closed trade. Open lots (positions still held) are not
// counted in win rate - only realized P/L is honest.
export async function getTradeStats(): Promise<TradeStats | null> {
  const { rows } = await db.query<{
    symbol: string;
    side: "buy" | "sell";
    qty: string;
    price: string;
    filled_at: string;
  }>(
    `SELECT symbol, side, qty, price, filled_at
       FROM activity
       ORDER BY filled_at ASC, id ASC`,
  );

  type Lot = { qty: number; price: number; ts: number };
  const open = new Map<string, Lot[]>();
  let closed = 0;
  let wins = 0;
  let holdMsTotal = 0;
  let bestTrade: { symbol: string; pct: number } | null = null;
  let worstTrade: { symbol: string; pct: number } | null = null;

  for (const r of rows) {
    const qty = Number(r.qty);
    const price = Number(r.price);
    const ts = new Date(r.filled_at).getTime();
    let lots = open.get(r.symbol);
    if (!lots) {
      lots = [];
      open.set(r.symbol, lots);
    }
    if (r.side === "buy") {
      lots.push({ qty, price, ts });
      continue;
    }
    // sell: consume buy lots FIFO. Each consumed slice (partial or whole
    // buy lot) realizes one "closed trade" for our accounting.
    let remaining = qty;
    while (remaining > 1e-9 && lots.length > 0) {
      const lot = lots[0];
      const matched = Math.min(lot.qty, remaining);
      const pl = (price - lot.price) * matched;
      closed++;
      if (pl > 0) wins++;
      holdMsTotal += ts - lot.ts;
      const pct = lot.price ? ((price - lot.price) / lot.price) * 100 : 0;
      if (!bestTrade || pct > bestTrade.pct) {
        bestTrade = { symbol: r.symbol, pct };
      }
      if (!worstTrade || pct < worstTrade.pct) {
        worstTrade = { symbol: r.symbol, pct };
      }
      lot.qty -= matched;
      remaining -= matched;
      if (lot.qty <= 1e-9) lots.shift();
    }
    // Any short-sale style overflow (selling more than we ever bought)
    // is ignored - the puller doesn't currently track short positions.
  }

  if (closed === 0) return null;
  return {
    closedTrades: closed,
    winRate: wins / closed,
    avgHoldDays: holdMsTotal / closed / 86_400_000,
    bestTrade,
    worstTrade,
  };
}

// Max peak-to-trough drawdown over a series, returned as a negative pct
// (e.g. -3.2 means worst observed -3.2% from a running peak). Returns 0
// when the series is empty or never declined.
export function computeMaxDrawdown(points: PerformancePoint[]): number {
  let peak = -Infinity;
  let worst = 0;
  for (const p of points) {
    const v = Number(p.value);
    if (!isFinite(v) || v <= 0) continue;
    if (v > peak) peak = v;
    if (peak > 0) {
      const dd = (v - peak) / peak;
      if (dd < worst) worst = dd;
    }
  }
  return worst * 100;
}

// Reads the cached market clock blob the puller writes on every run.
// Returns null when the puller hasn't written one yet.
export async function getMarketClock(): Promise<MarketClock | null> {
  const { rows } = await db.query<{ value: string }>(
    `SELECT value FROM puller_meta WHERE key = 'market_clock'`,
  );
  const raw = rows[0]?.value;
  if (!raw) return null;
  try {
    const j = JSON.parse(raw) as {
      is_open: boolean;
      next_open: string | null;
      next_close: string | null;
      captured_at: string;
    };
    return {
      isOpen: !!j.is_open,
      nextOpen: j.next_open ?? null,
      nextClose: j.next_close ?? null,
      capturedAt: j.captured_at,
    };
  } catch {
    return null;
  }
}

// Intraday PORTFOLIO points for the current ET trading day. Drives the
// "Today" live chart. Empty array on pre-open or pre-puller-run days.
export async function getIntradayPortfolioToday(): Promise<
  { t: string; value: number }[]
> {
  const { rows } = await db.query<{ t: string; value: string }>(
    `SELECT ts::text AS t, value::text AS value
       FROM performance_intraday
      WHERE symbol = 'PORTFOLIO'
        AND (ts AT TIME ZONE 'America/New_York')::date
          = (now() AT TIME ZONE 'America/New_York')::date
      ORDER BY ts ASC`,
  );
  return rows.map((r) => ({ t: r.t, value: Number(r.value) }));
}

// Daily performance series from a specific start date onward. Used for the
// "since first trade" comparison view.
export async function getPerformanceSeriesSince(
  startDate: string,
): Promise<PerformanceSeries[]> {
  const { rows } = await db.query<{
    symbol: string;
    label: string;
    t: string;
    value: number;
  }>(
    `SELECT p.symbol,
            COALESCE(b.label, 'Portfolio') AS label,
            p.date::text AS t,
            p.value
       FROM performance_daily p
       LEFT JOIN benchmarks b ON b.symbol = p.symbol
       WHERE p.date >= $1::date
         AND p.date IN (
           SELECT DISTINCT date FROM performance_daily WHERE symbol <> 'PORTFOLIO'
         )
       ORDER BY p.symbol, p.date ASC`,
    [startDate],
  );

  const bySymbol = new Map<string, PerformanceSeries>();
  for (const r of rows) {
    let s = bySymbol.get(r.symbol);
    if (!s) {
      s = { symbol: r.symbol, label: r.label, points: [] };
      bySymbol.set(r.symbol, s);
    }
    s.points.push({ t: r.t, value: Number(r.value) });
  }
  return [...bySymbol.values()].sort((a, b) => {
    if (a.symbol === "PORTFOLIO") return -1;
    if (b.symbol === "PORTFOLIO") return 1;
    return a.symbol.localeCompare(b.symbol);
  });
}

export async function getPerformanceSeries(
  range: Range = "YTD",
): Promise<PerformanceSeries[]> {
  const intraday = isIntraday(range);
  const since = rangeSinceClause(range);

  const sql = intraday
    ? `SELECT p.symbol,
              COALESCE(b.label, 'Portfolio') AS label,
              p.ts::text AS t,
              p.value
         FROM performance_intraday p
         LEFT JOIN benchmarks b ON b.symbol = p.symbol
         WHERE ${since}
         ORDER BY p.symbol, p.ts ASC`
    : `SELECT p.symbol,
              COALESCE(b.label, 'Portfolio') AS label,
              p.date::text AS t,
              p.value
         FROM performance_daily p
         LEFT JOIN benchmarks b ON b.symbol = p.symbol
         WHERE ${since}
           AND p.date IN (
             SELECT DISTINCT date FROM performance_daily WHERE symbol <> 'PORTFOLIO'
           )
         ORDER BY p.symbol, p.date ASC`;

  const { rows } = await db.query<{
    symbol: string;
    label: string;
    t: string;
    value: number;
  }>(sql);

  const bySymbol = new Map<string, PerformanceSeries>();
  for (const r of rows) {
    let s = bySymbol.get(r.symbol);
    if (!s) {
      s = { symbol: r.symbol, label: r.label, points: [] };
      bySymbol.set(r.symbol, s);
    }
    s.points.push({ t: r.t, value: Number(r.value) });
  }

  // Portfolio first, then benchmarks alphabetically.
  return [...bySymbol.values()].sort((a, b) => {
    if (a.symbol === "PORTFOLIO") return -1;
    if (b.symbol === "PORTFOLIO") return 1;
    return a.symbol.localeCompare(b.symbol);
  });
}
