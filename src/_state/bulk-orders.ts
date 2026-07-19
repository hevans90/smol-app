import { persistentAtom } from '@nanostores/persistent';
import { atom } from 'nanostores';

export type BulkOrderSort = 'newest' | 'closest-to-complete' | 'largest';

export const bulkShowCompletedStore = persistentAtom<boolean>(
  'bulkShowCompleted',
  false,
  {
    encode: JSON.stringify,
    decode: JSON.parse,
  },
);

export const bulkShowCancelledStore = persistentAtom<boolean>(
  'bulkShowCancelled',
  false,
  {
    encode: JSON.stringify,
    decode: JSON.parse,
  },
);

export const bulkSortStore = persistentAtom<BulkOrderSort>(
  'bulkSort',
  'newest',
  {
    encode: JSON.stringify,
    decode: JSON.parse,
  },
);

export const bulkFuzzySearchStore = atom<string>('');
