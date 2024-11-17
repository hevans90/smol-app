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

export type GGGItem = {
  verified: boolean;
  w: number;
  h: number;
  icon: string;
  league: string;
  id: string;
  name: string;
  typeLine: string;
  baseType: string;
  rarity: 'Rare' | 'Magic' | 'Unique';
  ilvl: number;
  identified: boolean;
  properties: Property[];
  requirements: Requirement[];
  enchantMods: string[];
  implicitMods?: string[];
  explicitMods: string[];
  frameType: number;
  x: number;
  y: number;
  inventoryId: string;
  utilityMods?: string[];
  craftedMods?: string[];
  descrText?: string;
  flavourText?: string[];
};

type Property = {
  name: string;
  values: [string, number][];
  displayMode: number;
  type: number;
};

type Requirement = {
  name: string;
  values: [string, number][];
  displayMode: number;
  type: number;
};
