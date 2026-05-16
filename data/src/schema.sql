-- Snapshot of the account, appended every puller run.
CREATE TABLE IF NOT EXISTS account_snapshot (
  id                  BIGSERIAL PRIMARY KEY,
  portfolio_value     NUMERIC(18, 2) NOT NULL,
  cash                NUMERIC(18, 2) NOT NULL,
  ytd_return_pct      NUMERIC(8, 4)  NOT NULL,
  ytd_return_dollar   NUMERIC(18, 2) NOT NULL,
  updated_at          TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS account_snapshot_updated_at_idx
  ON account_snapshot (updated_at DESC);

-- Current open positions, replaced each run.
CREATE TABLE IF NOT EXISTS positions (
  symbol              TEXT PRIMARY KEY,
  qty                 NUMERIC(18, 6) NOT NULL,
  avg_entry_price     NUMERIC(18, 4) NOT NULL,
  current_price       NUMERIC(18, 4) NOT NULL,
  market_value        NUMERIC(18, 2) NOT NULL,
  unrealized_pl       NUMERIC(18, 2) NOT NULL,
  unrealized_pl_pct   NUMERIC(8, 4)  NOT NULL,
  opened_at           TIMESTAMPTZ    NOT NULL,
  updated_at          TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- Trade activity, append-only, idempotent by id.
CREATE TABLE IF NOT EXISTS activity (
  id                  TEXT PRIMARY KEY,
  symbol              TEXT NOT NULL,
  side                TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
  qty                 NUMERIC(18, 6) NOT NULL,
  price               NUMERIC(18, 4) NOT NULL,
  filled_at           TIMESTAMPTZ    NOT NULL
);

CREATE INDEX IF NOT EXISTS activity_filled_at_idx
  ON activity (filled_at DESC);

-- Benchmarks we compare the portfolio against. Anything with a tradable
-- symbol on Alpaca works: index ETFs (SPY, QQQ, DIA, IWM), international
-- (EFA, VWO, ACWX), sectors (XLK, XLF), or individual stocks (AAPL).
CREATE TABLE IF NOT EXISTS benchmarks (
  symbol      TEXT PRIMARY KEY,
  label       TEXT NOT NULL,
  kind        TEXT NOT NULL DEFAULT 'etf',
  sort_order  INT  NOT NULL DEFAULT 100
);

-- Seed two starter benchmarks. Add more by inserting a row — no code change.
INSERT INTO benchmarks (symbol, label, kind, sort_order) VALUES
  ('SPY', 'S&P 500',    'etf', 10),
  ('QQQ', 'Nasdaq-100', 'etf', 20)
ON CONFLICT (symbol) DO NOTHING;

-- Latest snapshot per benchmark, upserted each puller run.
CREATE TABLE IF NOT EXISTS benchmark_snapshot (
  symbol        TEXT PRIMARY KEY REFERENCES benchmarks(symbol) ON DELETE CASCADE,
  current_price NUMERIC(18, 4) NOT NULL,
  ytd_pct       NUMERIC(8, 4)  NOT NULL,
  updated_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- Daily value series for charting. symbol = a benchmark symbol OR the
-- reserved string 'PORTFOLIO' for our own portfolio value.
CREATE TABLE IF NOT EXISTS performance_daily (
  date    DATE NOT NULL,
  symbol  TEXT NOT NULL,
  value   NUMERIC(18, 4) NOT NULL,
  PRIMARY KEY (date, symbol)
);

CREATE INDEX IF NOT EXISTS performance_daily_symbol_idx
  ON performance_daily (symbol, date);
