"use client";

import { useId } from "react";
import { LayoutGroup, motion } from "framer-motion";
import { fmtPct } from "@/lib/format";
import type { PerformancePoint, PerformanceSeries } from "@/lib/types";
import { AnimatedNumber } from "./AnimatedNumber";
import { useIntro } from "./Intro";

const DAY_MS = 24 * 60 * 60 * 1000;

// Tabular leaderboard. Columns: rank, name, current price/value,
// trailing 24h / 7d / 14d change, ROI since inception (the ranking
// metric), and a 14-day sparkline. The portfolio row is included
// alongside the benchmarks and visually emphasized. Ranking is by ROI
// descending. All figures derive from each series' daily point list.
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
    .map((s) => {
      const last = s.points[s.points.length - 1];
      const lastMs = last ? new Date(last.t).getTime() : 0;
      return {
        label: s.label,
        symbol: s.symbol,
        d1: pctOverDays(s, 1),
        d7: pctOverDays(s, 7),
        d14: pctOverDays(s, 14),
        d30: pctOverDays(s, 30),
        roi: roiPct(s),
        spark: s.points.filter(
          (p) => new Date(p.t).getTime() >= lastMs - 14 * DAY_MS,
        ),
        isPortfolio: s.symbol === "PORTFOLIO",
      };
    })
    // Ranking metric is ROI (total return since inception).
    .sort((a, b) => b.roi - a.roi);

  // Min content width keeps the columns from collapsing on narrow
  // viewports; the container scrolls horizontally instead.
  return (
    <div className="overflow-x-auto">
      <LayoutGroup>
        <div className="flex flex-col min-w-[44rem]">
          <HeaderRow />
          {rows.map((r, i) => (
            <Row
              key={r.symbol}
              rank={i + 1}
              label={r.label}
              symbol={r.symbol}
              d1={r.d1}
              d7={r.d7}
              d14={r.d14}
              d30={r.d30}
              roi={r.roi}
              spark={r.spark}
              isPortfolio={r.isPortfolio}
              isLast={i === rows.length - 1}
            />
          ))}
        </div>
      </LayoutGroup>
    </div>
  );
}

// Shared grid template so the header labels line up with the cells.
const GRID =
  "grid grid-cols-[2.5rem_minmax(7rem,2fr)_1fr_1fr_1fr_1fr_1fr_minmax(6rem,1.2fr)] items-center gap-4";

function HeaderRow() {
  return (
    <div
      className={`${GRID} px-3 pb-2 text-[10px] uppercase tracking-wide font-semibold text-zinc-500 dark:text-zinc-500 border-b border-zinc-200 dark:border-zinc-800`}
    >
      <div />
      <div>Name</div>
      <div className="text-right">24H</div>
      <div className="text-right">7D</div>
      <div className="text-right">14D</div>
      <div className="text-right">30D</div>
      <div className="text-right">ROI</div>
      <div className="text-right">14D Graph</div>
    </div>
  );
}

function roiPct(s: PerformanceSeries): number {
  const first = Number(s.points[0]?.value ?? 0);
  const last = Number(s.points[s.points.length - 1]?.value ?? 0);
  return first ? ((last - first) / first) * 100 : 0;
}

// Trailing % change over `days` calendar days: latest value vs the most
// recent daily point on or before (latest date - days). Returns null
// when there isn't enough history to look back that far.
function pctOverDays(s: PerformanceSeries, days: number): number | null {
  const pts = s.points;
  if (pts.length < 2) return null;
  const last = pts[pts.length - 1];
  const target = new Date(last.t).getTime() - days * DAY_MS;
  let ref: PerformancePoint | null = null;
  for (let i = pts.length - 2; i >= 0; i--) {
    if (new Date(pts[i].t).getTime() <= target) {
      ref = pts[i];
      break;
    }
  }
  if (!ref) return null;
  const base = Number(ref.value);
  if (!base) return null;
  return ((Number(last.value) - base) / base) * 100;
}

function Row({
  rank,
  label,
  symbol,
  d1,
  d7,
  d14,
  d30,
  roi,
  spark,
  isPortfolio,
  isLast,
}: {
  rank: number;
  label: string;
  symbol: string;
  d1: number | null;
  d7: number | null;
  d14: number | null;
  d30: number | null;
  roi: number;
  spark: PerformancePoint[];
  isPortfolio: boolean;
  isLast: boolean;
}) {
  const { phase } = useIntro();
  const revealed = phase === "plop" || phase === "done";
  const sparkColor = roi >= 0 ? "#3fb950" : "#f85149";

  return (
    <motion.div
      layout
      transition={{ type: "spring", stiffness: 320, damping: 32 }}
      className={`${GRID} px-3 py-3 transition-colors ${
        isPortfolio
          ? "bg-zinc-50 dark:bg-zinc-900/40 rounded-md hover:bg-zinc-100/80 dark:hover:bg-zinc-900/60"
          : "hover:bg-zinc-50/70 dark:hover:bg-zinc-900/30"
      } ${isLast ? "" : "border-b border-zinc-100 dark:border-zinc-900"}`}
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
            <div className="text-[10px] uppercase tracking-wide text-zinc-500 leading-tight truncate">
              {label}
            </div>
          </>
        )}
      </div>
      <PctCell value={d1} revealed={revealed} />
      <PctCell value={d7} revealed={revealed} />
      <PctCell value={d14} revealed={revealed} />
      <PctCell value={d30} revealed={revealed} />
      <PctCell value={roi} revealed={revealed} bold />
      <div className="flex justify-end">
        <Sparkline points={spark} color={sparkColor} revealed={revealed} />
      </div>
    </motion.div>
  );
}

function PctCell({
  value,
  revealed,
  bold,
}: {
  value: number | null;
  revealed: boolean;
  bold?: boolean;
}) {
  if (value == null) {
    return (
      <div className="text-right font-mono text-sm tabular-nums text-zinc-400 dark:text-zinc-600">
        —
      </div>
    );
  }
  const positive = value >= 0;
  const color = revealed
    ? positive
      ? "text-emerald-600 dark:text-emerald-400"
      : "text-rose-600 dark:text-rose-400"
    : "text-zinc-400 dark:text-zinc-500";
  return (
    <AnimatedNumber
      value={value}
      format={(n) => `${n >= 0 ? "+" : ""}${fmtPct(n)}`}
      className={`text-right font-mono text-sm tabular-nums transition-colors duration-1000 ${
        bold ? "font-semibold" : ""
      } ${color}`}
    />
  );
}

// Tiny inline sparkline. Renders the series as a polyline normalized to
// its own min/max so even small absolute moves show shape, with a
// gradient area fill underneath (matching the "Today" chart). Fades in
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
  // useId gives each sparkline's gradient a unique, stable id so
  // url(#id) references don't collide across rows.
  const gradId = useId();
  if (points.length < 2) {
    return <div className="h-6 w-24" />;
  }
  const values = points.map((p) => Number(p.value));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 96;
  const h = 24;
  const pad = 1.5;
  const stepX = (w - pad * 2) / (points.length - 1);
  const coords = values.map((v, i) => ({
    x: pad + i * stepX,
    y: pad + (1 - (v - min) / range) * (h - pad * 2),
  }));
  const linePath = coords
    .map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(2)} ${c.y.toFixed(2)}`)
    .join(" ");
  const areaPath =
    `${linePath} L ${coords[coords.length - 1].x.toFixed(2)} ${h - pad} ` +
    `L ${coords[0].x.toFixed(2)} ${h - pad} Z`;

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className={`transition-opacity duration-1000 ${revealed ? "opacity-100" : "opacity-0"}`}
      aria-hidden
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} stroke="none" />
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
