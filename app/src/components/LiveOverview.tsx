"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { HeroNumbers } from "./HeroNumbers";
import { useLiveData } from "./LiveDataProvider";
import { fmtDateTime } from "@/lib/format";

// Renders the hero numbers + portals the "Updated …" line into the
// footer slot, sourcing both from the shared LiveDataProvider.
export function LiveOverview() {
  const { data } = useLiveData();
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setTarget(document.getElementById("footer-timestamp-slot"));
  }, []);

  const portfolioValue = data.summary.portfolioValue;
  const portfolioSince = data.sinceSeries.find(
    (s) => s.symbol === "PORTFOLIO",
  );
  const baselineSince =
    Number(portfolioSince?.points[0]?.value ?? 0) || null;
  const priorClose = data.priorClose;

  const todayDollar =
    priorClose != null ? portfolioValue - priorClose : null;
  const todayPct =
    priorClose != null && priorClose !== 0 && todayDollar != null
      ? (todayDollar / priorClose) * 100
      : null;
  const sincePct =
    baselineSince != null && baselineSince !== 0
      ? ((portfolioValue - baselineSince) / baselineSince) * 100
      : null;

  // High- and low-water marks over the portfolio's daily series, with
  // the live value folded in as the latest point so a fresh intraday
  // high/low registers immediately. Pct is measured from inception.
  const equitySeries = [
    ...(portfolioSince?.points.map((p) => Number(p.value)) ?? []),
    portfolioValue,
  ].filter((v) => isFinite(v) && v > 0);

  let peakValue: number | null = null;
  let peakPct: number | null = null;
  let lowValue: number | null = null;
  let lowPct: number | null = null;
  if (equitySeries.length && baselineSince) {
    peakValue = Math.max(...equitySeries);
    peakPct = ((peakValue - baselineSince) / baselineSince) * 100;
    lowValue = Math.min(...equitySeries);
    lowPct = ((lowValue - baselineSince) / baselineSince) * 100;
  }

  return (
    <>
      <HeroNumbers
        portfolioValue={portfolioValue}
        cash={data.summary.cash}
        sincePct={sincePct}
        todayDollar={todayDollar}
        todayPct={todayPct}
        peakValue={peakValue}
        peakPct={peakPct}
        lowValue={lowValue}
        lowPct={lowPct}
        marketClock={data.marketClock}
      />
      {target &&
        createPortal(
          <>Updated {fmtDateTime(data.summary.updatedAt)}.</>,
          target,
        )}
    </>
  );
}
