import type { Handler, HandlerEvent } from '@netlify/functions';
import { addSeconds } from 'date-fns';
import { sign } from 'jsonwebtoken';
import fetch from 'node-fetch';
import {
  POE_CLIENT_ID,
  POE_OAUTH_SCOPES,
  POE_REDIRECT_URI,
} from '../../src/_utils/poe-oauth';
import { POE_USER_AGENT } from '../lib/poe';
import { hasuraUrl } from '../lib/require-user';

type GGGAccessTokenResponse = {
  access_token?: string;
  expires_in?: number;
  username?: string;
  sub?: string;
  error?: string;
  error_description?: string;
};

type HasuraUser = { id: string; admin: boolean };

type HasuraUpsertUserResponse = {
  data?: { insert_user: { returning: HasuraUser[] } };
  errors?: unknown;
} | null;

const json = (statusCode: number, body: Record<string, unknown>) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

/**
 * Second half of the PoE OAuth flow: exchanges the authorization code for a
 * PoE token, upserts the user, and mints the hasura JWT. Called by
 * verify.astro, which reads `error` on any non-200 to tell the member what
 * went wrong.
 *
 * Never log the request or the token response here — they contain the client
 * secret and the member's tokens.
 */
export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'method_not_allowed' });
  }

  let auth_code: string | undefined;
  let poe_verifier: string | undefined;
  try {
    ({ auth_code, poe_verifier } = JSON.parse(event.body ?? '{}'));
  } catch {
    // falls through to the missing-parameter response
  }
  if (!auth_code || !poe_verifier) {
    return json(400, { error: 'missing_code' });
  }

  let tokenData: GGGAccessTokenResponse;
  try {
    const response = await fetch('https://www.pathofexile.com/oauth/token', {
      method: 'POST',
      headers: {
        'User-Agent': POE_USER_AGENT,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: POE_CLIENT_ID,
        client_secret: process.env.POE_CLIENT_SECRET as string,
        grant_type: 'authorization_code',
        code: auth_code,
        redirect_uri: POE_REDIRECT_URI,
        scope: POE_OAUTH_SCOPES,
        code_verifier: poe_verifier,
      }),
    });
    tokenData = (await response.json()) as GGGAccessTokenResponse;

    if (!response.ok || !tokenData.access_token || !tokenData.sub) {
      console.error('PoE token exchange rejected', {
        status: response.status,
        error: tokenData.error,
        error_description: tokenData.error_description,
      });
      return json(401, { error: 'poe_rejected' });
    }
  } catch (e) {
    console.error('PoE token exchange failed', e);
    return json(502, { error: 'poe_unreachable' });
  }

  let user: HasuraUser | undefined;
  try {
    const hasuraResponse = await fetch(hasuraUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET as string,
      },
      body: JSON.stringify({
        query: `
        mutation UpsertUserPoeDetails($poeName: String!, $poeUserId: String!) {
          insert_user(objects: {poe_name: $poeName, poe_user_id: $poeUserId}, on_conflict: {constraint: user_poe_user_id_key, update_columns: poe_name}) {
            returning {
              id
              admin
            }
          }
        }
      `,
        variables: { poeName: tokenData.username, poeUserId: tokenData.sub },
      }),
    });
    const result = (await hasuraResponse.json()) as HasuraUpsertUserResponse;
    user = result?.data?.insert_user.returning[0];
    if (!user) console.error('User upsert returned no row', result?.errors);
  } catch (e) {
    console.error('User upsert failed', e);
  }
  // without a user row the JWT would carry no user id, and every request
  // made with it would fail in confusing ways — refuse instead
  if (!user) return json(502, { error: 'user_save_failed' });

  // admins are assigned via the user.admin column (managed from the
  // frontend admin section); they get the hasura dev role
  const dev = user.admin === true;

  const hasuraToken = sign(
    {
      poeUserId: tokenData.sub,
      hasuraUserId: user.id,
      'https://hasura.io/jwt/claims': {
        'x-hasura-default-role': dev ? 'dev' : 'user',
        'x-hasura-allowed-roles': dev ? ['dev', 'user'] : ['user'],
        'x-hasura-user-id': user.id,
      },
    },
    process.env.JWT_SECRET as string,
    { algorithm: 'HS256' },
  );

  // only what the browser needs — the PoE refresh token stays server-side
  // (and is simply dropped, since nothing here refreshes)
  return json(200, {
    access_token: tokenData.access_token,
    expiry: addSeconds(new Date(), tokenData.expires_in ?? 0).toISOString(),
    username: tokenData.username,
    hasuraToken,
    hasuraUserId: user.id,
  });
};
