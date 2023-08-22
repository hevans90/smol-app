import type { Handler, HandlerEvent } from '@netlify/functions';
import { addSeconds } from 'date-fns';

import fetch from 'node-fetch';

import invariant from 'tiny-invariant';

import { sign } from 'jsonwebtoken';
import { errorMap } from '../../src/_errors/error-codes';

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

type HasuraUserQueryResponse = {
  data: {
    user: { id: string }[];
    user_aggregate: {
      aggregate: { count: number };
    };
  };
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
    scope:
      'account:profile account:characters account:stashes account:league_accounts',
    code_verifier: poe_verifier,
  };

  const gggResponse = await fetch('https://www.pathofexile.com/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(data),
  });

  console.log('GGG RESPONSE:', gggResponse);

  const blob = await gggResponse.blob();
  console.log('BLOB', blob);

  const formData = await gggResponse.formData();
  console.log('FORMDATA', formData);

  const buffer = await gggResponse.arrayBuffer();
  console.log('BUFFER', buffer);

  console.log('BODY', gggResponse.body);

  const responseData = (await gggResponse.json()) as GGGAccessTokenResponse;
  console.log('Logged in via GGG OAuth', responseData);

  let upsertedHasuraUser: HasuraUser | undefined = undefined;

  const validationResponse = await fetch(hasuraURL, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      query: `
      query UserByPoeId($poeId: String!) {
        user(where: {poe_user_id: {_eq: $poeId}}) {
          id
        }
        user_aggregate {
          aggregate {
            count
          }
        }
      }`,
      variables: {
        poeId: responseData.sub,
      },
    }),
  });

  const userValidationData =
    (await validationResponse.json()) as HasuraUserQueryResponse;

  const count = userValidationData?.data?.user_aggregate?.aggregate
    ?.count as number;

  const numberOfExistingUsersWithPoeId = userValidationData?.data?.user?.length;

  let error = '';

  if (numberOfExistingUsersWithPoeId && numberOfExistingUsersWithPoeId > 1) {
    error = errorMap.MULTIPLE_USERS;
    throw new Error(error);
  }
  console.log('HASURA USER COUNT', count);
  console.log('USER LIMIT', process.env.USER_LIMIT);
  console.log('EXISTING USER', !!numberOfExistingUsersWithPoeId);

  if (count >= parseInt(process.env.USER_LIMIT as string)) {
    if (numberOfExistingUsersWithPoeId === 0) {
      console.log(
        `User limit reached: ${process.env.USER_LIMIT}, hasura currently has ${count} users.`
      );
      console.log(`PoE User ${responseData.username} is not being upserted.`);
      error = errorMap.USER_LIMIT_REACHED;
      throw new Error(error);
    }
  }

  // all good: you have a user already OR we are under the USER_LIMIT

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

  // now generate a new JWT for use with hasura
  const hasuraToken = sign(
    {
      poeUserId: responseData.sub,
      hasuraUserId: upsertedHasuraUser?.id,
      'https://hasura.io/jwt/claims': {
        'x-hasura-default-role': 'user',
        'x-hasura-allowed-roles': ['user'],
        'x-hasura-user-id': upsertedHasuraUser?.id,
      },
    },
    process.env.JWT_SECRET as string,
    { algorithm: 'HS256' }
  );

  console.log('ERROR', error);

  return {
    statusCode: 200,
    body: JSON.stringify({
      ...responseData,
      hasuraToken,
      hasuraUserId: upsertedHasuraUser?.id,
      error,
    }),
  };
};
