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

export const alpaca = {
  account: () => get<AlpacaAccount>("/v2/account"),
  positions: () => get<AlpacaPosition[]>("/v2/positions"),
  filledOrders: (since: Date) =>
    get<AlpacaOrder[]>(
      `/v2/orders?status=filled&after=${since.toISOString()}&direction=desc&limit=500`,
    ),
  clock: () => get<AlpacaClock>("/v2/clock"),
};
