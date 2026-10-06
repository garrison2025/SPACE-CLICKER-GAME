import React, { useState, useEffect } from 'react';
import { ViewMode } from './SiteLayout';
import Breadcrumbs from './Breadcrumbs';
import { SAVE_KEY } from '../constants';
import { formatNumber } from '../utils';
import { safeGetStorageItem } from '../utils/projectStorage';

interface AchievementsPageProps {
  onNavigate: (view: ViewMode, id?: string) => void;
}

interface Achievement {
  id: string;
  category: 'mining' | 'automation' | 'prestige';
  title: string;
  description: string;
  unlockCondition: string;
  noteText: string;
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
    noteText: 'Tracked milestone; no separate achievement bonus.',
    icon: '✨',
    targetValue: 1000
  },
  {
    id: 'mine_2',
    category: 'mining',
    title: 'Asteroid Prospector',
    description: 'Establish a steady manual harvest from local orbital rocks.',
    unlockCondition: 'Accumulate 1,000,000 (1M) Total Stardust',
    noteText: 'Tracked milestone; no separate achievement bonus.',
    icon: '☄️',
    targetValue: 1000000
  },
  {
    id: 'mine_3',
    category: 'mining',
    title: 'Planetary Core Stripper',
    description: 'Drill deep into the mantle of alien celestial bodies.',
    unlockCondition: 'Accumulate 1,000,000,000 (1B) Total Stardust',
    noteText: 'Tracked milestone; no separate achievement bonus.',
    icon: '🪐',
    targetValue: 1000000000
  },
  {
    id: 'mine_4',
    category: 'mining',
    title: 'Galactic Sovereign',
    description: 'Reach the pinnacle of raw mineral wealth across the galaxy.',
    unlockCondition: 'Accumulate 1,000,000,000,000 (1T) Total Stardust',
    noteText: 'This milestone also reaches the first Galactic Reset threshold.',
    icon: '👑',
    targetValue: 1000000000000
  },
  {
    id: 'mine_5',
    category: 'mining',
    title: 'Cosmic Singularity Master',
    description: 'Harness the mass of black holes into pure stardust.',
    unlockCondition: 'Accumulate 1,000,000,000,000,000 (1Q) Total Stardust',
    noteText: 'Tracked lifetime production milestone.',
    icon: '🌌',
    targetValue: 1000000000000000
  },

  // Automation Milestones
  {
    id: 'auto_1',
    category: 'automation',
    title: 'Drone Fleet Commander',
    description: 'Deploy an automated fleet of Mining Drones.',
    unlockCondition: 'Own 25 Mining Drones',
    noteText: 'At 25 units, the game’s normal upgrade milestone multiplier also activates.',
    icon: '🛸',
    targetValue: 25
  },
  {
    id: 'auto_2',
    category: 'automation',
    title: 'Orbital Architect',
    description: 'Construct a constellation of heavy orbital mining stations.',
    unlockCondition: 'Own 50 Orbital Stations',
    noteText: 'At 50 units, normal 25- and 50-unit production milestones are already active.',
    icon: '🛰️',
    targetValue: 50
  },
  {
    id: 'auto_3',
    category: 'automation',
    title: 'Dyson Swarm Engineer',
    description: 'Deploy the first Dyson Swarm production tier.',
    unlockCondition: 'Own at least 1 Dyson Swarm',
    noteText: 'Tracked ownership milestone; no separate achievement bonus.',
    icon: '☀️',
    targetValue: 1
  },

  // Prestige & Dark Matter
  {
    id: 'prestige_1',
    category: 'prestige',
    title: 'Galactic Reset',
    description: 'Complete your first Stardust reset and retain Dark Matter for future runs.',
    unlockCondition: 'Complete your first Galactic Reset',
    noteText: 'Dark Matter enables permanent technology purchases in the Void Tech panel.',
    icon: '💥',
    targetValue: 1
  },
  {
    id: 'prestige_2',
    category: 'prestige',
    title: 'Dark Matter Harvester',
    description: 'Amass significant reserves of anti-gravitational dark matter.',
    unlockCondition: 'Accumulate 100 Dark Matter',
    noteText: '100 Dark Matter itself contributes +1,000% to the production multiplier.',
    icon: '🟣',
    targetValue: 100
  },
];

const AchievementsPage: React.FC<AchievementsPageProps> = ({ onNavigate }) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [achievements, setAchievements] = useState<Achievement[]>(ACHIEVEMENTS_DATA);
  const [unlockedCount, setUnlockedCount] = useState<number>(0);
  const [totalStardust, setTotalStardust] = useState<number>(0);

  // Load active progress from localStorage
  useEffect(() => {
    try {
      const saved = safeGetStorageItem(SAVE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        const stardust = data.lifetimeEarnings || data.resources?.STARDUST || 0;
        const darkMatter = data.resources?.DARK_MATTER || 0;
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

  return (
    <div className="min-h-screen bg-space-950 text-gray-200 pt-24 pb-20 px-4">


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
            GALAXY MINER MILESTONES
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed font-sans">
            Track milestones that can be verified from your local Galaxy Miner save. This page is a progress dashboard; it does not grant separate hidden rewards.
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
            { id: 'all', label: 'ALL MILESTONES' },
            { id: 'mining', label: '✨ MINING' },
            { id: 'automation', label: '🛸 AUTOMATION' },
            { id: 'prestige', label: '💥 DARK MATTER' }
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
                    <span className="text-gray-500 block text-[10px] uppercase">Milestone Note:</span>
                    <span className="text-neon-blue font-bold">{ach.noteText}</span>
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
            Practical Galaxy Miner Progression
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-300">
            <div className="space-y-2">
              <h3 className="text-neon-blue font-bold font-display text-base">1. Use the Heat Flux Window</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Heat between 80% and 99% activates the 2x Flux output bonus. Crossing 100% overheats the beam, so active play is about balancing output against the shutdown risk.
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
                Galactic Reset first becomes available at 1 Trillion Stardust and grants 5 Dark Matter at that threshold. A larger run can grant more Dark Matter, so compare the value of resetting now with the time needed to reach the next meaningful gain.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AchievementsPage;
