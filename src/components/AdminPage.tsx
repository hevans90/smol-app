import GraphQLAppWrapper from '../_utils/GraphQLAppWrapper';
import { AdminPanel } from './react/graphql-provided/AdminPanel';

export const AdminPage = ({ hasuraUri }: { hasuraUri: string }) => {
  return (
    <GraphQLAppWrapper uri={hasuraUri}>
      <AdminPanel />
    </GraphQLAppWrapper>
  );
};
