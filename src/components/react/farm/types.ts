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
  /** every node allocated in any tree */
  hashes: Set<number>;
  /** mechanics any of their trees is built around */
  strategy: Set<string>;
  /** how alike their atlas is to the viewer's, 0-1; undefined for the viewer */
  similarity?: number;
};
