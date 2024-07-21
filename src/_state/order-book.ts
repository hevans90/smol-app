import { persistentAtom } from '@nanostores/persistent';
import { atom } from 'nanostores';
import type { Item_Order_Type_Enum } from '../graphql-api';

export const orderBookShowFulfilledStore = persistentAtom<boolean>(
  'orderBookShowFulfilled',
  false,
  {
    encode: JSON.stringify,
    decode: JSON.parse,
  }
);
export const orderBookShowInactiveStore = persistentAtom<boolean>(
  'orderBookShowInactive',
  false,
  {
    encode: JSON.stringify,
    decode: JSON.parse,
  }
);

export const orderBookTypeFiltersStore = persistentAtom<{
  [key in Item_Order_Type_Enum]?: boolean;
}>(
  'orderBookTypeFilters',
  {
    other: true,
    unique: true,
    transfiguredgem: true,
    base: true
  },
  {
    encode: JSON.stringify,
    decode: JSON.parse,
  }
);

export const orderBookFuzzySearchStore = atom<string>('');
