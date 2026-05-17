import { ComparisonSection } from "@/components/ComparisonSection";
import {
  getInceptionDate,
  getPerformanceSeries,
  getPerformanceSeriesSince,
  getSummary,
} from "@/lib/queries";
import { fmtDate, fmtDateTime, fmtPct, fmtUSD } from "@/lib/format";

export const revalidate = 10;

export default async function Home() {
  const [summary, ytdSeries, inceptionDate] = await Promise.all([
    getSummary().catch(() => null),
    getPerformanceSeries("YTD").catch(() => []),
    getInceptionDate().catch(() => null),
  ]);

  const sinceSeries = inceptionDate
    ? await getPerformanceSeriesSince(inceptionDate).catch(() => [])
    : [];

  if (!summary) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight">Overview</h1>
        <div className="rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 p-12 text-center text-zinc-500">
          No data yet. The puller will populate this once it runs.
        </div>
      </div>
    );
  }

  const ytdPositive = summary.ytd_return_pct >= 0;
  const ytdColor = ytdPositive
    ? "text-emerald-600 dark:text-emerald-400"
    : "text-rose-600 dark:text-rose-400";

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section>
        <div className="text-sm font-medium text-zinc-500 mb-1">
          Portfolio value
        </div>
        <div className="text-4xl sm:text-5xl font-semibold tracking-tight tabular-nums">
          {fmtUSD(summary.portfolio_value)}
        </div>
        <div className={`mt-2 text-xl font-medium tabular-nums ${ytdColor}`}>
          {ytdPositive ? "+" : ""}
          {fmtUSD(summary.ytd_return_dollar)} ({fmtPct(summary.ytd_return_pct)})
          <span className="text-sm font-normal text-zinc-500 ml-2">
            year to date
          </span>
        </div>
      </section>

      <ComparisonSection
        ytdSeries={ytdSeries}
        sinceSeries={sinceSeries}
        sinceLabel={inceptionDate ? fmtDate(inceptionDate) : "first trade"}
      />

      {/* Cash + last updated */}
      <section className="flex items-center justify-between border-t border-zinc-200 dark:border-zinc-800 pt-4 text-sm text-zinc-500">
        <span>Cash: {fmtUSD(summary.cash)}</span>
        <span>Updated {fmtDateTime(summary.updated_at)}</span>
      </section>
    </div>
  );
}
