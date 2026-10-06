
import { Upgrade, Planet, PrestigeUpgrade, GameMeta } from './types';

export const GAMES_CATALOG: GameMeta[] = [
  {
    id: 'galaxy_miner',
    title: 'Galaxy Miner',
    subtitle: 'Classic Idle Mining',
    description: 'The flagship space clicker. Mine asteroids, upgrade automated drone fleets, and travel to the galactic core.',
    icon: '⛏️',
    color: 'from-blue-500 to-cyan-400',
    status: 'LIVE',
    tags: ['Incremental', 'Upgrades', 'Prestige'],
    briefing: "Commander, your directive is simple: Harvest entropy. We have deployed you to Sector Zero with a standard-issue Mining Beam. Extract Stardust from local asteroids to fund the construction of automated Drone Fleets. The ultimate goal is to reach the Galactic Core, where resource density is theoretically infinite.",
    manual: "1. CLICK the central asteroid to mine Stardust.\n2. OPEN the Fabricator to purchase automated drills and drones.\n3. WARP to new sectors when you reach resource thresholds.\n4. WATCH for Golden Comets and Crisis Events.",
    changelog: ["v2.1: Added Dark Matter tech tree.", "v2.0: Added local dynamic anomaly events.", "v1.5: Fixed warp drive visuals."]
  },
  {
    id: 'mars_colony',
    title: 'Mars Colony Idle',
    subtitle: 'Base Building Strategy',
    description: 'Build a settlement on Mars. Balance Oxygen, Food, Energy, Minerals, and housing to grow the colony population.',
    icon: '🌱',
    color: 'from-red-600 to-orange-500',
    status: 'LIVE',
    tags: ['Management', 'Strategy', 'Simulation'],
    briefing: "Welcome to Ares Prime. Your mission is to establish a self-sustaining colony by balancing Oxygen, Food, Energy, Minerals, housing, and population. Energy shortages reduce production efficiency, while depleted life-support reserves can reverse population growth.",
    manual: "1. CLICK 'EXCAVATE' to mine Minerals for construction.\n2. BUILD Solar Panels first to generate Energy.\n3. CONSTRUCT Hydroponics and Oxygenators to support life.\n4. POPULATION grows automatically when resources are surplus.\n5. COLONISTS generate Credits as a colony-economy indicator; current construction still uses Minerals.",
    changelog: ["v1.0: Full colony simulation release.", "v0.9: Multi-resource production and population balancing."]
  },
  {
    id: 'star_defense',
    title: 'Star Defense',
    subtitle: 'Tower Defense Clicker',
    description: 'Defend your mothership from alien waves. Click to destroy enemies and upgrade auto-turrets.',
    icon: '🛡️',
    color: 'from-purple-600 to-indigo-500',
    status: 'LIVE',
    tags: ['Combat', 'Defense', 'Action'],
    briefing: "Alert! Long-range scanners detect a Xeno fleet on intercept course. You are the last line of defense for the Mothership. Man the point-defense cannons and hold the line until the jump drive charges.",
    manual: "1. CLICK enemy ships to deal direct damage.\n2. UPGRADE auto-turrets to handle swarms.\n3. PREPARE for boss encounters during every fifth-wave cycle.\n4. USE EMP, Rapid Fire, and Nuke abilities when pressure spikes.",
    changelog: ["v1.0: Systems Online. Weapons free."]
  },
  {
    id: 'merge_ships',
    title: 'Merge Spaceships',
    subtitle: 'Fleet Evolution',
    description: 'Merge matching ships, deploy them to orbit for automatic asteroid income, and recover capped orbit earnings after time away.',
    icon: '🚀',
    color: 'from-green-500 to-emerald-400',
    status: 'LIVE',
    tags: ['Merge', 'Casual', 'Collection'],
    briefing: "Our engineers have developed a new modular hull technology. By combining two identical chassis, we can fuse them into a superior vessel. Build the ultimate armada.",
    manual: "1. DRAG matching ships together to merge them into the next level.\n2. PLACE high-level ships in Orbit to attack asteroids and earn Credits.\n3. UPGRADE Orbit Expansion, Fabrication, and Logistics to grow the fleet faster.\n4. RETURN after time away to recover up to 24 hours of estimated Orbit income.",
    changelog: ["v1.1: Added capped offline and hidden-tab Orbit earnings plus keyboard fleet controls.", "v1.0: Hangar bays open. Merge logic active."]
  },
  {
    id: 'gravity_idle',
    title: 'Gravity Idle',
    subtitle: 'Physics Simulation',
    description: 'Launch projectiles through a gravity well, automate orbital cannons, and recover capped estimated Matter output after time away.',
    icon: '☄️',
    color: 'from-yellow-500 to-amber-400',
    status: 'LIVE',
    tags: ['Physics', 'Zen', 'Simulation'],
    briefing: "Observe the dance of the spheres. In this sector, we use kinetic bombardment to break apart resource clusters. Launch probes and let gravity do the work.",
    manual: "1. BUY Launchers to automate projectile firing.\n2. UPGRADE Gravity Well density to curve trajectories.\n3. UNLOCK Piercing physics to shatter multiple layers.\n4. RETURN after time away to recover up to 24 hours of estimated launcher output.",
    changelog: ["v1.1: Added capped offline and hidden-tab Matter recovery plus a keyboard-accessible Gravity Pulse.", "v1.0: Physics engine calibrated. Singularity stable."]
  },
  {
    id: 'deep_signal',
    title: 'Deep Space Signal',
    subtitle: 'Text Adventure',
    description: 'A dark, text-based mystery. Send signals, decode responses, and uncover the secrets of the void.',
    icon: '📟',
    color: 'from-gray-700 to-gray-900',
    status: 'LIVE',
    tags: ['Text-Based', 'Mystery', 'Story'],
    briefing: "You are sitting in front of a terminal. The screen is black. A single green cursor blinks. There is a button labeled 'SEND SIGNAL'. Do you dare press it?",
    manual: "1. SCAN frequencies to receive encrypted transmissions.\n2. MANAGE Energy while upgrading scan and decryption systems.\n3. DECODE and analyze messages to build BIO, TECH, MIL, and VOID bonuses.",
    changelog: ["v1.0: Signal receiver active. Connection established."]
  }
];

export const INITIAL_UPGRADES: Upgrade[] = [
  {
    id: 'click_booster',
    name: 'Laser Drill',
    description: 'Concentrated photon beam for manual extraction.',
    baseCost: 15,
    baseProduction: 1, 
    costMultiplier: 1.5,
    count: 0,
    icon: '⛏️',
    type: 'manual'
  },
  {
    id: 'drone',
    name: 'Mining Drone',
    description: 'Autonomous unit that sifts through surface dust.',
    baseCost: 50,
    baseProduction: 2,
    costMultiplier: 1.2,
    count: 0,
    icon: '🤖',
    type: 'auto'
  },
  {
    id: 'rover',
    name: 'Space Rover',
    description: 'Heavy-duty vehicle for deep crater mining.',
    baseCost: 350,
    baseProduction: 15,
    costMultiplier: 1.25,
    count: 0,
    icon: '🚙',
    type: 'auto'
  },
  {
    id: 'base',
    name: 'Lunar Base',
    description: 'A permanent outpost coordinating extraction.',
    baseCost: 2000,
    baseProduction: 100,
    costMultiplier: 1.3,
    count: 0,
    icon: '🌑',
    type: 'auto'
  },
  {
    id: 'station',
    name: 'Orbital Station',
    description: 'Massive processing hub in geosynchronous orbit.',
    baseCost: 25000,
    baseProduction: 500,
    costMultiplier: 1.4,
    count: 0,
    icon: '🛰️',
    type: 'auto'
  },
  {
    id: 'dyson',
    name: 'Dyson Swarm',
    description: 'Solar collectors harvesting direct stellar output.',
    baseCost: 500000,
    baseProduction: 5000,
    costMultiplier: 1.5,
    count: 0,
    icon: '☀️',
    type: 'auto'
  }
];

export const PLANETS: Planet[] = [
  {
    id: 0,
    name: "Proxima Centauri B",
    description: "A nearby exoplanet used here as the first fictional mining sector.",
    threshold: 0,
    productionMultiplier: 1,
    colors: { primary: '#4f46e5', secondary: '#0f172a', atmosphere: 'rgba(79, 70, 229, 0.4)' }
  },
  {
    id: 1,
    name: "Kepler-186f",
    description: "A real exoplanet name used here for a fictional high-yield mining sector.",
    threshold: 1_000_000, // 1M
    productionMultiplier: 10,
    colors: { primary: '#b91c1c', secondary: '#450a0a', atmosphere: 'rgba(220, 38, 38, 0.5)' }
  },
  {
    id: 2,
    name: "Trappist-1e",
    description: "A real exoplanet name used here for a fictional deep-space mining sector.",
    threshold: 1_000_000_000, // 1B
    productionMultiplier: 50,
    colors: { primary: '#06b6d4', secondary: '#083344', atmosphere: 'rgba(6, 182, 212, 0.5)' }
  },
  {
    id: 3,
    name: "Galactic Core",
    description: "A fictional endgame mining sector inspired by the Milky Way's central region.",
    threshold: 1_000_000_000_000, // 1T
    productionMultiplier: 200,
    colors: { primary: '#fbbf24', secondary: '#000000', atmosphere: 'rgba(251, 191, 36, 0.4)' }
  }
];

export const PRESTIGE_UPGRADES: PrestigeUpgrade[] = [
  {
    id: 'crit_chance',
    name: 'Quantum Optics',
    description: 'Permanently increases Critical Hit chance.',
    cost: 5,
    maxLevel: 10,
    effectDescription: (lvl) => `+${lvl * 5}% Crit Chance`
  },
  {
    id: 'crit_damage',
    name: 'Flux Capacitors',
    description: 'Permanently increases Critical Hit multiplier.',
    cost: 10,
    maxLevel: 20,
    effectDescription: (lvl) => `+${lvl}00% Crit Damage`
  },
  {
    id: 'passive_boost',
    name: 'Nanobot Swarm',
    description: 'Permanently boosts all automated production.',
    cost: 50,
    maxLevel: -1,
    effectDescription: (lvl) => `+${lvl * 25}% Production`
  }
];

export const SAVE_KEY = 'cosmic-miner-save-v2'; 
export const AUTO_SAVE_INTERVAL = 10000; 
export const EVENT_SCAN_COST = 500;
