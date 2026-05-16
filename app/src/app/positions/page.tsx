import type { Metadata } from "next";
import { getPositions } from "@/lib/queries";
import { fmtDate, fmtPct, fmtUSD } from "@/lib/format";

export const revalidate = 60;
export const metadata: Metadata = { title: "Positions" };

export default async function PositionsPage() {
  const positions = await getPositions().catch(() => []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">Positions</h1>
      {positions.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 p-8 text-center text-zinc-500">
          No open positions.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900 text-left">
              <tr>
                <Th>Symbol</Th>
                <Th align="right">Qty</Th>
                <Th align="right">Avg entry</Th>
                <Th align="right">Current</Th>
                <Th align="right">Market value</Th>
                <Th align="right">Unrealized P/L</Th>
                <Th>Opened</Th>
              </tr>
            </thead>
            <tbody>
              {positions.map((p) => {
                const positive = p.unrealized_pl >= 0;
                const color = positive
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400";
                return (
                  <tr
                    key={p.symbol}
                    className="border-t border-zinc-200 dark:border-zinc-800"
                  >
                    <Td>
                      <span className="font-medium">{p.symbol}</span>
                    </Td>
                    <Td align="right">{p.qty}</Td>
                    <Td align="right">{fmtUSD(p.avg_entry_price)}</Td>
                    <Td align="right">{fmtUSD(p.current_price)}</Td>
                    <Td align="right">{fmtUSD(p.market_value)}</Td>
                    <Td align="right">
                      <span className={color}>
                        {fmtUSD(p.unrealized_pl)} ({fmtPct(p.unrealized_pl_pct)})
                      </span>
                    </Td>
                    <Td>{fmtDate(p.opened_at)}</Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Th({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      className={`px-4 py-2 font-medium text-zinc-600 dark:text-zinc-400 text-${align}`}
    >
      {children}
    </th>
  );
}
function Td({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return <td className={`px-4 py-2 text-${align}`}>{children}</td>;
}
