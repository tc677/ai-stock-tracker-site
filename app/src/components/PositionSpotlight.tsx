import type { Position } from "@/lib/types";
import { BestWorst } from "./BestWorst";

// Best/worst current holding by unrealized P/L percent. Skipped when
// there aren't enough positions to distinguish a leader from a laggard.
export function PositionSpotlight({ positions }: { positions: Position[] }) {
  if (positions.length < 2) return null;

  const sorted = [...positions].sort(
    (a, b) => b.unrealized_pl_pct - a.unrealized_pl_pct,
  );
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  if (best.symbol === worst.symbol) return null;

  return (
    <BestWorst
      title="Holdings by unrealized P/L"
      best={{ symbol: best.symbol, pct: best.unrealized_pl_pct }}
      worst={{ symbol: worst.symbol, pct: worst.unrealized_pl_pct }}
    />
  );
}
