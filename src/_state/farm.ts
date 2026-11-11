import { persistentAtom } from '@nanostores/persistent';

// Mechanic keys the Farm page is filtered to (a member must match them all).
export const farmFilterStore = persistentAtom<string[]>('farmFilters', [], {
  encode: JSON.stringify,
  decode: JSON.parse,
});
