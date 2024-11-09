import GraphQLAppWrapper from '../_utils/GraphQLAppWrapper';
import { UserLeagueMechanics } from './react/graphql-provided/UserLeagueMechanics';

export const UserLeagueMechanicsPage = ({
  hasuraUri,
}: {
  hasuraUri: string;
}) => {
  return (
    <>
      <GraphQLAppWrapper uri={hasuraUri}>
        <UserLeagueMechanics />
      </GraphQLAppWrapper>
    </>
  );
};
