import { IconLogout } from '@tabler/icons-react';
import { isAfter } from 'date-fns';
import { useEffect, useState } from 'react';
import { discordStore } from '../../../_state/discord.state';
import { poeStore } from '../../../_state/poe.state';
import { AuthModal } from '../../auth/auth-modal';
import {
  getStoredDiscordUser,
  prepareDiscordLink,
} from '../../auth/discord-auth/DiscordAuth';
import { clearPoESession, startPoEReauth } from '../../auth/poe-auth/PoEAuth';
import { myProfileHref } from '../profile/links';
import {
  AccountChipBody,
  accountChipClass,
  discordAvatarUrl,
} from '../ui/AccountChip';

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

// Path of Exile: who you're signed in as (to your profile), a reconnect when
// the PoE token has lapsed, or the sign-in.
const PoEChip = ({ session }: { session: Session }) => {
  if (!session.signedIn) {
    return (
      <button
        type="button"
        onClick={() => void startPoEReauth()}
        className={accountChipClass('poe')}
      >
        <AccountChipBody service="poe" tone="poe" label="Sign in" />
      </button>
    );
  }
  if (session.poeExpired) {
    return (
      <button
        type="button"
        onClick={() => void startPoEReauth()}
        title="Your Path of Exile session expired: stash check and your profile are off until you reconnect"
        className={accountChipClass('expired')}
      >
        <AccountChipBody
          service="poe"
          tone="expired"
          label="Reconnect"
          labelClassName="hidden sm:flex"
        />
      </button>
    );
  }
  return (
    <a href={myProfileHref()} title="Your profile" className={accountChipClass('poe')}>
      <AccountChipBody
        service="poe"
        tone="poe"
        label={session.poeName}
        labelClassName="hidden sm:flex"
      />
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
      <div title="Discord" className={accountChipClass('discord')}>
        <AccountChipBody
          service="discord"
          tone="discord"
          avatarUrl={discordAvatarUrl(discord.id, discord.avatar)}
          label={discord.global_name}
          labelClassName="hidden sm:flex"
        />
      </div>
    );
  }
  if (!session.signedIn) {
    return (
      <div
        title="Sign in with Path of Exile first"
        className={accountChipClass('off', 'cursor-not-allowed')}
      >
        <AccountChipBody
          service="discord"
          tone="off"
          label="Discord"
          labelClassName="hidden sm:flex"
        />
      </div>
    );
  }
  return (
    <a
      href={discordOauthUrl}
      onClick={prepareDiscordLink}
      title="Connect Discord"
      className={accountChipClass('discord')}
    >
      <AccountChipBody
        service="discord"
        tone="discord"
        label="Connect"
        labelClassName="hidden sm:flex"
      />
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
            className="flex h-9 w-9 items-center justify-center rounded-md bg-transparent text-primary-800 hover:bg-gray-800 hover:text-primary-300"
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
