"use client";

import { LayoutGroup, motion } from "framer-motion";
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

  const portfolioPct = pctChange(portfolio);
  const rows = series
    .map((s) => {
      const absolute = pctChange(s);
      return {
        label: s.label,
        symbol: s.symbol,
        // absolute return is still used for sorting + true ranking
        pct: absolute,
        // gap vs portfolio is what the bar + label visualize
        gap: absolute - portfolioPct,
        points: s.points,
        isPortfolio: s.symbol === "PORTFOLIO",
      };
    })
    .sort((a, b) => b.pct - a.pct);
  const maxAbs = Math.max(0.01, ...rows.map((r) => Math.abs(r.gap)));

  // Wrap in an x-scroll container with a minimum content width so the
  // grid columns (rank/label/bar/sparkline/pct) keep their natural
  // sizing on narrow viewports and the user can scroll horizontally
  // instead of seeing the bars collapse to zero.
  return (
    <div className="overflow-x-auto">
      <LayoutGroup>
        <div className="flex flex-col min-w-[36rem]">
          {rows.map((r, i) => (
            <Row
              key={r.symbol}
              rank={i + 1}
              label={r.label}
              symbol={r.symbol}
              pct={r.pct}
              gap={r.gap}
              points={r.points}
              maxAbs={maxAbs}
              isPortfolio={r.isPortfolio}
              isLast={i === rows.length - 1}
            />
          ))}
        </div>
      </LayoutGroup>
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
  gap,
  points,
  maxAbs,
  isPortfolio,
  isLast,
}: {
  rank: number;
  label: string;
  symbol: string;
  pct: number;
  // Gap vs portfolio (in pct points). Portfolio's own row has gap=0.
  // Bars + labels visualize gap; pct is kept only for the sparkline color.
  gap: number;
  points: PerformancePoint[];
  maxAbs: number;
  isPortfolio: boolean;
  isLast: boolean;
}) {
  const { phase } = useIntro();
  const revealed = phase === "plop" || phase === "done";
  // Visual sign is the gap (am I ahead/behind?). Portfolio row is neutral.
  const positive = isPortfolio ? null : gap >= 0;
  const valueColor = revealed
    ? positive == null
      ? "text-zinc-600 dark:text-zinc-300"
      : positive
        ? "text-emerald-600 dark:text-emerald-400"
        : "text-rose-600 dark:text-rose-400"
    : "text-zinc-400 dark:text-zinc-500";
  const widthPct = revealed ? (Math.abs(gap) / maxAbs) * 100 : 0;

  // Benchmark bar color reflects gap sign. Portfolio row has no bar
  // (gap is zero with itself) but we still set a fallback color.
  const barColor =
    positive == null
      ? "bg-zinc-400 dark:bg-zinc-600"
      : positive
        ? "bg-emerald-500/70 dark:bg-emerald-400/70"
        : "bg-rose-500/70 dark:bg-rose-400/70";
  // Sparkline color follows the benchmark's own absolute return so a
  // losing benchmark line still reads red regardless of the gap.
  const sparkColor = pct >= 0 ? "#3fb950" : "#f85149";

  return (
    <motion.div
      layout
      transition={{ type: "spring", stiffness: 320, damping: 32 }}
      className={`grid grid-cols-[2rem_8rem_1fr_6rem_7.5rem] items-center gap-3 px-3 py-3 transition-colors ${
        isPortfolio
          ? "bg-zinc-50 dark:bg-zinc-900/40 rounded-md hover:bg-zinc-100/80 dark:hover:bg-zinc-900/60"
          : "hover:bg-zinc-50/70 dark:hover:bg-zinc-900/30"
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
            <div
              className="text-[10px] uppercase tracking-wide leading-tight font-semibold"
              style={{ color: "var(--ai-accent)" }}
            >
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
        {positive != null && (
          <span
            className={`absolute top-0 bottom-0 rounded-sm transition-[width] duration-1000 ease-out ${barColor} ${
              positive ? "left-1/2" : "right-1/2"
            }`}
            style={{ width: `${widthPct / 2}%` }}
          />
        )}
      </div>
      <Sparkline points={points} color={sparkColor} revealed={revealed} />
      {isPortfolio ? (
        <div
          className={`text-right font-mono text-sm font-semibold tabular-nums ${valueColor}`}
        >
          baseline
        </div>
      ) : (
        <AnimatedNumber
          value={gap}
          format={(n) =>
            `${n >= 0 ? "+" : ""}${fmtPct(n)} vs port.`
          }
          className={`text-right font-mono text-sm font-semibold tabular-nums transition-colors duration-1000 ${valueColor}`}
        />
      )}
    </motion.div>
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
