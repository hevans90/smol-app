import type { Handler, HandlerEvent } from '@netlify/functions';

import fetch from 'node-fetch';

import { sign, verify } from 'jsonwebtoken';

type HasuraUserResponse = {
  data: { user_by_pk: { id: string; admin: boolean } | null };
} | null;

/**
 * Re-mints a hasura JWT for an already-authenticated user so role changes
 * (admin granted or revoked) take effect without a full PoE re-login. The
 * frontend calls this whenever the admin flag on the user row disagrees with
 * the roles baked into the current token.
 */
const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ message: 'Method Not Allowed' }) };
  }

  const authHeader = event.headers.authorization ?? '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) {
    return { statusCode: 401, body: JSON.stringify({ message: 'Missing token' }) };
  }

  let hasuraUserId: string | undefined;
  let poeUserId: string | undefined;
  try {
    const decoded = verify(token, process.env.JWT_SECRET as string) as {
      hasuraUserId?: string;
      poeUserId?: string;
    };
    hasuraUserId = decoded.hasuraUserId;
    poeUserId = decoded.poeUserId;
  } catch (e) {
    return { statusCode: 401, body: JSON.stringify({ message: 'Invalid token' }) };
  }
  if (!hasuraUserId) {
    return { statusCode: 401, body: JSON.stringify({ message: 'Token has no user id' }) };
  }

  const hasuraUri = process.env.HASURA_GRAPHQL_URI as string;
  // local hasura (docker compose) has no TLS
  const hasuraURL = hasuraUri.startsWith('localhost')
    ? `http://${hasuraUri}`
    : `https://${hasuraUri}`;
  const hasuraResponse = await fetch(hasuraURL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET as string,
    },
    body: JSON.stringify({
      query: `
        query UserAdminFlag($id: uuid!) {
          user_by_pk(id: $id) {
            id
            admin
          }
        }
      `,
      variables: { id: hasuraUserId },
    }),
  });

  const user = ((await hasuraResponse.json()) as HasuraUserResponse)?.data
    ?.user_by_pk;
  if (!user) {
    return { statusCode: 404, body: JSON.stringify({ message: 'User not found' }) };
  }

  const dev = user.admin === true;

  // same claim shape as verify.ts
  const hasuraToken = sign(
    {
      poeUserId,
      hasuraUserId,
      'https://hasura.io/jwt/claims': {
        'x-hasura-default-role': dev ? 'dev' : 'user',
        'x-hasura-allowed-roles': dev ? ['dev', 'user'] : ['user'],
        'x-hasura-user-id': hasuraUserId,
      },
    },
    process.env.JWT_SECRET as string,
    { algorithm: 'HS256' }
  );

  return {
    statusCode: 200,
    body: JSON.stringify({ hasuraToken, admin: dev }),
  };
};

export { handler };
