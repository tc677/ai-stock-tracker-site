# Stock Dashboard

A public, read-only dashboard that tracks how an AI-managed stock portfolio is
doing — its positions, recent trades, and year-to-date performance vs. the S&P
500 and Nasdaq-100.

The portfolio trades through [Alpaca](https://alpaca.markets). The dashboard
pulls fresh data every few minutes and caches it at the edge, so visitors
always see a snapshot that's at most a few minutes old.

## What's inside

- **`app/`** — the website itself. Built with Next.js + TypeScript + Tailwind.
  Server-rendered for fast loads and good SEO.
- **`data/`** — a small program that pulls the latest account info, positions,
  and trades from Alpaca and writes them to the database. Runs on a schedule.
- **`infra/`** — the AWS setup, described as code with
  [OpenTofu](https://opentofu.org). One command brings the whole stack up.

## How it's hosted

```
Visitors → CloudFront (CDN + WAF) → EC2 (web) → Postgres
                                       ↑
                                   scheduled puller → Alpaca
```

CloudFront caches pages at the edge, so the origin server stays quiet even
under load. Total monthly cost runs around $35–40 on AWS.

## Running it

If you want to spin up your own copy, see [`DEPLOY.md`](./DEPLOY.md) for the
step-by-step.

## Tech stack

| Layer | Tool |
|---|---|
| Web framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | PostgreSQL on Amazon RDS |
| Hosting | Amazon EC2 + CloudFront + WAF |
| Infrastructure | OpenTofu |
| CI/CD | GitHub Actions → Amazon ECR |
| Data source | Alpaca Markets API |

## Notes

The dashboard shows trading activity for educational and informational
purposes only. Nothing here is investment advice.
