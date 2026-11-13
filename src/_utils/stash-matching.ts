import stackablesResponse from '../assets/stackables/stackables.json';
import type { AggregatedStashItem } from '../models/ggg-stash';
import type { StackableSearchResult } from './utils';

const stackableItems = stackablesResponse as StackableSearchResult[];
const knownStackableNames = new Set(
  stackableItems.map((item) => item.name.toLowerCase()),
);

export type BulkFulfillVerdict = {
  matched: boolean;
  availableQuantity: number;
  locations: { tabId: string; tabName: string; stackSize: number }[];
  // true when item_name isn't a recognised canonical stackable name — a
  // "not found" result here might just mean the name doesn't match exactly,
  // not that the item is genuinely absent (see StackableItemPicker's
  // "custom item" escape hatch — kind isn't persisted, so this is the best
  // we can tell after the fact).
  unverifiableName: boolean;
};

export const matchBulkOrder = (
  items: AggregatedStashItem[],
  order: { item_name: string },
): BulkFulfillVerdict => {
  const needle = order.item_name.trim().toLowerCase();
  const hits = items.filter(
    (item) =>
      (item.typeLine?.trim().toLowerCase() === needle ||
        item.baseType?.trim().toLowerCase() === needle) &&
      (item.stackSize ?? 1) > 0,
  );
  return {
    matched: hits.length > 0,
    availableQuantity: hits.reduce(
      (sum, item) => sum + (item.stackSize ?? 1),
      0,
    ),
    locations: hits.map((item) => ({
      tabId: item.tabId,
      tabName: item.tabName,
      stackSize: item.stackSize ?? 1,
    })),
    unverifiableName: !knownStackableNames.has(needle),
  };
};

// Regular (unique) orders store the mundane base type in item_base_type
// (e.g. "Leather Belt") — that's shared across many different uniques, so
// it's the wrong field to match identity on. The unique's actual proper
// name lives in the poewiki link_url's trailing path segment (same
// extraction getWikiImgSrcFromUrl uses), falling back to the free-typed
// description field.
export const deriveUniqueNameCandidate = (order: {
  link_url?: string | null;
  description: string;
}): string => {
  if (order.link_url?.includes('poewiki.net/wiki/')) {
    const slug = order.link_url.split('/').pop();
    if (slug) return decodeURIComponent(slug).replace(/_/g, ' ').trim();
  }
  return order.description.trim();
};

export type RegularFulfillVerdict = {
  matched: boolean;
  location?: { tabId: string; tabName: string };
  // Found an item with a matching name, but its base type disagrees with
  // the order's stored item_base_type — surfaced as a soft warning, not a
  // reason to say "not found", since the name match is the stronger signal.
  baseTypeMismatch?: boolean;
  // an 'other' order, or one with nothing to match on
  unverifiable?: boolean;
};

// GGG sends rarity capitalised ("Unique"); frameType is the fallback
// (3 = unique, 4 = gem).
const isUnique = (item: AggregatedStashItem) =>
  item.rarity?.toLowerCase() === 'unique' || item.frameType === 3;
const isGem = (item: AggregatedStashItem) =>
  item.rarity?.toLowerCase() === 'gem' || item.frameType === 4;

const lower = (text?: string | null) => text?.trim().toLowerCase() ?? '';

const FOULBORN_PREFIX = 'foulborn ';

const found = (hit: AggregatedStashItem | undefined): RegularFulfillVerdict =>
  hit
    ? { matched: true, location: { tabId: hit.tabId, tabName: hit.tabName } }
    : { matched: false };

export const matchRegularOrder = (
  items: AggregatedStashItem[],
  order: {
    type: string;
    description: string;
    link_url?: string | null;
    item_base_type?: string | null;
  },
): RegularFulfillVerdict => {
  // item_order_type_enum: 'unique', 'base', 'gem', 'other'
  // (hasura/seeds/default/1705593048567_item_order_type.sql)
  if (order.type === 'gem') {
    // the order search stores the gem's name as its base type; PoB names
    // support gems without the " Support" the game shows
    const needle = lower(order.item_base_type) || lower(order.description);
    if (!needle) return { matched: false, unverifiable: true };
    const names = new Set([needle, `${needle} support`]);
    return found(
      items.find(
        (item) =>
          isGem(item) &&
          (names.has(lower(item.typeLine)) || names.has(lower(item.baseType))),
      ),
    );
  }

  if (order.type === 'base') {
    // any non-unique item on that base will do (white, magic or rare)
    const needle = lower(order.item_base_type);
    if (!needle) return { matched: false, unverifiable: true };
    return found(
      items.find(
        (item) =>
          !isUnique(item) && !isGem(item) && lower(item.baseType) === needle,
      ),
    );
  }

  if (order.type !== 'unique') {
    // free text: nothing reliable to match on
    return { matched: false, unverifiable: true };
  }

  const candidate = lower(deriveUniqueNameCandidate(order));
  if (!candidate) return { matched: false, unverifiable: true };
  const foulborn = candidate.startsWith(FOULBORN_PREFIX);
  const plainName = foulborn
    ? candidate.slice(FOULBORN_PREFIX.length)
    : candidate;

  // Unidentified uniques come back with no name, so they can't match by
  // name; they're skipped rather than guessed at.
  const hit = items.find((item) => {
    if (!isUnique(item) || !item.identified) return false;
    const name = lower(item.name);
    // a plain order doesn't want the Foulborn version
    if (name === candidate) return foulborn || !item.mutated;
    // a Foulborn order wants the Foulborn version, however GGG names it
    return foulborn && name === plainName && !!item.mutated;
  });
  if (!hit) return { matched: false };

  const baseNeedle = lower(order.item_base_type);
  const baseTypeMismatch =
    !!baseNeedle &&
    lower(hit.baseType) !== baseNeedle &&
    lower(hit.typeLine) !== baseNeedle;

  return {
    matched: true,
    location: { tabId: hit.tabId, tabName: hit.tabName },
    baseTypeMismatch,
  };
};
