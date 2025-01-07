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
    event?.body ?? '',
  ) as QueryParams;

  const messageToSend = `<@${discordUserId}> ${message}`;

  try {
    await fetch(process.env.SMOL_DISCORD_ITEM_ORDER_WEBHOOK as string, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: messageToSend,
        username: 'smol-bot',
      }),
    });
  } catch (e) {
    console.error(e);
  }

  return {
    statusCode: 200,
  };
};
