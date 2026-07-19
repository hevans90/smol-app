import { useEffect, useState } from 'react';
import { sortedBaseItemsStore } from '../_state/base-items';
import GraphQLAppWrapper from '../_utils/GraphQLAppWrapper';
import type { SortedBaseTypes } from '../models/base-types';
import { BulkOrderBook } from './react/graphql-provided/BulkOrderBook';
import { OrderBook } from './react/graphql-provided/OrderBook';
import { type OrdersView, OrdersViewSwitcher } from './react/OrdersViewSwitcher';

export const OrdersPage = ({
  hasuraUri,
  sortedBaseItems,
}: {
  hasuraUri: string;
  sortedBaseItems: SortedBaseTypes;
}) => {
  sortedBaseItemsStore.set(sortedBaseItems);

  // client:only island — window is always available here
  const [view, setView] = useState<OrdersView>(() =>
    new URLSearchParams(window.location.search).get('view') === 'bulk'
      ? 'bulk'
      : 'orders',
  );

  // Keep view in sync with back/forward navigation between the two ?view=
  // links (OrdersViewSwitcher renders plain <a> tags, not client-side nav).
  useEffect(() => {
    const onPopState = () => {
      setView(
        new URLSearchParams(window.location.search).get('view') === 'bulk'
          ? 'bulk'
          : 'orders',
      );
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  return (
    <GraphQLAppWrapper uri={hasuraUri}>
      <OrdersViewSwitcher active={view} />
      {view === 'bulk' ? <BulkOrderBook /> : <OrderBook />}
    </GraphQLAppWrapper>
  );
};
