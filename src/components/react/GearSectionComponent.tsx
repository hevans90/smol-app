import type React from 'react';
import ItemComponent from './ItemComponent';

export interface GearItem {
  imageUrl: string;
  name: string;
  stats: string[];
  desc: string;
  tradeString: string;
  type: string
}

export interface GearSectionProps {
  gear: GearItem; // Single gear item for this slot
}

export const GearSectionComponent: React.FC<GearSectionProps> = ({ gear }) => (
  <div className="gear-slot">
    <div className="gear-name">{gear.name}</div>
    <div className="gear-stats">
      {gear.stats ? gear.stats.map((stat, index) => (
        <div key={index}>{stat}</div>
      )) : null}
    </div>
    {/* Add other display elements as needed... */}
  </div>
);
