import { useMemo } from 'react';
import { usePoECharacters } from '../../../hooks/usePoECharacters';
import { startPoEReauth } from '../../auth/poe-auth/PoEAuth';
import { getStoredDiscordUser } from '../../auth/discord-auth/DiscordAuth';
import { LeagueMembershipStatus } from '../graphql-provided/LeagueMembershipNotice';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { ascendancyCrest } from './classes';
import { Panel } from './Panel';

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex items-baseline justify-between gap-3 border-b border-gray-800/80 py-2 text-sm">
    <span className="text-primary-800">{label}</span>
    <span className="min-w-0 text-right text-primary-500">{children}</span>
  </div>
);

/** Every character on the account, every league: read from GGG on demand. */
const Career = () => {
  const { token, loading, characters, error, loadCharacters } = usePoECharacters(true);

  const career = useMemo(() => {
    if (!characters.length) return undefined;
    const byClass = new Map<string, number>();
    const leagues = new Set<string>();
    for (const character of characters) {
      byClass.set(character.class, (byClass.get(character.class) ?? 0) + 1);
      if (character.league) leagues.add(character.league);
    }
    return {
      count: characters.length,
      highest: [...characters].sort((a, b) => b.level - a.level)[0],
      leagues: leagues.size,
      classes: [...byClass].sort((a, b) => b[1] - a[1]).slice(0, 5),
    };
  }, [characters]);

  if (!token) return null;

  return (
    <div className="mt-5">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-primary-800">Every league</span>
        {!career && (
          <Button
            className="px-3 py-1.5 text-sm text-primary-500"
            disabled={loading}
            onClick={() => void loadCharacters()}
          >
            {loading ? <Spinner width={14} /> : 'Load from Path of Exile'}
          </Button>
        )}
      </div>
      {error && <div className="text-sm text-red-400">{error}</div>}
      {career && (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              [career.count, 'characters'],
              [career.leagues, 'leagues'],
              [career.highest.level, 'highest level'],
            ].map(([value, label]) => (
              <div key={label} className="rounded-md bg-gray-950/60 py-2">
                <div className="font-fontinSmallcaps text-2xl text-primary-400">{value}</div>
                <div className="text-xs text-primary-800">{label}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-xs text-primary-800">Most played</div>
          <ul className="m-0 mt-1 flex list-none flex-wrap gap-2 p-0">
            {career.classes.map(([className, count]) => {
              const crest = ascendancyCrest(className);
              return (
                <li
                  key={className}
                  className="flex items-center gap-1.5 rounded-full border border-gray-800 bg-gray-950/60 py-0.5 pl-1 pr-2.5 text-xs text-primary-500"
                >
                  {crest && <img src={crest} alt="" className="h-5 w-auto" />}
                  {className}
                  <span className="text-primary-800">{count}</span>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
};

export const AccountPanel = () => {
  const poeName = localStorage.getItem('poe_username');
  const poeExpiry = localStorage.getItem('poe_expiry');
  const poeValid = !!poeExpiry && new Date(poeExpiry) > new Date();
  const discord = getStoredDiscordUser();

  return (
    <Panel title="Your account">
      <Row label="Path of Exile">
        {poeValid ? (
          poeName
        ) : (
          <button
            type="button"
            onClick={() => void startPoEReauth()}
            className="bg-transparent p-0 text-red-400 underline hover:bg-transparent hover:text-red-300"
          >
            Session expired, reconnect
          </button>
        )}
      </Row>
      <Row label="Discord">{discord ? discord.global_name : 'Not linked'}</Row>
      <div className="py-2">
        <LeagueMembershipStatus />
      </div>
      <Career />
    </Panel>
  );
};
