
import React, { useEffect, useMemo } from 'react';
import { GameMeta } from '../types';
import { BLOG_POSTS, INITIAL_UPGRADES, PLANETS } from '../constants';
import { formatNumber } from '../utils';

interface SEOContentProps {
  game: GameMeta;
}

const SEOContent: React.FC<SEOContentProps> = ({ game }) => {
  
  // Find related blog posts based on game tags
  const relatedGuides = useMemo(() => {
      const gameTagString = game.tags.join(' ').toLowerCase() + ' ' + game.title.toLowerCase();
      return BLOG_POSTS.filter(post => {
          // Check if any post tag partially matches game tag or title
          return post.tags.some(t => gameTagString.includes(t.toLowerCase()));
      }).slice(0, 3);
  }, [game]);

  // Inject Specific VideoGame Schema (More specific than SoftwareApplication)
  useEffect(() => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      
      const structuredData = {
          "@context": "https://schema.org",
          "@graph": [
              {
                  "@type": "BreadcrumbList",
                  "itemListElement": [
                      {
                          "@type": "ListItem",
                          "position": 1,
                          "name": "Home",
                          "item": "https://spaceclickergame.com"
                      },
                      {
                          "@type": "ListItem",
                          "position": 2,
                          "name": "Games",
                          "item": "https://spaceclickergame.com?view=game"
                      },
                      {
                          "@type": "ListItem",
                          "position": 3,
                          "name": game.title,
                          "item": `https://spaceclickergame.com?view=game&id=${game.id}`
                      }
                  ]
              },
              {
                  "@type": "VideoGame",
                  "name": game.title,
                  "description": game.description,
                  "genre": [game.tags[0], "Simulation", "Idle Game"],
                  "gamePlatform": "Web Browser",
                  "applicationCategory": "Game",
                  "playMode": "SinglePlayer",
                  "operatingSystem": "Any",
                  "offers": {
                      "@type": "Offer",
                      "price": "0",
                      "priceCurrency": "USD",
                      "availability": "https://schema.org/InStock"
                  },
                  "aggregateRating": {
                      "@type": "AggregateRating",
                      "ratingValue": "4.8",
                      "ratingCount": "1420",
                      "bestRating": "5",
                      "worstRating": "1"
                  },
                  "author": {
                      "@type": "Organization",
                      "name": "Void Expanse Games"
                  }
              },
              {
                  "@type": "FAQPage",
                  "mainEntity": [
                      {
                          "@type": "Question",
                          "name": `How do I play ${game.title}?`,
                          "acceptedAnswer": {
                              "@type": "Answer",
                              "text": `To play ${game.title}, start by clicking to mine initial resources. Purchase upgrades to automate your income. Follow the in-game mission briefing: "${game.briefing}".`
                          }
                      },
                      {
                          "@type": "Question",
                          "name": `Is ${game.title} free to play?`,
                          "acceptedAnswer": {
                              "@type": "Answer",
                              "text": `Yes, ${game.title} is completely free to play directly in your browser with no downloads required.`
                          }
                      },
                      {
                          "@type": "Question",
                          "name": "Does the game save my progress?",
                          "acceptedAnswer": {
                              "@type": "Answer",
                              "text": "Yes, your game progress is automatically saved to your browser's local storage every 10 seconds."
                          }
                      }
                  ]
              }
          ]
      };

      script.text = JSON.stringify(structuredData);
      document.head.appendChild(script);

      return () => {
          document.head.removeChild(script);
      };
  }, [game]);

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
                                  <td className="py-2 font-mono">+{formatNumber(u.baseProduction)}/s</td>
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
    <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
       
       {/* Left Column (Main Content) */}
       <div className="lg:col-span-8 space-y-12">
          <article className="prose prose-invert max-w-none">
             <h2 className="text-3xl font-display text-white mb-6 border-b border-white/10 pb-4">
                About {game.title}
             </h2>
             <p className="text-gray-300 leading-relaxed text-lg mb-6">
                {game.description} This game is a masterpiece of the incremental genre, designed for players who love seeing numbers go up while managing complex space industries.
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
                                 <a href={`?view=blog&post=${guide.slug}`} className="text-white hover:text-neon-green transition-colors font-bold underline decoration-neon-blue/50">
                                     📄 {guide.title}
                                 </a>
                             </li>
                         ))}
                     </ul>
                 </div>
             )}

             <h3 className="text-2xl font-display text-white mb-4 mt-12">Patch Notes</h3>
             <div className="space-y-2">
                {game.changelog.map((log, i) => (
                    <div key={i} className="text-sm text-gray-400 border-l-2 border-neon-green pl-4 py-1">
                        <span className="text-white font-bold mr-2">Update:</span> {log}
                    </div>
                ))}
             </div>
          </article>
       </div>

       {/* Right Sidebar */}
       <div className="lg:col-span-4 space-y-8">
          
          {/* Top Rated Widget */}
          <div className="bg-space-800/30 border border-white/10 rounded-xl p-6">
             <h3 className="font-display text-lg text-white mb-4 flex items-center gap-2">
                <span>🏆</span> TOP RATED GAMES
             </h3>
             <div className="space-y-4">
                {[1, 2, 3].map((n) => (
                    <a href={`?view=game&id=${n === 1 ? 'galaxy_miner' : n === 2 ? 'mars_colony' : 'star_defense'}`} key={n} className="flex items-center gap-3 group cursor-pointer block">
                        <div className="w-12 h-12 bg-space-700 rounded-lg flex items-center justify-center text-xl group-hover:bg-neon-blue group-hover:text-black transition-colors">
                            {n === 1 ? '⛏️' : n === 2 ? '🌱' : '🛡️'}
                        </div>
                        <div>
                            <div className="font-bold text-sm text-gray-200 group-hover:text-neon-blue">
                                {n === 1 ? 'Galaxy Miner' : n === 2 ? 'Mars Colony' : 'Star Defense'}
                            </div>
                            <div className="text-[10px] text-gray-500">
                                {n === 1 ? '4.9/5 (12k votes)' : '4.8/5 (8k votes)'}
                            </div>
                        </div>
                    </a>
                ))}
             </div>
          </div>

          {/* Tags */}
          <div>
             <h3 className="font-bold text-sm text-gray-500 mb-3">POPULAR TAGS</h3>
             <div className="flex flex-wrap gap-2">
                {['Space', 'Idle', 'Clicker', 'Strategy', 'Simulation', 'Unblocked', 'Free', 'Mining', 'Sci-Fi'].map(tag => (
                    <span key={tag} className="text-xs bg-space-800 border border-white/5 hover:border-white/20 text-gray-400 px-3 py-1 rounded-full cursor-pointer transition-colors">
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
