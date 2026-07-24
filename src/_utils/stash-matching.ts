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
    availableQuantity: hits.reduce((sum, item) => sum + (item.stackSize ?? 1), 0),
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
  // order.type is 'base'/'gem'/'other', or there's no usable identity to
  // match against at all.
  unverifiable?: boolean;
};

export const matchRegularOrder = (
  items: AggregatedStashItem[],
  order: {
    type: string;
    description: string;
    link_url?: string | null;
    item_base_type?: string | null;
  },
): RegularFulfillVerdict => {
  if (order.type !== 'unique') {
    // item_order_type_enum's full value set is 'unique', 'base', 'gem', and
    // 'other' (hasura/seeds/default/1705593048567_item_order_type.sql) —
    // only uniques have a canonical identity (a real name) this can match a
    // stash item against; the rest share a base type across many different
    // items (base/gem) or are pure free text (other) with nothing reliable
    // to match on.
    return { matched: false, unverifiable: true };
  }

  const candidate = deriveUniqueNameCandidate(order).toLowerCase();
  if (!candidate) return { matched: false, unverifiable: true };

  // Unidentified uniques come back from the stash API with a generic/empty
  // name, so a name match against them would always false-negative anyway —
  // excluding them is a correctness improvement, not a limitation to work
  // around here (surfaced as UI copy instead: "identify it in-game first").
  const hit = items.find(
    (item) =>
      item.rarity === 'unique' &&
      item.identified &&
      item.name?.trim().toLowerCase() === candidate,
  );
  if (!hit) return { matched: false };

  const baseNeedle = order.item_base_type?.trim().toLowerCase();
  const baseTypeMismatch =
    !!baseNeedle &&
    hit.baseType?.trim().toLowerCase() !== baseNeedle &&
    hit.typeLine?.trim().toLowerCase() !== baseNeedle;

  return {
    matched: true,
    location: { tabId: hit.tabId, tabName: hit.tabName },
    baseTypeMismatch,
  };
};
