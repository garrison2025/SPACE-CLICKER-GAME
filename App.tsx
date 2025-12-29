
import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { GameState, ResourceType, Upgrade, LogEntry, GameId, GlobalSettings, GameMeta } from './types';
import { INITIAL_UPGRADES, AUTO_SAVE_INTERVAL, SAVE_KEY, GEMINI_EVENT_COST, PLANETS, PRESTIGE_UPGRADES, GAMES_CATALOG, BLOG_POSTS } from './constants';
import StarField from './components/StarField';
import UpgradeShop from './components/UpgradeShop';
import ClickArea from './components/ClickArea';
import GoldenComet from './components/GoldenComet';
import CrisisEvent from './components/CrisisEvent';
import PrestigeShop from './components/PrestigeShop';
import SiteLayout, { ViewMode } from './components/SiteLayout';
import GameCanvas from './components/GameCanvas';
import SEOContent from './components/SEOContent';
import InterstellarComms from './components/InterstellarComms';
import LandingPage from './components/LandingPage';
import StarshipConsole from './components/StarshipConsole';
import BlogPage from './components/BlogPage'; 
import SettingsModal from './components/SettingsModal';
import { AboutPage, ContactPage, PrivacyPage, TermsPage, CookiesPage, SitemapPage } from './components/InfoPages';
import { generateSpaceEvent } from './services/geminiService';
import { formatNumber } from './utils';

// --- LAZY LOADED COMPONENTS ---
const MarsColony = React.lazy(() => import('./components/MarsColony'));
const StarDefense = React.lazy(() => import('./components/StarDefense'));
const MergeShips = React.lazy(() => import('./components/MergeShips'));
const GravityIdle = React.lazy(() => import('./components/GravityIdle'));
const DeepSpaceSignal = React.lazy(() => import('./components/DeepSpaceSignal'));

const PRESTIGE_THRESHOLD = 1_000_000_000_000;
const AUTO_SAVE_MS = 10000;

// Helper to format duration
const formatDuration = (ms: number) => {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
};

// Loading Spinner for Suspense
const GameLoader = () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-black/80 text-neon-blue font-mono">
        <div className="w-16 h-16 border-4 border-neon-blue border-t-transparent rounded-full animate-spin mb-4"></div>
        <div className="animate-pulse">INITIALIZING SIMULATION...</div>
    </div>
);

const App: React.FC = () => {
  // --- SEO & ROUTING INITIALIZATION ---
  const getInitialState = () => {
      const params = new URLSearchParams(window.location.search);
      const gameParam = params.get('game');
      const viewParam = params.get('view');
      const postParam = params.get('post');
      
      const validGame = GAMES_CATALOG.find(g => g.id === gameParam);
      
      // If ?game=xxx exists
      if (gameParam) {
          // If valid, return game mode
          if (validGame) {
              return {
                  game: validGame.id as GameId,
                  view: 'game' as ViewMode,
                  postId: null,
                  isValidGame: true
              };
          } else {
              // If invalid, we will handle Soft 404 in render/effect, but default to home for safety
              return {
                  game: 'galaxy_miner' as GameId, // Fallback
                  view: 'home' as ViewMode,
                  postId: null,
                  isValidGame: false
              };
          }
      }

      // If ?view=xxx exists
      if (viewParam && ['about', 'contact', 'privacy', 'terms', 'cookies', 'sitemap', 'blog'].includes(viewParam)) {
          return {
              game: 'galaxy_miner' as GameId, 
              view: viewParam as ViewMode,
              postId: postParam || null,
              isValidGame: true
          };
      }

      // Default to Home
      return {
          game: 'galaxy_miner' as GameId,
          view: 'home' as ViewMode,
          postId: null,
          isValidGame: true
      };
  };

  const { game: initialGame, view: initialView, postId: initialPostId, isValidGame: initialValid } = getInitialState();

  // --- STATE ---
  const [activeGame, setActiveGame] = useState<GameId>(initialGame);
  const [viewMode, setViewMode] = useState<ViewMode>(initialView);
  const [activePostId, setActivePostId] = useState<string | null>(initialPostId);
  const [isValidGameUrl, setIsValidGameUrl] = useState(initialValid);
  
  // Global Settings
  const [settings, setSettings] = useState<GlobalSettings>({ audioMuted: false, lowPerformance: false });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Galaxy Miner State
  const [resources, setResources] = useState<{ [key in ResourceType]: number }>({
    [ResourceType.Stardust]: 0,
    [ResourceType.DarkMatter]: 0
  });
  const [lifetimeEarnings, setLifetimeEarnings] = useState(0);
  const [upgrades, setUpgrades] = useState<{ [id: string]: Upgrade }>(
    INITIAL_UPGRADES.reduce((acc, u) => ({ ...acc, [u.id]: u }), {})
  );
  const [prestigeUpgrades, setPrestigeUpgrades] = useState<{ [id: string]: number }>({});
  const [level, setLevel] = useState(1);
  const [planetIndex, setPlanetIndex] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [showPrestigeShop, setShowPrestigeShop] = useState(false);
  const [showMobileShop, setShowMobileShop] = useState(false);
  const [offlineReport, setOfflineReport] = useState<{ time: number; amount: number } | null>(null);
  
  // Mechanics State
  const [heat, setHeat] = useState(0);
  const [overheated, setOverheated] = useState(false);
  
  // Flux State: Heat is in the "Goldilocks Zone" (80-99%)
  const isFlux = heat >= 80 && heat < 100 && !overheated;

  const resourcesRef = useRef(resources);
  resourcesRef.current = resources;

  // --- SEO: DYNAMIC METADATA & HISTORY ---
  useEffect(() => {
      // 1. Handle Invalid Game URL (Soft 404)
      if (!isValidGameUrl) {
          const meta = document.createElement('meta');
          meta.name = "robots";
          meta.content = "noindex";
          document.head.appendChild(meta);
          document.title = "404 - Simulation Not Found";
          return () => { document.head.removeChild(meta); };
      }

      const currentGame = GAMES_CATALOG.find(g => g.id === activeGame);
      
      const updateMeta = (name: string, content: string) => {
          document.querySelector(`meta[name="${name}"]`)?.setAttribute("content", content);
          document.querySelector(`meta[property="${name}"]`)?.setAttribute("content", content);
      };

      // Game Views
      if (viewMode === 'game' && currentGame) {
          const pageTitle = `${currentGame.title} - Play Free Online`;
          document.title = pageTitle;
          
          updateMeta('description', currentGame.metaDescription);
          updateMeta('keywords', currentGame.keywords);
          
          updateMeta('og:title', pageTitle);
          updateMeta('og:description', currentGame.metaDescription);
          updateMeta('og:url', `https://spaceclickergame.com/?game=${activeGame}`);
          updateMeta('og:type', 'website');
          
          if (currentGame.image) {
              updateMeta('og:image', currentGame.image);
              updateMeta('twitter:image', currentGame.image);
          }
          
          updateMeta('twitter:title', pageTitle);
          updateMeta('twitter:description', currentGame.metaDescription);
          
          let link = document.querySelector("link[rel='canonical']");
          if (link) link.setAttribute("href", `https://spaceclickergame.com/?game=${activeGame}`);
          
      } 
      // Home View
      else if (viewMode === 'home') {
          const homeTitle = "Space Clicker Game - Play Free Idle Mining & Strategy Games";
          const homeDesc = "Play the best Space Clicker Game online. Mine resources, build colonies, and command fleets in the Void Expanse universe. No download required.";
          
          document.title = homeTitle;
          updateMeta('description', homeDesc);
          updateMeta('og:title', homeTitle);
          updateMeta('og:description', homeDesc);
          updateMeta('og:url', "https://spaceclickergame.com/");
          updateMeta('og:type', 'website');
          updateMeta('og:image', "https://spaceclickergame.com/og-default.jpg"); // Default
          
          let link = document.querySelector("link[rel='canonical']");
          if (link) link.setAttribute("href", `https://spaceclickergame.com/`);
      } 
      // Blog View
      else if (viewMode === 'blog') {
          if (activePostId) {
              const post = BLOG_POSTS.find(p => p.slug === activePostId);
              if (post) {
                  const title = `${post.title} - Space Clicker Game Blog`;
                  document.title = title;
                  updateMeta('description', post.excerpt);
                  updateMeta('og:title', title);
                  updateMeta('og:description', post.excerpt);
                  updateMeta('og:url', `https://spaceclickergame.com/?view=blog&post=${post.slug}`);
                  updateMeta('og:type', 'article');
                  if (post.image) {
                      updateMeta('og:image', post.image);
                      updateMeta('twitter:image', post.image);
                  }
              }
          } else {
              const title = "Galactic Archives - Space Clicker Game Blog";
              const desc = "Read the latest strategy guides, lore, and updates for the Void Expanse universe.";
              document.title = title;
              updateMeta('description', desc);
              updateMeta('og:title', title);
              updateMeta('og:description', desc);
              updateMeta('og:url', `https://spaceclickergame.com/?view=blog`);
              updateMeta('og:type', 'website');
              updateMeta('og:image', "https://spaceclickergame.com/og-default.jpg"); // Default
          }
      }
      // Other Info Pages
      else {
          const title = `${viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} - Space Clicker Game`;
          document.title = title;
          updateMeta('og:title', title);
          updateMeta('og:type', 'website');
          updateMeta('og:image', "https://spaceclickergame.com/og-default.jpg"); // Default
      }

  }, [activeGame, viewMode, activePostId, isValidGameUrl]);

  // Handle Browser Back Button
  useEffect(() => {
      const handlePopState = () => {
          const { game, view, postId, isValidGame } = getInitialState();
          setActiveGame(game);
          setViewMode(view);
          setActivePostId(postId);
          setIsValidGameUrl(isValidGame);
      };
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // --- COMPUTED VALUES (Miner) ---
  const currentPlanet = PLANETS[planetIndex];
  const nextPlanet = PLANETS[planetIndex + 1];
  const currentGameMeta = GAMES_CATALOG.find(g => g.id === activeGame) || GAMES_CATALOG[0];

  const getTechBonus = (id: string, base: number) => (prestigeUpgrades[id] || 0) * base;
  
  // Crit Logic: Base + Tech + Heat Bonus + Flux Bonus
  const critChance = 0.05 
    + (getTechBonus('crit_chance', 5) / 100) 
    + (heat > 50 ? 0.1 : 0) 
    + (isFlux ? 0.25 : 0);

  const critMultiplier = 10 + getTechBonus('crit_damage', 1);
  const passiveTechBoost = 1 + (getTechBonus('passive_boost', 0.25));
  const prestigeMultiplier = (1 + (resources[ResourceType.DarkMatter] * 0.1));

  // --- MILESTONE CALCULATION ---
  const getMilestoneMultiplier = (count: number) => {
    let mult = 1;
    if (count >= 25) mult *= 2;
    if (count >= 50) mult *= 2;
    if (count >= 100) mult *= 2;
    if (count >= 200) mult *= 2;
    if (count >= 500) mult *= 4;
    return mult;
  };

  const getProductionRate = useCallback(() => {
    let rate = 0;
    Object.values(upgrades).forEach((u: Upgrade) => {
      if (u.type === 'auto') {
          // Apply milestone multiplier per unit
          const milestoneMult = getMilestoneMultiplier(u.count);
          rate += u.baseProduction * u.count * milestoneMult;
      }
    });
    // Flux doubles automated production too if sustained!
    const fluxBonus = isFlux ? 2 : 1;
    return rate * currentPlanet.productionMultiplier * prestigeMultiplier * passiveTechBoost * fluxBonus;
  }, [upgrades, currentPlanet, prestigeMultiplier, passiveTechBoost, isFlux]);

  const getClickPower = useCallback(() => {
    let power = 1;
    const clickUpgrade = upgrades['click_booster'];
    if (clickUpgrade) {
        const milestoneMult = getMilestoneMultiplier(clickUpgrade.count);
        power += clickUpgrade.baseProduction * clickUpgrade.count * milestoneMult;
    }
    return power * currentPlanet.productionMultiplier * prestigeMultiplier;
  }, [upgrades, currentPlanet, prestigeMultiplier]);

  // --- ACTIONS ---
  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    setLogs(prev => [{ id: Date.now().toString() + Math.random(), timestamp: new Date(), message, type }, ...prev.slice(0, 19)]);
  };

  const addResources = (amount: number) => {
    setResources(prev => ({ ...prev, [ResourceType.Stardust]: prev[ResourceType.Stardust] + amount }));
    setLifetimeEarnings(prev => prev + amount);
  };

  const handleMine = (x: number, y: number, multiplier: number = 1, isGeode: boolean = false): { amount: number, isCrit: boolean } => {
    if (overheated && !isGeode) return { amount: 0, isCrit: false };

    // Heat Logic
    if (isGeode) {
        // Geode Venting: Cool down 20%
        setHeat(prev => Math.max(0, prev - 20));
        addLog("SYSTEM VENTED: -20% HEAT", "info");
    } else {
        // Normal Mining increases heat
        setHeat(prev => {
            const next = prev + 5; // Add 5% heat per click
            if (next >= 100) {
                setOverheated(true);
                setTimeout(() => {
                    setOverheated(false);
                    setHeat(0);
                }, 5000); // 5s cooldown
                return 100;
            }
            return next;
        });
    }

    const fluxBonus = isFlux ? 2 : 1;
    const base = getClickPower() * multiplier * fluxBonus;
    
    const isCrit = Math.random() < critChance;
    const finalAmount = isCrit ? base * critMultiplier : base;
    
    addResources(finalAmount);
    return { amount: finalAmount, isCrit };
  };

  // Heat Decay Loop
  useEffect(() => {
    const timer = setInterval(() => {
        if (!overheated && heat > 0) {
            setHeat(prev => Math.max(0, prev - 2)); // Decay 2% every 100ms
        }
    }, 100);
    return () => clearInterval(timer);
  }, [heat, overheated]);

  const handleCometCatch = () => {
    const reward = Math.max(getProductionRate() * 300, getClickPower() * 50);
    addResources(reward);
    addLog(`COMET CAPTURED! +${formatNumber(reward)}`, 'success');
  };

  const handleCrisisResolve = (success: boolean) => {
      if (success) {
          addLog("ASTEROID DEFLECTED", "success");
      } else {
          const penalty = resources[ResourceType.Stardust] * 0.1;
          setResources(prev => ({ ...prev, [ResourceType.Stardust]: Math.floor(prev[ResourceType.Stardust] * 0.9) }));
          addLog(`IMPACT SUSTAINED! LOST ${formatNumber(penalty)} STARDUST`, "alert");
      }
  };

  const handleBuyUpgrade = (id: string, amount: number) => {
    const upgrade = upgrades[id];
    if (!upgrade) return;

    // Calculate total cost for 'amount'
    let totalCost = 0;
    let currentCostBase = upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.count);
    
    for (let i = 0; i < amount; i++) {
        totalCost += Math.floor(currentCostBase);
        currentCostBase *= upgrade.costMultiplier;
    }

    if (resources[ResourceType.Stardust] >= totalCost) {
      setResources(prev => ({ ...prev, [ResourceType.Stardust]: prev[ResourceType.Stardust] - totalCost }));
      setUpgrades(prev => ({
        ...prev,
        [id]: { ...upgrade, count: upgrade.count + amount }
      }));
    }
  };
  
  const handlePrestigeBuy = (id: string) => {
      const u = PRESTIGE_UPGRADES.find(p => p.id === id);
      if (!u) return;
      
      const currentLevel = prestigeUpgrades[id] || 0;
      if (u.maxLevel !== -1 && currentLevel >= u.maxLevel) return;

      const cost = Math.floor(u.cost * Math.pow(1.5, currentLevel));
      
      if (resources[ResourceType.DarkMatter] >= cost) {
          setResources(prev => ({ ...prev, [ResourceType.DarkMatter]: prev[ResourceType.DarkMatter] - cost }));
          setPrestigeUpgrades(prev => ({ ...prev, [id]: currentLevel + 1 }));
      }
  };

  const handlePrestige = () => {
      if (resources[ResourceType.Stardust] < PRESTIGE_THRESHOLD) return;
      
      if (!window.confirm("WARNING: Entering the Galactic Core will reset your mining progress. You will gain Dark Matter based on your current Stardust. Continue?")) return;

      const dmEarned = Math.floor(Math.sqrt(resources[ResourceType.Stardust] / 1000000));
      
      setResources(prev => ({
          [ResourceType.Stardust]: 0,
          [ResourceType.DarkMatter]: prev[ResourceType.DarkMatter] + dmEarned
      }));
      
      // Reset standard upgrades
      setUpgrades(INITIAL_UPGRADES.reduce((acc, u) => ({ ...acc, [u.id]: u }), {}));
      setLevel(1);
      setPlanetIndex(0);
      setLifetimeEarnings(0);
      
      addLog(`PRESTIGE SUCCESSFUL. GAINED ${dmEarned} DARK MATTER.`, 'success');
  };

  // Game Loop
  useEffect(() => {
    const interval = setInterval(() => {
        const production = getProductionRate();
        if (production > 0) {
            addResources(production / 10);
        }
    }, 100);
    return () => clearInterval(interval);
  }, [getProductionRate]);

  // Save/Load Logic
  useEffect(() => {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) {
        try {
            const data = JSON.parse(saved);
            if (data.resources) setResources(data.resources);
            if (data.upgrades) setUpgrades(data.upgrades);
            if (data.prestigeUpgrades) setPrestigeUpgrades(data.prestigeUpgrades);
            if (data.planetIndex !== undefined) setPlanetIndex(data.planetIndex);
            if (data.lifetimeEarnings) setLifetimeEarnings(data.lifetimeEarnings);
            
            // Offline Progress (Simple)
            if (data.lastSaveTime) {
                const now = Date.now();
                const diff = (now - data.lastSaveTime) / 1000;
                if (diff > 60) {
                    setOfflineReport({ time: diff, amount: 0 }); // Placeholder amount, could be calculated
                }
            }
        } catch (e) { console.error("Save load failed", e); }
    }
  }, []);

  // Auto Save
  useEffect(() => {
      const interval = setInterval(() => {
          const stateToSave = {
              resources: resourcesRef.current,
              upgrades,
              prestigeUpgrades,
              planetIndex,
              lifetimeEarnings,
              lastSaveTime: Date.now()
          };
          localStorage.setItem(SAVE_KEY, JSON.stringify(stateToSave));
      }, AUTO_SAVE_MS);
      return () => clearInterval(interval);
  }, [upgrades, prestigeUpgrades, planetIndex, lifetimeEarnings]);

  // Planet Unlock Check
  useEffect(() => {
      if (nextPlanet && resources[ResourceType.Stardust] >= nextPlanet.threshold && nextPlanet.threshold > 0) {
          if (planetIndex < PLANETS.length - 1) {
             setPlanetIndex(prev => prev + 1);
             addLog(`WARP JUMP: ARRIVED AT ${nextPlanet.name}`, 'success');
          }
      }
  }, [resources, planetIndex, nextPlanet]);

  // Handlers for Site Layout
  const handleNavigate = (view: ViewMode, postId?: string) => {
      setViewMode(view);
      setActivePostId(postId || null);
      setIsValidGameUrl(true); // Assuming navigation within app is valid
      
      let url = view === 'home' ? '/' : `/?view=${view}`;
      if (view === 'blog' && postId) {
          url += `&post=${postId}`;
      }
      window.history.pushState({}, '', url);
  };

  const handleGameSelect = (id: GameId) => {
      setActiveGame(id);
      setViewMode('game');
      setIsValidGameUrl(true);
      window.history.pushState({}, '', `/?game=${id}`);
  };

  // Render Logic
  const renderContent = () => {
      if (!isValidGameUrl && viewMode === 'game') {
          return (
              <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-black">
                  <h1 className="text-4xl font-display text-red-500 mb-4">SIMULATION NOT FOUND</h1>
                  <p className="text-gray-400 mb-8">The requested sector coordinates are invalid.</p>
                  <button 
                    onClick={() => handleNavigate('home')}
                    className="px-6 py-2 bg-neon-blue text-black font-bold rounded"
                  >
                    RETURN TO COMMAND
                  </button>
              </div>
          );
      }

      if (viewMode === 'home') {
          return (
             <LandingPage 
                onStart={(id) => handleGameSelect(id)} 
                onNavigate={handleNavigate}
                heroSlot={
                    <GameCanvas title={currentGameMeta.title} headingLevel="h2">
                        <ClickArea 
                            onMine={handleMine} 
                            productionRate={getProductionRate()} 
                            clickPower={getClickPower()}
                            planet={currentPlanet}
                            heat={heat}
                            overheated={overheated}
                            upgrades={Object.values(upgrades)}
                            isFlux={isFlux}
                        />
                     </GameCanvas>
                }
             />
          );
      }
      
      if (viewMode === 'about') return <AboutPage />;
      if (viewMode === 'contact') return <ContactPage />;
      if (viewMode === 'privacy') return <PrivacyPage />;
      if (viewMode === 'terms') return <TermsPage />;
      if (viewMode === 'cookies') return <CookiesPage />;
      if (viewMode === 'sitemap') return <SitemapPage games={GAMES_CATALOG} />;
      
      if (viewMode === 'blog') {
          return (
            <BlogPage 
                postId={activePostId} 
                onNavigate={handleNavigate} 
                onGameStart={handleGameSelect} 
            />
          );
      }

      // Game Mode
      if (viewMode === 'game') {
          return (
             <StarshipConsole 
                activeGame={activeGame} 
                onSwitchGame={handleGameSelect}
                onOpenSettings={() => setIsSettingsOpen(true)}
             >
                <Suspense fallback={<GameLoader />}>
                    {activeGame === 'galaxy_miner' && (
                        <div className="flex h-full">
                            <UpgradeShop 
                                upgrades={Object.values(upgrades)} 
                                currency={resources[ResourceType.Stardust]} 
                                onBuy={handleBuyUpgrade} 
                            />
                            <div className="flex-1 relative">
                                <ClickArea 
                                    onMine={handleMine} 
                                    productionRate={getProductionRate()} 
                                    clickPower={getClickPower()}
                                    planet={currentPlanet}
                                    heat={heat}
                                    overheated={overheated}
                                    upgrades={Object.values(upgrades)}
                                    isFlux={isFlux}
                                />
                                <GoldenComet onCatch={handleCometCatch} />
                                <CrisisEvent onResolve={handleCrisisResolve} />
                                
                                {/* Overlay Logs */}
                                <div className="absolute bottom-4 left-4 z-20 w-64 max-h-48 overflow-y-auto pointer-events-none fade-mask">
                                    {logs.map(log => (
                                        <div key={log.id} className={`text-xs font-mono mb-1 text-shadow ${log.type === 'alert' ? 'text-red-400' : log.type === 'success' ? 'text-green-400' : 'text-blue-300'}`}>
                                            <span className="opacity-50">[{log.timestamp.toLocaleTimeString()}]</span> {log.message}
                                        </div>
                                    ))}
                                </div>

                                {/* Prestige Button */}
                                {resources[ResourceType.Stardust] > PRESTIGE_THRESHOLD && (
                                    <button 
                                        onClick={() => setShowPrestigeShop(true)}
                                        className="absolute top-4 right-4 z-30 bg-purple-600 text-white px-4 py-2 rounded font-bold animate-pulse shadow-[0_0_20px_purple]"
                                    >
                                        ENTER CORE
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                    {activeGame === 'mars_colony' && <MarsColony />}
                    {activeGame === 'star_defense' && <StarDefense />}
                    {activeGame === 'merge_ships' && <MergeShips />}
                    {activeGame === 'gravity_idle' && <GravityIdle />}
                    {activeGame === 'deep_signal' && <DeepSpaceSignal />}
                </Suspense>

                {/* Overlays */}
                {showPrestigeShop && (
                    <PrestigeShop 
                        darkMatter={resources[ResourceType.DarkMatter]} 
                        upgrades={prestigeUpgrades} 
                        onBuy={handlePrestigeBuy} 
                        onClose={() => setShowPrestigeShop(false)} 
                    />
                )}
                
                {offlineReport && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80">
                         <div className="bg-space-900 border border-neon-blue p-8 rounded-2xl text-center">
                             <h3 className="text-xl font-bold text-white mb-2">WELCOME BACK COMMANDER</h3>
                             <p className="text-gray-400 mb-4">You were away for {formatDuration(offlineReport.time * 1000)}.</p>
                             <div className="text-2xl font-mono text-neon-green mb-6">+{formatNumber(offlineReport.amount)} STARDUST</div>
                             <button onClick={() => setOfflineReport(null)} className="px-6 py-2 bg-neon-blue text-black font-bold rounded">RESUME</button>
                         </div>
                    </div>
                )}
             </StarshipConsole>
          );
      }

      return null;
  };

  return (
    <SiteLayout onNavigate={handleNavigate} currentView={viewMode}>
        <StarField />
        {renderContent()}
        <SettingsModal 
            isOpen={isSettingsOpen} 
            onClose={() => setIsSettingsOpen(false)} 
            settings={settings}
            onSettingsChange={setSettings}
        />
        <InterstellarComms activeGame={activeGame} onSwitchGame={handleGameSelect} />
    </SiteLayout>
  );
};

export default App;
