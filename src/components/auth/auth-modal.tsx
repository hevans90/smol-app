import { useState } from 'react';
import { Dialog, DialogContent, DialogHeading } from '../react/ui/Dialog';
import DiscordAuth from './discord-auth/DiscordAuth';
import PoEAuth from './poe-auth/PoEAuth';

export const AuthModal = ({ discordOauthUrl }: { discordOauthUrl: string }) => {
  const [hasuraAccessToken, setHasuraAccessToken] = useState<string | null>(
    localStorage.getItem('hasura_token') ?? null
  );

  return (
    <Dialog open={!hasuraAccessToken}>
      <DialogContent>
        <DialogHeading>Authorise your PoE & Discord accounts</DialogHeading>

        <div className="flex flex-col gap-4 min-w-[10rem]">
          <PoEAuth />
          <DiscordAuth discordOauthUrl={discordOauthUrl} />
        </div>
      </DialogContent>
    </Dialog>
  );
};
