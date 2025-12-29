
import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { GameState, ResourceType, Upgrade, LogEntry, GameId } from './types';
import { INITIAL_UPGRADES, AUTO_SAVE_INTERVAL, SAVE_KEY, GEMINI_EVENT_COST, PLANETS, PRESTIGE_UPGRADES, GAMES_CATALOG, BLOG_POSTS } from './constants';
import StarField from './components/StarField';
import UpgradeShop from './components/UpgradeShop';
import ClickArea from './components/ClickArea';
import GoldenComet from './components/GoldenComet';
import CrisisEvent from './components/CrisisEvent';
import PrestigeShop from './components/PrestigeShop';
import SiteLayout, { ViewMode } from './components/SiteLayout';
import GameCanvas from './components/GameCanvas';
import GameCarousel from './components/GameCarousel';
import SEOContent from './components/SEOContent';
import InterstellarComms from './components/InterstellarComms';
import LandingPage from './components/LandingPage';
import BlogPage from './components/BlogPage';
import NotFoundPage from './components/NotFoundPage';
import { AboutPage, ContactPage, PrivacyPage, TermsPage, CookiesPage, SitemapPage } from './components/InfoPages';
import { generateSpaceEvent } from './services/geminiService';
import { formatNumber } from './utils';

// --- LAZY LOAD GAMES (Code Splitting for SEO Performance) ---
const MarsColony = React.lazy(() => import('./components/MarsColony'));
const StarDefense = React.lazy(() => import('./components/StarDefense'));
const MergeShips = React.lazy(() => import('./components/MergeShips'));
const GravityIdle = React.lazy(() => import('./components/GravityIdle'));
const DeepSpaceSignal = React.lazy(() => import('./components/DeepSpaceSignal'));

const PRESTIGE_THRESHOLD = 1_000_000_000_000;
const AUTO_SAVE_MS = 10000;

// High-quality Open Graph images for each game
const GAME_OG_IMAGES: Record<GameId, string> = {
    'galaxy_miner': 'https://images.unsplash.com/photo-1614728263952-84ea256f9679?auto=format&fit=crop&q=80&w=1200',
    'mars_colony': 'https://images.unsplash.com/photo-1614730341194-75c60740a070?auto=format&fit=crop&q=80&w=1200',
    'star_defense': 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1200',
    'merge_ships': 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&q=80&w=1200',
    'gravity_idle': 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=1200',
    'deep_signal': 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=1200'
};

const DEFAULT_OG_IMAGE = 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1200';

// Define valid views for strict routing
const VALID_VIEWS: ViewMode[] = ['home', 'game', 'about', 'contact', 'privacy', 'terms', 'cookies', 'blog', 'sitemap'];

// Loading Spinner for Suspense
const LoadingSimulation = () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-black text-neon-blue font-mono space-y-4">
        <div className="w-12 h-12 border-4 border-neon-blue border-t-transparent rounded-full animate-spin"></div>
        <div className="text-sm tracking-widest animate-pulse">INITIALIZING SIMULATION...</div>
    </div>
);

import StarshipConsole from './components/StarshipConsole';

const App: React.FC = () => {
  // --- ROUTING ---
  const getInitialState = () => {
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get('view');
      const postParam = params.get('post');
      const idParam = params.get('id');
      
      let isValidView = true;
      let validView: ViewMode = 'home';
      
      if (viewParam) {
          if (VALID_VIEWS.includes(viewParam as ViewMode)) {
              validView = viewParam as ViewMode;
          } else {
              isValidView = false;
          }
      }

      let validGameId: GameId = 'galaxy_miner';
      let isGameIdValid = true;
      if (validView === 'game' && idParam) {
          if (GAMES_CATALOG.some(g => g.id === idParam)) {
              validGameId = idParam as GameId;
          } else {
              isGameIdValid = false;
          }
      }

      let isPostIdValid = true;
      if (validView === 'blog' && postParam) {
          if (!BLOG_POSTS.some(p => p.slug === postParam || p.id === postParam)) {
              isPostIdValid = false;
          }
      }

      return { 
          view: validView, 
          postId: postParam, 
          gameId: validGameId, 
          hasError: !isValidView || !isGameIdValid || !isPostIdValid 
      };
  };

  const initialState = getInitialState();

  // --- STATE ---
  const [activeGame, setActiveGame] = useState<GameId>(initialState.gameId);
  const [viewMode, setViewMode] = useState<ViewMode>(initialState.view); 
  const [activePostId, setActivePostId] = useState<string | null>(initialState.postId);
  const [is404, setIs404] = useState(initialState.hasError);
  
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
  
  // Mechanics State
  const [heat, setHeat] = useState(0);
  const [overheated, setOverheated] = useState(false);
  
  // Flux State: Heat is in the "Goldilocks Zone" (80-99%)
  const isFlux = heat >= 80 && heat < 100 && !overheated;

  // --- COMPUTED VALUES (Miner) ---
  const currentPlanet = PLANETS[planetIndex];
  const currentGameMeta = GAMES_CATALOG.find(g => g.id === activeGame) || GAMES_CATALOG[0];

  const getTechBonus = (id: string, base: number) => (prestigeUpgrades[id] || 0) * base;
  
  const critChance = 0.05 
    + (getTechBonus('crit_chance', 5) / 100) 
    + (heat > 50 ? 0.1 : 0) 
    + (isFlux ? 0.25 : 0);

  const critMultiplier = 10 + getTechBonus('crit_damage', 1);
  const passiveTechBoost = 1 + (getTechBonus('passive_boost', 0.25));
  const prestigeMultiplier = (1 + (resources[ResourceType.DarkMatter] * 0.1));

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
          const milestoneMult = getMilestoneMultiplier(u.count);
          rate += u.baseProduction * u.count * milestoneMult;
      }
    });
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

  // --- SEO DYNAMIC UPDATE ---
  useEffect(() => {
    if (is404) {
        document.title = "404 - Signal Lost | Space Clicker Game";
        return;
    }

    let title = "Space Clicker Game - Play Free Idle Mining & Strategy Online";
    let desc = "The ultimate Space Clicker Game. Mine resources, build colonies, and command fleets in this epic browser-based idle strategy simulation. No download required.";
    let url = "https://spaceclickergame.com";
    let image = DEFAULT_OG_IMAGE;
    
    if (viewMode === 'game') {
        const game = GAMES_CATALOG.find(g => g.id === activeGame);
        if (game) {
            title = `${game.title} - Free Online Space Clicker Game`;
            desc = `${game.description}`;
            url = `https://spaceclickergame.com?view=game&id=${game.id}`;
            image = GAME_OG_IMAGES[game.id] || DEFAULT_OG_IMAGE;
        }
    } else if (viewMode === 'blog' && activePostId) {
        const post = BLOG_POSTS.find(p => p.slug === activePostId || p.id === activePostId);
        if (post) {
            title = `${post.title} | Space Clicker Game Blog`;
            desc = post.excerpt;
            url = `https://spaceclickergame.com?view=blog&post=${post.slug}`;
            if (post.image) image = post.image;
        }
    }

    document.title = title;
    
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', desc);

    let linkCanon = document.querySelector('link[rel="canonical"]');
    if (!linkCanon) {
        linkCanon = document.createElement('link');
        linkCanon.setAttribute('rel', 'canonical');
        document.head.appendChild(linkCanon);
    }
    linkCanon.setAttribute('href', url);

  }, [viewMode, activeGame, activePostId, is404]);

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

    if (isGeode) {
        setHeat(prev => Math.max(0, prev - 20));
        addLog("SYSTEM VENTED: -20% HEAT", "info");
    } else {
        setHeat(prev => {
            const next = prev + 5; 
            if (next >= 100) {
                setOverheated(true);
                setTimeout(() => {
                    setOverheated(false);
                    setHeat(0);
                }, 5000); 
                addLog("CRITICAL OVERHEAT! WEAPON DISABLED FOR 5s", "alert");
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

  useEffect(() => {
    const timer = setInterval(() => {
        if (!overheated && heat > 0) {
            setHeat(prev => Math.max(0, prev - 2)); 
        }
    }, 100);
    return () => clearInterval(timer);
  }, [heat, overheated]);

  const handleCometCatch = () => {
    const reward = Math.max(getProductionRate() * 300, getClickPower() * 50);
    addResources(reward);
    addLog(`COMET CAPTURED! +${formatNumber(reward)} SD`, 'success');
  };

  const handleCrisisResolve = (success: boolean) => {
     if (success) {
         const reward = getClickPower() * 200;
         addResources(reward);
         addLog(`DEFENSE SUCCESS! +${formatNumber(reward)} SD`, 'success');
     } else {
         const penalty = Math.floor(resources[ResourceType.Stardust] * 0.1);
         setResources(prev => ({ ...prev, [ResourceType.Stardust]: Math.max(0, prev[ResourceType.Stardust] - penalty) }));
         addLog(`DEFENSE FAILED! -${formatNumber(penalty)} SD`, 'alert');
     }
  };

  const handleBuyUpgrade = (id: string, amountToBuy: number = 1) => {
    const upgrade = upgrades[id];
    if (!upgrade) return;
    let totalCost = 0;
    let tempCount = upgrade.count;
    for (let i = 0; i < amountToBuy; i++) {
        totalCost += Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, tempCount));
        tempCount++;
    }

    if (resources[ResourceType.Stardust] >= totalCost) {
      setResources(prev => ({ ...prev, [ResourceType.Stardust]: prev[ResourceType.Stardust] - totalCost }));
      setUpgrades(prev => ({ ...prev, [id]: { ...prev[id], count: prev[id].count + amountToBuy } }));
      
      const newCount = upgrade.count + amountToBuy;
      if (
          (upgrade.count < 25 && newCount >= 25) ||
          (upgrade.count < 50 && newCount >= 50) ||
          (upgrade.count < 100 && newCount >= 100) ||
          (upgrade.count < 200 && newCount >= 200)
      ) {
          addLog(`${upgrade.name} MILESTONE: OUTPUT DOUBLED!`, 'success');
      }
    }
  };

  const handleBuyPrestige = (id: string) => {
    const u = PRESTIGE_UPGRADES.find(p => p.id === id);
    if(!u) return;
    const level = prestigeUpgrades[id] || 0;
    const cost = Math.floor(u.cost * Math.pow(1.5, level));
    if (resources[ResourceType.DarkMatter] >= cost) {
        setResources(prev => ({...prev, [ResourceType.DarkMatter]: prev[ResourceType.DarkMatter] - cost}));
        setPrestigeUpgrades(prev => ({...prev, [id]: level + 1}));
    }
  };

  const handleScan = async () => {
    if (resources[ResourceType.Stardust] < GEMINI_EVENT_COST) return;
    setIsScanning(true);
    setResources(prev => ({...prev, [ResourceType.Stardust]: prev[ResourceType.Stardust] - GEMINI_EVENT_COST}));
    const event = await generateSpaceEvent({ 
      resources, upgrades, level, totalMined: resources[ResourceType.Stardust], lifetimeEarnings, lastSaveTime: Date.now(), prestigeUpgrades, planetIndex,
      heat, overheated 
    });
    setIsScanning(false);
    addLog(event.title, 'event');
    if (event.reward) {
      const reward = event.reward * prestigeMultiplier * currentPlanet.productionMultiplier;
      addResources(reward);
      addLog(`Reward: ${formatNumber(reward)} SD`, 'success');
    }
  };

  const handleNavigate = (target: ViewMode, id?: string) => {
    setIs404(false);
    setViewMode(target);
    setActivePostId(id || null);
    
    const url = new URL(window.location.href);
    url.searchParams.set('view', target);
    if (id) url.searchParams.set('post', id);
    else url.searchParams.delete('post');
    if (target === 'game') {
        const gameId = id || activeGame;
        url.searchParams.set('id', gameId);
        setActiveGame(gameId as GameId); 
    } else {
        url.searchParams.delete('id');
    }
    
    window.history.pushState({}, '', url);

    if (target === 'home') {
        if (activeGame !== 'galaxy_miner') {
            setActiveGame('galaxy_miner');
        }
    }
  };

  // --- ROBUST SAVE SYSTEM ---
  // Use Refs to keep track of latest state without triggering re-renders or resetting intervals
  const gameStateRef = useRef({
      resources, upgrades, prestigeUpgrades, level, planetIndex, lifetimeEarnings
  });

  // Keep refs synced with state
  useEffect(() => {
      gameStateRef.current = {
          resources, upgrades, prestigeUpgrades, level, planetIndex, lifetimeEarnings
      };
  }, [resources, upgrades, prestigeUpgrades, level, planetIndex, lifetimeEarnings]);

  const saveGame = useCallback(() => {
      const data = gameStateRef.current;
      const toSave = {
          ...data,
          lastSaveTime: Date.now()
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(toSave));
  }, []);

  // Initialize Loading
  useEffect(() => {
      const loadGame = () => {
          const saved = localStorage.getItem(SAVE_KEY);
          if (saved) {
              try {
                  const data = JSON.parse(saved);
                  if (data.resources) setResources(data.resources);
                  if (data.upgrades) {
                      const merged = { ...INITIAL_UPGRADES.reduce((acc, u) => ({ ...acc, [u.id]: u }), {}), ...data.upgrades };
                      setUpgrades(merged);
                  }
                  if (data.prestigeUpgrades) setPrestigeUpgrades(data.prestigeUpgrades);
                  if (data.level) setLevel(data.level);
                  if (data.planetIndex) setPlanetIndex(data.planetIndex);
                  if (data.lifetimeEarnings) setLifetimeEarnings(data.lifetimeEarnings);
              } catch (e) {
                  console.error("Failed to load save", e);
              }
          }
      };
      loadGame();
  }, []);

  // Save Interval & Event Listeners
  useEffect(() => {
      // Auto-save interval
      const timer = setInterval(() => {
          saveGame();
      }, AUTO_SAVE_INTERVAL);

      // Listen for global force save event (from StarshipConsole)
      const handleForceSave = () => {
          saveGame();
          addLog("GAME SAVED MANUALLY", "success");
      };

      // Browser close/refresh listener
      const handleBeforeUnload = () => {
          saveGame();
      };

      window.addEventListener('game-save-trigger', handleForceSave);
      window.addEventListener('beforeunload', handleBeforeUnload);

      return () => {
          clearInterval(timer);
          window.removeEventListener('game-save-trigger', handleForceSave);
          window.removeEventListener('beforeunload', handleBeforeUnload);
          saveGame(); // Save on unmount
      };
  }, [saveGame]);

  const renderActiveGame = () => {
      switch(activeGame) {
          case 'galaxy_miner':
              return (
                  <div className="flex flex-col md:flex-row h-full w-full overflow-hidden">
                      <div className="flex-1 relative h-full">
                          <ClickArea 
                              onMine={handleMine}
                              productionRate={getProductionRate()}
                              currency={resources[ResourceType.Stardust]} 
                              clickPower={getClickPower()}
                              planet={currentPlanet}
                              heat={heat}
                              overheated={overheated}
                              upgrades={Object.values(upgrades)}
                              isFlux={isFlux}
                          />
                          <GoldenComet onCatch={handleCometCatch} />
                          <CrisisEvent onResolve={handleCrisisResolve} />
                          
                          <button 
                            className="md:hidden absolute bottom-4 right-4 z-50 bg-neon-blue text-black p-3 rounded-full font-bold shadow-lg"
                            onClick={() => setShowMobileShop(true)}
                          >
                            UPGRADES
                          </button>
                      </div>

                      <div className="hidden md:flex flex-col w-96 border-l border-white/10 bg-space-900 z-20 h-full">
                           <UpgradeShop 
                                upgrades={Object.values(upgrades)} 
                                currency={resources[ResourceType.Stardust]} 
                                onBuy={handleBuyUpgrade} 
                           />
                      </div>

                      {showMobileShop && (
                          <div className="absolute inset-0 z-[100] bg-black/90 md:hidden flex flex-col animate-in slide-in-from-bottom">
                              <div className="p-4 flex justify-between items-center bg-space-800">
                                  <h2 className="font-display font-bold text-white">FABRICATOR</h2>
                                  <button onClick={() => setShowMobileShop(false)} className="text-gray-400 text-2xl">✕</button>
                              </div>
                              <div className="flex-1 overflow-hidden">
                                  <UpgradeShop 
                                      upgrades={Object.values(upgrades)} 
                                      currency={resources[ResourceType.Stardust]} 
                                      onBuy={handleBuyUpgrade} 
                                  />
                              </div>
                          </div>
                      )}
                  </div>
              );
          case 'mars_colony': return <MarsColony />;
          case 'star_defense': return <StarDefense />;
          case 'merge_ships': return <MergeShips />;
          case 'gravity_idle': return <GravityIdle />;
          case 'deep_signal': return <DeepSpaceSignal />;
          default: return <div className="p-10 text-center">Simulation Under Construction</div>;
      }
  };

  if (is404) return <NotFoundPage onNavigate={handleNavigate} />;

  if (viewMode === 'game') {
      return (
          <StarshipConsole 
            activeGame={activeGame} 
            onSwitchGame={(id) => handleNavigate('game', id)}
            onGoHome={() => handleNavigate('home')}
          >
              <div className="w-full relative flex flex-col">
                  <div className="relative h-[calc(100vh-theme(spacing.16))] min-h-[600px] w-full flex flex-col">
                      <div className="flex-1 relative overflow-hidden">
                          <Suspense fallback={<LoadingSimulation />}>
                              {renderActiveGame()}
                          </Suspense>
                          <InterstellarComms activeGame={activeGame} onSwitchGame={(id) => handleNavigate('game', id)} />
                      </div>
                  </div>
                  
                  <div className="relative z-10 bg-space-950 border-t border-white/10">
                      <SEOContent game={currentGameMeta} />
                  </div>
              </div>
          </StarshipConsole>
      );
  }

  return (
    <SiteLayout currentView={viewMode} onNavigate={handleNavigate}>
        {viewMode === 'home' && (
            <LandingPage 
                onStart={(id) => handleNavigate('game', id)}
                onNavigate={handleNavigate}
                heroSlot={undefined} 
            />
        )}

        {viewMode === 'blog' && <BlogPage postId={activePostId} onNavigate={handleNavigate} />}
        {viewMode === 'about' && <AboutPage />}
        {viewMode === 'contact' && <ContactPage />}
        {viewMode === 'privacy' && <PrivacyPage />}
        {viewMode === 'terms' && <TermsPage />}
        {viewMode === 'cookies' && <CookiesPage />}
        {viewMode === 'sitemap' && <SitemapPage />}
    </SiteLayout>
  );
};

export default App;
