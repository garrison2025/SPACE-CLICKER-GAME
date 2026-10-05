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

const finiteNonNegative = (value: unknown, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.max(0, parsed) : fallback;
};

const safeNonNegativeInt = (value: unknown, fallback = 0, max = Number.MAX_SAFE_INTEGER) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(max, Math.max(0, Math.floor(parsed)));
};

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

const GAME_SEO: Record<GameId, { title: string; description: string; genres: string[] }> = {
  galaxy_miner: {
    title: 'Galaxy Miner – Space Mining Idle Clicker Online',
    description: 'Play Galaxy Miner online: mine Stardust, automate a space economy, manage Heat Flux, catch Golden Comets, and reset for permanent Dark Matter upgrades.',
    genres: ['Clicker', 'Incremental', 'Idle', 'Sci-Fi']
  },
  mars_colony: {
    title: 'Mars Colony Idle - Free Space Strategy Game',
    description: 'Build and balance a browser-based Mars colony with Oxygen, Food, Energy, population growth, and idle resource progression.',
    genres: ['Idle', 'Management', 'Strategy', 'Simulation']
  },
  star_defense: {
    title: 'Star Defense - Free Space Defense Clicker',
    description: 'Defend your mothership from alien waves, click enemies for direct damage, and upgrade auto-turrets in a browser defense game.',
    genres: ['Clicker', 'Defense', 'Action', 'Sci-Fi']
  },
  merge_ships: {
    title: 'Merge Spaceships - Free Browser Merge Game',
    description: 'Drag and combine matching ships, evolve higher-level vessels, and place your fleet in orbit for passive income.',
    genres: ['Merge', 'Idle', 'Casual', 'Collection']
  },
  gravity_idle: {
    title: 'Gravity Idle - Free Physics Idle Game',
    description: 'Launch projectiles into gravity wells, automate firing, upgrade orbital mechanics, and break apart asteroid layers in your browser.',
    genres: ['Idle', 'Physics', 'Simulation', 'Sci-Fi']
  },
  deep_signal: {
    title: 'Deep Space Signal - Free Browser Text Adventure',
    description: 'Send signals, manage energy, decode strange transmissions, and uncover a text-based deep-space mystery in your browser.',
    genres: ['Text Adventure', 'Mystery', 'Sci-Fi', 'Single Player']
  }
};

// Define valid views for strict routing
const VALID_VIEWS: ViewMode[] = ['home', 'game', 'about', 'contact', 'privacy', 'terms', 'cookies', 'blog', 'sitemap', 'compare', 'achievements', 'spacebar-clicker', 'spacebar-counter', 'spacebar-clicker-test', 'spacebar-clicker-unblocked', 'spacebar-games', 'spacebar-clicker-2'];

// Loading Spinner for Suspense
const LoadingSimulation = () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-black text-neon-blue font-mono space-y-4">
        <div className="w-12 h-12 border-4 border-neon-blue border-t-transparent rounded-full animate-spin"></div>
        <div className="text-sm tracking-widest animate-pulse">INITIALIZING SIMULATION...</div>
    </div>
);


const App: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

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
            newPath = `/${legacyView}`;
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
      } else if (path.startsWith('/game')) {
          view = 'game';
          const parts = path.split('/');
          const id = parts[2];
          if (id && GAMES_CATALOG.some(g => g.id === id)) {
              gameId = id as GameId;
          } else if (id) {
              error = true; // Invalid game ID
          }
      } else if (path.startsWith('/blog')) {
          view = 'blog';
          const parts = path.split('/');
          const id = parts[2];
          if (id) {
              if (BLOG_POST_META.some(p => p.slug === id || p.id === id)) {
                  postId = id;
              } else {
                  error = true;
              }
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
  }, [location.pathname]);
  
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
  
  // Telemetry & Stats State
  const [totalClicks, setTotalClicks] = useState(0);
  const [totalCrits, setTotalCrits] = useState(0);
  const [cometsCaught, setCometsCaught] = useState(0);
  const [crisesResolved, setCrisesResolved] = useState(0);
  
  // Modals & Settings State
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showHotkeysOverlay, setShowHotkeysOverlay] = useState(false);
  const [hapticEnabled, setHapticEnabled] = useState<boolean>(() => localStorage.getItem('space_haptic') !== 'false');
  const [screenShakeEnabled, setScreenShakeEnabled] = useState<boolean>(() => localStorage.getItem('space_screenshake') !== 'false');
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

  const toggleHaptic = () => {
    setHapticEnabled(prev => {
      const next = !prev;
      localStorage.setItem('space_haptic', String(next));
      return next;
    });
  };

  const toggleScreenShake = () => {
    setScreenShakeEnabled(prev => {
      const next = !prev;
      localStorage.setItem('space_screenshake', String(next));
      return next;
    });
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
  const prestigeGain = Math.floor(5 * Math.sqrt(resources[ResourceType.Stardust] / PRESTIGE_THRESHOLD));
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

    const timer = setInterval(() => {
        const now = Date.now();
        const elapsedSeconds = Math.min(86400, Math.max(0, (now - lastTick) / 1000));
        lastTick = now;
        const earned = rate * elapsedSeconds;
        if (earned <= 0) return;

        setResources(prev => ({
            ...prev,
            [ResourceType.Stardust]: prev[ResourceType.Stardust] + earned
        }));
        setLifetimeEarnings(prev => prev + earned);
    }, intervalTime);

    return () => clearInterval(timer);
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
      let image = DEFAULT_OG_IMAGE;
      let type: 'website' | 'game' | 'article' = 'website';
      let schema: any = undefined;

      if (viewMode === 'game') {
          const game = GAMES_CATALOG.find(g => g.id === activeGame);
          if (game) {
              const gameSeo = GAME_SEO[game.id];
              title = gameSeo.title;
              desc = gameSeo.description;
              image = GAME_OG_IMAGES[game.id] || DEFAULT_OG_IMAGE;
              type = 'game';
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
      } else if (viewMode === 'blog' && activePostId) {
          const post = BLOG_POST_META.find(p => p.slug === activePostId || p.id === activePostId);
          if (post) {
              title = `${post.title} | Space Clicker Game Blog`;
              desc = post.excerpt;
              if (post.image) image = post.image;
              type = 'article';
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
                "publisher": {
                  "@type": "Organization",
                  "name": "Space Clicker Game"
                }
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
          desc = "Compare gameplay structure, automation, prestige, events, and presentation across Space Clicker Game and several well-known incremental games.";
      } else if (viewMode === 'achievements') {
          title = "Galaxy Miner Milestones & Progress Tracker | Space Clicker Game";
          desc = "Track Galaxy Miner mining, automation, and Dark Matter milestones from your local browser save.";
      } else if (viewMode === 'about') {
          title = "About | Space Clicker Game";
          desc = "Learn how SpaceClickerGame.com is built around free browser clicker, idle, strategy, and Spacebar experiences with local-first gameplay.";
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
                  "name": "Spacebar Games",
                  "description": desc,
                  "url": "https://spaceclickergame.com/spacebar-games/"
                },
                {
                  "@type": "ItemList",
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
                  "@type": "FAQPage",
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
                      "acceptedAnswer": { "@type": "Answer", "text": "No. Current game progress is stored locally in the browser on the device being used." }
                    }
                  ]
                }
              ]
          };
      } else if (viewMode === 'spacebar-clicker-2') {
          title = "Spacebar Clicker 2 - Upgraded Idle Space Bar Game";
          desc = "Play Spacebar Clicker 2, an enhanced browser idle game with Overdrive, auto-production, upgrades, offline earnings and Nova Core ascension.";
          type = 'game';
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
                  "url": "https://spaceclickergame.com/spacebar-clicker-2/",
                  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
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
              : "Play Spacebar Clicker free online. Press Space for points, buy upgrades, automate production, track CPS, and prestige for permanent Quantum Keys.";
          type = 'game';
          const clickerGameSchema = {
              "@type": "VideoGame",
              "name": unblocked ? "Spacebar Clicker Unblocked" : "Spacebar Clicker",
              "description": desc,
              "genre": ["Clicker", "Incremental", "Idle"],
              "playMode": "SinglePlayer",
              "applicationCategory": "Game",
              "operatingSystem": "Any modern web browser",
              "url": `https://spaceclickergame.com/${viewMode}/`,
              "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
          };
          schema = unblocked ? {
              "@context": "https://schema.org",
              "@graph": [
                clickerGameSchema,
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
                    }
                  ]
                }
              ]
          };
      } else if (viewMode === 'spacebar-counter') {
          title = "Spacebar Counter - Count Space Bar Presses & CPS";
          desc = "Free online Spacebar Counter with total presses, current CPS, average CPS, peak CPS and local best. Works with keyboard and mobile touch.";
          schema = {
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebApplication",
                  "name": "Spacebar Counter",
                  "applicationCategory": "UtilitiesApplication",
                  "operatingSystem": "Any modern web browser",
                  "url": "https://spaceclickergame.com/spacebar-counter/",
                  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
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
          desc = "Test your spacebar speed with 1, 5, 10, 30 or 60 second CPS tests. See clicks, average CPS, peak CPS and your best local score.";
          schema = {
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebApplication",
                  "name": "Spacebar Clicker Test",
                  "applicationCategory": "UtilitiesApplication",
                  "operatingSystem": "Any modern web browser",
                  "url": "https://spaceclickergame.com/spacebar-clicker-test/",
                  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
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
                    }
                  ]
                }
              ]
          };
      } else {
          title = `${viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} | Space Clicker Game`;
      }

      return { title, description: desc, path: location.pathname, image, type, schema };
  };

  const seoData = getSEOProps();

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

    setTotalClicks(prev => prev + 1);

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
    if (isCrit) setTotalCrits(prev => prev + 1);

    const finalAmount = isCrit ? base * critMultiplier : base;
    addResources(finalAmount);
    return { amount: finalAmount, isCrit };
  };

  useEffect(() => {
    if (viewMode !== 'game' || activeGame !== 'galaxy_miner' || overheated || heat <= 0) return;

    const timer = setInterval(() => {
        setHeat(prev => Math.max(0, prev - 2));
    }, 100);
    return () => clearInterval(timer);
  }, [viewMode, activeGame, heat, overheated]);

  const handleCometCatch = () => {
    setCometsCaught(prev => prev + 1);
    const reward = Math.max(getProductionRate() * 300, getClickPower() * 50);
    addResources(reward);
    addLog(`COMET CAPTURED! +${formatNumber(reward)} SD`, 'success');
  };

  const handleCrisisResolve = (success: boolean) => {
     if (success) {
         setCrisesResolved(prev => prev + 1);
         const reward = getClickPower() * 200;
         addResources(reward);
         addLog(`DEFENSE SUCCESS! +${formatNumber(reward)} SD`, 'success');
     } else {
         const penalty = Math.floor(resources[ResourceType.Stardust] * 0.1);
         setResources(prev => ({ ...prev, [ResourceType.Stardust]: Math.max(0, prev[ResourceType.Stardust] - penalty) }));
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

    const currentLevel = prestigeUpgrades[id] || 0;
    if (u.maxLevel !== -1 && currentLevel >= u.maxLevel) return;

    const cost = Math.floor(u.cost * Math.pow(1.5, currentLevel));
    if (resources[ResourceType.DarkMatter] < cost) return;

    const nextResources = {
      ...resources,
      [ResourceType.DarkMatter]: resources[ResourceType.DarkMatter] - cost
    };
    const nextPrestigeUpgrades = {
      ...prestigeUpgrades,
      [id]: currentLevel + 1
    };
    const nextSnapshot = {
      ...gameStateRef.current,
      resources: nextResources,
      prestigeUpgrades: nextPrestigeUpgrades
    };

    gameStateRef.current = nextSnapshot;
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      ...nextSnapshot,
      version: SAVE_VERSION,
      lastSaveTime: Date.now()
    }));

    setResources(nextResources);
    setPrestigeUpgrades(nextPrestigeUpgrades);
  };

  const handlePrestigeReset = () => {
    if (!canPrestige) return;
    const confirmed = window.confirm(
      `Reset current Stardust and standard upgrades for +${prestigeGain} Dark Matter? Permanent technology, lifetime stats, and Dark Matter are retained.`
    );
    if (!confirmed) return;

    const resetUpgrades = INITIAL_UPGRADES.reduce((acc, upgrade) => ({
      ...acc,
      [upgrade.id]: { ...upgrade, count: 0 }
    }), {} as { [id: string]: Upgrade });

    const nextResources = {
      [ResourceType.Stardust]: 0,
      [ResourceType.DarkMatter]: resources[ResourceType.DarkMatter] + prestigeGain
    };
    const nextSnapshot = {
      ...gameStateRef.current,
      resources: nextResources,
      upgrades: resetUpgrades,
      level: 1,
      planetIndex: 0
    };

    // Persist the permanent-currency transaction before the UI update so an immediate tab close
    // cannot restore the pre-reset save and duplicate Dark Matter.
    gameStateRef.current = nextSnapshot;
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      ...nextSnapshot,
      version: SAVE_VERSION,
      lastSaveTime: Date.now()
    }));

    setResources(nextResources);
    setUpgrades(resetUpgrades);
    setLevel(1);
    setPlanetIndex(0);
    setHeat(0);
    setOverheated(false);
    setShowPrestigeShop(true);
    addLog(`GALACTIC RESET COMPLETE: +${prestigeGain} DARK MATTER`, 'success');
  };

  const handleScan = async () => {
    if (resources[ResourceType.Stardust] < EVENT_SCAN_COST) return;
    setIsScanning(true);
    setResources(prev => ({...prev, [ResourceType.Stardust]: prev[ResourceType.Stardust] - EVENT_SCAN_COST}));
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

  // Modern Navigation Handler (Replaces handleNavigate)
  const handleNavigate = (target: ViewMode, id?: string) => {
    setIs404(false);
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
      localStorage.setItem(SAVE_KEY, JSON.stringify(toSave));
  }, []);

  const handleImportSave = (data: any) => {
      if (!data || typeof data !== 'object') {
          addLog("IMPORT FAILED: INVALID SAVE DATA", "alert");
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
          [ResourceType.DarkMatter]: finiteNonNegative(data.resources?.[ResourceType.DarkMatter])
      };

      const nextPrestige = PRESTIGE_UPGRADES.reduce((acc, tech) => {
          const maxLevel = tech.maxLevel === -1 ? MAX_SAFE_UNBOUNDED_TECH_LEVEL : tech.maxLevel;
          acc[tech.id] = safeNonNegativeInt(data.prestigeUpgrades?.[tech.id], 0, maxLevel);
          return acc;
      }, {} as { [id: string]: number });

      const nextLevel = Math.max(1, safeNonNegativeInt(data.level, 1, 1_000_000));
      const nextPlanetIndex = safeNonNegativeInt(data.planetIndex, 0, PLANETS.length - 1);
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
      localStorage.setItem(SAVE_KEY, JSON.stringify({ ...normalized, version: SAVE_VERSION, lastSaveTime: Date.now() }));
      addLog("TELEMETRY BACKUP RESTORED SUCCESSFULLY", "success");
  };

  // Initialize Loading & Offline Progress
  useEffect(() => {
      const saved = localStorage.getItem(SAVE_KEY);
      if (!saved) return;

      try {
          const data = JSON.parse(saved);
          if (!data || typeof data !== 'object') throw new Error('Invalid save payload');

          const loadedResources = {
              [ResourceType.Stardust]: finiteNonNegative(data.resources?.[ResourceType.Stardust]),
              [ResourceType.DarkMatter]: finiteNonNegative(data.resources?.[ResourceType.DarkMatter])
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

          const nextLevel = Math.max(1, safeNonNegativeInt(data.level, 1, 1_000_000));
          const nextPlanetIndex = safeNonNegativeInt(data.planetIndex, 0, PLANETS.length - 1);
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
              effectiveRate = baseRate * planetMult * darkMatterMult * passiveBoost;
              totalEarned = Math.floor(cappedSecs * effectiveRate);
          }

          // Credit offline production before showing the modal. The save is written
          // immediately so closing or refreshing before dismissing the modal cannot
          // lose the reward or award it twice.
          const creditedResources = {
              ...loadedResources,
              [ResourceType.Stardust]: loadedResources[ResourceType.Stardust] + totalEarned
          };
          const creditedLifetime = savedLifetime + totalEarned;

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
          localStorage.setItem(SAVE_KEY, JSON.stringify({
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

          if (totalEarned > 0) {
              setOfflineEarnings({
                  isOpen: true,
                  awayTimeSeconds: cappedSecs,
                  earnedStardust: totalEarned,
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
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
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
                        localStorage.removeItem(SAVE_KEY);
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
                onOpenStats={() => setShowStatsModal(true)}
            >
                <div className="w-full relative flex flex-col">
                    <div className="relative h-[calc(100dvh-theme(spacing.16))] min-h-[420px] sm:min-h-[520px] md:h-[calc(100vh-theme(spacing.16))] md:min-h-[600px] w-full flex flex-col pb-24 md:pb-0">
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