import type { AtlasData, AtlasTree, TreeSummary } from '../../../_utils/atlas';
import type { UsersSubSubscription } from '../../../graphql-api';

export type FarmUser = UsersSubSubscription['user'][number];

export type FarmTree = {
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
   * Index of the tree that stands for this member everywhere a single tree
   * is needed (guild overview, heat map, similarity): the one selected in
   * game when GGG tells us, otherwise the one with the most points.
   */
  mainIndex: number;
  /** true when mainIndex came from GGG rather than the most-points guess */
  mainKnown: boolean;
  /** nodes allocated in the main tree */
  hashes: Set<number>;
  /** mechanics the main tree is built around */
  strategy: Set<string>;
  /** how alike their atlas is to the viewer's, 0-1; undefined for the viewer */
  similarity?: number;
};
