-- Migration to create leagues, league_category, and league_rules tables in PostgreSQL

-- 1. Create league_category table
CREATE TABLE league_category (
    id UUID PRIMARY KEY,
    current BOOLEAN NOT NULL
);

-- 2. Create league table
CREATE TABLE league (
    id UUID PRIMARY KEY,
    realm VARCHAR(255) NOT NULL,
    url VARCHAR(255),
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    description TEXT,
    category_id UUID REFERENCES league_category(id) ON DELETE SET NULL,
    register_at TIMESTAMPTZ NOT NULL,
    delve_event BOOLEAN NOT NULL
);

-- 3. Create league_rules table
CREATE TABLE league_rules (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    league_id UUID REFERENCES league(id) ON DELETE CASCADE
);

-- Optional: create indexes for foreign key columns for better performance on joins
CREATE INDEX idx_leagues_category_id ON league(category_id);
CREATE INDEX idx_league_rules_league_id ON league_rules(league_id);
