import { sortedBaseItemsStore } from '../_state/base-items';
import GraphQLAppWrapper from '../_utils/GraphQLAppWrapper';
import type { SortedBaseTypes } from '../models/base-types';
import { OrderBook } from './react/graphql-provided/OrderBook';

export const OrdersPage = ({
  hasuraUri,
  sortedBaseItems,
}: {
  hasuraUri: string;
  sortedBaseItems: SortedBaseTypes;
}) => {
  sortedBaseItemsStore.set(sortedBaseItems);
  return (
    <>
      <GraphQLAppWrapper uri={hasuraUri}>
        <OrderBook />
      </GraphQLAppWrapper>
    </>
  );
};
