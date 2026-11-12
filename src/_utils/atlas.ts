// Turns a member's allocated atlas passives into a farming strategy.
//
// Node ids are reshuffled every league, so nothing here knows any: the
// node -> mechanic lookup is generated per tree version by
// scripts/generate-atlas-data.mjs from GGG's official export.

// 'start' is the unnamed root every tree grows from: drawn, never allocated
export type AtlasNodeKind =
  | 'small'
  | 'notable'
  | 'keystone'
  | 'mastery'
  | 'gateway'
  | 'start';

export type AtlasNode = {
  name: string;
  kind: AtlasNodeKind;
  mechanic: string;
  stats: string[];
  /** position on the tree; absent for masteries, which aren't drawn */
  x?: number;
  y?: number;
};

/** [fromHash, toHash, arcRadius (0 = straight line), SVG sweep-flag] */
export type AtlasEdge = [number, number, number, number];

export type AtlasData = {
  version: string;
  totalPoints: number | null;
  /** mechanic key -> display label */
  mechanics: Record<string, string>;
  /** mechanic keys that aren't something you farm (map sustain, bosses...) */
  generic: string[];
  nodes: Record<string, AtlasNode>;
  /** [minX, minY, maxX, maxY] of the node positions */
  bounds: [number, number, number, number];
  edges: AtlasEdge[];
};

// Mechanics with artwork in public/league-icons.
// 3.30 split league mechanics into tiers on the atlas tree:
//   primary   - the Thread mechanics, with full clusters
//   secondary - the tree can guarantee at least one encounter in a map
//   tertiary  - the tree only raises the chance they appear
// Mechanics outside these (altars, bosses, gold...) are "other". Versions
// before the split have no tiers.
export type MechanicTier = 'primary' | 'secondary' | 'tertiary';

const TIERS_330: Record<string, MechanicTier> = {
  abyss: 'primary',
  bestiary: 'primary',
  betrayal: 'primary',
  blight: 'primary',
  breach: 'primary',
  expedition: 'primary',
  incursion: 'primary',
  legion: 'primary',
  ritual: 'primary',
  ultimatum: 'primary',
  essence: 'secondary',
  harvest: 'secondary',
  mercenaries: 'secondary',
  rogue_exiles: 'secondary',
  settlers_of_kalguur: 'secondary',
  shrines: 'secondary',
  strongboxes: 'secondary',
  torment: 'secondary',
  beyond: 'tertiary',
  delirium: 'tertiary',
  mirage: 'tertiary',
  sentinels: 'tertiary',
  wildwood: 'tertiary',
};

const MECHANIC_TIERS: Record<string, Record<string, MechanicTier>> = {
  '3.30.0': TIERS_330,
};

/** The mechanic's tier in this tree version; undefined for "other" or pre-3.30. */
export const tierOf = (data: AtlasData, mechanic: string): MechanicTier | undefined =>
  MECHANIC_TIERS[data.version]?.[mechanic];

export const hasTiers = (data: AtlasData) => !!MECHANIC_TIERS[data.version];

// public/league-icons/<key>.webp; most are game minimap icons (via poedb).
// conquerors and shaper_elder are composites of the influence symbols.
export const MECHANICS_WITH_ICON = new Set([
  'abyss', 'altar_eater', 'altar_exarch', 'bestiary', 'betrayal', 'beyond',
  'blight', 'breach', 'conquerors', 'delirium', 'delve', 'divination', 'essence',
  'expedition', 'gold', 'harbinger', 'harvest', 'heist', 'incursion', 'labyrinth',
  'legion', 'maven', 'memories', 'mercenaries', 'mirage', 'ritual', 'rogue_exiles',
  'sanctum', 'sentinels', 'settlers_of_kalguur', 'shaper_elder', 'shrines', 'strongboxes',
  'synthesis', 'torment', 'ultimatum', 'wildwood',
]);

export {
  parseLeagueAccount,
  type AtlasTree,
} from './atlas-league-account';
import type { AtlasTree } from './atlas-league-account';

// Loaded on demand: each lookup is ~170KB and only the Farm page needs it.
const loaders: Record<string, () => Promise<{ default: unknown }>> = {
  '3.29.1': () => import('../assets/atlas/atlas-3.29.1.json'),
  '3.30.0': () => import('../assets/atlas/atlas-3.30.0.json'),
};

/** Game versions this build can draw, newest first: what Admin offers. */
export const ATLAS_VERSIONS = Object.keys(loaders).sort((a, b) =>
  b.localeCompare(a, undefined, { numeric: true }),
);

export const loadAtlasData = async (
  version: string,
): Promise<AtlasData | undefined> => {
  const loader = loaders[version];
  return loader ? ((await loader()).default as AtlasData) : undefined;
};

export type MechanicInvestment = {
  key: string;
  label: string;
  /** allocated nodes, weighted: small 1, notable 2, keystone 3 */
  weight: number;
  /** share of the tree's farming weight (generic mechanics excluded), 0-1 */
  share: number;
  /** names of the allocated notables and keystones */
  highlights: string[];
};

export type TreeSummary = {
  name: string;
  /** points spent (small + notable + keystone nodes) */
  allocated: number;
  /** farming mechanics, heaviest first */
  mechanics: MechanicInvestment[];
  /** map sustain, bosses etc. — reported, but not part of the strategy */
  generic: MechanicInvestment[];
  keystones: { name: string; mechanic: string }[];
  /** hashes not in this tree version's lookup (wrong version, or new nodes) */
  unknown: number;
};

const WEIGHTS: Partial<Record<AtlasNodeKind, number>> = {
  small: 1,
  notable: 2,
  keystone: 3,
};

export const summariseTree = (tree: AtlasTree, data: AtlasData): TreeSummary => {
  const generic = new Set(data.generic);
  const byMechanic = new Map<string, { weight: number; highlights: string[] }>();
  const keystones: TreeSummary['keystones'] = [];
  let allocated = 0;
  let unknown = 0;

  for (const hash of new Set(tree.hashes)) {
    const node = data.nodes[String(hash)];
    if (!node) {
      unknown++;
      continue;
    }
    const weight = WEIGHTS[node.kind];
    if (!weight) continue; // masteries and gateways cost nothing

    allocated++;
    const entry = byMechanic.get(node.mechanic) ?? { weight: 0, highlights: [] };
    entry.weight += weight;
    if (node.kind !== 'small') entry.highlights.push(node.name);
    byMechanic.set(node.mechanic, entry);
    if (node.kind === 'keystone') {
      keystones.push({ name: node.name, mechanic: node.mechanic });
    }
  }

  const farmingWeight = [...byMechanic]
    .filter(([key]) => !generic.has(key))
    .reduce((sum, [, entry]) => sum + entry.weight, 0);

  const toInvestments = (wantGeneric: boolean): MechanicInvestment[] =>
    [...byMechanic]
      .filter(([key]) => generic.has(key) === wantGeneric)
      .map(([key, entry]) => ({
        key,
        label: data.mechanics[key] ?? key,
        weight: entry.weight,
        share: !wantGeneric && farmingWeight ? entry.weight / farmingWeight : 0,
        highlights: entry.highlights.sort(),
      }))
      .sort((a, b) => b.weight - a.weight || a.label.localeCompare(b.label));

  return {
    name: tree.name,
    allocated,
    mechanics: toInvestments(false),
    generic: toInvestments(true),
    keystones: keystones.sort((a, b) => a.name.localeCompare(b.name)),
    unknown,
  };
};

// A mechanic counts as part of someone's strategy once it holds this much of
// their farming weight — below it, it's a few travel nodes or a dabble.
export const STRATEGY_SHARE_THRESHOLD = 0.12;

/** The mechanics a tree is actually built around, heaviest first. */
export const strategyOf = (summary: TreeSummary): MechanicInvestment[] =>
  summary.mechanics.filter(({ share }) => share >= STRATEGY_SHARE_THRESHOLD);

/** How alike two atlases are: shared nodes over all nodes either took, 0-1. */
export const atlasSimilarity = (a: Set<number>, b: Set<number>): number => {
  if (!a.size || !b.size) return 0;
  let shared = 0;
  for (const hash of a) if (b.has(hash)) shared++;
  return shared / (a.size + b.size - shared);
};
