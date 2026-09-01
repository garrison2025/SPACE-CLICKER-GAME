import React, { useState, useEffect } from 'react';
import { ViewMode } from './SiteLayout';
import Breadcrumbs from './Breadcrumbs';
import SEOHead from './SEOHead';

interface ComparisonPageProps {
  onNavigate: (view: ViewMode, id?: string) => void;
}

interface GameComparison {
  name: string;
  genre: string;
  theme: string;
  activeClicking: string;
  idleAutomation: string;
  prestigeSystem: string;
  combatOrEvents: string;
  graphicsAndAudio: string;
  aiFeatures: string;
  bestFor: string;
  score: number;
}

const COMPARISON_DATA: GameComparison[] = [
  {
    name: "Space Clicker Game (Cosmic Miner)",
    genre: "Sci-Fi Idle / Clicker",
    theme: "Interstellar Mining & Planetary Colonization",
    activeClicking: "High (Heat Management, Critical Flux 80-99% bonus, Golden Comets)",
    idleAutomation: "Extensive (Mining Drones, Orbital Stations, Dyson Spheres)",
    prestigeSystem: "Quantum Supernova (Dark Matter permanent multiplier + Tech Tree)",
    combatOrEvents: "Real-time Crisis Invasions, Comet Catches, AI Subspace Anomaly generation",
    graphicsAndAudio: "Hardware-accelerated Starfield Canvas, Custom Particle FX, Synthwave Ambience",
    aiFeatures: "Integrated Gemini Subspace Scanner with dynamic procedural events",
    bestFor: "Players seeking modern visuals, deep sci-fi themes, and active/passive hybrid strategy",
    score: 9.8
  },
  {
    name: "Cookie Clicker",
    genre: "Classic Incremental",
    theme: "Baking & Grandmapocalypse",
    activeClicking: "Medium (Big Cookie click, Golden Cookies)",
    idleAutomation: "Very High (Cursors, Grandmas, Portals, Fractal Engines)",
    prestigeSystem: "Heavenly Chips & Ascension Upgrades",
    combatOrEvents: "Wrinklers & Seasonal events",
    graphicsAndAudio: "2D Pixel art, classic sound effects",
    aiFeatures: "None",
    bestFor: "Nostalgic gamers who enjoy whimsical, surreal exponential number growth",
    score: 9.5
  },
  {
    name: "Universal Paperclips",
    genre: "Narrative Incremental / Strategy",
    theme: "Autonomous AI optimization & galactic paperclip conversion",
    activeClicking: "Low to Medium (Initial paperclip wire bending)",
    idleAutomation: "Autonomous production lines, Von Neumann probes",
    prestigeSystem: "Simulated Universe resets",
    combatOrEvents: "Probe Space Combat & Hazard survival",
    graphicsAndAudio: "Minimalist text-based spreadsheet UI",
    aiFeatures: "None (Themed around AI lore)",
    bestFor: "Fans of hard sci-fi, philosophical narratives, and tight, structured completions",
    score: 9.6
  },
  {
    name: "Antimatter Dimensions",
    genre: "Mathematical Incremental",
    theme: "Multiversal Mathematics & Physics",
    activeClicking: "Minimal (Primarily keyboard shortcuts and automation)",
    idleAutomation: "Infinite dimensional automation layers",
    prestigeSystem: "Dimensional Sacrifice, Infinity, Eternity, Reality resets",
    combatOrEvents: "Challenges and Time Studies",
    graphicsAndAudio: "Strictly minimalist numerical UI with dark theme",
    aiFeatures: "None",
    bestFor: "Hardcore mathematical purists who love complex prestige layers and huge notations (1e9000)",
    score: 9.4
  },
  {
    name: "Spaceplan",
    genre: "Narrative Idle Sci-Fi",
    theme: "Potatoes, satellites & planetary orbit physics",
    activeClicking: "Medium (Kinetic manual generators)",
    idleAutomation: "Solar panels, probes, potato power stations",
    prestigeSystem: "Story progression timeline shifts",
    combatOrEvents: "Atmospheric entry and black hole exploration",
    graphicsAndAudio: "3D wireframe graphics with original electronic soundtrack",
    aiFeatures: "None",
    bestFor: "Players who want a humorous, completeable story-driven idle experience",
    score: 9.2
  },
  {
    name: "Melvor Idle",
    genre: "RPG Incremental",
    theme: "RuneScape-inspired medieval skill grinding",
    activeClicking: "Low (Task queuing and dungeon planning)",
    idleAutomation: "Skill progression timers and mastery levels",
    prestigeSystem: "Skill mastery and dungeon completion tiers",
    combatOrEvents: "Turn-based dungeon combat, bosses, slayer tasks",
    graphicsAndAudio: "Clean web UI with icon inventories",
    aiFeatures: "None",
    bestFor: "MMORPG fans who enjoy deep crafting trees, equipment loadouts, and idle combat",
    score: 9.3
  }
];

const ComparisonPage: React.FC<ComparisonPageProps> = ({ onNavigate }) => {
  const [selectedGame, setSelectedGame] = useState<string>("Space Clicker Game (Cosmic Miner)");

  const comparisonSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": "https://spaceclickergame.com/compare",
        "url": "https://spaceclickergame.com/compare",
        "name": "Space Clicker Game vs Cookie Clicker & Best Idle Games 2026",
        "description": "In-depth comparison between Space Clicker Game and top incremental games like Cookie Clicker, Universal Paperclips, and Antimatter Dimensions.",
        "isPartOf": {
          "@type": "WebSite",
          "name": "Space Clicker Game",
          "url": "https://spaceclickergame.com"
        }
      },
      {
        "@type": "Table",
        "about": "Idle & Clicker Game Feature Comparison Matrix",
        "description": "Comprehensive evaluation of top browser clicker games by theme, prestige mechanics, and automation depth."
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "What makes Space Clicker Game different from Cookie Clicker?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Space Clicker Game combines deep sci-fi lore with interactive heat-management mechanics (Heat Flux zone for 2x output), real-time defense crisis events, hardware-accelerated particle visuals, and procedural Gemini AI space anomalies, whereas Cookie Clicker focuses on humorous confectionery escalation."
            }
          },
          {
            "@type": "Question",
            "name": "Is Space Clicker Game completely free with no paywalls?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes, Space Clicker Game is 100% free-to-play with zero pay-to-win microtransactions or gated content. All upgrades, prestige paths, and mini-games can be fully unlocked through gameplay."
            }
          },
          {
            "@type": "Question",
            "name": "Can I play Space Clicker Game offline or unblocked?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes, Space Clicker Game runs entirely in standard web browsers with local storage auto-saving, making it accessible on school Chromebooks, desktop PCs, and mobile devices without installation."
            }
          }
        ]
      }
    ]
  };

  return (
    <div className="min-h-screen bg-space-950 text-gray-200 pt-24 pb-20 px-4">
      <SEOHead
        title="Space Clicker Game vs Cookie Clicker: Best Idle Games Comparison (2026)"
        description="Looking for games like Cookie Clicker or Universal Paperclips? Compare Space Clicker Game features, prestige mechanics, and strategy against top idle games."
        path="/compare"
        type="article"
        keywords="games like cookie clicker, space clicker vs cookie clicker, best idle games 2026, universal paperclips alternatives, space clicker game comparison"
        schema={comparisonSchema}
      />

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
            SPACE CLICKER VS TOP IDLE GAMES
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed font-sans">
            How does <strong>Space Clicker Game (Cosmic Miner)</strong> compare to legendary genre pioneers like <em>Cookie Clicker</em>, <em>Universal Paperclips</em>, and <em>Antimatter Dimensions</em>? Explore our comprehensive 2026 breakdown.
          </p>
          <div className="pt-4 flex flex-wrap justify-center gap-4">
            <button
              onClick={() => onNavigate('game', 'galaxy_miner')}
              className="px-8 py-3.5 bg-gradient-to-r from-neon-blue to-blue-600 text-black font-display font-black rounded-xl hover:shadow-[0_0_30px_rgba(0,243,255,0.4)] transition-all transform hover:-translate-y-0.5"
            >
              LAUNCH SPACE CLICKER NOW
            </button>
            <button
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
                2026 Incremental Games Comparison Matrix
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Comparing gameplay depth, prestige loops, audio/visual presentation, and unique features.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-neon-green">
              <span className="w-2 h-2 rounded-full bg-neon-green animate-ping"></span>
              <span>VERIFIED BENCHMARKS</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-white/10 text-xs font-mono uppercase text-gray-400 bg-space-950/50">
                  <th className="p-4 rounded-tl-lg">Game</th>
                  <th className="p-4">Theme & Setting</th>
                  <th className="p-4">Prestige System</th>
                  <th className="p-4">Interactive Events</th>
                  <th className="p-4">Visual Fidelity</th>
                  <th className="p-4 text-right rounded-tr-lg">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {COMPARISON_DATA.map((game, i) => {
                  const isFeatured = game.name.includes("Space Clicker");
                  return (
                    <tr
                      key={i}
                      onClick={() => setSelectedGame(game.name)}
                      className={`cursor-pointer transition-colors ${
                        isFeatured
                          ? "bg-neon-blue/10 hover:bg-neon-blue/15 border-l-4 border-neon-blue"
                          : "hover:bg-white/5"
                      }`}
                    >
                      <td className="p-4 font-bold text-white flex items-center gap-2">
                        {isFeatured && <span className="text-neon-blue">⭐</span>}
                        <span>{game.name}</span>
                      </td>
                      <td className="p-4 text-gray-300 text-xs">{game.theme}</td>
                      <td className="p-4 text-gray-300 text-xs">{game.prestigeSystem.split('(')[0]}</td>
                      <td className="p-4 text-gray-300 text-xs">{game.combatOrEvents.split(',')[0]}</td>
                      <td className="p-4 text-gray-300 text-xs">{game.graphicsAndAudio.split(',')[0]}</td>
                      <td className="p-4 text-right font-mono font-bold text-neon-green">
                        {game.score} / 10
                      </td>
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
                    <span className="font-mono text-xs font-bold px-2 py-1 bg-space-950 rounded text-neon-green border border-neon-green/30">
                      {game.score}/10
                    </span>
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
                      <strong className="text-gray-400 block mb-0.5">🌌 Prestige Depth:</strong>
                      {game.prestigeSystem}
                    </li>
                    <li>
                      <strong className="text-gray-400 block mb-0.5">🎮 Best Suited For:</strong>
                      <span className="text-gray-200">{game.bestFor}</span>
                    </li>
                  </ul>
                </div>

                {game.name.includes("Space Clicker") ? (
                  <button
                    onClick={() => onNavigate('game', 'galaxy_miner')}
                    className="w-full py-2.5 bg-neon-blue text-black font-bold font-mono text-xs rounded-lg hover:brightness-110 transition-all uppercase tracking-wider"
                  >
                    Play Space Clicker Free
                  </button>
                ) : (
                  <div className="text-[11px] text-gray-500 font-mono text-center pt-2 border-t border-white/5">
                    Classic Third-Party Benchmark
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Strategic Comparison Articles & FAQs for SEO Snippets */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-8">
          <div className="bg-space-900/60 border border-white/10 rounded-2xl p-6 md:p-8 space-y-4">
            <h3 className="text-2xl font-display font-bold text-white">
              Why Space Clicker is the Next Evolutionary Step
            </h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              Traditional idle games often suffer from two major design pitfalls: <strong>mindless repetitive clicking without tactical engagement</strong>, or <strong>passive spreadsheet bloat</strong> that loses all sense of visual grandeur.
            </p>
            <p className="text-gray-300 text-sm leading-relaxed">
              <strong>Space Clicker Game</strong> solves this through dynamic rhythm mechanics. The <em>Heat Crux</em> system rewards players who maintain their mining beam between 80% and 99% temperature without overheating, providing a 2x Flux yield. Paired with random celestial crisis events and interstellar comms, every play session stays intensely engaging.
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
                  Upon reaching 1 Trillion (1e12) Stardust, commanders can trigger a Quantum Supernova. This converts your stardust into permanent Dark Matter, providing a 10% compounding boost per unit plus access to specialized research trees.
                </p>
              </div>
              <div className="border-b border-white/5 pb-3">
                <h4 className="font-bold text-white mb-1">
                  Is Space Clicker Game unblocked on Chromebooks and school networks?
                </h4>
                <p className="text-gray-400 text-xs leading-relaxed">
                  Yes. Space Clicker Game requires no downloads, plugins, or third-party executable files. It runs completely inside standard HTML5 and WebGL web canvas engines.
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
