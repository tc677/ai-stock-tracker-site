"use client";

import { useEffect, useState } from "react";
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
import { RANGES, RANGE_LABELS, type Range } from "@/lib/ranges";
import { fmtDate, fmtDateTime, fmtPct } from "@/lib/format";

const PORTFOLIO_COLOR = "#10b981"; // emerald-500
const BENCHMARK_COLORS = ["#64748b", "#3b82f6", "#a855f7", "#f59e0b", "#ec4899"];

type Row = {
  t: string;
} & Record<string, number | string>;

export function EquityChart({
  initialRange = "YTD" as Range,
  initialSeries = [],
}: {
  initialRange?: Range;
  initialSeries?: PerformanceSeries[];
}) {
  const [range, setRange] = useState<Range>(initialRange);
  const [series, setSeries] = useState<PerformanceSeries[]>(initialSeries);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Skip the first fetch if we already have server-rendered data for this range.
    if (range === initialRange && series === initialSeries) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/performance?range=${range}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`);
        return r.json();
      })
      .then((data: { series: PerformanceSeries[] }) => {
        if (!cancelled) setSeries(data.series ?? []);
      })
      .catch((e) => {
        if (!cancelled) {
          console.error("chart fetch failed", e);
          setError(e instanceof Error ? e.message : String(e));
        }
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  return (
    <div>
      <div className="flex items-center justify-between mb-3 gap-2">
        <h2 className="text-sm font-medium text-zinc-500">Portfolio vs. benchmarks</h2>
        <RangeSelector value={range} onChange={setRange} />
      </div>
      {error ? (
        <div className="h-64 sm:h-80 flex items-center justify-center rounded-lg border border-rose-300 dark:border-rose-700 text-rose-600 dark:text-rose-400 text-sm px-4 text-center">
          Failed to load: {error}
        </div>
      ) : (
        <Chart series={series} range={range} loading={loading} />
      )}
    </div>
  );
}

function RangeSelector({
  value,
  onChange,
}: {
  value: Range;
  onChange: (r: Range) => void;
}) {
  return (
    <div className="inline-flex items-center rounded-md border border-zinc-200 dark:border-zinc-800 p-0.5 text-xs">
      {RANGES.map((r) => (
        <button
          key={r}
          onClick={() => onChange(r)}
          className={`px-2.5 py-1 rounded transition-colors ${
            value === r
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
          }`}
        >
          {RANGE_LABELS[r]}
        </button>
      ))}
    </div>
  );
}

function Chart({
  series,
  range,
  loading,
}: {
  series: PerformanceSeries[];
  range: Range;
  loading: boolean;
}) {
  const enough = series.some((s) => s.points.length >= 2);

  if (loading && !enough) {
    return (
      <div className="h-64 sm:h-80 flex items-center justify-center text-sm text-zinc-500">
        Loading...
      </div>
    );
  }

  if (!enough) {
    return (
      <div className="h-64 sm:h-80 flex items-center justify-center rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-500 text-sm">
        Not enough history for this range yet.
      </div>
    );
  }

  // Normalize each series to % return from its first point in this window.
  const allTs = Array.from(
    new Set(series.flatMap((s) => s.points.map((p) => p.t))),
  ).sort();
  const baselines = new Map(
    series.map((s) => [s.symbol, s.points[0]?.value ?? null]),
  );
  const pointBySymbolTs = new Map<string, number>();
  for (const s of series) {
    for (const p of s.points) {
      pointBySymbolTs.set(`${s.symbol}|${p.t}`, p.value);
    }
  }

  const data: Row[] = allTs.map((t) => {
    const row: Row = { t };
    for (const s of series) {
      const base = baselines.get(s.symbol);
      const v = pointBySymbolTs.get(`${s.symbol}|${t}`);
      if (base != null && v != null && base !== 0) {
        row[s.symbol] = ((v - base) / base) * 100;
      }
    }
    return row;
  });

  const portfolio = series.find((s) => s.symbol === "PORTFOLIO");
  const benchmarks = series.filter((s) => s.symbol !== "PORTFOLIO");
  const isIntra = range === "1D";

  return (
    <div className={loading ? "opacity-50 transition-opacity" : ""}>
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
              dataKey="t"
              tickFormatter={(t) =>
                isIntra
                  ? new Date(t).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                      timeZone: "America/New_York",
                    })
                  : fmtDate(t)
              }
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
              labelFormatter={(t) => (isIntra ? fmtDateTime(t as string) : fmtDate(t as string))}
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
            {portfolio && (
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
      </div>

      <div className="mt-3 flex flex-wrap gap-4 text-xs">
        {portfolio && <LegendDot color={PORTFOLIO_COLOR} label="Portfolio" />}
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
