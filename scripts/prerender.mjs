import fs from 'node:fs';
import path from 'node:path';

const distDir = path.resolve('dist');
const basePath = path.join(distDir, 'index.html');

if (!fs.existsSync(basePath)) {
  throw new Error('dist/index.html not found. Run vite build before prerender.');
}

const baseHtml = fs.readFileSync(basePath, 'utf8');
const site = 'https://spaceclickergame.com';
const ORGANIZATION_ID = site + '/#organization';
const ORGANIZATION_LOGO = site + '/favicon.svg';
const EDITORIAL_ID = site + '/#editorial';
const SITE_CONTENT_UPDATED = '2026-10-06';

const blogSourcePath = path.resolve('content/blogPosts.ts');
const blogStaticContent = {};
const blogStaticMeta = {};

if (!fs.existsSync(blogSourcePath)) {
  throw new Error('content/blogPosts.ts not found. Blog prerender content cannot be generated.');
}

const blogSource = fs.readFileSync(blogSourcePath, 'utf8');
const blogSlugMatches = [...blogSource.matchAll(/slug:\s*'([^']+)'/g)]
  .map((match) => ({ slug: match[1], index: match.index }));

for (let index = 0; index < blogSlugMatches.length; index += 1) {
  const { slug, index: start } = blogSlugMatches[index];
  const end = index + 1 < blogSlugMatches.length ? blogSlugMatches[index + 1].index : blogSource.length;
  const chunk = blogSource.slice(start, end);
  const contentMarker = 'content: `';
  const contentStart = chunk.indexOf(contentMarker);
  const contentEnd = chunk.lastIndexOf('`');

  if (contentStart < 0 || contentEnd <= contentStart) {
    throw new Error(`Could not extract static blog content for ${slug}`);
  }

  const content = chunk.slice(contentStart + contentMarker.length, contentEnd).trim();

  if (content.length < 500) {
    throw new Error(`Static blog content for ${slug} is unexpectedly short`);
  }
  if (/<script\b/i.test(content) || content.includes('${')) {
    throw new Error(`Unsafe or unsupported template content found in blog post ${slug}`);
  }
  if (
    /\son[a-z]+\s*=/i.test(content) ||
    /\sstyle\s*=/i.test(content) ||
    /(?:href|src|formaction)\s*=\s*["']\s*(?:javascript:|data:text\/html)/i.test(content)
  ) {
    throw new Error(`Unsafe inline event handler or executable URL found in blog post ${slug}`);
  }
  if (/<\/?(?:iframe|object|embed|form|input|button|textarea|select|option|style|link|meta|base|svg|math)\b/i.test(content)) {
    throw new Error(`Unsupported interactive or executable HTML found in blog post ${slug}`);
  }
  const externalBlankLinks = [...content.matchAll(/<a\b[^>]*target=["']_blank["'][^>]*>/gi)];
  for (const match of externalBlankLinks) {
    const tag = match[0];
    const relMatch = tag.match(/rel=["']([^"']*)["']/i);
    const relTokens = new Set((relMatch?.[1] || '').toLowerCase().split(/\s+/).filter(Boolean));
    if (!relTokens.has('noopener') || !relTokens.has('noreferrer')) {
      throw new Error(`target=_blank link missing noopener/noreferrer in blog post ${slug}`);
    }
  }

  blogStaticContent[`/blog/${slug}`] = `<article class="static-blog-content">${content}</article>`;

  const readField = (field, required = true) => {
    const fieldMatch = chunk.match(new RegExp(`${field}:\\s*'((?:\\\\'|[^'])*)'`));
    if (!fieldMatch) {
      if (required) throw new Error(`Missing ${field} metadata for ${slug}`);
      return '';
    }
    return fieldMatch[1].replace(/\\'/g, "'");
  };

  blogStaticMeta[`/blog/${slug}`] = {
    title: readField('title'),
    description: readField('excerpt'),
    author: readField('author'),
    datePublished: new Date(readField('date')).toISOString(),
    dateModified: new Date(readField('updatedDate', false) || readField('date')).toISOString(),
    readTime: readField('readTime'),
    image: readField('image')
  };
}

if (Object.keys(blogStaticContent).length !== 10) {
  throw new Error(`Expected 10 blog posts for prerender, found ${Object.keys(blogStaticContent).length}`);
}

// Keep the lightweight runtime blog catalog in sync with the full article source
// without importing all article bodies into the main application bundle.
const blogMetaSourcePath = path.resolve('content/blogMeta.ts');
if (!fs.existsSync(blogMetaSourcePath)) {
  throw new Error('content/blogMeta.ts not found. Lightweight blog metadata cannot be verified.');
}
const blogMetaSourceText = fs.readFileSync(blogMetaSourcePath, 'utf8');
const lightweightSlugMatches = [...blogMetaSourceText.matchAll(/"slug":\s*"([^"]+)"/g)]
  .map((match) => ({ slug: match[1], index: match.index }));
const lightweightBlogMeta = {};

if (lightweightSlugMatches.length !== Object.keys(blogStaticMeta).length) {
  throw new Error(
    `blogMeta.ts count mismatch: expected ${Object.keys(blogStaticMeta).length}, found ${lightweightSlugMatches.length}`
  );
}

for (let index = 0; index < lightweightSlugMatches.length; index += 1) {
  const { slug, index: start } = lightweightSlugMatches[index];
  const end = index + 1 < lightweightSlugMatches.length
    ? lightweightSlugMatches[index + 1].index
    : blogMetaSourceText.length;
  const chunk = blogMetaSourceText.slice(start, end);
  const canonical = blogStaticMeta[`/blog/${slug}`];

  if (!canonical) throw new Error(`blogMeta.ts contains unknown slug: ${slug}`);

  const readJsonField = (field) => {
    const match = chunk.match(new RegExp(`"${field}":\\s*"((?:\\\\"|[^"])*)"`));
    if (!match) throw new Error(`blogMeta.ts is missing ${field} for ${slug}`);
    return JSON.parse(`"${match[1]}"`);
  };

  const lightweight = {
    title: readJsonField('title'),
    seoTitle: readJsonField('seoTitle'),
    publishedDate: readJsonField('publishedDate'),
    readTime: readJsonField('readTime'),
    description: readJsonField('excerpt'),
    image: readJsonField('image')
  };
  lightweightBlogMeta[slug] = lightweight;

  for (const field of ['title', 'description', 'image']) {
    if (lightweight[field] !== canonical[field]) {
      throw new Error(
        `blogMeta.ts drift for ${slug}: ${field} does not match content/blogPosts.ts`
      );
    }
  }

  if (lightweight.readTime !== canonical.readTime) {
    throw new Error(
      `blogMeta.ts drift for ${slug}: readTime ${lightweight.readTime} does not match ${canonical.readTime}`
    );
  }

  const canonicalPublishedDate = canonical.datePublished.slice(0, 10);
  if (lightweight.publishedDate !== canonicalPublishedDate) {
    throw new Error(
      `blogMeta.ts drift for ${slug}: publishedDate ${lightweight.publishedDate} does not match ${canonicalPublishedDate}`
    );
  }
}

const routes = [
  ['/', 'Space Clicker – Free Space Clicker Game Online', 'Play Space Clicker free online. Mine Stardust, automate production, manage Heat Flux, catch Golden Comets, and reset for permanent Dark Matter upgrades.', 'Space Clicker Game'],
  ['/game/galaxy_miner', 'Galaxy Miner – Space Mining Idle Clicker Online', 'Play Galaxy Miner online: mine Stardust, automate a space economy, manage Heat Flux, catch Golden Comets, and reset for permanent Dark Matter upgrades.', 'Galaxy Miner'],
  ['/game/mars_colony', 'Mars Colony Idle - Free Space Strategy Game', 'Build and balance a browser-based Mars colony with Oxygen, Food, Energy, population growth, and automated resource production.', 'Mars Colony Idle'],
  ['/game/star_defense', 'Star Defense - Free Space Defense Clicker', 'Defend your mothership from alien waves, click enemies for direct damage, and upgrade auto-turrets in a browser defense game.', 'Star Defense'],
  ['/game/merge_ships', 'Merge Spaceships - Free Browser Merge Game', 'Merge matching ships, deploy stronger vessels to orbit, earn automatic Credits, and recover up to 24 hours of capped offline fleet income.', 'Merge Spaceships'],
  ['/game/gravity_idle', 'Gravity Idle - Free Physics Idle Game', 'Play Gravity Idle: automate orbital cannons, curve projectiles through a gravity well, earn Matter, and recover up to 24 hours of capped offline progress.', 'Gravity Idle'],
  ['/game/deep_signal', 'Deep Space Signal - Signal Decoding Idle Game', 'Scan radio frequencies, manage Energy, decrypt transmissions, analyze faction data, and automate signal hunting in this browser idle simulation.', 'Deep Space Signal'],
  ['/spacebar-games', 'Spacebar Games - Clicker, Counter & CPS Tests', 'Play free spacebar games online: Spacebar Clicker, Spacebar Counter, timed CPS tests, a 100-click sprint and instant browser play.', 'Spacebar Games'],
  ['/spacebar-clicker-2', 'Spacebar Clicker 2 - Upgraded Idle Space Bar Game', 'Play Spacebar Clicker 2, an enhanced browser idle game with Overdrive, auto-production, upgrades, offline earnings and Nova Core ascension.', 'Spacebar Clicker 2'],
  ['/spacebar-clicker', 'Spacebar Clicker – Free Space Bar Clicker Game Online', 'Play Spacebar Clicker free online. Press Space, track CPS, buy upgrades, automate production and prestige for Quantum Keys. No download or account.', 'Spacebar Clicker'],
  ['/spacebar-counter', 'Spacebar Counter - Count Space Bar Presses & CPS', 'Use a free untimed Spacebar Counter with a saved current total, minus-one correction, editable starting value, live CPS and local highest total.', 'Spacebar Counter'],
  ['/spacebar-clicker-test', 'Spacebar Clicker Test - Space Bar CPS & Speed Test', 'Test your spacebar speed with 1, 5, 10, 30 or 60 second CPS tests. Track clicks, average and peak CPS, personal bests and recent local results.', 'Spacebar Clicker Test'],
  ['/spacebar-clicker-unblocked', 'Spacebar Clicker Unblocked - Play Instantly in Your Browser', 'Play Spacebar Clicker instantly in your browser with no download or account. Keyboard and mobile controls, upgrades, local save and prestige.', 'Spacebar Clicker Unblocked'],
  ['/compare', 'Space Clicker Game vs Classic Incremental Games: Feature Comparison', 'Compare gameplay structure, automation, progression and reset systems, events, and presentation across Space Clicker Game and well-known incremental games.', 'Space Clicker Feature Comparison'],
  ['/achievements', 'Galaxy Miner Milestones & Progress Tracker | Space Clicker Game', 'Track Galaxy Miner mining, automation, and Dark Matter milestones from your local browser save.', 'Galaxy Miner Milestones'],
  ['/blog', 'Space Clicker Game Blog - Guides & Strategy', 'Read guides, mechanics explainers and strategy articles for space clicker and incremental browser games.', 'Space Clicker Game Blog'],
  ['/about', 'About | Space Clicker Game', 'Learn about SpaceClickerGame.com and its free browser-based clicker, idle and spacebar experiences.', 'About Space Clicker Game'],
  ['/contact', 'Contact | Space Clicker Game', 'Contact SpaceClickerGame.com for player support, bug reports, feedback, business, advertising, or press questions.', 'Contact Space Clicker Game'],
  ['/privacy', 'Privacy Policy | Space Clicker Game', 'Read how SpaceClickerGame.com handles browser-local game saves, exported save codes, hosting requests, analytics, and advertising technologies.', 'Privacy Policy'],
  ['/terms', 'Terms of Service | Space Clicker Game', 'Read the terms that apply when using SpaceClickerGame.com and its browser-based games and tools.', 'Terms of Service'],
  ['/cookies', 'Cookie & Local Storage Settings | Space Clicker Game', 'Learn how SpaceClickerGame.com uses browser localStorage for game progress and what clearing site storage does to local saves.', 'Cookie & Local Storage Settings'],
  ['/sitemap', 'HTML Sitemap | Space Clicker Game', 'Browse the main games, Spacebar tools, guides, support pages, and legal resources available on SpaceClickerGame.com.', 'HTML Sitemap'],
  ...Object.entries(blogStaticMeta).map(([route, meta]) => {
    const slug = route.replace('/blog/', '');
    const lightweight = lightweightBlogMeta[slug];
    if (!lightweight) throw new Error(`Missing lightweight metadata for ${slug}`);
    return [route, lightweight.seoTitle, meta.description, meta.title];
  })
];

const HIGH_VALUE_SCHEMA_ROUTES = new Set([
  '/',
  '/game/galaxy_miner',
  '/game/mars_colony',
  '/game/star_defense',
  '/game/merge_ships',
  '/game/gravity_idle',
  '/game/deep_signal',
  '/spacebar-games',
  '/spacebar-clicker',
  '/spacebar-clicker-2',
  '/spacebar-counter',
  '/spacebar-clicker-test',
  '/spacebar-clicker-unblocked',
  '/compare',
  '/achievements',
  '/blog',
  '/about'
]);

const GAME_SCHEMA_CONFIG = {
  '/game/galaxy_miner': { name: 'Galaxy Miner', genres: ['Clicker', 'Incremental', 'Idle', 'Sci-Fi'] },
  '/game/mars_colony': { name: 'Mars Colony Idle', genres: ['Idle', 'Management', 'Strategy', 'Simulation'] },
  '/game/star_defense': { name: 'Star Defense', genres: ['Clicker', 'Defense', 'Action', 'Sci-Fi'] },
  '/game/merge_ships': { name: 'Merge Spaceships', genres: ['Merge', 'Idle', 'Casual', 'Collection'] },
  '/game/gravity_idle': { name: 'Gravity Idle', genres: ['Idle', 'Physics', 'Simulation', 'Sci-Fi'] },
  '/game/deep_signal': { name: 'Deep Space Signal', genres: ['Idle', 'Simulation', 'Signal Decoding', 'Sci-Fi'] }
};

const DEFAULT_SOCIAL_IMAGE = 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1200';
const ROUTE_SOCIAL_IMAGES = {
  '/game/galaxy_miner': 'https://images.unsplash.com/photo-1614728263952-84ea256f9679?auto=format&fit=crop&q=80&w=1200',
  '/game/mars_colony': 'https://images.unsplash.com/photo-1614728263952-84ea256f9679?auto=format&fit=crop&q=80&w=1200',
  '/game/star_defense': 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1200',
  '/game/merge_ships': 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&q=80&w=1200',
  '/game/gravity_idle': 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=1200',
  '/game/deep_signal': 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=1200',
  '/spacebar-games': 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=1200',
  '/spacebar-clicker': 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=1200',
  '/spacebar-clicker-2': 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=1200',
  '/spacebar-counter': 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=1200',
  '/spacebar-clicker-test': 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=1200',
  '/spacebar-clicker-unblocked': 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=1200',
  '/achievements': 'https://images.unsplash.com/photo-1614728263952-84ea256f9679?auto=format&fit=crop&q=80&w=1200'
};

const normalizeSocialImage = (source) => {
  try {
    const url = new URL(source);
    if (url.hostname === 'images.unsplash.com') {
      url.searchParams.set('w', '1200');
      url.searchParams.set('h', '630');
      url.searchParams.set('fit', 'crop');
      url.searchParams.set('q', '80');
    }
    return url.toString();
  } catch {
    return source;
  }
};

const getRouteSocialImage = (route) =>
  normalizeSocialImage(blogStaticMeta[route]?.image || ROUTE_SOCIAL_IMAGES[route] || DEFAULT_SOCIAL_IMAGE);

const buildStaticRouteSchema = (route, description, canonical) => {
  if (route === '/') {
    return {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebSite",
          "@id": site + "/#website",
          "url": site + "/",
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
          "url": site + "/",
          "logo": {
            "@type": "ImageObject",
            "url": ORGANIZATION_LOGO
          }
        },
        {
          "@type": "VideoGame",
          "@id": site + "/game/galaxy_miner/#game",
          "url": site + "/game/galaxy_miner/",
          "name": "Galaxy Miner",
          "description": "A free browser space clicker game with Stardust mining, automation, Heat Flux, Golden Comets, offline progress, and permanent Dark Matter upgrades.",
          "genre": ["Clicker", "Incremental", "Idle", "Sci-Fi"],
          "playMode": "SinglePlayer",
          "applicationCategory": "Game",
          "operatingSystem": "Any modern web browser",
          "isAccessibleForFree": true,
          "dateModified": SITE_CONTENT_UPDATED,
          "inLanguage": "en",
          "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
        },
        {
          "@type": "FAQPage",
          "@id": site + "/#faq",
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
                "text": "Galaxy Miner auto-saves to local browser storage. The Telemetry & Backup panel can also copy a portable save code or download a .scg backup file for manual safekeeping. Clearing site data, using private browsing, or changing devices can remove or separate the local save."
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
  }

  if (GAME_SCHEMA_CONFIG[route]) {
    const game = GAME_SCHEMA_CONFIG[route];
    return {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "VideoGame",
          "@id": canonical + "#game",
          "url": canonical,
          "name": game.name,
          "description": description,
          "genre": game.genres,
          "playMode": "SinglePlayer",
          "applicationCategory": "Game",
          "operatingSystem": "Any modern web browser",
          "isAccessibleForFree": true,
          "dateModified": SITE_CONTENT_UPDATED,
          "inLanguage": "en",
          "image": getRouteSocialImage(route),
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD",
            "availability": "https://schema.org/InStock"
          }
        },
        {
          "@type": "BreadcrumbList",
          "@id": canonical + "#breadcrumb",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Space Clicker Game",
              "item": site + "/"
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": game.name,
              "item": canonical
            }
          ]
        }
      ]
    };
  }

  if (route === '/spacebar-games') {
    return {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "CollectionPage",
          "@id": canonical + "#webpage",
          "name": "Spacebar Games",
          "description": description,
          "url": canonical,
          "dateModified": SITE_CONTENT_UPDATED
        },
        {
          "@type": "ItemList",
          "@id": canonical + "#tools",
          "name": "Spacebar Games and Tools",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "url": site + "/spacebar-clicker/", "name": "Spacebar Clicker" },
            { "@type": "ListItem", "position": 2, "url": site + "/spacebar-clicker-test/", "name": "Spacebar Clicker Test" },
            { "@type": "ListItem", "position": 3, "url": site + "/spacebar-counter/", "name": "Spacebar Counter" },
            { "@type": "ListItem", "position": 4, "url": site + "/spacebar-clicker-2/", "name": "Spacebar Clicker 2" },
            { "@type": "ListItem", "position": 5, "url": site + "/spacebar-clicker-unblocked/", "name": "Spacebar Clicker Instant Play" }
          ]
        },
        {
          "@type": "BreadcrumbList",
          "@id": canonical + "#breadcrumb",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Space Clicker Game", "item": site + "/" },
            { "@type": "ListItem", "position": 2, "name": "Spacebar Games", "item": canonical }
          ]
        },
        {
          "@type": "FAQPage",
          "@id": canonical + "#faq",
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
  }

  if (route === '/spacebar-clicker' || route === '/spacebar-clicker-2' || route === '/spacebar-clicker-unblocked') {
    const name = route === '/spacebar-clicker-2'
      ? 'Spacebar Clicker 2'
      : route === '/spacebar-clicker-unblocked'
        ? 'Spacebar Clicker Unblocked'
        : 'Spacebar Clicker';

    const faqEntity = route === '/spacebar-clicker-2'
      ? [
          ['Is this the same as the classic Spacebar Clicker?', 'No. It is a separate enhanced mode with its own mechanics and local save.'],
          ['Does Spacebar Clicker 2 have auto-clickers?', 'Yes. Micro Bots generate passive points and Reactor Banks multiply automatic production.'],
          ['What does Nova Ascension reset?', 'It resets current points and standard upgrades. Nova Cores, lifetime records and the permanent Nova bonus remain.'],
          ['Does Spacebar Clicker 2 work on mobile?', 'Yes. Mobile players can use the on-screen Space button, while desktop players can use the physical Space key.'],
          ['How much offline production can Spacebar Clicker 2 recover?', 'Supported saved runs can recover up to 12 hours of offline auto-production. Overdrive contributes only for the portion of its actual remaining duration that overlaps the offline window.'],
      ['Can I move my Spacebar Clicker 2 save to another browser?', 'Yes. Copy an SCG2 save code or download a .scg backup file, then restore it in another browser or device. Imported values are validated before replacing the local save.']
        ]
      : route === '/spacebar-clicker-unblocked'
        ? [
            ['What does “unblocked” mean on this page?', 'It means the game opens directly in a browser with no installation, launcher, extension, or account step. It does not bypass network restrictions.'],
            ['Can a school or workplace network still block the game?', 'Yes. Access depends on the rules applied by the network, device, firewall, parental controls, or administrator.'],
            ['Does the instant-play version save progress?', 'Yes. Progress is stored locally in the current browser. There is no cloud or cross-device sync.'],
            ['Is this the same Spacebar Clicker game?', 'Yes. The instant-play route uses the same upgrades, automation, CPS logic, and Hyperdrive prestige system as the main Spacebar Clicker page.']
          ]
        : [
            ['Is Spacebar Clicker free?', 'Yes. It runs in a modern browser with no download or account required.'],
            ['Does holding Space increase CPS?', 'No. Repeated keyboard events generated by holding the key are ignored.'],
            ['Does progress sync between devices?', 'No. Progress is saved locally in the current browser.'],
            ['What survives a prestige reset?', 'Quantum Keys, lifetime presses, best CPS and achievement progress remain.'],
            ['How much offline production can Spacebar Clicker recover?', 'Once automation is producing points, a supported saved run can recover up to 24 hours of offline production when you return.'],
      ['Can I move my Spacebar Clicker save to another browser?', 'Yes. Copy a save code or download a .scg backup file, move it to the other browser or device, then paste the code or import the backup file. Imported values are validated before replacing the local save.']
          ];

    return {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "VideoGame",
          "@id": canonical + "#game",
          "url": canonical,
          "name": name,
          "description": description,
          "genre": ["Clicker", "Incremental", "Idle"],
          "playMode": "SinglePlayer",
          "applicationCategory": "Game",
          "operatingSystem": "Any modern web browser",
          "isAccessibleForFree": true,
          "dateModified": SITE_CONTENT_UPDATED,
          "inLanguage": "en",
          "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
        },
        {
          "@type": "BreadcrumbList",
          "@id": canonical + "#breadcrumb",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Space Clicker Game", "item": site + "/" },
            { "@type": "ListItem", "position": 2, "name": "Spacebar Games", "item": site + "/spacebar-games/" },
            { "@type": "ListItem", "position": 3, "name": name, "item": canonical }
          ]
        },
        {
          "@type": "FAQPage",
          "@id": canonical + "#faq",
          "mainEntity": faqEntity.map(([question, answer]) => ({
            "@type": "Question",
            "name": question,
            "acceptedAnswer": { "@type": "Answer", "text": answer }
          }))
        }
      ]
    };
  }

  if (route === '/spacebar-counter' || route === '/spacebar-clicker-test') {
    const isCounter = route === '/spacebar-counter';
    const name = isCounter ? 'Spacebar Counter' : 'Spacebar Clicker Test';
    const faqEntity = isCounter
      ? [
          ['Does the space bar counter have a time limit?', 'No. It keeps counting deliberate Space presses until you reset the current session.'],
          ['Can I use this as a spacebar CPS counter?', 'Yes. The page shows current CPS, average CPS and peak CPS while also keeping the total press count.'],
          ['Does holding the Space key increase the count?', 'No. Browser-generated repeat events from holding the key are ignored.'],
          ['Are my current and highest totals saved?', 'Yes. Both are stored locally in this browser. You can also set or correct the current total without creating an account, and nothing is uploaded to a public leaderboard.']
        ]
      : [
          ['What is a space bar click test?', 'It measures how many intentional Space presses you can make during a selected time window and converts the result into clicks per second.'],
          ['What does CPS mean in a spacebar speed test?', 'CPS means clicks per second. Average CPS uses all valid presses over elapsed time, while peak CPS tracks the strongest rolling one-second burst.'],
          ['Can I run a 100-click spacebar test?', 'Yes. Select the 100-click mode and the result records how long it takes to reach one hundred valid presses.'],
          ['Can I choose a custom test duration?', 'Yes. Custom mode accepts durations from 1 to 300 seconds and stores the best result locally for that selected mode.'],
          ['What is a good Spacebar CPS score?', 'There is no universal good CPS threshold across every keyboard and test. Compare results using the same device, browser, test duration, and input rules.'],
          ['What is the difference between CPS and PPS?', 'CPS means clicks per second and PPS means presses per second. For a Spacebar test they describe the same basic rate here: valid Space presses divided by time.']
        ];

    return {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebApplication",
          "@id": canonical + "#app",
          "url": canonical,
          "name": name,
          "description": description,
          "applicationCategory": "UtilitiesApplication",
          "operatingSystem": "Any modern web browser",
          "isAccessibleForFree": true,
          "dateModified": SITE_CONTENT_UPDATED,
          "inLanguage": "en",
          "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
        },
        {
          "@type": "BreadcrumbList",
          "@id": canonical + "#breadcrumb",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Space Clicker Game", "item": site + "/" },
            { "@type": "ListItem", "position": 2, "name": "Spacebar Games", "item": site + "/spacebar-games/" },
            { "@type": "ListItem", "position": 3, "name": name, "item": canonical }
          ]
        },
        {
          "@type": "FAQPage",
          "@id": canonical + "#faq",
          "mainEntity": faqEntity.map(([question, answer]) => ({
            "@type": "Question",
            "name": question,
            "acceptedAnswer": { "@type": "Answer", "text": answer }
          }))
        }
      ]
    };
  }

  if (route === '/blog') {
    return {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "CollectionPage",
          "@id": canonical + "#webpage",
          "url": canonical,
          "name": "Space Clicker Game Blog - Guides & Strategy",
          "description": description,
          "dateModified": SITE_CONTENT_UPDATED,
          "isPartOf": {
            "@type": "WebSite",
            "@id": site + "/#website",
            "name": "Space Clicker Game",
            "url": site + "/"
          }
        },
        {
          "@type": "ItemList",
          "@id": canonical + "#articles",
          "name": "Space Clicker Game guides and strategy articles",
          "itemListElement": Object.entries(blogStaticMeta)
            .sort(([, a], [, b]) => Date.parse(b.datePublished) - Date.parse(a.datePublished))
            .map(([postRoute, meta], index) => ({
              "@type": "ListItem",
              "position": index + 1,
              "name": meta.title,
              "url": site + postRoute + "/"
            }))
        },
        {
          "@type": "BreadcrumbList",
          "@id": canonical + "#breadcrumb",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Space Clicker Game", "item": site + "/" },
            { "@type": "ListItem", "position": 2, "name": "Blog", "item": canonical }
          ]
        }
      ]
    };
  }

  if (route === '/about') {
    return {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "AboutPage",
          "@id": canonical + "#webpage",
          "url": canonical,
          "name": "About Space Clicker Game",
          "description": description,
          "dateModified": SITE_CONTENT_UPDATED,
          "about": {
            "@type": "Organization",
            "@id": ORGANIZATION_ID,
            "name": "Space Clicker Game",
            "url": site + "/",
            "logo": {
              "@type": "ImageObject",
              "url": ORGANIZATION_LOGO
            }
          },
          "isPartOf": {
            "@type": "WebSite",
            "@id": site + "/#website",
            "name": "Space Clicker Game",
            "url": site + "/"
          }
        },
        {
          "@type": "BreadcrumbList",
          "@id": canonical + "#breadcrumb",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Space Clicker Game", "item": site + "/" },
            { "@type": "ListItem", "position": 2, "name": "About", "item": canonical }
          ]
        }
      ]
    };
  }

  if (route === '/compare') {
    const comparedGames = [
      'Space Clicker Game (Galaxy Miner)',
      'Cookie Clicker',
      'Universal Paperclips',
      'Antimatter Dimensions',
      'Spaceplan',
      'Melvor Idle'
    ];

    return {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebPage",
          "@id": canonical + "#webpage",
          "url": canonical,
          "name": "Space Clicker Game vs Classic Incremental Games: Feature Comparison",
          "description": description,
          "dateModified": SITE_CONTENT_UPDATED,
          "isPartOf": {
            "@type": "WebSite",
            "@id": site + "/#website",
            "name": "Space Clicker Game",
            "url": site + "/"
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
            { "@type": "ListItem", "position": 1, "name": "Space Clicker Game", "item": site + "/" },
            { "@type": "ListItem", "position": 2, "name": "Feature Comparison", "item": canonical }
          ]
        }
      ]
    };
  }

  if (route === '/achievements') {
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

    return {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "CollectionPage",
          "@id": canonical + "#webpage",
          "url": canonical,
          "name": "Galaxy Miner Milestones & Progress Tracker",
          "description": description,
          "dateModified": SITE_CONTENT_UPDATED,
          "isPartOf": {
            "@type": "WebSite",
            "@id": site + "/#website",
            "name": "Space Clicker Game",
            "url": site + "/"
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
            { "@type": "ListItem", "position": 1, "name": "Space Clicker Game", "item": site + "/" },
            { "@type": "ListItem", "position": 2, "name": "Galaxy Miner Milestones", "item": canonical }
          ]
        }
      ]
    };
  }

  return null;
};

const escapeHtml = (value) =>
  value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

const escapeXml = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

const staticRouteContent = {
  '/': `
    <section>
      <h2>How to play Space Clicker</h2>
      <ol>
        <li>Mine Stardust manually to start the run.</li>
        <li>Buy Mining Drones, Rovers, Bases, Orbital Stations and Dyson Swarms for automatic production.</li>
        <li>Keep active mining between 80% and 99% Heat to use the 2x Heat Flux bonus without overheating.</li>
        <li>Reach 1 trillion Stardust to unlock Galactic Reset and permanent Dark Matter upgrades.</li>
      </ol>

      <h2>What Space Clicker Game includes</h2>
      <p>SpaceClickerGame.com combines the flagship Galaxy Miner progression loop with five separate browser simulations and a dedicated Spacebar tool suite. The six simulations use different mechanics instead of presenting the same click loop under different names.</p>
      <p>You can manage life support in <a href="/game/mars_colony/">Mars Colony Idle</a>, defend a mothership in <a href="/game/star_defense/">Star Defense</a>, merge and deploy ships in <a href="/game/merge_ships/">Merge Spaceships</a>, experiment with orbital projectiles in <a href="/game/gravity_idle/">Gravity Idle</a>, or decode transmissions in <a href="/game/deep_signal/">Deep Space Signal</a>.</p>

      <h2>The Space Clicker progression loop</h2>
      <p>Galaxy Miner starts as an active space clicker: each deliberate input produces Stardust and raises Heat. As automation upgrades accumulate, passive production becomes a larger part of the run. Heat Flux rewards active timing between 80% and 99% Heat, while Galactic Reset turns sufficiently large runs into permanent Dark Matter progression.</p>
      <p>The dedicated <a href="/game/galaxy_miner/">Galaxy Miner page</a> explains its Heat, planet, automation, offline-production and Dark Matter systems in more detail.</p>

      <h2>Spacebar games, counters and CPS tests</h2>
      <p>The <a href="/spacebar-games/">Spacebar Games hub</a> separates several different keyboard intents. <a href="/spacebar-clicker/">Spacebar Clicker</a> is an upgrade-based incremental game, <a href="/spacebar-counter/">Spacebar Counter</a> keeps an untimed press total, and <a href="/spacebar-clicker-test/">Spacebar Clicker Test</a> measures timed or click-target CPS. <a href="/spacebar-clicker-2/">Spacebar Clicker 2</a> uses a separate progression tree with Overdrive and Nova Core ascension.</p>

      <h2>Play instantly in your browser</h2>
      <p>No account or download is required for the current games and tools. Supported progress is stored locally in the current browser rather than a cloud account, so clearing site storage or changing devices can separate or remove local progress. Portable backup options are available in Galaxy Miner, Spacebar Clicker, and Spacebar Clicker 2.</p>

      <h2>Idle progression and mobile play</h2>
      <p>Galaxy Miner begins with manual mining and shifts toward automated production. Returning after time away can credit up to 24 hours of saved automatic production. Touch controls are available in modern mobile browsers, while Spacebar tools provide on-screen controls for devices without a physical keyboard.</p>

      <h2>Strategy and progress references</h2>
      <p><a href="/blog/strategy-guide-clicker-game-space-empire/">Read the Space Clicker strategy guide</a> for upgrade and Galactic Reset planning, or use the <a href="/achievements/">Galaxy Miner milestones page</a> to review visible Stardust, automation and Dark Matter thresholds.</p>
    </section>`,
  '/game/galaxy_miner': `
<section>
      <h2>Galaxy Miner gameplay</h2>
      <p>Galaxy Miner is the flagship space mining idle clicker on SpaceClickerGame.com. Start with manual Stardust extraction, then reinvest into Laser Drills, Mining Drones, Rovers, Lunar Bases, Orbital Stations, and Dyson Swarms. The loop shifts from active clicking toward automated production as the run grows.</p>
      <h2>Heat Flux and active mining</h2>
      <p>Every manual mining action adds Heat. Keeping Heat between 80% and 99% activates the 2x Heat Flux state, while crossing 100% overheats the mining beam and temporarily disables normal mining. Geodes can vent Heat, so active play rewards timing rather than simply holding the input.</p>
      <h2>Planet progression and production multipliers</h2>
      <p>The run starts on Proxima Centauri B at 1x production. Reaching 1 million Stardust unlocks Kepler-186f at 10x production, 1 billion unlocks Trappist-1e at 50x, and 1 trillion unlocks the Galactic Core at 200x. Once a planet is unlocked in the current run, spending Stardust does not move the run backward.</p>
      <h2>Automation and offline production</h2>
      <p>Automatic upgrades continue producing Stardust without repeated clicks. Supported saved runs can also credit capped offline production after time away, using the saved automation rate rather than pretending the game ran continuously in the background.</p>
      <h2>Local save and portable backup</h2>
      <p>Galaxy Miner auto-saves to local browser storage. The Telemetry & Backup panel can copy a portable Base64 save code or download a .scg backup file, and either format can be restored manually after validation. These backups are not cloud sync or encryption.</p>
      <h2>Galactic Reset and Dark Matter</h2>
      <p>Galactic Reset becomes available from 1 trillion Stardust. A reset removes current Stardust and standard upgrades but keeps Dark Matter, permanent Void Technology, and lifetime progress. Larger runs can award more Dark Matter, so reset timing becomes a long-term efficiency decision.</p>
      <p>For upgrade planning, see the <a href="/blog/strategy-guide-clicker-game-space-empire/">Space Clicker strategy guide</a> or track thresholds on the <a href="/achievements/">Galaxy Miner milestones page</a>.</p>
    </section>`,
  '/game/mars_colony': `
<section>
      <h2>Mars Colony gameplay</h2>
      <p>Mars Colony Idle is a browser management simulation built around six linked resources: Minerals, Credits, Colonists, Energy, Food, and Oxygen. Manual excavation starts the economy, while buildings gradually convert the colony into a self-sustaining production network.</p>
      <h2>Energy comes first</h2>
      <p>Solar Panels and later Fusion Reactors supply Energy. Auto-Excavators, Hydroponics, Oxygenators, and Habitat Modules consume part of that capacity, so adding buildings without enough generation reduces how effectively the rest of the colony can operate.</p>
      <h2>Food, oxygen, and population</h2>
      <p>Colonists need both Food and Oxygen. Hydroponics raises Food production, Oxygenators replenish breathable reserves, and Habitat Modules raise housing capacity. Population grows only when life-support reserves remain healthy, while shortages can reverse that growth.</p>
      <h2>Minerals and Credits</h2>
      <p>Minerals pay for all current construction and can be generated manually or by Auto-Excavators. Colonists also generate Credits over time, but the current build uses Credits as a visible colony-economy indicator rather than a spendable construction currency.</p>
      <p>Use the simulation switcher to compare this management loop with <a href="/game/galaxy_miner/">Galaxy Miner</a> and <a href="/game/star_defense/">Star Defense</a>.</p>
    </section>`,
  '/game/star_defense': `
<section>
      <h2>Star Defense gameplay</h2>
      <p>Star Defense is a browser defense clicker in which enemy ships move toward the mothership while the player combines direct clicks with automated weapons. Destroyed enemies award Scrap, which funds upgrades inside the current run.</p>
      <h2>Manual damage and auto-turrets</h2>
      <p>Plasma Cannons improve manual click damage, while Alpha Turrets and Missile Batteries add automatic fire. Manual targeting handles immediate threats and automation reduces the amount of constant clicking needed as waves accelerate.</p>
      <h2>Hull, shields, and repair</h2>
      <p>Void Shield generators create a regenerating barrier, Hull Plating increases maximum survivability, and Nanite Repair provides an emergency recovery option. Defensive upgrades become more important as fighters, tanks, and boss-class enemies create sustained pressure.</p>
      <h2>Tactical abilities and waves</h2>
      <p>EMP Shock, Rapid Fire, and Nuke abilities provide timed responses to dangerous waves. Enemy speed, health, firing pressure, and boss encounters scale the difficulty, so upgrade timing matters as much as raw click speed.</p>
      <p>Prefer an economy-first idle loop? Switch to <a href="/game/galaxy_miner/">Galaxy Miner</a>. For non-combat management, try <a href="/game/mars_colony/">Mars Colony Idle</a>.</p>
    </section>`,
  '/game/merge_ships': `
<section>
      <h2>Merge Spaceships gameplay</h2>
      <p>Merge Spaceships combines a merge board with an idle combat layer. Acquire low-level ships, place them in the hangar, and combine two matching levels to create a stronger vessel instead of managing a traditional upgrade list.</p>
      <h2>Hangar merging</h2>
      <p>The hangar contains a limited number of slots, so board space is part of the strategy. Matching ships can be fused upward through progressively stronger levels, and fabrication upgrades can improve the level of newly acquired ships as the economy grows.</p>
      <h2>Orbit combat and passive income</h2>
      <p>Ships moved into orbit automatically fire on passing asteroids. Stronger vessels deal more damage, and destroyed normal, gold, or boss asteroids award Credits that can be reinvested into more ships and technology.</p>
      <h2>Technology progression</h2>
      <p>Orbit Expansion opens additional deployment slots, Advanced Fabrication improves purchased ship quality, and Logistics Net increases the frequency of incoming crates. The main tradeoff is how much value to keep in the hangar for merging versus how much power to deploy for immediate income.</p>
      <h2>Offline and background fleet earnings</h2>
      <p>Supported saves can recover estimated Orbit income after at least one minute away, including when the browser keeps the tab open in the background. Recovery is capped at 24 hours and uses the deployed fleet's Orbit DPS with a 50% asteroid-availability model; it is an approximation rather than a full offscreen combat simulation.</p>
      <p>For a more traditional incremental economy, open <a href="/game/galaxy_miner/">Galaxy Miner</a>. For direct combat, try <a href="/game/star_defense/">Star Defense</a>.</p>
    </section>`,
  '/game/gravity_idle': `
<section>
      <h2>Gravity Idle gameplay</h2>
      <p>Gravity Idle is a browser physics-idle simulation where orbital cannons fire projectiles through a central gravity well. Asteroids, comets, and geodes enter the field, and successful impacts turn those objects into Matter for the next round of upgrades.</p>
      <h2>Gravity and projectile paths</h2>
      <p>The Event Horizon upgrade strengthens the central pull, changing how projectiles curve through the field. Because trajectories are simulated rather than predetermined, stronger gravity changes both hit frequency and the visual shape of each orbit.</p>
      <h2>Automation upgrades</h2>
      <p>Orbital Cannons add launch sources, Auto-Loader increases firing speed, Kinetic Mass raises impact damage, and Quantum Drill adds piercing. These upgrades stack into a progressively denser automated system rather than requiring constant manual clicking.</p>
      <h2>Pulse and Matter progression</h2>
      <p>A manual gravity pulse provides an active intervention on a cooldown, while automatic launchers keep the simulation moving between inputs. Matter earned from destroyed objects funds the next level of gravity, firing, damage, and piercing upgrades.</p>
      <h2>Offline and background Matter recovery</h2>
      <p>Supported saves can recover estimated Matter after at least one minute away, including when an open tab is backgrounded. Recovery is capped at 24 hours and uses an approximation based on launcher count and Kinetic Mass instead of running the full physics simulation offscreen.</p>
      <p>For a slower management loop, visit <a href="/game/mars_colony/">Mars Colony Idle</a>. For an economy-and-prestige clicker, play <a href="/game/galaxy_miner/">Galaxy Miner</a>.</p>
    </section>`,
  '/game/deep_signal': `
<section>
      <h2>Deep Space Signal gameplay</h2>
      <p>Deep Space Signal is a browser idle simulation built around scanning radio frequencies, receiving encrypted transmissions, and turning decoded messages into Data. Each scan consumes Energy, so progress is paced by active decisions, passive regeneration, and later automation.</p>
      <h2>Scanning and decryption</h2>
      <p>The Antenna Array increases the Data value recovered from newly scanned signals, while Crypto Core upgrades increase passive decryption speed. Players can also click undecoded messages to reduce their encryption manually instead of waiting for the processor to finish the work.</p>
      <h2>Energy and automation</h2>
      <p>Capacitor Bank raises maximum Energy, Solar Sails improve regeneration, and Auto-Scan AI can automate signal hunting once purchased. This creates a gradual shift from manual scanning toward a more idle signal-processing loop.</p>
      <h2>BIO, TECH, MIL, and VOID factions</h2>
      <p>After a transmission is fully decoded, spending Energy to analyze and upload that message can advance BIO, TECH, MIL, or VOID progression. Those faction levels modify Energy regeneration, decryption speed, scan cost, and maximum Energy, so analysis choices also feed the long-term upgrade path.</p>
      <p>For another systems-heavy simulation, try <a href="/game/gravity_idle/">Gravity Idle</a>, or return to the main <a href="/game/galaxy_miner/">Galaxy Miner</a> clicker.</p>
    </section>`,
  '/spacebar-games': `
<section>
      <h2>Choose the right Spacebar game or tool</h2>
      <p>Choose the mode that matches what you want to do. Use Spacebar Clicker for an upgrade-based idle game, Spacebar Counter for an untimed press total, and Spacebar Clicker Test for timed CPS challenges.</p>
      <h2>Spacebar Clicker</h2>
      <p><a href="/spacebar-clicker/">Spacebar Clicker</a> turns each deliberate Space press into points. Buy manual upgrades, unlock automatic production, watch CPS, and use Hyperdrive Prestige to convert large runs into permanent Quantum Keys.</p>
      <h2>Spacebar Counter and CPS Test</h2>
      <p><a href="/spacebar-counter/">Spacebar Counter</a> keeps an untimed total, saves the current tally locally, supports minus-one corrections and a chosen starting total, and shows current, average, and peak CPS. <a href="/spacebar-clicker-test/">Spacebar Clicker Test</a> adds 1, 5, 10, 30, and 60 second modes, custom durations up to 300 seconds, and a 100-click sprint.</p>
      <h2>Spacebar Clicker 2 and instant browser mode</h2>
      <p><a href="/spacebar-clicker-2/">Spacebar Clicker 2</a> is a separate progression mode with Overdrive, offline production, and Nova Core ascension. <a href="/spacebar-clicker-unblocked/">Spacebar Clicker Instant Browser Mode</a> opens the classic game directly with no download or account; it does not bypass school, workplace, firewall, parental-control, or administrator restrictions.</p>
      <p>All current Spacebar modes work in a modern browser. Desktop users can use the physical Space key where supported, while mobile users can use the large on-screen controls.</p>
      <p>Related guides: <a href="/blog/mastering-the-space-bar-clicking-game/">Mastering the Space Bar</a> explains the transition from manual input to automation, while <a href="/blog/mechanics-of-space-bar-clicking-game-physics/">Space Bar Clicking Game Mechanics</a> covers deliberate key input and CPS.</p>
    </section>`,
  '/spacebar-clicker': `
<section>
      <h2>How to play Spacebar Clicker</h2>
      <p>Spacebar Clicker is a free browser idle game built around deliberate Space key presses. Each valid press earns points, and those points can be reinvested into stronger manual output and automatic production. On touch devices, the large on-screen Space control provides the same basic input loop.</p>
      <h2>Upgrades and automatic production</h2>
      <p>The early game rewards active pressing, but upgrades gradually move the run toward passive income. Manual upgrades increase the value of each press, while automatic upgrades keep generating points without requiring constant input.</p>
      <h2>CPS tracking and deliberate presses</h2>
      <p>The game tracks clicks per second so you can see how quickly you are pressing during active play. Browser-generated repeat events from holding the Space key are ignored, which means the counter is based on repeated deliberate keydown events rather than a single held key.</p>
      <h2>Hyperdrive Prestige and Quantum Keys</h2>
      <p>Large runs can be converted through Hyperdrive Prestige. Prestige resets the current point economy and standard upgrades while retaining permanent Quantum Keys and supported lifetime records, giving later runs a stronger starting multiplier.</p>
      <h2>Local browser save and portable backup</h2>
      <p>Current progress is stored locally in the browser rather than in a cloud account. Clearing site storage, using private browsing, or moving to another device can separate or remove that save. The game can copy a validated text save code or download a portable .scg backup file, and either format can be imported into another browser or device as a manual backup.</p>
      <p>For a pure speed benchmark, use the <a href="/spacebar-clicker-test/">Spacebar Clicker Test</a>. For an endless press total without upgrades, use the <a href="/spacebar-counter/">Spacebar Counter</a>. You can also browse the full <a href="/spacebar-games/">Spacebar Games hub</a>.</p>
      <p>For strategy context, read <a href="/blog/mastering-the-space-bar-clicking-game/">Mastering the Space Bar</a> and <a href="/blog/active-vs-passive-space-click-game-styles/">Active Clicking vs. Passive Mining</a>.</p>
    </section>`,
  '/spacebar-clicker-2': `
<section>
      <h2>What is Spacebar Clicker 2?</h2>
      <p>Spacebar Clicker 2 is a separate enhanced Spacebar idle mode rather than a replacement skin for the classic game. It has its own local save and progression system, so progress in Spacebar Clicker 2 does not overwrite the classic Spacebar Clicker run.</p>
      <h2>Overdrive and active pressing</h2>
      <p>Manual Space presses build the early economy and interact with Overdrive, creating a faster active phase before automation becomes the dominant source of points. The on-screen Space control also supports mobile play.</p>
      <h2>Micro Bots and Reactor Banks</h2>
      <p>Micro Bots add passive point generation, while Reactor Banks multiply automatic production. These systems are designed to create a clearer transition from manual pressing into idle accumulation than the classic mode.</p>
      <h2>Offline earnings</h2>
      <p>Supported saved runs can calculate up to 12 hours of offline auto-production when you return after time away. The reward is based on the saved production state and is stored locally in the current browser; Overdrive contributes only for the portion of its actual remaining duration that overlaps the offline window.</p>
      <h2>Portable backup and restore</h2>
      <p>Spacebar Clicker 2 can copy a validated SCG2 save code or download a portable .scg backup file. Either format can be restored in another browser or device, while the Edition 2 save remains separate from the classic Spacebar Clicker save.</p>
      <h2>Nova Core ascension</h2>
      <p>Nova Ascension resets current points and standard upgrades in exchange for permanent Nova Cores. Nova Cores, lifetime records, and the permanent Nova bonus survive the reset and strengthen future runs.</p>
      <p>Prefer the original progression loop? Open the <a href="/spacebar-clicker/">classic Spacebar Clicker</a>. For a pure benchmark, use the <a href="/spacebar-clicker-test/">Spacebar Clicker Test</a>; for an untimed total, use the <a href="/spacebar-counter/">Spacebar Counter</a>; or compare all available modes on the <a href="/spacebar-games/">Spacebar Games hub</a>.</p>
      <p>Read <a href="/blog/active-vs-passive-space-click-game-styles/">Active Clicking vs. Passive Mining</a> for a deeper look at when manual input gives way to passive production.</p>
    </section>`,
  '/spacebar-counter': `
<section>
      <h2>What is a Spacebar Counter?</h2>
      <p>Spacebar Counter is an untimed browser tool for counting deliberate Space key presses. It is useful when you want a running total rather than a fixed 5-second or 10-second challenge. The session continues until you choose to reset it.</p>
      <h2>Total presses and CPS metrics</h2>
      <p>The counter displays total presses, current CPS, average CPS, and peak CPS. Current CPS reflects the recent one-second window, average CPS uses the full active session, and peak CPS records the strongest rolling one-second burst. When the page is hidden or backgrounded, active timing pauses and resumes when the page becomes visible again, so hidden time does not dilute average CPS.</p>
      <h2>Holding Space does not inflate the count</h2>
      <p>Browser-generated repeat events from holding the key down are ignored. Each count is based on a new deliberate Space keydown or an intentional press on the on-screen control.</p>
      <h2>Saved tally, corrections, and privacy</h2>
      <p>The current total and highest total are stored locally in the current browser. The current tally survives a normal reload, can be reduced by one to correct an accidental count, and can be set to a chosen non-negative starting value when continuing an existing tally. Setting a total restarts the timing metrics so CPS is not mixed with the imported baseline. Nothing is uploaded to a public leaderboard, and clearing site storage can remove these local values.</p>
      <h2>Counter vs Spacebar Clicker Test</h2>
      <p>Use this page when you want an endless count. Use the <a href="/spacebar-clicker-test/">Spacebar Clicker Test</a> for timed 1, 5, 10, 30, or 60 second CPS tests, custom durations, and the 100-click sprint. Use <a href="/spacebar-clicker/">Spacebar Clicker</a> when you want upgrades, automation, and prestige, or browse the full <a href="/spacebar-games/">Spacebar Games hub</a>.</p>
      <p>For more detail on repeated keyboard input, read <a href="/blog/mechanics-of-space-bar-clicking-game-physics/">Space Bar Clicking Game Mechanics</a> or the <a href="/blog/ultimate-hardware-guide-space-bar-click-game/">keyboard factors guide</a>.</p>
    </section>`,
  '/spacebar-clicker-test': `
<section>
      <h2>Spacebar Clicker Test modes</h2>
      <p>The Spacebar Clicker Test measures deliberate Space presses over a chosen target. Timed presets include 1, 5, 10, 30, and 60 seconds. Custom mode accepts durations from 1 to 300 seconds, while the 100-click sprint measures how long it takes to reach one hundred valid presses.</p>
      <h2>Average CPS, current CPS, and peak CPS</h2>
      <p>Average CPS is the number of valid presses divided by elapsed test time. Current CPS reflects the rolling recent one-second window, while peak CPS records the strongest one-second burst reached during the run. Some tools call the same Spacebar rate PPS, or presses per second. Keeping these metrics separate makes a short burst easier to distinguish from sustained speed.</p>
      <h2>How timed tests start and finish</h2>
      <p>The first valid press starts the timer. Once the selected deadline is reached, later key presses are rejected rather than being counted after time has expired. If the page is hidden or backgrounded, the clock pauses until the page becomes visible again. In 100-click mode, the test ends on the one-hundredth valid press and records active elapsed time.</p>
      <h2>How to compare CPS results</h2>
      <p>There is no universal “good CPS” threshold across every keyboard and test. For a meaningful comparison, keep the device, browser, duration, and input rule the same between attempts. Short tests emphasize burst speed, while longer tests put more weight on consistency.</p>
      <h2>Key-repeat protection</h2>
      <p>Holding the Space key does not generate a valid stream of clicks because browser-generated repeat events are ignored. The test is designed around repeated deliberate presses or intentional taps on the on-screen control.</p>
      <h2>Personal bests, recent results, and sharing</h2>
      <p>The best result for each selected mode is stored locally in the current browser. The page also keeps the last 10 completed runs locally with mode, clicks, elapsed time, average CPS, peak CPS, and completion time. The history can be cleared at any time. After a completed test, supported devices can use the share sheet, copy the result where clipboard access is available, or save a locally generated 1200×630 PNG result card.</p>
      <p>For an untimed session, use the <a href="/spacebar-counter/">Spacebar Counter</a>. For a progression game with upgrades and prestige, play <a href="/spacebar-clicker/">Spacebar Clicker</a>, or browse the full <a href="/spacebar-games/">Spacebar Games hub</a>.</p>
      <p>For technique and hardware context, read <a href="/blog/mechanics-of-space-bar-clicking-game-physics/">Space Bar Clicking Game Mechanics</a> and <a href="/blog/ultimate-hardware-guide-space-bar-click-game/">Keyboard Factors for Space Bar Click Games</a>.</p>
    </section>`,
  '/blog': `
    <section>
      <h2>Space clicker guides and strategy</h2>
      <p>The Mission Logs cover browser clicker mechanics, Spacebar speed tests, idle automation, prestige planning, keyboard input, progression design, and the systems behind incremental space games.</p>
      <ul>
        ${Object.entries(blogStaticMeta).sort(([, a], [, b]) => Date.parse(b.datePublished) - Date.parse(a.datePublished)).map(([postRoute, meta]) => `<li><a href="${postRoute}/">${escapeHtml(meta.title)}</a> — ${escapeHtml(meta.description)}</li>`).join('')}
      </ul>
      <p>For interactive play, open <a href="/game/galaxy_miner/">Galaxy Miner</a>, <a href="/spacebar-clicker/">Spacebar Clicker</a>, or the <a href="/spacebar-clicker-test/">Spacebar CPS Test</a>.</p>
    </section>`,
  '/about': `
    <section>
      <h2>What SpaceClickerGame.com is</h2>
      <p>SpaceClickerGame.com is a browser-based collection of clicker, idle, strategy, and Spacebar experiences. The goal is to make games and tools that start quickly, explain their mechanics clearly, and do not require an account to begin playing.</p>
      <h2>Editorial and testing principles</h2>
      <p>Guides and mechanics articles are checked against the current browser implementation whenever they describe this site's own games or tools. We avoid presenting unsupported averages, hardware claims, or universal performance thresholds as facts. Device-, browser-, duration-, and input-rule differences are stated when they materially affect a result.</p>
      <p>Upgrade costs, prestige thresholds, local save rules, CPS counting, offline progress, and milestone requirements are checked against the current code before publication or revision. External factual references are linked when they materially support a claim.</p>
      <h2>Games and tools on the site</h2>
      <p>The main catalog includes six simulations: Galaxy Miner, Mars Colony, Star Defense, Merge Spaceships, Gravity Idle, and Deep Space Signal. The Spacebar section includes an upgrade-based clicker, a counter, timed CPS tests, a 100-click sprint, and a separate Spacebar Clicker 2 progression mode.</p>
      <h2>Technology and local saves</h2>
      <p>The site uses React, Vite, Tailwind CSS, and lightweight browser graphics. Supported games store progress in the current browser rather than requiring a cloud account. Gameplay does not require a paid API.</p>
      <p>Site and policy review date: October 6, 2026. See the <a href="/privacy/">Privacy Policy</a>, <a href="/contact/">contact page</a>, or <a href="/sitemap/">HTML Sitemap</a> for more information.</p>
    </section>`,
  '/contact': `
    <section>
      <h2>Contact Space Clicker Game</h2>
      <p>Use <a href="mailto:info@spaceclickergame.com">info@spaceclickergame.com</a> for player support, bug reports, general feedback, advertising, sponsorship, press, or business inquiries related to SpaceClickerGame.com.</p>
      <h2>What to include in a bug report</h2>
      <p>For gameplay or save problems, include the game or tool name, browser, device type, the action that triggered the issue, and what you expected to happen. If the issue is reproducible, include the shortest sequence of steps that causes it.</p>
      <h2>Privacy when contacting support</h2>
      <p>Do not send passwords, authentication credentials, payment details, or other sensitive secrets. Current game saves are primarily stored in the local browser, so support may ask for non-sensitive information about the affected browser or exported save only when relevant.</p>
    </section>`,
  '/privacy': `
    <section>
      <h2>Local game data</h2>
      <p>SpaceClickerGame.com is primarily a client-side browser experience. Supported games store progress, settings, local records, upgrades, and offline-progression timestamps in browser localStorage. This game-state data is not sent to a site analytics database by the current build.</p>
      <h2>Analytics, advertising, and network requests</h2>
      <p>The current production build does not include Google Analytics, Google Tag Manager, or Google AdSense code. Normal web requests can still expose standard connection information such as IP address and browser headers to the hosting provider and to third-party asset hosts used by a page.</p>
      <p>Current pages may request font files from Google Fonts and editorial or social-preview images from Unsplash. Those requests are made directly by the browser to the relevant provider and can include standard network information such as IP address, user agent, and request headers.</p>
      <h2>Saving, exporting, and clearing data</h2>
      <p>Local game data is used to restore supported progress and calculate offline earnings. Clearing browser site storage can permanently remove local saves. Exported save codes and .scg backup files are portable data and should be treated as backups rather than encrypted secrets.</p>
      <h2>Security and contact</h2>
      <p>The production site is served over HTTPS. Questions about privacy can be sent to <a href="mailto:info@spaceclickergame.com">info@spaceclickergame.com</a>. Effective date: October 6, 2026.</p>
    </section>`,
  '/terms': `
    <section>
      <h2>Use of the site</h2>
      <p>By using SpaceClickerGame.com, you agree to use its browser games, tools, guides, and related materials lawfully. Do not intentionally interfere with service operation, attempt unauthorized access to systems or data, or generate abusive automated traffic that disrupts normal use.</p>
      <h2>Content and redistribution</h2>
      <p>Using the site does not transfer ownership of its games, code, editorial content, or protected assets. Do not commercially redistribute protected site materials without permission from the applicable rights holder.</p>
      <h2>Local saves and availability</h2>
      <p>Supported game progress is stored locally in the current browser. Local storage can be cleared by the user, browser, device, or privacy settings, and private-browsing sessions may not persist data. Where a portable backup option exists, keeping a separate backup is the user's responsibility.</p>
      <p>The site may be changed, updated, interrupted, or discontinued without guaranteeing uninterrupted availability of every game, feature, or locally stored save.</p>
      <h2>Disclaimer and limitations</h2>
      <p>The site is provided on an "as is" and "as available" basis to the extent permitted by applicable law. We do not guarantee that every feature will be error-free or compatible with every browser or device. To the extent permitted by law, Space Clicker Game is not liable for indirect, incidental, special, consequential, or similar losses arising from use of, or inability to use, the site, including loss of locally stored progress.</p>
      <h2>Applicable law and consumer rights</h2>
      <p>Applicable law, jurisdiction, and any non-waivable consumer rights depend on the circumstances and the laws that legally apply to the site operator and user. Nothing in these terms is intended to exclude rights that cannot lawfully be excluded. Last updated: October 6, 2026.</p>
    </section>`,
  '/cookies': `
    <section>
      <h2>LocalStorage is the main game storage</h2>
      <p>SpaceClickerGame.com primarily uses browser localStorage for game progress, settings, offline timestamps, and local records. localStorage is different from an HTTP cookie and is used so supported games can restore progress after the tab is closed.</p>
      <h2>Examples of functional storage</h2>
      <p>Current game modes use local storage keys for Galaxy Miner, Spacebar Clicker, Spacebar Clicker 2, Spacebar Counter, CPS Test records, and other simulations. The exact key list can change as games are updated.</p>
      <h2>Analytics and advertising</h2>
      <p>The current build does not include Google Analytics, Google Tag Manager, or Google AdSense scripts. If third-party analytics or advertising services are introduced later, this notice should be updated before those services are enabled.</p>
      <h2>Clearing site data</h2>
      <p>Browser controls can clear cookies and local storage. Clearing the browser's site storage will remove supported local game progress unless you kept an exported save code or backup file. The in-site reset control removes Space Clicker Game saves, Spacebar records, and game settings without calling localStorage.clear() for unrelated origin data.</p>
    </section>`,
  '/sitemap': `
    <section>
      <h2>Games</h2>
      <ul>
        <li><a href="/game/galaxy_miner/">Galaxy Miner</a></li>
        <li><a href="/game/mars_colony/">Mars Colony Idle</a></li>
        <li><a href="/game/star_defense/">Star Defense</a></li>
        <li><a href="/game/merge_ships/">Merge Spaceships</a></li>
        <li><a href="/game/gravity_idle/">Gravity Idle</a></li>
        <li><a href="/game/deep_signal/">Deep Space Signal</a></li>
      </ul>
      <h2>Spacebar games and tools</h2>
      <ul>
        <li><a href="/spacebar-games/">Spacebar Games Hub</a></li>
        <li><a href="/spacebar-clicker/">Spacebar Clicker</a></li>
        <li><a href="/spacebar-clicker-2/">Spacebar Clicker 2</a></li>
        <li><a href="/spacebar-counter/">Spacebar Counter</a></li>
        <li><a href="/spacebar-clicker-test/">Spacebar Clicker Test</a></li>
        <li><a href="/spacebar-clicker-unblocked/">Spacebar Clicker Instant Browser Mode</a></li>
      </ul>
      <h2>Guides and site pages</h2>
      <ul>
        <li><a href="/compare/">Game Feature Comparison</a></li>
        <li><a href="/achievements/">Galaxy Miner Milestones</a></li>
        <li><a href="/blog/">Mission Logs</a></li>
        <li><a href="/about/">About</a></li>
        <li><a href="/contact/">Contact</a></li>
        <li><a href="/privacy/">Privacy Policy</a></li>
        <li><a href="/terms/">Terms of Service</a></li>
        <li><a href="/cookies/">Cookie & Local Storage Settings</a></li>
      </ul>
      <h2>Blog articles</h2>
      <ul>
        ${Object.entries(blogStaticMeta).map(([postRoute, meta]) => `<li><a href="${postRoute}/">${escapeHtml(meta.title)}</a></li>`).join('')}
      </ul>
    </section>`,
  '/spacebar-clicker-unblocked': `
    <section>
      <h2>Instant browser Spacebar Clicker</h2>
      <p>This page opens the full Spacebar Clicker experience directly in a modern browser with no download, launcher, extension, or account step. Desktop players can press the physical Space key, while mobile players can use the large on-screen control.</p>
      <h2>Same upgrades, automation, and prestige</h2>
      <p>The instant-play route uses the same point economy as the main <a href="/spacebar-clicker/">Spacebar Clicker</a>: manual presses earn points, upgrades improve each press, automatic production grows over time, and Hyperdrive Prestige converts large runs into permanent Quantum Keys.</p>
      <h2>Local saves and offline earnings</h2>
      <p>Progress is stored locally in the current browser rather than in a cloud account. Once automatic production is available, supported saved runs can credit up to 24 hours of offline earnings when the player returns. Clearing site storage or changing devices can separate or remove that local save.</p>
      <h2>What “unblocked” means here</h2>
      <p>“Unblocked” on this page means direct browser access without an installation step. It does not bypass school, workplace, parental-control, firewall, device-management, or network-administrator restrictions. Whether the site can be reached is controlled by the device and network in use.</p>
      <h2>Spacebar Clicker Unblocked FAQ</h2>
      <h3>What does “unblocked” mean on this page?</h3>
      <p>It means the game opens directly in a browser with no installation, launcher, extension, or account step. It does not bypass network restrictions.</p>
      <h3>Can a school or workplace network still block the game?</h3>
      <p>Yes. Access depends on the rules applied by the network, device, firewall, parental controls, or administrator.</p>
      <h3>Does the instant-play version save progress?</h3>
      <p>Yes. Progress is stored locally in the current browser with no cloud or cross-device sync.</p>
      <h3>Is this the same Spacebar Clicker game?</h3>
      <p>Yes. It uses the same upgrades, automation, CPS logic, and Hyperdrive prestige system as the main Spacebar Clicker page.</p>
      <p>For speed testing, use the <a href="/spacebar-clicker-test/">Spacebar Clicker Test</a>; for an endless total, use the <a href="/spacebar-counter/">Spacebar Counter</a>; or browse the full <a href="/spacebar-games/">Spacebar Games hub</a>.</p>
      <p>For a broader guide to Spacebar input and progression, read <a href="/blog/mastering-the-space-bar-clicking-game/">Mastering the Space Bar</a>.</p>
    </section>`,
  '/compare': `
    <section>
      <h2>What this clicker game comparison measures</h2>
      <p>This page compares game structure rather than assigning a universal score. The snapshot looks at active input, idle automation, progression or reset structure, events, theme, and presentation across Galaxy Miner, Cookie Clicker, Universal Paperclips, Antimatter Dimensions, SPACEPLAN, and Melvor Idle.</p>
      <h2>How Galaxy Miner differs</h2>
      <p>Galaxy Miner combines manual Stardust mining with automated production and an active Heat system. Keeping Heat between 80% and 99% activates the 2x Heat Flux bonus, while reaching 100% overheats the beam. Golden Comets, crisis events, anomaly scans, and a Dark Matter Galactic Reset add decisions beyond the basic production loop.</p>
      <h2>Different incremental game structures</h2>
      <ul>
        <li><strong><a href="https://orteil.dashnet.org/cookieclicker/">Cookie Clicker</a></strong> combines manual cookie input, automated buildings, Golden Cookies, and ascension.</li>
        <li><strong><a href="https://www.decisionproblem.com/paperclips/">Universal Paperclips</a></strong> uses staged narrative progression, automation, autonomous probes, and late-game probe hazards and combat rather than a conventional repeating prestige loop.</li>
        <li><strong><a href="https://store.steampowered.com/app/1399720/Antimatter_Dimensions/">Antimatter Dimensions</a></strong> emphasizes automation and layered progression through Infinity, Eternity, and Reality.</li>
        <li><strong><a href="https://store.steampowered.com/app/616110/SPACEPLAN/">SPACEPLAN</a></strong> is a story-driven science-fiction clicker built around potato-based devices, probes, and staged discoveries rather than a repeatable prestige economy.</li>
        <li><strong><a href="https://store.steampowered.com/app/1267910/Melvor_Idle/">Melvor Idle</a></strong> centers on skills, mastery, equipment, crafting, dungeons, and combat instead of one global prestige-reset loop.</li>
      </ul>
      <p>The comparison is a feature snapshot, not a ranking. Third-party names and trademarks belong to their respective owners; SpaceClickerGame.com is not affiliated with those projects. External game features can change, so the linked primary pages should be used for current product details. The listed comparison sources were reviewed on October 6, 2026.</p>
      <p>You can <a href="/game/galaxy_miner/">play Galaxy Miner</a> directly or explore the site's <a href="/spacebar-games/">Spacebar games and tools</a>.</p>
    </section>`,
  '/achievements': `
    <section>
      <h2>How Galaxy Miner milestones are tracked</h2>
      <p>The milestone dashboard reads supported progress from the Galaxy Miner save stored in the current browser. It tracks visible progression goals; it is not a cloud account, public leaderboard, or separate hidden-reward system.</p>
      <h2>Mining milestones</h2>
      <p>The lifetime Stardust ladder tracks 1,000, 1 million, 1 billion, 1 trillion, and 1 quadrillion Stardust. Reaching 1 trillion Stardust also reaches the first threshold at which Galactic Reset becomes available.</p>
      <h2>Automation milestones</h2>
      <p>Automation goals include owning 25 Mining Drones, 50 Orbital Stations, and at least one Dyson Swarm. The normal production system also applies upgrade milestone multipliers at key ownership thresholds, so these goals connect directly to the game's economy.</p>
      <h2>Dark Matter milestones</h2>
      <p>The tracker reads the current Dark Matter balance from the local Galaxy Miner save. It marks milestones at 1 and 100 currently held Dark Matter. Because Dark Matter can be spent on Void Technology, this page does not claim to preserve a historical count of past resets or previously spent Dark Matter.</p>
      <p>Progress is local to this browser. Clearing the site's local storage or using a reset action can remove locally saved progress. Open <a href="/game/galaxy_miner/">Galaxy Miner</a> to continue a run or read the <a href="/blog/strategy-guide-clicker-game-space-empire/">strategy guide</a> for upgrade and reset planning.</p>
    </section>`
};

const renderHtml = (route, title, description, h1) => {
  const canonical = site + (route === '/' ? '/' : route + '/');
  const isArticle = route.startsWith('/blog/');
  const socialImage = getRouteSocialImage(route);
  let html = baseHtml;
  html = html.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(title)}</title>`);
  html = html.replace(/<meta name="description"[^>]*>/i, `<meta name="description" data-rh="true" content="${escapeHtml(description)}">`);
  html = html.replace(/<meta property="og:title"[^>]*>/i, `<meta property="og:title" data-rh="true" content="${escapeHtml(title)}" />`);
  html = html.replace(/<meta property="og:description"[^>]*>/i, `<meta property="og:description" data-rh="true" content="${escapeHtml(description)}" />`);
  html = html.replace(/<meta property="og:type"[^>]*>/i, `<meta property="og:type" data-rh="true" content="${isArticle ? 'article' : 'website'}" />`);
  html = html.replace(
    /<meta property="og:image"[^>]*>/i,
    `<meta property="og:image" content="${escapeHtml(socialImage)}" />`
  );
  if (!isArticle && HIGH_VALUE_SCHEMA_ROUTES.has(route)) {
    const routeSchema = buildStaticRouteSchema(route, description, canonical);
    if (routeSchema) {
      const safeRouteSchema = JSON.stringify(routeSchema).replace(/</g, '\\u003c');
      html = html.replace('</head>', `  <script id="prerender-route-jsonld" type="application/ld+json">${safeRouteSchema}</script>\n</head>`);
    }
  }

  if (isArticle) {
    const articleMeta = blogStaticMeta[route];

    if (articleMeta) {
      html = html.replace(
        '</head>',
        `  <meta name="author" content="${escapeHtml(articleMeta.author)}" />\n  <meta property="article:published_time" content="${escapeHtml(articleMeta.datePublished)}" />\n  <meta property="article:modified_time" content="${escapeHtml(articleMeta.dateModified)}" />\n  <meta property="article:author" content="https://spaceclickergame.com/about/" />\n</head>`
      );
      const articleSchema = {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Article",
            "@id": canonical + "#article",
            "headline": articleMeta.title,
            "image": [articleMeta.image],
            "datePublished": articleMeta.datePublished,
            "dateModified": articleMeta.dateModified,
            "author": [{
              "@type": "Organization",
              "@id": EDITORIAL_ID,
              "name": articleMeta.author,
              "url": site + "/about/",
              "parentOrganization": { "@id": ORGANIZATION_ID }
            }],
            "publisher": {
              "@id": ORGANIZATION_ID
            },
            "description": articleMeta.description,
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": canonical
            }
          },
          {
            "@type": "Organization",
            "@id": ORGANIZATION_ID,
            "name": "Space Clicker Game",
            "url": site + "/",
            "logo": {
              "@type": "ImageObject",
              "url": ORGANIZATION_LOGO
            }
          },
          {
            "@type": "BreadcrumbList",
            "@id": canonical + "#breadcrumb",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Space Clicker Game", "item": "https://spaceclickergame.com/" },
              { "@type": "ListItem", "position": 2, "name": "Mission Logs", "item": "https://spaceclickergame.com/blog/" },
              { "@type": "ListItem", "position": 3, "name": articleMeta.title, "item": canonical }
            ]
          }
        ]
      };
      const safeSchema = JSON.stringify(articleSchema).replace(/</g, '\\u003c');
      html = html.replace('</head>', `  <script id="prerender-article-jsonld" type="application/ld+json">${safeSchema}</script>\n</head>`);
    }
  }
  if (/<meta property="og:url"[^>]*>/i.test(html)) {
    html = html.replace(/<meta property="og:url"[^>]*>/i, `<meta property="og:url" data-rh="true" content="${canonical}" />`);
  } else {
    html = html.replace('</head>', `  <meta property="og:url" data-rh="true" content="${canonical}" />\n</head>`);
  }
  if (/<meta name="twitter:title"[^>]*>/i.test(html)) {
    html = html.replace(/<meta name="twitter:title"[^>]*>/i, `<meta name="twitter:title" data-rh="true" content="${escapeHtml(title)}" />`);
  } else {
    html = html.replace('</head>', `  <meta name="twitter:title" data-rh="true" content="${escapeHtml(title)}" />\n</head>`);
  }
  if (/<meta name="twitter:description"[^>]*>/i.test(html)) {
    html = html.replace(/<meta name="twitter:description"[^>]*>/i, `<meta name="twitter:description" data-rh="true" content="${escapeHtml(description)}" />`);
  } else {
    html = html.replace('</head>', `  <meta name="twitter:description" data-rh="true" content="${escapeHtml(description)}" />\n</head>`);
  }
  html = html.replace('</head>', `  <meta property="og:image:width" data-rh="true" content="1200" />\n  <meta property="og:image:height" data-rh="true" content="630" />\n  <meta property="og:image:alt" data-rh="true" content="${escapeHtml(title)}" />\n  <meta name="twitter:card" data-rh="true" content="summary_large_image" />\n  <meta name="twitter:image" data-rh="true" content="${escapeHtml(socialImage)}" />\n  <meta name="twitter:image:alt" data-rh="true" content="${escapeHtml(title)}" />\n</head>`);
  // Mark static SEO tags as Helmet-managed so the client can reconcile them
  // instead of appending a second canonical/meta set after React mounts.
  html = html.replace(/<meta property="og:image"([^>]*)>/i, '<meta property="og:image" data-rh="true"$1>');
  html = html.replace(/<meta property="og:site_name"([^>]*)>/i, '<meta property="og:site_name" data-rh="true"$1>');
  html = html.replace('</head>', `  <meta name="robots" data-rh="true" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />\n  <link rel="alternate" data-rh="true" href="${canonical}" hreflang="en" />\n  <link rel="alternate" data-rh="true" href="${canonical}" hreflang="x-default" />\n  <link rel="canonical" data-rh="true" href="${canonical}" />\n</head>`);
  html = html.replace(
    '<div id="root"></div>',
    `<div id="root"><main style="max-width:900px;margin:0 auto;padding:48px 20px;color:#e5e7eb;background:#0b0d17;min-height:100vh"><h1>${escapeHtml(h1)}</h1><p>${escapeHtml(description)}</p>${blogStaticContent[route] || staticRouteContent[route] || ''}<nav aria-label="Site navigation" style="margin-top:32px;line-height:1.9">
<a href="/" style="color:#00f3ff">Home</a> ·
<a href="/game/galaxy_miner/" style="color:#00f3ff">Galaxy Miner</a> ·
<a href="/game/mars_colony/" style="color:#00f3ff">Mars Colony</a> ·
<a href="/game/star_defense/" style="color:#00f3ff">Star Defense</a> ·
<a href="/game/merge_ships/" style="color:#00f3ff">Merge Spaceships</a> ·
<a href="/game/gravity_idle/" style="color:#00f3ff">Gravity Idle</a> ·
<a href="/game/deep_signal/" style="color:#00f3ff">Deep Space Signal</a> ·
<a href="/spacebar-games/" style="color:#00f3ff">Spacebar Games</a> ·
<a href="/spacebar-clicker/" style="color:#00f3ff">Spacebar Clicker</a> ·
<a href="/spacebar-clicker-2/" style="color:#00f3ff">Spacebar Clicker 2</a> ·
<a href="/spacebar-counter/" style="color:#00f3ff">Spacebar Counter</a> ·
<a href="/spacebar-clicker-test/" style="color:#00f3ff">Spacebar Clicker Test</a> ·
<a href="/spacebar-clicker-unblocked/" style="color:#00f3ff">Instant Play</a> ·
<a href="/compare/" style="color:#00f3ff">Compare</a> ·
<a href="/achievements/" style="color:#00f3ff">Milestones</a> ·
<a href="/blog/" style="color:#00f3ff">Blog</a> ·
<a href="/about/" style="color:#00f3ff">About</a>
</nav></main></div>`
  );
  return html;
};

for (const [route, title, description, h1] of routes) {
  if (route === '/') {
    fs.writeFileSync(basePath, renderHtml(route, title, description, h1));
    continue;
  }
  const targetDir = path.join(distDir, route.replace(/^\//, ''));
  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(path.join(targetDir, 'index.html'), renderHtml(route, title, description, h1));
}

// A top-level 404.html prevents Cloudflare Pages from applying SPA fallback to
// missing static-looking URLs such as /missing.html or /assets/missing.js.
// Every supported route above already has a prerendered file, so valid direct
// navigation remains unaffected while unknown paths receive a true 404.
const notFoundHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <meta name="robots" content="noindex,nofollow">
  <meta name="theme-color" content="#0b0d17">
  <title>404 - Signal Lost | Space Clicker Game</title>
  <meta name="description" content="The requested Space Clicker Game page could not be found.">
  <style>
    :root{color-scheme:dark}
    body{margin:0;background:#0b0d17;color:#e5e7eb;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    main{max-width:760px;margin:0 auto;padding:12vh 24px}
    .code{font:800 clamp(64px,18vw,160px)/1 ui-monospace,SFMono-Regular,Menlo,monospace;color:#00f3ff}
    h1{font-size:clamp(28px,5vw,48px);margin:12px 0}
    p{color:#9ca3af;line-height:1.7}
    a{display:inline-block;margin-top:24px;padding:12px 18px;border:1px solid #00f3ff;border-radius:10px;color:#00f3ff;text-decoration:none}
  </style>
</head>
<body>
  <main>
    <div class="code">404</div>
    <h1>Signal Lost</h1>
    <p>The coordinates you entered do not match a known game, Spacebar tool, guide, or site page.</p>
    <a href="/">Return to Space Clicker Game</a>
  </main>
</body>
</html>`;
fs.writeFileSync(path.join(distDir, '404.html'), notFoundHtml);

const sitemapRoutes = routes.map(([route]) => route);
// Update this date only when core non-article pages receive a meaningful
// content, gameplay, metadata, or routing change. Article dates come from
// their own updatedDate metadata.
const coreLastModified = SITE_CONTENT_UPDATED;
const getSitemapLastModified = (route) => {
  const articleMeta = blogStaticMeta[route];
  if (!articleMeta) return coreLastModified;
  return articleMeta.dateModified.slice(0, 10);
};
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapRoutes.map((route) => `  <url><loc>${site}${route === '/' ? '/' : route + '/'}</loc><lastmod>${getSitemapLastModified(route)}</lastmod></url>`).join('\n')}\n</urlset>\n`;
fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemap);

const rssItems = Object.entries(blogStaticMeta)
  .sort(([, a], [, b]) => Date.parse(b.datePublished) - Date.parse(a.datePublished))
  .map(([route, meta]) => {
  const url = site + route + '/';
  return [
    '    <item>',
    `      <title>${escapeXml(meta.title)}</title>`,
    `      <link>${escapeXml(url)}</link>`,
    `      <guid isPermaLink="true">${escapeXml(url)}</guid>`,
    `      <pubDate>${new Date(meta.datePublished).toUTCString()}</pubDate>`,
    `      <description>${escapeXml(meta.description)}</description>`,
    '    </item>'
  ].join('\n');
}).join('\n');

const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <atom:link href="${site}/feed.xml" rel="self" type="application/rss+xml" />
    <title>Space Clicker Game Blog</title>
    <link>${site}/blog/</link>
    <description>Guides, mechanics explainers and strategy articles for space clicker, incremental browser games and Spacebar tools.</description>
    <language>en</language>
    <lastBuildDate>${new Date(SITE_CONTENT_UPDATED + 'T00:00:00Z').toUTCString()}</lastBuildDate>
    <ttl>1440</ttl>
${rssItems}
  </channel>
</rss>
`;
fs.writeFileSync(path.join(distDir, 'feed.xml'), rss);

const coreRouteRows = routes
  .filter(([route]) => !route.startsWith('/blog/') || route === '/blog')
  .map(([route, title, description]) => {
    const url = site + (route === '/' ? '/' : route + '/');
    return `- [${title}](${url}): ${description}`;
  })
  .join('\n');

const guideRows = Object.entries(blogStaticMeta)
  .sort(([, a], [, b]) => Date.parse(b.datePublished) - Date.parse(a.datePublished))
  .map(([route, meta]) => `- [${meta.title}](${site + route + '/'}): ${meta.description}`)
  .join('\n');

const llms = `# Space Clicker Game

> Free browser-based space clicker, idle and strategy simulations plus dedicated Spacebar clicker, counter and CPS tools. Current game saves and test records are stored locally in the browser; no account is required for the current tools.

Last reviewed: ${SITE_CONTENT_UPDATED}

## Core pages

${coreRouteRows}

## Guides

${guideRows}

## Site facts

- Canonical origin: ${site}/
- Primary game: Galaxy Miner
- Current simulation count: 6
- Spacebar tools include an incremental clicker, an untimed counter, timed CPS tests, a 100-click sprint and a separate Spacebar Clicker 2 progression mode.
- Supported saves and personal records use local browser storage rather than automatic cloud sync. Galaxy Miner, Spacebar Clicker, and Spacebar Clicker 2 can export and import manual save backups.
- Privacy: ${site}/privacy/
- About: ${site}/about/
- HTML sitemap: ${site}/sitemap/
- XML sitemap: ${site}/sitemap.xml
- RSS feed: ${site}/feed.xml
`;
fs.writeFileSync(path.join(distDir, 'llms.txt'), llms);

console.log(`Prerendered ${routes.length} routes (${Object.keys(blogStaticContent).length} full blog articles); generated 404.html, sitemap.xml, feed.xml and llms.txt`);
