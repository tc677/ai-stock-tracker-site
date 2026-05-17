import { fmtPct } from "@/lib/format";
import type { PerformanceSeries } from "@/lib/types";

export function ComparisonCards({
  series,
}: {
  series: PerformanceSeries[];
}) {
  const portfolio = series.find((s) => s.symbol === "PORTFOLIO");
  const benchmarks = series.filter((s) => s.symbol !== "PORTFOLIO");
  if (!portfolio || portfolio.points.length < 2) {
    return null;
  }

  const portfolioPct = pctChange(portfolio);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card label="Portfolio" pct={portfolioPct} symbol="" emphasis />
      {benchmarks.map((b) => (
        <Card key={b.symbol} label={b.label} symbol={b.symbol} pct={pctChange(b)} />
      ))}
    </div>
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
  emphasis,
}: {
  label: string;
  symbol: string;
  pct: number;
  emphasis?: boolean;
}) {
  const positive = pct >= 0;
  const color = positive
    ? "text-emerald-600 dark:text-emerald-400"
    : "text-rose-600 dark:text-rose-400";

  return (
    <div
      className={`rounded-md border p-2.5 ${
        emphasis
          ? "border-zinc-300 dark:border-zinc-600 bg-zinc-50/50 dark:bg-zinc-900/40"
          : "border-zinc-200 dark:border-zinc-800"
      }`}
    >
      <div className="text-[11px] uppercase tracking-wide text-zinc-500 truncate">
        {label}
      </div>
      <div className={`mt-1 text-base font-semibold tabular-nums ${color}`}>
        {positive ? "+" : ""}
        {fmtPct(pct)}
      </div>
      {symbol && (
        <div className="mt-0.5 text-[11px] text-zinc-500 tabular-nums">
          {symbol}
        </div>
      )}
    </div>
  );
}
