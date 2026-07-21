import { useState } from 'react';
import type {
  GGGCharacterResponse,
  GGGItem,
} from '../../../models/ggg-responses';
import { GemLinksPanel } from './CharacterGemLinks';
import { CharacterInventory } from './CharacterInventory';
import { CharacterStatSheet } from './CharacterStatSheet';
import { CharacterSummary } from './CharacterSummary';

export const CharacterSheet = ({
  accountName,
  character,
  passiveTreeItems,
  items,
  characterId,
}: {
  accountName: string;
  character: GGGCharacterResponse['character'];
  passiveTreeItems: GGGItem[];
  items: GGGItem[];
  // Ladder character id; enables the PoB stat sheet when provided
  characterId?: string;
}) => {
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-4 overflow-y-auto md:flex-row md:items-start md:overflow-visible">
      <CharacterSummary
        accountName={accountName}
        character={character}
        className="h-auto shrink-0 md:h-full md:w-72"
      />
      <CharacterInventory
        onItemHovered={setHoveredItemId}
        items={items}
        passiveTreeItems={passiveTreeItems}
        className="md:min-w-0 md:flex-1"
      />

      <GemLinksPanel
        items={items}
        highlightedItemId={hoveredItemId}
        className="w-full shrink-0 md:h-full md:w-72 md:overflow-y-auto md:pr-2"
      />

      {characterId && (
        <CharacterStatSheet
          characterId={characterId}
          className="w-full shrink-0 md:ml-auto md:h-full md:w-56 md:overflow-y-auto md:pr-2"
        />
      )}
    </div>
  );
};
