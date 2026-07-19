import { search as fuzzySearch } from 'fast-fuzzy';
import basesResponse from '../assets/bases/all-basetypes.json';
import stackablesResponse from '../assets/stackables/stackables.json';
import uniquesResponse from '../assets/uniques/uniques.json';
import {
  type ArmorDefenceType,
  type BaseItemResponse,
  type BaseType,
  type RawBaseItemResponse,
  type SortedBaseTypes,
  ARMOR_DEFENCE_TYPES,
  BASE_TYPE_CATEGORIES,
  FLASK_CLASS_NAMES,
  exclusions,
} from '../models/base-types';
import type { DDSItem } from '../models/dds-items';

const uniqueItems: DDSItem[] = Object.entries(uniquesResponse)
  .map(([key, item]) => ({
    ...item,
    id: `${item.id}_${key}`,
  }))
  .reduce<DDSItem[]>((acc, item) => {
    if (!acc.some((existing) => existing.name === item.name)) {
      acc.push(item as DDSItem);
    }
    return acc;
  }, []);

export const getSortedBaseItems = () => {
  const rawBases = (basesResponse as { data: RawBaseItemResponse[] }).data;

  // Select only the top 2 Life and top 2 Mana flasks by ItemLevel.
  const lifeFlasks = rawBases
    .filter((i) => i.ItemClassesName === 'Life Flasks')
    .sort((a, b) => parseInt(b.ItemLevel) - parseInt(a.ItemLevel))
    .slice(0, 2)
    .map((i) => ({ ...i, ItemClassesName: 'Flasks' as const }));

  const manaFlasks = rawBases
    .filter((i) => i.ItemClassesName === 'Mana Flasks')
    .sort((a, b) => parseInt(b.ItemLevel) - parseInt(a.ItemLevel))
    .slice(0, 2)
    .map((i) => ({ ...i, ItemClassesName: 'Flasks' as const }));

  // Include ALL Utility flasks
  const utilityFlasks = rawBases
    .filter((i) => i.ItemClassesName === 'Utility Flasks')
    .map((i) => ({ ...i, ItemClassesName: 'Flasks' as const }));

  const selectedFlasks = [...lifeFlasks, ...manaFlasks, ...utilityFlasks];

  // Exclude all other flask classes (Hybrid/Utility and the rest of Life/Mana beyond top 2)
  const nonFlaskItems = rawBases.filter(
    (i) => !(FLASK_CLASS_NAMES as readonly string[]).includes(i.ItemClassesName),
  );

  const normalizedBases: Array<RawBaseItemResponse & { ItemClassesName: string }> = [
    ...nonFlaskItems,
    ...selectedFlasks,
  ];

  const basesData = (
    normalizedBases.filter((item) =>
      BASE_TYPE_CATEGORIES.includes(item.ItemClassesName as any),
    ) as unknown as BaseItemResponse[]
  );

  const baseItemsWithoutExclusions = filterExclusions(basesData, exclusions);

  const baseItemsWithDefenceTypes: BaseType[] = baseItemsWithoutExclusions.map(
    (item) => ({
      ...item,
      DefenceType: getDefenceType(item.IconPath),
    }),
  );

  return baseItemsWithDefenceTypes.reduce<SortedBaseTypes>((acc, obj) => {
    const key = obj.ItemClassesName;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(obj);
    acc[key].sort((a, b) => parseInt(b.ItemLevel) - parseInt(a.ItemLevel));

    return acc;
  }, {} as SortedBaseTypes);
};

const filterExclusions = (
  items: BaseItemResponse[],
  exclusions: { [key in keyof Partial<BaseItemResponse>]: string }[],
): BaseItemResponse[] =>
  items.filter(
    (item) =>
      !exclusions.some((exclusion) =>
        Object.entries(exclusion).some(([key, value]) =>
          item[key as keyof BaseItemResponse].includes(value),
        ),
      ),
  );

const getDefenceType = (iconPath: string): ArmorDefenceType | undefined =>
  ARMOR_DEFENCE_TYPES.find((defenceType) => iconPath.includes(defenceType)) as
    | ArmorDefenceType
    | undefined;

export const mapDdsToPoeImageUrl = (
  ddsFilePath: string,
  width = 1,
  height = 1,
) => {
  const baseUrl = 'https://web.poecdn.com/image/';
  const pathWithoutExt = ddsFilePath.replace(/\.dds$/, '');
  return `${baseUrl}${pathWithoutExt}.png?scale=1&w=${width}&h=${height}`;
};

// Derives an inventory icon from a poewiki page link, e.g.
// https://www.poewiki.net/wiki/Ming%27s_Heart -> Special:FilePath/Ming's_Heart_inventory_icon.png
export const getWikiImgSrcFromUrl = (url: string) => {
  const itemName = url.split('/').pop();
  return `https://www.poewiki.net/wiki/Special:FilePath/${itemName}_inventory_icon.png`;
};

// Same idea, but starting from a bare item name rather than a full wiki URL
// (used for the bulk order "custom item" escape hatch, where there's no
// wiki link yet — just a best-effort guess at the icon).
export const guessWikiIconUrlFromName = (name: string) =>
  `https://www.poewiki.net/wiki/Special:FilePath/${name.replace(/ /g, '_')}_inventory_icon.png`;

export type UniqueSearchResult = {
  name: string;
  id: string;
  class: string;
  icon: string;
};

export const searchUniquesByNameOrBase = (
  query: string,
  maxResults = 6,
): UniqueSearchResult[] =>
  fuzzySearch(query, uniqueItems, {
    keySelector: (item) => [item.name, item.item_class],
    threshold: 0.7,
  })
    .filter((item) => !item.is_alternate_art)
    .slice(0, maxResults)
    .map((item) => ({
      name: item.name,
      id: item.id,
      class: item.item_class,
      icon: mapDdsToPoeImageUrl(item.visual_identity.dds_file),
    }));

export type StackableSearchResult = {
  name: string;
  category: string;
  icon: string;
};

const stackableItems = stackablesResponse as StackableSearchResult[];

// Currency/essences/fragments/etc only — NOT uniques, which are single-item
// and served by the existing (searchUniquesByNameOrBase) order flow. Backs
// the bulk order item picker.
//
// Item names here are multi-word ("Screaming Essence of Contempt"), and the
// natural way to type-ahead them is one abbreviation per word ("scr cont").
// fast-fuzzy's whole-string edit distance scores that query far from the
// full name and misses it, so word matches are found first (every query
// token must be a substring of some word in the name — order-independent,
// so "cont scr" also matches), then padded with fast-fuzzy's typo-tolerant
// full-string search for single-word/misspelled queries.
export const searchStackablesByName = (
  query: string,
  maxResults = 8,
): StackableSearchResult[] => {
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return [];

  const rank = (item: StackableSearchResult) => {
    const lowerName = item.name.toLowerCase();
    if (lowerName.startsWith(query.toLowerCase())) return 0;
    const firstWord = lowerName.split(/\s+/)[0];
    if (tokens[0] && firstWord.startsWith(tokens[0])) return 1;
    return 2;
  };

  const wordMatches = stackableItems
    .filter((item) => {
      const words = item.name.toLowerCase().split(/\s+/);
      return tokens.every((token) => words.some((word) => word.includes(token)));
    })
    .sort((a, b) => rank(a) - rank(b));

  if (wordMatches.length >= maxResults) {
    return wordMatches.slice(0, maxResults);
  }

  const fuzzyMatches = fuzzySearch(query, stackableItems, {
    keySelector: (item) => item.name,
    threshold: 0.7,
  });

  const seen = new Set(wordMatches.map((item) => item.name));
  for (const item of fuzzyMatches) {
    if (wordMatches.length >= maxResults) break;
    if (seen.has(item.name)) continue;
    seen.add(item.name);
    wordMatches.push(item);
  }

  return wordMatches.slice(0, maxResults);
};

export const getUniqueItemWikiInfo = async (itemName: string) => {
  const baseUrl = 'https://www.poewiki.net/w/api.php';
  const wikiBase = 'https://www.poewiki.net/wiki/';

  const params = new URLSearchParams({
    action: 'cargoquery',
    format: 'json',
    tables: 'items',
    fields: 'name,inventory_icon,base_item',
    where: `rarity="Unique" AND name="${itemName}"`,
    limit: '1',
    origin: '*',
  });

  const url = `${baseUrl}?${params.toString()}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.cargoquery && data.cargoquery.length > 0) {
      const item = data.cargoquery[0].title;
      const name = item.name as string;
      const baseItem = item['base item'] as string;
      const pageName = name.replace(/ /g, '_');
      const encodedPageName = encodeURIComponent(pageName);

      return {
        wikiLink: wikiBase + encodedPageName,
        baseItem: baseItem,
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error fetching data:', error);
    return null;
  }
};
