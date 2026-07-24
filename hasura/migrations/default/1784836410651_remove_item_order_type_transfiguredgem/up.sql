-- Retire the legacy 'transfiguredgem' order type — the unified search flow
-- (OrderForm.tsx/OrderSearchPicker.tsx) has produced only 'gem' for
-- transfigured (and regular/Vaal) gems since that feature shipped;
-- transfigured-ness is carried as data (gems.json's `transfigured`/
-- `baseGemName` fields), not a second enum branch. Migrate any existing
-- rows first — the FK from user_item_order.type would otherwise block
-- deleting the enum row.
UPDATE "public"."user_item_order" SET "type" = 'gem' WHERE "type" = 'transfiguredgem';
DELETE FROM "public"."item_order_type" WHERE "value" = 'transfiguredgem';
