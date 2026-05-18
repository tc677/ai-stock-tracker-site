"use client";

import { fmtPct } from "@/lib/format";
import type { PerformancePoint, PerformanceSeries } from "@/lib/types";
import { AnimatedNumber } from "./AnimatedNumber";
import { useIntro } from "./Intro";

// Diverging-bar leaderboard for performance since inception. The
// portfolio row is included alongside the benchmarks and visually
// emphasized so you can read its rank at a glance. Each row carries
// a sparkline of its full series so the whole leaderboard fills its
// allotted horizontal space with useful signal.
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
      points: s.points,
      isPortfolio: s.symbol === "PORTFOLIO",
    }))
    .sort((a, b) => b.pct - a.pct);
  const maxAbs = Math.max(0.01, ...rows.map((r) => Math.abs(r.pct)));

  return (
    <div className="flex flex-col">
      {rows.map((r, i) => (
        <Row
          key={r.symbol}
          rank={i + 1}
          label={r.label}
          symbol={r.symbol}
          pct={r.pct}
          points={r.points}
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
  rank,
  label,
  symbol,
  pct,
  points,
  maxAbs,
  isPortfolio,
  isLast,
}: {
  rank: number;
  label: string;
  symbol: string;
  pct: number;
  points: PerformancePoint[];
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
  const sparkColor = positive ? "#10b981" : "#ef4444";

  return (
    <div
      className={`grid grid-cols-[2rem_8rem_1fr_6rem_5rem] items-center gap-3 px-3 py-3 ${
        isPortfolio ? "bg-zinc-50 dark:bg-zinc-900/40 rounded-md" : ""
      } ${
        isLast ? "" : "border-b border-zinc-100 dark:border-zinc-900"
      }`}
    >
      <div className="font-mono text-xs text-zinc-400 dark:text-zinc-600 tabular-nums">
        #{rank}
      </div>
      <div className="min-w-0">
        {isPortfolio ? (
          <>
            <div className="font-mono text-sm font-semibold">Portfolio</div>
            <div className="text-[10px] uppercase tracking-wide text-zinc-500 leading-tight">
              AI managed
            </div>
          </>
        ) : (
          <>
            <div className="font-mono text-sm font-semibold">{symbol}</div>
            <div className="text-[10px] uppercase tracking-wide text-zinc-500 leading-tight">
              {label}
            </div>
          </>
        )}
      </div>
      <div className="relative h-3">
        <span className="absolute left-1/2 top-0 bottom-0 w-px bg-zinc-300 dark:bg-zinc-700" />
        <span
          className={`absolute top-0 bottom-0 rounded-sm transition-[width] duration-1000 ease-out ${barColor} ${
            positive ? "left-1/2" : "right-1/2"
          }`}
          style={{ width: `${widthPct / 2}%` }}
        />
      </div>
      <Sparkline points={points} color={sparkColor} revealed={revealed} />
      <AnimatedNumber
        value={pct}
        format={(n) => `${n >= 0 ? "+" : ""}${fmtPct(n)}`}
        className={`text-right font-mono text-sm font-semibold tabular-nums transition-colors duration-1000 ${valueColor}`}
      />
    </div>
  );
}

// Tiny inline sparkline. Renders the series as a polyline normalized to
// its own min/max so even small absolute moves show shape. Fades in
// alongside the rest of the row on intro reveal.
function Sparkline({
  points,
  color,
  revealed,
}: {
  points: PerformancePoint[];
  color: string;
  revealed: boolean;
}) {
  if (points.length < 2) {
    return <div className="h-6" />;
  }
  const values = points.map((p) => Number(p.value));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 96;
  const h = 24;
  const pad = 1.5;
  const stepX = (w - pad * 2) / (points.length - 1);
  const path = values
    .map((v, i) => {
      const x = pad + i * stepX;
      const y = pad + (1 - (v - min) / range) * (h - pad * 2);
      return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className={`transition-opacity duration-1000 ${revealed ? "opacity-100" : "opacity-0"}`}
      aria-hidden
    >
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
