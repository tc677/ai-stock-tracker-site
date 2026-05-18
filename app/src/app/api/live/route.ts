import {
  getActivity,
  getInceptionDate,
  getIntradayPortfolioToday,
  getPerformanceSeriesSince,
  getPositions,
  getPriorPortfolioClose,
  getSummary,
} from "@/lib/queries";

// Single live-data endpoint the client polls to refresh every dynamic
// section without a page reload. Returns the same shape the SSR page
// initially renders with, so client components can hand the result
// straight to the existing display components.
export const dynamic = "force-dynamic";

export async function GET() {
  const [summary, inceptionDate, positions, activity, priorClose, todaySeries] =
    await Promise.all([
      getSummary().catch(() => null),
      getInceptionDate().catch(() => null),
      getPositions().catch(() => []),
      getActivity(100).catch(() => []),
      getPriorPortfolioClose().catch(() => null),
      getIntradayPortfolioToday().catch(() => []),
    ]);

  if (!summary) {
    return Response.json({ error: "no data" }, { status: 503 });
  }

  const sinceSeries = inceptionDate
    ? await getPerformanceSeriesSince(inceptionDate).catch(() => [])
    : [];

  return Response.json(
    {
      summary: {
        portfolioValue: summary.portfolio_value,
        cash: summary.cash,
        updatedAt: summary.updated_at,
      },
      positions,
      activity,
      sinceSeries,
      priorClose,
      inceptionDate,
      todaySeries,
    },
    { headers: { "cache-control": "no-store" } },
  );
}
