-- Schema-only revert — restores the enum value but cannot un-migrate which
-- individual orders were originally 'transfiguredgem' (one-way data
-- migration, consistent with this project's other data-affecting
-- migrations).
INSERT INTO "public"."item_order_type"("value") VALUES (E'transfiguredgem') ON CONFLICT DO NOTHING;
