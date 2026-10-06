import React from 'react';
import { ViewMode } from './SiteLayout';
import Breadcrumbs from './Breadcrumbs';

interface ComparisonPageProps {
  onNavigate: (view: ViewMode, id?: string) => void;
}

interface GameComparison {
  name: string;
  genre: string;
  theme: string;
  activeClicking: string;
  idleAutomation: string;
  progressionStructure: string;
  combatOrEvents: string;
  graphicsAndAudio: string;
  focus: string;
  sourceUrl: string;
}

const COMPARISON_DATA: GameComparison[] = [
  {
    name: "Space Clicker Game (Galaxy Miner)",
    genre: "Sci-Fi Idle / Clicker",
    theme: "Interstellar mining and planetary progression",
    activeClicking: "High: manual mining, Heat management, Critical Flux, Golden Comets",
    idleAutomation: "Mining Drones, Rovers, Bases, Orbital Stations and Dyson Swarms",
    progressionStructure: "Galactic Reset converts large Stardust runs into persistent Dark Matter and permanent technology",
    combatOrEvents: "Crisis events, Golden Comets and local anomaly scans",
    graphicsAndAudio: "Animated starfield, particle effects and browser sound effects",
    focus: "Active timing layered onto an automation-driven incremental economy",
    sourceUrl: "/game/galaxy_miner/"
  },
  {
    name: "Cookie Clicker",
    genre: "Incremental / Idle",
    theme: "Cookie production and increasingly surreal building chains",
    activeClicking: "Manual cookie clicking plus timed Golden Cookie interactions",
    idleAutomation: "Buildings and upgrades automate cookie production",
    progressionStructure: "Ascension uses prestige currency and heavenly upgrades",
    combatOrEvents: "Golden Cookies, seasonal systems, the Grandmapocalypse and Wrinklers",
    graphicsAndAudio: "Illustrated 2D browser interface with layered visual feedback",
    focus: "Long-form production growth with a large upgrade and building catalog",
    sourceUrl: "https://orteil.dashnet.org/cookieclicker/"
  },
  {
    name: "Universal Paperclips",
    genre: "Narrative Incremental / Strategy",
    theme: "AI optimization that expands from paperclip production to autonomous probes",
    activeClicking: "Manual production early, then strategic allocation and project decisions",
    idleAutomation: "Production lines, drones and self-replicating probes",
    progressionStructure: "Stage-based progression rather than a conventional repeatable prestige loop",
    combatOrEvents: "Late-game probe hazards, value drift and probe combat",
    graphicsAndAudio: "Minimal text-and-dashboard interface",
    focus: "Finite staged progression built around optimization and changing system constraints",
    sourceUrl: "https://www.decisionproblem.com/paperclips/"
  },
  {
    name: "Antimatter Dimensions",
    genre: "Idle / Incremental Strategy",
    theme: "Antimatter production, dimensions and layered mathematical progression",
    activeClicking: "Low: progression centers on purchasing, planning and automation",
    idleAutomation: "Extensive automation, including an unlockable Automator",
    progressionStructure: "Major reset layers include Infinity, Eternity and Reality",
    combatOrEvents: "Challenges, Time Studies, Glyphs, Black Holes and other progression systems",
    graphicsAndAudio: "Numerical interface with multiple themes and dense progression panels",
    focus: "Deep prestige layering, automation and long-term optimization",
    sourceUrl: "https://antimatter-dimensions.github.io/"
  },
  {
    name: "SPACEPLAN",
    genre: "Narrative Idle Sci-Fi",
    theme: "Potato-based devices and probes launched from a satellite orbiting a mysterious planet",
    activeClicking: "Manual interaction is part of the early progression",
    idleAutomation: "Devices generate resources over time while the story advances",
    progressionStructure: "Story-driven staged progression rather than a repeatable prestige economy",
    combatOrEvents: "Narrative discoveries across multiple planets and realities",
    graphicsAndAudio: "Stylized orbital presentation with an original electronic soundtrack",
    focus: "A compact narrative clicker built around discovery and scripted progression",
    sourceUrl: "https://store.steampowered.com/app/616110/SPACEPLAN/"
  },
  {
    name: "Melvor Idle",
    genre: "Idle RPG",
    theme: "Skill training, crafting, equipment and combat inspired by classic RPG systems",
    activeClicking: "Low: players choose skills, equipment, targets and progression plans",
    idleAutomation: "Timed skilling, mastery progression and extended offline-friendly systems",
    progressionStructure: "Skill levels, mastery, equipment, dungeons and completion systems rather than one global prestige reset",
    combatOrEvents: "Combat areas, dungeons, Slayer tasks, bosses and expansion content",
    graphicsAndAudio: "Menu-driven web interface centered on skills, inventories and combat panels",
    focus: "Broad RPG progression across non-combat skills, mastery systems and combat",
    sourceUrl: "https://melvoridle.com/"
  }
];

const ComparisonPage: React.FC<ComparisonPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-space-950 text-gray-200 pt-24 pb-20 px-4">


      <div className="max-w-7xl mx-auto space-y-12">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[{ label: 'Game Comparisons', view: 'compare' }]}
          onNavigate={onNavigate}
        />

        {/* Header Hero */}
        <div className="text-center space-y-4 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neon-blue/10 border border-neon-blue/30 text-neon-blue text-xs font-mono font-bold uppercase tracking-widest">
            <span>⚡ TACTICAL EVALUATION</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-black text-white tracking-tight leading-tight">
            SPACE CLICKER FEATURE COMPARISON
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed font-sans">
            Compare the mechanics of <strong>Galaxy Miner</strong> with well-known incremental games such as <em>Cookie Clicker</em>, <em>Universal Paperclips</em>, and <em>Antimatter Dimensions</em>. This is a feature snapshot, not a scored ranking.
          </p>
          <div className="pt-4 flex flex-wrap justify-center gap-4">
            <button
              type="button"
              onClick={() => onNavigate('game', 'galaxy_miner')}
              className="px-8 py-3.5 bg-gradient-to-r from-neon-blue to-blue-600 text-black font-display font-black rounded-xl hover:shadow-[0_0_30px_rgba(0,243,255,0.4)] transition-all transform hover:-translate-y-0.5"
            >
              LAUNCH SPACE CLICKER NOW
            </button>
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="px-6 py-3.5 bg-space-900 border border-white/10 hover:border-white/30 text-white font-mono text-sm rounded-xl transition-colors"
            >
              VIEW SIMULATION HUB
            </button>
          </div>
        </div>

        {/* Feature Comparison Matrix Table */}
        <div className="bg-space-900/60 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-sm overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-white/10 pb-4">
            <div>
              <h2 className="text-2xl font-display font-bold text-white">
                Incremental Games Feature Matrix
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Comparing themes, input style, automation, prestige loops, events, and presentation.
              </p>
            </div>
            <div className="text-xs font-mono text-gray-500">
              FEATURE SNAPSHOT • SYSTEMS MAY CHANGE OVER TIME
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-white/10 text-xs font-mono uppercase text-gray-400 bg-space-950/50">
                  <th className="p-4 rounded-tl-lg">Game</th>
                  <th className="p-4">Theme & Setting</th>
                  <th className="p-4">Progression / Reset Structure</th>
                  <th className="p-4">Interactive Events</th>
                  <th className="p-4">Visual Fidelity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {COMPARISON_DATA.map((game, i) => {
                  const isFeatured = game.name.includes("Space Clicker");
                  return (
                    <tr
                      key={i}
                      className={`transition-colors ${
                        isFeatured
                          ? "bg-neon-blue/10 border-l-4 border-neon-blue"
                          : "hover:bg-white/5"
                      }`}
                    >
                      <td className="p-4 font-bold text-white flex items-center gap-2">
                        {isFeatured && <span className="text-[10px] text-neon-blue border border-neon-blue/30 rounded px-1.5 py-0.5">THIS SITE</span>}
                        <span>{game.name}</span>
                      </td>
                      <td className="p-4 text-gray-300 text-xs">{game.theme}</td>
                      <td className="p-4 text-gray-300 text-xs">{game.progressionStructure.split('(')[0]}</td>
                      <td className="p-4 text-gray-300 text-xs">{game.combatOrEvents.split(',')[0]}</td>
                      <td className="p-4 text-gray-300 text-xs">{game.graphicsAndAudio.split(',')[0]}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Deep Dive Breakdown Cards */}
        <div className="space-y-6">
          <h2 className="text-3xl font-display font-bold text-white border-b border-white/10 pb-4">
            Detailed Breakdown by Game Archetype
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {COMPARISON_DATA.map((game, index) => (
              <div
                key={index}
                className={`bg-space-900/80 border rounded-2xl p-6 flex flex-col justify-between transition-all ${
                  game.name.includes("Space Clicker")
                    ? "border-neon-blue/50 shadow-[0_0_30px_rgba(0,243,255,0.15)] ring-1 ring-neon-blue/30"
                    : "border-white/10 hover:border-white/20"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="text-xl font-display font-bold text-white">
                      {game.name}
                    </h3>
                    {game.name.includes("Space Clicker") && (
                      <span className="font-mono text-[10px] font-bold px-2 py-1 bg-space-950 rounded text-neon-blue border border-neon-blue/30">
                        THIS SITE
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-neon-blue font-mono mb-4">
                    Genre: {game.genre}
                  </div>

                  <ul className="space-y-3 text-xs text-gray-300 mb-6">
                    <li>
                      <strong className="text-gray-400 block mb-0.5">🚀 Core Theme:</strong>
                      {game.theme}
                    </li>
                    <li>
                      <strong className="text-gray-400 block mb-0.5">⛏️ Active Clicking:</strong>
                      {game.activeClicking}
                    </li>
                    <li>
                      <strong className="text-gray-400 block mb-0.5">⚙️ Idle Automation:</strong>
                      {game.idleAutomation}
                    </li>
                    <li>
                      <strong className="text-gray-400 block mb-0.5">🌌 Progression Structure:</strong>
                      {game.progressionStructure}
                    </li>
                    <li>
                      <strong className="text-gray-400 block mb-0.5">🎮 Primary Focus:</strong>
                      <span className="text-gray-200">{game.focus}</span>
                    </li>
                  </ul>
                </div>

                {game.name.includes("Space Clicker") ? (
                  <button
                    type="button"
                    onClick={() => onNavigate('game', 'galaxy_miner')}
                    className="w-full py-2.5 bg-neon-blue text-black font-bold font-mono text-xs rounded-lg hover:brightness-110 transition-all uppercase tracking-wider"
                  >
                    Play Space Clicker Free
                  </button>
                ) : (
                  <a
                    href={game.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-[11px] text-neon-blue/80 hover:text-neon-blue font-mono text-center pt-2 border-t border-white/5"
                  >
                    View primary game page ↗
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>

        <aside className="rounded-2xl border border-white/10 bg-space-900/50 p-5 text-xs leading-relaxed text-gray-400">
          <strong className="text-white">Comparison note:</strong> This page compares broad gameplay structures rather than scoring or ranking the games. Third-party names and trademarks belong to their respective owners, and SpaceClickerGame.com is not affiliated with those projects. External game features can change after this snapshot; use the linked primary pages for current product details.
        </aside>

        {/* Strategic Comparison Articles & FAQs for SEO Snippets */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-8">
          <div className="bg-space-900/60 border border-white/10 rounded-2xl p-6 md:p-8 space-y-4">
            <h3 className="text-2xl font-display font-bold text-white">
              How Galaxy Miner Differs
            </h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              Incremental games emphasize different things: some focus on a single production loop, some on layered resets, and others on narrative or management. Galaxy Miner adds an active heat-management layer on top of its automation economy.
            </p>
            <p className="text-gray-300 text-sm leading-relaxed">
              In Galaxy Miner, the <em>Heat Flux</em> zone activates between 80% and 99% heat and doubles output while the beam remains below the overheat threshold. Golden Comets, crisis events, local anomaly scans, automation, and Dark Matter resets add additional decisions around that core loop.
            </p>
          </div>

          <div className="bg-space-900/60 border border-white/10 rounded-2xl p-6 md:p-8 space-y-4">
            <h3 className="text-2xl font-display font-bold text-white">
              Frequently Asked Questions (FAQ)
            </h3>
            <div className="space-y-4 text-sm">
              <div className="border-b border-white/5 pb-3">
                <h4 className="font-bold text-white mb-1">
                  How does Dark Matter Prestige work in Space Clicker?
                </h4>
                <p className="text-gray-400 text-xs leading-relaxed">
                  At 1 Trillion (1e12) Stardust, Galactic Reset becomes available. The first threshold grants 5 Dark Matter; higher runs can grant more. Stardust and standard upgrades reset, while Dark Matter and permanent technology remain. Each Dark Matter adds 10% to production.
                </p>
              </div>
              <div className="border-b border-white/5 pb-3">
                <h4 className="font-bold text-white mb-1">
                  Does Space Clicker Game require an install or account?
                </h4>
                <p className="text-gray-400 text-xs leading-relaxed">
                  No install or account is required for the current browser build. Network administrators can still restrict access, so the site does not claim to bypass school, workplace, parental-control, or firewall policies.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ComparisonPage;
