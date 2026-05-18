"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Activity, PerformanceSeries, Position } from "@/lib/types";

export type LiveSnapshot = {
  summary: {
    portfolioValue: number;
    cash: number;
    updatedAt: string;
  };
  positions: Position[];
  activity: Activity[];
  sinceSeries: PerformanceSeries[];
  priorClose: number | null;
  inceptionDate: string | null;
  todaySeries: { t: string; value: number }[];
};

type Ctx = {
  data: LiveSnapshot;
  // Monotonic counter that bumps on every fresh server response (even
  // if no field changed). Components that want a "pulse" effect on
  // refresh can key off this.
  tick: number;
};

const LiveDataCtx = createContext<Ctx | null>(null);

export function useLiveData(): Ctx {
  const v = useContext(LiveDataCtx);
  if (!v) {
    throw new Error("useLiveData must be used inside <LiveDataProvider>");
  }
  return v;
}

// Polls /api/live on a fixed interval, pauses while the tab is hidden,
// and feeds the latest snapshot to consumer components. The initial
// snapshot comes from the server render so first paint is fully
// populated; subsequent ticks update in place.
const POLL_MS = 30_000;

export function LiveDataProvider({
  initial,
  children,
}: {
  initial: LiveSnapshot;
  children: ReactNode;
}) {
  const [data, setData] = useState<LiveSnapshot>(initial);
  const [tick, setTick] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      try {
        const r = await fetch("/api/live", { cache: "no-store" });
        if (!r.ok) return;
        const j = (await r.json()) as LiveSnapshot;
        if (cancelled) return;
        setData(j);
        setTick((t) => t + 1);
      } catch {
        // Network blip; keep showing the previous snapshot.
      }
    };

    const start = () => {
      if (intervalRef.current) return;
      poll();
      intervalRef.current = setInterval(poll, POLL_MS);
    };
    const stop = () => {
      if (!intervalRef.current) return;
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
    const onVis = () => (document.hidden ? stop() : start());

    start();
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelled = true;
      stop();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <LiveDataCtx.Provider value={{ data, tick }}>
      {children}
    </LiveDataCtx.Provider>
  );
}
