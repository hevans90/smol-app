import { persistentAtom } from '@nanostores/persistent';

type LeagueFilter = { league: string };
type Filter = LeagueFilter | string;

export const isLeagueFilter = (filter: Filter): filter is LeagueFilter =>
  !!(filter as LeagueFilter)?.league;

export const userListFilterStore = persistentAtom<Filter[]>(
  'userListFilters',
  [],
  {
    encode: JSON.stringify,
    decode: JSON.parse,
  }
);
