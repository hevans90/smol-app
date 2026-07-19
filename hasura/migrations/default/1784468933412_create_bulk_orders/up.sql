-- Bulk orders: quantity-based orders ("I want 100 Screaming Essence of
-- Contempt") that guild members fulfill in portions via contribution rows.
-- See docs/bulk-orders-plan.md for full design.

CREATE TABLE public.bulk_order (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    item_name text NOT NULL,
    description text,
    icon_url text,
    link_url text,
    quantity integer NOT NULL,
    cancelled_at timestamptz,
    completed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES public."user"(id) ON UPDATE restrict ON DELETE cascade,
    CONSTRAINT bulk_order_quantity_positive CHECK (quantity > 0)
);

CREATE TRIGGER set_public_bulk_order_updated_at
    BEFORE UPDATE ON public.bulk_order
    FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_bulk_order_updated_at ON public.bulk_order
    IS 'trigger to set value of column "updated_at" to current timestamp on row update';

CREATE TABLE public.bulk_order_contribution (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    bulk_order_id uuid NOT NULL,
    user_id uuid NOT NULL,
    quantity integer NOT NULL,
    delivery text NOT NULL DEFAULT 'gstash',
    note text,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (id),
    FOREIGN KEY (bulk_order_id) REFERENCES public.bulk_order(id) ON UPDATE restrict ON DELETE cascade,
    FOREIGN KEY (user_id) REFERENCES public."user"(id) ON UPDATE restrict ON DELETE cascade,
    CONSTRAINT bulk_order_contribution_quantity_positive CHECK (quantity > 0),
    CONSTRAINT bulk_order_contribution_delivery_valid CHECK (delivery IN ('gstash', 'dm'))
);

CREATE INDEX bulk_order_contribution_bulk_order_id_idx
    ON public.bulk_order_contribution (bulk_order_id);

-- Reject contributions to a cancelled/completed order, and reject overshoot,
-- atomically. Locking the parent row first serializes concurrent contributors.
CREATE FUNCTION public.bulk_order_contribution_guard() RETURNS trigger
    LANGUAGE plpgsql AS $$
DECLARE
  parent public.bulk_order%ROWTYPE;
  contributed integer;
BEGIN
  SELECT * INTO parent FROM public.bulk_order
    WHERE id = NEW.bulk_order_id FOR UPDATE;
  IF parent.cancelled_at IS NOT NULL THEN
    RAISE EXCEPTION 'bulk order is cancelled';
  END IF;
  IF parent.completed_at IS NOT NULL THEN
    RAISE EXCEPTION 'bulk order is already complete';
  END IF;
  SELECT COALESCE(SUM(quantity), 0) INTO contributed
    FROM public.bulk_order_contribution WHERE bulk_order_id = NEW.bulk_order_id;
  IF contributed + NEW.quantity > parent.quantity THEN
    RAISE EXCEPTION 'contribution exceeds remaining quantity (% remaining)',
      parent.quantity - contributed;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER bulk_order_contribution_guard
    BEFORE INSERT ON public.bulk_order_contribution
    FOR EACH ROW EXECUTE FUNCTION public.bulk_order_contribution_guard();

-- Recompute completed_at after any contribution insert/delete. A withdrawal
-- that drops the sum below quantity automatically reopens the order.
CREATE FUNCTION public.bulk_order_recompute_completed() RETURNS trigger
    LANGUAGE plpgsql AS $$
DECLARE
  target_id uuid := COALESCE(NEW.bulk_order_id, OLD.bulk_order_id);
  parent public.bulk_order%ROWTYPE;
  contributed integer;
BEGIN
  SELECT * INTO parent FROM public.bulk_order WHERE id = target_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN NULL; -- parent already gone (cascade delete)
  END IF;
  SELECT COALESCE(SUM(quantity), 0) INTO contributed
    FROM public.bulk_order_contribution WHERE bulk_order_id = target_id;
  IF contributed >= parent.quantity AND parent.completed_at IS NULL THEN
    UPDATE public.bulk_order SET completed_at = now() WHERE id = target_id;
  ELSIF contributed < parent.quantity AND parent.completed_at IS NOT NULL THEN
    UPDATE public.bulk_order SET completed_at = NULL WHERE id = target_id;
  END IF;
  RETURN NULL;
END $$;

CREATE TRIGGER bulk_order_recompute_completed
    AFTER INSERT OR DELETE ON public.bulk_order_contribution
    FOR EACH ROW EXECUTE FUNCTION public.bulk_order_recompute_completed();

-- Owner edits to quantity: can never drop below what's already contributed;
-- re-derive completed_at (raising qty on a completed order reopens it).
CREATE FUNCTION public.bulk_order_quantity_guard() RETURNS trigger
    LANGUAGE plpgsql AS $$
DECLARE
  contributed integer;
BEGIN
  SELECT COALESCE(SUM(quantity), 0) INTO contributed
    FROM public.bulk_order_contribution WHERE bulk_order_id = NEW.id;
  IF NEW.quantity < contributed THEN
    RAISE EXCEPTION 'quantity cannot be lower than already-contributed amount (%)', contributed;
  END IF;
  IF contributed >= NEW.quantity THEN
    NEW.completed_at := COALESCE(NEW.completed_at, now());
  ELSE
    NEW.completed_at := NULL;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER bulk_order_quantity_guard
    BEFORE UPDATE OF quantity ON public.bulk_order
    FOR EACH ROW EXECUTE FUNCTION public.bulk_order_quantity_guard();
