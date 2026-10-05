import React from 'react';
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
  goodFitFor: string;
}

const COMPARISON_DATA: GameComparison[] = [
  {
    name: "Space Clicker Game (Galaxy Miner)",
    genre: "Sci-Fi Idle / Clicker",
    theme: "Interstellar Mining & Planetary Colonization",
    activeClicking: "High (Heat Management, Critical Flux 80-99% bonus, Golden Comets)",
    idleAutomation: "Extensive (Mining Drones, Orbital Stations, Dyson Swarm)",
    prestigeSystem: "Galactic Reset (Dark Matter permanent multiplier + Tech Tree)",
    combatOrEvents: "Crisis events, Golden Comets, local procedural anomaly scans",
    graphicsAndAudio: "Canvas starfield, particle effects, synthwave ambience",
    goodFitFor: "Players seeking modern visuals, deep sci-fi themes, and active/passive hybrid strategy",
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
    goodFitFor: "Nostalgic gamers who enjoy whimsical, surreal exponential number growth",
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
    goodFitFor: "Fans of hard sci-fi, philosophical narratives, and tight, structured completions",
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
    goodFitFor: "Hardcore mathematical purists who love complex prestige layers and huge notations (1e9000)",
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
    goodFitFor: "Players who want a humorous, completeable story-driven idle experience",
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
    goodFitFor: "MMORPG fans who enjoy deep crafting trees, equipment loadouts, and idle combat",
  }
];

const ComparisonPage: React.FC<ComparisonPageProps> = ({ onNavigate }) => {
  const comparisonSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": "https://spaceclickergame.com/compare/#webpage",
        "url": "https://spaceclickergame.com/compare/",
        "name": "Space Clicker Game vs Classic Incremental Games: Feature Comparison",
        "description": "Compare gameplay structure, automation, prestige, events, and presentation across Space Clicker Game and several well-known incremental games.",
        "dateModified": "2026-10-05",
        "isPartOf": {
          "@type": "WebSite",
          "@id": "https://spaceclickergame.com/#website",
          "name": "Space Clicker Game",
          "url": "https://spaceclickergame.com/"
        }
      },
      {
        "@type": "ItemList",
        "@id": "https://spaceclickergame.com/compare/#games",
        "name": "Incremental games in the feature comparison",
        "itemListElement": COMPARISON_DATA.map((game, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "name": game.name
        }))
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://spaceclickergame.com/compare/#breadcrumb",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Space Clicker Game", "item": "https://spaceclickergame.com/" },
          { "@type": "ListItem", "position": 2, "name": "Feature Comparison", "item": "https://spaceclickergame.com/compare/" }
        ]
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "What makes Space Clicker Game different from Cookie Clicker?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Galaxy Miner uses a sci-fi mining theme, a Heat Flux zone, crisis events, Golden Comets, local procedural anomaly scans, automation, and Dark Matter resets. Cookie Clicker uses a baking theme with Golden Cookies, building automation, seasonal systems, and ascension."
            }
          },
          {
            "@type": "Question",
            "name": "Is Space Clicker Game free to play?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "The current browser simulations and Spacebar tools can be played without a paid account or paid upgrade purchase."
            }
          },
          {
            "@type": "Question",
            "name": "Does Space Clicker Game require installation?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "No installation is required for the browser games. Access can still be limited by school, workplace, parental-control, firewall, or network-administrator policies."
            }
          }
        ]
      }
    ]
  };

  return (
    <div className="min-h-screen bg-space-950 text-gray-200 pt-24 pb-20 px-4">
      <SEOHead
        title="Space Clicker Game vs Classic Incremental Games: Feature Comparison"
        description="Compare gameplay structure, automation, prestige, events, and presentation across Space Clicker Game and several well-known incremental games."
        path="/compare"
        type="website"
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
            SPACE CLICKER FEATURE COMPARISON
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed font-sans">
            Compare the mechanics of <strong>Galaxy Miner</strong> with well-known incremental games such as <em>Cookie Clicker</em>, <em>Universal Paperclips</em>, and <em>Antimatter Dimensions</em>. This is a feature snapshot, not a scored ranking.
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
                  <th className="p-4">Prestige System</th>
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
                      <td className="p-4 text-gray-300 text-xs">{game.prestigeSystem.split('(')[0]}</td>
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
                      <strong className="text-gray-400 block mb-0.5">🌌 Prestige Depth:</strong>
                      {game.prestigeSystem}
                    </li>
                    <li>
                      <strong className="text-gray-400 block mb-0.5">🎮 Good Fit For:</strong>
                      <span className="text-gray-200">{game.goodFitFor}</span>
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
                    Third-party reference
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
