"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PerformanceSeries } from "@/lib/types";
import { fmtDate, fmtPct } from "@/lib/format";
import { useIntro } from "./Intro";

const PORTFOLIO_COLOR = "#10b981"; // emerald-500
// Specific colors per known benchmark; fallback palette for anything else.
const BENCHMARK_COLOR_MAP: Record<string, string> = {
  SPY: "#ef4444",  // red - S&P 500
  QQQ: "#06b6d4",  // cyan/aqua - Nasdaq-100
  VTI: "#a855f7",  // purple - US Total Market
  VXUS: "#f59e0b", // amber - International ex-US
};
const FALLBACK_COLORS = ["#64748b", "#3b82f6", "#a855f7", "#f59e0b", "#ec4899"];

function colorFor(symbol: string, fallbackIndex: number): string {
  return BENCHMARK_COLOR_MAP[symbol] ?? FALLBACK_COLORS[fallbackIndex % FALLBACK_COLORS.length];
}

type Row = {
  t: string;
} & Record<string, number | string>;

export function EquityChart({ series }: { series: PerformanceSeries[] }) {
  const { phase } = useIntro();
  // Hold the line draws until the intro hands off to the visible page,
  // so Recharts' built-in animation runs while the user is actually
  // looking at the chart.
  const revealed = phase === "plop" || phase === "done";
  const enough = series.some((s) => s.points.length >= 2);

  if (!enough) {
    return (
      <div className="h-80 sm:h-[28rem] flex items-center justify-center rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-500 text-sm">
        Not enough history yet.
      </div>
    );
  }

  // Normalize each series to % return from its first point in this window.
  // Coerce values to numbers - pg returns NUMERIC as strings.
  const allTs = Array.from(
    new Set(series.flatMap((s) => s.points.map((p) => p.t))),
  ).sort();
  const baselines = new Map(
    series.map((s) => [s.symbol, Number(s.points[0]?.value ?? 0)]),
  );
  const pointBySymbolTs = new Map<string, number>();
  for (const s of series) {
    for (const p of s.points) {
      pointBySymbolTs.set(`${s.symbol}|${p.t}`, Number(p.value));
    }
  }

  const data: Row[] = allTs.map((t) => {
    const row: Row = { t };
    for (const s of series) {
      const base = baselines.get(s.symbol);
      const v = pointBySymbolTs.get(`${s.symbol}|${t}`);
      if (base != null && base > 0 && v != null && !isNaN(v)) {
        row[s.symbol] = ((v - base) / base) * 100;
      }
    }
    return row;
  });

  const portfolio = series.find((s) => s.symbol === "PORTFOLIO");
  const benchmarks = series.filter((s) => s.symbol !== "PORTFOLIO");

  return (
    <div>
      <div className="h-80 sm:h-[28rem]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="2 4"
              stroke="currentColor"
              className="text-zinc-200 dark:text-zinc-800"
              vertical={false}
            />
            <XAxis
              dataKey="t"
              tickFormatter={(t) => fmtDate(t)}
              stroke="currentColor"
              className="text-zinc-500"
              tick={{ fontSize: 11 }}
              minTickGap={32}
            />
            <YAxis
              tickFormatter={(v) => `${v.toFixed(0)}%`}
              stroke="currentColor"
              className="text-zinc-500"
              tick={{ fontSize: 11 }}
              width={48}
            />
            <Tooltip
              labelFormatter={(t) => fmtDate(t as string)}
              formatter={(value, name) => {
                const label =
                  name === "PORTFOLIO"
                    ? "Portfolio"
                    : series.find((s) => s.symbol === name)?.label ?? String(name);
                return [fmtPct(Number(value)), label];
              }}
              contentStyle={{
                background: "rgb(24 24 27)",
                border: "1px solid rgb(63 63 70)",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: "rgb(212 212 216)" }}
              itemStyle={{ color: "rgb(244 244 245)" }}
            />
            {revealed &&
              benchmarks.map((s, i) => (
                <Line
                  key={s.symbol}
                  type="monotone"
                  dataKey={s.symbol}
                  stroke={colorFor(s.symbol, i)}
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                  isAnimationActive
                  animationDuration={2200}
                  animationEasing="ease-out"
                  connectNulls
                />
              ))}
            {revealed && portfolio && (
              <Line
                type="monotone"
                dataKey="PORTFOLIO"
                stroke={PORTFOLIO_COLOR}
                strokeWidth={2.5}
                dot={false}
                isAnimationActive
                animationDuration={2600}
                animationEasing="ease-out"
                connectNulls
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex flex-wrap gap-4 text-xs">
        {portfolio && <LegendDot color={PORTFOLIO_COLOR} label="Portfolio" />}
        {benchmarks.map((s, i) => (
          <LegendDot
            key={s.symbol}
            color={colorFor(s.symbol, i)}
            label={`${s.label} (${s.symbol})`}
            dashed
          />
        ))}
      </div>
    </div>
  );
}

function LegendDot({
  color,
  label,
  dashed,
}: {
  color: string;
  label: string;
  dashed?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
      <span
        className="inline-block w-6 h-0.5"
        style={{
          background: dashed
            ? `repeating-linear-gradient(to right, ${color} 0 4px, transparent 4px 8px)`
            : color,
        }}
      />
      {label}
    </div>
  );
}
