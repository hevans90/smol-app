SET check_function_bodies = false;
CREATE FUNCTION public.set_current_timestamp_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  _new record;
BEGIN
  _new := NEW;
  _new."updated_at" = NOW();
  RETURN _new;
END;
$$;
CREATE TABLE public.item_order_type (
    value text NOT NULL
);
CREATE TABLE public.league_type (
    value text NOT NULL
);
CREATE TABLE public."user" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    discord_user_id text,
    discord_name text,
    poe_user_id text,
    poe_name text,
    discord_avatar text,
    guild text
);
CREATE TABLE public.user_item_order (
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    description text,
    link_url text,
    fulfilled_by uuid,
    type text DEFAULT 'other'::text NOT NULL,
    priority boolean DEFAULT false NOT NULL
);
COMMENT ON TABLE public.user_item_order IS 'Item orders by specific users';
CREATE TABLE public.user_league_mechanic (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    mechanic text NOT NULL,
    user_id uuid NOT NULL
);
COMMENT ON TABLE public.user_league_mechanic IS 'League mechanics that a given user is focussing on';
ALTER TABLE ONLY public.item_order_type
    ADD CONSTRAINT item_order_type_pkey PRIMARY KEY (value);
ALTER TABLE ONLY public.league_type
    ADD CONSTRAINT league_type_pkey PRIMARY KEY (value);
ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_discord_user_id_key UNIQUE (discord_user_id);
ALTER TABLE ONLY public.user_item_order
    ADD CONSTRAINT user_item_order_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.user_league_mechanic
    ADD CONSTRAINT user_league_mechanic_mechanic_user_id_key UNIQUE (mechanic, user_id);
ALTER TABLE ONLY public.user_league_mechanic
    ADD CONSTRAINT user_league_mechanic_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_poe_user_id_key UNIQUE (poe_user_id);
CREATE TRIGGER set_public_user_item_order_updated_at BEFORE UPDATE ON public.user_item_order FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_user_item_order_updated_at ON public.user_item_order IS 'trigger to set value of column "updated_at" to current timestamp on row update';
ALTER TABLE ONLY public.user_item_order
    ADD CONSTRAINT user_item_order_fulfilled_by_fkey FOREIGN KEY (fulfilled_by) REFERENCES public."user"(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.user_item_order
    ADD CONSTRAINT user_item_order_type_fkey FOREIGN KEY (type) REFERENCES public.item_order_type(value) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.user_item_order
    ADD CONSTRAINT user_item_order_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id) ON UPDATE RESTRICT ON DELETE CASCADE;
ALTER TABLE ONLY public.user_league_mechanic
    ADD CONSTRAINT user_league_mechanic_mechanic_fkey FOREIGN KEY (mechanic) REFERENCES public.league_type(value) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.user_league_mechanic
    ADD CONSTRAINT user_league_mechanic_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id) ON UPDATE RESTRICT ON DELETE CASCADE;
