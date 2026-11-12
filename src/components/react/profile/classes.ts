// Ascendancy → the base class it belongs to, for the class artwork. The
// ladder reports the ascendancy once a character has one, the base class
// before that.
const BASE_CLASS: Record<string, string> = {
  duelist: 'duelist',
  slayer: 'duelist',
  gladiator: 'duelist',
  champion: 'duelist',
  marauder: 'marauder',
  juggernaut: 'marauder',
  berserker: 'marauder',
  chieftain: 'marauder',
  ranger: 'ranger',
  deadeye: 'ranger',
  pathfinder: 'ranger',
  warden: 'ranger',
  raider: 'ranger',
  scion: 'scion',
  ascendant: 'scion',
  reliquarian: 'scion',
  shadow: 'shadow',
  assassin: 'shadow',
  saboteur: 'shadow',
  trickster: 'shadow',
  templar: 'templar',
  inquisitor: 'templar',
  hierophant: 'templar',
  guardian: 'templar',
  witch: 'witch',
  necromancer: 'witch',
  elementalist: 'witch',
  occultist: 'witch',
};

// ascendancies with a crest in public/ascendencies
const CRESTS = new Set([
  'ascendant',
  'assassin',
  'berserker',
  'champion',
  'chieftain',
  'deadeye',
  'elementalist',
  'gladiator',
  'guardian',
  'hierophant',
  'inquisitor',
  'juggernaut',
  'necromancer',
  'occultist',
  'pathfinder',
  'saboteur',
  'slayer',
  'trickster',
  'warden',
]);

const key = (className: string) => className.trim().toLowerCase();

export const baseClassOf = (className: string) => BASE_CLASS[key(className)];

/** The base class's splash art, for banners. */
export const classArt = (className: string) => {
  const base = baseClassOf(className);
  return base ? `/ascendencies/asc-${base}.png` : undefined;
};

/** The ascendancy crest, when there is one. */
export const ascendancyCrest = (className: string) =>
  CRESTS.has(key(className)) ? `/ascendencies/${key(className)}.png` : undefined;
