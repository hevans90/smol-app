import type { Handler, HandlerEvent } from '@netlify/functions';
import fetch from 'node-fetch';
import { URLSearchParams } from 'url';
import { getCookie, getUserIdFromToken, hasuraUrl } from '../lib/require-user';

type HasuraUpdateUserResponse = {
  data?: { update_user: { returning: { id: string }[] } };
  errors?: unknown;
} | null;

type DiscordUser = {
  id?: string;
  avatar?: string | null;
  username?: string;
  global_name?: string | null;
};

const redirect = (params: Record<string, string>) => ({
  statusCode: 302,
  headers: { Location: `/verify-discord?${new URLSearchParams(params)}` },
});

/**
 * Discord OAuth callback: links the Discord identity to the signed-in user.
 *
 * Who "the signed-in user" is comes from the hasura JWT the auth modal puts
 * in a short-lived cookie just before sending the member to Discord — a
 * browser redirect can't carry an Authorization header. The JWT is verified
 * here; a bare user id is never trusted.
 */
export const handler: Handler = async (event: HandlerEvent) => {
  const code = event.queryStringParameters?.code;
  if (!code) return redirect({ error: 'cancelled' });

  const hasuraUserId = getUserIdFromToken(
    getCookie(event, 'smol_link_token') ?? '',
  );
  if (!hasuraUserId) return redirect({ error: 'not_signed_in' });

  let discordUser: DiscordUser;
  try {
    const authResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'post',
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID as string,
        client_secret: process.env.DISCORD_CLIENT_SECRET as string,
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.DISCORD_REDIRECT as string,
      }),
    });
    const { access_token, token_type } = (await authResponse.json()) as {
      access_token?: string;
      token_type?: string;
    };
    if (!access_token) {
      console.error('Discord token exchange rejected', authResponse.status);
      return redirect({ error: 'discord_rejected' });
    }

    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `${token_type} ${access_token}` },
    });
    discordUser = (await userResponse.json()) as DiscordUser;
    if (!discordUser.id) {
      console.error('Discord returned no user', userResponse.status);
      return redirect({ error: 'discord_rejected' });
    }
  } catch (e) {
    console.error('Discord request failed', e);
    return redirect({ error: 'discord_unreachable' });
  }

  const discordName = discordUser.global_name ?? discordUser.username ?? '';

  try {
    const hasuraResponse = await fetch(hasuraUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET as string,
      },
      body: JSON.stringify({
        // $discordAvatar is nullable: members on Discord's default avatar
        // have none
        query: `
          mutation UpdateUserDiscordDetails($userId: uuid!, $discordName: String!, $discordUserId: String!, $discordAvatar: String) {
            update_user(where: {id: {_eq: $userId}}, _set: {discord_name: $discordName, discord_user_id: $discordUserId, discord_avatar: $discordAvatar}) {
              returning {
                id
              }
            }
          }
        `,
        variables: {
          userId: hasuraUserId,
          discordAvatar: discordUser.avatar ?? null,
          discordName,
          discordUserId: discordUser.id,
        },
      }),
    });
    const result = (await hasuraResponse.json()) as HasuraUpdateUserResponse;
    if (!result?.data?.update_user.returning.length) {
      console.error('Discord link was not saved', result?.errors);
      return redirect({ error: 'link_not_saved' });
    }
  } catch (e) {
    console.error('Saving the Discord link failed', e);
    return redirect({ error: 'link_not_saved' });
  }

  // The Discord access token is deliberately not passed on: nothing uses it
  // after this point, so it has no business in a URL or in the browser.
  return redirect({
    user_data: JSON.stringify({
      id: discordUser.id,
      avatar: discordUser.avatar ?? null,
      global_name: discordName,
    }),
  });
};
