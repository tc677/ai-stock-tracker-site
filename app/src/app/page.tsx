import { EquityChart } from "@/components/EquityChart";
import {
  getBenchmarks,
  getPerformanceSeries,
  getSummary,
} from "@/lib/queries";
import { fmtDateTime, fmtPct, fmtUSD } from "@/lib/format";

export const revalidate = 60;

export default async function Home() {
  const [summary, benchmarks, series] = await Promise.all([
    getSummary().catch(() => null),
    getBenchmarks().catch(() => []),
    getPerformanceSeries().catch(() => []),
  ]);

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
      {/* Hero: big YTD return + portfolio value */}
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

      {/* Chart */}
      <section>
        <EquityChart series={series} />
      </section>

      {/* Benchmark comparison */}
      {benchmarks.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-zinc-500 mb-3">
            vs. Benchmarks (YTD)
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {benchmarks.map((b) => {
              const diff = summary.ytd_return_pct - b.ytd_pct;
              const positive = diff >= 0;
              const color = positive
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400";
              return (
                <div
                  key={b.symbol}
                  className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4"
                >
                  <div className="text-xs uppercase tracking-wide text-zinc-500">
                    {b.label}
                  </div>
                  <div className={`mt-2 text-xl font-semibold tabular-nums ${color}`}>
                    {positive ? "+" : ""}
                    {fmtPct(diff)}
                  </div>
                  <div className="mt-1 text-xs text-zinc-500 tabular-nums">
                    {b.symbol}: {fmtPct(b.ytd_pct)}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Cash + small stats strip */}
      <section className="flex items-center justify-between border-t border-zinc-200 dark:border-zinc-800 pt-4 text-sm text-zinc-500">
        <span>Cash: {fmtUSD(summary.cash)}</span>
        <span>Updated {fmtDateTime(summary.updated_at)}</span>
      </section>
    </div>
  );
}
