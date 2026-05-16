// Market data via Alpaca's data API (uses the same keys as trading).
// Free tier provides IEX-feed data, which is plenty for index quotes.

const base = "https://data.alpaca.markets/v2";

const headers = () => ({
  "APCA-API-KEY-ID": process.env.ALPACA_KEY_ID!,
  "APCA-API-SECRET-KEY": process.env.ALPACA_SECRET_KEY!,
});

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${base}${path}`, { headers: headers() });
  if (!res.ok) {
    throw new Error(`Alpaca data ${path} → ${res.status} ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

type LatestQuoteResp = {
  quote: { ap: number; bp: number };
};

type BarsResp = {
  bars: Array<{ t: string; c: number; o: number }>;
  next_page_token: string | null;
};

export async function getQuote(symbol: string): Promise<number> {
  const r = await get<LatestQuoteResp>(`/stocks/${symbol}/quotes/latest`);
  return (r.quote.ap + r.quote.bp) / 2;
}

export async function getYtdReturnPct(symbol: string): Promise<number> {
  const start = new Date(new Date().getFullYear(), 0, 1).toISOString();
  const r = await get<BarsResp>(
    `/stocks/${symbol}/bars?timeframe=1Day&start=${start}&limit=500&adjustment=split`,
  );
  const bars = r.bars ?? [];
  if (bars.length < 2) return 0;
  const first = bars[0].o;
  const last = bars[bars.length - 1].c;
  if (!first) return 0;
  return ((last - first) / first) * 100;
}

// Fetches daily closing prices for a symbol over a range. Used for backfill
// of benchmark history. Paginates if Alpaca returns next_page_token.
export async function getDailyBars(
  symbol: string,
  startISO: string,
): Promise<{ date: string; close: number }[]> {
  const out: { date: string; close: number }[] = [];
  let token: string | null = null;
  do {
    const tokenQs: string = token ? `&page_token=${token}` : "";
    const r: BarsResp = await get<BarsResp>(
      `/stocks/${symbol}/bars?timeframe=1Day&start=${startISO}&limit=10000&adjustment=split${tokenQs}`,
    );
    for (const b of r.bars ?? []) {
      out.push({ date: b.t.slice(0, 10), close: b.c });
    }
    token = r.next_page_token;
  } while (token);
  return out;
}
