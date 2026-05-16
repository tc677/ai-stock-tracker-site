const base = process.env.ALPACA_BASE_URL ?? "https://paper-api.alpaca.markets";

const headers = () => ({
  "APCA-API-KEY-ID": process.env.ALPACA_KEY_ID!,
  "APCA-API-SECRET-KEY": process.env.ALPACA_SECRET_KEY!,
});

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${base}${path}`, { headers: headers() });
  if (!res.ok) {
    throw new Error(`Alpaca ${path} → ${res.status} ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

export type AlpacaAccount = {
  portfolio_value: string;
  cash: string;
  equity: string;
  last_equity: string;
};

export type AlpacaPosition = {
  symbol: string;
  qty: string;
  avg_entry_price: string;
  current_price: string;
  market_value: string;
  unrealized_pl: string;
  unrealized_plpc: string;
};

export type AlpacaOrder = {
  id: string;
  symbol: string;
  side: "buy" | "sell";
  filled_qty: string;
  filled_avg_price: string | null;
  filled_at: string | null;
  status: string;
};

export type AlpacaClock = {
  timestamp: string;
  is_open: boolean;
  next_open: string;
  next_close: string;
};

export type AlpacaPortfolioHistory = {
  timestamp: number[]; // unix seconds
  equity: (number | null)[];
  base_value: number;
  timeframe: string;
};

export const alpaca = {
  account: () => get<AlpacaAccount>("/v2/account"),
  positions: () => get<AlpacaPosition[]>("/v2/positions"),
  // Filled orders since `since`. Paginates by `until` cursor when results
  // hit the per-page limit (500). Caller is responsible for setting `since`
  // back as far as needed; defaults to no filter (all account history) when
  // omitted.
  filledOrders: async (since?: Date): Promise<AlpacaOrder[]> => {
    const out: AlpacaOrder[] = [];
    let until: string | undefined;
    while (true) {
      const params = new URLSearchParams({
        status: "filled",
        direction: "desc",
        limit: "500",
      });
      if (since) params.set("after", since.toISOString());
      if (until) params.set("until", until);
      const page = await get<AlpacaOrder[]>(`/v2/orders?${params.toString()}`);
      out.push(...page);
      if (page.length < 500) break;
      // Page back further: the next page should end strictly before the
      // oldest filled_at we already have.
      const oldest = page[page.length - 1]?.filled_at;
      if (!oldest) break;
      until = oldest;
    }
    return out;
  },
  clock: () => get<AlpacaClock>("/v2/clock"),
  // Pulls historical portfolio equity. period accepts e.g. '1A', '5A', 'all'
  // (Alpaca silently caps 'all' at ~5 years of daily data anyway).
  portfolioHistory: (period = "5A", timeframe = "1D") =>
    get<AlpacaPortfolioHistory>(
      `/v2/account/portfolio/history?period=${period}&timeframe=${timeframe}`,
    ),
};
