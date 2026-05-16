import type { Metadata } from "next";
import { getActivity } from "@/lib/queries";
import { fmtDateTime, fmtUSD } from "@/lib/format";

export const revalidate = 60;
export const metadata: Metadata = { title: "Activity" };

export default async function ActivityPage() {
  const activity = await getActivity(100).catch(() => []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">Activity</h1>
      {activity.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 p-8 text-center text-zinc-500">
          No trades yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">When</th>
                <th className="px-4 py-2 font-medium">Symbol</th>
                <th className="px-4 py-2 font-medium">Side</th>
                <th className="px-4 py-2 font-medium text-right">Qty</th>
                <th className="px-4 py-2 font-medium text-right">Price</th>
                <th className="px-4 py-2 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {activity.map((a) => (
                <tr
                  key={a.id}
                  className="border-t border-zinc-200 dark:border-zinc-800"
                >
                  <td className="px-4 py-2">{fmtDateTime(a.filled_at)}</td>
                  <td className="px-4 py-2 font-medium">{a.symbol}</td>
                  <td
                    className={`px-4 py-2 uppercase text-xs font-semibold ${
                      a.side === "buy"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {a.side}
                  </td>
                  <td className="px-4 py-2 text-right">{a.qty}</td>
                  <td className="px-4 py-2 text-right">{fmtUSD(a.price)}</td>
                  <td className="px-4 py-2 text-right">
                    {fmtUSD(a.qty * a.price)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
