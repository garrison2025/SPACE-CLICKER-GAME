import React, { useState, useEffect } from 'react';
import { ViewMode } from './SiteLayout';
import Breadcrumbs from './Breadcrumbs';
import SEOHead from './SEOHead';
import { SAVE_KEY, PLANETS } from '../constants';
import { formatNumber } from '../utils';

interface AchievementsPageProps {
  onNavigate: (view: ViewMode, id?: string) => void;
}

interface Achievement {
  id: string;
  category: 'mining' | 'automation' | 'prestige' | 'tactical' | 'secret';
  title: string;
  description: string;
  unlockCondition: string;
  rewardText: string;
  icon: string;
  targetValue: number;
  currentValue?: number;
  unlocked?: boolean;
}

const ACHIEVEMENTS_DATA: Achievement[] = [
  // Mining Milestones
  {
    id: 'mine_1',
    category: 'mining',
    title: 'Stardust Initiate',
    description: 'Mine your very first units of celestial stardust.',
    unlockCondition: 'Accumulate 1,000 Total Stardust',
    rewardText: '+5% Click Power',
    icon: '✨',
    targetValue: 1000
  },
  {
    id: 'mine_2',
    category: 'mining',
    title: 'Asteroid Prospector',
    description: 'Establish a steady manual harvest from local orbital rocks.',
    unlockCondition: 'Accumulate 1,000,000 (1M) Total Stardust',
    rewardText: '+10% Click Power',
    icon: '☄️',
    targetValue: 1000000
  },
  {
    id: 'mine_3',
    category: 'mining',
    title: 'Planetary Core Stripper',
    description: 'Drill deep into the mantle of alien celestial bodies.',
    unlockCondition: 'Accumulate 1,000,000,000 (1B) Total Stardust',
    rewardText: '+25% Click Power',
    icon: '🪐',
    targetValue: 1000000000
  },
  {
    id: 'mine_4',
    category: 'mining',
    title: 'Galactic Sovereign',
    description: 'Reach the pinnacle of raw mineral wealth across the galaxy.',
    unlockCondition: 'Accumulate 1,000,000,000,000 (1T) Total Stardust',
    rewardText: '+50% All Production',
    icon: '👑',
    targetValue: 1000000000000
  },
  {
    id: 'mine_5',
    category: 'mining',
    title: 'Cosmic Singularity Master',
    description: 'Harness the mass of black holes into pure stardust.',
    unlockCondition: 'Accumulate 1,000,000,000,000,000 (1Q) Total Stardust',
    rewardText: '+100% Dark Matter Yield',
    icon: '🌌',
    targetValue: 1000000000000000
  },

  // Automation Milestones
  {
    id: 'auto_1',
    category: 'automation',
    title: 'Drone Fleet Commander',
    description: 'Deploy an automated fleet of Autonomous Mining Drones.',
    unlockCondition: 'Own 25 Autonomous Drones',
    rewardText: '2x Drone Efficiency',
    icon: '🛸',
    targetValue: 25
  },
  {
    id: 'auto_2',
    category: 'automation',
    title: 'Orbital Architect',
    description: 'Construct a constellation of heavy orbital mining stations.',
    unlockCondition: 'Own 50 Orbital Stations',
    rewardText: '2x Orbital Station Output',
    icon: '🛰️',
    targetValue: 50
  },
  {
    id: 'auto_3',
    category: 'automation',
    title: 'Dyson Sphere Engineer',
    description: 'Encase star cores to harvest their total luminosity.',
    unlockCondition: 'Construct at least 1 Dyson Sphere Swarm',
    rewardText: 'Permanent +20% Global Passive Speed',
    icon: '☀️',
    targetValue: 1
  },

  // Prestige & Dark Matter
  {
    id: 'prestige_1',
    category: 'prestige',
    title: 'Quantum Supernova',
    description: 'Collapse your first planetary civilization to harness Dark Matter.',
    unlockCondition: 'Perform your first Quantum Supernova Prestige Reset',
    rewardText: 'Unlocks the Quantum Research Tech Tree',
    icon: '💥',
    targetValue: 1
  },
  {
    id: 'prestige_2',
    category: 'prestige',
    title: 'Dark Matter Harvester',
    description: 'Amass significant reserves of anti-gravitational dark matter.',
    unlockCondition: 'Accumulate 100 Dark Matter',
    rewardText: '+1,000% Compounding Multiplier',
    icon: '🟣',
    targetValue: 100
  },
  {
    id: 'prestige_3',
    category: 'prestige',
    title: 'Multiverse Explorer',
    description: 'Traverse multiple dimensional cycles to explore distant exoplanets.',
    unlockCondition: 'Reach Planet Sector 5 (Chronos Alpha or beyond)',
    rewardText: 'Instant Sector Jump Capability',
    icon: '🌀',
    targetValue: 5
  },

  // Tactical Mastery
  {
    id: 'tactical_1',
    category: 'tactical',
    title: 'Heat Crux Master',
    description: 'Master weapon temperature calibration without causing system shutdown.',
    unlockCondition: 'Maintain 80-99% heat for 15 consecutive seconds',
    rewardText: '+15% Critical Flux Multiplier',
    icon: '🔥',
    targetValue: 1
  },
  {
    id: 'tactical_2',
    category: 'tactical',
    title: 'Comet Interceptor',
    description: 'Catch swift golden comets traversing the planetary orbit.',
    unlockCondition: 'Intercept 10 Golden Comets',
    rewardText: 'Comet Rewards Increased by 50%',
    icon: '⭐',
    targetValue: 10
  },
  {
    id: 'tactical_3',
    category: 'tactical',
    title: 'Planetary Defense Veteran',
    description: 'Successfully neutralize extraterrestrial pirate invasion crises.',
    unlockCondition: 'Successfully resolve 5 Crisis Defense Events',
    rewardText: '+20% Crisis Defense Bounty',
    icon: '🛡️',
    targetValue: 5
  },

  // Secret Easter Eggs
  {
    id: 'secret_1',
    category: 'secret',
    title: 'Subspace Cryptographer',
    description: 'Transmit deep space scans to receive AI anomalous intelligence.',
    unlockCondition: 'Perform a Gemini Interstellar Subspace Scan',
    rewardText: 'Unlocks Secret Log Transmissions',
    icon: '📻',
    targetValue: 1
  },
  {
    id: 'secret_2',
    category: 'secret',
    title: 'The Infinite Void Walker',
    description: 'Achieve total synergy across all mining rigs in the galaxy.',
    unlockCondition: 'Purchase every tier of basic mining upgrades',
    rewardText: 'Legendary Commander Badge',
    icon: '🎖️',
    targetValue: 1
  }
];

const AchievementsPage: React.FC<AchievementsPageProps> = ({ onNavigate }) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [achievements, setAchievements] = useState<Achievement[]>(ACHIEVEMENTS_DATA);
  const [unlockedCount, setUnlockedCount] = useState<number>(0);
  const [totalStardust, setTotalStardust] = useState<number>(0);

  // Load active progress from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        const stardust = data.lifetimeEarnings || data.resources?.STARDUST || 0;
        const darkMatter = data.resources?.DARK_MATTER || 0;
        const planetIdx = data.planetIndex || 0;
        const drones = data.upgrades?.['drone']?.count || 0;
        const stations = data.upgrades?.['station']?.count || 0;
        const dyson = data.upgrades?.['dyson']?.count || 0;

        setTotalStardust(stardust);

        let unlocked = 0;
        const updated = ACHIEVEMENTS_DATA.map((ach) => {
          let isUnlocked = false;
          let current = 0;

          if (ach.id.startsWith('mine_')) {
            current = stardust;
            isUnlocked = stardust >= ach.targetValue;
          } else if (ach.id === 'auto_1') {
            current = drones;
            isUnlocked = drones >= ach.targetValue;
          } else if (ach.id === 'auto_2') {
            current = stations;
            isUnlocked = stations >= ach.targetValue;
          } else if (ach.id === 'auto_3') {
            current = dyson;
            isUnlocked = dyson >= ach.targetValue;
          } else if (ach.id === 'prestige_1') {
            current = darkMatter > 0 ? 1 : 0;
            isUnlocked = darkMatter > 0;
          } else if (ach.id === 'prestige_2') {
            current = darkMatter;
            isUnlocked = darkMatter >= ach.targetValue;
          } else if (ach.id === 'prestige_3') {
            current = planetIdx + 1;
            isUnlocked = planetIdx + 1 >= ach.targetValue;
          }

          if (isUnlocked) unlocked++;
          return { ...ach, currentValue: current, unlocked: isUnlocked };
        });

        setAchievements(updated);
        setUnlockedCount(unlocked);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const filteredAchievements = activeCategory === 'all'
    ? achievements
    : achievements.filter(a => a.category === activeCategory);

  const achievementsSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": "https://spaceclickergame.com/achievements",
        "url": "https://spaceclickergame.com/achievements",
        "name": "Space Clicker Game: Complete Achievements & Trophy Guide",
        "description": "Full directory and unlock guide for all achievements, trophies, secret badges, and Dark Matter milestones in Space Clicker Game.",
        "isPartOf": {
          "@type": "WebSite",
          "name": "Space Clicker Game",
          "url": "https://spaceclickergame.com"
        }
      },
      {
        "@type": "HowTo",
        "name": "How to Unlock All Space Clicker Game Achievements",
        "description": "Step-by-step strategy to achieve 100% completion in Space Clicker Game.",
        "step": [
          {
            "@type": "HowToStep",
            "name": "Mine Initial Stardust Milestones",
            "text": "Click the planetary core to earn Stardust Initiate (1,000 SD) and Asteroid Prospector (1M SD)."
          },
          {
            "@type": "HowToStep",
            "name": "Automate Heavy Drone Fleets",
            "text": "Purchase 25 Autonomous Drones and 50 Orbital Stations to unlock Drone Fleet Commander and Orbital Architect."
          },
          {
            "@type": "HowToStep",
            "name": "Execute Quantum Supernova Reset",
            "text": "Accumulate 1 Trillion Stardust to execute your first Quantum Supernova and unlock the Quantum Supernova trophy."
          }
        ]
      }
    ]
  };

  return (
    <div className="min-h-screen bg-space-950 text-gray-200 pt-24 pb-20 px-4">
      <SEOHead
        title="Space Clicker Game: Full Achievements, Badges & Trophy Guide (2026)"
        description="Comprehensive guide to unlocking every achievement in Space Clicker Game. Track your live progress, discover secret trophies, and claim Dark Matter bonuses."
        path="/achievements"
        type="article"
        keywords="space clicker achievements, idle game trophy guide, space clicker badges, secret achievements space clicker, dark matter unlock guide"
        schema={achievementsSchema}
      />

      <div className="max-w-7xl mx-auto space-y-10">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[{ label: 'Achievements & Trophies', view: 'achievements' }]}
          onNavigate={onNavigate}
        />

        {/* Hero Section */}
        <div className="text-center space-y-4 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neon-green/10 border border-neon-green/30 text-neon-green text-xs font-mono font-bold uppercase tracking-widest">
            <span>🏆 COMMANDER DOSSIER</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-black text-white tracking-tight">
            ACHIEVEMENTS & TROPHY GUIDE
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed font-sans">
            Track your galactic mastery, claim milestone multipliers, and discover hidden secret ciphers across the Void Expanse network.
          </p>

          {/* Live Progress Banner */}
          <div className="p-6 bg-space-900/80 border border-white/10 rounded-2xl max-w-2xl mx-auto mt-6 backdrop-blur-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-mono uppercase text-gray-400 font-bold">
                Your Simulation Progress
              </span>
              <span className="text-xs font-mono font-bold text-neon-green">
                {unlockedCount} / {achievements.length} UNLOCKED (
                {Math.round((unlockedCount / achievements.length) * 100)}%)
              </span>
            </div>
            <div className="w-full bg-space-950 h-3 rounded-full overflow-hidden border border-white/5">
              <div
                className="bg-gradient-to-r from-neon-blue via-emerald-400 to-neon-green h-full transition-all duration-500 rounded-full"
                style={{ width: `${(unlockedCount / achievements.length) * 100}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center mt-3 text-[11px] font-mono text-gray-400">
              <span>Total Lifetime Stardust: {formatNumber(totalStardust)} SD</span>
              <button
                onClick={() => onNavigate('game', 'galaxy_miner')}
                className="text-neon-blue hover:underline font-bold"
              >
                Launch Game & Unlock More →
              </button>
            </div>
          </div>
        </div>

        {/* Filter Categories */}
        <div className="flex flex-wrap justify-center gap-2 pt-4">
          {[
            { id: 'all', label: 'ALL TROPHIES' },
            { id: 'mining', label: '✨ MINING' },
            { id: 'automation', label: '🛸 AUTOMATION' },
            { id: 'prestige', label: '💥 PRESTIGE' },
            { id: 'tactical', label: '🔥 TACTICAL' },
            { id: 'secret', label: '📻 SECRET CIPHERS' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase transition-all ${
                activeCategory === cat.id
                  ? 'bg-neon-blue text-black shadow-[0_0_15px_rgba(0,243,255,0.4)]'
                  : 'bg-space-900 border border-white/10 text-gray-400 hover:text-white hover:border-white/20'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Achievements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAchievements.map((ach) => (
            <div
              key={ach.id}
              className={`rounded-2xl p-6 border transition-all flex flex-col justify-between ${
                ach.unlocked
                  ? 'bg-space-900/90 border-neon-green/50 shadow-[0_0_20px_rgba(16,185,129,0.15)] ring-1 ring-neon-green/30'
                  : 'bg-space-900/40 border-white/10 hover:border-white/20 opacity-80'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-space-950 border border-white/10 flex items-center justify-center text-2xl shadow-inner">
                    {ach.icon}
                  </div>
                  {ach.unlocked ? (
                    <span className="px-2.5 py-1 bg-neon-green/10 border border-neon-green/30 text-neon-green font-mono text-[10px] font-bold rounded-full">
                      ✓ UNLOCKED
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 bg-white/5 border border-white/10 text-gray-500 font-mono text-[10px] font-bold rounded-full">
                      🔒 LOCKED
                    </span>
                  )}
                </div>

                <h3 className="text-xl font-display font-bold text-white mb-1">
                  {ach.title}
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed mb-4">
                  {ach.description}
                </p>

                <div className="space-y-2 text-xs font-mono bg-space-950/60 p-3 rounded-lg border border-white/5 mb-4">
                  <div>
                    <span className="text-gray-500 block text-[10px] uppercase">Requirement:</span>
                    <span className="text-gray-300 font-semibold">{ach.unlockCondition}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px] uppercase">Commander Bonus:</span>
                    <span className="text-neon-blue font-bold">{ach.rewardText}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-gray-400">
                <span className="uppercase text-[10px] text-gray-500">Category: {ach.category}</span>
                <button
                  onClick={() => onNavigate('game', 'galaxy_miner')}
                  className="text-neon-green hover:underline font-bold"
                >
                  Pursue →
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Strategic Tips Article & Guides for SEO */}
        <div className="bg-space-900/60 border border-white/10 rounded-2xl p-6 md:p-8 space-y-6">
          <h2 className="text-2xl font-display font-bold text-white border-b border-white/10 pb-4">
            How to Fast-Track 100% Achievement Completion
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-300">
            <div className="space-y-2">
              <h3 className="text-neon-blue font-bold font-display text-base">1. Optimize Heat Crux Rhythm</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Maintain your mining laser heat between 80% and 99% to receive a 2x Flux output boost. This cuts the time to achieve the <em>Planetary Core Stripper</em> milestone in half.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-neon-green font-bold font-display text-base">2. Stagger Drone Milestones</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Upgrades gain a 2x multiplier at 25, 50, 100, and 200 units, and a 4x multiplier at 500 units. Prioritize hitting these thresholds rather than spreading purchases evenly.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-neon-purple font-bold font-display text-base">3. Strategic Dark Matter Resets</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Never trigger a Quantum Supernova for less than 10 Dark Matter. Invest your initial Dark Matter into <em>Passive Boost</em> and <em>Critical Multiplier</em> to accelerate subsequent cycles.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AchievementsPage;
