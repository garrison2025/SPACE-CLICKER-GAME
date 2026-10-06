
import React, { useMemo } from 'react';
import { GameMeta } from '../types';
import { INITIAL_UPGRADES } from '../constants';
import { BLOG_POST_META } from '../content/blogMeta';
import { formatNumber } from '../utils';

interface SEOContentProps {
  game: GameMeta;
}

const SEOContent: React.FC<SEOContentProps> = ({ game }) => {
  
  // Keep internal links deterministic and relevant without loading full article bodies.
  const relatedGuides = useMemo(() => {
      const guideMap: Record<GameMeta['id'], string[]> = {
          galaxy_miner: [
              'strategy-guide-clicker-game-space-empire',
              'evolution-of-space-clicker-game-genre',
              'active-vs-passive-space-click-game-styles'
          ],
          mars_colony: [
              'strategy-guide-clicker-game-space-empire',
              'educational-value-of-space-clicker-games',
              'narrative-design-clicker-game-space-adventure'
          ],
          star_defense: [
              'active-vs-passive-space-click-game-styles',
              'narrative-design-clicker-game-space-adventure',
              'evolution-of-space-clicker-game-genre'
          ],
          merge_ships: [
              'evolution-of-space-clicker-game-genre',
              'educational-value-of-space-clicker-games',
              'active-vs-passive-space-click-game-styles'
          ],
          gravity_idle: [
              'educational-value-of-space-clicker-games',
              'narrative-design-clicker-game-space-adventure',
              'evolution-of-space-clicker-game-genre'
          ],
          deep_signal: [
              'narrative-design-clicker-game-space-adventure',
              'psychology-of-space-clicking-games',
              'evolution-of-space-clicker-game-genre'
          ]
      };
      const wanted = guideMap[game.id] || [];
      return wanted
          .map(slug => BLOG_POST_META.find(post => post.slug === slug))
          .filter((post): post is NonNullable<typeof post> => Boolean(post));
  }, [game.id]);

  // Helper to render wiki tables based on game ID
  const renderWikiTable = () => {
      if (game.id === 'galaxy_miner') {
          return (
              <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-400 border-collapse">
                      <thead>
                          <tr className="border-b border-white/10 text-white font-display">
                              <th className="py-2">Unit Name</th>
                              <th className="py-2">Type</th>
                              <th className="py-2">Base Cost (SD)</th>
                              <th className="py-2">Base Output</th>
                          </tr>
                      </thead>
                      <tbody>
                          {INITIAL_UPGRADES.map(u => (
                              <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                  <td className="py-2 font-bold text-neon-blue">{u.name}</td>
                                  <td className="py-2">{u.type === 'manual' ? 'Click' : 'Automation'}</td>
                                  <td className="py-2 font-mono">{formatNumber(u.baseCost)}</td>
                                  <td className="py-2 font-mono">
                                      +{formatNumber(u.baseProduction)}{u.type === 'manual' ? '/click' : '/s'}
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
                  <p className="text-xs text-gray-600 mt-2 italic">*Values scale exponentially with each purchase.</p>
              </div>
          );
      }
      return null;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 pt-12 pb-28 md:pb-32 grid grid-cols-1 lg:grid-cols-12 gap-12">
       
       {/* Left Column (Main Content) */}
       <div className="lg:col-span-8 space-y-12">
          <article className="prose prose-invert max-w-none">
             <h2 className="text-3xl font-display text-white mb-6 border-b border-white/10 pb-4">
                About {game.title}
             </h2>
             <p className="text-gray-300 leading-relaxed text-lg mb-6">
                {game.description} The simulation runs directly in the browser and exposes its core objectives through the mission briefing and in-game upgrade systems below.
             </p>
             <div className="bg-space-800/50 p-6 rounded-lg border border-white/5 mb-8">
                <h3 className="text-neon-blue font-bold text-lg mb-3">Mission Briefing</h3>
                <p className="text-gray-400 italic font-mono text-sm leading-relaxed">
                   "{game.briefing}"
                </p>
             </div>
             
             <h3 className="text-2xl font-display text-white mb-4 mt-12">How to Play</h3>
             <ul className="space-y-4">
                {game.manual.split('\n').map((step, i) => (
                    <li key={i} className="flex items-start gap-4 bg-space-900 p-4 rounded border border-white/5">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-neon-blue/20 text-neon-blue flex items-center justify-center font-bold text-xs">{i+1}</span>
                        <span className="text-gray-300 text-sm">{step.replace(/^\d+\.\s/, '')}</span>
                    </li>
                ))}
             </ul>

             {/* Dynamic Wiki Table for SEO Long-tail Keywords */}
             {game.id === 'galaxy_miner' && (
                 <div className="mt-12">
                     <h3 className="text-2xl font-display text-white mb-4">Unit Database & Statistics</h3>
                     <div className="bg-space-900 rounded-xl border border-white/10 p-6">
                         {renderWikiTable()}
                     </div>
                 </div>
             )}

             {/* SEO: Internal Linking to Strategy Guides */}
             {relatedGuides.length > 0 && (
                 <div className="mt-12 bg-neon-blue/5 border border-neon-blue/20 p-6 rounded-xl">
                     <h3 className="text-xl font-display font-bold text-neon-blue mb-4">TACTICAL ANALYSIS</h3>
                     <p className="text-sm text-gray-400 mb-4">Related intelligence reports found in the database:</p>
                     <ul className="space-y-2">
                         {relatedGuides.map(guide => (
                             <li key={guide.id}>
                                 <a href={`/blog/${guide.slug}/`} className="text-white hover:text-neon-green transition-colors font-bold underline decoration-neon-blue/50">
                                     📄 {guide.title}
                                 </a>
                             </li>
                         ))}
                     </ul>
                 </div>
             )}

             <h3 className="text-2xl font-display text-white mb-4 mt-12">Current Systems</h3>
             <div className="space-y-2">
                {game.changelog.map((log, i) => (
                    <div key={i} className="text-sm text-gray-400 border-l-2 border-neon-green pl-4 py-1">
                        <span className="text-white font-bold mr-2">Status:</span> {log}
                    </div>
                ))}
             </div>
          </article>
       </div>

       {/* Right Sidebar */}
       <div className="lg:col-span-4 space-y-8">
          
          {/* Featured games */}
          <div className="bg-space-800/30 border border-white/10 rounded-xl p-6">
             <h3 className="font-display text-lg text-white mb-4 flex items-center gap-2">
                <span>✦</span> FEATURED GAMES
             </h3>
             <div className="space-y-4">
                {[
                    { id: 'galaxy_miner', icon: '⛏️', title: 'Galaxy Miner', detail: 'Mining & prestige' },
                    { id: 'mars_colony', icon: '🌱', title: 'Mars Colony', detail: 'Resource management' },
                    { id: 'star_defense', icon: '🛡️', title: 'Star Defense', detail: 'Defense clicker' }
                ].map((item) => (
                    <a href={`/game/${item.id}/`} key={item.id} className="flex items-center gap-3 group block">
                        <div className="w-12 h-12 bg-space-700 rounded-lg flex items-center justify-center text-xl group-hover:bg-neon-blue group-hover:text-black transition-colors">
                            {item.icon}
                        </div>
                        <div>
                            <div className="font-bold text-sm text-gray-200 group-hover:text-neon-blue">{item.title}</div>
                            <div className="text-[10px] text-gray-500">{item.detail}</div>
                        </div>
                    </a>
                ))}
             </div>
          </div>

          {/* Tags */}
          <div>
             <h3 className="font-bold text-sm text-gray-500 mb-3">POPULAR TAGS</h3>
             <div className="flex flex-wrap gap-2">
                {['Space', 'Idle', 'Clicker', 'Strategy', 'Simulation', 'Free', 'Mining', 'Sci-Fi'].map(tag => (
                    <span key={tag} className="text-xs bg-space-800 border border-white/5 text-gray-400 px-3 py-1 rounded-full">
                        #{tag}
                    </span>
                ))}
             </div>
          </div>

       </div>
    </div>
  );
};

export default SEOContent;
