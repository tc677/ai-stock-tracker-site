"use client";

import { PositionSpotlight } from "./PositionSpotlight";
import { useLiveData } from "./LiveDataProvider";

export function LivePositionSpotlight() {
  const { data } = useLiveData();
  return <PositionSpotlight positions={data.positions} />;
}
