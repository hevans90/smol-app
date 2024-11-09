import GraphQLAppWrapper from '../_utils/GraphQLAppWrapper';
import { LeagueLadder } from './react/graphql-provided/LeagueLadder';

export const LadderPage = ({ hasuraUri }: { hasuraUri: string }) => {
  return (
    <>
      <GraphQLAppWrapper uri={hasuraUri}>
        <LeagueLadder />
      </GraphQLAppWrapper>
    </>
  );
};
