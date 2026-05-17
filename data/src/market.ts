// Market data for benchmarks via Stooq. Free CSV download endpoint, no API
// key, no rate limit issues from AWS IPs (which Yahoo aggressively blocks).
//
// Stooq uses its own symbol codes; we map our internal Yahoo-style names to
// Stooq codes when calling.

const STOOQ_SYMBOL: Record<string, string> = {
  "^GSPC": "^spx", // S&P 500
  "^NDX": "^ndx", // Nasdaq-100
  "^RUI": "^rui", // Russell 1000
  "^RUT": "^rut", // Russell 2000
};

const stooqOf = (s: string) => STOOQ_SYMBOL[s] ?? s.toLowerCase();

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
};

// Stooq returns CSV: Date,Open,High,Low,Close,Volume (UTF-8, LF line endings)
async function fetchCsv(
  symbol: string,
  startISO: string,
  endISO: string,
): Promise<{ date: string; close: number }[]> {
  const fmt = (d: Date) =>
    d.toISOString().slice(0, 10).replace(/-/g, "");
  const d1 = fmt(new Date(startISO));
  const d2 = fmt(new Date(endISO));
  const ss = stooqOf(symbol);
  const url = `https://stooq.com/q/d/l/?s=${encodeURIComponent(ss)}&d1=${d1}&d2=${d2}&i=d`;

  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) {
    throw new Error(`Stooq ${symbol} (${ss}) HTTP ${res.status}`);
  }
  const csv = (await res.text()).trim();
  if (!csv || csv.toLowerCase().startsWith("no data")) {
    throw new Error(`Stooq ${symbol} (${ss}): no data returned`);
  }
  const lines = csv.split(/\r?\n/);
  if (!lines[0].startsWith("Date")) {
    throw new Error(`Stooq ${symbol}: unexpected CSV header: ${lines[0]}`);
  }
  const out: { date: string; close: number }[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    if (cols.length < 5) continue;
    const date = cols[0]; // YYYY-MM-DD
    const close = Number(cols[4]);
    if (date && Number.isFinite(close) && close > 0) {
      out.push({ date, close });
    }
  }
  return out;
}

export async function getQuote(symbol: string): Promise<number> {
  // Pull the last week of dailies and take the most recent close.
  const end = new Date();
  const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
  const points = await fetchCsv(symbol, start.toISOString(), end.toISOString());
  return points[points.length - 1]?.close ?? 0;
}

export async function getYtdReturnPct(symbol: string): Promise<number> {
  const start = new Date(new Date().getFullYear(), 0, 1);
  const end = new Date();
  const points = await fetchCsv(symbol, start.toISOString(), end.toISOString());
  if (points.length < 2) return 0;
  const first = points[0].close;
  const last = points[points.length - 1].close;
  if (!first) return 0;
  return ((last - first) / first) * 100;
}

export async function getDailyBars(
  symbol: string,
  startISO: string,
): Promise<{ date: string; close: number }[]> {
  const end = new Date().toISOString();
  return fetchCsv(symbol, startISO, end);
}
