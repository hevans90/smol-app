import { useStore } from '@nanostores/react';
import { isAfter } from 'date-fns';
import { useEffect, useState } from 'react';
import { discordStore } from '../../../_state/discord.state';
import { poeStore } from '../../../_state/poe.state';

const DiscordAuth = ({
  discordOauthUrl,
  logoutOnly,
}: {
  discordOauthUrl: string;
  logoutOnly?: boolean;
}) => {
  const getUserDataFromLocalStorage = () => {
    const existingDiscordUserDataJson =
      localStorage.getItem('discord_userdata');
    let existingDiscordUserData: {
      id: string;
      avatar: string;
      global_name: string;
    } | null = null;

    if (existingDiscordUserDataJson) {
      existingDiscordUserData = JSON.parse(existingDiscordUserDataJson);
      return existingDiscordUserData;
    }
  };

  const { token: loggedIntoPoE } = useStore(poeStore);

  const [loggedIn, setloggedIn] = useState<boolean>(false);
  const [userData, setUserData] = useState<{
    id: string;
    avatar: string;
    global_name: string;
  } | null>(null);

  const logout = () => {
    localStorage.removeItem('discord_token');
    localStorage.removeItem('discord_expiry');
    localStorage.removeItem('discord_userdata');
    window.dispatchEvent(new Event('storage'));
    discordStore.set({ expiry: '', token: '', username: '', id: '' });
    setUserData(null);
  };

  useEffect(() => {
    const existingUserData = getUserDataFromLocalStorage();
    const existingToken = localStorage.getItem('discord_token');
    const existingExpiry = localStorage.getItem('discord_expiry');

    const loggedInCheck =
      !!existingUserData &&
      !!existingToken &&
      !!existingExpiry &&
      isAfter(new Date(existingExpiry), new Date());

    setloggedIn(loggedInCheck);

    if (loggedInCheck) {
      setUserData(existingUserData);
      discordStore.set({
        expiry: existingExpiry,
        token: existingToken,
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
