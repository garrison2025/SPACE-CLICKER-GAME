
import { GoogleGenAI } from "@google/genai";
import { GameState } from "../types";

// --- OFFLINE DATA POOLS ---
const OFFLINE_EVENTS = [
    { title: "Mineral Pocket", description: "Sensors detected a dense pocket of Stardust nearby.", reward: 200 },
    { title: "Lost Drone", description: "We recovered a wandering drone. It had some resources in its cargo.", reward: 350 },
    { title: "Solar Flare", description: "A minor solar flare boosted our energy collectors momentarily.", reward: 150 },
    { title: "Trade Opportunity", description: "A passing merchant offered a good price for our waste dust.", reward: 500 },
    { title: "Ancient Debris", description: "Salvaged usable materials from an old satellite wreck.", reward: 100 }
];

const OFFLINE_MESSAGES = [
    { sender: "VOID_ECHO", content: "THEY ARE WATCHING. DO NOT DIG TOO DEEP.", dataValue: 120, encryption: 20, type: 'VOID' as const },
    { sender: "COLONY_CMD", content: "Supply drop incoming to Sector 7. Acknowledge.", dataValue: 80, encryption: 10, type: 'MIL' as const },
    { sender: "UNKNOWN", content: "01001000 01000101 01001100 01001100 01001111", dataValue: 50, encryption: 5, type: 'TECH' as const },
    { sender: "HIVE_MIND", content: "Biomass required. Expansion imminent.", dataValue: 150, encryption: 40, type: 'BIO' as const },
    { sender: "OLD_EARTH", content: "Is anyone out there? We are still broadcasting...", dataValue: 300, encryption: 15, type: 'TECH' as const },
    { sender: "PIRATE_VESS", content: "Surrender your cargo or face annihilation.", dataValue: 200, encryption: 30, type: 'MIL' as const },
    { sender: "DERELICT", content: "Warning: Reactor core critical. Evacuate.", dataValue: 100, encryption: 10, type: 'TECH' as const }
];

// Helper to ensure we have a key
const getClient = () => {
  // Check for API Key securely. If not present, we return null to trigger offline mode.
  const key = process.env.API_KEY;
  if (!key || key.includes("YOUR_API_KEY")) return null;
  return new GoogleGenAI({ apiKey: key });
};

export const generateSpaceEvent = async (gameState: GameState): Promise<{ title: string; description: string; reward?: number }> => {
  const ai = getClient();
  
  // OFFLINE FALLBACK
  if (!ai) {
      const template = OFFLINE_EVENTS[Math.floor(Math.random() * OFFLINE_EVENTS.length)];
      // Scale reward slightly by level
      const scaledReward = template.reward * (1 + (gameState.level || 1) * 0.1);
      return { ...template, reward: Math.floor(scaledReward) };
  }

  const prompt = `
    You are the AI of a sci-fi mining ship. The current status is:
    - Stardust Resources: ${Math.floor(gameState.resources.STARDUST)}
    - Mining Level: ${gameState.level}
    - Fleet Size: ${Object.values(gameState.upgrades).reduce((acc, u) => acc + u.count, 0)} units.

    Generate a short, immersive "random event" or "scan result".
    It should be 2-3 sentences max.
    
    Also, suggest a random Stardust reward between ${100 * (gameState.level || 1)} and ${500 * (gameState.level || 1)} based on the event positivity.
    
    Return pure JSON with this schema:
    {
      "title": "Short Title",
      "description": "The flavor text...",
      "reward": 150
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response text");
    
    const data = JSON.parse(text);
    return data;
  } catch (error) {
    console.warn("Gemini API Error (Falling back to offline mode):", error);
    const template = OFFLINE_EVENTS[Math.floor(Math.random() * OFFLINE_EVENTS.length)];
    return { ...template, reward: template.reward * (gameState.level || 1) };
  }
};

export const generateAlienMessage = async (frequency: number, antennaLevel: number): Promise<{ sender: string; content: string; dataValue: number; encryption: number; type: 'BIO' | 'TECH' | 'VOID' | 'MIL' }> => {
  const ai = getClient();
  
  // OFFLINE FALLBACK
  if (!ai) {
      const template = OFFLINE_MESSAGES[Math.floor(Math.random() * OFFLINE_MESSAGES.length)];
      return {
          ...template,
          // Add some random variation to offline messages so they don't look identical
          encryption: Math.floor(template.encryption * (0.8 + Math.random() * 0.4)),
          dataValue: Math.floor(template.dataValue * (1 + antennaLevel * 0.1))
      };
  }

  const prompt = `
    You are a retro-futuristic spaceship terminal receiving a deep space transmission.
    Context:
    - Frequency: ${frequency.toFixed(2)} MHz.
    - Antenna Level: ${antennaLevel}.
    
    Generate a JSON response:
    {
      "sender": "A name (e.g., 'Hive Cluster 7', 'Derelict Station', 'The Void', 'Imperial Frigate')",
      "content": "The message (max 15 words). Cryptic, ominous, or technical.",
      "dataValue": number (50-1000, value of this intel),
      "encryption": number (10-100, difficulty),
      "type": "BIO" | "TECH" | "VOID" | "MIL" (Choose one based on content)
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text;
    if (!text) return OFFLINE_MESSAGES[0];
    return JSON.parse(text);
  } catch (e) {
    return OFFLINE_MESSAGES[0];
  }
};
