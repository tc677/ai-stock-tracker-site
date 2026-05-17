import { ComparisonCards } from "@/components/ComparisonCards";
import {
  getInceptionDate,
  getPerformanceSeriesSince,
  getSummary,
} from "@/lib/queries";
import { fmtDate, fmtDateTime, fmtPct, fmtUSD } from "@/lib/format";

export const revalidate = 10;

export default async function Home() {
  const [summary, inceptionDate] = await Promise.all([
    getSummary().catch(() => null),
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

  const portfolioSince = sinceSeries.find((s) => s.symbol === "PORTFOLIO");
  const sincePct = (() => {
    if (!portfolioSince || portfolioSince.points.length < 2) return null;
    const first = Number(portfolioSince.points[0].value);
    const last = Number(portfolioSince.points[portfolioSince.points.length - 1].value);
    return first ? ((last - first) / first) * 100 : 0;
  })();

  const positive = sincePct == null ? true : sincePct >= 0;
  const heroColor = positive
    ? "text-emerald-600 dark:text-emerald-400"
    : "text-rose-600 dark:text-rose-400";

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section>
        <div className="text-sm font-medium text-zinc-500 mb-1">
          Portfolio value
        </div>
        <div className="flex items-baseline gap-3 flex-wrap">
          <span className={`text-4xl sm:text-5xl font-semibold tracking-tight tabular-nums ${heroColor}`}>
            {fmtUSD(summary.portfolio_value)}
          </span>
          {sincePct != null && inceptionDate && (
            <span className={`text-lg font-medium tabular-nums ${heroColor}`}>
              {positive ? "+" : ""}
              {fmtPct(sincePct)}
              <span className="text-sm font-normal text-zinc-500 ml-1">
                since {fmtDate(inceptionDate)}
              </span>
            </span>
          )}
        </div>
        <div className="mt-3 text-2xl font-medium tabular-nums text-zinc-900 dark:text-zinc-50">
          <span className="text-sm font-normal text-zinc-500 mr-2">Cash</span>
          {fmtUSD(summary.cash)}
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

      {/* Footer */}
      <section className="border-t border-zinc-200 dark:border-zinc-800 pt-4 text-sm text-zinc-500 text-right">
        Updated {fmtDateTime(summary.updated_at)}
      </section>
    </div>
  );
}
