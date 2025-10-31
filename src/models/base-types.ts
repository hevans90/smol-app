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
  'Flasks',
] as const;

export const ARMOR_DEFENCE_TYPES = [
  // order matters for specificity of array.includes
  'DexInt',
  'StrDex',
  'StrInt',
  'Str',
  'Dex',
  'Int',
] as const;

export type BaseTypeCategory = (typeof BASE_TYPE_CATEGORIES)[number];
export type ArmorDefenceType = (typeof ARMOR_DEFENCE_TYPES)[number];

export const FLASK_CLASS_NAMES = [
  'Life Flasks',
  'Mana Flasks',
  'Hybrid Flasks',
  'Utility Flasks',
] as const;

export type RawBaseItemResponse = {
  Name: string;
  IconPath: string;
  ItemClassesID: string;
  ItemClassesName: string; // raw class names from DDS, e.g. "Life Flasks"
  ItemLevel: string;
};

export type BaseItemResponse = {
  Name: string;
  IconPath: string;
  ItemClassesID: string;
  ItemClassesName: BaseTypeCategory;
  ItemLevel: string;
};

export type BaseType = BaseItemResponse & {
  DefenceType?: ArmorDefenceType;
};

export type SortedBaseTypes = {
  [key in BaseTypeCategory]: BaseType[];
};

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
