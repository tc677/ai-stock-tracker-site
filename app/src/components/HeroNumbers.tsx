"use client";

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
  peakValue,
  peakPct,
  lowValue,
  lowPct,
  marketClock,
}: {
  portfolioValue: number;
  cash: number;
  sincePct: number | null;
  todayDollar: number | null;
  todayPct: number | null;
  peakValue: number | null;
  peakPct: number | null;
  lowValue: number | null;
  lowPct: number | null;
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

  const marketOpen = marketClock?.isOpen ?? true;
  // A real move happened today (guards against the dead pre-market
  // "Today +$0.00" line, where portfolio_value still equals the prior
  // close because the puller hasn't run yet).
  const hasTodayMove =
    todayDollar != null &&
    todayPct != null &&
    (todayDollar !== 0 || todayPct !== 0);
  // Show the day's change while the market is open, and keep it visible
  // after the close so the day's final result doesn't vanish.
  const showTodayStrip =
    todayDollar != null && todayPct != null && (marketOpen || hasTodayMove);

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
      {showTodayStrip && (
        <div
          className={`mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm font-mono tabular-nums transition-colors duration-1000 ${todayColor}`}
        >
          <span className="font-sans text-zinc-500">Today</span>
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
      <div className="mt-6">
        <div className="text-sm font-medium text-zinc-500">Cash</div>
        <AnimatedNumber
          value={cash}
          format={fmtUSD}
          className="font-mono text-2xl font-medium tabular-nums text-zinc-900 dark:text-zinc-50"
        />
      </div>
      {peakValue != null && peakPct != null && peakPct > 0 && (
        <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
          <span className="font-sans text-zinc-500">High-water mark</span>
          <AnimatedNumber
            value={peakValue}
            format={fmtUSD}
            className="font-semibold whitespace-nowrap"
          />
          <AnimatedNumber
            value={peakPct}
            format={(n) => `(+${fmtPct(n)})`}
            className="whitespace-nowrap"
          />
        </div>
      )}
      {lowValue != null && lowPct != null && lowPct < 0 && (
        <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm font-mono tabular-nums text-rose-600 dark:text-rose-400">
          <span className="font-sans text-zinc-500">Low-water mark</span>
          <AnimatedNumber
            value={lowValue}
            format={fmtUSD}
            className="font-semibold whitespace-nowrap"
          />
          <AnimatedNumber
            value={lowPct}
            format={(n) => `(−${fmtPct(Math.abs(n))})`}
            className="whitespace-nowrap"
          />
        </div>
      )}
    </>
  );
}
