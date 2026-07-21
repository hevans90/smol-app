export type GGGCharacterResponse = {
  items: GGGItem[];
  character: {
    name: string;
    realm: 'pc';
    class: string;
    league: string;
    level: number;
  };
  passiveTree: GGGPassiveTree;
};

export type GGGSkillOverrides = Record<string, GGGSkillOverride>;

export interface GGGSkillOverride {
  name: string;
  icon: string;
  activeEffectImage?: string;
  inactiveIcon?: string;
  activeIcon?: string;
  isMastery?: boolean;
  isTattoo?: boolean;
  stats: string[];
}

export type GGGPassiveTree = {
  items: GGGItem[];
  skillOverrides: GGGSkillOverrides;
};

export interface GGGItem {
  verified: boolean;
  w: number;
  h: number;
  icon: string;
  league: string;
  id: string;
  sockets?: GGGItemSocket[];
  name: string;
  typeLine: string;
  baseType: string;
  rarity?: GGGItemRarity;
  ilvl: number;
  identified: boolean;
  corrupted?: boolean;
  properties?: GGGItemProperty[];
  requirements?: GGGItemRequirement[];
  fracturedMods?: string[];
  enchantMods?: string[];
  craftedMods?: string[];
  implicitMods?: string[];
  explicitMods?: string[];
  flavourText?: string[];
  frameType: number;
  x: number;
  y: number;
  inventoryId: GGGInventoryId;
  socketedItems?: GGGSocketedItem[]; // Reference socketed item structure
  // Stash/currency items only (not present on character/passive-tree items).
  stackSize?: number;
  maxStackSize?: number;
  // Influence flags. `shaper`/`elder` predate the other four and are only
  // ever present as flat top-level booleans; the four Conquerors-of-the-
  // Atlas influences added later are only ever present under the nested
  // `influences` object — GGG never backported them into flat fields. An
  // item can have at most two influences at once, from either source.
  shaper?: boolean;
  elder?: boolean;
  influences?: Partial<Record<GGGInfluence, boolean>>;
  // Eldritch corruption markers (GGG's own field names, confirmed against
  // their developer docs — NOT "eaterOfWorlds"/"searingExarch" as the names
  // might suggest): `searing` = Searing Exarch, `tangled` = Eater of Worlds.
  // Flat top-level booleans, present and true only when corrupted by that
  // eldritch horror.
  searing?: boolean;
  tangled?: boolean;
}

export type GGGInfluence =
  | 'shaper'
  | 'elder'
  | 'crusader'
  | 'redeemer'
  | 'hunter'
  | 'warlord'
  | 'searing'
  | 'tangled';

// Display order matches the game's own convention closely enough for our
// purposes — shaper/elder first (the original pair), then the four
// Conquerors of the Atlas influences, then the eldritch corruption markers
// (searing = Searing Exarch, tangled = Eater of Worlds).
export const INFLUENCE_ORDER: GGGInfluence[] = [
  'shaper',
  'elder',
  'crusader',
  'redeemer',
  'hunter',
  'warlord',
  'searing',
  'tangled',
];

export interface GGGSocketedItem extends GGGItem {
  support?: boolean;
  socket?: number;
  colour?: string;
  additionalProperties?: GGGItemProperty[];
}

export interface GGGItemSocket {
  group: number;
  attr: string;
  sColour: string;
}

export interface GGGItemProperty {
  name: string;
  values: [string, number][];
  displayMode: number;
  progress?: number;
  type: number;
}

interface GGGItemRequirement {
  name: string;
  values: [string, number][];
  displayMode: number;
  type: number;
  suffix?: string;
}

export type GGGItemRarity =
  | 'normal'
  | 'magic'
  | 'rare'
  | 'unique'
  | 'gem'
  | 'currency';

export type GGGInventoryId =
  | 'Amulet'
  | 'Belt'
  | 'BodyArmour'
  | 'Boots'
  | 'Flask'
  | 'FishingRod'
  | 'Gloves'
  | 'Helm'
  | 'Offhand'
  | 'Ring'
  | 'Ring2'
  | 'Ring3' // third ring slot, e.g. the "Nameless bloodline" ruleset
  | 'Trinket'
  | 'Weapon';

export const maxGemSockets: Record<GGGInventoryId, number> = {
  Amulet: 1, // Special bases or breach ammy
  Belt: 2, // Stygian Vise supports up to 2 sockets
  BodyArmour: 6,
  Boots: 4,
  Flask: 0,
  FishingRod: 4, // very special
  Gloves: 4,
  Helm: 4,
  Offhand: 3, // Shields/quivers have up to 3 sockets
  Ring: 1, // Rarely socketable, e.g., special crafting
  Ring2: 1, // Rarely socketable, e.g., special crafting
  Ring3: 1,
  Trinket: 0,
  Weapon: 6, // Two-handed weapons, bows, or certain unique weapons
};
