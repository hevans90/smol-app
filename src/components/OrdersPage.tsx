import GraphQLAppWrapper from '../_utils/GraphQLAppWrapper';
import { OrderBook } from './react/graphql-provided/OrderBook';

export const OrdersPage = ({ hasuraUri }: { hasuraUri: string }) => {
  return (
    <>
      <GraphQLAppWrapper uri={hasuraUri}>
        <OrderBook />
      </GraphQLAppWrapper>
    </>
  );
};
