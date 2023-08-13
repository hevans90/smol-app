import type { Handler, HandlerEvent } from '@netlify/functions';
import { addSeconds } from 'date-fns';

import fetch from 'node-fetch';
import invariant from 'tiny-invariant';
import { URLSearchParams } from 'url';

type HasuraUser = {
  id: string;
  poe_name: string | null;
  poe_user_id: string | null;
  discord_name: string | null;
  discord_user_id: string | null;
};

type HasuraUpdateUserResponse = {
  data: { update_user: { returning: HasuraUser[] } };
} | null;

export const handler: Handler = async (event: HandlerEvent) => {
  invariant(event.queryStringParameters);
  const { code } = event.queryStringParameters;
  invariant(code);

  const hasuraUserId = (event.headers.cookie as string)
    ?.split(';')
    .filter((cookie) => cookie.includes('hasura_user_id'))?.[0]
    ?.split('=')?.[1];

  console.log('COOKIE', event.headers?.cookie);
  console.log('HASURA_ID_FROM_COOKIE', hasuraUserId);

  const hasuraURL = `https://${process.env.HASURA_GRAPHQL_URI}`;
  const headers = {
    'Content-Type': 'application/json',
    'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET as string,
  };

  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID as string,
    client_secret: process.env.DISCORD_CLIENT_SECRET as string,
    grant_type: 'authorization_code',
    code,
    redirect_uri: process.env.DISCORD_REDIRECT as string,
  });

  const redirectParams = new URLSearchParams();

  try {
    const authResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'post',
      body: params,
    });

    const { access_token, token_type, expires_in } =
      (await authResponse.json()) as {
        access_token: string;
        token_type: string;
        expires_in: number; //seconds until expiry
      };

    const expiryDate = addSeconds(new Date(), expires_in).toISOString();

    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `${token_type} ${access_token}`,
      },
    });

    const discordUserData = (await userResponse.json()) as {
      id: string;
      avatar: string;
      username: string;
      global_name: string;
    };
    redirectParams.append('user_data', JSON.stringify(discordUserData));
    redirectParams.append('token', access_token);
    redirectParams.append('expiry', expiryDate);

    if (hasuraUserId) {
      console.log('DISCORD DATA TO UPDATE', discordUserData);
      let updatedHasuraUser: HasuraUser | undefined = undefined;
      const hasuraResponse = await fetch(hasuraURL, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query: `
          mutation UpdateUserDiscordDetails($userId: uuid!, $discordName: String!, $discordUserId: String!, $discordAvatar: String!) {
            update_user(where: {id: {_eq: $userId}}, _set: {discord_name: $discordName, discord_user_id: $discordUserId, discord_avatar: $discordAvatar}) {
              returning {
                id
                poe_name
                poe_user_id
                discord_name
                discord_avatar
                discord_user_id
              }
            }
          }
      `,
          variables: {
            userId: hasuraUserId,
            discordAvatar: discordUserData.avatar,
            discordName: discordUserData.global_name,
            discordUserId: discordUserData.id,
          },
        }),
      });
      updatedHasuraUser = (
        (await hasuraResponse.json()) as HasuraUpdateUserResponse
      )?.data.update_user.returning[0];
      console.log('Updated Discord user details to Hasura', updatedHasuraUser);
    }
  } catch (error) {
    console.error(error);
  }

  return {
    statusCode: 302,
    headers: {
      Location: `/verify-discord?${redirectParams}`,
    },
  };
};
