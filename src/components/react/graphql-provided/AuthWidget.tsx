import GraphQLAppWrapper from '../../../_utils/GraphQLAppWrapper';
import { AuthModal } from '../../auth/auth-modal';
import DiscordAuth from '../../auth/discord-auth/DiscordAuth';
import PoEAuth from '../../auth/poe-auth/PoEAuth';

const AuthWidget = ({
  authPrompt,
  discordOauthUrl,
  hasuraUri,
}: {
  authPrompt: boolean;
  discordOauthUrl: string;
  hasuraUri: string;
}) => {
  return (
    <GraphQLAppWrapper uri={hasuraUri}>
      <div className="fixed right-3 top-3 flex flex-col gap-4 min-w-[10rem] z-10">
        <PoEAuth logoutOnly={true} />
        <DiscordAuth discordOauthUrl={discordOauthUrl} logoutOnly={true} />
      </div>
      {authPrompt && <AuthModal discordOauthUrl={discordOauthUrl} />}
    </GraphQLAppWrapper>
  );
};

export default AuthWidget;
