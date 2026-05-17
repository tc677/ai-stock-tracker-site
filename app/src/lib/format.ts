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

// Can't combine dateStyle/timeStyle with timeZoneName per the Intl spec,
// so we spell out the full option set when we want the timezone label.
export const fmtDateTime = (s: string | Date) =>
  new Date(s).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: TIMEZONE,
    timeZoneName: "short",
  });
