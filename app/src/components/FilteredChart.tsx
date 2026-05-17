"use client";

import { useMemo, useState } from "react";
import { BenchmarkFilter } from "./BenchmarkFilter";
import { EquityChart } from "./EquityChart";
import type { PerformanceSeries } from "@/lib/types";

// Equity chart with a pill-style benchmark filter on top. Portfolio is
// always rendered; user toggles benchmarks on/off.
export function FilteredChart({ series }: { series: PerformanceSeries[] }) {
  const allBenchmarks = useMemo(
    () =>
      series
        .filter((s) => s.symbol !== "PORTFOLIO")
        .map((s) => ({ symbol: s.symbol, label: s.label })),
    [series],
  );

  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(allBenchmarks.map((b) => b.symbol)),
  );

  const filteredSeries = series.filter(
    (s) => s.symbol === "PORTFOLIO" || selected.has(s.symbol),
  );

  return (
    <section className="space-y-4">
      {allBenchmarks.length > 0 && (
        <BenchmarkFilter
          benchmarks={allBenchmarks}
          selected={selected}
          onChange={setSelected}
        />
      )}
      <EquityChart series={filteredSeries} />
    </section>
  );
}
