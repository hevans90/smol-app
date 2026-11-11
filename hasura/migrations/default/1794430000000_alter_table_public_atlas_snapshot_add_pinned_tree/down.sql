DROP TRIGGER "atlas_snapshot_touch_fetched_at" ON "public"."atlas_snapshot";
CREATE TRIGGER "atlas_snapshot_touch_fetched_at"
    BEFORE INSERT OR UPDATE ON "public"."atlas_snapshot"
    FOR EACH ROW EXECUTE FUNCTION "public"."atlas_snapshot_touch_fetched_at"();
ALTER TABLE "public"."atlas_snapshot" DROP COLUMN "pinned_tree";
