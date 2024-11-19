import { useState } from 'react';
import type {
  GGGCharacterResponse,
  GGGItem,
} from '../../../models/ggg-responses';
import { SocketTreeVisualizer } from './CharacterGemLinks';
import { CharacterInventory } from './CharacterInventory';
import { CharacterSummary } from './CharacterSummary';

export const CharacterSheet = ({
  accountName,
  character,
  items,
}: {
  accountName: string;
  character: GGGCharacterResponse['character'];
  items: GGGItem[];
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
      <CharacterInventory onItemHovered={onItemHovered} items={items} />

      {selectedItem && <SocketTreeVisualizer item={selectedItem} />}
    </div>
  );
};
