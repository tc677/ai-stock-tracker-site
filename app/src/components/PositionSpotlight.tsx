import { fmtPct } from "@/lib/format";
import type { Position } from "@/lib/types";

// One-line callout of the portfolio's current best and worst holding by
// unrealized P/L percent. Skipped when there aren't enough positions to
// distinguish a leader from a laggard.
export function PositionSpotlight({ positions }: { positions: Position[] }) {
  if (positions.length < 2) return null;

  const sorted = [...positions].sort(
    (a, b) => b.unrealized_pl_pct - a.unrealized_pl_pct,
  );
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  if (best.symbol === worst.symbol) return null;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
      <Cell label="Best" symbol={best.symbol} pct={best.unrealized_pl_pct} />
      <span className="text-zinc-300 dark:text-zinc-700">·</span>
      <Cell label="Worst" symbol={worst.symbol} pct={worst.unrealized_pl_pct} />
    </div>
  );
}

function Cell({
  label,
  symbol,
  pct,
}: {
  label: string;
  symbol: string;
  pct: number;
}) {
  const positive = pct >= 0;
  const color = positive
    ? "text-emerald-600 dark:text-emerald-400"
    : "text-rose-600 dark:text-rose-400";
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span className="text-zinc-500">{label}</span>
      <span className={`font-mono font-semibold ${color}`}>
        {positive ? "▲" : "▼"} {symbol}
      </span>
      <span className={`font-mono tabular-nums ${color}`}>
        {positive ? "+" : ""}
        {fmtPct(pct)}
      </span>
    </span>
  );
}
