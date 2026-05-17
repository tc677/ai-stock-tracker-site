"use client";

// A simple segmented toggle used by the comparison cards and the chart on
// the overview / performance pages. Receives the two labeled options and
// reports the active key. Stateful version (StatefulPeriodToggle) is below.

import { useState } from "react";

export type PeriodKey = "since" | "ytd";

export type PeriodOption = {
  key: PeriodKey;
  label: string;
};

export function PeriodToggle({
  value,
  onChange,
  options,
}: {
  value: PeriodKey;
  onChange: (k: PeriodKey) => void;
  options: PeriodOption[];
}) {
  return (
    <div className="inline-flex items-center rounded-md border border-zinc-200 dark:border-zinc-800 p-0.5 text-xs">
      {options.map((o) => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          className={`px-2.5 py-1 rounded transition-colors ${
            value === o.key
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// Hook for the simple binary case: returns [value, setValue, options].
export function usePeriodToggle(
  options: PeriodOption[],
  initial: PeriodKey = "since",
) {
  const [value, setValue] = useState<PeriodKey>(initial);
  return { value, setValue, options };
}
