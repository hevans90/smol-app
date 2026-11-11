// The part of the atlas code the Netlify functions need: kept apart from
// atlas.ts so bundling a function doesn't pull in the node lookups.

/** One allocated tree as stored in atlas_snapshot.trees. */
export type AtlasTree = { name: string; hashes: number[] };

// The tree export new syncs are stamped with. Bump when a new league's
// export has been generated (and add its loader in atlas.ts).
export const CURRENT_ATLAS_VERSION = '3.29.1';

const toHashes = (value: unknown): number[] =>
  Array.isArray(value)
    ? value.filter((hash): hash is number => Number.isInteger(hash))
    : [];

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
