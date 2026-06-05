# Stock Dashboard

Site to track how my AI Trading bot is doing

Live at [canmyaitrade.com](https://canmyaitrade.com)

It tracks the portfolio's positions, recent trades, and how it's fares
against other ETFs. Data refreshes every minute during market hours.

## Inside

- **`app/`** — site
- **`data/`** — data refresh
- **`infra/`** — infra

## How it flows

```
Visitors → CloudFront (CDN + WAF) → internal ALB → Fargate (web) → Postgres
                                                                       ↑
                          EventBridge → Fargate (puller) → Alpaca ─────┘
```

## Stack

Next.js · TypeScript · Tailwind · PostgreSQL · AWS (ECS Fargate, RDS,
CloudFront, WAF, ALB, EventBridge) · OpenTofu · GitHub Actions

Trading data comes from [Alpaca](https://alpaca.markets).

---

For informational purposes only. Not investment advice.
