import { db } from "./db";
import type {
  AccountSummary,
  Activity,
  Benchmark,
  PerformanceSeries,
  Position,
} from "./types";

export async function getSummary(): Promise<AccountSummary | null> {
  const { rows } = await db.query<AccountSummary>(
    `SELECT portfolio_value, cash, ytd_return_pct, ytd_return_dollar, updated_at
       FROM account_snapshot
       ORDER BY updated_at DESC
       LIMIT 1`,
  );
  return rows[0] ?? null;
}

export async function getBenchmarks(): Promise<Benchmark[]> {
  const { rows } = await db.query<Benchmark>(
    `SELECT b.symbol, b.label, b.kind,
            COALESCE(s.ytd_pct, 0)       AS ytd_pct,
            COALESCE(s.current_price, 0) AS current_price
       FROM benchmarks b
       LEFT JOIN benchmark_snapshot s ON s.symbol = b.symbol
       ORDER BY b.sort_order, b.symbol`,
  );
  return rows;
}

export async function getPositions(): Promise<Position[]> {
  const { rows } = await db.query<Position>(
    `SELECT symbol, qty, avg_entry_price, current_price,
            market_value, unrealized_pl, unrealized_pl_pct, opened_at
       FROM positions
       ORDER BY market_value DESC`,
  );
  return rows;
}

export async function getActivity(limit = 50): Promise<Activity[]> {
  const { rows } = await db.query<Activity>(
    `SELECT id, symbol, side, qty, price, filled_at
       FROM activity
       ORDER BY filled_at DESC
       LIMIT $1`,
    [limit],
  );
  return rows;
}

import { isIntraday, rangeSinceClause, type Range } from "./ranges";

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
