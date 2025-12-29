import React from 'react';
import { GameMeta } from '../types';

interface GameInfoPageProps {
  game: GameMeta;
  onLaunch?: () => void;
  isPlayable?: boolean;
}

const GameInfoPage: React.FC<GameInfoPageProps> = ({ game, onLaunch, isPlayable = false }) => {
  return (
    <div className="w-full h-full overflow-y-auto custom-scrollbar p-8 pb-32">
       <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom duration-700">
          
          {/* Header */}
          <div className={`p-8 rounded-2xl border border-white/10 bg-gradient-to-br ${game.color} bg-opacity-10 relative overflow-hidden mb-12`}>
             <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
             
             <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
                <div className="w-24 h-24 rounded-2xl bg-black/30 border border-white/20 flex items-center justify-center text-6xl shadow-xl">
                   {game.icon}
                </div>
                <div className="flex-1">
                   <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-4xl md:text-5xl font-display font-black text-white">{game.title}</h1>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${isPlayable ? 'border-neon-green text-neon-green' : 'border-yellow-500 text-yellow-500'}`}>
                         {game.status}
                      </span>
                   </div>
                   <p className="text-xl text-gray-200 font-light">{game.subtitle}</p>
                </div>
                
                {onLaunch && (
                    <button 
                        onClick={onLaunch}
                        disabled={!isPlayable}
                        className={`px-8 py-4 rounded font-display font-bold text-lg tracking-widest shadow-lg transition-all
                            ${isPlayable 
                                ? 'bg-white text-black hover:scale-105 hover:bg-neon-blue' 
                                : 'bg-white/10 text-gray-400 cursor-not-allowed'}
                        `}
                    >
                        {isPlayable ? 'INITIALIZE' : 'CONSTRUCTION'}
                    </button>
                )}
             </div>
          </div>

          {/* Grid Content */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             
             {/* Left Column: Briefing & Manual */}
             <div className="md:col-span-2 space-y-8">
                <section>
                   <h2 className="text-neon-blue font-display text-lg mb-4 flex items-center gap-2">
                      <span className="w-1 h-4 bg-neon-blue"></span>
                      MISSION BRIEFING
                   </h2>
                   <div className="bg-space-800/50 border border-white/5 p-6 rounded-lg text-gray-300 leading-relaxed font-sans text-lg">
                      {game.briefing}
                   </div>
                </section>

                <section>
                   <h2 className="text-neon-blue font-display text-lg mb-4 flex items-center gap-2">
                      <span className="w-1 h-4 bg-neon-blue"></span>
                      OPERATIONAL MANUAL
                   </h2>
                   <div className="bg-space-800/50 border border-white/5 p-6 rounded-lg text-gray-400 font-mono text-sm whitespace-pre-wrap">
                      {game.manual}
                   </div>
                </section>
             </div>

             {/* Right Column: Stats & Logs */}
             <div className="space-y-8">
                <section>
                   <h2 className="text-gray-500 font-display text-sm mb-4">SHIP LOG</h2>
                   <div className="bg-black/40 border border-white/5 rounded-lg p-4">
                      <ul className="space-y-3">
                         {game.changelog.map((log, i) => (
                             <li key={i} className="text-xs text-gray-400 border-b border-white/5 pb-2 last:border-0">
                                <span className="text-neon-green mr-2">➜</span> {log}
                             </li>
                         ))}
                      </ul>
                   </div>
                </section>

                <section>
                   <h2 className="text-gray-500 font-display text-sm mb-4">TAGS</h2>
                   <div className="flex flex-wrap gap-2">
                      {game.tags.map(tag => (
                          <span key={tag} className="text-xs bg-white/5 hover:bg-white/10 px-3 py-1 rounded text-gray-400 transition-colors cursor-default">
                              #{tag}
                          </span>
                      ))}
                   </div>
                </section>
             </div>
          </div>

       </div>
    </div>
  );
};

export default GameInfoPage;