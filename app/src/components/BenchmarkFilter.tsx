"use client";

// Pill-style multi-select for choosing which benchmarks appear on the chart.
// Each pill toggles its symbol on/off; portfolio is always shown.

export function BenchmarkFilter({
  benchmarks,
  selected,
  onChange,
}: {
  benchmarks: { symbol: string; label: string }[];
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
}) {
  if (benchmarks.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="text-xs text-zinc-500 mr-1">Compare to:</span>
      {benchmarks.map((b) => {
        const on = selected.has(b.symbol);
        return (
          <button
            key={b.symbol}
            type="button"
            aria-pressed={on}
            onClick={() => {
              const next = new Set(selected);
              if (on) next.delete(b.symbol);
              else next.add(b.symbol);
              onChange(next);
            }}
            className={`px-3 py-1 rounded-full border text-xs font-medium transition-colors ${
              on
                ? "bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100"
                : "border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-600"
            }`}
          >
            {b.label}
          </button>
        );
      })}
    </div>
  );
}
