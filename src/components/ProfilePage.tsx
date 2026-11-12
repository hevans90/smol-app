import GraphQLAppWrapper from '../_utils/GraphQLAppWrapper';
import { ProfileScreen } from './react/graphql-provided/ProfileScreen';

export const ProfilePage = ({ hasuraUri }: { hasuraUri: string }) => (
  <GraphQLAppWrapper uri={hasuraUri}>
    <ProfileScreen />
  </GraphQLAppWrapper>
);
