import GraphQLAppWrapper from '../_utils/GraphQLAppWrapper';
import { ProfileScreen } from './react/graphql-provided/ProfileScreen';

export const ProfilePage = ({
  hasuraUri,
  discordOauthUrl,
}: {
  hasuraUri: string;
  discordOauthUrl: string;
}) => (
  <GraphQLAppWrapper uri={hasuraUri}>
    <ProfileScreen discordOauthUrl={discordOauthUrl} />
  </GraphQLAppWrapper>
);
