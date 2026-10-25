import { Outfit, OutfitId, Upgrades } from '../types/game';

export const OUTFITS: Record<OutfitId, Outfit> = {
  standard: {
    id: 'standard',
    name: 'Frontline Olive',
    tagline: 'Standard issue 1940s field jacket and crimson cloth.',
    cost: 0,
    unlocked: true,
    colors: {
      jacket: '#4A5320',          // Olive drab
      jacketHighlight: '#626F2C',
      jacketShadow: '#2F3613',
      bandana: '#C92A2A',         // Red bandana
      bandanaHighlight: '#E03131',
      bandolier: '#5C381E',       // Brown leather
      trim: '#2B1810',
    },
    bonusDescription: 'Standard issue resilience',
  },
  black_coat: {
    id: 'black_coat',
    name: 'Midnight Vanguard',
    tagline: 'Heavy black stormcoat tailored for night raids and foul weather.',
    cost: 250,
    unlocked: false,
    colors: {
      jacket: '#1F2428',          // Black charcoal
      jacketHighlight: '#384047',
      jacketShadow: '#111416',
      bandana: '#991B1B',         // Deep crimson
      bandanaHighlight: '#DC2626',
      bandolier: '#1E1E1E',
      trim: '#E2E8F0',
    },
    bonusDescription: '+10% critical hit spark probability',
  },
  desert_scarf: {
    id: 'desert_scarf',
    name: 'Desert Commando',
    tagline: 'Sun-bleached khaki fatigues wrapped with a protective desert shemagh.',
    cost: 500,
    unlocked: false,
    colors: {
      jacket: '#B59458',          // Desert khaki
      jacketHighlight: '#CDB179',
      jacketShadow: '#8C6F3B',
      bandana: '#78350F',         // Earth brown
      bandanaHighlight: '#92400E',
      bandolier: '#451A03',
      trim: '#FDE68A',
    },
    bonusDescription: '+10% faster trench movement recoil recovery',
  },
  golden_bandana: {
    id: 'golden_bandana',
    name: 'Veteran of the Somme',
    tagline: 'Ornate veteran officer tunic adorned with a shimmering golden silk bandana.',
    cost: 1000,
    unlocked: false,
    colors: {
      jacket: '#1E3A2F',          // Deep officer spruce green
      jacketHighlight: '#2D5847',
      jacketShadow: '#12231C',
      bandana: '#D97706',         // Gold
      bandanaHighlight: '#F59E0B',
      bandolier: '#78350F',
      trim: '#FBBF24',
    },
    bonusDescription: '+20% bonus coins from all enemy takedowns',
  },
};

export const UPGRADE_CONFIG = {
  fireRate: {
    name: 'Rate of Fire',
    desc: 'Increases machine gun cycle speed for denser bullet streams.',
    baseCost: 60,
    costMultiplier: 1.7,
    maxLevel: 5,
    getValue: (lvl: number) => {
      // Milliseconds delay between shots
      const delays = [200, 175, 150, 130, 110, 95];
      return delays[lvl] ?? 95;
    },
    getLabel: (lvl: number) => `${Math.round(1000 / [200, 175, 150, 130, 110, 95][lvl])} rpm`,
  },
  damage: {
    name: 'Bullet Caliber',
    desc: 'Hardened armor-piercing cartridges delivering higher impact.',
    baseCost: 75,
    costMultiplier: 1.75,
    maxLevel: 5,
    getValue: (lvl: number) => {
      // Base damage per hit
      const damages = [25, 32, 40, 50, 62, 75];
      return damages[lvl] ?? 75;
    },
    getLabel: (lvl: number) => `${[25, 32, 40, 50, 62, 75][lvl]} DMG`,
  },
  ammoCap: {
    name: 'Drum Magazine',
    desc: 'Expands the mounted drum capacity before needing a reload.',
    baseCost: 50,
    costMultiplier: 1.6,
    maxLevel: 5,
    getValue: (lvl: number) => {
      // Ammo capacity
      const caps = [30, 36, 42, 50, 60, 72];
      return caps[lvl] ?? 72;
    },
    getLabel: (lvl: number) => `${[30, 36, 42, 50, 60, 72][lvl]} rds`,
  },
  reloadSpeed: {
    name: 'Quick-Rack Breech',
    desc: 'Polished feed chamber and magazine latch for rapid reloads.',
    baseCost: 60,
    costMultiplier: 1.65,
    maxLevel: 5,
    getValue: (lvl: number) => {
      // Reload duration in seconds
      const times = [1.5, 1.3, 1.15, 1.0, 0.85, 0.7];
      return times[lvl] ?? 0.7;
    },
    getLabel: (lvl: number) => `${[1.5, 1.3, 1.15, 1.0, 0.85, 0.7][lvl].toFixed(2)}s`,
  },
  sandbagWall: {
    name: 'Sandbag Bastion',
    desc: 'Reinforces the trench berm with heavy barricades to block enemy advance.',
    baseCost: 80,
    costMultiplier: 1.8,
    maxLevel: 5,
    getValue: (lvl: number) => {
      // Wall health: 0 means no wall deployed
      const hp = [0, 80, 140, 210, 290, 400];
      return hp[lvl] ?? 400;
    },
    getLabel: (lvl: number) => lvl === 0 ? 'None' : `${[0, 80, 140, 210, 290, 400][lvl]} HP`,
  },
};

export function getUpgradeCost(key: keyof Upgrades, currentLevel: number): number {
  if (currentLevel >= UPGRADE_CONFIG[key].maxLevel) return 0;
  const cfg = UPGRADE_CONFIG[key];
  return Math.round(cfg.baseCost * Math.pow(cfg.costMultiplier, currentLevel));
}

export const BOSS_NAMES = [
  'Battalion Commander Kruger',
  'Goliath Stormtrooper Ironheart',
  'Field Marshal Vance',
  'Warden of the Redoubt',
  'The Iron Titan',
];
