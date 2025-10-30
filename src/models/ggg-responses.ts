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
}

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
  Trinket: 0,
  Weapon: 6, // Two-handed weapons, bows, or certain unique weapons
};
