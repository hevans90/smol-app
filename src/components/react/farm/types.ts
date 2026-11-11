import type { AtlasData, AtlasTree, TreeSummary } from '../../../_utils/atlas';
import type { UsersSubSubscription } from '../../../graphql-api';

export type FarmUser = UsersSubSubscription['user'][number];

export type FarmTree = {
  /** position in the snapshot's trees, which is what a pin refers to */
  index: number;
  tree: AtlasTree;
  summary: TreeSummary;
  hashes: Set<number>;
};

/** A member who shares their atlas, with everything derived from it. */
export type FarmMember = {
  user: FarmUser;
  fetchedAt: string;
  data: AtlasData;
  /** trees with points in them, most points first */
  trees: FarmTree[];
  /**
   * Index (into `trees`) of the tree that stands for this member everywhere
   * a single tree is needed: guild overview, heat map, similarity.
   */
  mainIndex: number;
  /**
   * Why that tree. GGG's API doesn't say which tree is selected in game, so:
   *   pinned    the member chose it
   *   selected  GGG flagged it (not seen in practice)
   *   edited    its nodes changed most recently
   *   points    nothing better known: it has the most points
   */
  mainSource: 'pinned' | 'selected' | 'edited' | 'points';
  /** nodes allocated in the main tree */
  hashes: Set<number>;
  /** mechanics the main tree is built around */
  strategy: Set<string>;
  /** how alike their atlas is to the viewer's, 0-1; undefined for the viewer */
  similarity?: number;
};
