"use client";

import { useState } from "react";
import { EquityChart } from "./EquityChart";
import { PeriodToggle, type PeriodKey, type PeriodOption } from "./PeriodToggle";
import type { PerformanceSeries } from "@/lib/types";

export function ChartSection({
  ytdSeries,
  sinceSeries,
  sinceLabel,
  defaultPeriod = "since",
}: {
  ytdSeries: PerformanceSeries[];
  sinceSeries: PerformanceSeries[];
  sinceLabel: string;
  defaultPeriod?: PeriodKey;
}) {
  const hasSince = sinceSeries.some((s) => s.points.length >= 2);
  const initial: PeriodKey = hasSince ? defaultPeriod : "ytd";
  const [period, setPeriod] = useState<PeriodKey>(initial);

  const options: PeriodOption[] = [
    { key: "since", label: sinceLabel },
    { key: "ytd", label: "YTD" },
  ];

  if (!hasSince) {
    return (
      <section>
        <h2 className="text-sm font-medium text-zinc-500 mb-3">Year to date</h2>
        <EquityChart series={ytdSeries} />
      </section>
    );
  }

  const activeSeries = period === "since" ? sinceSeries : ytdSeries;
  const title = period === "since" ? `Since ${sinceLabel}` : "Year to date";

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-medium text-zinc-500">{title}</h2>
        <PeriodToggle value={period} onChange={setPeriod} options={options} />
      </div>
      <EquityChart series={activeSeries} />
    </section>
  );
}
