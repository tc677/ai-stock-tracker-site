"use client";

import { ComparisonCards } from "./ComparisonCards";
import { useLiveData } from "./LiveDataProvider";

export function LiveLeaderboard() {
  const { data } = useLiveData();
  return <ComparisonCards series={data.sinceSeries} />;
}
