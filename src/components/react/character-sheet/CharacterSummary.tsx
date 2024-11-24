import { twMerge } from 'tailwind-merge';
import { itemHeaderBg } from '../../../_utils/item-preview-utils';
import type { GGGCharacterResponse } from '../../../models/ggg-responses';

export const CharacterSummary = ({
  accountName,
  character,
  className,
}: {
  accountName: string;
  character: GGGCharacterResponse['character'];
  className?: string;
}) => {
  return (
    <div
      className={twMerge('flex h-full flex-col items-center gap-1', className)}
    >
      <div
        className="font-fontinSmallcaps h-10 px-12 text-lg text-primary-500 md:text-xl"
        style={itemHeaderBg('normal')}
      >
        {character.name}
      </div>
      <img
        className="w-24"
        src={`/ascendencies/${character.class.toLowerCase()}.png`}
      />
      <div>
        Level {character.level} {character.class}
      </div>

      <a
        href={`https://www.pathofexile.com/account/view-profile/${accountName.replace('#', '-')}/characters?characterName=${character.name}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        PoE Website link
      </a>
    </div>
  );
};
