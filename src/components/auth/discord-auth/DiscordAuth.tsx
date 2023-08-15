import { useStore } from '@nanostores/react';
import { isAfter } from 'date-fns';
import { useEffect, useState } from 'react';
import { discordStore } from '../../../_state/discord.state';
import { poeStore } from '../../../_state/poe.state';

const DiscordAuth = ({ discordOauthUrl }: { discordOauthUrl: string }) => {
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

  if (!loggedIntoPoE) {
    return <>Log in via PoE to enable discord linking.</>;
  }
  if (loggedIn && userData) {
    return (
      <div className="flex items-center rounded border-discord-500 border-2 gap-3">
        <div className="h-12 p-2 bg-discord-500 flex items-center gap-2">
          <img src="/discord-logo.svg" className="h-7" />

          <img
            className="rounded-full"
            src={`https://cdn.discordapp.com/avatars/${userData?.id}/${userData?.avatar}.png`}
            height="40"
            width="40"
          />
        </div>
        <div className="text-primary-500 grow hidden md:block">
          {userData?.global_name}
        </div>
        <button
          onClick={logout}
          className="text-end mr-2 grow hover:text-primary-300 bg-gray-950 hover:bg-gray-950"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="group rounded border-discord-500 border-2  hover:border-discord-400">
      <a href={discordOauthUrl} className="flex gap-2 items-center">
        <div className="h-12 p-2 bg-discord-500 flex items-center group-hover:bg-discord-400">
          <img src="/discord-logo.svg" className="h-7" />
        </div>

        <div className="text-primary-500 mr-2 grow text-end">Login</div>
      </a>
    </div>
  );
};

export default DiscordAuth;
