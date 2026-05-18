"use client";

import { fmtPct } from "@/lib/format";
import type { PerformanceSeries } from "@/lib/types";
import { AnimatedNumber } from "./AnimatedNumber";
import { useIntro } from "./Intro";

// Diverging-bar leaderboard for performance since inception. The
// portfolio row is included alongside the benchmarks and visually
// emphasized so you can read its rank at a glance.
export function ComparisonCards({
  series,
}: {
  series: PerformanceSeries[];
}) {
  const portfolio = series.find((s) => s.symbol === "PORTFOLIO");
  if (!portfolio || portfolio.points.length < 2) {
    return null;
  }

  const rows = series
    .map((s) => ({
      label: s.label,
      symbol: s.symbol,
      pct: pctChange(s),
      isPortfolio: s.symbol === "PORTFOLIO",
    }))
    .sort((a, b) => b.pct - a.pct);
  const maxAbs = Math.max(0.01, ...rows.map((r) => Math.abs(r.pct)));

  return (
    <div className="flex flex-col">
      {rows.map((r, i) => (
        <Row
          key={r.symbol}
          label={r.label}
          symbol={r.symbol}
          pct={r.pct}
          maxAbs={maxAbs}
          isPortfolio={r.isPortfolio}
          isLast={i === rows.length - 1}
        />
      ))}
    </div>
  );
}

function pctChange(s: PerformanceSeries): number {
  const first = Number(s.points[0]?.value ?? 0);
  const last = Number(s.points[s.points.length - 1]?.value ?? 0);
  return first ? ((last - first) / first) * 100 : 0;
}

function Row({
  label,
  symbol,
  pct,
  maxAbs,
  isPortfolio,
  isLast,
}: {
  label: string;
  symbol: string;
  pct: number;
  maxAbs: number;
  isPortfolio: boolean;
  isLast: boolean;
}) {
  const { phase } = useIntro();
  const revealed = phase === "plop" || phase === "done";
  const positive = pct >= 0;
  const valueColor = revealed
    ? positive
      ? "text-emerald-600 dark:text-emerald-400"
      : "text-rose-600 dark:text-rose-400"
    : "text-zinc-400 dark:text-zinc-500";
  const widthPct = revealed ? (Math.abs(pct) / maxAbs) * 100 : 0;

  // The portfolio bar gets full opacity + a touch of row bg so it
  // reads as the protagonist among the benchmark comparison set.
  const barColor = positive
    ? isPortfolio
      ? "bg-emerald-500 dark:bg-emerald-400"
      : "bg-emerald-500/60 dark:bg-emerald-400/60"
    : isPortfolio
      ? "bg-rose-500 dark:bg-rose-400"
      : "bg-rose-500/60 dark:bg-rose-400/60";

  return (
    <div
      className={`grid grid-cols-[8rem_1fr_5rem] items-center gap-3 px-2 py-2 ${
        isPortfolio
          ? "bg-zinc-50 dark:bg-zinc-900/40 rounded-sm"
          : ""
      } ${
        isLast ? "" : "border-b border-zinc-100 dark:border-zinc-900"
      }`}
    >
      <div className="min-w-0">
        {isPortfolio ? (
          <div className="font-mono text-sm font-semibold">Portfolio</div>
        ) : (
          <>
            <div className="font-mono text-sm font-semibold">{symbol}</div>
            <div className="text-[10px] uppercase tracking-wide text-zinc-500 leading-tight">
              {label}
            </div>
          </>
        )}
      </div>
      <div className="relative h-2">
        <span className="absolute left-1/2 top-0 bottom-0 w-px bg-zinc-300 dark:bg-zinc-700" />
        <span
          className={`absolute top-0 bottom-0 rounded-sm transition-[width] duration-1000 ease-out ${barColor} ${
            positive ? "left-1/2" : "right-1/2"
          }`}
          style={{ width: `${widthPct / 2}%` }}
        />
      </div>
      <AnimatedNumber
        value={pct}
        format={(n) => `${n >= 0 ? "+" : ""}${fmtPct(n)}`}
        className={`text-right font-mono text-sm font-semibold tabular-nums transition-colors duration-1000 ${valueColor}`}
      />
    </div>
  );
}
