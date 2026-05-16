import { getBenchmarks, getSummary } from "@/lib/queries";
import { fmtDateTime, fmtPct, fmtUSD } from "@/lib/format";

export const revalidate = 60;

export default async function Home() {
  const [summary, benchmarks] = await Promise.all([
    getSummary().catch(() => null),
    getBenchmarks().catch(() => []),
  ]);

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-semibold tracking-tight">Overview</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-1">
          Live performance of an AI-managed portfolio, compared against the
          benchmarks below.
        </p>
      </section>

      {!summary ? (
        <div className="rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 p-8 text-center text-zinc-500">
          No data yet. The puller will populate this once it runs.
        </div>
      ) : (
        <>
          <section className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Stat label="Portfolio value" value={fmtUSD(summary.portfolio_value)} />
            <Stat label="Cash" value={fmtUSD(summary.cash)} />
            <Stat
              label="YTD return"
              value={fmtPct(summary.ytd_return_pct)}
              sub={fmtUSD(summary.ytd_return_dollar)}
              positive={summary.ytd_return_pct >= 0}
            />
          </section>

          {benchmarks.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-3">vs. Benchmarks (YTD)</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {benchmarks.map((b) => {
                  const diff = summary.ytd_return_pct - b.ytd_pct;
                  const positive = diff >= 0;
                  return (
                    <Stat
                      key={b.symbol}
                      label={`${b.label} (${b.symbol})`}
                      value={fmtPct(diff)}
                      sub={`${b.symbol}: ${fmtPct(b.ytd_pct)}`}
                      positive={positive}
                    />
                  );
                })}
              </div>
            </section>
          )}

          <p className="text-xs text-zinc-500">
            Updated {fmtDateTime(summary.updated_at)}
          </p>
        </>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  positive,
}: {
  label: string;
  value: string;
  sub?: string;
  positive?: boolean;
}) {
  const color =
    positive === undefined
      ? ""
      : positive
        ? "text-emerald-600 dark:text-emerald-400"
        : "text-rose-600 dark:text-rose-400";
  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
      <div className="text-xs uppercase tracking-wide text-zinc-500">{label}</div>
      <div className={`mt-2 text-2xl font-semibold ${color}`}>{value}</div>
      {sub && <div className="mt-1 text-xs text-zinc-500">{sub}</div>}
    </div>
  );
}
