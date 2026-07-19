// Single source of truth for every bulk-order Discord message. The in-dialog
// live preview (BulkContributeDialog) and the actual webhook send both call
// these builders, so what a contributor sees in the preview is guaranteed to
// be exactly what lands in Discord.
//
// Discord mechanic that shapes this whole module: mentions inside an embed
// do NOT ping — only plain `content` text pings. So every message pairs a
// `content` line (who gets pinged, if anyone) with one rich `embed` (the
// actual card).

import { getWikiImgSrcFromUrl } from './utils';

export type BulkDiscordUser = {
  id: string;
  poe_name?: string | null;
  discord_name?: string | null;
  discord_user_id?: string | null;
};

export type DiscordEmbedField = {
  name: string;
  value: string;
  inline?: boolean;
};

export type DiscordEmbed = {
  title?: string;
  description?: string;
  color?: number;
  thumbnail?: { url: string };
  fields?: DiscordEmbedField[];
  footer?: { text: string };
};

export type BulkDiscordPayload = {
  content?: string;
  embeds: DiscordEmbed[];
};

export type BulkOrderLike = {
  id: string;
  item_name: string;
  quantity: number;
  icon_url?: string | null;
  link_url?: string | null;
  description?: string | null;
};

export const BULK_ORDER_COLORS = {
  created: 0xdfcf99,
  contribution: 0x4179b1,
  completed: 0x22c55e,
  withdrawal: 0x6b7280,
  cancelled: 0xdc2626,
  quantityRaised: 0xdfcf99,
} as const;

const displayName = (user: BulkDiscordUser | null | undefined) =>
  user?.poe_name ?? user?.discord_name ?? 'Someone';

/** `<@id>` if linked (pings); bold plain name otherwise (never pings). */
export const mention = (user: BulkDiscordUser | null | undefined) =>
  user?.discord_user_id
    ? `<@${user.discord_user_id}>`
    : `**${displayName(user)}**`;

const isSameUser = (
  a: BulkDiscordUser | null | undefined,
  b: BulkDiscordUser | null | undefined,
) => !!a && !!b && a.id === b.id;

/** `▰▰▰▰▰▰▱▱▱▱ 60/100` — 10-segment progress bar. */
export const progressBar = (sum: number, total: number) => {
  const clamped = Math.max(0, Math.min(sum, total));
  const filled = total > 0 ? Math.round((clamped / total) * 10) : 0;
  return `${'▰'.repeat(filled)}${'▱'.repeat(10 - filled)} ${sum}/${total}`;
};

const deliveryLine = (delivery: string) =>
  delivery === 'dm'
    ? "They'll DM you to arrange delivery."
    : 'It will be in Guild Stash 1 shortly!';

const orderUrl = (origin: string) => `${origin}/order-book?view=bulk`;

// Mirrors BulkOrderCard's icon fallback chain exactly, so the Discord
// thumbnail always matches what's shown on the card in the app: an explicit
// icon_url, else a wiki-guessed icon from the link, else the generic
// fallback icon (made absolute, since Discord won't render a relative URL).
const resolveThumbnail = (order: BulkOrderLike, origin: string) => ({
  url:
    order.icon_url ??
    (order.link_url ? getWikiImgSrcFromUrl(order.link_url) : null) ??
    `${origin}/order-types/other.webp`,
});

const dedupeContributors = (contributors: BulkDiscordUser[]) => {
  const seen = new Set<string>();
  return contributors.filter((user) => {
    if (seen.has(user.id)) return false;
    seen.add(user.id);
    return true;
  });
};

export type BulkDiscordEvent =
  | {
      type: 'created';
      order: BulkOrderLike;
      owner: BulkDiscordUser;
      origin: string;
    }
  | {
      type: 'contribution';
      order: BulkOrderLike;
      owner: BulkDiscordUser;
      contributor: BulkDiscordUser;
      contributionQty: number;
      sumAfter: number;
      delivery: string;
      note?: string | null;
      origin: string;
    }
  | {
      type: 'completed';
      order: BulkOrderLike;
      owner: BulkDiscordUser;
      finalContributor: BulkDiscordUser;
      contributionQty: number;
      contributors: BulkDiscordUser[];
      delivery: string;
      note?: string | null;
      origin: string;
    }
  | {
      type: 'withdrawal';
      order: BulkOrderLike;
      owner: BulkDiscordUser;
      contributor: BulkDiscordUser;
      withdrawnQty: number;
      sumAfter: number;
      reopened: boolean;
      origin: string;
    }
  | {
      // only build/send this when contributors.length > 0 — the caller
      // sends nothing for a 0-contribution cancellation
      type: 'cancelled';
      order: BulkOrderLike;
      owner: BulkDiscordUser;
      sumAtCancellation: number;
      contributors: BulkDiscordUser[];
      origin: string;
    }
  | {
      type: 'quantityRaised';
      order: BulkOrderLike;
      owner: BulkDiscordUser;
      oldQuantity: number;
      newQuantity: number;
      sum: number;
      origin: string;
    }
  | {
      type: 'uncancelled';
      order: BulkOrderLike;
      owner: BulkDiscordUser;
      origin: string;
    };

/** Builds the exact { content, embeds } payload for one lifecycle event. */
export const buildBulkEmbed = (event: BulkDiscordEvent): BulkDiscordPayload => {
  const { order } = event;
  const thumbnail = resolveThumbnail(order, event.origin);

  switch (event.type) {
    case 'created': {
      return {
        embeds: [
          {
            title: `📦 New bulk order: ${order.quantity}× ${order.item_name}`,
            description: [
              `${displayName(event.owner)} placed this order.`,
              order.description ? `_${order.description}_` : null,
            ]
              .filter(Boolean)
              .join('\n'),
            color: BULK_ORDER_COLORS.created,
            thumbnail,
            fields: [
              { name: 'Progress', value: progressBar(0, order.quantity) },
            ],
            footer: { text: orderUrl(event.origin) },
          },
        ],
      };
    }

    case 'contribution': {
      const remaining = order.quantity - event.sumAfter;
      const fields: DiscordEmbedField[] = [
        {
          name: 'Progress',
          value: `${progressBar(event.sumAfter, order.quantity)} (${remaining} to go)`,
        },
        { name: 'Delivery', value: deliveryLine(event.delivery) },
      ];
      if (event.note) fields.push({ name: '📝 Note', value: event.note });
      return {
        // skip the ping when the owner contributed to their own order —
        // pinging someone for something they just did is never useful
        content: isSameUser(event.owner, event.contributor)
          ? undefined
          : mention(event.owner),
        embeds: [
          {
            title: `+${event.contributionQty}× ${order.item_name}`,
            description: `${displayName(event.contributor)} contributed to your bulk order.`,
            color: BULK_ORDER_COLORS.contribution,
            thumbnail,
            fields,
          },
        ],
      };
    }

    case 'completed': {
      const fields: DiscordEmbedField[] = [
        {
          name: 'Progress',
          value: progressBar(order.quantity, order.quantity),
        },
        {
          name: 'Contributors',
          value: dedupeContributors(event.contributors)
            .map((user) => `${displayName(user)}`)
            .join(', '),
        },
        { name: 'Delivery', value: deliveryLine(event.delivery) },
      ];
      if (event.note) fields.push({ name: '📝 Note', value: event.note });
      return {
        content: isSameUser(event.owner, event.finalContributor)
          ? undefined
          : mention(event.owner),
        embeds: [
          {
            title: `🎉 Complete: ${order.quantity}× ${order.item_name}`,
            description: `${displayName(event.finalContributor)} contributed the final ${event.contributionQty} — your bulk order is fully fulfilled!`,
            color: BULK_ORDER_COLORS.completed,
            thumbnail,
            fields,
          },
        ],
      };
    }

    case 'withdrawal': {
      const remaining = order.quantity - event.sumAfter;
      return {
        content: isSameUser(event.owner, event.contributor)
          ? undefined
          : mention(event.owner),
        embeds: [
          {
            title: `−${event.withdrawnQty}× ${order.item_name}`,
            description: `${displayName(event.contributor)} withdrew their contribution.`,
            color: BULK_ORDER_COLORS.withdrawal,
            thumbnail,
            fields: [
              {
                name: 'Progress',
                value: `${progressBar(event.sumAfter, order.quantity)} (${remaining} to go)${
                  event.reopened ? '\n_This order is open for contributions again._' : ''
                }`,
              },
            ],
          },
        ],
      };
    }

    case 'cancelled': {
      const contributors = dedupeContributors(event.contributors);
      return {
        content: contributors.map(mention).join(' '),
        embeds: [
          {
            title: `⚠️ Cancelled: ${order.quantity}× ${order.item_name}`,
            description: [
              `${displayName(event.owner)} cancelled this bulk order.`,
              `**${event.sumAtCancellation}** had already been contributed — check with them about anything you've already sent.`,
            ].join('\n'),
            color: BULK_ORDER_COLORS.cancelled,
            thumbnail,
            fields: [
              {
                name: 'Contributors',
                value: contributors.map((user) => displayName(user)).join(', '),
              },
            ],
          },
        ],
      };
    }

    case 'quantityRaised': {
      return {
        embeds: [
          {
            title: `📈 ${event.oldQuantity} → ${event.newQuantity}× ${order.item_name}`,
            description: `${displayName(event.owner)} increased this bulk order — contributions welcome!`,
            color: BULK_ORDER_COLORS.quantityRaised,
            thumbnail,
            fields: [
              {
                name: 'Progress',
                value: progressBar(event.sum, event.newQuantity),
              },
            ],
            footer: { text: orderUrl(event.origin) },
          },
        ],
      };
    }

    case 'uncancelled': {
      return {
        embeds: [
          {
            title: `📦 Reopened: ${order.quantity}× ${order.item_name}`,
            description: `${displayName(event.owner)} reopened this bulk order.`,
            color: BULK_ORDER_COLORS.created,
            thumbnail,
            fields: [
              { name: 'Progress', value: progressBar(0, order.quantity) },
            ],
            footer: { text: orderUrl(event.origin) },
          },
        ],
      };
    }
  }
};

/**
 * Fire-and-forget send. Always call this AFTER the triggering mutation has
 * succeeded — never before (a failed mutation must never have already
 * notified people of something that didn't happen).
 */
export const notifyBulkDiscord = async (payload: BulkDiscordPayload) => {
  try {
    await fetch(`${window.location.origin}/api/discord-notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    console.error('Failed to send bulk order Discord notification', e);
  }
};
