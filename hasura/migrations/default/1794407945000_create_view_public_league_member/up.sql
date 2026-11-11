-- Membership gate that replaces the old guild check (GGG's API no longer
-- exposes a player's guild): a user counts as a member while their PoE
-- account owns at least one character on the ladder of the admin-configured
-- league. The go-server keeps "character" in sync every 5 minutes, so a new
-- player becomes a member shortly after creating a character in the league.
--
-- Account names are compared case-insensitively; both sides carry the
-- "Name#1234" discriminator form.
CREATE VIEW "public"."league_member" AS
SELECT DISTINCT u.id AS user_id
FROM "public"."user" u
JOIN "public"."character" c
    ON lower(c.poe_account_name) = lower(u.poe_name)
JOIN "public"."app_config" a
    ON a.league_name = c.league;
