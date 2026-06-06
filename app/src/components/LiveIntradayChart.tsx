"use client";

import { IntradayChart } from "./IntradayChart";
import { useLiveData } from "./LiveDataProvider";

export function LiveIntradayChart() {
  const { data } = useLiveData();
  return (
    <IntradayChart
      points={data.todaySeries}
      priorClose={data.priorClose}
      marketClock={data.marketClock}
    />
  );
}
