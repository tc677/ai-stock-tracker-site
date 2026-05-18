"use client";

import { PositionsTreemap } from "./PositionsTreemap";
import { useLiveData } from "./LiveDataProvider";

// Live wrapper: re-renders the treemap with the latest positions
// snapshot. Recharts will redraw the tiles in place — at puller
// cadence (~1/min) the snap is minor; a hand-rolled animated
// treemap is the future polish.
export function LivePositionsTreemap() {
  const { data } = useLiveData();
  return (
    <PositionsTreemap
      positions={data.positions}
      cash={data.summary.cash}
    />
  );
}
