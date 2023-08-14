import GraphQLAppWrapper from '../_utils/GraphQLAppWrapper';
import UserList from './react/graphql-provided/UserList';

export const HomePage = ({ hasuraUri }: { hasuraUri: string }) => {
  return (
    <>
      <GraphQLAppWrapper uri={hasuraUri}>
        <UserList />
      </GraphQLAppWrapper>
    </>
  );
};
