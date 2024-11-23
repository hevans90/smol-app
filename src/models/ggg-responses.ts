export type GGGCharacterResponse = {
  items: GGGItem[];
  character: {
    name: string;
    realm: 'pc';
    class: string;
    league: string;
    level: number;
  };
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
  rarity: string;
  ilvl: number;
  identified: boolean;
  corrupted?: boolean;
  properties?: GGGItemProperty[];
  requirements?: GGGItemRequirement[];
  enchantMods?: string[];
  craftedMods?: string[];
  implicitMods?: string[];
  explicitMods?: string[];
  flavourText?: string[];
  frameType: number;
  x: number;
  y: number;
  inventoryId: string;
  socketedItems?: GGGSocketedItem[]; // Reference socketed item structure
}

interface GGGSocketedItem extends GGGItem {
  support?: boolean;
  socket?: number;
  colour?: string;
  additionalProperties?: GGGItemProperty[];
}

interface GGGItemSocket {
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
