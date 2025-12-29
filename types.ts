
export enum ResourceType {
  Stardust = 'STARDUST',
  DarkMatter = 'DARK_MATTER'
}

export type GameId = 'galaxy_miner' | 'mars_colony' | 'star_defense' | 'merge_ships' | 'gravity_idle' | 'deep_signal';

export interface GameMeta {
  id: GameId;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  color: string;
  status: 'LIVE' | 'DEV' | 'PLANNED';
  tags: string[];
  // SEO Content
  briefing: string;
  manual: string;
  changelog: string[];
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  tags: string[];
  readTime: string;
  image?: string;
}

export interface Upgrade {
  id: string;
  name: string;
  description: string;
  baseCost: number;
  baseProduction: number; // Stardust per second
  costMultiplier: number;
  count: number;
  icon: string;
  type: 'manual' | 'auto';
}

export interface Planet {
  id: number;
  name: string;
  description: string;
  threshold: number; // Stardust needed to unlock
  productionMultiplier: number; // Global multiplier
  colors: {
    primary: string;
    secondary: string;
    atmosphere: string;
  };
}

export interface PrestigeUpgrade {
  id: string;
  name: string;
  description: string;
  cost: number; // Dark Matter
  maxLevel: number; // -1 for infinite
  effectDescription: (level: number) => string;
}

export interface GameState {
  resources: {
    [key in ResourceType]: number;
  };
  totalMined: number;
  lifetimeEarnings: number;
  upgrades: { [id: string]: Upgrade };
  prestigeUpgrades: { [id: string]: number }; // id -> level
  planetIndex: number;
  lastSaveTime: number;
  level: number;
  heat: number; // 0 to 100
  overheated: boolean;
}

// --- MARS COLONY TYPES ---
export interface MarsBuilding {
    id: string;
    name: string;
    description: string;
    cost: number; // Minerals
    energyCost: number; // Consumption per tick
    production: { type: 'energy' | 'food' | 'oxygen' | 'housing' | 'minerals'; amount: number };
    count: number;
    icon: string;
}

export interface MarsResourceState {
    minerals: number;
    credits: number;
    population: number;
    energy: { current: number; max: number; production: number; consumption: number };
    food: { current: number; max: number; production: number };
    oxygen: { current: number; max: number; production: number };
}

// --- STAR DEFENSE TYPES ---
export interface DefenseUpgrade {
    id: string;
    name: string;
    description: string;
    cost: number;
    costMult: number;
    level: number;
    value: number; // Damage or HP amount
    type: 'click' | 'turret' | 'utility' | 'shield' | 'hp';
    icon: string;
}

export interface Enemy {
    id: number;
    x: number;
    y: number;
    spawnX: number; // Original X for movement patterns
    hp: number;
    maxHp: number;
    speed: number;
    type: 'scout' | 'fighter' | 'tank' | 'boss';
    scoreValue: number;
    lastShot?: number; // timestamp
    shootRate?: number; // ms
    isStunned?: boolean;
    bossCD?: number; // Cooldown for boss abilities (frames)
}

export interface Projectile {
    id: number;
    x: number;
    y: number;
    targetId: number | null; // Null if manual click shot (straight up)
    damage: number;
    color: string;
    source: 'player' | 'enemy';
    vx?: number;
    vy?: number;
}

export interface PowerUp {
    id: number;
    x: number;
    y: number;
    type: 'heal' | 'scrap' | 'double_damage';
    life: number;
}

export interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  opacity: number;
  isCrit?: boolean;
  isDamage?: boolean; // Small, fast fade for damage numbers
}

// --- MERGE SHIPS TYPES ---
export interface MergeShip {
  id: string;
  level: number;
  isCrate?: boolean; // True if it's a mystery crate
}

export interface MergeUpgradeState {
    orbitSlots: number; // Level
    shipLevel: number; // Level
    crateSpeed: number; // Level
}

// --- GRAVITY IDLE TYPES ---
export interface GravitySaveData {
    matter: number;
    upgrades: {
        gravity: number; // Pull strength
        launchers: number; // Number of launchers
        fireRate: number; // Shots per second
        power: number; // Damage
        pierce: number; // Penetration
    };
    highScore: number;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

// --- DEEP SIGNAL TYPES ---
export interface SignalMessage {
  id: string;
  timestamp: string;
  sender: string;
  content: string;
  isDecoded: boolean;
  encryptionLevel: number; // 0-100
  rewardData: number;
  type?: 'BIO' | 'TECH' | 'VOID' | 'MIL';
  analyzed?: boolean;
}

export interface DeepSignalSaveData {
  dataBytes: number; // Currency
  energy: number;
  messages: SignalMessage[];
  upgrades: {
    antenna: number; // Range/Frequency
    processor: number; // Decryption speed
    battery: number; // Max energy
    solar: number; // Energy regen
    ai: number; // Auto scan
  };
  factions: {
    BIO: number;
    TECH: number;
    VOID: number;
    MIL: number;
  };
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  message: string;
  type: 'info' | 'event' | 'alert' | 'success' | 'warning';
}