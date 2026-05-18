"use client";

import { fmtPct } from "@/lib/format";
import type { PerformanceSeries } from "@/lib/types";
import { AnimatedNumber } from "./AnimatedNumber";
import { useIntro } from "./Intro";

// Diverging-bar leaderboard for benchmark performance since inception.
// Each row: label/symbol on the left, a horizontal bar that grows
// right (gain) or left (loss) from a center axis, and the pct on the
// right. Bars are sized relative to the largest absolute pct in the
// set so the visual ranking is honest regardless of overall magnitude.
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

  const rows = benchmarks
    .map((b) => ({ label: b.label, symbol: b.symbol, pct: pctChange(b) }))
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
  isLast,
}: {
  label: string;
  symbol: string;
  pct: number;
  maxAbs: number;
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
  // Bar width as a fraction of the half-track. Target width is set
  // once revealed so the bar transitions from 0 to its real size,
  // matching the rest of the page's reveal beat.
  const widthPct = revealed ? (Math.abs(pct) / maxAbs) * 100 : 0;

  return (
    <div
      className={`grid grid-cols-[5rem_1fr_5rem] items-center gap-3 py-2 ${
        isLast ? "" : "border-b border-zinc-100 dark:border-zinc-900"
      }`}
    >
      <div className="flex items-baseline gap-1.5 min-w-0">
        <span className="font-mono text-sm font-semibold truncate">
          {symbol}
        </span>
        <span className="text-[10px] uppercase tracking-wide text-zinc-500 truncate">
          {label}
        </span>
      </div>
      <div className="relative h-2">
        <span className="absolute left-1/2 top-0 bottom-0 w-px bg-zinc-300 dark:bg-zinc-700" />
        <span
          className={`absolute top-0 bottom-0 rounded-sm transition-[width] duration-1000 ease-out ${
            positive
              ? "left-1/2 bg-emerald-500/70 dark:bg-emerald-400/70"
              : "right-1/2 bg-rose-500/70 dark:bg-rose-400/70"
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
