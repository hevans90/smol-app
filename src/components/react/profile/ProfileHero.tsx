import { IconBrandTwitch, IconSkull } from '@tabler/icons-react';
import { twMerge } from 'tailwind-merge';
import { MemberAvatar } from '../farm/MemberAvatar';
import { ascendancyCrest, classArt } from './classes';
import { isRanked, personName, type Badge, type PersonRef, type ProfileCharacter } from './model';

const BADGE_TONES: Record<Badge['tone'], string> = {
  gold: 'border-primary-600/60 text-primary-400',
  red: 'border-red-500/50 text-red-300',
  blue: 'border-discord-400/50 text-discord-300',
  green: 'border-emerald-500/50 text-emerald-300',
};

const poeProfileUrl = (account: string) =>
  `https://www.pathofexile.com/account/view-profile/${account.replace('#', '-')}`;

export const ProfileHero = ({
  user,
  accountName,
  featured,
  league,
  badges,
  isAdmin,
}: {
  user?: PersonRef;
  accountName: string;
  featured?: ProfileCharacter;
  league?: string;
  badges: Badge[];
  isAdmin?: boolean;
}) => {
  const art = (featured && classArt(featured.class)) ?? '/ascendencies/ascendancy.jpg';
  const crest = featured && ascendancyCrest(featured.class);

  return (
    <section className="relative overflow-hidden rounded-xl border border-primary-900/60 bg-gray-950">
      <img
        src={art}
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-[70%_20%] opacity-50"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-950/85 to-gray-950/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-gray-950/90 via-transparent to-transparent" />

      <div className="relative flex flex-col gap-6 p-5 md:flex-row md:items-end md:p-8">
        {/* the character */}
        <div className="flex min-w-0 items-center gap-4">
          {crest && (
            <img src={crest} alt="" className="hidden h-20 w-auto drop-shadow-lg sm:block" />
          )}
          <div className="min-w-0">
            {featured ? (
              <>
                <div className="flex items-center gap-2">
                  <h1 className="m-0 truncate font-fontinSmallcaps text-3xl text-primary-400 md:text-4xl">
                    {featured.name}
                  </h1>
                  {featured.dead && (
                    <span
                      title="Dead"
                      className="flex items-center gap-1 rounded border border-red-500/60 px-1.5 text-xs text-red-300"
                    >
                      <IconSkull size={12} /> Dead
                    </span>
                  )}
                  {featured.retired && (
                    <span className="rounded border border-gray-600 px-1.5 text-xs text-gray-400">
                      Retired
                    </span>
                  )}
                </div>
                <div className="mt-1 text-lg text-primary-500">
                  Level {featured.level} {featured.class}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-primary-800">
                  {isRanked(featured) && (
                    <span>
                      <span className="text-primary-400">#{featured.rank}</span> on the{' '}
                      {league ?? 'league'} ladder
                    </span>
                  )}
                  {featured.stats?.main_skill && (
                    <span className="text-primary-600">{featured.stats.main_skill}</span>
                  )}
                  {featured.twitch && (
                    <a
                      href={`https://twitch.tv/${featured.twitch}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[#bf94ff] no-underline hover:text-[#d6bcff]"
                    >
                      <IconBrandTwitch size={14} /> {featured.twitch}
                    </a>
                  )}
                </div>
              </>
            ) : (
              <>
                <h1 className="m-0 font-fontinSmallcaps text-3xl text-primary-400 md:text-4xl">
                  {user ? personName(user) : accountName}
                </h1>
                <div className="mt-1 text-primary-800">
                  No character on the {league ?? 'league'} ladder
                </div>
              </>
            )}
          </div>
        </div>

        {/* the person */}
        <div className="flex flex-col gap-3 md:ml-auto md:items-end">
          <div className="flex items-center gap-3 md:flex-row-reverse">
            {user && <MemberAvatar user={user} className="h-12 w-12 ring-2 ring-primary-900" />}
            <div className="min-w-0 md:text-right">
              <div className="flex items-center gap-2 md:justify-end">
                <span className="truncate text-lg text-primary-400">
                  {user?.discord_name ?? accountName}
                </span>
                {isAdmin && (
                  <span className="rounded bg-primary-800 px-1.5 text-xs text-gray-950">Admin</span>
                )}
              </div>
              <a
                href={poeProfileUrl(accountName)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary-800 no-underline hover:text-primary-300"
              >
                {accountName}
              </a>
            </div>
          </div>
          {badges.length > 0 && (
            <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0 md:justify-end">
              {badges.map((badge) => (
                <li
                  key={badge.key}
                  title={badge.detail}
                  className={twMerge(
                    'rounded-full border bg-gray-950/70 px-2.5 py-0.5 text-xs',
                    BADGE_TONES[badge.tone],
                  )}
                >
                  {badge.label}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
};
