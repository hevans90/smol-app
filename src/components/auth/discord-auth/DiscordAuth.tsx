import { useStore } from '@nanostores/react';
import { useEffect, useState } from 'react';
import { discordStore } from '../../../_state/discord.state';
import { poeStore } from '../../../_state/poe.state';

type StoredDiscordUser = { id: string; avatar: string; global_name: string };

// The Discord identity saved by verify-discord.astro. Returns undefined when
// nothing usable is stored (never linked, logged out, or a failed OAuth round
// trip that stored an error payload with no id).
export const getStoredDiscordUser = (): StoredDiscordUser | undefined => {
  try {
    const parsed = JSON.parse(localStorage.getItem('discord_userdata') ?? '');
    return parsed?.id ? (parsed as StoredDiscordUser) : undefined;
  } catch {
    return undefined;
  }
};

const DiscordAuth = ({
  discordOauthUrl,
  logoutOnly,
}: {
  discordOauthUrl: string;
  logoutOnly?: boolean;
}) => {
  const { token: loggedIntoPoE } = useStore(poeStore);

  const [loggedIn, setloggedIn] = useState<boolean>(false);
  const [userData, setUserData] = useState<StoredDiscordUser | null>(null);

  const logout = () => {
    localStorage.removeItem('discord_token');
    localStorage.removeItem('discord_expiry');
    localStorage.removeItem('discord_userdata');
    window.dispatchEvent(new Event('storage'));
    discordStore.set({ expiry: '', token: '', username: '', id: '' });
    setUserData(null);
  };

  useEffect(() => {
    const existingUserData = getStoredDiscordUser();

    // Linked for as long as the identity is stored — the token's expiry is
    // deliberately ignored, since nothing calls Discord with it after login.
    setloggedIn(!!existingUserData);

    if (existingUserData) {
      setUserData(existingUserData);
      discordStore.set({
        expiry: localStorage.getItem('discord_expiry') ?? '',
        token: localStorage.getItem('discord_token') ?? '',
        username: existingUserData.global_name,
        id: existingUserData.id,
      });
    }
  }, []);

  if (!loggedIntoPoE && !logoutOnly) {
    return <></>;
  }
  if (loggedIn && userData) {
    return (
      <div className="flex items-center gap-3 rounded border-2 border-discord-500 bg-gray-950">
        <div className="flex h-12 items-center gap-2 bg-discord-500 p-2">
          <img src="/discord-logo.svg" className="h-7" />

          <img
            className="rounded-full"
            src={`https://cdn.discordapp.com/avatars/${userData?.id}/${userData?.avatar}.png`}
            height="40"
            width="40"
          />
        </div>
        <div className="hidden grow text-primary-500 md:block">
          {userData?.global_name}
        </div>
        <button
          onClick={logout}
          className="mr-2 grow bg-transparent text-end hover:bg-transparent hover:text-primary-300"
        >
          Logout
        </button>
      </div>
    );
  }

  if (logoutOnly) return <></>;
  return (
    <div className="group rounded border-2 border-discord-500  hover:border-discord-400">
      <a href={discordOauthUrl} className="flex items-center gap-2">
        <div className="flex h-12 items-center bg-discord-500 p-2 group-hover:bg-discord-400">
          <img src="/discord-logo.svg" className="h-7" />
        </div>

        <div className="mr-2 grow text-end text-primary-500">Login</div>
      </a>
    </div>
  );
};

export default DiscordAuth;
