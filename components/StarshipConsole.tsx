
import React, { useState } from 'react';
import { GameId, GameMeta } from '../types';
import { GAMES_CATALOG } from '../constants';
import { toggleMute, getMuteState } from '../services/audioService';
import { Logo } from './Logo';

interface StarshipConsoleProps {
  activeGame: GameId;
  onSwitchGame: (id: GameId) => void;
  onGoHome: () => void;
  children: React.ReactNode;
}

const StarshipConsole: React.FC<StarshipConsoleProps> = ({ activeGame, onSwitchGame, onGoHome, children }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [isMuted, setIsMuted] = useState(getMuteState());
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const handleMuteToggle = () => {
      const newState = !isMuted;
      setIsMuted(newState);
      toggleMute(newState);
  };

  const handleManualSave = () => {
      setSaveStatus('saving');
      // Dispatch event for games to listen to
      window.dispatchEvent(new Event('game-save-trigger'));
      
      setTimeout(() => {
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 2000);
      }, 500);
  };

  const handleFactoryReset = () => {
      if (window.confirm("WARNING: ALL DATA WILL BE PURGED.\n\nThis includes progress in Galaxy Miner, Mars Colony, and all other simulations.\n\nAre you sure?")) {
          localStorage.clear();
          window.location.reload();
      }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden flex flex-col bg-space-900 text-white font-sans selection:bg-neon-blue selection:text-black">
      
      {/* --- TOP HUD --- */}
      <header className="h-16 flex items-center justify-between px-6 border-b border-white/10 bg-space-900/90 backdrop-blur z-50 shrink-0">
         <div className="flex items-center gap-4">
            <div 
                className="flex items-center gap-2 group cursor-pointer hover:opacity-80 transition-opacity"
                onClick={onGoHome}
            >
               <Logo className="w-8 h-8" />
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
                onClick={() => setShowSettings(true)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white" 
                title="Settings"
            >
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543 .826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </button>
            <button 
                className="hidden md:block border border-neon-blue text-neon-blue px-3 py-1 rounded text-xs font-bold hover:bg-neon-blue hover:text-black transition-colors"
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

      {/* --- SETTINGS MODAL --- */}
      {showSettings && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
              <div className="bg-space-800 w-full max-w-md border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
                  <div className="p-6 border-b border-white/10 flex justify-between items-center bg-space-900">
                      <h2 className="font-display font-bold text-xl text-white tracking-widest">SYSTEM CONFIG</h2>
                      <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-white">✕</button>
                  </div>
                  
                  <div className="p-6 space-y-6">
                      
                      {/* Audio Setting */}
                      <div className="flex items-center justify-between">
                          <div>
                              <div className="font-bold text-white text-sm">AUDIO SYNTHESIS</div>
                              <div className="text-xs text-gray-500">Enable UI sound effects</div>
                          </div>
                          <button 
                            onClick={handleMuteToggle}
                            className={`w-12 h-6 rounded-full relative transition-colors ${!isMuted ? 'bg-neon-blue' : 'bg-gray-700'}`}
                          >
                              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${!isMuted ? 'left-7' : 'left-1'}`}></div>
                          </button>
                      </div>

                      {/* Manual Save */}
                      <div className="flex items-center justify-between border-t border-white/10 pt-6">
                          <div>
                              <div className="font-bold text-white text-sm">MANUAL OVERRIDE</div>
                              <div className="text-xs text-gray-500">Force save current state</div>
                          </div>
                          <button 
                            onClick={handleManualSave}
                            disabled={saveStatus !== 'idle'}
                            className={`px-4 py-2 rounded text-xs font-bold transition-all w-28 text-center
                                ${saveStatus === 'idle' ? 'bg-neon-blue text-black hover:bg-white' : 
                                  saveStatus === 'saving' ? 'bg-yellow-500 text-black' : 'bg-green-500 text-white'}
                            `}
                          >
                              {saveStatus === 'idle' ? 'FORCE SAVE' : saveStatus === 'saving' ? 'SAVING...' : 'SAVED ✓'}
                          </button>
                      </div>

                      {/* Reset Data */}
                      <div className="border-t border-white/10 pt-6">
                          <div className="font-bold text-red-400 text-sm mb-2">DANGER ZONE</div>
                          <p className="text-xs text-gray-500 mb-4">Resetting will purge all local saves for all games. This action cannot be undone.</p>
                          <button 
                            onClick={handleFactoryReset}
                            className="w-full py-3 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-bold rounded transition-colors text-xs tracking-widest"
                          >
                              FACTORY RESET PROTOCOL
                          </button>
                      </div>

                      <div className="text-center text-[10px] text-gray-600 font-mono pt-4">
                          BUILD VERSION: 3.0.2 (PATCHED)
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 relative flex overflow-hidden">
         
         {/* Side HUD (Left) */}
         <aside className="hidden lg:flex w-16 hover:w-64 transition-all duration-300 border-r border-white/5 bg-black/20 backdrop-blur flex-col z-40 group shrink-0">
             <div className="flex-1 py-8 flex flex-col gap-6 items-center group-hover:items-stretch group-hover:px-4">
                 <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest text-center group-hover:text-left mb-2 group-hover:mb-0 transition-all">Mission Log</div>
                 
                 {/* Fake Achievements */}
                 {[
                     { id: 1, title: 'Asteroid Cracker', game: 'Galaxy Miner', done: true },
                     { id: 2, title: 'First Breath', game: 'Mars Colony', done: false },
                     { id: 3, title: 'Fleet Admiral', game: 'Star Defense', done: false }
                 ].map(ach => (
                     <div key={ach.id} className="flex items-center gap-3 opacity-50 hover:opacity-100 transition-opacity cursor-help" title={ach.title}>
                         <div className={`w-2 h-2 rounded-full flex-shrink-0 ${ach.done ? 'bg-neon-green shadow-[0_0_5px_lime]' : 'bg-gray-600'}`}></div>
                         <div className="hidden group-hover:block whitespace-nowrap text-xs text-gray-300">
                             <div className="font-bold">{ach.title}</div>
                             <div className="text-[10px] text-gray-500">{ach.game}</div>
                         </div>
                     </div>
                 ))}
             </div>
             
             <div className="p-4 border-t border-white/5">
                 <div className="hidden group-hover:block text-[10px] text-gray-600 text-center">
                     CONNECTED TO <br/> GALACTIC NET
                 </div>
                 <div className="group-hover:hidden text-center text-gray-700">📶</div>
             </div>
         </aside>

         {/* Center Viewport - SCROLLABLE FOR SEO CONTENT */}
         <div className="flex-1 relative bg-black/40 shadow-inner overflow-y-auto custom-scrollbar scroll-smooth">
             {/* Scanlines Effect */}
             <div className="absolute inset-0 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay z-[5] fixed"></div>
             <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-black/30 z-[5] fixed"></div>
             
             {children}
         </div>

      </main>

      {/* --- BOTTOM DOCK --- */}
      <footer className="h-24 flex justify-center items-end pb-4 bg-gradient-to-t from-black via-space-900/90 to-transparent z-50 pointer-events-none absolute bottom-0 left-0 right-0">
          <div className="pointer-events-auto flex items-end gap-2 p-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl transform translate-y-2 hover:translate-y-0 transition-transform duration-300">
              {GAMES_CATALOG.map(game => (
                  <button
                    key={game.id}
                    onClick={() => onSwitchGame(game.id)}
                    className={`group relative w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center text-2xl transition-all duration-200 hover:-translate-y-4 hover:scale-110
                        ${activeGame === game.id 
                            ? 'bg-gradient-to-br from-neon-blue to-blue-600 text-white shadow-[0_0_20px_rgba(0,243,255,0.5)] scale-110 -translate-y-2' 
                            : 'bg-space-800 text-gray-400 hover:bg-space-700 hover:text-white'
                        }
                    `}
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
                  </button>
              ))}
          </div>
      </footer>

    </div>
  );
};

export default StarshipConsole;
