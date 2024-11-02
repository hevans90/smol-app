export const BASE_TYPE_CATEGORIES = [
  'Abyss Jewels',
  'Amulets',
  'Belts',
  'Body Armours',
  'Boots',
  'Bows',
  'Claws',
  'Daggers',
  'Gloves',
  'Helmets',
  'Jewels',
  'One Hand Axes',
  'One Hand Maces',
  'One Hand Swords',
  'Quivers',
  'Rings',
  'Sceptres',
  'Shields',
  'Staves',
  'Thrusting One Hand Swords',
  'Two Hand Axes',
  'Two Hand Maces',
  'Two Hand Swords',
  'Wands',
] as const;

export const exclusions: {
  [key in keyof Partial<BaseItemResponse>]: string;
}[] = [
  { Name: 'Royale' },
  { Name: 'Talisman' },
  { Name: 'Energy Blade' },
  { Name: 'Ethereal Bow' },
  { Name: 'Ethereal Blade' },

  // race rewards
  { Name: 'Jet Amulet' },
  { Name: 'Jet Ring' },
  { Name: 'Golden Hoop' },
  { IconPath: 'Demi' },
];

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
