import type { GearItem } from '../components/react/GearSectionComponent'
  
  // Functions to get gear for each slot, these can be replaced with actual logic to retrieve or generate the items
  export const getHelmet = (): GearItem => {
    return {
      name: 'Helmet Name',
      stats: ['Stat 1', 'Stat 2'],
      type: 'Helmet',
      imageUrl: '/images/helmet.png',
      desc: 'loreipsum',
      tradeString: 'whatever',
      // Add other properties as needed...
    };
  };
  
  export const getBodyArmour = (): GearItem => {
    return {
      name: 'My Body Armour',
      type: 'Body Armour',
      stats: ['Stat 1', 'Stat 2'],
      imageUrl: '/images/body-armour.png',
      desc: 'loreipsum',
      tradeString: 'whatever'
      // Other properties...
    };
  };

  export const getBelt = (): GearItem => {
    return {
      name: 'My Belt',
      type: 'Belt',
      stats: ['Stat 1', 'Stat 2'],
      imageUrl: '/images/gloves.png',
      desc: 'loreipsum',
      tradeString: 'whatever'
      // Other properties...
    };
  };
  
  export const getGloves = (): GearItem => {
    return {
      name: 'My Gloves',
      type: 'Gloves',
      stats: ['Stat 1', 'Stat 2'],
      imageUrl: '/images/gloves.png',
      desc: 'loreipsum',
      tradeString: 'whatever'
      // Other properties...
    };
  };
  
  export const getBoots = (): GearItem => {
    return {
      name: 'My Boots',
      type: 'Boots',
      stats: ['Stat 1', 'Stat 2'],
      imageUrl: '/images/boots.png',
      desc: 'loreipsum',
      tradeString: 'whatever'
      // Other properties...
    };
  };

  export const getWeapon = (index: number): GearItem => {
    return {
      name: `My weapon ${index}`,
      type: 'Weapon',
      stats: ['Stat 1', 'Stat 2'],
      imageUrl: '/images/weapon.png',
      desc: 'loreipsum',
      tradeString: 'whatever'
      // Other properties...
    };
  };

  export const getRing = (index: number): GearItem => {
    return {
      name: `My ring ${index}`,
      type: 'Ring',
      stats: ['Stat 1', 'Stat 2'],
      imageUrl: '/images/weapon.png',
      desc: 'loreipsum',
      tradeString: 'whatever'
      // Other properties...
    };
  };

  export const getAmulet = (): GearItem => {
    return {
      name: `My amulet`,
      type: 'Amulet',
      stats: ['Stat 1', 'Stat 2'],
      imageUrl: '/images/weapon.png',
      desc: 'loreipsum',
      tradeString: 'whatever'
      // Other properties...
    };
  };
  
  // Include other utility functions or exports as needed
  