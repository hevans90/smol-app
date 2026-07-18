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
    <div className="flex h-full grow gap-4">
      <CharacterSummary accountName={accountName} character={character} />
      <CharacterInventory
        onItemHovered={onItemHovered}
        items={items}
        passiveTreeItems={passiveTreeItems}
      />

      {selectedItem && <SocketTreeVisualizer item={selectedItem} />}

      {characterId && (
        <CharacterStatSheet
          characterId={characterId}
          className="ml-auto h-full shrink-0 overflow-y-auto pr-2"
        />
      )}
    </div>
  );
};
