import type { Handler, HandlerEvent } from '@netlify/functions';
import { addMilliseconds, addSeconds } from 'date-fns';

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

export const handler: Handler = async (event: HandlerEvent) => {
  invariant(event.queryStringParameters);

  const { auth_code, poe_verifier, poe_state } =
    event.queryStringParameters as GGGOauthResponse;

  const data = {
    client_id: 'smolapp',
    client_secret: process.env.POE_CLIENT_SECRET as string,
    grant_type: 'authorization_code',
    code: auth_code,
    redirect_uri: 'https://smol-app.netlify.app/api/auth',
    scope:
      'account:profile account:characters account:stashes account:league_accounts service:leagues service:leagues:ladder service:psapi',
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

  responseData.expiry = addSeconds(
    new Date(),
    responseData.expires_in
  ).toISOString();

  return {
    statusCode: 200,
    body: JSON.stringify(responseData),
  };
};
