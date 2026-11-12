-- The game version the configured league runs on. It picks which atlas tree
-- the Farm page and atlas sync read node hashes against, so it changes with
-- the league, from Admin.
ALTER TABLE "public"."app_config" ADD COLUMN "game_version" text NOT NULL DEFAULT '3.29.1';
