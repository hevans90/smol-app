import type { Handler, HandlerEvent } from '@netlify/functions';
import fetch from 'node-fetch';
import invariant from 'tiny-invariant';

type DiscordEmbed = {
  title?: string;
  description?: string;
  color?: number;
  thumbnail?: { url: string };
  fields?: { name: string; value: string; inline?: boolean }[];
  footer?: { text: string };
};

type RequestBody = {
  content?: string;
  embeds?: DiscordEmbed[];
};

// Generic webhook sender for the bulk orders feature — unlike
// discord-notify-user.ts this does not force an @mention prefix, since bulk
// order messages carry rich embeds and sometimes ping nobody (announcements)
// or multiple people (cancellations).
export const handler: Handler = async (event: HandlerEvent) => {
  invariant(event.body);

  const { content, embeds } = JSON.parse(event.body) as RequestBody;

  try {
    await fetch(process.env.SMOL_DISCORD_ITEM_ORDER_WEBHOOK as string, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
        embeds,
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
