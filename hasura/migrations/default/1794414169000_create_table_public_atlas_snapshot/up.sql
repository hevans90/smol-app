-- A member's allocated atlas passive trees for a league, captured from GGG's
-- /league-account endpoint by the atlas-* Netlify functions for members who
-- opted in (see atlas_connection). The Farm page turns the node hashes into
-- farming strategies
-- using the generated src/assets/atlas/atlas-<tree_version>.json lookup.
--
-- One row per member per league: a sync overwrites the previous capture.
-- Members can read it; only the Netlify functions write it.
CREATE TABLE "public"."atlas_snapshot" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "user_id" uuid NOT NULL,
    "league" text NOT NULL,
    -- which atlas tree export the hashes belong to (e.g. "3.30.0"); node ids
    -- are reshuffled every league, so hashes are meaningless without it
    "tree_version" text NOT NULL,
    -- normalised: [{ "name": text, "hashes": [int, ...] }, ...]
    "trees" jsonb NOT NULL,
    -- GGG's atlas payload exactly as received, so a format change only needs
    -- a new parser, not a re-sync by every member
    "raw_trees" jsonb NOT NULL,
    "fetched_at" timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY ("id"),
    CONSTRAINT "atlas_snapshot_user_id_fkey" FOREIGN KEY ("user_id")
        REFERENCES "public"."user"("id") ON UPDATE RESTRICT ON DELETE CASCADE,
    CONSTRAINT "atlas_snapshot_user_id_league_key" UNIQUE ("user_id", "league"),
    CONSTRAINT "atlas_snapshot_trees_is_array" CHECK (jsonb_typeof(trees) = 'array')
);

-- fetched_at is server time on every write, whatever the client sends
CREATE FUNCTION "public"."atlas_snapshot_touch_fetched_at"() RETURNS trigger
    LANGUAGE plpgsql AS $$
BEGIN
    NEW.fetched_at := now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER "atlas_snapshot_touch_fetched_at"
    BEFORE INSERT OR UPDATE ON "public"."atlas_snapshot"
    FOR EACH ROW EXECUTE FUNCTION "public"."atlas_snapshot_touch_fetched_at"();
