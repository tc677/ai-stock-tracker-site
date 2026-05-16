import type { Metadata } from "next";
import { getPerformanceSeries } from "@/lib/queries";
import { fmtDate, fmtPct } from "@/lib/format";

export const revalidate = 60;
export const metadata: Metadata = { title: "Performance" };

export default async function PerformancePage() {
  const series = await getPerformanceSeries().catch(() => []);

  if (series.length === 0 || series.every((s) => s.points.length < 2)) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight">Performance</h1>
        <div className="rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 p-8 text-center text-zinc-500">
          Not enough history yet. Come back after a couple of trading days.
        </div>
      </div>
    );
  }

  const cards = series
    .filter((s) => s.points.length >= 2)
    .map((s) => {
      const first = s.points[0].value;
      const last = s.points[s.points.length - 1].value;
      const pct = first ? ((last - first) / first) * 100 : 0;
      return { symbol: s.symbol, label: s.label, pct };
    });

  // Build a unified table indexed by date.
  const allDates = Array.from(
    new Set(series.flatMap((s) => s.points.map((p) => p.date))),
  ).sort();
  const firstByDate = (sym: string) =>
    series.find((s) => s.symbol === sym)?.points[0]?.value ?? null;
  const valueAt = (sym: string, date: string) =>
    series.find((s) => s.symbol === sym)?.points.find((p) => p.date === date)
      ?.value ?? null;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">Performance (YTD)</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((c) => {
          const positive = c.pct >= 0;
          const color = positive
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-rose-600 dark:text-rose-400";
          return (
            <div
              key={c.symbol}
              className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4"
            >
              <div className="text-xs uppercase tracking-wide text-zinc-500">
                {c.label}
              </div>
              <div className={`mt-2 text-2xl font-semibold ${color}`}>
                {fmtPct(c.pct)}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-zinc-500">
        Each column shows percent change from {fmtDate(allDates[0])} to{" "}
        {fmtDate(allDates[allDates.length - 1])}.
      </p>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800 max-h-96">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-900 text-left sticky top-0">
            <tr>
              <th className="px-4 py-2 font-medium">Date</th>
              {series.map((s) => (
                <th key={s.symbol} className="px-4 py-2 font-medium text-right">
                  {s.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allDates
              .slice()
              .reverse()
              .map((date) => (
                <tr
                  key={date}
                  className="border-t border-zinc-200 dark:border-zinc-800"
                >
                  <td className="px-4 py-2">{fmtDate(date)}</td>
                  {series.map((s) => {
                    const base = firstByDate(s.symbol);
                    const v = valueAt(s.symbol, date);
                    const pct = base && v ? ((v - base) / base) * 100 : null;
                    return (
                      <td
                        key={s.symbol}
                        className="px-4 py-2 text-right tabular-nums"
                      >
                        {pct == null ? "—" : fmtPct(pct)}
                      </td>
                    );
                  })}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
