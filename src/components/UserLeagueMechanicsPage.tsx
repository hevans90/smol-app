import GraphQLAppWrapper from '../_utils/GraphQLAppWrapper';
import { FarmBoard } from './react/graphql-provided/FarmBoard';

export const UserLeagueMechanicsPage = ({
  hasuraUri,
}: {
  hasuraUri: string;
}) => {
  return (
    <>
      <GraphQLAppWrapper uri={hasuraUri}>
        <FarmBoard />
      </GraphQLAppWrapper>
    </>
  );
};
