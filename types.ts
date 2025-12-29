
export enum ResourceType {
  Stardust = 'STARDUST',
  DarkMatter = 'DARK_MATTER'
}

export type GameId = 'galaxy_miner' | 'mars_colony' | 'star_defense' | 'merge_ships' | 'gravity_idle' | 'deep_signal';

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string; // HTML string for rich text
  author: string;
  date: string;
  lastUpdated?: string; // For SEO dateModified
  readTime: string;
  tags: string[];
  relatedGameId?: GameId; // To show a "Play Now" CTA for specific games
  image?: string; // Optional hero image URL
}

export interface GameMeta {
  id: GameId;
  title: string;
  subtitle: string;
  description: string;
  metaDescription: string;
  keywords: string;
  status: 'LIVE' | 'BETA' | 'ALPHA';
  color: string;
  icon: string;
  briefing: string;
  manual: string;
  changelog: string[];
  tags: string[];
  image?: string; // Social Share Image
}

export interface Upgrade {
  id: string;
  name: string;
  type: 'manual' | 'auto';
  baseCost: number;
  baseProduction: number;
  costMultiplier: number;
  count: number;
  icon: string;
  description: string;
}

export interface Planet {
  name: string;
  threshold: number;
  productionMultiplier: number;
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
  cost: number;
  maxLevel: number;
  effectDescription: (level: number) => string;
}

export interface Achievement {
  id: string;
  gameId: GameId;
  title: string;
  description: string;
  xp: number;
  condition: (saves: any) => boolean;
}

export interface GameState {
    resources: { [key in ResourceType]: number };
    upgrades: { [id: string]: Upgrade };
    prestigeUpgrades: { [id: string]: number };
    level: number;
    planetIndex: number;
    lifetimeEarnings: number;
}

export interface LogEntry {
    id: string;
    timestamp: Date;
    message: string;
    type: 'info' | 'success' | 'alert';
}

export interface GlobalSettings {
    audioMuted: boolean;
    lowPerformance: boolean;
}

export interface FloatingText {
    id: number;
    x: number;
    y: number;
    text: string;
    opacity: number;
    isCrit?: boolean;
    isDamage?: boolean;
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

// Mars Colony Types
export interface MarsBuilding {
    id: string;
    name: string;
    description: string;
    cost: number;
    energyCost: number;
    production: { type: 'minerals' | 'energy' | 'food' | 'oxygen' | 'housing'; amount: number };
    count: number;
    icon: string;
}

export interface MarsResourceState {
    minerals: number;
    credits: number;
    population: number;
    energy: number;
    food: number;
    oxygen: number;
}

// Star Defense Types
export interface DefenseUpgrade {
    id: string;
    name: string;
    description: string;
    cost: number;
    costMult: number;
    level: number;
    value: number;
    type: 'click' | 'turret' | 'shield' | 'hp' | 'utility';
    icon: string;
}

export interface Enemy {
    id: number;
    x: number;
    y: number;
    spawnX: number;
    hp: number;
    maxHp: number;
    speed: number;
    type: 'scout' | 'fighter' | 'tank' | 'boss';
    scoreValue: number;
    shootRate: number;
    bossCD?: number;
    lastShot?: number;
    isStunned?: boolean;
}

export interface Projectile {
    id: number;
    x: number;
    y: number;
    targetId: number | null;
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

// Merge Ships Types
export interface MergeShip {
    id: string;
    level: number;
    isCrate?: boolean;
}

export interface MergeUpgradeState {
    orbitSlots: number;
    shipLevel: number;
    crateSpeed: number;
}

// Gravity Idle Types
export interface GravitySaveData {
    matter: number;
    upgrades: {
        gravity: number;
        launchers: number;
        fireRate: number;
        power: number;
        pierce: number;
    };
    lastSaveTime?: number;
}

// Deep Signal Types
export interface DeepSignalSaveData {
    dataBytes: number;
    energy: number;
    upgrades: {
        antenna: number;
        processor: number;
        battery: number;
        solar: number;
        ai: number;
    };
    factions: {
        BIO: number;
        TECH: number;
        MIL: number;
        VOID: number;
    };
    messages: SignalMessage[];
}

export interface SignalMessage {
    id: string;
    timestamp: string;
    sender: string;
    content: string;
    isDecoded: boolean;
    encryptionLevel: number;
    rewardData: number;
    type?: 'BIO' | 'TECH' | 'MIL' | 'VOID' | 'UNKNOWN';
    analyzed?: boolean;
}
