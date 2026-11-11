-- Restores the table's shape only: the tags themselves are gone.
CREATE TABLE "public"."user_league_mechanic" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "mechanic" text NOT NULL,
    "user_id" uuid NOT NULL,
    PRIMARY KEY ("id"),
    CONSTRAINT "user_league_mechanic_mechanic_user_id_key" UNIQUE ("mechanic", "user_id"),
    CONSTRAINT "user_league_mechanic_mechanic_fkey" FOREIGN KEY ("mechanic")
        REFERENCES "public"."league_type"("value") ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT "user_league_mechanic_user_id_fkey" FOREIGN KEY ("user_id")
        REFERENCES "public"."user"("id") ON UPDATE RESTRICT ON DELETE CASCADE
);
COMMENT ON TABLE "public"."user_league_mechanic" IS 'League mechanics that a given user is focussing on';
