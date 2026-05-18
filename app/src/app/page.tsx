import { LiveActivity } from "@/components/LiveActivity";
import { LiveAIStatusLine } from "@/components/LiveAIStatusLine";
import { LiveChart } from "@/components/LiveChart";
import {
  LiveDataProvider,
  type LiveSnapshot,
} from "@/components/LiveDataProvider";
import { LiveIntradayChart } from "@/components/LiveIntradayChart";
import { LiveLeaderboard } from "@/components/LiveLeaderboard";
import { LiveOverview } from "@/components/LiveOverview";
import { LivePositionSpotlight } from "@/components/LivePositionSpotlight";
import { LivePositionsTreemap } from "@/components/LivePositionsTreemap";
import { LiveTradeStats } from "@/components/LiveTradeStats";
import {
  computeMaxDrawdown,
  getActivity,
  getInceptionDate,
  getIntradayPortfolioToday,
  getMarketClock,
  getPerformanceSeriesSince,
  getPositions,
  getPriorPortfolioClose,
  getSummary,
  getTradeStats,
} from "@/lib/queries";
import { fmtDate } from "@/lib/format";

export const revalidate = 10;

export default async function Home() {
  const [
    summary,
    inceptionDate,
    positions,
    activity,
    priorClose,
    todaySeries,
    tradeStats,
    marketClock,
  ] = await Promise.all([
    getSummary().catch(() => null),
    getInceptionDate().catch(() => null),
    getPositions().catch(() => []),
    getActivity(100).catch(() => []),
    getPriorPortfolioClose().catch(() => null),
    getIntradayPortfolioToday().catch(() => []),
    getTradeStats().catch(() => null),
    getMarketClock().catch(() => null),
  ]);

  if (!summary) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 p-12 text-center text-zinc-500">
        No data yet. The puller will populate this once it runs.
      </div>
    );
  }

  const sinceSeries = inceptionDate
    ? await getPerformanceSeriesSince(inceptionDate).catch(() => [])
    : [];

  // Seed the live provider with the same snapshot the API would return
  // on its first poll, so the page paints fully populated on first
  // render and the client smoothly tweens from there.
  const initial: LiveSnapshot = {
    summary: {
      portfolioValue: Number(summary.portfolio_value),
      cash: Number(summary.cash),
      updatedAt: summary.updated_at,
    },
    positions,
    activity,
    sinceSeries,
    priorClose,
    inceptionDate,
    todaySeries,
    tradeStats,
    maxDrawdownPct:
      sinceSeries.find((s) => s.symbol === "PORTFOLIO")?.points.length
        ? computeMaxDrawdown(
            sinceSeries.find((s) => s.symbol === "PORTFOLIO")!.points,
          )
        : null,
    marketClock,
  };

  const heroBlock = (
    <section className="space-y-3">
      <h2 className="font-mono text-xl font-semibold tracking-tight lowercase">
        <span className="text-zinc-400 dark:text-zinc-600">&gt;</span> overview
      </h2>
      <div className="text-sm font-medium text-zinc-500 mb-1">
        Portfolio value
      </div>
      <LiveOverview />
      <LivePositionSpotlight />
      <LiveTradeStats />
      <LiveAIStatusLine />
    </section>
  );

  const leaderboardBlock = inceptionDate && sinceSeries.length > 0 && (
    <section className="space-y-3 lg:col-span-2">
      <h2 className="font-mono text-xl font-semibold tracking-tight lowercase">
        <span className="text-zinc-400 dark:text-zinc-600">&gt;</span> leaderboard
      </h2>
      <p className="text-sm text-zinc-500">Since {fmtDate(inceptionDate)}</p>
      <LiveLeaderboard />
    </section>
  );

  const performanceBlock = inceptionDate && sinceSeries.length > 0 && (
    <section className="space-y-3 lg:col-span-2">
      <h2 className="font-mono text-xl font-semibold tracking-tight lowercase">
        <span className="text-zinc-400 dark:text-zinc-600">&gt;</span> performance
      </h2>
      <p className="text-sm text-zinc-500">Since {fmtDate(inceptionDate)}</p>
      <LiveChart />
    </section>
  );

  const todayBlock = (
    <section className="space-y-3">
      <h2 className="font-mono text-xl font-semibold tracking-tight lowercase">
        <span className="text-zinc-400 dark:text-zinc-600">&gt;</span> today
      </h2>
      <p className="text-sm text-zinc-500">
        Intraday portfolio change vs yesterday&rsquo;s close.
      </p>
      <LiveIntradayChart />
    </section>
  );

  const positionsBlock = (
    <section className="space-y-3">
      <h2 className="font-mono text-xl font-semibold tracking-tight lowercase">
        <span className="text-zinc-400 dark:text-zinc-600">&gt;</span> positions
      </h2>
      {positions.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 p-8 text-center text-zinc-500">
          No open positions.
        </div>
      ) : (
        <>
          <p className="text-sm text-zinc-500">
            Tile size = position value. Color = unrealized P/L %.
          </p>
          <LivePositionsTreemap />
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span>≤ -10%</span>
            <span
              className="inline-block h-3 w-32 sm:w-48 rounded-sm"
              style={{
                background:
                  "linear-gradient(to right, rgb(185,28,28), rgb(248,113,113), rgb(82,82,91), rgb(74,222,128), rgb(21,128,61))",
              }}
            />
            <span>≥ +10%</span>
          </div>
        </>
      )}
    </section>
  );

  const activityBlock = (
    <section className="space-y-3">
      <h2 className="font-mono text-xl font-semibold tracking-tight lowercase">
        <span className="text-zinc-400 dark:text-zinc-600">&gt;</span> activity
      </h2>
      <LiveActivity />
    </section>
  );

  return (
    <LiveDataProvider initial={initial}>
      <div className="space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-12 sm:gap-y-16 lg:gap-x-24 lg:gap-y-24">
          {heroBlock}
          {todayBlock}
          {performanceBlock}
          {leaderboardBlock}
          {positionsBlock}
          {activityBlock}
        </div>
      </div>
    </LiveDataProvider>
  );
}
