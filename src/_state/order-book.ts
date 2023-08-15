import { persistentAtom } from '@nanostores/persistent';
import type { Item_Order_Type_Enum } from '../graphql-api';

export const orderBookShowFulfilledStore = persistentAtom<boolean>(
  'orderBookShowFulfilled',
  true,
  {
    encode: JSON.stringify,
    decode: JSON.parse,
  }
);

export const orderBookTypeFiltersStore = persistentAtom<{
  [key in Item_Order_Type_Enum]?: boolean;
}>(
  'orderBookTypeFilters',
  {},
  {
    encode: JSON.stringify,
    decode: JSON.parse,
  }
);

export const orderBookFuzzySearchStore = persistentAtom<string>(
  'orderBookFuzzySearch',
  ''
);
