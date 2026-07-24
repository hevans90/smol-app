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
  // Newline-joined implicit mod text (one or more lines) and their
  // [category, subCategory] tags, in the same order. Absent when the base
  // has no implicit. Untyped as a strict tuple since this comes straight
  // off a dynamically-imported JSON asset (TS infers plain string[][] for
  // it, not [string, string][], making an `as PobItemBase` cast against
  // the JSON import unsound) — nothing here destructures it as a tuple.
  implicit?: string;
  implicitModTypes?: string[][];
};

// Shape of src/assets/uniques/unique-item-previews.json (see
// go-server/pob/extract-data.lua) — a unique item's base type and mod text,
// parsed from Path of Building's own Data/Uniques text blocks. Used to
// build a canonical, static item preview for orders (see
// buildOrderItemPreview in src/_utils/utils.ts), since order rows have no
// real per-instance item data to draw from.
export type UniqueItemPreview = {
  baseType: string;
  implicitMods: string[];
  explicitMods: string[];
  corrupted?: boolean;
  // A unique's own level/attribute requirement, when it differs from its
  // base type's — e.g. Oriath's End: base Bismuth Flask requires level 8,
  // the unique itself requires 56; The Will of Uul-Netol: base Organic Ring
  // requires level 32, the unique requires 42. Parsed from PoB's raw
  // "LevelReq: N" / "Requires Level N[, X Str][, Y Dex][, Z Int]" lines —
  // 746/1304 uniques have a levelReq override, 215/194/241 have a
  // str/dex/intReq override respectively (some uniques have attribute
  // overrides with NO level override, e.g. "Requires 8 Str, 8 Dex"). Falls
  // back to the base type's own req.level/str/dex/int (PobItemBase) when
  // absent.
  levelReq?: number;
  strReq?: number;
  dexReq?: number;
  intReq?: number;
};
