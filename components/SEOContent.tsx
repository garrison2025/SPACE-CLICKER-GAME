import React from 'react';
import { GameMeta } from '../types';

interface SEOContentProps {
  game: GameMeta;
}

const SEOContent: React.FC<SEOContentProps> = ({ game }) => {
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
                    <div key={n} className="flex items-center gap-3 group cursor-pointer">
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
                    </div>
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