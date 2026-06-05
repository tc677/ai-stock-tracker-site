"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useLiveData } from "./LiveDataProvider";
import { fmtDateTime, fmtUSD } from "@/lib/format";

// Live trade-blotter table. When a new row appears (id not seen
// before), it slides down from above with a brief side-colored
// highlight, then settles into the rest of the table.
// Most recent N trades shown in the blotter. Older fills are still in
// the DB; the panel just caps what it renders so it doesn't grow without
// bound. The container scrolls vertically once rows exceed its height.
const MAX_ROWS = 25;

export function LiveActivity() {
  const { data } = useLiveData();
  const activity = data.activity.slice(0, MAX_ROWS);

  const seenIds = useRef<Set<string>>(new Set(activity.map((a) => a.id)));
  const [highlighted, setHighlighted] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fresh = activity.filter((a) => !seenIds.current.has(a.id));
    if (fresh.length === 0) return;
    for (const a of fresh) seenIds.current.add(a.id);
    const ids = fresh.map((a) => a.id);
    setHighlighted((prev) => new Set([...prev, ...ids]));
    const t = setTimeout(() => {
      setHighlighted((prev) => {
        const next = new Set(prev);
        for (const id of ids) next.delete(id);
        return next;
      });
    }, 1800);
    return () => clearTimeout(t);
  }, [activity]);

  if (activity.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 p-8 text-center text-zinc-500">
        No trades yet.
      </div>
    );
  }

  return (
    <div className="overflow-auto max-h-[28rem]">
      <table className="w-full text-sm">
        <thead className="sticky top-0 z-10 bg-white dark:bg-[#0a0a0a]">
          <tr className="text-left text-[10px] uppercase tracking-[0.12em] text-zinc-500 border-b border-zinc-200 dark:border-zinc-800">
            <th className="px-4 py-2 font-medium">When</th>
            <th className="px-4 py-2 font-medium">Symbol</th>
            <th className="px-4 py-2 font-medium">Side</th>
            <th className="px-4 py-2 font-medium text-right">Qty</th>
            <th className="px-4 py-2 font-medium text-right">Price</th>
            <th className="px-4 py-2 font-medium text-right">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
          <AnimatePresence initial={false}>
            {activity.map((a) => {
              const isHi = highlighted.has(a.id);
              const sideBg = isHi
                ? a.side === "buy"
                  ? "bg-emerald-100/70 dark:bg-emerald-500/15"
                  : "bg-rose-100/70 dark:bg-rose-500/15"
                : "";
              return (
                <motion.tr
                  key={a.id}
                  layout
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: 0.35,
                    ease: [0.2, 0.8, 0.2, 1],
                  }}
                  className={`transition-colors duration-1000 ${sideBg} hover:bg-zinc-50 dark:hover:bg-zinc-900/50`}
                >
                  <td className="px-4 py-2 font-mono text-zinc-500 tabular-nums">
                    {fmtDateTime(a.filled_at)}
                  </td>
                  <td className="px-4 py-2 font-mono font-semibold tracking-tight">
                    {a.symbol}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ${
                        a.side === "buy"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
                          : "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400"
                      }`}
                    >
                      {a.side}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right font-mono tabular-nums text-zinc-600 dark:text-zinc-400">
                    {a.qty}
                  </td>
                  <td className="px-4 py-2 text-right font-mono tabular-nums text-zinc-600 dark:text-zinc-400">
                    {fmtUSD(a.price)}
                  </td>
                  <td className="px-4 py-2 text-right font-mono tabular-nums font-medium">
                    {fmtUSD(a.qty * a.price)}
                  </td>
                </motion.tr>
              );
            })}
          </AnimatePresence>
        </tbody>
      </table>
    </div>
  );
}
