"use client";

import { AIStatusLine } from "./AIStatusLine";
import { useLiveData } from "./LiveDataProvider";

export function LiveAIStatusLine() {
  const { data } = useLiveData();
  return (
    <AIStatusLine positions={data.positions} activity={data.activity} />
  );
}
