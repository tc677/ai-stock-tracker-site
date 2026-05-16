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

export type PerformancePoint = { t: string; value: number };

export type PerformanceSeries = {
  symbol: string;
  label: string;
  points: PerformancePoint[];
};
