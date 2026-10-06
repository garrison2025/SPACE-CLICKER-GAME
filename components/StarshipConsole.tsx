
import React, { useEffect, useRef, useState } from 'react';
import { GameId, GameMeta } from '../types';
import { GAMES_CATALOG } from '../constants';
import { toggleMute, getMuteState } from '../services/audioService';
import { clearProjectStorage } from '../utils/projectStorage';
import { trapDialogFocus } from '../utils/dialogFocus';
import { Logo } from './Logo';

interface StarshipConsoleProps {
  activeGame: GameId;
  onSwitchGame: (id: GameId) => void;
  onGoHome: () => void;
  onOpenStats?: () => void;
  onManualSave?: () => boolean;
  children: React.ReactNode;
}

const StarshipConsole: React.FC<StarshipConsoleProps> = ({ activeGame, onSwitchGame, onGoHome, onOpenStats, onManualSave, children }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [isMuted, setIsMuted] = useState(getMuteState());
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [systemStatus, setSystemStatus] = useState('');
  const dockScrollRef = useRef<HTMLElement | null>(null);
  const settingsButtonRef = useRef<HTMLButtonElement | null>(null);
  const settingsDialogRef = useRef<HTMLDivElement | null>(null);
  const saveTimersRef = useRef<number[]>([]);
  const activeDockButtonRef = useRef<HTMLButtonElement | null>(null);
  const activeGameMeta = GAMES_CATALOG.find((game) => game.id === activeGame);

  useEffect(() => {
      if (window.innerWidth >= 640) return;
      const scroller = dockScrollRef.current;
      const button = activeDockButtonRef.current;
      if (!scroller || !button) return;

      const targetLeft = button.offsetLeft - (scroller.clientWidth - button.offsetWidth) / 2;
      const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
      scroller.scrollTo({
          left: Math.max(0, targetLeft),
          behavior: reduceMotion ? 'auto' : 'smooth'
      });
  }, [activeGame]);

  useEffect(() => {
      if (!showSettings) return;

      settingsDialogRef.current?.focus();

      const handleKeyDown = (event: KeyboardEvent) => {
          if (event.key === 'Escape') setShowSettings(false);
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => {
          window.removeEventListener('keydown', handleKeyDown);
          settingsButtonRef.current?.focus();
      };
  }, [showSettings]);

  useEffect(() => {
      const handleFullscreenChange = () => {
          setIsFullscreen(Boolean(document.fullscreenElement));
      };

      document.addEventListener('fullscreenchange', handleFullscreenChange);
      handleFullscreenChange();

      return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
      return () => {
          saveTimersRef.current.forEach((timer) => window.clearTimeout(timer));
          saveTimersRef.current = [];
      };
  }, []);

  const handleMuteToggle = () => {
      const newState = !isMuted;
      setIsMuted(newState);
      toggleMute(newState);
  };

  const handleFullscreenToggle = async () => {
      setSystemStatus('');

      try {
          if (document.fullscreenElement) {
              if (!document.exitFullscreen) {
                  setSystemStatus('Exiting fullscreen is not supported in this browser.');
                  return;
              }
              await document.exitFullscreen();
              setSystemStatus('Fullscreen exited.');
              return;
          }

          if (!document.documentElement.requestFullscreen) {
              setSystemStatus('Fullscreen is not supported in this browser.');
              return;
          }

          await document.documentElement.requestFullscreen();
          setSystemStatus('Fullscreen enabled.');
      } catch {
          setSystemStatus('Fullscreen request was blocked by the browser.');
      }
  };

  const handleManualSave = () => {
      if (!onManualSave) return;

      saveTimersRef.current.forEach((timer) => window.clearTimeout(timer));
      saveTimersRef.current = [];

      setSaveStatus('saving');
      const persisted = onManualSave();

      const resultTimer = window.setTimeout(() => {
          setSaveStatus(persisted ? 'saved' : 'failed');
          const idleTimer = window.setTimeout(() => {
              setSaveStatus('idle');
              saveTimersRef.current = saveTimersRef.current.filter((timer) => timer !== idleTimer);
          }, 2000);
          saveTimersRef.current.push(idleTimer);
          saveTimersRef.current = saveTimersRef.current.filter((timer) => timer !== resultTimer);
      }, 300);

      saveTimersRef.current.push(resultTimer);
  };

  const handleFactoryReset = () => {
      if (window.confirm("WARNING: SPACE CLICKER GAME DATA WILL BE PURGED.\n\nThis removes game progress, Spacebar records, and site game settings stored by SpaceClickerGame.com in this browser. Other localStorage keys on the origin are left untouched.\n\nAre you sure?")) {
          const result = clearProjectStorage();
          if (!result.success) {
              window.alert("The reset could not access or clear browser storage. Your local saves may still exist.");
              return;
          }
          window.location.reload();
      }
  };

  return (
    <div className="relative w-full h-[100dvh] min-h-0 overflow-hidden flex flex-col bg-space-900 text-white font-sans selection:bg-neon-blue selection:text-black">
      <a
        href="#game-main-content"
        className="fixed left-3 top-3 z-[200] -translate-y-24 rounded-lg bg-neon-blue px-4 py-3 font-bold text-black shadow-xl transition-transform focus:translate-y-0"
      >
        Skip to game content
      </a>
      
      {/* --- TOP HUD --- */}
      <header className="game-console-header flex items-center justify-between px-3 sm:px-4 md:px-6 border-b border-white/10 bg-space-900 md:bg-space-900/90 md:backdrop-blur z-50 shrink-0">
         <div className="flex items-center gap-4">
            <button
                type="button"
                aria-label="Return to Space Clicker Game home"
                className="min-w-11 min-h-11 flex items-center gap-2 group cursor-pointer hover:opacity-80 transition-opacity text-left"
                onClick={onGoHome}
            >
               <Logo className="w-8 h-8" />
               <div className="hidden sm:flex flex-col">
                  <span className="font-display font-bold text-sm md:text-lg tracking-widest leading-none">SPACE CLICKER GAME</span>
                  <span className="text-[10px] text-neon-blue font-mono tracking-wider">GAME CONSOLE</span>
               </div>
               <div className="sm:hidden min-w-0 max-w-[8rem]">
                  <div className="text-[9px] text-neon-blue font-mono tracking-wider">ACTIVE SIM</div>
                  <div className="text-xs font-bold text-white truncate">{activeGameMeta?.title || 'Space Game'}</div>
               </div>
            </button>
            
            <div className="hidden sm:block h-8 w-px bg-white/10 mx-2"></div>
            
            <div className="hidden md:flex items-center gap-2 text-xs text-gray-400 font-mono">
               <span className="w-2 h-2 rounded-full bg-green-500"></span>
               <span>LOCAL SESSION • AUTO-SAVE</span>
            </div>
         </div>

         <div className="flex items-center gap-3">
            {onOpenStats && (
              <button
                type="button"
                aria-label="Open fleet telemetry and save tools"
                onClick={onOpenStats}
                className="flex items-center gap-1.5 min-h-11 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-neon-blue/20 border border-white/10 hover:border-neon-blue text-xs font-mono text-gray-300 hover:text-white transition-all shadow-sm"
                title="Fleet Telemetry & Backup [S]"
              >
                <span>📊</span>
                <span className="font-bold">STATS</span>
                <span className="text-[9px] text-neon-blue hidden sm:inline">[S]</span>
              </button>
            )}

            <button
                ref={settingsButtonRef}
                type="button"
                aria-label="Open game settings"
                aria-haspopup="dialog"
                onClick={() => setShowSettings(true)}
                className="min-w-11 min-h-11 p-2 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white" 
                title="Settings"
            >
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543 .826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </button>
            <button
                type="button"
                aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                aria-pressed={isFullscreen}
                className="min-w-11 min-h-11 px-3 py-2 flex items-center justify-center gap-2 border border-neon-blue/60 text-neon-blue rounded-lg text-xs font-bold hover:bg-neon-blue hover:text-black transition-colors"
                onClick={handleFullscreenToggle}
            >
               <span aria-hidden="true">⛶</span>
               <span className="hidden md:inline">{isFullscreen ? 'EXIT FULLSCREEN' : 'FULLSCREEN'}</span>
            </button>
            <span role="status" aria-live="polite" className="sr-only">{systemStatus}</span>
         </div>
      </header>

      {/* --- SETTINGS MODAL --- */}
      {showSettings && (
          <div className="game-settings-overlay fixed inset-0 z-[100] flex items-center justify-center bg-black/80 md:backdrop-blur-sm animate-in fade-in">
              <div
                ref={settingsDialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="system-config-title"
                tabIndex={-1}
                onKeyDown={trapDialogFocus}
                className="bg-space-800 w-full max-w-md max-h-full border border-white/20 rounded-2xl shadow-2xl overflow-y-auto outline-none focus-visible:ring-2 focus-visible:ring-neon-blue"
              >
                  <div className="p-6 border-b border-white/10 flex justify-between items-center bg-space-900">
                      <h2 id="system-config-title" className="font-display font-bold text-xl text-white tracking-widest">SYSTEM CONFIG</h2>
                      <button type="button" aria-label="Close game settings" onClick={() => setShowSettings(false)} className="min-w-11 min-h-11 text-gray-400 hover:text-white">✕</button>
                  </div>
                  
                  <div className="p-6 space-y-6">
                      
                      {/* Audio Setting */}
                      <div className="flex items-center justify-between">
                          <div>
                              <div className="font-bold text-white text-sm">AUDIO SYNTHESIS</div>
                              <div className="text-xs text-gray-500">Enable UI sound effects</div>
                          </div>
                          <button
                            type="button"
                            aria-pressed={!isMuted}
                            aria-label={isMuted ? 'Enable game audio' : 'Mute game audio'}
                            onClick={handleMuteToggle}
                            className="w-12 h-11 shrink-0 flex items-center justify-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-blue"
                          >
                              <span className={`relative block w-12 h-6 rounded-full transition-colors ${!isMuted ? 'bg-neon-blue' : 'bg-gray-700'}`} aria-hidden="true">
                                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${!isMuted ? 'left-7' : 'left-1'}`}></span>
                              </span>
                          </button>
                      </div>

                      {/* Manual Save: Galaxy Miner only. Other simulations manage their own persistence. */}
                      {onManualSave && (
                        <div className="flex items-center justify-between border-t border-white/10 pt-6">
                            <div>
                                <div className="font-bold text-white text-sm">MANUAL OVERRIDE</div>
                                <div className="text-xs text-gray-500">Force save Galaxy Miner now</div>
                            </div>
                            <button
                              type="button"
                              onClick={handleManualSave}
                              disabled={saveStatus !== 'idle'}
                              className={`px-4 py-2 rounded text-xs font-bold transition-all w-28 text-center
                                  ${saveStatus === 'idle' ? 'bg-neon-blue text-black hover:bg-white' :
                                    saveStatus === 'saving' ? 'bg-yellow-500 text-black' :
                                    saveStatus === 'failed' ? 'bg-red-600 text-white' :
                                    'bg-green-500 text-white'}
                              `}
                            >
                                {saveStatus === 'idle'
                                  ? 'FORCE SAVE'
                                  : saveStatus === 'saving'
                                    ? 'SAVING...'
                                    : saveStatus === 'failed'
                                      ? 'FAILED'
                                      : 'SAVED ✓'}
                            </button>
                        </div>
                      )}

                      {/* Reset Data */}
                      <div className="border-t border-white/10 pt-6">
                          <div className="font-bold text-red-400 text-sm mb-2">DANGER ZONE</div>
                          <p className="text-xs text-gray-500 mb-4">Resetting removes Space Clicker Game saves, Spacebar records, and game settings stored by this site. It does not call localStorage.clear() for unrelated origin data.</p>
                          <button
                            type="button"
                            onClick={handleFactoryReset}
                            className="w-full py-3 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-bold rounded transition-colors text-xs tracking-widest"
                          >
                              FACTORY RESET PROTOCOL
                          </button>
                      </div>

                      <div className="text-center text-[10px] text-gray-600 font-mono pt-4">
                          LOCAL SETTINGS • BROWSER SAVE
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* --- MAIN CONTENT AREA --- */}
      <main id="game-main-content" tabIndex={-1} className="flex-1 relative flex overflow-hidden focus:outline-none">
         
         {/* Side HUD (Left) */}
         <aside className="hidden lg:flex w-16 hover:w-64 transition-all duration-300 border-r border-white/5 bg-black/20 backdrop-blur flex-col z-40 group shrink-0">
             <div className="flex-1 py-8 flex flex-col gap-6 items-center group-hover:items-stretch group-hover:px-4">
                 <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest text-center group-hover:text-left mb-2 group-hover:mb-0 transition-all">Simulations</div>
                 
                 {/* Playable simulation switcher */}
                 {GAMES_CATALOG.map((game) => (
                     <button
                       type="button"
                       key={game.id}
                       onClick={() => onSwitchGame(game.id)}
                       className={`flex items-center gap-3 transition-opacity text-left ${activeGame === game.id ? 'opacity-100' : 'opacity-45 hover:opacity-100'}`}
                       title={game.title}
                     >
                         <div className={`w-2 h-2 rounded-full flex-shrink-0 ${activeGame === game.id ? 'bg-neon-green shadow-[0_0_5px_lime]' : 'bg-gray-600'}`}></div>
                         <div className="hidden group-hover:block whitespace-nowrap text-xs text-gray-300">
                             <div className="font-bold">{game.title}</div>
                             <div className="text-[10px] text-gray-500">{game.subtitle}</div>
                         </div>
                     </button>
                 ))}
             </div>
             
             <div className="p-4 border-t border-white/5">
                 <div className="hidden group-hover:block text-[10px] text-gray-600 text-center">
                     LOCAL SAVE <br/> ACTIVE
                 </div>
                 <div className="group-hover:hidden text-center text-gray-700">📶</div>
             </div>
         </aside>

         {/* Center Viewport - SCROLLABLE FOR SEO CONTENT */}
         <div className="game-scroll-region flex-1 relative bg-black/40 shadow-inner overflow-y-auto custom-scrollbar scroll-smooth">
             {/* Scanlines Effect */}
             <div className="hidden md:block absolute inset-0 pointer-events-none bg-[radial-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px] opacity-20 mix-blend-overlay z-[5] fixed"></div>
             <div className="hidden md:block absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-black/30 z-[5] fixed"></div>
             
             {children}
         </div>

      </main>

      {/* --- BOTTOM DOCK --- */}
      <footer className="game-dock flex items-end bg-gradient-to-t from-black via-space-900/90 to-transparent z-50 pointer-events-none absolute bottom-0 left-0 right-0">
          <nav ref={dockScrollRef} aria-label="Game switcher" className="pointer-events-auto w-[calc(100%-1rem)] sm:w-auto mx-auto overflow-x-auto overscroll-x-contain scrollbar-hide rounded-2xl border border-white/10 bg-space-950/95 md:bg-white/5 md:backdrop-blur-xl shadow-2xl">
              <div className="min-w-max flex items-end justify-start sm:justify-center gap-2 p-2">
                  {GAMES_CATALOG.map(game => (
                      <button
                        key={game.id}
                        ref={activeGame === game.id ? activeDockButtonRef : undefined}
                        onClick={() => onSwitchGame(game.id)}
                        aria-label={`Switch to ${game.title}`}
                        aria-current={activeGame === game.id ? 'page' : undefined}
                        className={`group relative shrink-0 w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center text-xl md:text-2xl transition-all duration-200 md:hover:-translate-y-4 md:hover:scale-110
                            ${activeGame === game.id 
                                ? 'bg-gradient-to-br from-neon-blue to-blue-600 text-white shadow-[0_0_20px_rgba(0,243,255,0.5)] md:scale-110 md:-translate-y-2' 
                                : 'bg-space-800 text-gray-400 hover:bg-space-700 hover:text-white'
                            }
                        `}
                      >
                          {game.icon}
                          
                          {/* Tooltip: desktop pointer devices only */}
                          <div className="hidden md:block absolute -top-10 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] font-bold px-2 py-1 rounded border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                              {game.title}
                          </div>

                          {/* Active Indicator */}
                          {activeGame === game.id && (
                              <div className="absolute -bottom-1.5 w-1 h-1 bg-white rounded-full shadow-[0_0_5px_white]"></div>
                          )}
                      </button>
                  ))}
              </div>
          </nav>
      </footer>

    </div>
  );
};

export default StarshipConsole;
