"use client";

import { FilteredChart } from "./FilteredChart";
import { useLiveData } from "./LiveDataProvider";

export function LiveChart() {
  const { data } = useLiveData();
  return <FilteredChart series={data.sinceSeries} />;
}
