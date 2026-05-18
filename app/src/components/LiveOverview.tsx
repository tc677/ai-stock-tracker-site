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

  return (
    <>
      <HeroNumbers
        portfolioValue={portfolioValue}
        cash={data.summary.cash}
        sincePct={sincePct}
        todayDollar={todayDollar}
        todayPct={todayPct}
        maxDrawdownPct={data.maxDrawdownPct}
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
