-- Down Migration to drop indexes, league_rules, leagues, and league_category tables
DROP INDEX IF EXISTS idx_league_rules_league_id;
DROP INDEX IF EXISTS idx_leagues_category_id;
DROP TABLE IF EXISTS league_rules;
DROP TABLE IF EXISTS league;
DROP TABLE IF EXISTS league_category;