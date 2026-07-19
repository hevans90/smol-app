-- Notify listeners (the go-server) the moment an admin changes app config,
-- so a league switch takes effect immediately instead of on the next poll.
CREATE OR REPLACE FUNCTION public.notify_app_config_changed() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    PERFORM pg_notify('app_config_changed', NEW.league_name);
    RETURN NEW;
END;
$$;

CREATE TRIGGER "notify_public_app_config_changed"
    AFTER UPDATE ON "public"."app_config"
    FOR EACH ROW EXECUTE FUNCTION public.notify_app_config_changed();
