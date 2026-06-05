import { fmtPct } from "@/lib/format";

// Titled "Best · Worst" pair, used for both holdings (unrealized P/L)
// and closed trades (realized P/L). Each side shows a symbol + signed
// percent, colored green/red by sign.
export function BestWorst({
  title,
  best,
  worst,
  className = "mt-6",
}: {
  title: string;
  best: { symbol: string; pct: number };
  worst: { symbol: string; pct: number };
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="text-sm font-medium text-zinc-500 mb-1">{title}</div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <Cell label="Best" symbol={best.symbol} pct={best.pct} />
        <span className="text-zinc-300 dark:text-zinc-700">·</span>
        <Cell label="Worst" symbol={worst.symbol} pct={worst.pct} />
      </div>
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
