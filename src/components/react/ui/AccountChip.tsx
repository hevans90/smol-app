import type { ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

// Branded account chips: a solid block with the service's logo (and the
// Discord avatar), then the name. Used in the header and on profiles.

type Tone = 'poe' | 'discord' | 'expired' | 'off';

// drawn as an inset shadow, not a border, so the logo block can run to the
// chip's edge and cover it with no gap at the rounded corners
const FRAME: Record<Tone, string> = {
  poe: 'shadow-[inset_0_0_0_2px_theme(colors.primary.800)] hover:shadow-[inset_0_0_0_2px_theme(colors.primary.500)]',
  discord:
    'shadow-[inset_0_0_0_2px_theme(colors.discord.500)] hover:shadow-[inset_0_0_0_2px_theme(colors.discord.400)]',
  expired:
    'shadow-[inset_0_0_0_2px_theme(colors.red.400)] hover:shadow-[inset_0_0_0_2px_theme(colors.red.300)]',
  off: 'shadow-[inset_0_0_0_2px_theme(colors.gray.800)]',
};

const BLOCK: Record<Tone, string> = {
  poe: '',
  discord: 'bg-discord-500 group-hover:bg-discord-400',
  expired: 'bg-red-500/20',
  off: 'bg-gray-800',
};

const LABEL: Record<Tone, string> = {
  poe: 'text-primary-500 group-hover:text-primary-300',
  discord: 'text-primary-500 group-hover:text-primary-300',
  expired: 'text-red-400 group-hover:text-red-300',
  off: 'text-gray-600',
};

export const accountChipClass = (tone: Tone, className?: string) =>
  twMerge(
    'group flex h-9 shrink-0 items-stretch overflow-hidden rounded-md bg-gray-950 p-0 text-sm no-underline transition-[box-shadow,color] hover:bg-gray-950',
    FRAME[tone],
    className,
  );

export const AccountChipBody = ({
  service,
  tone,
  avatarUrl,
  label,
  labelClassName,
}: {
  service: 'poe' | 'discord';
  tone: Tone;
  avatarUrl?: string | null;
  label?: ReactNode;
  // e.g. "hidden sm:flex" to drop the name on small screens
  labelClassName?: string;
}) => (
  <>
    <span
      className={twMerge(
        // fixed minimum width so stacked chips start their names at the same x
        'flex min-w-[2.25rem] items-center justify-center gap-1.5 px-1 transition-colors',
        avatarUrl && 'px-2',
        BLOCK[tone],
      )}
    >
      {service === 'poe' ? (
        <img
          src="/poe-logo-original.png"
          alt="Path of Exile"
          className={twMerge('h-7 w-7 object-contain', tone === 'off' && 'opacity-40')}
        />
      ) : (
        <img
          src="/discord-logo.svg"
          alt="Discord"
          className={twMerge('h-4 w-4', tone === 'off' && 'opacity-40')}
        />
      )}
      {avatarUrl && <img src={avatarUrl} alt="" className="h-6 w-6 rounded-full" />}
    </span>
    {label && (
      <span
        className={twMerge(
          'flex min-w-0 items-center px-2.5',
          LABEL[tone],
          labelClassName,
        )}
      >
        <span className="max-w-[10rem] truncate">{label}</span>
      </span>
    )}
  </>
);

export const discordAvatarUrl = (userId?: string | null, avatar?: string | null) =>
  userId && avatar ? `https://cdn.discordapp.com/avatars/${userId}/${avatar}.png?size=64` : null;
