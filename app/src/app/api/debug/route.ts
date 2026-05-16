import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// Quick read-only diagnostics. Returns row counts and a few samples.
// Safe to leave in; no secrets exposed.
export async function GET() {
  try {
    const counts = await db.query<{ table: string; n: string }>(`
      SELECT 'account_snapshot' AS table, COUNT(*)::text AS n FROM account_snapshot
      UNION ALL SELECT 'positions', COUNT(*)::text FROM positions
      UNION ALL SELECT 'activity', COUNT(*)::text FROM activity
      UNION ALL SELECT 'benchmarks', COUNT(*)::text FROM benchmarks
      UNION ALL SELECT 'benchmark_snapshot', COUNT(*)::text FROM benchmark_snapshot
      UNION ALL SELECT 'performance_daily', COUNT(*)::text FROM performance_daily
      UNION ALL SELECT 'performance_intraday', COUNT(*)::text FROM performance_intraday
      UNION ALL SELECT 'puller_meta', COUNT(*)::text FROM puller_meta
    `);

    const recentActivity = await db.query(
      `SELECT id, symbol, side, qty, price, filled_at FROM activity ORDER BY filled_at DESC LIMIT 5`,
    );

    const meta = await db.query(
      `SELECT key, value, updated_at FROM puller_meta`,
    );

    return NextResponse.json({
      counts: Object.fromEntries(counts.rows.map((r) => [r.table, Number(r.n)])),
      recentActivity: recentActivity.rows,
      meta: meta.rows,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
