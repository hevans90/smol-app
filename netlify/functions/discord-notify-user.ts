import type { Handler, HandlerEvent } from '@netlify/functions';
import fetch from 'node-fetch';
import invariant from 'tiny-invariant';

type QueryParams = {
  discordUserId: string;
  message: string;
};

export const handler: Handler = async (event: HandlerEvent) => {
  invariant(event.body);

  const { discordUserId, message } = JSON.parse(
    event?.body ?? ''
  ) as QueryParams;

  const messageToSend = `<@${discordUserId}> ${message}`;

  try {
    await fetch(
      'https://discord.com/api/webhooks/1180566422401855499/bvyyuFY6t-FH6TkZGIAn90MGK-p5Ix4tH3TLOlBKb5qVn4tfB8okP0JjoV6IN7876FEB',
      {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: messageToSend,
          username: 'smol-bot',
        }),
      }
    );
  } catch (e) {
    console.error(e);
  }

  return {
    statusCode: 200,
  };
};
