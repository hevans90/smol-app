-- Single-row application config, managed by admins from the frontend.
-- The go-server reads league_name at the start of every poll cycle.
CREATE TABLE "public"."app_config" (
    "id" integer NOT NULL DEFAULT 1,
    "league_name" text NOT NULL,
    "updated_at" timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY ("id"),
    CONSTRAINT "app_config_single_row" CHECK (id = 1)
);

CREATE TRIGGER "set_public_app_config_updated_at"
    BEFORE UPDATE ON "public"."app_config"
    FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER "set_public_app_config_updated_at" ON "public"."app_config"
    IS 'trigger to set value of column "updated_at" to current timestamp on row update';

INSERT INTO "public"."app_config" (id, league_name)
VALUES (1, 'SDRT Smol Djinn Rescue Team (PL78726)');
