# Stock Dashboard

A little window into how my AI is doing in the market.

It tracks the portfolio's positions, recent trades, and how it's stacking up
against benchmarks like the S&P 500, the Nasdaq-100, or whatever else I feel
like comparing against. Data refreshes every few minutes.

## Inside

- **`app/`** — the website
- **`data/`** — pulls fresh data from Alpaca on a schedule
- **`infra/`** — the cloud setup, as code

## Stack

Next.js · TypeScript · Tailwind · PostgreSQL · AWS (EC2, RDS, CloudFront, WAF)
· OpenTofu · GitHub Actions

Trading data comes from [Alpaca](https://alpaca.markets).

---

For informational purposes only. Not investment advice.
