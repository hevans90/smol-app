import type { CSSProperties } from 'react';

export const itemHeader = (
  rarity: 'normal' | 'magic' | 'rare' | 'unique' | 'gem' | 'currency',
  height: 'single' | 'double' = 'single',
): CSSProperties => ({
  background: `
      url('/item-preview/${rarity}/header-${height === 'double' ? 'double-' : ''}${rarity}-left.png') 0 0 no-repeat,
      url('/item-preview/${rarity}/header-${height === 'double' ? 'double-' : ''}${rarity}-right.png') 100% 0 no-repeat,
      url('/item-preview/${rarity}/header-${height === 'double' ? 'double-' : ''}${rarity}-middle.png') top repeat-x
    `,
});
