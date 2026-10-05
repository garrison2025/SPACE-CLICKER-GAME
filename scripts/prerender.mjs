import fs from 'node:fs';
import path from 'node:path';

const distDir = path.resolve('dist');
const basePath = path.join(distDir, 'index.html');

if (!fs.existsSync(basePath)) {
  throw new Error('dist/index.html not found. Run vite build before prerender.');
}

const baseHtml = fs.readFileSync(basePath, 'utf8');
const site = 'https://spaceclickergame.com';
const SITE_CONTENT_UPDATED = '2026-10-05';

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
    image: readField('image')
  };
}

if (Object.keys(blogStaticContent).length !== 10) {
  throw new Error(`Expected 10 blog posts for prerender, found ${Object.keys(blogStaticContent).length}`);
}

const routes = [
  ['/', 'Space Clicker – Free Space Clicker Game Online', 'Play Space Clicker free online. Mine Stardust, automate production, manage Heat Flux, catch Golden Comets, and reset for permanent Dark Matter upgrades.', 'Space Clicker Game'],
  ['/game/galaxy_miner', 'Galaxy Miner – Space Mining Idle Clicker Online', 'Play Galaxy Miner online: mine Stardust, automate a space economy, manage Heat Flux, catch Golden Comets, and reset for permanent Dark Matter upgrades.', 'Galaxy Miner'],
  ['/game/mars_colony', 'Mars Colony Idle - Free Space Strategy Game', 'Build and balance a browser-based Mars colony with Oxygen, Food, Energy, population growth, and idle resource progression.', 'Mars Colony Idle'],
  ['/game/star_defense', 'Star Defense - Free Space Defense Clicker', 'Defend your mothership from alien waves, click enemies for direct damage, and upgrade auto-turrets in a browser defense game.', 'Star Defense'],
  ['/game/merge_ships', 'Merge Spaceships - Free Browser Merge Game', 'Drag and combine matching ships, evolve higher-level vessels, and place your fleet in orbit for passive income.', 'Merge Spaceships'],
  ['/game/gravity_idle', 'Gravity Idle - Free Physics Idle Game', 'Launch projectiles into gravity wells, automate firing, upgrade orbital mechanics, and break apart asteroid layers in your browser.', 'Gravity Idle'],
  ['/game/deep_signal', 'Deep Space Signal - Free Browser Text Adventure', 'Send signals, manage energy, decode strange transmissions, and uncover a text-based deep-space mystery in your browser.', 'Deep Space Signal'],
  ['/spacebar-games', 'Spacebar Games - Clicker, Counter & CPS Tests', 'Play free spacebar games online: Spacebar Clicker, Spacebar Counter, timed CPS tests, a 100-click sprint and instant browser play.', 'Spacebar Games'],
  ['/spacebar-clicker-2', 'Spacebar Clicker 2 - Upgraded Idle Space Bar Game', 'Play Spacebar Clicker 2, an enhanced browser idle game with Overdrive, auto-production, upgrades, offline earnings and Nova Core ascension.', 'Spacebar Clicker 2'],
  ['/spacebar-clicker', 'Spacebar Clicker – Free Space Bar Clicker Game Online', 'Play Spacebar Clicker free online. Press Space for points, buy upgrades, automate production, track CPS, and prestige for permanent Quantum Keys.', 'Spacebar Clicker'],
  ['/spacebar-counter', 'Spacebar Counter - Count Space Bar Presses & CPS', 'Free online Spacebar Counter with total presses, current CPS, average CPS, peak CPS and local best. Works with keyboard and mobile touch.', 'Spacebar Counter'],
  ['/spacebar-clicker-test', 'Spacebar Clicker Test - Space Bar CPS & Speed Test', 'Test your spacebar speed with 1, 5, 10, 30 or 60 second CPS tests. See clicks, average CPS, peak CPS and your best local score.', 'Spacebar Clicker Test'],
  ['/spacebar-clicker-unblocked', 'Spacebar Clicker Unblocked - Play Instantly in Your Browser', 'Play Spacebar Clicker instantly in your browser with no download or account. Keyboard and mobile controls, upgrades, local save and prestige.', 'Spacebar Clicker Unblocked'],
  ['/compare', 'Space Clicker Game vs Classic Incremental Games: Feature Comparison', 'Compare gameplay structure, automation, prestige, events, and presentation across Space Clicker Game and several well-known incremental games.', 'Space Clicker Feature Comparison'],
  ['/achievements', 'Galaxy Miner Milestones & Progress Tracker | Space Clicker Game', 'Track Galaxy Miner mining, automation, and Dark Matter milestones from your local browser save.', 'Galaxy Miner Milestones'],
  ['/blog', 'Space Clicker Game Blog - Guides & Strategy', 'Read guides, mechanics explainers and strategy articles for space clicker and incremental browser games.', 'Space Clicker Game Blog'],
  ['/about', 'About | Space Clicker Game', 'Learn about SpaceClickerGame.com and its free browser-based clicker, idle and spacebar experiences.', 'About Space Clicker Game'],
  ['/contact', 'Contact | Space Clicker Game', 'Contact SpaceClickerGame.com for player support, bug reports, feedback, business, advertising, or press questions.', 'Contact Space Clicker Game'],
  ['/privacy', 'Privacy Policy | Space Clicker Game', 'Read how SpaceClickerGame.com handles browser-local game saves, exported save codes, hosting requests, analytics, and advertising technologies.', 'Privacy Policy'],
  ['/terms', 'Terms of Service | Space Clicker Game', 'Read the terms that apply when using SpaceClickerGame.com and its browser-based games and tools.', 'Terms of Service'],
  ['/cookies', 'Cookie & Local Storage Settings | Space Clicker Game', 'Learn how SpaceClickerGame.com uses browser localStorage for game progress and what clearing site storage does to local saves.', 'Cookie & Local Storage Settings'],
  ['/sitemap', 'HTML Sitemap | Space Clicker Game', 'Browse the main games, Spacebar tools, guides, support pages, and legal resources available on SpaceClickerGame.com.', 'HTML Sitemap'],
  ['/blog/evolution-of-space-clicker-game-genre', 'The Evolution of the Space Clicker Game Genre | Space Clicker Game Blog', 'Explore how space clicker games evolved from simple counters into deeper incremental and idle systems.', 'The Evolution of the Space Clicker Game Genre'],
  ['/blog/psychology-of-space-clicking-games', 'The Psychology of Space Clicking Games | Space Clicker Game Blog', 'A look at feedback loops, progression and player motivation in space clicking games.', 'The Psychology of Space Clicking Games'],
  ['/blog/mastering-the-space-bar-clicking-game', 'Mastering the Space Bar Clicking Game | Space Clicker Game Blog', 'Practical techniques for space bar clicking games, active play and automation.', 'Mastering the Space Bar Clicking Game'],
  ['/blog/top-10-space-clicking-games-features-2025', 'Features Defining Modern Space Clicking Games | Space Clicker Game Blog', 'Modern space clicking games combine visible progression, automation, offline systems, and active choices.', 'Features Defining Modern Space Clicking Games'],
  ['/blog/mechanics-of-space-bar-clicking-game-physics', 'Mechanics of a Space Bar Clicking Game | Space Clicker Game Blog', 'Understand CPS, input feedback and progression mechanics behind space bar clicking games.', 'Mechanics of a Space Bar Clicking Game'],
  ['/blog/strategy-guide-clicker-game-space-empire', 'Space Clicker Strategy Guide | Space Clicker Game Blog', 'Build a stronger incremental space economy with upgrades, automation and prestige strategy.', 'Space Clicker Strategy Guide'],
  ['/blog/educational-value-of-space-clicker-games', 'Educational Value of Space Clicker Games | Space Clicker Game Blog', 'How incremental games can make exponential growth, reinvestment and systems thinking easier to visualize.', 'Educational Value of Space Clicker Games'],
  ['/blog/active-vs-passive-space-click-game-styles', 'Active vs Passive Space Click Game Styles | Space Clicker Game Blog', 'Compare active clicking and passive automation strategies in browser-based space click games.', 'Active vs Passive Space Click Game Styles'],
  ['/blog/narrative-design-clicker-game-space-adventure', 'Narrative Design in the Clicker Game Space Genre | Space Clicker Game Blog', 'Explore how flavor text and abstract systems create stories in incremental space games.', 'Narrative Design in Clicker Space Games'],
  ['/blog/ultimate-hardware-guide-space-bar-click-game', 'Keyboard Factors for Space Bar Click Games | Space Clicker Game Blog', 'A practical guide to switch feel, actuation, stabilizers, durability, and ergonomics for repeated keyboard input.', 'Keyboard Factors for Space Bar Click Games']
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
  '/game/deep_signal': { name: 'Deep Space Signal', genres: ['Text Adventure', 'Mystery', 'Sci-Fi', 'Single Player'] }
};

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
            "@type": "Organization",
            "name": "Space Clicker Game"
          }
        },
        {
          "@type": "VideoGame",
          "@id": site + "/game/galaxy_miner/#game",
          "url": site + "/game/galaxy_miner/",
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
          "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
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
          "name": "Spacebar Games",
          "description": description,
          "url": canonical,
          "dateModified": SITE_CONTENT_UPDATED
        },
        {
          "@type": "ItemList",
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
        }
      ]
    };
  }

  if (route === '/spacebar-counter' || route === '/spacebar-clicker-test') {
    const name = route === '/spacebar-counter' ? 'Spacebar Counter' : 'Spacebar Clicker Test';
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
          "itemListElement": Object.entries(blogStaticMeta).map(([postRoute, meta], index) => ({
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
            "@id": site + "/#organization",
            "name": "Space Clicker Game",
            "url": site + "/"
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
      'First Galactic Reset',
      '100 Dark Matter'
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
      <h2>Play instantly in your browser</h2>
      <p>No account or download is required. Galaxy Miner stores supported progress locally in the current browser.</p>
      <h2>Idle progression and mobile play</h2>
      <p>Galaxy Miner begins with manual mining and shifts toward automated production. Returning after time away can credit up to 24 hours of saved automatic production. Touch controls work in modern mobile browsers.</p>
      <p><a href="/blog/strategy-guide-clicker-game-space-empire/">Read the Space Clicker strategy guide</a> for upgrade and Galactic Reset planning.</p>
    </section>`,
  '/game/galaxy_miner': `
    <section>
      <h2>Galaxy Miner gameplay</h2>
      <p>Galaxy Miner is a browser-based space mining idle clicker. Mine Stardust, automate production, manage Heat Flux, catch Golden Comets, respond to crisis events, and reset large runs for Dark Matter.</p>
      <h2>Permanent progression</h2>
      <p>Galactic Reset becomes available from 1 trillion Stardust. Stardust and standard upgrades reset while Dark Matter and permanent Void Technology remain.</p>
    </section>`,
  '/game/mars_colony': `
    <section>
      <h2>Mars Colony gameplay</h2>
      <p>Build a browser-based Mars settlement by balancing Minerals, Credits, Colonists, Energy, Food, and Oxygen. Construction choices change production, consumption, storage, and population growth.</p>
      <h2>Colony management</h2>
      <p>Expand with miners, power systems, habitats, greenhouses, and later infrastructure while keeping life-support resources from becoming bottlenecks.</p>
    </section>`,
  '/game/star_defense': `
    <section>
      <h2>Star Defense gameplay</h2>
      <p>Defend the mothership from incoming alien waves. Click enemies for direct damage, collect Scrap, purchase upgrades, and combine manual fire with automated turrets and tactical abilities.</p>
      <h2>Wave progression</h2>
      <p>Enemy pressure increases across waves, with shield, hull, repair, damage, fire-rate, and other upgrades shaping each run.</p>
    </section>`,
  '/game/merge_ships': `
    <section>
      <h2>Merge Spaceships gameplay</h2>
      <p>Buy or open ships, combine matching levels to create stronger vessels, and place ships in orbit to generate passive combat income.</p>
      <h2>Hangar and orbit</h2>
      <p>The hangar is used for collecting and merging ships while orbit slots turn deployed vessels into automatic asteroid damage and Credits.</p>
    </section>`,
  '/game/gravity_idle': `
    <section>
      <h2>Gravity Idle gameplay</h2>
      <p>Launch projectiles into a gravity field, break apart asteroids and geodes, collect Matter, and improve gravity, launchers, fire rate, impact power, and piercing.</p>
      <h2>Physics idle progression</h2>
      <p>Automation increases projectile output while upgrades change how quickly the simulation generates Matter and clears incoming objects.</p>
    </section>`,
  '/game/deep_signal': `
    <section>
      <h2>Deep Space Signal gameplay</h2>
      <p>Spend Energy to scan for transmissions, decode messages, collect Data, and improve antenna, processor, battery, solar, and automation systems.</p>
      <h2>Signal factions</h2>
      <p>Decoded transmissions can interact with BIO, TECH, MIL, and VOID progression, which modifies parts of the signal-decoding economy.</p>
    </section>`,
  '/spacebar-games': `
    <section>
      <h2>Choose a Spacebar mode</h2>
      <p>Use Spacebar Clicker for an idle upgrade game, Spacebar Counter for an untimed press total, and Spacebar Clicker Test for timed CPS challenges including 1, 5, 10, 30 and 60 seconds plus a 100-click sprint.</p>
      <ul>
        <li><a href="/spacebar-clicker/">Spacebar Clicker — idle upgrades and prestige</a></li>
        <li><a href="/spacebar-clicker-test/">Spacebar Clicker Test — timed CPS speed test</a></li>
        <li><a href="/spacebar-counter/">Spacebar Counter — untimed press counter</a></li>
        <li><a href="/spacebar-clicker-2/">Spacebar Clicker 2 — Overdrive and Nova Core progression</a></li>
        <li><a href="/spacebar-clicker-unblocked/">Spacebar Clicker Instant Play — direct browser mode</a></li>
      </ul>
    </section>`,
  '/spacebar-clicker': `
    <section>
      <h2>Spacebar Clicker idle game</h2>
      <p>Press Space to earn points, buy manual and automatic upgrades, watch live CPS, and use Hyperdrive Prestige to convert large runs into permanent Quantum Keys.</p>
      <p>Holding Space does not create valid repeated presses because browser-generated key-repeat events are ignored.</p>
      <p>Need a different mode? Try the <a href="/spacebar-clicker-test/">Spacebar Clicker Test</a>, <a href="/spacebar-counter/">Spacebar Counter</a>, or browse all <a href="/spacebar-games/">Spacebar Games</a>.</p>
    </section>`,
  '/spacebar-clicker-2': `
    <section>
      <h2>Spacebar Clicker 2</h2>
      <p>This separate enhanced mode adds Overdrive, automatic production, offline earnings, upgrades and Nova Core ascension. Its save is stored locally and separately from the classic Spacebar Clicker.</p>
      <p>Compare it with the <a href="/spacebar-clicker/">classic Spacebar Clicker</a> or browse all <a href="/spacebar-games/">Spacebar Games</a>.</p>
    </section>`,
  '/spacebar-counter': `
    <section>
      <h2>What is a Spacebar Counter?</h2>
      <p>This page supports spacebar counting without a fixed timer. It records deliberate Space key presses and shows total presses, current CPS, average CPS, peak CPS and a local best count.</p>
      <p>For a timed benchmark use the <a href="/spacebar-clicker-test/">Spacebar Clicker Test</a>; for upgrades and prestige use <a href="/spacebar-clicker/">Spacebar Clicker</a>.</p>
    </section>`,
  '/spacebar-clicker-test': `
    <section>
      <h2>Spacebar CPS speed test</h2>
      <p>Use the timed modes as a spacebar CPS test or a space bar click test: choose 1, 5, 10, 30 or 60 seconds, set a custom duration from 1 to 300 seconds, or race to 100 presses. Results include total clicks, average CPS, peak CPS and the best result stored locally for the selected mode.</p>
      <p>For untimed counting use the <a href="/spacebar-counter/">Spacebar Counter</a>; for an upgrade-based idle game use <a href="/spacebar-clicker/">Spacebar Clicker</a>.</p>
    </section>`,
  '/blog': `
    <section>
      <h2>Space clicker guides and strategy</h2>
      <p>The Mission Logs cover browser clicker mechanics, Spacebar speed tests, idle automation, prestige planning, keyboard input, progression design, and the systems behind incremental space games.</p>
      <ul>
        ${Object.entries(blogStaticMeta).map(([postRoute, meta]) => `<li><a href="${postRoute}/">${escapeHtml(meta.title)}</a> — ${escapeHtml(meta.description)}</li>`).join('')}
      </ul>
      <p>For interactive play, open <a href="/game/galaxy_miner/">Galaxy Miner</a>, <a href="/spacebar-clicker/">Spacebar Clicker</a>, or the <a href="/spacebar-clicker-test/">Spacebar CPS Test</a>.</p>
    </section>`,
  '/about': `
    <section>
      <h2>What SpaceClickerGame.com is</h2>
      <p>SpaceClickerGame.com is a browser-based collection of clicker, idle, strategy, and Spacebar experiences. The goal is to make games and tools that start quickly, explain their mechanics clearly, and do not require an account to begin playing.</p>
      <h2>Games and tools on the site</h2>
      <p>The main catalog includes six simulations: Galaxy Miner, Mars Colony, Star Defense, Merge Spaceships, Gravity Idle, and Deep Space Signal. The Spacebar section includes an upgrade-based clicker, a counter, timed CPS tests, a 100-click sprint, and a separate Spacebar Clicker 2 progression mode.</p>
      <h2>Technology and local saves</h2>
      <p>The site uses React, Vite, Tailwind CSS, and lightweight browser graphics. Supported games store progress in the current browser rather than requiring a cloud account. Gameplay does not require a paid API.</p>
      <p>Site and policy review date: October 5, 2026. See the <a href="/privacy/">Privacy Policy</a>, <a href="/contact/">contact page</a>, or <a href="/sitemap/">HTML Sitemap</a> for more information.</p>
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
      <p>This page opens the Spacebar Clicker game directly with no download, launcher or account. “Unblocked” here does not mean bypassing school, workplace, parental-control, firewall or network-administrator restrictions.</p>
      <h2>Spacebar Clicker Unblocked FAQ</h2>
      <h3>What does “unblocked” mean on this page?</h3>
      <p>It means the game opens directly in a browser with no installation step. It does not bypass network restrictions.</p>
      <h3>Can a school or workplace network still block the game?</h3>
      <p>Yes. Access depends on the network, device, firewall, parental controls, or administrator.</p>
      <h3>Does the instant-play version save progress?</h3>
      <p>Yes. Progress is stored locally in the current browser with no cloud or cross-device sync.</p>
      <p>You can also open the canonical <a href="/spacebar-clicker/">Spacebar Clicker</a>, the <a href="/spacebar-clicker-test/">CPS Test</a>, or the full <a href="/spacebar-games/">Spacebar Games</a> hub.</p>
    </section>`,
  '/compare': `
    <section>
      <h2>What this clicker game comparison measures</h2>
      <p>This page compares game structure rather than assigning a universal score. The snapshot looks at active input, idle automation, prestige or reset systems, events, theme, and presentation across Galaxy Miner, Cookie Clicker, Universal Paperclips, Antimatter Dimensions, Spaceplan, and Melvor Idle.</p>
      <h2>How Galaxy Miner differs</h2>
      <p>Galaxy Miner combines manual Stardust mining with automated production and an active Heat system. Keeping Heat between 80% and 99% activates the 2x Heat Flux bonus, while reaching 100% overheats the beam. Golden Comets, crisis events, anomaly scans, and a Dark Matter Galactic Reset add decisions beyond the basic production loop.</p>
      <h2>Different incremental game archetypes</h2>
      <ul>
        <li><strong>Cookie Clicker</strong> centers on a baking-themed production economy, building automation, Golden Cookies, and ascension.</li>
        <li><strong>Universal Paperclips</strong> uses a minimalist interface and a narrative strategy arc built around automated optimization.</li>
        <li><strong>Antimatter Dimensions</strong> emphasizes mathematical growth, automation, challenges, and multiple reset layers.</li>
        <li><strong>Spaceplan</strong> is a story-driven science-fiction idle game with a compact progression arc.</li>
        <li><strong>Melvor Idle</strong> applies idle progression to RPG-style skills, equipment, crafting, and combat systems.</li>
      </ul>
      <p>The comparison is a feature snapshot, not a claim that one design is best for every player. You can <a href="/game/galaxy_miner/">play Galaxy Miner</a> directly or explore the site's <a href="/spacebar-games/">Spacebar games and tools</a>.</p>
    </section>`,
  '/achievements': `
    <section>
      <h2>How Galaxy Miner milestones are tracked</h2>
      <p>The milestone dashboard reads supported progress from the Galaxy Miner save stored in the current browser. It tracks visible progression goals; it is not a cloud account, public leaderboard, or separate hidden-reward system.</p>
      <h2>Mining milestones</h2>
      <p>The lifetime Stardust ladder tracks 1,000, 1 million, 1 billion, 1 trillion, and 1 quadrillion Stardust. Reaching 1 trillion Stardust also reaches the first threshold at which Galactic Reset becomes available.</p>
      <h2>Automation milestones</h2>
      <p>Automation goals include owning 25 Mining Drones, 50 Orbital Stations, and at least one Dyson Swarm. The normal production system also applies upgrade milestone multipliers at key ownership thresholds, so these goals connect directly to the game's economy.</p>
      <h2>Prestige and Dark Matter milestones</h2>
      <p>The tracker recognizes the first Galactic Reset once Dark Matter has been earned and also tracks a 100 Dark Matter target. Dark Matter persists through Galactic Reset and contributes to permanent production progression and Void Technology purchases.</p>
      <p>Progress is local to this browser. Clearing the site's local storage or using a reset action can remove locally saved progress. Open <a href="/game/galaxy_miner/">Galaxy Miner</a> to continue a run or read the <a href="/blog/strategy-guide-clicker-game-space-empire/">strategy guide</a> for upgrade and reset planning.</p>
    </section>`
};

const renderHtml = (route, title, description, h1) => {
  const canonical = site + (route === '/' ? '/' : route + '/');
  const isArticle = route.startsWith('/blog/');
  let html = baseHtml;
  html = html.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(title)}</title>`);
  html = html.replace(/<meta name="description"[^>]*>/i, `<meta name="description" data-rh="true" content="${escapeHtml(description)}">`);
  html = html.replace(/<meta property="og:title"[^>]*>/i, `<meta property="og:title" data-rh="true" content="${escapeHtml(title)}" />`);
  html = html.replace(/<meta property="og:description"[^>]*>/i, `<meta property="og:description" data-rh="true" content="${escapeHtml(description)}" />`);
  html = html.replace(/<meta property="og:type"[^>]*>/i, `<meta property="og:type" data-rh="true" content="${isArticle ? 'article' : 'website'}" />`);
  if (!isArticle && HIGH_VALUE_SCHEMA_ROUTES.has(route)) {
    const routeSchema = buildStaticRouteSchema(route, description, canonical);
    if (routeSchema) {
      const safeRouteSchema = JSON.stringify(routeSchema).replace(/</g, '\\u003c');
      html = html.replace('</head>', `  <script id="prerender-route-jsonld" type="application/ld+json">${safeRouteSchema}</script>\n</head>`);
    }
  }

  if (isArticle) {
    const articleMeta = blogStaticMeta[route];
    html = html.replace('</head>', '  <meta name="author" content="SpaceClickerGame.com Editorial" />\n  <meta property="article:modified_time" content="2026-10-05T00:00:00Z" />\n</head>');

    if (articleMeta) {
      const articleSchema = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": articleMeta.title,
        "image": [articleMeta.image],
        "datePublished": articleMeta.datePublished,
        "dateModified": articleMeta.dateModified,
        "author": [{
          "@type": "Organization",
          "name": articleMeta.author,
          "url": "https://spaceclickergame.com/about/"
        }],
        "publisher": {
          "@type": "Organization",
          "name": "Space Clicker Game",
          "url": "https://spaceclickergame.com/"
        },
        "description": articleMeta.description,
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": canonical
        }
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
  // Mark static SEO tags as Helmet-managed so the client can reconcile them
  // instead of appending a second canonical/meta set after React mounts.
  html = html.replace(/<meta property="og:image"([^>]*)>/i, '<meta property="og:image" data-rh="true"$1>');
  html = html.replace(/<meta property="og:site_name"([^>]*)>/i, '<meta property="og:site_name" data-rh="true"$1>');
  html = html.replace('</head>', `  <meta name="robots" data-rh="true" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />\n  <link rel="alternate" data-rh="true" href="${canonical}" hreflang="en" />\n  <link rel="alternate" data-rh="true" href="${canonical}" hreflang="x-default" />\n  <link rel="canonical" data-rh="true" href="${canonical}" />\n</head>`);
  html = html.replace(
    '<div id="root"></div>',
    `<div id="root"><main style="max-width:900px;margin:0 auto;padding:48px 20px;color:#e5e7eb;background:#0b0d17;min-height:100vh"><h1>${escapeHtml(h1)}</h1><p>${escapeHtml(description)}</p>${blogStaticContent[route] || staticRouteContent[route] || ''}<nav><a href="/" style="color:#00f3ff">Space Clicker Game</a> · <a href="/game/galaxy_miner/" style="color:#00f3ff">Galaxy Miner</a> · <a href="/spacebar-games/" style="color:#00f3ff">Spacebar Games</a> · <a href="/spacebar-clicker/" style="color:#00f3ff">Spacebar Clicker</a> · <a href="/spacebar-counter/" style="color:#00f3ff">Spacebar Counter</a> · <a href="/spacebar-clicker-test/" style="color:#00f3ff">Spacebar Clicker Test</a></nav></main></div>`
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

const excludedFromXmlSitemap = new Set(['/contact', '/privacy', '/terms', '/cookies', '/sitemap']);
const sitemapRoutes = routes.map(([route]) => route).filter((route) => !excludedFromXmlSitemap.has(route));
// Update this date only when the core indexable pages receive a meaningful
// content, gameplay, metadata, or routing change. Do not stamp every build.
const coreLastModified = '2026-10-05';
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapRoutes.map((route) => `  <url><loc>${site}${route === '/' ? '/' : route + '/'}</loc><lastmod>${coreLastModified}</lastmod></url>`).join('\n')}\n</urlset>\n`;
fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemap);

console.log(`Prerendered ${routes.length} routes (${Object.keys(blogStaticContent).length} full blog articles); generated sitemap.xml with ${sitemapRoutes.length} core URLs`);
