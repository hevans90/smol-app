import { search as fuzzySearch } from 'fast-fuzzy';
import basesResponse from '../assets/bases/all-basetypes.json';
import uniquesResponse from '../assets/uniques/uniques.json';
import {
  type ArmorDefenceType,
  type BaseItemResponse,
  type BaseType,
  type SortedBaseTypes,
  ARMOR_DEFENCE_TYPES,
  BASE_TYPE_CATEGORIES,
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
  const basesData = (basesResponse as { data: BaseItemResponse[] }).data.filter(
    (item) => BASE_TYPE_CATEGORIES.includes(item.ItemClassesName),
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

export const getUniqueItemWikiLink = async (itemName: string) => {
  const baseUrl = 'https://www.poewiki.net/w/api.php';
  const wikiBase = 'https://www.poewiki.net/wiki/';

  const params = new URLSearchParams({
    action: 'cargoquery',
    format: 'json',
    tables: 'items',
    fields: 'name,inventory_icon',
    where: `rarity="Unique" AND name="${itemName}"`,
    limit: '1',
    origin: '*',
  });

  const url = `${baseUrl}?${params.toString()}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.cargoquery && data.cargoquery.length > 0) {
      const name = data.cargoquery[0].title.name as string;
      const pageName = name.replace(/ /g, '_');
      const encodedPageName = encodeURIComponent(pageName);
      return wikiBase + encodedPageName;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error fetching data:', error);
    return null;
  }
};
