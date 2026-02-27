-- No existe pgcrypto en MySQL/MariaDB.
-- Los UUID se generan con UUID()

SET sql_mode = 'STRICT_ALL_TABLES';

CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  country_code CHAR(2) NOT NULL,
  status ENUM('ACTIVE', 'SUSPENDED', 'SELF_EXCLUDED') NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS wallets (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL UNIQUE,
  currency CHAR(3) NOT NULL DEFAULT 'EUR',
  balance_cents BIGINT NOT NULL DEFAULT 0,
  status ENUM('ACTIVE', 'LOCKED') NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_wallets_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE,
  CONSTRAINT chk_wallet_balance_nonneg
    CHECK (balance_cents >= 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  wallet_id CHAR(36) NOT NULL,
  external_ref VARCHAR(100) NULL,
  tx_type ENUM('DEPOSIT', 'WITHDRAW', 'BET', 'PAYOUT', 'ADJUSTMENT') NOT NULL,
  amount_cents BIGINT NOT NULL,
  status ENUM('PENDING', 'COMPLETED', 'FAILED', 'REVERSED') NOT NULL DEFAULT 'COMPLETED',
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_wallet_tx_wallet
    FOREIGN KEY (wallet_id) REFERENCES wallets(id)
    ON DELETE CASCADE,
  CONSTRAINT chk_wallet_tx_amount_pos
    CHECK (amount_cents > 0),
  UNIQUE KEY uq_wallet_tx_external_ref (external_ref)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS games (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  code VARCHAR(40) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(40) NOT NULL,
  status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS game_variants (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  game_id CHAR(36) NOT NULL,
  name VARCHAR(100) NOT NULL,
  min_bet_cents BIGINT NOT NULL,
  max_bet_cents BIGINT NOT NULL,
  house_edge_percent NUMERIC(5,2) NOT NULL,
  status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_variants_game
    FOREIGN KEY (game_id) REFERENCES games(id)
    ON DELETE CASCADE,
  CONSTRAINT chk_variant_min_bet_pos
    CHECK (min_bet_cents > 0),
  CONSTRAINT chk_variant_max_ge_min
    CHECK (max_bet_cents >= min_bet_cents),
  CONSTRAINT chk_variant_house_edge_nonneg
    CHECK (house_edge_percent >= 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS game_tables (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  variant_id CHAR(36) NOT NULL,
  table_code VARCHAR(40) NOT NULL UNIQUE,
  seats SMALLINT NOT NULL,
  is_live BOOLEAN NOT NULL DEFAULT FALSE,
  status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_tables_variant
    FOREIGN KEY (variant_id) REFERENCES game_variants(id)
    ON DELETE CASCADE,
  CONSTRAINT chk_tables_seats_pos
    CHECK (seats > 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS game_sessions (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  table_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP NULL,
  status ENUM('OPEN', 'CLOSED', 'CANCELED') NOT NULL DEFAULT 'OPEN',
  CONSTRAINT fk_sessions_table
    FOREIGN KEY (table_id) REFERENCES game_tables(id),
  CONSTRAINT fk_sessions_user
    FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS bets (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  session_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  wallet_tx_id CHAR(36) NULL,
  amount_cents BIGINT NOT NULL,
  payout_cents BIGINT NOT NULL DEFAULT 0,
  status ENUM('PLACED', 'SETTLED_WIN', 'SETTLED_LOSS', 'SETTLED_PUSH', 'VOID') NOT NULL DEFAULT 'PLACED',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  settled_at TIMESTAMP NULL,
  CONSTRAINT fk_bets_session
    FOREIGN KEY (session_id) REFERENCES game_sessions(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_bets_user
    FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_bets_wallet_tx
    FOREIGN KEY (wallet_tx_id) REFERENCES wallet_transactions(id),
  CONSTRAINT chk_bets_amount_pos
    CHECK (amount_cents > 0),
  CONSTRAINT chk_bets_payout_nonneg
    CHECK (payout_cents >= 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS blackjack_hands (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  bet_id CHAR(36) NOT NULL UNIQUE,
  player_cards JSON NOT NULL,
  dealer_cards JSON NOT NULL,
  final_player_score SMALLINT NULL,
  final_dealer_score SMALLINT NULL,
  result VARCHAR(20) NOT NULL,
  metadata JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_blackjack_bet
    FOREIGN KEY (bet_id) REFERENCES bets(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_wallet_transactions_wallet_id ON wallet_transactions(wallet_id);
CREATE INDEX idx_bets_session_id ON bets(session_id);
CREATE INDEX idx_game_sessions_user_id ON game_sessions(user_id);
