CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
    CREATE TYPE user_status AS ENUM ('ACTIVE', 'SUSPENDED', 'SELF_EXCLUDED');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'wallet_status') THEN
    CREATE TYPE wallet_status AS ENUM ('ACTIVE', 'LOCKED');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tx_type') THEN
    CREATE TYPE tx_type AS ENUM ('DEPOSIT', 'WITHDRAW', 'BET', 'PAYOUT', 'ADJUSTMENT');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tx_status') THEN
    CREATE TYPE tx_status AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REVERSED');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'game_status') THEN
    CREATE TYPE game_status AS ENUM ('ACTIVE', 'INACTIVE');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'session_status') THEN
    CREATE TYPE session_status AS ENUM ('OPEN', 'CLOSED', 'CANCELED');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'bet_status') THEN
    CREATE TYPE bet_status AS ENUM ('PLACED', 'SETTLED_WIN', 'SETTLED_LOSS', 'SETTLED_PUSH', 'VOID');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  country_code CHAR(2) NOT NULL,
  status user_status NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  currency CHAR(3) NOT NULL DEFAULT 'EUR',
  balance_cents BIGINT NOT NULL DEFAULT 0 CHECK (balance_cents >= 0),
  status wallet_status NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  external_ref VARCHAR(100),
  tx_type tx_type NOT NULL,
  amount_cents BIGINT NOT NULL CHECK (amount_cents > 0),
  status tx_status NOT NULL DEFAULT 'COMPLETED',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (external_ref)
);

CREATE TABLE IF NOT EXISTS games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(40) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(40) NOT NULL,
  status game_status NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS game_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  min_bet_cents BIGINT NOT NULL CHECK (min_bet_cents > 0),
  max_bet_cents BIGINT NOT NULL CHECK (max_bet_cents >= min_bet_cents),
  house_edge_percent NUMERIC(5,2) NOT NULL CHECK (house_edge_percent >= 0),
  status game_status NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS game_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id UUID NOT NULL REFERENCES game_variants(id) ON DELETE CASCADE,
  table_code VARCHAR(40) NOT NULL UNIQUE,
  seats SMALLINT NOT NULL CHECK (seats > 0),
  is_live BOOLEAN NOT NULL DEFAULT FALSE,
  status game_status NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID NOT NULL REFERENCES game_tables(id),
  user_id UUID NOT NULL REFERENCES users(id),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  status session_status NOT NULL DEFAULT 'OPEN'
);

CREATE TABLE IF NOT EXISTS bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  wallet_tx_id UUID REFERENCES wallet_transactions(id),
  amount_cents BIGINT NOT NULL CHECK (amount_cents > 0),
  payout_cents BIGINT NOT NULL DEFAULT 0 CHECK (payout_cents >= 0),
  status bet_status NOT NULL DEFAULT 'PLACED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  settled_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS blackjack_hands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bet_id UUID NOT NULL UNIQUE REFERENCES bets(id) ON DELETE CASCADE,
  player_cards JSONB NOT NULL,
  dealer_cards JSONB NOT NULL,
  final_player_score SMALLINT,
  final_dealer_score SMALLINT,
  result VARCHAR(20) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet_id ON wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_bets_session_id ON bets(session_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_id ON game_sessions(user_id);
