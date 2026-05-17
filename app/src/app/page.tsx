import { ComparisonCards } from "@/components/ComparisonCards";
import { FilteredChart } from "@/components/FilteredChart";
import { PositionsTreemap } from "@/components/PositionsTreemap";
import {
  getActivity,
  getInceptionDate,
  getPerformanceSeriesSince,
  getPositions,
  getSummary,
} from "@/lib/queries";
import { fmtDate, fmtDateTime, fmtPct, fmtUSD } from "@/lib/format";

export const revalidate = 10;

export default async function Home() {
  const [summary, inceptionDate, positions, activity] = await Promise.all([
    getSummary().catch(() => null),
    getInceptionDate().catch(() => null),
    getPositions().catch(() => []),
    getActivity(100).catch(() => []),
  ]);

  const sinceSeries = inceptionDate
    ? await getPerformanceSeriesSince(inceptionDate).catch(() => [])
    : [];

  if (!summary) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 p-12 text-center text-zinc-500">
        No data yet. The puller will populate this once it runs.
      </div>
    );
  }

  // Use the chart series for the baseline (portfolio value at inception)
  // but the live summary for the current value, so the % reflects the
  // most recent equity even on weekends/holidays when the chart series
  // is filtered to trading days only.
  const portfolioSince = sinceSeries.find((s) => s.symbol === "PORTFOLIO");
  const sincePct = (() => {
    const baseline = Number(portfolioSince?.points[0]?.value ?? 0);
    const current = Number(summary.portfolio_value);
    if (!baseline) return null;
    return ((current - baseline) / baseline) * 100;
  })();

  const positive = sincePct == null ? true : sincePct >= 0;
  const heroColor = positive
    ? "text-emerald-600 dark:text-emerald-400"
    : "text-rose-600 dark:text-rose-400";

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section>
        <div className="text-sm font-medium text-zinc-500 mb-1">
          Portfolio value
        </div>
        <div className="flex items-baseline gap-3 flex-wrap">
          <span className={`text-4xl sm:text-5xl font-semibold tracking-tight tabular-nums ${heroColor}`}>
            {fmtUSD(summary.portfolio_value)}
          </span>
          {sincePct != null && (
            <span className={`text-lg font-medium tabular-nums ${heroColor}`}>
              {positive ? "+" : ""}
              {fmtPct(sincePct)}
            </span>
          )}
        </div>
        <div className="mt-4">
          <div className="text-sm font-medium text-zinc-500">Cash</div>
          <div className="text-2xl font-medium tabular-nums text-zinc-900 dark:text-zinc-50">
            {fmtUSD(summary.cash)}
          </div>
        </div>
      </section>

      {/* Benchmark comparison since first trade */}
      {inceptionDate && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-zinc-500">
            Since {fmtDate(inceptionDate)}
          </h2>
          <ComparisonCards series={sinceSeries} />
        </section>
      )}

      {/* Performance chart */}
      {inceptionDate && sinceSeries.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">Performance</h2>
          <p className="text-sm text-zinc-500">Since {fmtDate(inceptionDate)}</p>
          <FilteredChart series={sinceSeries} />
        </section>
      )}

      {/* Positions treemap */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">Positions</h2>
        {positions.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 p-8 text-center text-zinc-500">
            No open positions.
          </div>
        ) : (
          <>
            <p className="text-sm text-zinc-500">
              Tile size = position value. Color = unrealized P/L %.
            </p>
            <PositionsTreemap positions={positions} />
            <div className="flex items-center gap-3 text-xs text-zinc-500">
              <span>≤ -10%</span>
              <span
                className="inline-block h-3 w-48 rounded-sm"
                style={{
                  background:
                    "linear-gradient(to right, rgb(196,50,50), rgb(243,165,165), rgb(140,140,140), rgb(170,207,105), rgb(80,138,35))",
                }}
              />
              <span>≥ +10%</span>
            </div>
          </>
        )}
      </section>

      {/* Activity */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">Activity</h2>
        {activity.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 p-8 text-center text-zinc-500">
            No trades yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-900 text-left">
                <tr>
                  <th className="px-4 py-2 font-medium">When</th>
                  <th className="px-4 py-2 font-medium">Symbol</th>
                  <th className="px-4 py-2 font-medium">Side</th>
                  <th className="px-4 py-2 font-medium text-right">Qty</th>
                  <th className="px-4 py-2 font-medium text-right">Price</th>
                  <th className="px-4 py-2 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {activity.map((a) => (
                  <tr
                    key={a.id}
                    className="border-t border-zinc-200 dark:border-zinc-800"
                  >
                    <td className="px-4 py-2">{fmtDateTime(a.filled_at)}</td>
                    <td className="px-4 py-2 font-medium">{a.symbol}</td>
                    <td
                      className={`px-4 py-2 uppercase text-xs font-semibold ${
                        a.side === "buy"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {a.side}
                    </td>
                    <td className="px-4 py-2 text-right">{a.qty}</td>
                    <td className="px-4 py-2 text-right">{fmtUSD(a.price)}</td>
                    <td className="px-4 py-2 text-right">
                      {fmtUSD(a.qty * a.price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Footer */}
      <section className="border-t border-zinc-200 dark:border-zinc-800 pt-4 text-sm text-zinc-500 text-right">
        Updated {fmtDateTime(summary.updated_at)}
      </section>
    </div>
  );
}
