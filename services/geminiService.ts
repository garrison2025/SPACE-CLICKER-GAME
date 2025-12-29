
import { GameState } from "../types";

// --- LOCAL DATA MOCKS ---

const SPACE_EVENTS = [
  { title: "Comms Offline", description: "Long range sensors are offline. Using local backup database.", baseReward: 100 },
  { title: "Solar Flare", description: "A minor flare disrupted the neural link.", baseReward: 50 },
  { title: "Asteroid Belt", description: "Dense mineral cluster detected nearby.", baseReward: 200 },
  { title: "Trading Convoy", description: "Passing merchants jettisoned excess cargo.", baseReward: 150 },
  { title: "Derelict Probe", description: "Found an ancient data cache.", baseReward: 300 },
  { title: "Pirate Skirmish", description: "Salvaged scrap from a destroyed pirate scout.", baseReward: 250 },
  { title: "Stellar Alignment", description: "Cosmic rays boosted energy collectors.", baseReward: 400 },
  { title: "Void Echo", description: "Strange readings from the deep dark.", baseReward: 500 }
];

const ALIEN_FRAGMENTS = [
  "HEL..P", "WARN..ING", "DANG..ER", "VO..ID", "EMP..IRE", 
  "TRA..DE", "ENE..RGY", "DAR..K", "LI..GHT", "SE..EK",
  "0x4F", "0xA9", "ERR_404", "NULL", "SIG_LOST"
];

const FACTIONS: ('BIO' | 'TECH' | 'VOID' | 'MIL')[] = ['BIO', 'TECH', 'VOID', 'MIL'];

// --- LOCAL LOGIC FUNCTIONS ---

export const generateSpaceEvent = async (gameState: GameState): Promise<{ title: string; description: string; reward?: number }> => {
  // Simulate network delay for realism
  await new Promise(resolve => setTimeout(resolve, 800));

  const template = SPACE_EVENTS[Math.floor(Math.random() * SPACE_EVENTS.length)];
  
  // Scale reward based on level
  const scaledReward = template.baseReward * (gameState.level || 1);

  return {
    title: template.title,
    description: template.description,
    reward: scaledReward
  };
};

export const generateAlienMessage = async (frequency: number, antennaLevel: number): Promise<{ sender: string; content: string; dataValue: number; encryption: number; type: 'BIO' | 'TECH' | 'VOID' | 'MIL' }> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 600));

  const faction = FACTIONS[Math.floor(Math.random() * FACTIONS.length)];
  const encryption = Math.floor(Math.random() * 90) + 10; // 10-100
  const dataValue = Math.floor((antennaLevel * 50) * (1 + Math.random()));

  // Generate gibberish content
  let content = "";
  const len = Math.floor(Math.random() * 5) + 3;
  for(let i=0; i<len; i++) {
      content += ALIEN_FRAGMENTS[Math.floor(Math.random() * ALIEN_FRAGMENTS.length)] + " ";
  }

  return {
    sender: `${faction}_CMD_${Math.floor(Math.random() * 999)}`,
    content: content.trim(),
    dataValue,
    encryption,
    type: faction
  };
};
