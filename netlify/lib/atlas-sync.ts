import {
  CURRENT_ATLAS_VERSION,
  parseLeagueAccount,
  unexpectedLeagueAccountKeys,
} from '../../src/_utils/atlas-league-account';
import {
  POE_ATLAS_SCOPES,
  POE_CLIENT_ID,
  POE_REDIRECT_URI,
} from '../../src/_utils/poe-oauth';
import { hasuraAdmin } from './hasura-admin';
import { POE_USER_AGENT } from './poe';
import { decryptToken, encryptToken } from './token-crypto';

// Server-side atlas sync for members who opted in on the Farm page. Their
// atlas-only PoE token is kept encrypted in atlas_connection; this module is
// the only code that decrypts it, and the atlas-* functions built on it are
// the only writers of atlas_connection and atlas_snapshot.
//
// Never log token values or token responses here.

const REQUEST_TIMEOUT_MS = 10_000;
// Access tokens last 28 days; renew well before that so a few failed runs
// can't strand a member. Refresh tokens rotate on use, so this is rare by
// design: the scheduled sync and a manual "sync now" overlapping on the same
// renewal is the only way to lose one.
const REFRESH_WHEN_EXPIRING_WITHIN_MS = 3 * 24 * 60 * 60 * 1000;

export const RECONNECT_NEEDED = 'reconnect_needed';
export const NO_LEAGUE_ACCOUNT = 'no_league_account';

export type AtlasConnection = {
  user_id: string;
  encrypted_access_token: string;
  encrypted_refresh_token: string | null;
  access_expires_at: string;
  last_synced_at?: string | null;
};

export const CONNECTION_FIELDS = `
  user_id
  encrypted_access_token
  encrypted_refresh_token
  access_expires_at
  last_synced_at
`;

export type PoeTokens = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  sub?: string;
};

export type SyncResult =
  | { outcome: 'synced' | 'reconnect_needed' | 'no_league_account' }
  | { outcome: 'rate_limited'; retryAfterSeconds: number }
  | { outcome: 'failed'; message: string };

class TokenRejected extends Error {}

const requestTokens = async (grant: Record<string, string>): Promise<PoeTokens> => {
  const response = await fetch('https://www.pathofexile.com/oauth/token', {
    method: 'POST',
    headers: {
      'User-Agent': POE_USER_AGENT,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: POE_CLIENT_ID,
      client_secret: process.env.POE_CLIENT_SECRET as string,
      ...grant,
    }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  const body = (await response.json().catch(() => ({}))) as Partial<PoeTokens> & {
    error?: string;
  };
  if (response.ok && body.access_token) return body as PoeTokens;
  // 4xx = GGG understood and said no (code used, grant revoked or expired);
  // anything else is their problem and worth retrying later
  if (response.status >= 400 && response.status < 500 && response.status !== 429) {
    throw new TokenRejected(body.error ?? `token request rejected (${response.status})`);
  }
  throw new Error(`token request failed (${response.status})`);
};

/** First half of opting in: turns the authorization code into tokens. */
export const exchangeAtlasCode = (code: string, verifier: string) =>
  requestTokens({
    grant_type: 'authorization_code',
    code,
    redirect_uri: POE_REDIRECT_URI,
    scope: POE_ATLAS_SCOPES,
    code_verifier: verifier,
  });

export const isTokenRejected = (e: unknown) => e instanceof TokenRejected;

const expiryOf = (tokens: PoeTokens) =>
  new Date(Date.now() + (tokens.expires_in ?? 0) * 1000).toISOString();

/** Encrypts and stores a member's tokens, replacing any previous connection. */
export const saveConnection = async (
  userId: string,
  tokens: PoeTokens,
  fallbackEncryptedRefreshToken: string | null = null,
): Promise<AtlasConnection> => {
  const { insert_atlas_connection_one } = await hasuraAdmin<{
    insert_atlas_connection_one: AtlasConnection;
  }>(
    `mutation SaveAtlasConnection($object: atlas_connection_insert_input!) {
      insert_atlas_connection_one(
        object: $object
        on_conflict: {
          constraint: atlas_connection_pkey
          update_columns: [encrypted_access_token, encrypted_refresh_token, access_expires_at, last_error]
        }
      ) { ${CONNECTION_FIELDS} }
    }`,
    {
      object: {
        user_id: userId,
        encrypted_access_token: encryptToken(tokens.access_token, userId),
        encrypted_refresh_token: tokens.refresh_token
          ? encryptToken(tokens.refresh_token, userId)
          : fallbackEncryptedRefreshToken,
        access_expires_at: expiryOf(tokens),
        last_error: null,
      },
    },
  );
  return insert_atlas_connection_one;
};

const recordStatus = (userId: string, lastError: string | null, synced: boolean) =>
  hasuraAdmin(
    `mutation RecordAtlasSync($userId: uuid!, $set: atlas_connection_set_input!) {
      update_atlas_connection_by_pk(pk_columns: { user_id: $userId }, _set: $set) { user_id }
    }`,
    {
      userId,
      set: {
        last_error: lastError,
        ...(synced ? { last_synced_at: new Date().toISOString() } : {}),
      },
    },
  );

// Returns a usable access token, renewing it first when it is close to
// expiry (or `force`d, after GGG rejected it). The rotated refresh token is
// stored before the new access token is used.
const accessTokenFor = async (
  connection: AtlasConnection,
  force = false,
): Promise<string> => {
  const { user_id: userId } = connection;
  const expiresIn = new Date(connection.access_expires_at).getTime() - Date.now();
  const due = force || expiresIn < REFRESH_WHEN_EXPIRING_WITHIN_MS;

  if (!due) return decryptToken(connection.encrypted_access_token, userId);
  if (!connection.encrypted_refresh_token) {
    if (!force && expiresIn > 0) {
      return decryptToken(connection.encrypted_access_token, userId);
    }
    throw new TokenRejected('access token expired and there is no refresh token');
  }

  const tokens = await requestTokens({
    grant_type: 'refresh_token',
    refresh_token: decryptToken(connection.encrypted_refresh_token, userId),
  });
  // GGG rotates the refresh token; if a response ever omits it, keep the old
  await saveConnection(userId, tokens, connection.encrypted_refresh_token);
  return tokens.access_token;
};

const fetchLeagueAccount = (league: string, accessToken: string) =>
  fetch(`https://api.pathofexile.com/league-account/${encodeURIComponent(league)}`, {
    headers: { 'User-Agent': POE_USER_AGENT, Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

/**
 * Fetches one member's atlas for `league` and stores it. Never throws: the
 * outcome is returned and recorded on the connection (last_error), which is
 * what the Farm page shows the member.
 */
export const syncConnection = async (
  connection: AtlasConnection,
  league: string,
): Promise<SyncResult> => {
  const { user_id: userId } = connection;
  try {
    let response = await fetchLeagueAccount(league, await accessTokenFor(connection));
    if (response.status === 401) {
      response = await fetchLeagueAccount(league, await accessTokenFor(connection, true));
    }

    if (response.status === 401 || response.status === 403) {
      throw new TokenRejected(`league-account returned ${response.status}`);
    }
    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('Retry-After') ?? '', 10);
      return {
        outcome: 'rate_limited',
        retryAfterSeconds: Number.isFinite(retryAfter) ? retryAfter : 60,
      };
    }
    if (response.status === 404) {
      await recordStatus(userId, NO_LEAGUE_ACCOUNT, true);
      return { outcome: 'no_league_account' };
    }
    if (!response.ok) throw new Error(`PoE API returned ${response.status}`);

    const body = await response.json();
    const unexpected = unexpectedLeagueAccountKeys(body);
    if (unexpected.length) {
      console.log('league-account has undocumented fields:', unexpected.join(', '));
    }
    const { trees, rawTrees } = parseLeagueAccount(body);
    await hasuraAdmin(
      `mutation SaveAtlasSnapshot($snapshot: atlas_snapshot_insert_input!, $userId: uuid!, $now: timestamptz!) {
        insert_atlas_snapshot_one(
          object: $snapshot
          on_conflict: {
            constraint: atlas_snapshot_user_id_league_key
            update_columns: [trees, raw_trees, tree_version]
          }
        ) { id }
        update_atlas_connection_by_pk(
          pk_columns: { user_id: $userId }
          _set: { last_error: null, last_synced_at: $now }
        ) { user_id }
      }`,
      {
        userId,
        now: new Date().toISOString(),
        snapshot: {
          user_id: userId,
          league,
          tree_version: CURRENT_ATLAS_VERSION,
          trees,
          raw_trees: rawTrees ?? [],
        },
      },
    );
    return { outcome: 'synced' };
  } catch (e) {
    const rejected = isTokenRejected(e);
    const message = e instanceof Error ? e.message : 'atlas sync failed';
    console.error(`Atlas sync failed for user ${userId}:`, message);
    await recordStatus(userId, rejected ? RECONNECT_NEEDED : message.slice(0, 200), false).catch(
      (recordError) => console.error('Could not record atlas sync status:', recordError),
    );
    return rejected ? { outcome: 'reconnect_needed' } : { outcome: 'failed', message };
  }
};

export const configuredLeague = async (): Promise<string | undefined> => {
  const { app_config_by_pk } = await hasuraAdmin<{
    app_config_by_pk: { league_name: string } | null;
  }>(`query ConfiguredLeague { app_config_by_pk(id: 1) { league_name } }`);
  return app_config_by_pk?.league_name || undefined;
};

export const connectionOf = async (userId: string) => {
  const { atlas_connection_by_pk } = await hasuraAdmin<{
    atlas_connection_by_pk: AtlasConnection | null;
  }>(
    `query AtlasConnection($userId: uuid!) {
      atlas_connection_by_pk(user_id: $userId) { ${CONNECTION_FIELDS} }
    }`,
    { userId },
  );
  return atlas_connection_by_pk ?? undefined;
};

/**
 * Opting out: asks GGG to revoke the grant (best effort), then deletes the
 * stored tokens and every atlas snapshot of the member.
 */
export const removeConnection = async (userId: string) => {
  const connection = await connectionOf(userId);
  if (connection) {
    try {
      const stored =
        connection.encrypted_refresh_token ?? connection.encrypted_access_token;
      await fetch('https://www.pathofexile.com/oauth/token/revoke', {
        method: 'POST',
        headers: {
          'User-Agent': POE_USER_AGENT,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: POE_CLIENT_ID,
          client_secret: process.env.POE_CLIENT_SECRET as string,
          token: decryptToken(stored, userId),
          token_type_hint: connection.encrypted_refresh_token
            ? 'refresh_token'
            : 'access_token',
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (e) {
      // the local copy is deleted regardless, which is what stops the sync
      console.error(`Could not revoke the atlas token of user ${userId}:`, e);
    }
  }

  await hasuraAdmin(
    `mutation RemoveAtlasConnection($userId: uuid!) {
      delete_atlas_connection_by_pk(user_id: $userId) { user_id }
      delete_atlas_snapshot(where: { user_id: { _eq: $userId } }) { affected_rows }
    }`,
    { userId },
  );
};
