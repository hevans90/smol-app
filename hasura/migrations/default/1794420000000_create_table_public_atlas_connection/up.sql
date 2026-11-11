-- A member's opt-in to server-side atlas syncing: a PoE OAuth token limited
-- to the account:league_accounts scope (atlas passive trees; no stash or
-- character access), which netlify/functions/sync-atlas.ts uses to refresh
-- their atlas_snapshot on a schedule.
--
-- Both tokens are AES-256-GCM ciphertext (netlify/lib/token-crypto.ts); the
-- key lives only in the Netlify environment, so a copy of this table alone
-- is useless. Written exclusively by the atlas-* Netlify functions.
CREATE TABLE "public"."atlas_connection" (
    "user_id" uuid NOT NULL,
    "encrypted_access_token" text NOT NULL,
    -- null if GGG issued no refresh token: syncing then stops when the
    -- access token expires and the member is asked to reconnect
    "encrypted_refresh_token" text,
    "access_expires_at" timestamptz NOT NULL,
    "connected_at" timestamptz NOT NULL DEFAULT now(),
    "last_synced_at" timestamptz,
    -- null when the last sync worked; 'reconnect_needed' when GGG no longer
    -- accepts the token; otherwise a short description of the failure
    "last_error" text,
    PRIMARY KEY ("user_id"),
    CONSTRAINT "atlas_connection_user_id_fkey" FOREIGN KEY ("user_id")
        REFERENCES "public"."user"("id") ON UPDATE RESTRICT ON DELETE CASCADE
);
