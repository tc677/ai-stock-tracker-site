"use client";

import { fmtPct } from "@/lib/format";
import type { PerformanceSeries } from "@/lib/types";
import { AnimatedNumber } from "./AnimatedNumber";
import { useIntro } from "./Intro";

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

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
}: {
  label: string;
  symbol: string;
  pct: number;
}) {
  const { phase } = useIntro();
  const revealed = phase === "plop" || phase === "done";
  const positive = pct >= 0;
  const finalColor = positive
    ? "text-emerald-600 dark:text-emerald-400"
    : "text-rose-600 dark:text-rose-400";
  const color = revealed
    ? finalColor
    : "text-zinc-400 dark:text-zinc-500";

  return (
    <div className="rounded-md border p-2.5 border-zinc-200 dark:border-zinc-800">
      <div className="text-[11px] uppercase tracking-wide text-zinc-500 truncate">
        {label}
      </div>
      <AnimatedNumber
        value={pct}
        format={(n) => `${n >= 0 ? "+" : ""}${fmtPct(n)}`}
        className={`mt-1 block text-base font-semibold tabular-nums transition-colors duration-1000 ${color}`}
      />
      {symbol && (
        <div className="mt-0.5 text-[11px] text-zinc-500 tabular-nums">
          {symbol}
        </div>
      )}
    </div>
  );
}
