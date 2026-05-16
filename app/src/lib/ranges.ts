export type Range = "1D" | "1W" | "1M" | "3M" | "YTD" | "1Y" | "ALL";

export const RANGES: Range[] = ["1D", "1W", "1M", "3M", "YTD", "1Y", "ALL"];

export const RANGE_LABELS: Record<Range, string> = {
  "1D": "1D",
  "1W": "1W",
  "1M": "1M",
  "3M": "3M",
  YTD: "YTD",
  "1Y": "1Y",
  ALL: "All",
};

// The 1D view uses minute-level intraday data; everything else uses daily.
export const isIntraday = (range: Range) => range === "1D";

// Postgres interval string the query uses to bound the WHERE clause.
export function rangeSinceClause(range: Range): string {
  switch (range) {
    case "1D":
      return "ts >= date_trunc('day', NOW() AT TIME ZONE 'America/New_York') AT TIME ZONE 'America/New_York'";
    case "1W":
      return "date >= CURRENT_DATE - INTERVAL '7 days'";
    case "1M":
      return "date >= CURRENT_DATE - INTERVAL '1 month'";
    case "3M":
      return "date >= CURRENT_DATE - INTERVAL '3 months'";
    case "YTD":
      return "date >= date_trunc('year', CURRENT_DATE)";
    case "1Y":
      return "date >= CURRENT_DATE - INTERVAL '1 year'";
    case "ALL":
      return "TRUE";
  }
}
