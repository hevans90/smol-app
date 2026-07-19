CREATE TABLE "public"."character_stats" (
    "character_id" text NOT NULL,
    "main_skill" text,
    "combined_dps" double precision NOT NULL DEFAULT 0,
    "total_dps" double precision NOT NULL DEFAULT 0,
    "full_dps" double precision NOT NULL DEFAULT 0,
    "total_dot_dps" double precision NOT NULL DEFAULT 0,
    "life" double precision NOT NULL DEFAULT 0,
    "life_unreserved" double precision NOT NULL DEFAULT 0,
    "energy_shield" double precision NOT NULL DEFAULT 0,
    "mana" double precision NOT NULL DEFAULT 0,
    "ward" double precision NOT NULL DEFAULT 0,
    "total_ehp" double precision NOT NULL DEFAULT 0,
    "armour" double precision NOT NULL DEFAULT 0,
    "evasion" double precision NOT NULL DEFAULT 0,
    "block_chance" double precision NOT NULL DEFAULT 0,
    "spell_block_chance" double precision NOT NULL DEFAULT 0,
    "spell_suppression_chance" double precision NOT NULL DEFAULT 0,
    "fire_resist" double precision NOT NULL DEFAULT 0,
    "cold_resist" double precision NOT NULL DEFAULT 0,
    "lightning_resist" double precision NOT NULL DEFAULT 0,
    "chaos_resist" double precision NOT NULL DEFAULT 0,
    "crit_chance" double precision NOT NULL DEFAULT 0,
    "crit_multiplier" double precision NOT NULL DEFAULT 0,
    "attack_speed" double precision NOT NULL DEFAULT 0,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY ("character_id"),
    FOREIGN KEY ("character_id") REFERENCES "public"."character"("id") ON UPDATE restrict ON DELETE cascade
);

CREATE TRIGGER "set_public_character_stats_updated_at"
    BEFORE UPDATE ON "public"."character_stats"
    FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER "set_public_character_stats_updated_at" ON "public"."character_stats"
    IS 'trigger to set value of column "updated_at" to current timestamp on row update';
