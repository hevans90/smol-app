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
      <div className="fixed right-3 top-3 z-10 flex min-w-[10rem] flex-col gap-2">
        <PoEAuth logoutOnly={true} />
        <DiscordAuth discordOauthUrl={discordOauthUrl} logoutOnly={true} />
        {role === 'dev' ? (
          <div className="flex justify-end text-xs">
            <div className="rounded bg-primary-800 px-2 py-1 text-gray-900">
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
