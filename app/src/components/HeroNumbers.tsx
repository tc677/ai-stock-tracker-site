"use client";

import { useEffect, useState } from "react";
import { useIntro } from "./Intro";
import { AnimatedNumber } from "./AnimatedNumber";
import { fmtPct, fmtUSD } from "@/lib/format";
import type { MarketClock } from "@/lib/types";

export function HeroNumbers({
  portfolioValue,
  cash,
  sincePct,
  todayDollar,
  todayPct,
  maxDrawdownPct,
  marketClock,
}: {
  portfolioValue: number;
  cash: number;
  sincePct: number | null;
  todayDollar: number | null;
  todayPct: number | null;
  maxDrawdownPct: number | null;
  marketClock: MarketClock | null;
}) {
  const { phase } = useIntro();
  const revealed = phase === "plop" || phase === "done";

  const positive = sincePct == null ? true : sincePct >= 0;
  const finalColor = positive
    ? "text-emerald-600 dark:text-emerald-400"
    : "text-rose-600 dark:text-rose-400";
  const heroColor = revealed ? finalColor : "text-zinc-400 dark:text-zinc-500";

  const todayPositive = (todayPct ?? 0) >= 0;
  const todayFinalColor = todayPositive
    ? "text-emerald-600 dark:text-emerald-400"
    : "text-rose-600 dark:text-rose-400";
  const todayColor = revealed
    ? todayFinalColor
    : "text-zinc-400 dark:text-zinc-500";

  const showTodayStrip =
    todayDollar != null &&
    todayPct != null &&
    (marketClock?.isOpen ?? true);
  const showClosedStrip =
    marketClock != null && !marketClock.isOpen;

  return (
    <>
      <div
        className={`flex items-baseline gap-3 flex-wrap transition-colors duration-1000 ${heroColor}`}
      >
        <AnimatedNumber
          value={portfolioValue}
          format={fmtUSD}
          className="font-mono text-4xl sm:text-5xl font-semibold tracking-tight tabular-nums"
        />
        {sincePct != null && (
          <AnimatedNumber
            value={sincePct}
            format={(n) => `${n >= 0 ? "+" : ""}${fmtPct(n)}`}
            className="font-mono text-lg font-medium tabular-nums"
          />
        )}
      </div>
      {maxDrawdownPct != null && maxDrawdownPct < 0 && (
        <div className="mt-1.5 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-sm font-mono tabular-nums">
          <span className="text-zinc-500 whitespace-nowrap">
            max drawdown
          </span>
          <span className="text-rose-600 dark:text-rose-400 font-semibold whitespace-nowrap">
            <span className="mr-0.5">▼</span>
            {fmtPct(maxDrawdownPct)}
          </span>
        </div>
      )}
      {showTodayStrip && (
        <div
          className={`mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm font-mono tabular-nums transition-colors duration-1000 ${todayColor}`}
        >
          <span className="text-zinc-500">Today</span>
          <AnimatedNumber
            value={todayDollar!}
            format={(n) => `${n >= 0 ? "+" : "−"}${fmtUSD(Math.abs(n))}`}
            className="font-semibold whitespace-nowrap"
          />
          <AnimatedNumber
            value={todayPct!}
            format={(n) => `(${n >= 0 ? "+" : ""}${fmtPct(n)})`}
            className="whitespace-nowrap"
          />
        </div>
      )}
      {!showTodayStrip && showClosedStrip && (
        <MarketClosedStrip nextOpen={marketClock?.nextOpen ?? null} />
      )}
      <div className="mt-4">
        <div className="text-sm font-medium text-zinc-500">Cash</div>
        <AnimatedNumber
          value={cash}
          format={fmtUSD}
          className="font-mono text-2xl font-medium tabular-nums text-zinc-900 dark:text-zinc-50"
        />
      </div>
    </>
  );
}

// Re-renders every 30s (matches the LiveDataProvider poll cadence) so
// the countdown stays accurate without piping a clock through props.
function MarketClosedStrip({ nextOpen }: { nextOpen: string | null }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(i);
  }, []);

  const countdown = (() => {
    if (!nextOpen) return null;
    const ms = new Date(nextOpen).getTime() - now;
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
    <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm font-mono tabular-nums text-zinc-500">
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
