import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { GameState, ResourceType, Upgrade, LogEntry, GameId } from './types';
import { INITIAL_UPGRADES, AUTO_SAVE_INTERVAL, SAVE_KEY, EVENT_SCAN_COST, PLANETS, PRESTIGE_UPGRADES, GAMES_CATALOG } from './constants';
import { BLOG_POST_META } from './content/blogMeta';
import SiteLayout, { ViewMode } from './components/SiteLayout';
import LandingPage from './components/LandingPage';
import NotFoundPage from './components/NotFoundPage';
import SEOHead from './components/SEOHead';
import { generateSpaceEvent } from './services/eventService';
import { toggleMute, getMuteState } from './services/audioService';
import { formatNumber } from './utils';
import { isInteractiveKeyboardTarget } from './utils/keyboard';
import { safeGetStorageItem, safeSetStorageItem, safeRemoveStorageItem } from './utils/projectStorage';

// --- LAZY LOAD GAMES (Code Splitting for SEO Performance) ---
const MarsColony = React.lazy(() => import('./components/MarsColony'));
const StarDefense = React.lazy(() => import('./components/StarDefense'));
const MergeShips = React.lazy(() => import('./components/MergeShips'));
const GravityIdle = React.lazy(() => import('./components/GravityIdle'));
const DeepSpaceSignal = React.lazy(() => import('./components/DeepSpaceSignal'));
const SpacebarGame = React.lazy(() => import('./components/SpacebarGame'));
const SpacebarCounter = React.lazy(() => import('./components/SpacebarCounter'));
const SpacebarClickerTest = React.lazy(() => import('./components/SpacebarClickerTest'));
const SpacebarGamesPage = React.lazy(() => import('./components/SpacebarGamesPage'));
const SpacebarClicker2 = React.lazy(() => import('./components/SpacebarClicker2'));
const BlogPage = React.lazy(() => import('./components/BlogPage'));
const SEOContent = React.lazy(() => import('./components/SEOContent'));
const ComparisonPage = React.lazy(() => import('./components/ComparisonPage'));
const AchievementsPage = React.lazy(() => import('./components/AchievementsPage'));
const AboutPage = React.lazy(() => import('./components/InfoPages').then(module => ({ default: module.AboutPage })));
const ContactPage = React.lazy(() => import('./components/InfoPages').then(module => ({ default: module.ContactPage })));
const PrivacyPage = React.lazy(() => import('./components/InfoPages').then(module => ({ default: module.PrivacyPage })));
const TermsPage = React.lazy(() => import('./components/InfoPages').then(module => ({ default: module.TermsPage })));
const CookiesPage = React.lazy(() => import('./components/InfoPages').then(module => ({ default: module.CookiesPage })));
const SitemapPage = React.lazy(() => import('./components/InfoPages').then(module => ({ default: module.SitemapPage })));
const UpgradeShop = React.lazy(() => import('./components/UpgradeShop'));
const ClickArea = React.lazy(() => import('./components/ClickArea'));
const GoldenComet = React.lazy(() => import('./components/GoldenComet'));
const CrisisEvent = React.lazy(() => import('./components/CrisisEvent'));
const PrestigeShop = React.lazy(() => import('./components/PrestigeShop'));
const InterstellarComms = React.lazy(() => import('./components/InterstellarComms'));
const StatsAndSaveModal = React.lazy(() => import('./components/StatsAndSaveModal'));
const OfflineEarningsModal = React.lazy(() => import('./components/OfflineEarningsModal'));
const HotkeyOverlay = React.lazy(() => import('./components/HotkeyOverlay'));
const StarshipConsole = React.lazy(() => import('./components/StarshipConsole'));

const PRESTIGE_THRESHOLD = 1_000_000_000_000;
const SAVE_VERSION = 3;
const MAX_SAFE_UPGRADE_COUNT = 1000;
const MAX_SAFE_UNBOUNDED_TECH_LEVEL = 1000;
const MAX_SAFE_RESOURCE_VALUE = 1e300;
const MAX_SAFE_DARK_MATTER = 1e280;
const MAX_SAFE_OFFLINE_RATE = 1e295;

const finiteNonNegative = (
    value: unknown,
    fallback = 0,
    max = MAX_SAFE_RESOURCE_VALUE
) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.min(max, Math.max(0, parsed)) : fallback;
};

const safeNonNegativeInt = (value: unknown, fallback = 0, max = Number.MAX_SAFE_INTEGER) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(max, Math.max(0, Math.floor(parsed)));
};

// High-quality Open Graph images for each game
const GAME_OG_IMAGES: Record<GameId, string> = {
    'galaxy_miner': 'https://images.unsplash.com/photo-1614728263952-84ea256f9679?auto=format&fit=crop&q=80&w=1200',
    'mars_colony': 'https://images.unsplash.com/photo-1614728263952-84ea256f9679?auto=format&fit=crop&q=80&w=1200',
    'star_defense': 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1200',
    'merge_ships': 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&q=80&w=1200',
    'gravity_idle': 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=1200',
    'deep_signal': 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=1200'
};

const DEFAULT_OG_IMAGE = 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1200';
const SPACEBAR_OG_IMAGE = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=1200';
const SITE_CONTENT_UPDATED = '2026-10-06';
const SITE_URL = 'https://spaceclickergame.com/';
const ORGANIZATION_ID = SITE_URL + '#organization';

const GAME_SEO: Record<GameId, { title: string; description: string; genres: string[] }> = {
  galaxy_miner: {
    title: 'Galaxy Miner – Space Mining Idle Clicker Online',
    description: 'Play Galaxy Miner online: mine Stardust, automate a space economy, manage Heat Flux, catch Golden Comets, and reset for permanent Dark Matter upgrades.',
    genres: ['Clicker', 'Incremental', 'Idle', 'Sci-Fi']
  },
  mars_colony: {
    title: 'Mars Colony Idle - Free Space Strategy Game',
    description: 'Build and balance a browser-based Mars colony with Oxygen, Food, Energy, population growth, and automated resource production.',
    genres: ['Idle', 'Management', 'Strategy', 'Simulation']
  },
  star_defense: {
    title: 'Star Defense - Free Space Defense Clicker',
    description: 'Defend your mothership from alien waves, click enemies for direct damage, and upgrade auto-turrets in a browser defense game.',
    genres: ['Clicker', 'Defense', 'Action', 'Sci-Fi']
  },
  merge_ships: {
    title: 'Merge Spaceships - Free Browser Merge Game',
    description: 'Merge matching ships, deploy stronger vessels to orbit, earn automatic Credits, and recover up to 24 hours of capped offline fleet income.',
    genres: ['Merge', 'Idle', 'Casual', 'Collection']
  },
  gravity_idle: {
    title: 'Gravity Idle - Free Physics Idle Game',
    description: 'Play Gravity Idle: automate orbital cannons, curve projectiles through a gravity well, earn Matter, and recover up to 24 hours of capped offline progress.',
    genres: ['Idle', 'Physics', 'Simulation', 'Sci-Fi']
  },
  deep_signal: {
    title: 'Deep Space Signal - Signal Decoding Idle Game',
    description: 'Scan radio frequencies, manage Energy, decrypt transmissions, analyze faction data, and automate signal hunting in this browser idle simulation.',
    genres: ['Idle', 'Simulation', 'Signal Decoding', 'Sci-Fi']
  }
};

const SORTED_BLOG_POST_META = [...BLOG_POST_META].sort(
  (a, b) => Date.parse(b.publishedDate) - Date.parse(a.publishedDate)
);

// Define valid views for strict routing
const VALID_VIEWS: ViewMode[] = ['home', 'game', 'about', 'contact', 'privacy', 'terms', 'cookies', 'blog', 'sitemap', 'compare', 'achievements', 'spacebar-clicker', 'spacebar-counter', 'spacebar-clicker-test', 'spacebar-clicker-unblocked', 'spacebar-games', 'spacebar-clicker-2'];

// Loading Spinner for Suspense
const LoadingSimulation = () => (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="w-full h-full flex flex-col items-center justify-center bg-black text-neon-blue font-mono space-y-4"
    >
        <div className="w-12 h-12 border-4 border-neon-blue border-t-transparent rounded-full animate-spin" aria-hidden="true"></div>
        <div className="text-sm tracking-widest animate-pulse">INITIALIZING SIMULATION...</div>
    </div>
);


const App: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const shouldFocusRouteRef = useRef(false);

  // --- LEGACY ROUTE GUARD & REDIRECTS ---
  // This cleans up old URLs indexed by Google (e.g. /?view=game&id=...)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const legacyView = params.get('view');
    
    if (legacyView) {
        let newPath = '/';
        if (legacyView === 'game') {
            const id = params.get('id');
            newPath = id ? `/game/${id}/` : '/game/galaxy_miner/';
        } else if (legacyView === 'blog') {
            const post = params.get('post');
            newPath = post ? `/blog/${post}/` : '/blog/';
        } else if (VALID_VIEWS.includes(legacyView as ViewMode)) {
            newPath = legacyView === 'home' ? '/' : `/${legacyView}/`;
        }
        
        // Perform replacement redirect
        navigate(newPath, { replace: true });
    }
  }, [location, navigate]);

  // --- ROUTING LOGIC (Using useLocation) ---
  const parsePath = () => {
      const path = location.pathname;
      
      let view: ViewMode = 'home';
      let gameId: GameId = 'galaxy_miner';
      let postId: string | null = null;
      let error = false;

      if (path === '/') {
          view = 'home';
      } else if (path === '/game' || path === '/game/' || path.startsWith('/game/')) {
          view = 'game';
          const segments = path.split('/').filter(Boolean);
          const id = segments[1];

          if (segments.length === 1) {
              gameId = 'galaxy_miner';
          } else if (
              segments.length === 2 &&
              id &&
              GAMES_CATALOG.some(g => g.id === id)
          ) {
              gameId = id as GameId;
          } else {
              error = true;
          }
      } else if (path === '/blog' || path === '/blog/' || path.startsWith('/blog/')) {
          view = 'blog';
          const segments = path.split('/').filter(Boolean);
          const id = segments[1];

          if (segments.length === 1) {
              postId = null;
          } else if (
              segments.length === 2 &&
              id &&
              BLOG_POST_META.some(p => p.slug === id || p.id === id)
          ) {
              postId = id;
          } else {
              error = true;
          }
      } else {
          // Check static pages
          const cleanPath = path.replace(/^\/+|\/+$/g, '') as ViewMode;
          if (VALID_VIEWS.includes(cleanPath)) {
              view = cleanPath;
          } else {
              error = true;
          }
      }

      return { view, gameId, postId, error };
  };

  const currentRoute = parsePath();

  // --- STATE ---
  const [activeGame, setActiveGame] = useState<GameId>(currentRoute.gameId);
  const [viewMode, setViewMode] = useState<ViewMode>(currentRoute.view); 
  const [activePostId, setActivePostId] = useState<string | null>(currentRoute.postId);
  const [is404, setIs404] = useState(currentRoute.error);

  // Update state when URL changes
  useEffect(() => {
      const route = parsePath();
      setViewMode(route.view);
      setActiveGame(route.gameId);
      setActivePostId(route.postId);
      setIs404(route.error);

      if (shouldFocusRouteRef.current) {
          shouldFocusRouteRef.current = false;
          window.requestAnimationFrame(() => {
              const target = document.getElementById(
                  route.view === 'game' && !route.error ? 'game-main-content' : 'main-content'
              );
              target?.focus();
          });
      }
  }, [location.pathname]);

  useEffect(() => {
      if (viewMode === 'blog' && activePostId) {
          void import('./content/blogPosts');
      }
  }, [viewMode, activePostId]);
  
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
  const isScanningRef = useRef(false);
  const [showPrestigeShop, setShowPrestigeShop] = useState(false);
  const [showMobileShop, setShowMobileShop] = useState(false);
  
  // Mechanics State
  const [heat, setHeat] = useState(0);
  const [overheated, setOverheated] = useState(false);
  const heatRef = useRef(0);
  const overheatedRef = useRef(false);
  const overheatTimerRef = useRef<number>();

  useEffect(() => {
    heatRef.current = heat;
  }, [heat]);

  useEffect(() => {
    overheatedRef.current = overheated;
  }, [overheated]);

  useEffect(() => {
    return () => {
      if (overheatTimerRef.current !== undefined) {
        window.clearTimeout(overheatTimerRef.current);
      }
    };
  }, []);
  
  // Telemetry & Stats State
  const [totalClicks, setTotalClicks] = useState(0);
  const [totalCrits, setTotalCrits] = useState(0);
  const [cometsCaught, setCometsCaught] = useState(0);
  const [crisesResolved, setCrisesResolved] = useState(0);
  
  // Modals & Settings State
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showHotkeysOverlay, setShowHotkeysOverlay] = useState(false);
  const [hapticEnabled, setHapticEnabled] = useState<boolean>(() => safeGetStorageItem('space_haptic') !== 'false');
  const [screenShakeEnabled, setScreenShakeEnabled] = useState<boolean>(() => safeGetStorageItem('space_screenshake') !== 'false');
  const hiddenAtRef = useRef<number | null>(null);
  const [offlineEarnings, setOfflineEarnings] = useState<{
    isOpen: boolean;
    awayTimeSeconds: number;
    earnedStardust: number;
    productionRate: number;
  }>({
    isOpen: false,
    awayTimeSeconds: 0,
    earnedStardust: 0,
    productionRate: 0,
  });

  useEffect(() => {
    if (activeGame === 'galaxy_miner') return;

    setShowStatsModal(false);
    setShowPrestigeShop(false);
    setShowHotkeysOverlay(false);
    setShowMobileShop(false);
    setOfflineEarnings(prev => prev.isOpen ? { ...prev, isOpen: false } : prev);
  }, [activeGame]);

  const toggleHaptic = () => {
    const next = !hapticEnabled;
    safeSetStorageItem('space_haptic', String(next));
    setHapticEnabled(next);
  };

  const toggleScreenShake = () => {
    const next = !screenShakeEnabled;
    safeSetStorageItem('space_screenshake', String(next));
    setScreenShakeEnabled(next);
  };

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
  const remainingDarkMatterCapacity = Math.max(
    0,
    MAX_SAFE_DARK_MATTER - resources[ResourceType.DarkMatter]
  );
  const prestigeGain = Math.min(
    Math.floor(5 * Math.sqrt(resources[ResourceType.Stardust] / PRESTIGE_THRESHOLD)),
    remainingDarkMatterCapacity
  );
  const canPrestige = prestigeGain >= 1;

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

  // --- PASSIVE PRODUCTION LOOP ---
  useEffect(() => {
    const rate = getProductionRate();
    if (rate <= 0) return;

    // Keep the active game visually responsive without forcing 10 React updates/sec
    // across the homepage, blog, and Spacebar tools. Delta-time accounting also
    // avoids losing production when the browser throttles timers.
    const intervalTime = viewMode === 'game' && activeGame === 'galaxy_miner' ? 250 : 1000;
    let lastTick = Date.now();

    const handleVisibilityChange = () => {
        lastTick = Date.now();
    };

    const timer = setInterval(() => {
        if (document.hidden) {
            lastTick = Date.now();
            return;
        }

        const now = Date.now();
        const elapsedSeconds = Math.min(86400, Math.max(0, (now - lastTick) / 1000));
        lastTick = now;
        const earned = rate * elapsedSeconds;
        if (earned <= 0) return;

        const snapshot = gameStateRef.current;
        const currentStardust = snapshot.resources[ResourceType.Stardust];
        const nextStardust = Math.min(MAX_SAFE_RESOURCE_VALUE, currentStardust + earned);
        const credited = Math.max(0, nextStardust - currentStardust);
        if (credited <= 0) return;

        const nextResources = {
            ...snapshot.resources,
            [ResourceType.Stardust]: nextStardust
        };
        const nextLifetimeEarnings = Math.min(
            MAX_SAFE_RESOURCE_VALUE,
            snapshot.lifetimeEarnings + credited
        );
        gameStateRef.current = {
            ...snapshot,
            resources: nextResources,
            lifetimeEarnings: nextLifetimeEarnings
        };
        setResources(nextResources);
        setLifetimeEarnings(nextLifetimeEarnings);
    }, intervalTime);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
        clearInterval(timer);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [getProductionRate, viewMode, activeGame]);

  // --- SEO METADATA CALCULATION ---
  const getSEOProps = () => {
      if (is404) {
          return {
              title: "404 - Signal Lost | Space Clicker Game",
              description: "The requested page could not be found.",
              path: location.pathname,
              image: DEFAULT_OG_IMAGE,
              type: 'website' as const,
              schema: undefined
          };
      }
      
      let title = "Space Clicker – Free Space Clicker Game Online";
      let desc = "Play Space Clicker free online. Mine Stardust, automate production, manage Heat Flux, catch Golden Comets, and reset for permanent Dark Matter upgrades.";
      let image = viewMode.startsWith('spacebar') ? SPACEBAR_OG_IMAGE : DEFAULT_OG_IMAGE;
      let type: 'website' | 'article' = 'website';
      let schema: any = undefined;

      if (viewMode === 'game') {
          const game = GAMES_CATALOG.find(g => g.id === activeGame);
          if (game) {
              const gameSeo = GAME_SEO[game.id];
              title = gameSeo.title;
              desc = gameSeo.description;
              image = GAME_OG_IMAGES[game.id] || DEFAULT_OG_IMAGE;
              type = 'website';
              schema = {
                "@context": "https://schema.org",
                "@graph": [
                  {
                    "@type": "VideoGame",
                    "@id": `https://spaceclickergame.com/game/${game.id}/#game`,
                    "url": `https://spaceclickergame.com/game/${game.id}/`,
                    "name": game.title,
                    "description": gameSeo.description,
                    "genre": gameSeo.genres,
                    "playMode": "SinglePlayer",
                    "applicationCategory": "Game",
                    "operatingSystem": "Any modern web browser",
                    "isAccessibleForFree": true,
                    "dateModified": SITE_CONTENT_UPDATED,
                    "inLanguage": "en",
                    "image": image,
                    "offers": {
                      "@type": "Offer",
                      "price": "0",
                      "priceCurrency": "USD",
                      "availability": "https://schema.org/InStock"
                    }
                  },
                  {
                    "@type": "BreadcrumbList",
                    "@id": `https://spaceclickergame.com/game/${game.id}/#breadcrumb`,
                    "itemListElement": [
                      {
                        "@type": "ListItem",
                        "position": 1,
                        "name": "Space Clicker Game",
                        "item": "https://spaceclickergame.com/"
                      },
                      {
                        "@type": "ListItem",
                        "position": 2,
                        "name": game.title,
                        "item": `https://spaceclickergame.com/game/${game.id}/`
                      }
                    ]
                  }
                ]
              };
          }
      } else if (viewMode === 'blog') {
          if (activePostId) {
              const post = BLOG_POST_META.find(p => p.slug === activePostId || p.id === activePostId);
              if (post) {
                  title = post.seoTitle;
                  desc = post.excerpt;
                  if (post.image) image = post.image;
                  type = 'article';
              }
          } else {
              title = "Space Clicker Game Blog - Guides & Strategy";
              desc = "Read guides, mechanics explainers and strategy articles for space clicker and incremental browser games.";
              schema = {
                  "@context": "https://schema.org",
                  "@graph": [
                    {
                      "@type": "CollectionPage",
                      "@id": "https://spaceclickergame.com/blog/#webpage",
                      "url": "https://spaceclickergame.com/blog/",
                      "name": title,
                      "description": desc,
                      "dateModified": SITE_CONTENT_UPDATED,
                      "isPartOf": {
                        "@type": "WebSite",
                        "@id": "https://spaceclickergame.com/#website",
                        "name": "Space Clicker Game",
                        "url": "https://spaceclickergame.com/"
                      }
                    },
                    {
                      "@type": "ItemList",
                      "@id": "https://spaceclickergame.com/blog/#articles",
                      "name": "Space Clicker Game guides and strategy articles",
                      "itemListElement": SORTED_BLOG_POST_META.map((post, index) => ({
                        "@type": "ListItem",
                        "position": index + 1,
                        "name": post.title,
                        "url": `https://spaceclickergame.com/blog/${post.slug}/`
                      }))
                    },
                    {
                      "@type": "BreadcrumbList",
                      "@id": "https://spaceclickergame.com/blog/#breadcrumb",
                      "itemListElement": [
                        { "@type": "ListItem", "position": 1, "name": "Space Clicker Game", "item": "https://spaceclickergame.com/" },
                        { "@type": "ListItem", "position": 2, "name": "Blog", "item": "https://spaceclickergame.com/blog/" }
                      ]
                    }
                  ]
              };
          }
      } else if (viewMode === 'home') {
          schema = {
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "WebSite",
                "@id": "https://spaceclickergame.com/#website",
                "url": "https://spaceclickergame.com/",
                "name": "Space Clicker Game",
                "description": "Play browser-based space clicker, idle, strategy, defense, merge, physics, and text-adventure simulations.",
                "dateModified": SITE_CONTENT_UPDATED,
                "publisher": {
                  "@id": ORGANIZATION_ID
                }
              },
              {
                "@type": "Organization",
                "@id": ORGANIZATION_ID,
                "name": "Space Clicker Game",
                "url": SITE_URL
              },
              {
                "@type": "VideoGame",
                "@id": "https://spaceclickergame.com/game/galaxy_miner/#game",
                "url": "https://spaceclickergame.com/game/galaxy_miner/",
                "name": "Galaxy Miner",
                "alternateName": "Space Clicker Game",
                "description": "A free browser space clicker game with Stardust mining, automation, Heat Flux, Golden Comets, offline progress, and permanent Dark Matter upgrades.",
                "genre": ["Clicker", "Incremental", "Idle", "Sci-Fi"],
                "playMode": "SinglePlayer",
                "applicationCategory": "Game",
                "operatingSystem": "Any modern web browser",
                "isAccessibleForFree": true,
                "dateModified": SITE_CONTENT_UPDATED,
                "inLanguage": "en",
                "offers": {
                  "@type": "Offer",
                  "price": "0",
                  "priceCurrency": "USD"
                }
              },
              {
                "@type": "FAQPage",
                "@id": "https://spaceclickergame.com/#faq",
                "mainEntity": [
                  {
                    "@type": "Question",
                    "name": "Is this space clicker game free to play?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Yes. The current browser games and Spacebar tools can be played without purchasing a paid account or upgrade."
                    }
                  },
                  {
                    "@type": "Question",
                    "name": "Is Space Clicker an idle game?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Yes. Galaxy Miner starts with manual Stardust mining, then shifts toward automated production through Mining Drones and later upgrade tiers. Returning after time away can credit up to 24 hours of saved automatic production."
                    }
                  },
                  {
                    "@type": "Question",
                    "name": "Can I play Space Clicker on mobile?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Yes. Galaxy Miner supports touch input in a modern mobile browser. The Spacebar games also provide large on-screen controls for devices without a physical keyboard."
                    }
                  },
                  {
                    "@type": "Question",
                    "name": "Does Galaxy Miner save my progress?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Galaxy Miner auto-saves to local browser storage. Clearing site data, using private browsing, or changing devices can remove or separate that local save."
                    }
                  },
                  {
                    "@type": "Question",
                    "name": "What happens when I use Galactic Reset?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Galaxy Miner resets Stardust and standard upgrades, then awards Dark Matter based on the size of the run. Dark Matter and permanent technology remain for future runs."
                    }
                  }
                ]
              }
            ]
          };
      } else if (viewMode === 'compare') {
          title = "Space Clicker Game vs Classic Incremental Games: Feature Comparison";
          desc = "Compare gameplay structure, automation, progression and reset systems, events, and presentation across Space Clicker Game and well-known incremental games.";
          const comparedGames = [
            'Space Clicker Game (Galaxy Miner)',
            'Cookie Clicker',
            'Universal Paperclips',
            'Antimatter Dimensions',
            'Spaceplan',
            'Melvor Idle'
          ];
          const canonical = "https://spaceclickergame.com/compare/";
          schema = {
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "WebPage",
                "@id": canonical + "#webpage",
                "url": canonical,
                "name": title,
                "description": desc,
                "dateModified": SITE_CONTENT_UPDATED,
                "isPartOf": {
                  "@type": "WebSite",
                  "@id": "https://spaceclickergame.com/#website",
                  "name": "Space Clicker Game",
                  "url": "https://spaceclickergame.com/"
                }
              },
              {
                "@type": "ItemList",
                "@id": canonical + "#games",
                "name": "Incremental games in the feature comparison",
                "itemListElement": comparedGames.map((name, index) => ({
                  "@type": "ListItem",
                  "position": index + 1,
                  "name": name
                }))
              },
              {
                "@type": "BreadcrumbList",
                "@id": canonical + "#breadcrumb",
                "itemListElement": [
                  { "@type": "ListItem", "position": 1, "name": "Space Clicker Game", "item": "https://spaceclickergame.com/" },
                  { "@type": "ListItem", "position": 2, "name": "Feature Comparison", "item": canonical }
                ]
              }
            ]
          };
      } else if (viewMode === 'achievements') {
          title = "Galaxy Miner Milestones & Progress Tracker | Space Clicker Game";
          desc = "Track Galaxy Miner mining, automation, and Dark Matter milestones from your local browser save.";
          const milestones = [
            '1,000 lifetime Stardust',
            '1 million lifetime Stardust',
            '1 billion lifetime Stardust',
            '1 trillion lifetime Stardust',
            '1 quadrillion lifetime Stardust',
            '25 Mining Drones',
            '50 Orbital Stations',
            '1 Dyson Swarm',
            'Hold at least 1 Dark Matter',
            'Hold at least 100 Dark Matter'
          ];
          const canonical = "https://spaceclickergame.com/achievements/";
          schema = {
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "CollectionPage",
                "@id": canonical + "#webpage",
                "url": canonical,
                "name": "Galaxy Miner Milestones & Progress Tracker",
                "description": desc,
                "dateModified": SITE_CONTENT_UPDATED,
                "isPartOf": {
                  "@type": "WebSite",
                  "@id": "https://spaceclickergame.com/#website",
                  "name": "Space Clicker Game",
                  "url": "https://spaceclickergame.com/"
                }
              },
              {
                "@type": "ItemList",
                "@id": canonical + "#milestones",
                "name": "Galaxy Miner tracked milestones",
                "itemListElement": milestones.map((name, index) => ({
                  "@type": "ListItem",
                  "position": index + 1,
                  "name": name
                }))
              },
              {
                "@type": "BreadcrumbList",
                "@id": canonical + "#breadcrumb",
                "itemListElement": [
                  { "@type": "ListItem", "position": 1, "name": "Space Clicker Game", "item": "https://spaceclickergame.com/" },
                  { "@type": "ListItem", "position": 2, "name": "Galaxy Miner Milestones", "item": canonical }
                ]
              }
            ]
          };
      } else if (viewMode === 'about') {
          title = "About | Space Clicker Game";
          desc = "Learn about SpaceClickerGame.com and its free browser-based clicker, idle and spacebar experiences.";
          schema = {
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "AboutPage",
                  "@id": "https://spaceclickergame.com/about/#webpage",
                  "url": "https://spaceclickergame.com/about/",
                  "name": "About Space Clicker Game",
                  "description": desc,
                  "dateModified": SITE_CONTENT_UPDATED,
                  "about": {
                    "@type": "Organization",
                    "@id": ORGANIZATION_ID,
                    "name": "Space Clicker Game",
                    "url": SITE_URL
                  },
                  "isPartOf": {
                    "@type": "WebSite",
                    "@id": "https://spaceclickergame.com/#website",
                    "name": "Space Clicker Game",
                    "url": "https://spaceclickergame.com/"
                  }
                },
                {
                  "@type": "BreadcrumbList",
                  "@id": "https://spaceclickergame.com/about/#breadcrumb",
                  "itemListElement": [
                    { "@type": "ListItem", "position": 1, "name": "Space Clicker Game", "item": "https://spaceclickergame.com/" },
                    { "@type": "ListItem", "position": 2, "name": "About", "item": "https://spaceclickergame.com/about/" }
                  ]
                }
              ]
          };
      } else if (viewMode === 'contact') {
          title = "Contact | Space Clicker Game";
          desc = "Contact SpaceClickerGame.com for player support, bug reports, feedback, business, advertising, or press questions.";
      } else if (viewMode === 'privacy') {
          title = "Privacy Policy | Space Clicker Game";
          desc = "Read how SpaceClickerGame.com handles browser-local game saves, exported save codes, hosting requests, analytics, and advertising technologies.";
      } else if (viewMode === 'terms') {
          title = "Terms of Service | Space Clicker Game";
          desc = "Read the terms that apply when using SpaceClickerGame.com and its browser-based games and tools.";
      } else if (viewMode === 'cookies') {
          title = "Cookie & Local Storage Settings | Space Clicker Game";
          desc = "Learn how SpaceClickerGame.com uses browser localStorage for game progress and what clearing site storage does to local saves.";
      } else if (viewMode === 'sitemap') {
          title = "HTML Sitemap | Space Clicker Game";
          desc = "Browse the main games, Spacebar tools, guides, support pages, and legal resources available on SpaceClickerGame.com.";
      } else if (viewMode === 'spacebar-games') {
          title = "Spacebar Games - Clicker, Counter & CPS Tests";
          desc = "Play free spacebar games online: Spacebar Clicker, Spacebar Counter, timed CPS tests, a 100-click sprint and instant browser play.";
          schema = {
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "CollectionPage",
                  "@id": "https://spaceclickergame.com/spacebar-games/#webpage",
                  "name": "Spacebar Games",
                  "description": desc,
                  "url": "https://spaceclickergame.com/spacebar-games/",
                  "dateModified": SITE_CONTENT_UPDATED
                },
                {
                  "@type": "ItemList",
                  "@id": "https://spaceclickergame.com/spacebar-games/#tools",
                  "name": "Spacebar Games and Tools",
                  "itemListElement": [
                    { "@type": "ListItem", "position": 1, "url": "https://spaceclickergame.com/spacebar-clicker/", "name": "Spacebar Clicker" },
                    { "@type": "ListItem", "position": 2, "url": "https://spaceclickergame.com/spacebar-clicker-test/", "name": "Spacebar Clicker Test" },
                    { "@type": "ListItem", "position": 3, "url": "https://spaceclickergame.com/spacebar-counter/", "name": "Spacebar Counter" },
                    { "@type": "ListItem", "position": 4, "url": "https://spaceclickergame.com/spacebar-clicker-2/", "name": "Spacebar Clicker 2" },
                    { "@type": "ListItem", "position": 5, "url": "https://spaceclickergame.com/spacebar-clicker-unblocked/", "name": "Spacebar Clicker Instant Play" }
                  ]
                },
                {
                  "@type": "BreadcrumbList",
                  "@id": "https://spaceclickergame.com/spacebar-games/#breadcrumb",
                  "itemListElement": [
                    { "@type": "ListItem", "position": 1, "name": "Space Clicker Game", "item": "https://spaceclickergame.com/" },
                    { "@type": "ListItem", "position": 2, "name": "Spacebar Games", "item": "https://spaceclickergame.com/spacebar-games/" }
                  ]
                },
                {
                  "@type": "FAQPage",
                  "@id": "https://spaceclickergame.com/spacebar-games/#faq",
                  "mainEntity": [
                    {
                      "@type": "Question",
                      "name": "Are these spacebar games free?",
                      "acceptedAnswer": { "@type": "Answer", "text": "Yes. The current Spacebar games and tools can be used in a modern browser without a paid account or download." }
                    },
                    {
                      "@type": "Question",
                      "name": "Which page measures spacebar CPS?",
                      "acceptedAnswer": { "@type": "Answer", "text": "Use Spacebar Clicker Test for timed CPS challenges, peak CPS, average CPS, custom durations and the 100-click sprint." }
                    },
                    {
                      "@type": "Question",
                      "name": "Which page only counts presses?",
                      "acceptedAnswer": { "@type": "Answer", "text": "Use Spacebar Counter for an endless press total without a fixed timer or upgrade economy." }
                    },
                    {
                      "@type": "Question",
                      "name": "Do Spacebar Clicker saves sync between devices?",
                      "acceptedAnswer": { "@type": "Answer", "text": "No automatic cloud sync is provided. Supported clicker modes store progress locally, but Spacebar Clicker and Spacebar Clicker 2 can export a save code or backup file for manual transfer and restore." }
                    }
                  ]
                }
              ]
          };
      } else if (viewMode === 'spacebar-clicker-2') {
          title = "Spacebar Clicker 2 - Upgraded Idle Space Bar Game";
          desc = "Play Spacebar Clicker 2, an enhanced browser idle game with Overdrive, auto-production, upgrades, offline earnings and Nova Core ascension.";
          type = 'website';
          schema = {
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "VideoGame",
                  "name": "Spacebar Clicker 2",
                  "description": desc,
                  "genre": ["Clicker", "Incremental", "Idle"],
                  "playMode": "SinglePlayer",
                  "applicationCategory": "Game",
                  "operatingSystem": "Any modern web browser",
                  "@id": "https://spaceclickergame.com/spacebar-clicker-2/#game",
                  "url": "https://spaceclickergame.com/spacebar-clicker-2/",
                  "isAccessibleForFree": true,
                  "dateModified": SITE_CONTENT_UPDATED,
                  "inLanguage": "en",
                  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
                },
                {
                  "@type": "BreadcrumbList",
                  "itemListElement": [
                    { "@type": "ListItem", "position": 1, "name": "Space Clicker Game", "item": "https://spaceclickergame.com/" },
                    { "@type": "ListItem", "position": 2, "name": "Spacebar Games", "item": "https://spaceclickergame.com/spacebar-games/" },
                    { "@type": "ListItem", "position": 3, "name": "Spacebar Clicker 2", "item": "https://spaceclickergame.com/spacebar-clicker-2/" }
                  ]
                },
                {
                  "@type": "FAQPage",
                  "mainEntity": [
                    {
                      "@type": "Question",
                      "name": "Is this the same as the classic Spacebar Clicker?",
                      "acceptedAnswer": { "@type": "Answer", "text": "No. It is a separate enhanced mode with its own mechanics and local save." }
                    },
                    {
                      "@type": "Question",
                      "name": "Does Spacebar Clicker 2 have auto-clickers?",
                      "acceptedAnswer": { "@type": "Answer", "text": "Yes. Micro Bots generate passive points and Reactor Banks multiply automatic production." }
                    },
                    {
                      "@type": "Question",
                      "name": "What does Nova Ascension reset?",
                      "acceptedAnswer": { "@type": "Answer", "text": "It resets current points and standard upgrades. Nova Cores, lifetime records and the permanent Nova bonus remain." }
                    },
                    {
                      "@type": "Question",
                      "name": "Does Spacebar Clicker 2 work on mobile?",
                      "acceptedAnswer": { "@type": "Answer", "text": "Yes. Mobile players can use the on-screen Space button, while desktop players can use the physical Space key." }
                    },
                    {
                      "@type": "Question",
                      "name": "Can I move my Spacebar Clicker 2 save to another browser?",
                      "acceptedAnswer": { "@type": "Answer", "text": "Yes. Copy an SCG2 save code or download a .scg backup file, then restore it in another browser or device. Imported values are validated before replacing the local save." }
                    }
                  ]
                }
              ]
          };
      } else if (viewMode === 'spacebar-clicker' || viewMode === 'spacebar-clicker-unblocked') {
          const unblocked = viewMode === 'spacebar-clicker-unblocked';
          title = unblocked
              ? "Spacebar Clicker Unblocked - Play Instantly in Your Browser"
              : "Spacebar Clicker – Free Space Bar Clicker Game Online";
          desc = unblocked
              ? "Play Spacebar Clicker instantly in your browser with no download or account. Keyboard and mobile controls, upgrades, local save and prestige."
              : "Play Spacebar Clicker free online. Press Space, track CPS, buy upgrades, automate production and prestige for Quantum Keys. No download or account.";
          type = 'website';
          const clickerGameSchema = {
              "@type": "VideoGame",
              "name": unblocked ? "Spacebar Clicker Unblocked" : "Spacebar Clicker",
              "description": desc,
              "genre": ["Clicker", "Incremental", "Idle"],
              "playMode": "SinglePlayer",
              "applicationCategory": "Game",
              "operatingSystem": "Any modern web browser",
              "@id": `https://spaceclickergame.com/${viewMode}/#game`,
              "url": `https://spaceclickergame.com/${viewMode}/`,
              "isAccessibleForFree": true,
              "dateModified": SITE_CONTENT_UPDATED,
              "inLanguage": "en",
              "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
          };
          const clickerBreadcrumbSchema = {
              "@type": "BreadcrumbList",
              "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "Space Clicker Game", "item": "https://spaceclickergame.com/" },
                { "@type": "ListItem", "position": 2, "name": "Spacebar Games", "item": "https://spaceclickergame.com/spacebar-games/" },
                {
                  "@type": "ListItem",
                  "position": 3,
                  "name": unblocked ? "Spacebar Clicker Instant Play" : "Spacebar Clicker",
                  "item": `https://spaceclickergame.com/${viewMode}/`
                }
              ]
          };
          schema = unblocked ? {
              "@context": "https://schema.org",
              "@graph": [
                clickerGameSchema,
                clickerBreadcrumbSchema,
                {
                  "@type": "FAQPage",
                  "mainEntity": [
                    {
                      "@type": "Question",
                      "name": "What does “unblocked” mean on this page?",
                      "acceptedAnswer": { "@type": "Answer", "text": "It means the game opens directly in a browser with no installation, launcher, extension, or account step. It does not bypass network restrictions." }
                    },
                    {
                      "@type": "Question",
                      "name": "Can a school or workplace network still block the game?",
                      "acceptedAnswer": { "@type": "Answer", "text": "Yes. Access depends on the rules applied by the network, device, firewall, parental controls, or administrator." }
                    },
                    {
                      "@type": "Question",
                      "name": "Does the instant-play version save progress?",
                      "acceptedAnswer": { "@type": "Answer", "text": "Yes. Progress is stored locally in the current browser. There is no cloud or cross-device sync." }
                    },
                    {
                      "@type": "Question",
                      "name": "Is this the same Spacebar Clicker game?",
                      "acceptedAnswer": { "@type": "Answer", "text": "Yes. The instant-play route uses the same upgrades, automation, CPS logic, and Hyperdrive prestige system as the main Spacebar Clicker page." }
                    }
                  ]
                }
              ]
          } : {
              "@context": "https://schema.org",
              "@graph": [
                clickerGameSchema,
                clickerBreadcrumbSchema,
                {
                  "@type": "FAQPage",
                  "mainEntity": [
                    {
                      "@type": "Question",
                      "name": "Is Spacebar Clicker free?",
                      "acceptedAnswer": { "@type": "Answer", "text": "Yes. It runs in a modern browser with no download or account required." }
                    },
                    {
                      "@type": "Question",
                      "name": "Does holding Space increase CPS?",
                      "acceptedAnswer": { "@type": "Answer", "text": "No. Repeated keyboard events generated by holding the key are ignored." }
                    },
                    {
                      "@type": "Question",
                      "name": "Does progress sync between devices?",
                      "acceptedAnswer": { "@type": "Answer", "text": "No. Progress is saved locally in the current browser." }
                    },
                    {
                      "@type": "Question",
                      "name": "What survives a prestige reset?",
                      "acceptedAnswer": { "@type": "Answer", "text": "Quantum Keys, lifetime presses, best CPS and achievement progress remain." }
                    },
                    {
                      "@type": "Question",
                      "name": "Can I move my Spacebar Clicker save to another browser?",
                      "acceptedAnswer": { "@type": "Answer", "text": "Yes. Copy a save code or download a .scg backup file, move it to the other browser or device, then paste the code or import the backup file. Imported values are validated before replacing the local save." }
                    }
                  ]
                }
              ]
          };
      } else if (viewMode === 'spacebar-counter') {
          title = "Spacebar Counter - Count Space Bar Presses & CPS";
          desc = "Use a free untimed Spacebar Counter to track total presses, current CPS, average CPS, peak CPS and local best. Keyboard and mobile touch supported.";
          schema = {
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebApplication",
                  "@id": "https://spaceclickergame.com/spacebar-counter/#app",
                  "name": "Spacebar Counter",
                  "description": desc,
                  "applicationCategory": "UtilitiesApplication",
                  "operatingSystem": "Any modern web browser",
                  "url": "https://spaceclickergame.com/spacebar-counter/",
                  "isAccessibleForFree": true,
                  "dateModified": SITE_CONTENT_UPDATED,
                  "inLanguage": "en",
                  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
                },
                {
                  "@type": "BreadcrumbList",
                  "itemListElement": [
                    { "@type": "ListItem", "position": 1, "name": "Space Clicker Game", "item": "https://spaceclickergame.com/" },
                    { "@type": "ListItem", "position": 2, "name": "Spacebar Games", "item": "https://spaceclickergame.com/spacebar-games/" },
                    { "@type": "ListItem", "position": 3, "name": "Spacebar Counter", "item": "https://spaceclickergame.com/spacebar-counter/" }
                  ]
                },
                {
                  "@type": "FAQPage",
                  "mainEntity": [
                    {
                      "@type": "Question",
                      "name": "Does the space bar counter have a time limit?",
                      "acceptedAnswer": { "@type": "Answer", "text": "No. It keeps counting deliberate Space presses until you reset the current session." }
                    },
                    {
                      "@type": "Question",
                      "name": "Can I use this as a spacebar CPS counter?",
                      "acceptedAnswer": { "@type": "Answer", "text": "Yes. The page shows current CPS, average CPS and peak CPS while also keeping the total press count." }
                    },
                    {
                      "@type": "Question",
                      "name": "Does holding the Space key increase the count?",
                      "acceptedAnswer": { "@type": "Answer", "text": "No. Browser-generated repeat events from holding the key are ignored." }
                    },
                    {
                      "@type": "Question",
                      "name": "Is my best count saved?",
                      "acceptedAnswer": { "@type": "Answer", "text": "Yes. The best count is stored locally in this browser and is not uploaded to a public leaderboard." }
                    }
                  ]
                }
              ]
          };
      } else if (viewMode === 'spacebar-clicker-test') {
          title = "Spacebar Clicker Test - Space Bar CPS & Speed Test";
          desc = "Test your spacebar speed with 1, 5, 10, 30 or 60 second CPS tests. Track clicks, average and peak CPS, personal bests and recent local results.";
          schema = {
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebApplication",
                  "@id": "https://spaceclickergame.com/spacebar-clicker-test/#app",
                  "name": "Spacebar Clicker Test",
                  "description": desc,
                  "applicationCategory": "UtilitiesApplication",
                  "operatingSystem": "Any modern web browser",
                  "url": "https://spaceclickergame.com/spacebar-clicker-test/",
                  "isAccessibleForFree": true,
                  "dateModified": SITE_CONTENT_UPDATED,
                  "inLanguage": "en",
                  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
                },
                {
                  "@type": "BreadcrumbList",
                  "itemListElement": [
                    { "@type": "ListItem", "position": 1, "name": "Space Clicker Game", "item": "https://spaceclickergame.com/" },
                    { "@type": "ListItem", "position": 2, "name": "Spacebar Games", "item": "https://spaceclickergame.com/spacebar-games/" },
                    { "@type": "ListItem", "position": 3, "name": "Spacebar Clicker Test", "item": "https://spaceclickergame.com/spacebar-clicker-test/" }
                  ]
                },
                {
                  "@type": "FAQPage",
                  "mainEntity": [
                    {
                      "@type": "Question",
                      "name": "What is a space bar click test?",
                      "acceptedAnswer": { "@type": "Answer", "text": "It measures how many intentional Space presses you can make during a selected time window and converts the result into clicks per second." }
                    },
                    {
                      "@type": "Question",
                      "name": "What does CPS mean in a spacebar speed test?",
                      "acceptedAnswer": { "@type": "Answer", "text": "CPS means clicks per second. Average CPS uses all valid presses over elapsed time, while peak CPS tracks the strongest rolling one-second burst." }
                    },
                    {
                      "@type": "Question",
                      "name": "Can I run a 100-click spacebar test?",
                      "acceptedAnswer": { "@type": "Answer", "text": "Yes. Select the 100-click mode and the result records how long it takes to reach one hundred valid presses." }
                    },
                    {
                      "@type": "Question",
                      "name": "Can I choose a custom test duration?",
                      "acceptedAnswer": { "@type": "Answer", "text": "Yes. Custom mode accepts durations from 1 to 300 seconds and stores the best result locally for that selected mode." }
                    },
                    {
                      "@type": "Question",
                      "name": "What is a good Spacebar CPS score?",
                      "acceptedAnswer": { "@type": "Answer", "text": "There is no universal good CPS threshold across every keyboard and test. Compare results using the same device, browser, test duration, and input rules." }
                    },
                    {
                      "@type": "Question",
                      "name": "What is the difference between CPS and PPS?",
                      "acceptedAnswer": { "@type": "Answer", "text": "CPS means clicks per second and PPS means presses per second. For a Spacebar test they describe the same basic rate here: valid Space presses divided by time." }
                    }
                  ]
                }
              ]
          };
      }

      return { title, description: desc, path: location.pathname, image, type, schema };
  };

  const seoData = getSEOProps();

  // --- ACTIONS ---
  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    setLogs(prev => [{ id: Date.now().toString() + Math.random(), timestamp: new Date(), message, type }, ...prev.slice(0, 19)]);
  };

  const addResources = (amount: number) => {
    const safeAmount = finiteNonNegative(amount);
    if (safeAmount <= 0) return 0;

    const snapshot = gameStateRef.current;
    const currentStardust = snapshot.resources[ResourceType.Stardust];
    const nextStardust = Math.min(MAX_SAFE_RESOURCE_VALUE, currentStardust + safeAmount);
    const credited = Math.max(0, nextStardust - currentStardust);
    if (credited <= 0) return 0;

    const nextResources = {
      ...snapshot.resources,
      [ResourceType.Stardust]: nextStardust
    };
    const nextLifetimeEarnings = Math.min(
      MAX_SAFE_RESOURCE_VALUE,
      snapshot.lifetimeEarnings + credited
    );

    gameStateRef.current = {
      ...snapshot,
      resources: nextResources,
      lifetimeEarnings: nextLifetimeEarnings
    };
    setResources(nextResources);
    setLifetimeEarnings(nextLifetimeEarnings);
    return credited;
  };

  // Restore the intended per-run planet progression defined in PLANETS.
  // Progress only moves forward during a run, so spending Stardust after an
  // unlock never sends the player backward. Galactic Reset explicitly returns
  // planetIndex to 0 and starts this progression again.
  useEffect(() => {
    if (viewMode !== 'game' || activeGame !== 'galaxy_miner') return;
    if (planetIndex >= PLANETS.length - 1) return;

    const stardust = resources[ResourceType.Stardust];
    let nextIndex = planetIndex;

    while (
      nextIndex + 1 < PLANETS.length &&
      stardust >= PLANETS[nextIndex + 1].threshold
    ) {
      nextIndex += 1;
    }

    if (nextIndex > planetIndex) {
      const nextLevel = nextIndex + 1;
      gameStateRef.current = {
        ...gameStateRef.current,
        planetIndex: nextIndex,
        level: nextLevel
      };
      setPlanetIndex(nextIndex);
      setLevel(nextLevel);
      const destination = PLANETS[nextIndex];
      addLog(
        `WARP COMPLETE: ${destination.name.toUpperCase()} • x${destination.productionMultiplier} PRODUCTION`,
        'success'
      );
    }
  }, [viewMode, activeGame, resources, planetIndex]);

  const handleMine = (x: number, y: number, multiplier: number = 1, isGeode: boolean = false): { amount: number, isCrit: boolean } => {
    const preActionHeat = heatRef.current;
    const preActionOverheated = overheatedRef.current;
    if (preActionOverheated && !isGeode) return { amount: 0, isCrit: false };

    const clickSnapshot = gameStateRef.current;
    const nextTotalClicks = Math.min(Number.MAX_SAFE_INTEGER, clickSnapshot.totalClicks + 1);
    gameStateRef.current = { ...clickSnapshot, totalClicks: nextTotalClicks };
    setTotalClicks(nextTotalClicks);

    if (isGeode) {
        const nextHeat = Math.max(0, preActionHeat - 20);
        heatRef.current = nextHeat;
        setHeat(nextHeat);
        addLog("SYSTEM VENTED: -20% HEAT", "info");
    } else {
        const nextHeat = Math.min(100, preActionHeat + 5);
        heatRef.current = nextHeat;
        setHeat(nextHeat);

        if (nextHeat >= 100 && !preActionOverheated) {
            overheatedRef.current = true;
            setOverheated(true);
            if (overheatTimerRef.current !== undefined) {
                window.clearTimeout(overheatTimerRef.current);
            }
            overheatTimerRef.current = window.setTimeout(() => {
                overheatTimerRef.current = undefined;
                overheatedRef.current = false;
                heatRef.current = 0;
                setOverheated(false);
                setHeat(0);
            }, 5000);
            addLog("CRITICAL OVERHEAT! WEAPON DISABLED FOR 5s", "alert");
        }
    }

    const runtimeFlux = preActionHeat >= 80 && preActionHeat < 100 && !preActionOverheated;
    const runtimeCritChance =
        0.05 +
        (((gameStateRef.current.prestigeUpgrades['crit_chance'] || 0) * 5) / 100) +
        (preActionHeat > 50 ? 0.1 : 0) +
        (runtimeFlux ? 0.25 : 0);
    const fluxBonus = runtimeFlux ? 2 : 1;
    const base = getClickPower() * multiplier * fluxBonus;
    const isCrit = Math.random() < runtimeCritChance;
    if (isCrit) {
        const critSnapshot = gameStateRef.current;
        const nextTotalCrits = Math.min(Number.MAX_SAFE_INTEGER, critSnapshot.totalCrits + 1);
        gameStateRef.current = { ...critSnapshot, totalCrits: nextTotalCrits };
        setTotalCrits(nextTotalCrits);
    }

    const finalAmount = isCrit ? base * critMultiplier : base;
    const credited = addResources(finalAmount);
    return { amount: credited, isCrit };
  };

  const hasHeat = heat > 0;

  useEffect(() => {
    if (viewMode !== 'game' || activeGame !== 'galaxy_miner' || overheated || !hasHeat) return;

    const timer = setInterval(() => {
        const nextHeat = Math.max(0, heatRef.current - 2);
        heatRef.current = nextHeat;
        setHeat(nextHeat);
    }, 100);

    return () => clearInterval(timer);
  }, [viewMode, activeGame, hasHeat, overheated]);

  const handleCometCatch = () => {
    const snapshot = gameStateRef.current;
    const nextCometsCaught = Math.min(Number.MAX_SAFE_INTEGER, snapshot.cometsCaught + 1);
    gameStateRef.current = { ...snapshot, cometsCaught: nextCometsCaught };
    setCometsCaught(nextCometsCaught);

    const reward = Math.max(getProductionRate() * 300, getClickPower() * 50);
    const credited = addResources(reward);
    addLog(`COMET CAPTURED! +${formatNumber(credited)} SD`, 'success');
  };

  const handleCrisisResolve = (success: boolean) => {
     if (success) {
         const snapshot = gameStateRef.current;
         const nextCrisesResolved = Math.min(Number.MAX_SAFE_INTEGER, snapshot.crisesResolved + 1);
         gameStateRef.current = { ...snapshot, crisesResolved: nextCrisesResolved };
         setCrisesResolved(nextCrisesResolved);

         const reward = getClickPower() * 200;
         const credited = addResources(reward);
         addLog(`DEFENSE SUCCESS! +${formatNumber(credited)} SD`, 'success');
     } else {
         const snapshot = gameStateRef.current;
         const currentStardust = snapshot.resources[ResourceType.Stardust];
         const penalty = Math.floor(currentStardust * 0.1);
         const nextResources = {
             ...snapshot.resources,
             [ResourceType.Stardust]: Math.max(0, currentStardust - penalty)
         };
         gameStateRef.current = { ...snapshot, resources: nextResources };
         setResources(nextResources);
         addLog(`DEFENSE FAILED! -${formatNumber(penalty)} SD`, 'alert');
     }
  };

  const handleClaimOfflineEarnings = () => {
    if (offlineEarnings.earnedStardust > 0) {
      addLog(`OFFLINE PROGRESS CREDITED: +${formatNumber(offlineEarnings.earnedStardust)} SD`, 'success');
    }
    setOfflineEarnings(prev => ({ ...prev, isOpen: false }));
  };

  const handleBuyUpgrade = (id: string, amountToBuy: number = 1) => {
    const currentSnapshot = gameStateRef.current;
    const upgrade = currentSnapshot.upgrades[id];
    if (!upgrade || amountToBuy < 1) return;

    const remainingLevels = Math.max(0, MAX_SAFE_UPGRADE_COUNT - upgrade.count);
    const purchaseCount = Math.min(Math.floor(amountToBuy), remainingLevels);
    if (purchaseCount < 1) return;

    let totalCost = 0;
    let tempCount = upgrade.count;
    for (let i = 0; i < purchaseCount; i++) {
        totalCost += Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, tempCount));
        tempCount++;
    }

    const currentStardust = currentSnapshot.resources[ResourceType.Stardust];
    if (currentStardust < totalCost) return;

    const newCount = upgrade.count + purchaseCount;
    const nextResources = {
        ...currentSnapshot.resources,
        [ResourceType.Stardust]: currentStardust - totalCost
    };
    const nextUpgrades = {
        ...currentSnapshot.upgrades,
        [id]: { ...upgrade, count: newCount }
    };

    gameStateRef.current = {
        ...currentSnapshot,
        resources: nextResources,
        upgrades: nextUpgrades
    };
    setResources(nextResources);
    setUpgrades(nextUpgrades);

    if (
        (upgrade.count < 25 && newCount >= 25) ||
        (upgrade.count < 50 && newCount >= 50) ||
        (upgrade.count < 100 && newCount >= 100) ||
        (upgrade.count < 200 && newCount >= 200)
    ) {
        addLog(`${upgrade.name} MILESTONE: OUTPUT DOUBLED!`, 'success');
    }
  };

  // --- ROBUST SAVE STATE ---
  // Keep a synchronous snapshot so critical permanent-currency actions can be persisted atomically.
  const gameStateRef = useRef({
      resources, upgrades, prestigeUpgrades, level, planetIndex, lifetimeEarnings,
      totalClicks, totalCrits, cometsCaught, crisesResolved
  });

  useEffect(() => {
      gameStateRef.current = {
          resources, upgrades, prestigeUpgrades, level, planetIndex, lifetimeEarnings,
          totalClicks, totalCrits, cometsCaught, crisesResolved
      };
  }, [resources, upgrades, prestigeUpgrades, level, planetIndex, lifetimeEarnings, totalClicks, totalCrits, cometsCaught, crisesResolved]);

  // Keyboard listeners live outside the render cycle. Keep refs pointed at the
  // newest gameplay handlers so Space/number hotkeys never use stale Heat,
  // Flux, prestige, resource, or planet state.
  const handleMineRef = useRef(handleMine);
  const handleBuyUpgradeRef = useRef(handleBuyUpgrade);
  useEffect(() => {
      handleMineRef.current = handleMine;
      handleBuyUpgradeRef.current = handleBuyUpgrade;
  });

  const handleBuyPrestige = (id: string) => {
    const u = PRESTIGE_UPGRADES.find(p => p.id === id);
    if (!u) return;

    const snapshot = gameStateRef.current;
    const currentLevel = snapshot.prestigeUpgrades[id] || 0;
    const maxLevel = u.maxLevel === -1 ? MAX_SAFE_UNBOUNDED_TECH_LEVEL : u.maxLevel;
    if (currentLevel >= maxLevel) return;

    const cost = Math.floor(u.cost * Math.pow(1.5, currentLevel));
    const currentDarkMatter = snapshot.resources[ResourceType.DarkMatter];
    if (currentDarkMatter < cost) return;

    const nextResources = {
      ...snapshot.resources,
      [ResourceType.DarkMatter]: currentDarkMatter - cost
    };
    const nextPrestigeUpgrades = {
      ...snapshot.prestigeUpgrades,
      [id]: currentLevel + 1
    };
    const nextSnapshot = {
      ...snapshot,
      resources: nextResources,
      prestigeUpgrades: nextPrestigeUpgrades
    };

    gameStateRef.current = nextSnapshot;
    safeSetStorageItem(SAVE_KEY, JSON.stringify({
      ...nextSnapshot,
      version: SAVE_VERSION,
      lastSaveTime: Date.now()
    }));

    setResources(nextResources);
    setPrestigeUpgrades(nextPrestigeUpgrades);
  };

  const handlePrestigeReset = () => {
    const snapshot = gameStateRef.current;
    const currentStardust = snapshot.resources[ResourceType.Stardust];
    const availableDarkMatter = Math.max(0, MAX_SAFE_DARK_MATTER - snapshot.resources[ResourceType.DarkMatter]);
    const availableGain = Math.min(
      Math.floor(5 * Math.sqrt(currentStardust / PRESTIGE_THRESHOLD)),
      availableDarkMatter
    );
    if (availableGain < 1) return;

    const confirmed = window.confirm(
      `Reset current Stardust and standard upgrades for +${formatNumber(availableGain)} Dark Matter? Permanent technology, lifetime stats, and Dark Matter are retained.`
    );
    if (!confirmed) return;

    const resetUpgrades = INITIAL_UPGRADES.reduce((acc, upgrade) => ({
      ...acc,
      [upgrade.id]: { ...upgrade, count: 0 }
    }), {} as { [id: string]: Upgrade });

    const nextResources = {
      [ResourceType.Stardust]: 0,
      [ResourceType.DarkMatter]: snapshot.resources[ResourceType.DarkMatter] + availableGain
    };
    const nextSnapshot = {
      ...snapshot,
      resources: nextResources,
      upgrades: resetUpgrades,
      level: 1,
      planetIndex: 0
    };

    // Persist the permanent-currency transaction before the UI update so an immediate tab close
    // cannot restore the pre-reset save and duplicate Dark Matter.
    gameStateRef.current = nextSnapshot;
    safeSetStorageItem(SAVE_KEY, JSON.stringify({
      ...nextSnapshot,
      version: SAVE_VERSION,
      lastSaveTime: Date.now()
    }));

    setResources(nextResources);
    setUpgrades(resetUpgrades);
    setLevel(1);
    setPlanetIndex(0);
    if (overheatTimerRef.current !== undefined) {
      window.clearTimeout(overheatTimerRef.current);
      overheatTimerRef.current = undefined;
    }
    heatRef.current = 0;
    overheatedRef.current = false;
    setHeat(0);
    setOverheated(false);
    setShowPrestigeShop(true);
    addLog(`GALACTIC RESET COMPLETE: +${formatNumber(availableGain)} DARK MATTER`, 'success');
  };

  const handleScan = async () => {
    if (isScanningRef.current) return;

    const snapshot = gameStateRef.current;
    const currentStardust = snapshot.resources[ResourceType.Stardust];
    if (currentStardust < EVENT_SCAN_COST) return;

    const nextResources = {
      ...snapshot.resources,
      [ResourceType.Stardust]: currentStardust - EVENT_SCAN_COST
    };
    const paidSnapshot = { ...snapshot, resources: nextResources };
    gameStateRef.current = paidSnapshot;
    isScanningRef.current = true;
    setIsScanning(true);
    setResources(nextResources);

    try {
      const event = await generateSpaceEvent({
        resources: nextResources,
        upgrades: paidSnapshot.upgrades,
        level: paidSnapshot.level,
        totalMined: nextResources[ResourceType.Stardust],
        lifetimeEarnings: paidSnapshot.lifetimeEarnings,
        lastSaveTime: Date.now(),
        prestigeUpgrades: paidSnapshot.prestigeUpgrades,
        planetIndex: paidSnapshot.planetIndex,
        heat: heatRef.current,
        overheated: overheatedRef.current
      });

      addLog(event.title, 'event');
      if (event.reward) {
        const planet = PLANETS[paidSnapshot.planetIndex] || PLANETS[0];
        const rewardPrestigeMultiplier =
          1 + paidSnapshot.resources[ResourceType.DarkMatter] * 0.1;
        const reward = event.reward * rewardPrestigeMultiplier * planet.productionMultiplier;
        const credited = addResources(reward);
        addLog(`Reward: ${formatNumber(credited)} SD`, 'success');
      }
    } finally {
      isScanningRef.current = false;
      setIsScanning(false);
    }
  };

  // Modern Navigation Handler (Replaces handleNavigate)
  const handleNavigate = (target: ViewMode, id?: string) => {
    setIs404(false);
    shouldFocusRouteRef.current = true;
    window.scrollTo(0, 0);
    
    if (target === 'home') {
        navigate('/');
    } else if (target === 'game') {
        if (id) navigate(`/game/${id}/`);
        else navigate('/game/galaxy_miner/'); // Default
    } else if (target === 'blog') {
        if (id) navigate(`/blog/${id}/`);
        else navigate('/blog/');
    } else {
        navigate(`/${target}/`);
    }
  };

  // --- ROBUST SAVE SYSTEM ---
  const saveGame = useCallback(() => {
      const data = gameStateRef.current;
      const toSave = {
          ...data,
          version: SAVE_VERSION,
          lastSaveTime: Date.now()
      };
      return safeSetStorageItem(SAVE_KEY, JSON.stringify(toSave));
  }, []);

  const creditHiddenGalaxyProgress = useCallback(() => {
      const hiddenAt = hiddenAtRef.current;
      hiddenAtRef.current = null;
      if (hiddenAt === null) return;

      const now = Date.now();
      const seconds = Math.min(86_400, Math.max(0, (now - hiddenAt) / 1000));
      if (seconds < 60) return;

      const snapshot = gameStateRef.current;
      let baseRate = 0;
      Object.values(snapshot.upgrades).forEach((upgrade: Upgrade) => {
          if (upgrade.type !== 'auto') return;

          let milestoneMult = 1;
          if (upgrade.count >= 25) milestoneMult *= 2;
          if (upgrade.count >= 50) milestoneMult *= 2;
          if (upgrade.count >= 100) milestoneMult *= 2;
          if (upgrade.count >= 200) milestoneMult *= 2;
          if (upgrade.count >= 500) milestoneMult *= 4;

          baseRate += upgrade.baseProduction * upgrade.count * milestoneMult;
      });

      const planetMult = PLANETS[snapshot.planetIndex]?.productionMultiplier || 1;
      const darkMatterMult = 1 + snapshot.resources[ResourceType.DarkMatter] * 0.1;
      const passiveBoost = 1 + ((snapshot.prestigeUpgrades['passive_boost'] || 0) * 0.25);
      const rate = Math.min(
          MAX_SAFE_OFFLINE_RATE,
          baseRate * planetMult * darkMatterMult * passiveBoost
      );
      const theoretical = finiteNonNegative(
          Math.floor(rate * seconds),
          0,
          MAX_SAFE_RESOURCE_VALUE
      );
      if (theoretical <= 0) return;

      const currentStardust = snapshot.resources[ResourceType.Stardust];
      const nextStardust = Math.min(MAX_SAFE_RESOURCE_VALUE, currentStardust + theoretical);
      const credited = Math.max(0, nextStardust - currentStardust);
      if (credited <= 0) return;

      const nextResources = {
          ...snapshot.resources,
          [ResourceType.Stardust]: nextStardust
      };
      const nextLifetimeEarnings = Math.min(
          MAX_SAFE_RESOURCE_VALUE,
          snapshot.lifetimeEarnings + credited
      );
      const nextSnapshot = {
          ...snapshot,
          resources: nextResources,
          lifetimeEarnings: nextLifetimeEarnings
      };

      gameStateRef.current = nextSnapshot;
      safeSetStorageItem(SAVE_KEY, JSON.stringify({
          ...nextSnapshot,
          version: SAVE_VERSION,
          lastSaveTime: now
      }));
      setResources(nextResources);
      setLifetimeEarnings(nextLifetimeEarnings);

      if (viewMode === 'game' && activeGame === 'galaxy_miner') {
          setOfflineEarnings({
              isOpen: true,
              awayTimeSeconds: seconds,
              earnedStardust: credited,
              productionRate: rate
          });
      }
  }, [viewMode, activeGame]);

  const handleImportSave = (data: any) => {
      const validShape =
          data &&
          typeof data === 'object' &&
          data.resources &&
          typeof data.resources === 'object' &&
          !Array.isArray(data.resources) &&
          data.upgrades &&
          typeof data.upgrades === 'object' &&
          !Array.isArray(data.upgrades) &&
          Object.prototype.hasOwnProperty.call(data, 'planetIndex') &&
          Object.prototype.hasOwnProperty.call(data, 'lifetimeEarnings');

      if (!validShape) {
          addLog("IMPORT FAILED: INVALID OR WRONG-GAME SAVE DATA", "alert");
          return;
      }

      const mergedUpgrades = INITIAL_UPGRADES.reduce((acc, upgrade) => {
          const savedUpgrade = data.upgrades?.[upgrade.id];
          acc[upgrade.id] = {
              ...upgrade,
              count: safeNonNegativeInt(savedUpgrade?.count, 0, MAX_SAFE_UPGRADE_COUNT)
          };
          return acc;
      }, {} as { [id: string]: Upgrade });

      const nextResources = {
          [ResourceType.Stardust]: finiteNonNegative(data.resources?.[ResourceType.Stardust]),
          [ResourceType.DarkMatter]: finiteNonNegative(
              data.resources?.[ResourceType.DarkMatter],
              0,
              MAX_SAFE_DARK_MATTER
          )
      };

      const nextPrestige = PRESTIGE_UPGRADES.reduce((acc, tech) => {
          const maxLevel = tech.maxLevel === -1 ? MAX_SAFE_UNBOUNDED_TECH_LEVEL : tech.maxLevel;
          acc[tech.id] = safeNonNegativeInt(data.prestigeUpgrades?.[tech.id], 0, maxLevel);
          return acc;
      }, {} as { [id: string]: number });

      const nextPlanetIndex = safeNonNegativeInt(data.planetIndex, 0, PLANETS.length - 1);
      const nextLevel = nextPlanetIndex + 1;
      const nextLifetime = finiteNonNegative(data.lifetimeEarnings);
      const nextClicks = safeNonNegativeInt(data.totalClicks);
      const nextCrits = safeNonNegativeInt(data.totalCrits);
      const nextComets = safeNonNegativeInt(data.cometsCaught);
      const nextCrises = safeNonNegativeInt(data.crisesResolved);

      setResources(nextResources);
      setUpgrades(mergedUpgrades);
      setPrestigeUpgrades(nextPrestige);
      setLevel(nextLevel);
      setPlanetIndex(nextPlanetIndex);
      setLifetimeEarnings(nextLifetime);
      setTotalClicks(nextClicks);
      setTotalCrits(nextCrits);
      setCometsCaught(nextComets);
      setCrisesResolved(nextCrises);

      const normalized = {
          resources: nextResources,
          upgrades: mergedUpgrades,
          prestigeUpgrades: nextPrestige,
          level: nextLevel,
          planetIndex: nextPlanetIndex,
          lifetimeEarnings: nextLifetime,
          totalClicks: nextClicks,
          totalCrits: nextCrits,
          cometsCaught: nextComets,
          crisesResolved: nextCrises
      };
      gameStateRef.current = normalized;
      const persisted = safeSetStorageItem(
          SAVE_KEY,
          JSON.stringify({ ...normalized, version: SAVE_VERSION, lastSaveTime: Date.now() })
      );
      addLog(
          persisted
              ? "TELEMETRY BACKUP RESTORED SUCCESSFULLY"
              : "BACKUP RESTORED FOR THIS SESSION; BROWSER STORAGE IS UNAVAILABLE",
          persisted ? "success" : "alert"
      );
  };

  // Initialize Loading & Offline Progress
  useEffect(() => {
      const saved = safeGetStorageItem(SAVE_KEY);
      if (!saved) return;

      try {
          const data = JSON.parse(saved);
          if (!data || typeof data !== 'object') throw new Error('Invalid save payload');

          const loadedResources = {
              [ResourceType.Stardust]: finiteNonNegative(data.resources?.[ResourceType.Stardust]),
              [ResourceType.DarkMatter]: finiteNonNegative(
                  data.resources?.[ResourceType.DarkMatter],
                  0,
                  MAX_SAFE_DARK_MATTER
              )
          };

          const loadedUpgrades = INITIAL_UPGRADES.reduce((acc, upgrade) => {
              const savedUpgrade = data.upgrades?.[upgrade.id];
              const count = safeNonNegativeInt(savedUpgrade?.count, 0, MAX_SAFE_UPGRADE_COUNT);
              acc[upgrade.id] = { ...upgrade, count };
              return acc;
          }, {} as { [id: string]: Upgrade });

          const loadedPrestige = PRESTIGE_UPGRADES.reduce((acc, tech) => {
              const maxLevel = tech.maxLevel === -1 ? MAX_SAFE_UNBOUNDED_TECH_LEVEL : tech.maxLevel;
              acc[tech.id] = safeNonNegativeInt(data.prestigeUpgrades?.[tech.id], 0, maxLevel);
              return acc;
          }, {} as { [id: string]: number });

          const nextPlanetIndex = safeNonNegativeInt(data.planetIndex, 0, PLANETS.length - 1);
          const nextLevel = nextPlanetIndex + 1;
          const nextClicks = safeNonNegativeInt(data.totalClicks);
          const nextCrits = safeNonNegativeInt(data.totalCrits);
          const nextComets = safeNonNegativeInt(data.cometsCaught);
          const nextCrises = safeNonNegativeInt(data.crisesResolved);
          const savedLifetime = finiteNonNegative(data.lifetimeEarnings);

          const now = Date.now();
          const elapsedSeconds = data.lastSaveTime
              ? Math.max(0, Math.floor((now - Number(data.lastSaveTime)) / 1000))
              : 0;
          const cappedSecs = Math.min(elapsedSeconds, 86400);

          let effectiveRate = 0;
          let totalEarned = 0;

          if (cappedSecs >= 60) {
              let baseRate = 0;
              Object.values(loadedUpgrades).forEach((upgrade) => {
                  if (upgrade.type !== 'auto') return;
                  const milestoneMult = getMilestoneMultiplier(upgrade.count);
                  baseRate += upgrade.baseProduction * upgrade.count * milestoneMult;
              });

              const planetMult = PLANETS[nextPlanetIndex]?.productionMultiplier || 1;
              const darkMatterMult = 1 + (loadedResources[ResourceType.DarkMatter] * 0.1);
              const passiveBoost = 1 + ((loadedPrestige['passive_boost'] || 0) * 0.25);
              effectiveRate = Math.min(
                  MAX_SAFE_OFFLINE_RATE,
                  baseRate * planetMult * darkMatterMult * passiveBoost
              );
              totalEarned = finiteNonNegative(
                  Math.floor(cappedSecs * effectiveRate),
                  0,
                  MAX_SAFE_RESOURCE_VALUE
              );
          }

          // Credit offline production before showing the modal. The save is written
          // immediately so closing or refreshing before dismissing the modal cannot
          // lose the reward or award it twice.
          const creditedResources = {
              ...loadedResources,
              [ResourceType.Stardust]: finiteNonNegative(
                  loadedResources[ResourceType.Stardust] + totalEarned,
                  0,
                  MAX_SAFE_RESOURCE_VALUE
              )
          };
          const creditedAmount = Math.max(
              0,
              creditedResources[ResourceType.Stardust] - loadedResources[ResourceType.Stardust]
          );
          const creditedLifetime = finiteNonNegative(
              savedLifetime + creditedAmount,
              0,
              MAX_SAFE_RESOURCE_VALUE
          );

          const normalized = {
              resources: creditedResources,
              upgrades: loadedUpgrades,
              prestigeUpgrades: loadedPrestige,
              level: nextLevel,
              planetIndex: nextPlanetIndex,
              lifetimeEarnings: creditedLifetime,
              totalClicks: nextClicks,
              totalCrits: nextCrits,
              cometsCaught: nextComets,
              crisesResolved: nextCrises
          };

          gameStateRef.current = normalized;
          safeSetStorageItem(SAVE_KEY, JSON.stringify({
              ...normalized,
              version: SAVE_VERSION,
              lastSaveTime: now
          }));

          setResources(creditedResources);
          setUpgrades(loadedUpgrades);
          setPrestigeUpgrades(loadedPrestige);
          setLevel(nextLevel);
          setPlanetIndex(nextPlanetIndex);
          setLifetimeEarnings(creditedLifetime);
          setTotalClicks(nextClicks);
          setTotalCrits(nextCrits);
          setCometsCaught(nextComets);
          setCrisesResolved(nextCrises);

          if (creditedAmount > 0) {
              setOfflineEarnings({
                  isOpen: true,
                  awayTimeSeconds: cappedSecs,
                  earnedStardust: creditedAmount,
                  productionRate: effectiveRate
              });
          }
      } catch (error) {
          console.error("Failed to load save", error);
      }
  }, []);

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (viewMode !== 'game' || activeGame !== 'galaxy_miner') return;

      const hasOpenLayer =
        showStatsModal ||
        showPrestigeShop ||
        showHotkeysOverlay ||
        showMobileShop ||
        offlineEarnings.isOpen;

      if (e.key === 'Escape') {
        if (showStatsModal) setShowStatsModal(false);
        else if (showPrestigeShop) setShowPrestigeShop(false);
        else if (showHotkeysOverlay) setShowHotkeysOverlay(false);
        else if (showMobileShop) setShowMobileShop(false);
        else if (offlineEarnings.isOpen) setOfflineEarnings(prev => ({ ...prev, isOpen: false }));
        return;
      }

      if (isInteractiveKeyboardTarget(e.target)) return;

      // Do not let gameplay shortcuts fire through a modal or mobile drawer.
      if (hasOpenLayer) return;

      if (e.code === 'Space') {
        e.preventDefault();
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;
        handleMineRef.current(cx, cy);
      } else if (e.key >= '1' && e.key <= '8') {
        const index = parseInt(e.key) - 1;
        const upgradeList = Object.values(gameStateRef.current.upgrades);
        if (upgradeList[index]) {
          handleBuyUpgradeRef.current(upgradeList[index].id, 1);
        }
      } else if (e.key === 'm' || e.key === 'M') {
        const nextMute = !getMuteState();
        toggleMute(nextMute);
        addLog(`AUDIO ${nextMute ? 'MUTED' : 'UNMUTED'}`, 'info');
      } else if (e.key === 'p' || e.key === 'P') {
        setShowPrestigeShop(true);
      } else if (e.key === 's' || e.key === 'S') {
        setShowStatsModal(true);
      } else if (e.key === 'h' || e.key === 'H' || e.key === '?') {
        setShowHotkeysOverlay(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    viewMode,
    activeGame,
    showStatsModal,
    showPrestigeShop,
    showHotkeysOverlay,
    showMobileShop,
    offlineEarnings.isOpen
  ]);

  // Save interval plus page-lifecycle persistence.
  useEffect(() => {
      const timer = setInterval(() => {
          if (!document.hidden) saveGame();
      }, AUTO_SAVE_INTERVAL);

      const handleVisibilityChange = () => {
          if (document.visibilityState === 'hidden') {
              if (hiddenAtRef.current === null) hiddenAtRef.current = Date.now();
              saveGame();
              return;
          }
          creditHiddenGalaxyProgress();
      };

      const handlePageHide = () => {
          if (!document.hidden) saveGame();
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('pagehide', handlePageHide);

      return () => {
          clearInterval(timer);
          document.removeEventListener('visibilitychange', handleVisibilityChange);
          window.removeEventListener('pagehide', handlePageHide);
          if (!document.hidden) saveGame();
      };
  }, [saveGame, creditHiddenGalaxyProgress]);

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
                              hapticEnabled={hapticEnabled}
                              screenShakeEnabled={screenShakeEnabled}
                          />
                          <GoldenComet onCatch={handleCometCatch} />
                          <CrisisEvent onResolve={handleCrisisResolve} />
                          <button
                            type="button"
                            onClick={() => setShowPrestigeShop(true)}
                            className="absolute bottom-4 left-4 md:bottom-auto md:left-auto md:top-4 md:right-4 z-40 min-h-11 rounded-lg border border-neon-purple/50 bg-space-900/95 px-3 py-2 text-xs font-bold text-neon-purple hover:bg-neon-purple hover:text-black transition-colors"
                          >
                            <span>VOID TECH</span>
                             {canPrestige && <span className="hidden sm:inline"> • +{prestigeGain} DM READY</span>}
                             {canPrestige && <span className="sm:hidden"> • +{prestigeGain} DM</span>}
                          </button>
                          
                          <button 
                            className="md:hidden absolute bottom-4 right-4 z-50 min-h-11 px-4 py-2.5 bg-neon-blue text-black rounded-full font-bold shadow-lg"
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
                          <div
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="mobile-fabricator-title"
                            className="absolute inset-0 z-[100] bg-black/90 md:hidden flex flex-col animate-in slide-in-from-bottom safe-area-panel-bottom"
                          >
                              <div className="p-4 flex justify-between items-center bg-space-800">
                                  <h2 id="mobile-fabricator-title" className="font-display font-bold text-white">FABRICATOR</h2>
                                  <button
                                    type="button"
                                    aria-label="Close upgrade fabricator"
                                    onClick={() => setShowMobileShop(false)}
                                    className="min-w-11 min-h-11 text-gray-400 text-2xl"
                                  >
                                    ✕
                                  </button>
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

  // --- RENDER ---
  return (
    <>
        <SEOHead 
            title={seoData.title}
            description={seoData.description}
            path={seoData.path}
            image={seoData.image}
            type={seoData.type}
            schema={seoData.schema}
            noindex={is404}
        />

        {viewMode === 'game' && !is404 && (
            <Suspense fallback={null}>
                <HotkeyOverlay 
                    isOpen={showHotkeysOverlay}
                    onClose={() => setShowHotkeysOverlay(false)}
                    onToggle={() => setShowHotkeysOverlay(prev => !prev)}
                />

                <StatsAndSaveModal
                    isOpen={showStatsModal}
                    onClose={() => setShowStatsModal(false)}
                    resources={resources}
                    lifetimeEarnings={lifetimeEarnings}
                    totalClicks={totalClicks}
                    totalCrits={totalCrits}
                    cometsCaught={cometsCaught}
                    crisesResolved={crisesResolved}
                    productionRate={getProductionRate()}
                    clickPower={getClickPower()}
                    currentPlanet={currentPlanet}
                    level={level}
                    planetIndex={planetIndex}
                    upgrades={upgrades}
                    prestigeUpgrades={prestigeUpgrades}
                    hapticEnabled={hapticEnabled}
                    onToggleHaptic={toggleHaptic}
                    screenShakeEnabled={screenShakeEnabled}
                    onToggleScreenShake={toggleScreenShake}
                    onImportSave={handleImportSave}
                    onResetGame={() => {
                        if (!safeRemoveStorageItem(SAVE_KEY)) {
                            addLog("RESET FAILED: BROWSER STORAGE UNAVAILABLE", "alert");
                            return;
                        }
                        window.location.reload();
                    }}
                />

                <OfflineEarningsModal 
                    isOpen={offlineEarnings.isOpen}
                    awayTimeSeconds={offlineEarnings.awayTimeSeconds}
                    earnedStardust={offlineEarnings.earnedStardust}
                    productionRate={offlineEarnings.productionRate}
                    onClaim={handleClaimOfflineEarnings}
                />

                {showPrestigeShop && (
                    <PrestigeShop
                        darkMatter={resources[ResourceType.DarkMatter]}
                        upgrades={prestigeUpgrades}
                        prestigeGain={prestigeGain}
                        canPrestige={canPrestige}
                        thresholdLabel={formatNumber(PRESTIGE_THRESHOLD)}
                        onPrestige={handlePrestigeReset}
                        onBuy={handleBuyPrestige}
                        onClose={() => setShowPrestigeShop(false)}
                    />
                )}
            </Suspense>
        )}

        {is404 ? (
            <NotFoundPage onNavigate={handleNavigate} />
        ) : viewMode === 'game' ? (
            <Suspense fallback={<LoadingSimulation />}>
            <StarshipConsole 
                activeGame={activeGame} 
                onSwitchGame={(id) => handleNavigate('game', id)}
                onGoHome={() => handleNavigate('home')}
                onOpenStats={activeGame === 'galaxy_miner' ? () => setShowStatsModal(true) : undefined}
                onManualSave={activeGame === 'galaxy_miner' ? () => {
                    const persisted = saveGame();
                    addLog(
                        persisted ? "GAME SAVED MANUALLY" : "MANUAL SAVE FAILED: BROWSER STORAGE UNAVAILABLE",
                        persisted ? "success" : "alert"
                    );
                    return persisted;
                } : undefined}
            >
                <div className="w-full relative flex flex-col">
                    <div className="game-viewport relative min-h-0 w-full flex flex-col">
                        <div className="flex-1 relative overflow-hidden">
                            <Suspense fallback={<LoadingSimulation />}>
                                {renderActiveGame()}
                            </Suspense>
                            <Suspense fallback={null}>
                                <InterstellarComms activeGame={activeGame} onSwitchGame={(id) => handleNavigate('game', id)} />
                            </Suspense>
                        </div>
                    </div>
                    
                    <div className="relative z-10 bg-space-950 border-t border-white/10">
                        <SEOContent game={currentGameMeta} />
                    </div>
                </div>
            </StarshipConsole>
            </Suspense>
        ) : (
            <SiteLayout currentView={viewMode} onNavigate={handleNavigate}>
                {viewMode === 'home' && (
                    <LandingPage 
                        onStart={(id) => handleNavigate('game', id)}
                        onNavigate={handleNavigate}
                        heroSlot={undefined} 
                    />
                )}

                {viewMode === 'compare' && <Suspense fallback={<LoadingSimulation />}><ComparisonPage onNavigate={handleNavigate} /></Suspense>}
                {viewMode === 'achievements' && <Suspense fallback={<LoadingSimulation />}><AchievementsPage onNavigate={handleNavigate} /></Suspense>}
                {viewMode === 'spacebar-games' && <Suspense fallback={<LoadingSimulation />}><SpacebarGamesPage /></Suspense>}
                {viewMode === 'spacebar-clicker-2' && <Suspense fallback={<LoadingSimulation />}><SpacebarClicker2 /></Suspense>}
                {viewMode === 'spacebar-clicker' && <Suspense fallback={<LoadingSimulation />}><SpacebarGame /></Suspense>}
                {viewMode === 'spacebar-counter' && <Suspense fallback={<LoadingSimulation />}><SpacebarCounter /></Suspense>}
                {viewMode === 'spacebar-clicker-test' && <Suspense fallback={<LoadingSimulation />}><SpacebarClickerTest /></Suspense>}
                {viewMode === 'spacebar-clicker-unblocked' && <Suspense fallback={<LoadingSimulation />}><SpacebarGame mode="unblocked" /></Suspense>}
                {viewMode === 'blog' && <Suspense fallback={<LoadingSimulation />}><BlogPage postId={activePostId} onNavigate={handleNavigate} /></Suspense>}
                {viewMode === 'about' && <Suspense fallback={<LoadingSimulation />}><AboutPage /></Suspense>}
                {viewMode === 'contact' && <Suspense fallback={<LoadingSimulation />}><ContactPage /></Suspense>}
                {viewMode === 'privacy' && <Suspense fallback={<LoadingSimulation />}><PrivacyPage /></Suspense>}
                {viewMode === 'terms' && <Suspense fallback={<LoadingSimulation />}><TermsPage /></Suspense>}
                {viewMode === 'cookies' && <Suspense fallback={<LoadingSimulation />}><CookiesPage /></Suspense>}
                {viewMode === 'sitemap' && <Suspense fallback={<LoadingSimulation />}><SitemapPage /></Suspense>}
            </SiteLayout>
        )}
    </>
  );
};

export default App;