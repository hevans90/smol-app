export const BASE_TYPE_CATEGORIES = [
  'Abyss Jewels',
  'Amulets',
  'Belts',
  'Body Armours',
  'Boots',
  'Bows',
  'Claws',
  'Daggers',
  'Fishing Rods',
  'Flasks',
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
  'Tinctures',
  'Two Hand Axes',
  'Two Hand Maces',
  'Two Hand Swords',
  'Wands',
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

// Shape of src/assets/bases/pob-item-bases.json (see
// go-server/pob/extract-data.lua) — PoB's own Data/Bases tables, dumped
// as-is. Every base has `type` + `tags`; only weapons/armour/flasks get the
// matching stat sub-object.
export type PobItemBase = {
  type: string;
  subType?: string;
  tags: Record<string, boolean>;
  hidden?: boolean;
  socketLimit?: number;
  req?: { level?: number; str?: number; dex?: number; int?: number };
  weapon?: Record<string, number>;
  armour?: {
    ArmourBaseMin?: number;
    ArmourBaseMax?: number;
    EvasionBaseMin?: number;
    EvasionBaseMax?: number;
    EnergyShieldBaseMin?: number;
    EnergyShieldBaseMax?: number;
    WardBaseMin?: number;
    WardBaseMax?: number;
    BlockChance?: number;
    MovementPenalty?: number;
  };
  flask?: Record<string, unknown>;
};
