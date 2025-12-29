
import React, { useEffect, useState } from 'react';
import { GameId } from '../types';
import { GAMES_CATALOG, ACHIEVEMENTS } from '../constants';
import { getAllGameSaves } from '../utils';

interface StarshipConsoleProps {
  activeGame: GameId;
  onSwitchGame: (id: GameId) => void;
  children: React.ReactNode;
  onOpenSettings: () => void;
}

const StarshipConsole: React.FC<StarshipConsoleProps> = ({ activeGame, onSwitchGame, children, onOpenSettings }) => {
  const [unlockedIds, setUnlockedIds] = useState<string[]>([]);
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [nextLevelXp, setNextLevelXp] = useState(100);

  // SEO: Determine active game meta for H1
  const currentGameMeta = GAMES_CATALOG.find(g => g.id === activeGame);

  // Poll for achievements
  useEffect(() => {
      const check = () => {
          const saves = getAllGameSaves();
          const unlocked: string[] = [];
          let totalXp = 0;

          ACHIEVEMENTS.forEach(ach => {
              if (ach.condition(saves)) {
                  unlocked.push(ach.id);
                  totalXp += ach.xp;
              }
          });

          setUnlockedIds(unlocked);
          setXp(totalXp);
          
          // Simple leveling curve: Level = 1 + floor(TotalXP / 100)
          // Adjust for scaling if needed
          const lvl = 1 + Math.floor(totalXp / 100);
          setLevel(lvl);
          setNextLevelXp(lvl * 100);
      };

      check();
      // Poll every 2 seconds to keep sidebar fresh without being too heavy
      const interval = setInterval(check, 2000);
      return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden flex flex-col bg-space-900 text-white font-sans selection:bg-neon-blue selection:text-black">
      
      {/* SEO H1 (Visually Hidden) */}
      {currentGameMeta && (
          <h1 className="sr-only">
              {currentGameMeta.title} - {currentGameMeta.subtitle} | Space Clicker Game
          </h1>
      )}

      {/* --- TOP HUD --- */}
      <header className="h-16 flex items-center justify-between px-6 border-b border-white/10 bg-space-900/90 backdrop-blur z-50">
         <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 group cursor-pointer">
               <div className="w-8 h-8 rounded bg-gradient-to-br from-neon-blue to-blue-600 flex items-center justify-center font-black text-black text-xs shadow-[0_0_15px_rgba(0,243,255,0.4)] group-hover:shadow-[0_0_25px_rgba(0,243,255,0.6)] transition-shadow">
                  SC
               </div>
               <div className="flex flex-col">
                  <span className="font-display font-bold text-lg tracking-widest leading-none">SPACE CLICKER GAME</span>
                  <span className="text-[10px] text-neon-blue font-mono tracking-wider">CONSOLE V.3.0.1</span>
               </div>
            </div>
            
            <div className="h-8 w-px bg-white/10 mx-2"></div>
            
            <div className="hidden md:flex items-center gap-2 text-xs text-gray-400 font-mono">
               <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
               <span>ONLINE PLAYERS: {Math.floor(Math.random() * 500 + 1200).toLocaleString()}</span>
            </div>
         </div>

         <div className="flex items-center gap-4">
            <button 
                onClick={onOpenSettings}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white" 
                title="Settings"
                aria-label="Open Settings Menu"
            >
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543 .826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </button>
            <button 
                className="hidden md:block border border-neon-blue text-neon-blue px-3 py-1 rounded text-xs font-bold hover:bg-neon-blue hover:text-black transition-colors"
                aria-label="Toggle Fullscreen Mode"
                onClick={() => {
                    if (!document.fullscreenElement) {
                        document.documentElement.requestFullscreen();
                    } else {
                        document.exitFullscreen();
                    }
                }}
            >
               FULLSCREEN
            </button>
         </div>
      </header>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 relative overflow-hidden flex">
         
         {/* Side HUD (Left) */}
         <aside className="hidden lg:flex w-16 hover:w-64 transition-all duration-300 border-r border-white/5 bg-black/20 backdrop-blur flex-col z-40 group" aria-label="Player Stats and Achievements">
             
             {/* COMMANDER PROFILE */}
             <div className="p-4 border-b border-white/5 group-hover:block hidden opacity-0 group-hover:opacity-100 transition-opacity delay-100">
                 <div className="flex items-center gap-3 mb-2">
                     <div className="w-10 h-10 rounded-full bg-gradient-to-r from-neon-blue to-purple-500 flex items-center justify-center font-bold text-black border border-white">
                         {level}
                     </div>
                     <div>
                         <div className="text-xs text-gray-400 uppercase tracking-wider">COMMANDER</div>
                         <div className="text-sm font-bold text-white">Level {level}</div>
                     </div>
                 </div>
                 <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden" role="progressbar" aria-valuenow={xp} aria-valuemax={nextLevelXp}>
                     <div className="h-full bg-neon-green" style={{ width: `${Math.min(100, (xp / nextLevelXp) * 100)}%` }}></div>
                 </div>
                 <div className="text-[9px] text-right text-gray-500 mt-1">{xp} / {nextLevelXp} XP</div>
             </div>

             <div className="flex-1 py-4 flex flex-col gap-2 overflow-y-auto custom-scrollbar group-hover:px-4 items-center group-hover:items-stretch">
                 <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest text-center group-hover:text-left mb-2 transition-all">
                     <span className="hidden group-hover:inline">ACHIEVEMENTS</span>
                     <span className="group-hover:hidden">★</span>
                 </div>
                 
                 {/* Real Achievements List */}
                 {ACHIEVEMENTS.map(ach => {
                     const isUnlocked = unlockedIds.includes(ach.id);
                     return (
                         <div 
                            key={ach.id} 
                            className={`flex items-center gap-3 p-2 rounded transition-all cursor-help
                                ${isUnlocked ? 'bg-white/5 border border-neon-blue/30 text-white' : 'opacity-40 grayscale'}
                            `}
                            title={ach.description}
                            role="status"
                            aria-label={`${ach.title}: ${isUnlocked ? 'Unlocked' : 'Locked'}`}
                         >
                             <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isUnlocked ? 'bg-neon-green shadow-[0_0_5px_lime]' : 'bg-gray-600'}`}></div>
                             <div className="hidden group-hover:block w-full">
                                 <div className="flex justify-between items-center">
                                     <div className="text-xs font-bold truncate">{ach.title}</div>
                                     <div className="text-[9px] font-mono text-neon-blue">+{ach.xp}xp</div>
                                 </div>
                                 <div className="text-[9px] text-gray-500 truncate">{GAMES_CATALOG.find(g => g.id === ach.gameId)?.title}</div>
                             </div>
                         </div>
                     );
                 })}
             </div>
             
             <div className="p-4 border-t border-white/5">
                 <div className="hidden group-hover:block text-[10px] text-gray-600 text-center">
                     CONNECTED TO <br/> VOID NETWORK
                 </div>
                 <div className="group-hover:hidden text-center text-gray-700">📶</div>
             </div>
         </aside>

         {/* Center Viewport */}
         <div className="flex-1 relative bg-black/40 shadow-inner">
             {/* Scanlines Effect */}
             <div className="absolute inset-0 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay z-[5]"></div>
             <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-black/30 z-[5]"></div>
             
             {children}
         </div>

      </main>

      {/* --- BOTTOM DOCK --- */}
      <footer className="h-24 flex justify-center items-end pb-4 bg-gradient-to-t from-black via-space-900/90 to-transparent z-50 pointer-events-none">
          <div className="pointer-events-auto flex items-end gap-2 p-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl transform translate-y-2 hover:translate-y-0 transition-transform duration-300">
              {GAMES_CATALOG.map(game => (
                  <a
                    key={game.id}
                    href={`/?game=${game.id}`}
                    onClick={(e) => { e.preventDefault(); onSwitchGame(game.id); }}
                    className={`group relative w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center text-2xl transition-all duration-200 hover:-translate-y-4 hover:scale-110 no-underline
                        ${activeGame === game.id 
                            ? 'bg-gradient-to-br from-neon-blue to-blue-600 text-white shadow-[0_0_20px_rgba(0,243,255,0.5)] scale-110 -translate-y-2' 
                            : 'bg-space-800 text-gray-400 hover:bg-space-700 hover:text-white'
                        }
                    `}
                    aria-label={`Switch to ${game.title}`}
                    role="button"
                  >
                      {game.icon}
                      
                      {/* Tooltip */}
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] font-bold px-2 py-1 rounded border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                          {game.title}
                      </div>

                      {/* Active Indicator */}
                      {activeGame === game.id && (
                          <div className="absolute -bottom-2 w-1 h-1 bg-white rounded-full shadow-[0_0_5px_white]"></div>
                      )}
                  </a>
              ))}
          </div>
      </footer>

    </div>
  );
};

export default StarshipConsole;
