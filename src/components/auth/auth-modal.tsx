import { isAfter } from 'date-fns';
import { useEffect, useState } from 'react';
import { SetMyGuild } from '../react/SetMyGuild';
import { Dialog, DialogContent, DialogHeading } from '../react/ui/Dialog';
import DiscordAuth from './discord-auth/DiscordAuth';
import PoEAuth from './poe-auth/PoEAuth';

export const AuthModal = ({ discordOauthUrl }: { discordOauthUrl: string }) => {
  const [loginState, setLoginState] = useState<{
    hasuraAccessToken: string | null;
    discord: { token: string | null; expiry: string | null };
  }>();

  const loggedIn =
    !!loginState?.hasuraAccessToken &&
    !!loginState?.discord.token &&
    !!loginState?.discord.expiry &&
    isAfter(new Date(loginState?.discord.expiry), new Date());

  useEffect(() => {
    const handleStorage = () => {
      const hasuraAccessToken = localStorage.getItem('hasura_token');
      const discordExpiry = localStorage.getItem('discord_expiry');
      const discordToken = localStorage.getItem('discord_token');

      setLoginState({
        hasuraAccessToken,
        discord: {
          expiry: discordExpiry,
          token: discordToken,
        },
      });
    };

    handleStorage();

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return (
    <Dialog open={!loggedIn}>
      <DialogContent>
        <DialogHeading>Authorise your PoE & Discord accounts</DialogHeading>

        <div className="flex flex-col gap-4 min-w-[10rem]">
          <PoEAuth />
          <DiscordAuth discordOauthUrl={discordOauthUrl} />
          <SetMyGuild automatic={true} />
        </div>
      </DialogContent>
    </Dialog>
  );
};
