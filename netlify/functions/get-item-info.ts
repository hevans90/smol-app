import type { Handler, HandlerEvent } from '@netlify/functions';
import invariant from 'tiny-invariant';
import { getBaseTypeCategory } from '../../src/_utils/utils';
import uniqueBaseTypesResponse from '../../src/assets/uniques/unique-base-types.json';

const uniqueBaseTypesByName: Record<string, string> = uniqueBaseTypesResponse;

// `name` comes from the last path segment of a pasted poewiki.net URL (see
// OrderForm.tsx's getBaseItemInfoFromWikiLink), so it's MediaWiki's
// page-title format — underscores for spaces, percent-encoded punctuation —
// not the plain in-game display name our local unique-base-types map is
// keyed by.
const toDisplayName = (wikiPageTitle: string): string => {
  try {
    return decodeURIComponent(wikiPageTitle).replace(/_/g, ' ');
  } catch {
    return wikiPageTitle.replace(/_/g, ' ');
  }
};

// Looks up a unique item's base type and category from local data extracted
// from Path of Building's own item database — this used to call
// poewiki.net's API directly, but poewiki now sits behind Anubis
// bot-protection that blocks this app's requests outright, so every lookup
// failed (loudly here — it throws and blocks order submission, unlike the
// bulk-order flow's silent empty-string fallback, which is what broke the
// Google Sheets base-type export).
export const getBaseItem = (itemName: string) => {
  const displayName = toDisplayName(itemName);
  const baseItem = uniqueBaseTypesByName[displayName] ?? itemName;
  const category = getBaseTypeCategory(baseItem);

  return { baseItem, category };
};

export const handler: Handler = async (event: HandlerEvent) => {
  invariant(event.queryStringParameters);
  const { name } = event.queryStringParameters;
  invariant(name);

  const itemInfo = getBaseItem(name);
  return {
    statusCode: 200,
    body: JSON.stringify(itemInfo),
  };
};
