// Market data for benchmarks via Yahoo Finance's free chart endpoint.
// No API key required. Use adjusted close so dividends and splits are
// already accounted for - the returned prices reflect total return.
//
// Symbols use Yahoo's caret-prefixed index format (^GSPC, ^NDX, ^RUI, ^RUT)
// instead of ETF proxies (SPY, QQQ, IWB, IWM) so we measure the indices
// themselves, not the funds' tracking-adjusted approximations.

const BASE = "https://query1.finance.yahoo.com/v8/finance/chart";

// Yahoo blocks default fetch user-agents. A normal browser UA gets through.
const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
};

type ChartResponse = {
  chart: {
    result: Array<{
      timestamp: number[];
      indicators: {
        quote: Array<{ close: (number | null)[] }>;
        adjclose?: Array<{ adjclose: (number | null)[] }>;
      };
    }> | null;
    error: { code: string; description: string } | null;
  };
};

async function fetchChart(
  symbol: string,
  period1: number,
  period2: number,
): Promise<{ ts: number; value: number }[]> {
  const url = `${BASE}/${encodeURIComponent(symbol)}?interval=1d&period1=${period1}&period2=${period2}`;
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) {
    throw new Error(`Yahoo ${symbol} HTTP ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as ChartResponse;
  if (data.chart.error) {
    throw new Error(
      `Yahoo ${symbol}: ${data.chart.error.code} ${data.chart.error.description}`,
    );
  }
  const result = data.chart.result?.[0];
  if (!result) return [];

  const ts = result.timestamp ?? [];
  const adj = result.indicators.adjclose?.[0]?.adjclose;
  const closes = adj ?? result.indicators.quote[0]?.close ?? [];

  const out: { ts: number; value: number }[] = [];
  for (let i = 0; i < ts.length; i++) {
    const v = closes[i];
    if (v != null) out.push({ ts: ts[i], value: v });
  }
  return out;
}

export async function getQuote(symbol: string): Promise<number> {
  const end = Math.floor(Date.now() / 1000);
  const start = end - 7 * 24 * 60 * 60; // look back a week for safety
  const points = await fetchChart(symbol, start, end);
  return points[points.length - 1]?.value ?? 0;
}

export async function getYtdReturnPct(symbol: string): Promise<number> {
  const start = Math.floor(
    new Date(new Date().getFullYear(), 0, 1).getTime() / 1000,
  );
  const end = Math.floor(Date.now() / 1000);
  const points = await fetchChart(symbol, start, end);
  if (points.length < 2) return 0;
  const first = points[0].value;
  const last = points[points.length - 1].value;
  if (!first) return 0;
  return ((last - first) / first) * 100;
}

// Daily closes for a symbol from startISO to now. Used by the backfill.
export async function getDailyBars(
  symbol: string,
  startISO: string,
): Promise<{ date: string; close: number }[]> {
  const start = Math.floor(new Date(startISO).getTime() / 1000);
  const end = Math.floor(Date.now() / 1000);
  const points = await fetchChart(symbol, start, end);
  return points.map((p) => ({
    date: new Date(p.ts * 1000).toISOString().slice(0, 10),
    close: p.value,
  }));
}
