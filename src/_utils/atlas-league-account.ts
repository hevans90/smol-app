// The part of the atlas code the Netlify functions need: kept apart from
// atlas.ts so bundling a function doesn't pull in the node lookups.

/** One allocated tree as stored in atlas_snapshot.trees. */
export type AtlasTree = {
  name: string;
  hashes: number[];
  /** the tree currently selected in game, when GGG's response says so */
  active?: boolean;
  /**
   * When a sync last saw this tree's nodes differ from the sync before
   * (ISO time). Absent until a change has been witnessed. The most recently
   * edited tree is our best guess at the one in use.
   */
  changed_at?: string;
};

const sameHashes = (a: number[], b: number[]) => {
  if (a.length !== b.length) return false;
  const seen = new Set(a);
  return b.every((hash) => seen.has(hash));
};

/**
 * Stamps freshly fetched trees with changed_at by comparing each with the
 * tree in the same position of the previous snapshot. With no previous
 * snapshot nothing is stamped: a first sight is not a change.
 */
export const stampTreeChanges = (
  trees: AtlasTree[],
  previous: AtlasTree[] | undefined,
  now: string,
): AtlasTree[] =>
  trees.map((tree, index) => {
    if (!previous) return tree;
    const before = previous[index];
    const changed = before
      ? !sameHashes(before.hashes ?? [], tree.hashes)
      : tree.hashes.length > 0;
    const changed_at = changed ? now : before?.changed_at;
    return changed_at ? { ...tree, changed_at } : tree;
  });

// The tree export new syncs are stamped with. Bump when a new league's
// export has been generated (and add its loader in atlas.ts).
export const CURRENT_ATLAS_VERSION = '3.29.1';

const toHashes = (value: unknown): number[] =>
  Array.isArray(value)
    ? value.filter((hash): hash is number => Number.isInteger(hash))
    : [];

// GGG documents only `name` and `hashes` per tree: nothing says which tree is
// the one selected in game. These are the names such a flag would plausibly
// have if the real response carries one; unexpectedLeagueAccountKeys() below
// is how we find out what it actually sends.
const ACTIVE_FLAGS = ['active', 'selected', 'is_active', 'is_selected', 'current'];
const isActive = (tree: any) =>
  ACTIVE_FLAGS.some((flag) => tree?.[flag] === true) || undefined;

const KNOWN_ACCOUNT_KEYS = new Set(['atlas_passive_trees', 'atlas_passives', 'mercenaries']);
const KNOWN_TREE_KEYS = new Set(['name', 'hashes']);

/**
 * Field names in a /league-account response that the docs don't mention
 * (names only, never values). The sync logs them: an undocumented field is
 * the only way the selected tree could reach us.
 */
export const unexpectedLeagueAccountKeys = (response: unknown): string[] => {
  const root = (response ?? {}) as Record<string, any>;
  const account = (root.league_account ?? root) as Record<string, any>;
  const found = new Set<string>();
  for (const key of Object.keys(account ?? {})) {
    if (!KNOWN_ACCOUNT_KEYS.has(key)) found.add(key);
  }
  for (const tree of Array.isArray(account?.atlas_passive_trees)
    ? account.atlas_passive_trees
    : []) {
    for (const key of Object.keys(tree ?? {})) {
      if (!KNOWN_TREE_KEYS.has(key)) found.add(`atlas_passive_trees[].${key}`);
    }
  }
  return [...found].sort();
};

/**
 * Pulls the atlas trees out of GGG's GET /league-account/<league> response.
 *
 * `rawTrees` is the atlas part exactly as received and is stored alongside
 * the normalised `trees`, so if GGG changes the shape (expected in 3.30) only
 * this function needs a new branch — nobody has to re-sync.
 */
export const parseLeagueAccount = (
  response: unknown,
): { trees: AtlasTree[]; rawTrees: unknown } => {
  const root = (response ?? {}) as Record<string, any>;
  const account = (root.league_account ?? root) as Record<string, any>;

  // current shape: atlas_passive_trees: [{ name, hashes }]
  if (Array.isArray(account.atlas_passive_trees)) {
    return {
      rawTrees: account.atlas_passive_trees,
      trees: account.atlas_passive_trees.map((tree: any, index: number) => ({
        name: typeof tree?.name === 'string' && tree.name ? tree.name : `Tree ${index + 1}`,
        hashes: toHashes(tree?.hashes),
        active: isActive(tree),
      })),
    };
  }

  // pre-3.24 shape: atlas_passives: { hashes }
  if (account.atlas_passives) {
    return {
      rawTrees: account.atlas_passives,
      trees: [{ name: 'Atlas', hashes: toHashes(account.atlas_passives.hashes) }],
    };
  }

  return { rawTrees: null, trees: [] };
};
