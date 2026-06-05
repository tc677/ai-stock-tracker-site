"use client";

import { useEffect, useState } from "react";
import type { MarketClock } from "@/lib/types";

// Market status line, shown at the bottom of the overview under the AI
// status line. "Market open" with a live dot when the session is open;
// "Market closed · opens in Xh Ym" with a countdown otherwise. Re-renders
// every 30s (matches the LiveDataProvider poll) to keep the countdown
// current without piping the clock through props.
export function MarketStatusLine({
  marketClock,
}: {
  marketClock: MarketClock | null;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(i);
  }, []);

  if (!marketClock) return null;

  if (marketClock.isOpen) {
    return (
      <div className="mt-2 flex items-center gap-1.5 font-mono text-[11px] tracking-tight text-emerald-600 dark:text-emerald-400">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
        <span>Market open</span>
      </div>
    );
  }

  const countdown = (() => {
    if (!marketClock.nextOpen) return null;
    const ms = new Date(marketClock.nextOpen).getTime() - now;
    if (!isFinite(ms) || ms <= 0) return null;
    const totalMin = Math.floor(ms / 60_000);
    const hours = Math.floor(totalMin / 60);
    const mins = totalMin % 60;
    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      const remHours = hours % 24;
      return `${days}d ${remHours}h`;
    }
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  })();

  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5 font-mono text-[11px] tracking-tight text-zinc-500">
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-zinc-400 dark:bg-zinc-600" />
      <span className="whitespace-nowrap">Market closed</span>
      {countdown && (
        <>
          <span className="text-zinc-400 dark:text-zinc-600">·</span>
          <span className="whitespace-nowrap">opens in {countdown}</span>
        </>
      )}
    </div>
  );
}
