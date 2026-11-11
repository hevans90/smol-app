import { twMerge } from 'tailwind-merge';
import type { FarmUser } from './types';

export const memberName = (user: FarmUser) => user.discord_name ?? user.poe_name ?? '';

export const MemberAvatar = ({
  user,
  className,
}: {
  user: FarmUser;
  className?: string;
}) =>
  user.discord_avatar ? (
    <img
      className={twMerge('h-8 w-8 rounded-full', className)}
      src={`https://cdn.discordapp.com/avatars/${user.discord_user_id}/${user.discord_avatar}.png`}
      alt=""
    />
  ) : (
    <span
      className={twMerge(
        'flex h-8 w-8 items-center justify-center rounded-full bg-discord-500 text-xs text-white',
        className,
      )}
      aria-hidden
    >
      {memberName(user).slice(0, 1).toUpperCase()}
    </span>
  );
