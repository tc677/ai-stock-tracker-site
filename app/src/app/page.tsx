import { ComparisonCards } from "@/components/ComparisonCards";
import { FilteredChart } from "@/components/FilteredChart";
import { HeroNumbers } from "@/components/HeroNumbers";
import { PositionsTreemap } from "@/components/PositionsTreemap";
import { FooterTimestamp } from "@/components/FooterTimestamp";
import {
  getActivity,
  getInceptionDate,
  getPerformanceSeriesSince,
  getPositions,
  getSummary,
} from "@/lib/queries";
import { fmtDate, fmtDateTime, fmtUSD } from "@/lib/format";

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

  const heroBlock = (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold tracking-tight">Overview</h2>
      <div className="text-sm font-medium text-zinc-500 mb-1">
        Portfolio value
      </div>
      <HeroNumbers
        portfolioValue={Number(summary.portfolio_value)}
        cash={Number(summary.cash)}
        sincePct={sincePct}
      />
      {inceptionDate && (
        <div className="mt-6 space-y-3">
          <h2 className="text-sm font-medium text-zinc-500">
            Since {fmtDate(inceptionDate)}
          </h2>
          <ComparisonCards series={sinceSeries} />
        </div>
      )}
    </section>
  );

  const performanceBlock = inceptionDate && sinceSeries.length > 0 && (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold tracking-tight">Performance</h2>
      <p className="text-sm text-zinc-500">Since {fmtDate(inceptionDate)}</p>
      <FilteredChart series={sinceSeries} />
    </section>
  );

  const positionsBlock = (
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
          <PositionsTreemap positions={positions} cash={Number(summary.cash)} />
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span>≤ -10%</span>
            <span
              className="inline-block h-3 w-32 sm:w-48 rounded-sm"
              style={{
                background:
                  "linear-gradient(to right, rgb(185,28,28), rgb(248,113,113), rgb(82,82,91), rgb(74,222,128), rgb(21,128,61))",
              }}
            />
            <span>≥ +10%</span>
          </div>
        </>
      )}
    </section>
  );

  const activityBlock = (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold tracking-tight">Activity</h2>
      {activity.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 p-8 text-center text-zinc-500">
          No trades yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-[0.12em] text-zinc-500 border-b border-zinc-200 dark:border-zinc-800">
                <th className="px-4 py-2 font-medium">When</th>
                <th className="px-4 py-2 font-medium">Symbol</th>
                <th className="px-4 py-2 font-medium">Side</th>
                <th className="px-4 py-2 font-medium text-right">Qty</th>
                <th className="px-4 py-2 font-medium text-right">Price</th>
                <th className="px-4 py-2 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
              {activity.map((a) => (
                <tr
                  key={a.id}
                  className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                >
                  <td className="px-4 py-2 text-zinc-500 tabular-nums">
                    {fmtDateTime(a.filled_at)}
                  </td>
                  <td className="px-4 py-2 font-semibold tracking-tight">
                    {a.symbol}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ${
                        a.side === "buy"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
                          : "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400"
                      }`}
                    >
                      {a.side}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums text-zinc-600 dark:text-zinc-400">
                    {a.qty}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums text-zinc-600 dark:text-zinc-400">
                    {fmtUSD(a.price)}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums font-medium">
                    {fmtUSD(a.qty * a.price)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );

  return (
    <div className="space-y-12">
      <FooterTimestamp>Updated {fmtDateTime(summary.updated_at)}.</FooterTimestamp>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-12 sm:gap-y-16 lg:gap-x-24 lg:gap-y-24">
        {heroBlock}
        {performanceBlock}
        {positionsBlock}
        {activityBlock}
      </div>

    </div>
  );
}
