import type { Metadata } from "next";
import { FilteredChart } from "@/components/FilteredChart";
import {
  getInceptionDate,
  getPerformanceSeriesSince,
} from "@/lib/queries";
import { fmtDate } from "@/lib/format";

export const revalidate = 10;
export const metadata: Metadata = { title: "Performance" };

export default async function PerformancePage() {
  const inceptionDate = await getInceptionDate().catch(() => null);

  if (!inceptionDate) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight">Performance</h1>
        <div className="rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 p-12 text-center text-zinc-500">
          No trades yet. Once your first trade fills, the chart will appear.
        </div>
      </div>
    );
  }

  const series = await getPerformanceSeriesSince(inceptionDate).catch(() => []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Performance</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Since {fmtDate(inceptionDate)}
        </p>
      </div>

      <FilteredChart series={series} />
    </div>
  );
}
