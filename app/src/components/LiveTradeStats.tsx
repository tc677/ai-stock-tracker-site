"use client";

import { useLiveData } from "./LiveDataProvider";

// Compact "AI track record" line. Only renders once there's been at
// least one fully-realized buy->sell pair, so we don't show a
// misleading 0% win rate on day one.
export function LiveTradeStats() {
  const { data } = useLiveData();
  const s = data.tradeStats;
  if (!s) return null;

  const winPct = Math.round(s.winRate * 100);
  const holdLabel =
    s.avgHoldDays >= 1
      ? `${s.avgHoldDays.toFixed(1)}d`
      : `${Math.max(1, Math.round(s.avgHoldDays * 24))}h`;
  const tradeWord = s.closedTrades === 1 ? "closed trade" : "closed trades";

  return (
    <div className="text-sm font-mono tabular-nums text-zinc-500">
      {s.closedTrades} {tradeWord}
      <span className="mx-2 text-zinc-400 dark:text-zinc-600">·</span>
      {winPct}% win
      <span className="mx-2 text-zinc-400 dark:text-zinc-600">·</span>
      avg hold {holdLabel}
    </div>
  );
}
