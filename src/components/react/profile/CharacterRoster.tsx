import { IconSkull } from '@tabler/icons-react';
import { twMerge } from 'tailwind-merge';
import { ascendancyCrest } from './classes';
import { compact, isRanked, type ProfileCharacter } from './model';
import { Panel } from './Panel';

/** The member's characters in the league; picking one features it. */
export const CharacterRoster = ({
  characters,
  featuredId,
  onFeature,
}: {
  characters: ProfileCharacter[];
  featuredId?: string;
  onFeature: (id: string) => void;
}) => (
  <Panel title="Characters" aside={`${characters.length} in the league`}>
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {characters.map((character) => {
        const crest = ascendancyCrest(character.class);
        const featured = character.id === featuredId;
        return (
          <button
            key={character.id}
            type="button"
            aria-pressed={featured}
            onClick={() => onFeature(character.id)}
            className={twMerge(
              'flex items-center gap-3 rounded-md border p-2 text-left transition-colors',
              featured
                ? 'border-primary-600 bg-gray-800'
                : 'border-gray-800 bg-gray-950/50 hover:border-primary-900 hover:bg-gray-900',
              character.dead && 'opacity-60',
            )}
          >
            <span className="flex h-10 w-12 shrink-0 items-center justify-center">
              {crest ? (
                <img src={crest} alt="" className="max-h-10 w-auto" />
              ) : (
                <span className="text-xs text-primary-800">{character.class.slice(0, 3)}</span>
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5">
                <span className="truncate text-primary-400">{character.name}</span>
                {character.dead && <IconSkull size={12} className="shrink-0 text-red-400" />}
              </span>
              <span className="block truncate text-xs text-primary-800">
                {character.level} {character.class}
                {isRanked(character) && ` · #${character.rank}`}
              </span>
            </span>
            {character.stats && character.stats.combined_dps > 0 && (
              <span className="shrink-0 text-right text-xs">
                <span className="block text-primary-500">{compact(character.stats.combined_dps)}</span>
                <span className="block text-primary-800">DPS</span>
              </span>
            )}
          </button>
        );
      })}
    </div>
  </Panel>
);
