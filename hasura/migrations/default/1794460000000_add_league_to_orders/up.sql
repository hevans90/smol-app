-- Orders belong to the league they were placed in, so switching the league in
-- Admin starts a fresh order board.

-- Orders from before leagues were tracked are dropped rather than guessed at.
TRUNCATE "public"."bulk_order_contribution", "public"."bulk_order", "public"."user_item_order";

ALTER TABLE "public"."user_item_order" ADD COLUMN "league" text NOT NULL;
ALTER TABLE "public"."bulk_order" ADD COLUMN "league" text NOT NULL;

-- New orders take the configured league. A column default can't run a query,
-- so a trigger fills it; clients never send it (it isn't in their insert
-- columns).
CREATE FUNCTION public.set_order_league() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.league IS NULL THEN
        SELECT league_name INTO NEW.league FROM public.app_config WHERE id = 1;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER set_user_item_order_league
    BEFORE INSERT ON "public"."user_item_order"
    FOR EACH ROW EXECUTE FUNCTION public.set_order_league();
CREATE TRIGGER set_bulk_order_league
    BEFORE INSERT ON "public"."bulk_order"
    FOR EACH ROW EXECUTE FUNCTION public.set_order_league();

CREATE INDEX user_item_order_league_idx ON "public"."user_item_order" (league);
CREATE INDEX bulk_order_league_idx ON "public"."bulk_order" (league);
