const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const pct = new Intl.NumberFormat("en-US", {
  style: "percent",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const fmtUSD = (n: number | null | undefined) =>
  n == null ? "—" : usd.format(n);

export const fmtPct = (n: number | null | undefined) =>
  n == null ? "—" : pct.format(n / 100);

// Dates and times render in Eastern Time, since this dashboard tracks a US
// market account. Server runs in UTC, so we have to force the zone explicitly.
const TIMEZONE = "America/New_York";

export const fmtDate = (s: string | Date) =>
  new Date(s).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: TIMEZONE,
  });

export const fmtDateTime = (s: string | Date) =>
  new Date(s).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: TIMEZONE,
    timeZoneName: "short",
  });
