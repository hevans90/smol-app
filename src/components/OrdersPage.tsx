import { useEffect, useState } from 'react';
import GraphQLAppWrapper from '../_utils/GraphQLAppWrapper';
import { BulkOrderBook } from './react/graphql-provided/BulkOrderBook';
import { OrderBook } from './react/graphql-provided/OrderBook';
import { type OrdersView, OrdersViewSwitcher } from './react/OrdersViewSwitcher';

export const OrdersPage = ({ hasuraUri }: { hasuraUri: string }) => {
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
