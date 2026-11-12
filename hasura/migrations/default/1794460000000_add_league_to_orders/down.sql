DROP TRIGGER set_user_item_order_league ON "public"."user_item_order";
DROP TRIGGER set_bulk_order_league ON "public"."bulk_order";
DROP FUNCTION public.set_order_league();
ALTER TABLE "public"."user_item_order" DROP COLUMN "league";
ALTER TABLE "public"."bulk_order" DROP COLUMN "league";
