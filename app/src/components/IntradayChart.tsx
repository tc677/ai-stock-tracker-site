"use client";

import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fmtPct, fmtUSD } from "@/lib/format";
import { useIntro } from "./Intro";

type Point = { t: string; value: number };

// Renders today's intraday portfolio value as a pct-change-from-baseline
// area chart. Baseline is yesterday's close when available (so the chart
// matches the hero's "Today" strip), otherwise the first intraday point
// of the day. Updates live by Recharts re-rendering when the data prop
// changes — appended points slide in on the right.
export function IntradayChart({
  points,
  priorClose,
}: {
  points: Point[];
  priorClose: number | null;
}) {
  const { phase } = useIntro();
  const revealed = phase === "plop" || phase === "done";

  // Animate the area on its first reveal, then disable so 30s live-poll
  // updates morph the line in place without restarting the 1.6s draw-in
  // (which is what caused the "halfway then snap to end" effect).
  const [animateOnce, setAnimateOnce] = useState(true);
  useEffect(() => {
    if (!revealed) return;
    const t = setTimeout(() => setAnimateOnce(false), 1800);
    return () => clearTimeout(t);
  }, [revealed]);

  if (points.length < 2) {
    return (
      <div className="h-80 sm:h-[28rem] flex items-center justify-center rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-500 text-sm">
        Waiting for today&rsquo;s first intraday points.
      </div>
    );
  }

  const baseline =
    priorClose != null && priorClose > 0 ? priorClose : points[0].value;

  const data = points.map((p) => ({
    t: p.t,
    pct: ((p.value - baseline) / baseline) * 100,
    value: p.value,
  }));

  const last = data[data.length - 1].pct;
  const isUp = last >= 0;
  const stroke = isUp ? "#10b981" : "#f43f5e"; // emerald-500 / rose-500

  return (
    <div className="h-80 sm:h-[28rem]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="intradayFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity={0.35} />
              <stop offset="100%" stopColor={stroke} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="2 4"
            stroke="currentColor"
            className="text-zinc-200 dark:text-zinc-800"
            vertical={false}
          />
          <XAxis
            dataKey="t"
            tickFormatter={(t) =>
              new Date(t as string).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                timeZone: "America/New_York",
              })
            }
            stroke="currentColor"
            className="text-zinc-500"
            tick={{ fontSize: 11 }}
            minTickGap={48}
          />
          <YAxis
            tickFormatter={(v) => `${(v as number).toFixed(2)}%`}
            stroke="currentColor"
            className="text-zinc-500"
            tick={{ fontSize: 11 }}
            width={56}
            domain={["dataMin", "dataMax"]}
          />
          <ReferenceLine
            y={0}
            stroke="currentColor"
            className="text-zinc-400 dark:text-zinc-600"
            strokeDasharray="3 3"
          />
          <Tooltip
            labelFormatter={(t) =>
              new Date(t as string).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                timeZone: "America/New_York",
              })
            }
            formatter={(value, _name, item) => {
              const pct = Number(value);
              const dollar = Number(
                (item as { payload?: { value?: number } })?.payload?.value ?? 0,
              );
              return [`${fmtPct(pct)} (${fmtUSD(dollar)})`, "Portfolio"];
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
          {revealed && (
            <Area
              type="monotone"
              dataKey="pct"
              stroke={stroke}
              strokeWidth={2}
              fill="url(#intradayFill)"
              fillOpacity={1}
              isAnimationActive={animateOnce}
              animationDuration={1600}
              animationEasing="ease-out"
              activeDot={{ r: 4, fill: stroke }}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
