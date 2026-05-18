"use client";

import { useIntro } from "./Intro";
import { AnimatedNumber } from "./AnimatedNumber";
import { fmtPct, fmtUSD } from "@/lib/format";

export function HeroNumbers({
  portfolioValue,
  cash,
  sincePct,
  todayDollar,
  todayPct,
}: {
  portfolioValue: number;
  cash: number;
  sincePct: number | null;
  todayDollar: number | null;
  todayPct: number | null;
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

  return (
    <>
      <div
        className={`flex items-baseline gap-3 flex-wrap transition-colors duration-1000 ${heroColor}`}
      >
        <AnimatedNumber
          value={portfolioValue}
          format={fmtUSD}
          className="text-4xl sm:text-5xl font-semibold tracking-tight tabular-nums"
        />
        {sincePct != null && (
          <AnimatedNumber
            value={sincePct}
            format={(n) => `${n >= 0 ? "+" : ""}${fmtPct(n)}`}
            className="text-lg font-medium tabular-nums"
          />
        )}
      </div>
      {todayDollar != null && todayPct != null && (
        <div
          className={`mt-1 flex items-baseline gap-2 text-sm font-mono tabular-nums transition-colors duration-1000 ${todayColor}`}
        >
          <span className="text-zinc-500">Today</span>
          <AnimatedNumber
            value={todayDollar}
            format={(n) => `${n >= 0 ? "+" : "−"}${fmtUSD(Math.abs(n))}`}
            className="font-semibold"
          />
          <AnimatedNumber
            value={todayPct}
            format={(n) => `(${n >= 0 ? "+" : ""}${fmtPct(n)})`}
          />
        </div>
      )}
      <div className="mt-4">
        <div className="text-sm font-medium text-zinc-500">Cash</div>
        <AnimatedNumber
          value={cash}
          format={fmtUSD}
          className="text-2xl font-medium tabular-nums text-zinc-900 dark:text-zinc-50"
        />
      </div>
    </>
  );
}
