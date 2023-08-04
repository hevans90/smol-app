import type { Handler, HandlerEvent } from '@netlify/functions';

import invariant from 'tiny-invariant';

type GGGOauthResponse = {
  code: string;
  state: string;
};

export const handler: Handler = async (event: HandlerEvent) => {
  invariant(event.queryStringParameters);

  return {
    statusCode: 302,
    headers: {
      Location: `/verify?${new URLSearchParams(
        event.queryStringParameters as GGGOauthResponse
      ).toString()}`,
    },
  };
};
