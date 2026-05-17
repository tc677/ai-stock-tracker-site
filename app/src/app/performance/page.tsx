import type { Metadata } from "next";
import { ChartSection } from "@/components/ChartSection";
import {
  getInceptionDate,
  getPerformanceSeries,
  getPerformanceSeriesSince,
} from "@/lib/queries";
import { fmtDate, fmtPct } from "@/lib/format";

export const revalidate = 10;
export const metadata: Metadata = { title: "Performance" };

export default async function PerformancePage() {
  const [ytdSeries, inceptionDate] = await Promise.all([
    getPerformanceSeries("YTD").catch(() => []),
    getInceptionDate().catch(() => null),
  ]);

  const sinceSeries = inceptionDate
    ? await getPerformanceSeriesSince(inceptionDate).catch(() => [])
    : [];

  return (
    <div className="space-y-10">
      <h1 className="text-3xl font-semibold tracking-tight">Performance</h1>

      <ChartSection
        ytdSeries={ytdSeries}
        sinceSeries={sinceSeries}
        sinceLabel={inceptionDate ? fmtDate(inceptionDate) : "first trade"}
      />

      {ytdSeries.some((s) => s.points.length >= 2) && (
        <PerformanceTable series={ytdSeries} />
      )}
    </div>
  );
}

function PerformanceTable({
  series,
}: {
  series: Awaited<ReturnType<typeof getPerformanceSeries>>;
}) {
  const allTs = Array.from(
    new Set(series.flatMap((s) => s.points.map((p) => p.t))),
  ).sort();
  const firstBy = (sym: string) =>
    Number(series.find((s) => s.symbol === sym)?.points[0]?.value ?? 0);
  const valueAt = (sym: string, t: string) => {
    const p = series.find((s) => s.symbol === sym)?.points.find((p) => p.t === t);
    return p ? Number(p.value) : null;
  };

  return (
    <section>
      <h2 className="text-sm font-medium text-zinc-500 mb-3">
        Daily returns (YTD)
      </h2>
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
            {allTs
              .slice()
              .reverse()
              .map((t) => (
                <tr
                  key={t}
                  className="border-t border-zinc-200 dark:border-zinc-800"
                >
                  <td className="px-4 py-2">{fmtDate(t)}</td>
                  {series.map((s) => {
                    const base = firstBy(s.symbol);
                    const v = valueAt(s.symbol, t);
                    const pct = base > 0 && v != null ? ((v - base) / base) * 100 : null;
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
    </section>
  );
}
