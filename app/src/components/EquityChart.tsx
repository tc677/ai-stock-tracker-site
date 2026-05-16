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

// Tailwind colors picked to read well on both light and dark backgrounds.
const PORTFOLIO_COLOR = "#10b981"; // emerald-500
const BENCHMARK_COLORS = ["#64748b", "#3b82f6", "#a855f7", "#f59e0b", "#ec4899"];

type Row = {
  date: string;
} & Record<string, number | string>;

export function EquityChart({ series }: { series: PerformanceSeries[] }) {
  // Need at least 2 points in any series to draw a line.
  if (series.every((s) => s.points.length < 2)) {
    return (
      <div className="h-64 sm:h-80 flex items-center justify-center rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-500 text-sm">
        Not enough history yet — come back after a couple of trading days.
      </div>
    );
  }

  // Build the unified row-per-date shape Recharts wants.
  // Each row: { date, PORTFOLIO: pct, SPY: pct, QQQ: pct, ... }
  // Each series is normalized to % return from its first observed value.
  const allDates = Array.from(
    new Set(series.flatMap((s) => s.points.map((p) => p.date))),
  ).sort();

  const baselines = new Map(
    series.map((s) => [s.symbol, s.points[0]?.value ?? null]),
  );
  const pointBySymbolDate = new Map<string, number>();
  for (const s of series) {
    for (const p of s.points) {
      pointBySymbolDate.set(`${s.symbol}|${p.date}`, p.value);
    }
  }

  const data: Row[] = allDates.map((date) => {
    const row: Row = { date };
    for (const s of series) {
      const base = baselines.get(s.symbol);
      const v = pointBySymbolDate.get(`${s.symbol}|${date}`);
      if (base != null && v != null) {
        row[s.symbol] = ((v - base) / base) * 100;
      }
    }
    return row;
  });

  const portfolioSeries = series.find((s) => s.symbol === "PORTFOLIO");
  const benchmarks = series.filter((s) => s.symbol !== "PORTFOLIO");

  return (
    <div className="h-64 sm:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="2 4"
            stroke="currentColor"
            className="text-zinc-200 dark:text-zinc-800"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tickFormatter={(d) => fmtDate(d)}
            stroke="currentColor"
            className="text-zinc-500 text-xs"
            tick={{ fontSize: 11 }}
          />
          <YAxis
            tickFormatter={(v) => `${v.toFixed(0)}%`}
            stroke="currentColor"
            className="text-zinc-500 text-xs"
            tick={{ fontSize: 11 }}
            width={48}
          />
          <Tooltip
            labelFormatter={(d) => fmtDate(d as string)}
            formatter={(value, name) => {
              const label =
                name === "PORTFOLIO"
                  ? "Portfolio"
                  : series.find((s) => s.symbol === name)?.label ??
                    String(name);
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
          {benchmarks.map((s, i) => (
            <Line
              key={s.symbol}
              type="monotone"
              dataKey={s.symbol}
              stroke={BENCHMARK_COLORS[i % BENCHMARK_COLORS.length]}
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
              isAnimationActive={false}
            />
          ))}
          {portfolioSeries && (
            <Line
              type="monotone"
              dataKey="PORTFOLIO"
              stroke={PORTFOLIO_COLOR}
              strokeWidth={2.5}
              dot={false}
              isAnimationActive={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-3 flex flex-wrap gap-4 text-xs">
        {portfolioSeries && (
          <LegendDot color={PORTFOLIO_COLOR} label="Portfolio" />
        )}
        {benchmarks.map((s, i) => (
          <LegendDot
            key={s.symbol}
            color={BENCHMARK_COLORS[i % BENCHMARK_COLORS.length]}
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
