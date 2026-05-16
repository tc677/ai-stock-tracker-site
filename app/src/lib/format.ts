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

export const fmtDate = (s: string | Date) =>
  new Date(s).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

export const fmtDateTime = (s: string | Date) =>
  new Date(s).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
