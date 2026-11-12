-- Who shares their atlas, readable by every member so profiles can tell
-- "connected, no tree this league yet" from "not shared". Only the user id
-- and when they connected: the encrypted tokens and sync errors stay on
-- atlas_connection, whose permissions still return a member's own row only.
CREATE VIEW "public"."atlas_sharer" AS
SELECT user_id, connected_at
FROM "public"."atlas_connection";
