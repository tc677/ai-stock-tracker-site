import { fmtPct } from "@/lib/format";
import type { PerformanceSeries } from "@/lib/types";

// Renders one card per series showing % change from first to last point,
// plus a "diff vs portfolio" indicator when the series isn't the portfolio.
// Color is based on whether YOU beat that benchmark in this window.
export function ComparisonCards({
  series,
  title,
  subtitle,
}: {
  series: PerformanceSeries[];
  title: string;
  subtitle?: string;
}) {
  const portfolio = series.find((s) => s.symbol === "PORTFOLIO");
  const benchmarks = series.filter((s) => s.symbol !== "PORTFOLIO");
  if (!portfolio || portfolio.points.length < 2) {
    return null;
  }

  const portfolioPct = pctChange(portfolio);

  return (
    <section>
      {title && (
        <h2 className="text-sm font-medium text-zinc-500 mb-1">{title}</h2>
      )}
      {subtitle && <p className="text-xs text-zinc-500 mb-3">{subtitle}</p>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card label="Portfolio" pct={portfolioPct} symbol="" emphasis />
        {benchmarks.map((b) => {
          const benchPct = pctChange(b);
          const delta = portfolioPct - benchPct;
          return (
            <Card
              key={b.symbol}
              label={b.label}
              symbol={b.symbol}
              pct={benchPct}
              delta={delta}
            />
          );
        })}
      </div>
    </section>
  );
}

function pctChange(s: PerformanceSeries): number {
  const first = Number(s.points[0]?.value ?? 0);
  const last = Number(s.points[s.points.length - 1]?.value ?? 0);
  return first ? ((last - first) / first) * 100 : 0;
}

function Card({
  label,
  symbol,
  pct,
  delta,
  emphasis,
}: {
  label: string;
  symbol: string;
  pct: number;
  delta?: number;
  emphasis?: boolean;
}) {
  const positive = pct >= 0;
  const color = positive
    ? "text-emerald-600 dark:text-emerald-400"
    : "text-rose-600 dark:text-rose-400";

  const deltaPositive = (delta ?? 0) >= 0;
  const deltaColor = deltaPositive
    ? "text-emerald-600 dark:text-emerald-400"
    : "text-rose-600 dark:text-rose-400";

  return (
    <div
      className={`rounded-lg border p-4 ${
        emphasis
          ? "border-zinc-300 dark:border-zinc-600 bg-zinc-50/50 dark:bg-zinc-900/40"
          : "border-zinc-200 dark:border-zinc-800"
      }`}
    >
      <div className="text-xs uppercase tracking-wide text-zinc-500 truncate">
        {label}
      </div>
      <div className={`mt-2 text-xl font-semibold tabular-nums ${color}`}>
        {positive ? "+" : ""}
        {fmtPct(pct)}
      </div>
      {symbol && (
        <div className="mt-1 text-xs text-zinc-500 tabular-nums">{symbol}</div>
      )}
      {delta != null && (
        <div className={`mt-1 text-xs tabular-nums ${deltaColor}`}>
          {deltaPositive ? "+" : ""}
          {fmtPct(delta)} vs you
        </div>
      )}
    </div>
  );
}
