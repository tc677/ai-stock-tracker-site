export type Position = {
  symbol: string;
  qty: number;
  avg_entry_price: number;
  current_price: number;
  market_value: number;
  unrealized_pl: number;
  unrealized_pl_pct: number;
  opened_at: string;
};

export type Activity = {
  id: string;
  symbol: string;
  side: "buy" | "sell";
  qty: number;
  price: number;
  filled_at: string;
};

export type AccountSummary = {
  portfolio_value: number;
  cash: number;
  ytd_return_pct: number;
  ytd_return_dollar: number;
  updated_at: string;
};

export type Benchmark = {
  symbol: string;
  label: string;
  kind: string;
  ytd_pct: number;
  current_price: number;
};

export type TradeStats = {
  closedTrades: number;
  winRate: number;
  avgHoldDays: number;
  // Best/worst single closed trade by realized P/L percent. Null until
  // at least one trade has closed.
  bestTrade: { symbol: string; pct: number } | null;
  worstTrade: { symbol: string; pct: number } | null;
};

export type MarketClock = {
  isOpen: boolean;
  nextOpen: string | null;
  nextClose: string | null;
  capturedAt: string;
};

export type PerformancePoint = { t: string; value: number };

export type PerformanceSeries = {
  symbol: string;
  label: string;
  points: PerformancePoint[];
};
