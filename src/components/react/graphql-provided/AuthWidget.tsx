import { IconLogout } from '@tabler/icons-react';
import { isAfter } from 'date-fns';
import { useEffect, useState } from 'react';
import { twMerge } from 'tailwind-merge';
import { discordStore } from '../../../_state/discord.state';
import { poeStore } from '../../../_state/poe.state';
import { AuthModal } from '../../auth/auth-modal';
import {
  getStoredDiscordUser,
  prepareDiscordLink,
} from '../../auth/discord-auth/DiscordAuth';
import { clearPoESession, startPoEReauth } from '../../auth/poe-auth/PoEAuth';

type Session = {
  signedIn: boolean;
  poeName: string | null;
  // the PoE token lapsed; the app session (hasura token) is still good
  poeExpired: boolean;
  discord: ReturnType<typeof getStoredDiscordUser>;
};

const readSession = (): Session => {
  const token = localStorage.getItem('hasura_token');
  const poeName = localStorage.getItem('poe_username');
  const poeToken = localStorage.getItem('poe_token');
  const poeExpiry = localStorage.getItem('poe_expiry');
  const poeValid =
    !!poeName && !!poeToken && !!poeExpiry && isAfter(new Date(poeExpiry), new Date());
  return {
    signedIn: !!token && token !== 'undefined',
    poeName,
    poeExpired: !poeValid && !!poeName && !!token,
    discord: getStoredDiscordUser(),
  };
};

// The PoE and Discord stores other islands read (stash check, profile,
// order @mentions) are filled from storage here, once per page.
const syncStores = () => {
  const poeName = localStorage.getItem('poe_username');
  const poeToken = localStorage.getItem('poe_token');
  const poeExpiry = localStorage.getItem('poe_expiry');
  if (poeName && poeToken && poeExpiry && isAfter(new Date(poeExpiry), new Date())) {
    poeStore.set({ expiry: poeExpiry, token: poeToken, username: poeName, id: '' });
  }
  const discord = getStoredDiscordUser();
  if (discord) {
    discordStore.set({
      expiry: localStorage.getItem('discord_expiry') ?? '',
      token: localStorage.getItem('discord_token') ?? '',
      username: discord.global_name,
      id: discord.id,
    });
  }
};

const signOut = () => {
  localStorage.removeItem('discord_token');
  localStorage.removeItem('discord_expiry');
  localStorage.removeItem('discord_userdata');
  discordStore.set({ expiry: '', token: '', username: '', id: '' });
  clearPoESession();
};

const chip =
  'flex h-9 items-center gap-2 rounded-full border bg-gray-900 p-1 text-sm no-underline transition-colors sm:pr-3';

// Path of Exile: who you're signed in as (to your profile), a reconnect when
// the PoE token has lapsed, or the sign-in.
const PoEChip = ({ session }: { session: Session }) => {
  if (!session.signedIn) {
    return (
      <button
        type="button"
        onClick={() => void startPoEReauth()}
        className={twMerge(chip, 'border-primary-800 pr-3 text-primary-500 hover:border-primary-500')}
      >
        <img src="/poe-logo-original.png" alt="" className="h-7 w-7 object-contain" />
        Sign in
      </button>
    );
  }
  if (session.poeExpired) {
    return (
      <button
        type="button"
        onClick={() => void startPoEReauth()}
        title="Your Path of Exile session expired: stash check and your profile are off until you reconnect"
        className={twMerge(chip, 'border-red-400 text-red-400 hover:border-red-300 hover:text-red-300')}
      >
        <img src="/poe-logo-original.png" alt="" className="h-7 w-7 object-contain" />
        <span className="hidden sm:inline">Reconnect</span>
      </button>
    );
  }
  return (
    <a
      href="/profile"
      title="Path of Exile"
      className={twMerge(chip, 'border-primary-900 text-primary-500 hover:border-primary-600 hover:text-primary-300')}
    >
      <img src="/poe-logo-original.png" alt="" className="h-7 w-7 object-contain" />
      <span className="hidden max-w-[9rem] truncate sm:inline">{session.poeName}</span>
    </a>
  );
};

// Discord: the linked account, or the link to connect one (after PoE).
const DiscordChip = ({
  session,
  discordOauthUrl,
}: {
  session: Session;
  discordOauthUrl: string;
}) => {
  const { discord } = session;
  if (discord) {
    return (
      <div
        title="Discord"
        className={twMerge(chip, 'border-discord-500/60 text-primary-500')}
      >
        {discord.avatar ? (
          <img
            src={`https://cdn.discordapp.com/avatars/${discord.id}/${discord.avatar}.png?size=64`}
            alt=""
            className="h-7 w-7 rounded-full"
          />
        ) : (
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-discord-500">
            <img src="/discord-logo.svg" alt="" className="h-4 w-4" />
          </span>
        )}
        <span className="hidden max-w-[9rem] truncate sm:inline">
          {discord.global_name}
        </span>
      </div>
    );
  }
  if (!session.signedIn) {
    return (
      <div
        title="Sign in with Path of Exile first"
        className={twMerge(chip, 'cursor-not-allowed border-gray-800 text-gray-600')}
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-800">
          <img src="/discord-logo.svg" alt="" className="h-4 w-4 opacity-40" />
        </span>
        <span className="hidden sm:inline">Discord</span>
      </div>
    );
  }
  return (
    <a
      href={discordOauthUrl}
      onClick={prepareDiscordLink}
      className={twMerge(chip, 'border-discord-500 bg-discord-500 text-white hover:border-discord-400 hover:bg-discord-400 hover:text-white')}
    >
      <span className="flex h-7 w-7 items-center justify-center">
        <img src="/discord-logo.svg" alt="" className="h-4 w-4" />
      </span>
      <span className="hidden sm:inline">Connect</span>
    </a>
  );
};

const AuthWidget = ({
  authPrompt,
  discordOauthUrl,
  hasuraUri,
}: {
  authPrompt: boolean;
  discordOauthUrl: string;
  hasuraUri: string;
}) => {
  const [session, setSession] = useState(readSession);

  useEffect(() => {
    syncStores();
    const onStorage = () => setSession(readSession());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return (
    <>
      <div className="flex items-center gap-1.5 sm:gap-2">
        <PoEChip session={session} />
        <DiscordChip session={session} discordOauthUrl={discordOauthUrl} />
        {session.signedIn && (
          <button
            type="button"
            title="Log out"
            aria-label="Log out"
            onClick={() => {
              signOut();
              window.location.reload();
            }}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-transparent text-primary-800 hover:bg-gray-800 hover:text-primary-300"
          >
            <IconLogout size={18} />
          </button>
        )}
      </div>
      {authPrompt && (
        <AuthModal discordOauthUrl={discordOauthUrl} hasuraUri={hasuraUri} />
      )}
    </>
  );
};

export default AuthWidget;
