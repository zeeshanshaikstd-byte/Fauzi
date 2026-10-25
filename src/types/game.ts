export type GameState = 'POSTER' | 'PLAYING' | 'WAVE_INTERMISSION' | 'GAME_OVER' | 'PAUSED' | 'VICTORY_LEVEL';

export type OutfitId = 'standard' | 'black_coat' | 'desert_scarf' | 'golden_bandana';

export interface Outfit {
  id: OutfitId;
  name: string;
  tagline: string;
  cost: number;
  unlocked: boolean;
  colors: {
    jacket: string;
    jacketHighlight: string;
    jacketShadow: string;
    bandana: string;
    bandanaHighlight: string;
    bandolier: string;
    trim: string;
  };
  bonusDescription: string;
}

export interface Upgrades {
  fireRate: number;      // 0 to 5 (reduces shot cooldown)
  damage: number;        // 0 to 5 (increases bullet damage)
  ammoCap: number;       // 0 to 5 (increases clip size: 30 to 60)
  reloadSpeed: number;   // 0 to 5 (reduces reload time: 1.5s down to 0.7s)
  sandbagWall: number;   // 0 to 5 (max sandbag health: 0 to 300)
}

export type EnemyType = 'scout' | 'infantry' | 'heavy' | 'fighter' | 'airship' | 'bomb' | 'boss';

export interface Enemy {
  id: number;
  x: number;
  y: number;
  type: EnemyType;
  hp: number;
  maxHp: number;
  speed: number;
  baseSpeed: number;
  damage: number;
  width: number;
  height: number;
  walkFrame: number;
  attackCooldown: number;
  state: 'walking' | 'attacking' | 'dying';
  deathTimer: number;
  color: string;
  isHitFlash: number;
  name?: string;
  // Air combat mechanics
  altitude?: number;
  diveAngle?: number;
  bombDropCooldown?: number;
  vy?: number;
  vx?: number;
  phase?: number;
}

export interface Bullet {
  id: number;
  x: number;
  y: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  vx: number;
  vy: number;
  damage: number;
  speed: number;
  life: number;
  maxLife: number;
  tracerLength: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  type: 'spark' | 'smoke' | 'ember' | 'dust' | 'casing' | 'muzzle' | 'debris' | 'fire';
  rotation?: number;
  vRot?: number;
}

export interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
  size: number;
  isCrit?: boolean;
}

export interface GameStats {
  score: number;
  coins: number;
  wave: number;
  level: number;
  enemiesDefeated: number;
  shotsFired: number;
  shotsHit: number;
  highScore: number;
  highestWave: number;
}
