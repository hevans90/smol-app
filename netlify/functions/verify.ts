import type { Handler, HandlerEvent } from '@netlify/functions';
import { addSeconds } from 'date-fns';

import fetch from 'node-fetch';

import invariant from 'tiny-invariant';

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

// const getUserByPoEId = async (poeUserId: string) => {
//   const response = await fetch(hasuraURL, {
//     method: 'POST',
//     headers,
//     body: JSON.stringify({
//       query: `
//         query UserByPoEUserId($poeUserId: String!) {
//           user(where: {poe_user_id: {_eq: $poeUserId}}) {
//             discord_name
//             discord_user_id
//             id
//             poe_name
//             poe_user_id
//           }
//         }
//       `,
//       variables: {
//         poeUserId,
//       },
//     }),
//   });
//   return response;
// };

export const handler: Handler = async (event: HandlerEvent) => {
  invariant(event.queryStringParameters);

  const hasuraURL = `https://${process.env.HASURA_GRAPHQL_URI}`;
  const headers = {
    'Content-Type': 'application/json',
    'x-hasura-admin-secret': process.env.HASURA_GRAPHQL_SECRET as string,
  };

  const { auth_code, poe_verifier, poe_state } =
    event.queryStringParameters as GGGOauthResponse;

  const data = {
    client_id: 'smolapp',
    client_secret: process.env.POE_CLIENT_SECRET as string,
    grant_type: 'authorization_code',
    code: auth_code,
    redirect_uri: 'https://smol-app.netlify.app/api/auth',
    scope:
      'account:profile account:characters account:stashes account:league_accounts',
    code_verifier: poe_verifier,
  };

  const response = await fetch('https://www.pathofexile.com/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(data),
  });

  const responseData = (await response.json()) as GGGAccessTokenResponse;

  try {
    const response = await fetch(hasuraURL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query: `
        mutation UpsertUserPoeDetails($poeName: String!, $poeUserId: String!) {
          insert_user(objects: {poe_name: $poeName, poe_user_id: $poeUserId}, on_conflict: {constraint: user_pkey, update_columns: [poe_name, poe_user_id]}) {
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
    console.log('NICE', response);
  } catch (e) {
    console.error(e);
  }

  console.log(responseData);

  responseData.expiry = addSeconds(
    new Date(),
    responseData.expires_in
  ).toISOString();

  return {
    statusCode: 200,
    body: JSON.stringify(responseData),
  };
};
