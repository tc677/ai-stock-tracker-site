// Market data for benchmarks. Single source: Alpaca's data API.
//   - /v2/stocks/{sym}/trades/latest for the current price.
//   - /v2/stocks/{sym}/bars (timeframe=1Day, adjustment=all) for history.
//
// We use ETF proxies (SPY, QQQ, IWB, IWM) rather than raw index symbols
// since Alpaca's data API is for tradable instruments. adjustment=all
// applies both splits and dividends so total-return comparisons are honest
// — without it, dividend-heavy ETFs (e.g. IWM) show fake large drops.

const ALPACA_DATA_BASE = "https://data.alpaca.markets/v2";

const alpacaHeaders = () => ({
  "APCA-API-KEY-ID": process.env.ALPACA_KEY_ID!,
  "APCA-API-SECRET-KEY": process.env.ALPACA_SECRET_KEY!,
});

export async function getQuote(symbol: string): Promise<number> {
  const url = `${ALPACA_DATA_BASE}/stocks/${symbol}/trades/latest`;
  const res = await fetch(url, { headers: alpacaHeaders() });
  if (!res.ok) {
    throw new Error(`Alpaca latest trade ${symbol} HTTP ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as { trade?: { p: number } };
  const price = data.trade?.p;
  if (!price || price === 0) {
    throw new Error(`Alpaca latest trade ${symbol}: zero/missing price`);
  }
  return price;
}

export async function getYtdReturnPct(symbol: string): Promise<number> {
  const start = new Date(new Date().getFullYear(), 0, 1).toISOString();
  const url = `${ALPACA_DATA_BASE}/stocks/${symbol}/bars?timeframe=1Day&start=${start}&limit=500&adjustment=all`;
  const res = await fetch(url, { headers: alpacaHeaders() });
  if (!res.ok) {
    throw new Error(`Alpaca bars ${symbol} HTTP ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as {
    bars: Array<{ o: number; c: number }> | null;
  };
  const bars = data.bars ?? [];
  if (bars.length < 2) return 0;
  const first = bars[0].o;
  const last = bars[bars.length - 1].c;
  if (!first) return 0;
  return ((last - first) / first) * 100;
}

// Historical daily bars from Alpaca, used for backfill. Paginates when
// Alpaca's per-page limit (10000) is hit.
export async function getDailyBars(
  symbol: string,
  startISO: string,
): Promise<{ date: string; close: number }[]> {
  const out: { date: string; close: number }[] = [];
  let pageToken: string | null = null;
  do {
    const tokenQs: string = pageToken ? `&page_token=${pageToken}` : "";
    const url = `${ALPACA_DATA_BASE}/stocks/${symbol}/bars?timeframe=1Day&start=${startISO}&limit=10000&adjustment=all${tokenQs}`;
    const res = await fetch(url, { headers: alpacaHeaders() });
    if (!res.ok) {
      throw new Error(`Alpaca bars ${symbol} HTTP ${res.status}: ${await res.text()}`);
    }
    const data = (await res.json()) as {
      bars: Array<{ t: string; c: number }> | null;
      next_page_token: string | null;
    };
    for (const b of data.bars ?? []) {
      out.push({ date: b.t.slice(0, 10), close: b.c });
    }
    pageToken = data.next_page_token;
  } while (pageToken);
  return out;
}
