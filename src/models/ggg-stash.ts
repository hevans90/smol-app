import type { GGGItem } from './ggg-responses';

// Shape of GET /stash/<league> — a tree: folder-type tabs carry `children`
// and have no items of their own; every other type is a leaf whose contents
// are fetched separately via GET /stash/<league>/<id>[/<childId>]. The list
// comes back as { stashes }, one tab as { stash } (with its items, and for
// unique/map tabs the substashes as children).
export interface GGGStashTab {
  id: string;
  name: string;
  type: string; // e.g. 'PremiumStash', 'QuadStash', 'Folder', 'CurrencyStash', ...
  metadata: { public?: boolean; folder?: boolean; colour?: string };
  children?: GGGStashTab[];
}

export type AggregatedStashItem = GGGItem & {
  tabId: string;
  tabName: string;
  /** Foulborn uniques */
  mutated?: boolean;
};

export type StashScanProgress =
  | { phase: 'idle' }
  | {
      phase: 'listing' | 'fetching' | 'waiting' | 'done' | 'stopped';
      /** tabs read so far */
      scanned: number;
      /** tabs the API wouldn't return */
      skipped: number;
      /** tabs known about so far (special tabs reveal more as they load) */
      total: number;
      currentTabName?: string;
      /** while waiting out GGG's rate limit: when the next request goes */
      waitUntil?: number;
    };

export type StashScanError =
  | { kind: 'missing-scope' }
  | { kind: 'rate-limited'; retryAfterSeconds: number }
  | { kind: 'no-poe-account' }
  | { kind: 'network' | 'unknown'; message: string };
