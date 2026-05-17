import { db } from "./db";
import type {
  AccountSummary,
  Activity,
  Benchmark,
  PerformanceSeries,
  Position,
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

// Returns the day BEFORE the earliest trade, in Eastern Time. That gives the
// chart and comparison cards an "all cash" baseline to grow from, so the
// percentage change reflects the actual trading result rather than starting
// at the post-first-trade equity.
export async function getInceptionDate(): Promise<string | null> {
  const { rows } = await db.query<{ date: string | null }>(
    `SELECT (
       (MIN(filled_at) AT TIME ZONE 'America/New_York')::date
       - INTERVAL '1 day'
     )::text AS date
     FROM activity`,
  );
  return rows[0]?.date ?? null;
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
