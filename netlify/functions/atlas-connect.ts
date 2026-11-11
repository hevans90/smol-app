import type { Handler } from '@netlify/functions';
import {
  configuredLeague,
  exchangeAtlasCode,
  isTokenRejected,
  saveConnection,
  syncConnection,
} from '../lib/atlas-sync';
import { hasuraAdmin } from '../lib/hasura-admin';
import { getAuthenticatedUserId, unauthorized } from '../lib/require-user';

const json = (statusCode: number, body: Record<string, unknown>) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

/**
 * Completes "Share my atlas" on the Farm page: exchanges the authorization
 * code for an atlas-only PoE token, stores it encrypted and runs the first
 * sync. Called by verify.astro with the member's hasura JWT.
 *
 * The token never goes back to the browser, and nothing here may log it.
 */
export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'method_not_allowed' });
  const userId = getAuthenticatedUserId(event);
  if (!userId) return unauthorized;

  let auth_code: string | undefined;
  let poe_verifier: string | undefined;
  try {
    ({ auth_code, poe_verifier } = JSON.parse(event.body ?? '{}'));
  } catch {
    // falls through to the missing-parameter response
  }
  if (!auth_code || !poe_verifier) return json(400, { error: 'missing_code' });

  let tokens;
  try {
    tokens = await exchangeAtlasCode(auth_code, poe_verifier);
  } catch (e) {
    console.error('Atlas token exchange failed:', e instanceof Error ? e.message : e);
    return isTokenRejected(e)
      ? json(401, { error: 'poe_rejected' })
      : json(502, { error: 'poe_unreachable' });
  }

  try {
    // the PoE account that approved must be the one this member logged in
    // with, or they would be publishing someone else's atlas as their own
    const { user_by_pk } = await hasuraAdmin<{
      user_by_pk: { poe_user_id: string | null } | null;
    }>(`query PoeUserId($id: uuid!) { user_by_pk(id: $id) { poe_user_id } }`, {
      id: userId,
    });
    if (!tokens.sub || !user_by_pk || tokens.sub !== user_by_pk.poe_user_id) {
      return json(403, { error: 'wrong_account' });
    }

    const connection = await saveConnection(userId, tokens);
    const league = await configuredLeague();
    const result = league ? await syncConnection(connection, league) : undefined;
    return json(200, { connected: true, sync: result?.outcome ?? 'skipped' });
  } catch (e) {
    console.error('Could not save the atlas connection:', e instanceof Error ? e.message : e);
    return json(502, { error: 'save_failed' });
  }
};
