import type {
  GuildBuildStatsSubscription,
  ProfileBulkContributionsSubscription,
  ProfileBulkOrdersSubscription,
  ProfileCharacterFieldsFragment,
  ProfileOrdersSubscription,
  UserFieldsFragment,
} from '../../../graphql-api';

export type ProfileCharacter = ProfileCharacterFieldsFragment;
export type ProfileStats = NonNullable<ProfileCharacter['stats']>;
export type PersonRef = UserFieldsFragment;

export const personName = (user: PersonRef) =>
  user.discord_name ?? user.poe_name ?? 'someone';

export const isRanked = (character: ProfileCharacter) => character.rank > 0;

/** 1234 → "1.2k", 4_500_000 → "4.5M" */
export const compact = (value: number) =>
  Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value);

// ---- guild comparison -------------------------------------------------------

export type PlacedStat = 'combined_dps' | 'total_ehp' | 'life' | 'energy_shield';

/**
 * Where a build sits among every computed build in the league: the share of
 * them it beats, 0-1. Undefined when there's nothing to compare against.
 */
export const guildPlacement = (
  guild: GuildBuildStatsSubscription['character'] | undefined,
  characterId: string,
  stat: PlacedStat,
  value: number,
) => {
  const others = (guild ?? [])
    .filter(({ id, stats }) => id !== characterId && stats && stats.combined_dps + stats.total_ehp > 0)
    .map(({ stats }) => stats![stat]);
  if (others.length < 3) return undefined;
  return others.filter((other) => other < value).length / others.length;
};

/** 0.93 → "Top 7%", 0.4 → "Top 60%" */
export const placementLabel = (placement: number) =>
  `Top ${Math.max(1, Math.round((1 - placement) * 100))}%`;

// ---- order ledger and activity ----------------------------------------------

type Orders = ProfileOrdersSubscription['user_item_order'];
type Contributions = ProfileBulkContributionsSubscription['bulk_order_contribution'];
type BulkOrders = ProfileBulkOrdersSubscription['bulk_order'];

export type ActivityEvent = {
  id: string;
  at: string;
  kind: 'requested' | 'received' | 'fulfilled' | 'contributed' | 'bulk-requested' | 'bulk-completed';
  item: string;
  icon?: string | null;
  quantity?: number;
  /** the other member involved */
  other?: PersonRef;
};

export type Ally = { user: PersonRef; gave: number; got: number };

export type Ledger = {
  /** orders this member fulfilled for others */
  fulfilled: number;
  /** items handed into others' bulk orders */
  bulkGiven: number;
  bulkGivenOrders: number;
  /** their own orders someone fulfilled */
  received: number;
  /** items others put into their bulk orders */
  bulkReceived: number;
  /** how many times someone contributed to their bulk orders */
  bulkReceivedContributions: number;
  openOrders: number;
  openBulk: number;
  allies: Ally[];
  activity: ActivityEvent[];
};

export const buildLedger = (
  userId: string,
  orders: Orders,
  contributions: Contributions,
  bulkOrders: BulkOrders,
): Ledger => {
  const activity: ActivityEvent[] = [];
  const allies = new Map<string, Ally>();
  const ally = (user: PersonRef) => {
    let entry = allies.get(user.id);
    if (!entry) allies.set(user.id, (entry = { user, gave: 0, got: 0 }));
    return entry;
  };

  let fulfilled = 0;
  let received = 0;
  let openOrders = 0;
  for (const order of orders) {
    const item = order.description || 'an item';
    if (order.user_id === userId) {
      activity.push({ id: `r-${order.id}`, at: order.created_at, kind: 'requested', item, icon: order.icon_url });
      if (order.fulfilled_by_user) {
        received++;
        if (order.fulfilled_by !== userId) ally(order.fulfilled_by_user).gave++;
        // fulfilling is the last edit an order gets
        activity.push({
          id: `g-${order.id}`,
          at: order.updated_at,
          kind: 'received',
          item,
          icon: order.icon_url,
          other: order.fulfilled_by_user,
        });
      } else {
        openOrders++;
      }
    } else if (order.fulfilled_by === userId) {
      fulfilled++;
      ally(order.user).got++;
      activity.push({
        id: `f-${order.id}`,
        at: order.updated_at,
        kind: 'fulfilled',
        item,
        icon: order.icon_url,
        other: order.user,
      });
    }
  }

  let bulkGiven = 0;
  const givenOrders = new Set<string>();
  for (const contribution of contributions) {
    const { bulk_order: bulk } = contribution;
    if (bulk.user.id === userId) continue; // topping up their own order
    bulkGiven += contribution.quantity;
    givenOrders.add(bulk.id);
    ally(bulk.user).got++;
    activity.push({
      id: `c-${contribution.id}`,
      at: contribution.created_at,
      kind: 'contributed',
      item: bulk.item_name,
      icon: bulk.icon_url,
      quantity: contribution.quantity,
      other: bulk.user,
    });
  }

  let bulkReceived = 0;
  let bulkReceivedContributions = 0;
  let openBulk = 0;
  for (const bulk of bulkOrders) {
    activity.push({
      id: `b-${bulk.id}`,
      at: bulk.created_at,
      kind: 'bulk-requested',
      item: bulk.item_name,
      icon: bulk.icon_url,
      quantity: bulk.quantity,
    });
    if (bulk.completed_at) {
      activity.push({
        id: `bc-${bulk.id}`,
        at: bulk.completed_at,
        kind: 'bulk-completed',
        item: bulk.item_name,
        icon: bulk.icon_url,
        quantity: bulk.quantity,
      });
    } else if (!bulk.cancelled_at) {
      openBulk++;
    }
    for (const contribution of bulk.contributions) {
      if (contribution.user.id === userId) continue;
      bulkReceived += contribution.quantity;
      bulkReceivedContributions++;
      ally(contribution.user).gave++;
    }
  }

  return {
    fulfilled,
    bulkGiven,
    bulkGivenOrders: givenOrders.size,
    received,
    bulkReceived,
    bulkReceivedContributions,
    openOrders,
    openBulk,
    allies: [...allies.values()]
      .sort((a, b) => b.gave + b.got - (a.gave + a.got))
      .slice(0, 6),
    activity: activity.sort((a, b) => (a.at < b.at ? 1 : -1)),
  };
};

// ---- badges -----------------------------------------------------------------

export type Badge = { key: string; label: string; detail: string; tone: 'gold' | 'red' | 'blue' | 'green' };

export const badgesFor = ({
  characters,
  ledger,
  sharesAtlas,
}: {
  characters: ProfileCharacter[];
  ledger?: Ledger;
  sharesAtlas: boolean;
}): Badge[] => {
  const badges: Badge[] = [];
  const top = characters.reduce<ProfileCharacter | undefined>(
    (best, character) => (!best || character.level > best.level ? character : best),
    undefined,
  );
  const ranked = characters.filter(isRanked);
  const bestRank = ranked.length ? Math.min(...ranked.map(({ rank }) => rank)) : undefined;

  if (top?.level === 100) {
    badges.push({ key: 'lvl100', label: 'Level 100', detail: top.name, tone: 'gold' });
  }
  if (bestRank !== undefined && bestRank <= 10) {
    badges.push({ key: 'top10', label: `Ladder #${bestRank}`, detail: 'Top 10 in the league', tone: 'gold' });
  }
  const fallen = characters.filter(({ dead }) => dead).length;
  if (fallen) {
    badges.push({
      key: 'rip',
      label: `${fallen} fallen`,
      detail: fallen === 1 ? 'One character died' : `${fallen} characters died`,
      tone: 'red',
    });
  }
  if (characters.some(({ twitch }) => twitch)) {
    badges.push({ key: 'twitch', label: 'Streamer', detail: 'Twitch linked on the ladder', tone: 'blue' });
  }
  if (ledger && ledger.fulfilled >= 5) {
    badges.push({
      key: 'giver',
      label: ledger.fulfilled >= 25 ? 'Patron' : 'Supplier',
      detail: `${ledger.fulfilled} orders fulfilled`,
      tone: 'green',
    });
  }
  if (ledger && ledger.bulkGiven >= 100) {
    badges.push({ key: 'bulk', label: 'Bulk hauler', detail: `${compact(ledger.bulkGiven)} items given`, tone: 'green' });
  }
  if (sharesAtlas) {
    badges.push({ key: 'atlas', label: 'Atlas shared', detail: 'On the Farm board', tone: 'blue' });
  }
  return badges;
};
