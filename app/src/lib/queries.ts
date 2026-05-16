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

export async function getPerformanceSeries(): Promise<PerformanceSeries[]> {
  const { rows } = await db.query<{
    symbol: string;
    label: string;
    date: string;
    value: number;
  }>(
    `SELECT p.symbol,
            COALESCE(b.label, 'Portfolio') AS label,
            p.date,
            p.value
       FROM performance_daily p
       LEFT JOIN benchmarks b ON b.symbol = p.symbol
       WHERE p.date >= date_trunc('year', CURRENT_DATE)
       ORDER BY p.symbol, p.date ASC`,
  );

  const bySymbol = new Map<string, PerformanceSeries>();
  for (const r of rows) {
    let s = bySymbol.get(r.symbol);
    if (!s) {
      s = { symbol: r.symbol, label: r.label, points: [] };
      bySymbol.set(r.symbol, s);
    }
    s.points.push({ date: r.date, value: r.value });
  }

  // Portfolio first, then benchmarks alphabetically.
  return [...bySymbol.values()].sort((a, b) => {
    if (a.symbol === "PORTFOLIO") return -1;
    if (b.symbol === "PORTFOLIO") return 1;
    return a.symbol.localeCompare(b.symbol);
  });
}
