"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Label,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fmtPct, fmtUSD } from "@/lib/format";
import { useIntro } from "./Intro";

type Point = { t: string; value: number };

// Today's market window in epoch ms. Computed from the current instant
// in ET so DST handles itself: derive the ET offset from a round-trip
// through Intl.DateTimeFormat, then anchor 9:30 / 16:00 ET on today's
// ET date.
function getMarketBoundsMs(): { openMs: number; closeMs: number } {
  const now = new Date();
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
      .formatToParts(now)
      .filter((p) => p.type !== "literal")
      .map((p) => [p.type, p.value]),
  );
  const y = Number(parts.year);
  const mo = Number(parts.month);
  const d = Number(parts.day);
  const h = Number(parts.hour === "24" ? "00" : parts.hour);
  const mi = Number(parts.minute);
  const s = Number(parts.second);
  const etAsUtc = Date.UTC(y, mo - 1, d, h, mi, s);
  const offsetMin = Math.round((etAsUtc - now.getTime()) / 60_000);
  const openMs = Date.UTC(y, mo - 1, d, 9, 30) - offsetMin * 60_000;
  const closeMs = Date.UTC(y, mo - 1, d, 16, 0) - offsetMin * 60_000;
  return { openMs, closeMs };
}

// Renders today's intraday portfolio value as a pct-change-from-baseline
// area chart on a fixed 9:30 - 16:00 ET x-axis, so the line "grows"
// across the day as new points arrive. Baseline is yesterday's close
// when available (so the chart matches the hero's "Today" strip),
// otherwise the first intraday point of the day.
export function IntradayChart({
  points,
  priorClose,
}: {
  points: Point[];
  priorClose: number | null;
}) {
  const { phase } = useIntro();
  const revealed = phase === "plop" || phase === "done";

  const { openMs, closeMs } = useMemo(() => getMarketBoundsMs(), []);

  const baseline =
    priorClose != null && priorClose > 0
      ? priorClose
      : points[0]?.value ?? 1;

  const data = points.map((p) => ({
    t: new Date(p.t).getTime(),
    pct: ((p.value - baseline) / baseline) * 100,
    value: p.value,
  }));

  // Neutral stroke when there's nothing to color by sign yet.
  const last = data.length > 0 ? data[data.length - 1].pct : 0;
  const isUp = last >= 0;
  const stroke =
    data.length > 0 ? (isUp ? "#3fb950" : "#f85149") : "#71717a"; // zinc-500 fallback
  // Empty-state y-axis needs an explicit domain or Recharts collapses it.
  const yDomain: [number | string, number | string] =
    data.length > 0 ? ["dataMin", "dataMax"] : [-0.5, 0.5];

  // Hourly ticks 10, 11, ..., 16 ET. 9:30 sits at the left edge so we
  // skip an explicit tick there - the axis line itself reads as open.
  const HOUR_MS = 60 * 60 * 1000;
  const ticks: number[] = [];
  for (let h = 10; h <= 16; h++) {
    ticks.push(openMs + (h - 9.5) * HOUR_MS);
  }

  return (
    <div className="h-96 sm:h-[34rem] relative">
      {data.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-zinc-500 text-sm z-10">
          Waiting for today&rsquo;s first intraday points.
        </div>
      )}
      <div className={`h-full ${revealed ? "intraday-reveal" : "intraday-hidden"}`}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 16, left: 8, bottom: 24 }}>
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
              type="number"
              scale="time"
              domain={[openMs, closeMs]}
              ticks={ticks}
              tickFormatter={(t) =>
                new Date(t as number)
                  .toLocaleTimeString("en-US", {
                    hour: "numeric",
                    timeZone: "America/New_York",
                  })
                  .replace(" ", "")
                  .toLowerCase()
              }
              stroke="currentColor"
              className="text-zinc-500"
              tick={{ fontSize: 11 }}
              allowDataOverflow={false}
            >
              <Label
                value="time (ET)"
                position="insideBottom"
                offset={-16}
                fill="currentColor"
                className="text-zinc-500"
                fontSize={11}
              />
            </XAxis>
            <YAxis
              tickFormatter={(v) => `${(v as number).toFixed(2)}%`}
              stroke="currentColor"
              className="text-zinc-500"
              tick={{ fontSize: 11 }}
              width={64}
              domain={yDomain}
            >
              <Label
                value="% from prior close"
                angle={-90}
                position="insideLeft"
                offset={16}
                style={{ textAnchor: "middle" }}
                fill="currentColor"
                className="text-zinc-500"
                fontSize={11}
              />
            </YAxis>
            <ReferenceLine
              y={0}
              stroke="currentColor"
              className="text-zinc-400 dark:text-zinc-600"
              strokeDasharray="3 3"
            />
            <Tooltip
              labelFormatter={(t) =>
                new Date(t as number).toLocaleTimeString("en-US", {
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
            {data.length >= 2 && (
              <Area
                type="monotone"
                dataKey="pct"
                stroke={stroke}
                strokeWidth={2}
                fill="url(#intradayFill)"
                fillOpacity={1}
                isAnimationActive
                animationDuration={700}
                animationEasing="ease-out"
                activeDot={{ r: 4, fill: stroke }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
