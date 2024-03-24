import { useMyRole } from '../../../hooks/useMyRole';
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
  const role = useMyRole();
  return (
    <>
      <div className="fixed right-3 top-3 flex flex-col gap-4 min-w-[10rem] z-10">
        <PoEAuth logoutOnly={true} />
        <DiscordAuth discordOauthUrl={discordOauthUrl} logoutOnly={true} />
        {role === 'dev' ? (
          <div className="flex justify-end ">
            <div className="bg-primary-800 py-1 px-2 text-gray-900 rounded">
              ADMIN
            </div>
          </div>
        ) : null}
      </div>
      {authPrompt && (
        <AuthModal discordOauthUrl={discordOauthUrl} hasuraUri={hasuraUri} />
      )}
    </>
  );
};

export default AuthWidget;
