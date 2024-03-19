import { isAfter } from 'date-fns';
import { Dialog, DialogContent, DialogHeading } from '../react/ui/Dialog';
import DiscordAuth from './discord-auth/DiscordAuth';
import PoEAuth from './poe-auth/PoEAuth';

export const AuthModal = ({ discordOauthUrl }: { discordOauthUrl: string }) => {
  const hasuraAccessToken = localStorage.getItem('hasura_token');
  const discordExpiry = localStorage.getItem('discord_expiry');

  const loggedIntoDiscord =
    !!localStorage.getItem('discord_token') &&
    !!discordExpiry &&
    isAfter(new Date(discordExpiry), new Date());

  return (
    <Dialog open={!hasuraAccessToken || !loggedIntoDiscord}>
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
