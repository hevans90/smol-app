-- GGG's API doesn't say which atlas tree a member has selected in game. The
-- Farm page infers it (the tree whose nodes changed most recently, tracked
-- as changed_at inside "trees"), and a member can overrule that by pinning
-- one: its position in "trees", or null for no pin. Set only by the
-- atlas-pin Netlify function.
ALTER TABLE "public"."atlas_snapshot" ADD COLUMN "pinned_tree" integer;

-- fetched_at means "when the atlas was last read from GGG": pinning a tree
-- must not move it, so the trigger now only fires when the atlas is written.
DROP TRIGGER "atlas_snapshot_touch_fetched_at" ON "public"."atlas_snapshot";
CREATE TRIGGER "atlas_snapshot_touch_fetched_at"
    BEFORE INSERT OR UPDATE OF "trees", "raw_trees", "tree_version" ON "public"."atlas_snapshot"
    FOR EACH ROW EXECUTE FUNCTION "public"."atlas_snapshot_touch_fetched_at"();
