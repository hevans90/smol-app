import { useState } from 'react';
import type {
  GGGCharacterResponse,
  GGGItem,
} from '../../../models/ggg-responses';
import { SocketTreeVisualizer } from './CharacterGemLinks';
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
  const [selectedItem, setSelectedItem] = useState<GGGItem | null>();

  const onItemHovered = (itemId: string) => {
    const queriedItem = items.find((item) => item.id === itemId);

    const itemWithSocketedItems =
      queriedItem?.socketedItems && queriedItem.socketedItems.length > 0;

    if (!itemWithSocketedItems) return;

    setSelectedItem(queriedItem);
  };

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-4 overflow-y-auto md:flex-row md:items-start md:overflow-visible">
      <CharacterSummary
        accountName={accountName}
        character={character}
        className="h-auto shrink-0 md:h-full md:w-40"
      />
      <CharacterInventory
        onItemHovered={onItemHovered}
        items={items}
        passiveTreeItems={passiveTreeItems}
        className="md:min-w-0 md:flex-1"
      />

      {selectedItem && (
        <SocketTreeVisualizer
          item={selectedItem}
          className="w-full md:w-auto md:max-w-xs md:shrink-0"
        />
      )}

      {characterId && (
        <CharacterStatSheet
          characterId={characterId}
          className="w-full shrink-0 md:ml-auto md:h-full md:w-56 md:overflow-y-auto md:pr-2"
        />
      )}
    </div>
  );
};
