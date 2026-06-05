"use client";

import { BestWorst } from "./BestWorst";
import { useLiveData } from "./LiveDataProvider";

// Best/worst single closed trade by realized P/L percent. Only shown
// once at least two trades have closed, so best and worst aren't the
// same lone trade.
export function LiveTradeSpotlight() {
  const { data } = useLiveData();
  const s = data.tradeStats;
  if (!s || s.closedTrades < 2 || !s.bestTrade || !s.worstTrade) return null;

  return (
    <BestWorst
      title="Closed trades by realized P/L"
      best={s.bestTrade}
      worst={s.worstTrade}
      className="mt-2"
    />
  );
}
