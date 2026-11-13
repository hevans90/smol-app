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
    gem: true,
    base: true
  },
  {
    encode: JSON.stringify,
    decode: JSON.parse,
  }
);

/** Turn these types' filters on, so an order you just placed isn't hidden. */
export const showOrderTypes = (types: Item_Order_Type_Enum[]) => {
  const current = orderBookTypeFiltersStore.get();
  if (types.every((type) => current[type] !== false)) return;
  orderBookTypeFiltersStore.set({
    ...current,
    ...Object.fromEntries(types.map((type) => [type, true])),
  });
};

export const orderBookFuzzySearchStore = atom<string>('');
