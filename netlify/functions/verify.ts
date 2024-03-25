import type { Handler, HandlerEvent } from '@netlify/functions';
import { addSeconds } from 'date-fns';

import fetch, { Response } from 'node-fetch';

import invariant from 'tiny-invariant';

import { sign } from 'jsonwebtoken';

type GGGOauthResponse = {
  auth_code: string;
  poe_verifier: string;
  poe_state: string;
};

type GGGAccessTokenResponse = {
  access_token: string;
  expires_in: number;
  expiry?: string;
  token_type: string;
  scope: string;
  username: string;
  sub: string;
  refresh_token: string;
};

type HasuraUser = {
  id: string;
  poe_name: string | null;
  poe_user_id: string | null;
  discord_name: string | null;
  discord_user_id: string | null;
};

type HasuraUpsertUserResponse = {
  data: { insert_user: { returning: HasuraUser[] } };
} | null;

export const handler: Handler = async (event: HandlerEvent) => {
  invariant(event.queryStringParameters);

  const hasuraURL = `https://${process.env.HASURA_GRAPHQL_URI}`;
  const headers = {
    'Content-Type': 'application/json',
    'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET as string,
  };

  const { auth_code, poe_verifier, poe_state } =
    event.queryStringParameters as GGGOauthResponse;

  const data = {
    client_id: 'smolapp',
    client_secret: process.env.POE_CLIENT_SECRET as string,
    grant_type: 'authorization_code',
    code: auth_code,
    redirect_uri: 'https://smol-app.netlify.app/api/auth',
    scope: 'account:profile',
    code_verifier: poe_verifier,
  };

  console.log('logging in with', data);

  let response: Response | undefined;
  let responseData: GGGAccessTokenResponse | undefined;

  try {
    response = await fetch('https://www.pathofexile.com/oauth/token', {
      method: 'POST',
      headers: {
        'User-Agent': 'OAuth smolapp/1.0 (contact: hevans9000@gmail.com)',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(data),
    });
    console.log('Got response from GGG:', response);
    console.log('HEADERS:', response.headers);
    console.log('STATUS:', response.status);
    console.log('STATUS_TEXT:', response.statusText);
  } catch (e) {
    console.error(`Something went wrong`, e);
  }

  let upsertedHasuraUser: HasuraUser | undefined = undefined;

  if (!response) {
    throw new Error('No response from GGG API');
  }
  try {
    responseData = (await response.json()) as GGGAccessTokenResponse;
    console.log('Logged in via GGG OAuth', responseData);
  } catch (e) {
    console.error('Something went wrong parsing your login', e);
  }
  if (!responseData) {
    throw new Error('Invalid response from GGG API');
  }

  try {
    const hasuraResponse = await fetch(hasuraURL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query: `
        mutation UpsertUserPoeDetails($poeName: String!, $poeUserId: String!) {
          insert_user(objects: {poe_name: $poeName, poe_user_id: $poeUserId}, on_conflict: {constraint: user_poe_user_id_key, update_columns: poe_name}) {
            returning {
              id
              discord_user_id
              discord_name
              poe_name
              poe_user_id
            }
          }
        }
      `,
        variables: {
          poeName: responseData.username,
          poeUserId: responseData.sub,
        },
      }),
    });
    upsertedHasuraUser = (
      (await hasuraResponse.json()) as HasuraUpsertUserResponse
    )?.data.insert_user.returning[0];
    console.log('Upserted POE user details to Hasura', upsertedHasuraUser);
  } catch (e) {
    console.error(e);
  }

  responseData.expiry = addSeconds(
    new Date(),
    responseData.expires_in
  ).toISOString();

  const dev = ['Hevans9000', 'Eplyratata', 'Thanangard'].includes(
    responseData.username
  );

  // now generate a new JWT for use with hasura
  const hasuraToken = sign(
    {
      poeUserId: responseData.sub,
      hasuraUserId: upsertedHasuraUser?.id,
      'https://hasura.io/jwt/claims': {
        'x-hasura-default-role': dev ? 'dev' : 'user',
        'x-hasura-allowed-roles': dev ? ['dev', 'user'] : ['user'],
        'x-hasura-user-id': upsertedHasuraUser?.id,
      },
    },
    process.env.JWT_SECRET as string,
    { algorithm: 'HS256' }
  );

  return {
    statusCode: 200,
    body: JSON.stringify({
      ...responseData,
      hasuraToken,
      hasuraUserId: upsertedHasuraUser?.id,
    }),
  };
};
