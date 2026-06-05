"use client";

import { MarketStatusLine } from "./MarketStatusLine";
import { useLiveData } from "./LiveDataProvider";

export function LiveMarketStatus() {
  const { data } = useLiveData();
  return <MarketStatusLine marketClock={data.marketClock} />;
}
