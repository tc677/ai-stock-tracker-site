"use client";

import { useState } from "react";
import { ComparisonCards } from "./ComparisonCards";
import { PeriodToggle, type PeriodKey, type PeriodOption } from "./PeriodToggle";
import type { PerformanceSeries } from "@/lib/types";

export function ComparisonSection({
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

  // If we don't have a since view yet, just show YTD without the toggle.
  if (!hasSince) {
    return (
      <ComparisonCards series={ytdSeries} title="vs. Benchmarks (YTD)" />
    );
  }

  const activeSeries = period === "since" ? sinceSeries : ytdSeries;
  const title =
    period === "since"
      ? `vs. Benchmarks (since ${sinceLabel})`
      : "vs. Benchmarks (YTD)";
  const subtitle =
    period === "ytd"
      ? "Includes time you were in cash, so benchmarks have a head start."
      : undefined;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-medium text-zinc-500">{title}</h2>
        <PeriodToggle value={period} onChange={setPeriod} options={options} />
      </div>
      <ComparisonCards series={activeSeries} title="" subtitle={subtitle} />
    </section>
  );
}
