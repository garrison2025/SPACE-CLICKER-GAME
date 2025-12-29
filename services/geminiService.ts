
import { GameState } from "../types";

// --- STATIC DATA CONTENT ---

const STATIC_EVENTS = [
  { title: "Asteroid Field", description: "Navigated through a dense field. Found rich mineral deposits.", baseReward: 150 },
  { title: "Solar Flare", description: "Wait out a massive solar flare. Sensors recharged.", baseReward: 100 },
  { title: "Abandoned Probe", description: "Salvaged parts from an ancient Voyager probe.", baseReward: 300 },
  { title: "Space Whale", description: "Witnessed a majestic creature feeding on stardust.", baseReward: 500 },
  { title: "Pirate Skirmish", description: "Fended off a small raider party. Loot secured.", baseReward: 200 },
  { title: "Trade Convoy", description: "Traded excess oxygen for credits with a passing convoy.", baseReward: 250 },
  { title: "Wormhole Echo", description: "Detected gravitational waves from a collapsing star.", baseReward: 400 },
  { title: "Glitch in Matrix", description: "The universe blinked. Or maybe it was just a sensor malfunction.", baseReward: 50 }
];

const ALIEN_SENDERS = ["Hive Cluster 7", "The Void", "Imperial Frigate", "Lost Colony", "Unknown Signal", "Echo-4"];
const ALIEN_MESSAGES = [
  "DO NOT APPROACH THE EVENT HORIZON",
  "WE SEE YOUR TINY SHIPS",
  "MINERALS DETECTED. PREPARE FOR EXTRACTION.",
  "HELP US. OXYGEN CRITICAL.",
  "THE STARS ARE DYING ONE BY ONE",
  "01001000 01000101 01001100 01001100 01001111",
  "TRANSMISSION ENDS. SILENCE FOLLOWS.",
  "TRADE OFFER: 500 CARBON FOR 1 WARP CELL"
];

// --- MOCK SERVICES ---

export const generateSpaceEvent = async (gameState: GameState): Promise<{ title: string; description: string; reward?: number }> => {
  // Simulate network delay for realism
  await new Promise(resolve => setTimeout(resolve, 800));

  const randomEvent = STATIC_EVENTS[Math.floor(Math.random() * STATIC_EVENTS.length)];
  
  // Scale reward based on level
  const scaledReward = randomEvent.baseReward * (gameState.level || 1);

  return {
    title: randomEvent.title,
    description: randomEvent.description,
    reward: scaledReward
  };
};

export const generateAlienMessage = async (frequency: number, antennaLevel: number): Promise<{ sender: string; content: string; dataValue: number; encryption: number; type: 'BIO' | 'TECH' | 'VOID' | 'MIL' }> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  const sender = ALIEN_SENDERS[Math.floor(Math.random() * ALIEN_SENDERS.length)];
  const content = ALIEN_MESSAGES[Math.floor(Math.random() * ALIEN_MESSAGES.length)];
  
  const types: ('BIO' | 'TECH' | 'VOID' | 'MIL')[] = ['BIO', 'TECH', 'VOID', 'MIL'];
  const type = types[Math.floor(Math.random() * types.length)];

  return {
    sender: sender,
    content: content,
    dataValue: 50 * antennaLevel + Math.floor(Math.random() * 100),
    encryption: 10 + (antennaLevel * 2),
    type: type
  };
};
