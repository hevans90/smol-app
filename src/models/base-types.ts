export const BASE_TYPE_CATEGORIES = [
  'Two Hand Swords',
  'Wands',
  'Daggers',
  'Claws',
  'One Hand Axes',
  'One Hand Swords',
  'Thrusting One Hand Swords',
  'One Hand Maces',
  'Sceptres',
  'Bows',
  'Staves',
  'Two Hand Axes',
  'Two Hand Maces',
  'Rings',
  'Amulets',
  'Belts',
  'Shields',
  'Helmets',
  'Body Armours',
  'Boots',
  'Gloves',
  'Quivers',
  'Jewels',
  'Abyss Jewels',
] as const;

export type BaseTypeCategory = (typeof BASE_TYPE_CATEGORIES)[number];

export type BaseItemResponse = {
  Name: string;
  IconPath: string;
  ItemClassesID: string;
  ItemClassesName: BaseTypeCategory;
  ItemLevel: string;
};

export type SortedBaseTypes = {
  [key in BaseTypeCategory]: BaseItemResponse[];
};
