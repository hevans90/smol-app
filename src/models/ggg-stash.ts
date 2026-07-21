import type { GGGItem } from './ggg-responses';

// Shape of GET /stash/<league> — a tree: folder-type tabs carry `children`
// and have no items of their own; every other type is a leaf whose contents
// are fetched separately via GET /stash/<league>/<id>[/<childId>].
export interface GGGStashTab {
  id: string;
  name: string;
  type: string; // e.g. 'PremiumStash', 'QuadStash', 'Folder', 'CurrencyStash', ...
  metadata: { public?: boolean; folder?: boolean; colour?: string };
  children?: GGGStashTab[];
}

export type AggregatedStashItem = GGGItem & { tabId: string; tabName: string };

export type StashScanProgress = {
  phase: 'listing-tabs' | 'fetching-tabs' | 'done';
  currentTabIndex?: number;
  totalTabs?: number;
  currentTabName?: string;
};

export type StashScanError =
  | { kind: 'missing-scope' }
  | { kind: 'rate-limited'; retryAfterSeconds: number }
  | { kind: 'no-poe-account' }
  | { kind: 'network' | 'unknown'; message: string };
