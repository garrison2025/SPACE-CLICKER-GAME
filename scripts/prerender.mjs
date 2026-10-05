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

    const faqEntity = route === '/spacebar-clicker-2'
      ? [
          ['Is this the same as the classic Spacebar Clicker?', 'No. It is a separate enhanced mode with its own mechanics and local save.'],
          ['Does Spacebar Clicker 2 have auto-clickers?', 'Yes. Micro Bots generate passive points and Reactor Banks multiply automatic production.'],
          ['What does Nova Ascension reset?', 'It resets current points and standard upgrades. Nova Cores, lifetime records and the permanent Nova bonus remain.'],
          ['Does Spacebar Clicker 2 work on mobile?', 'Yes. Mobile players can use the on-screen Space button, while desktop players can use the physical Space key.']
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
            ['What survives a prestige reset?', 'Quantum Keys, lifetime presses, best CPS and achievement progress remain.']
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
          ['Is my best count saved?', 'Yes. The best count is stored locally in this browser and is not uploaded to a public leaderboard.']
        ]
      : [
          ['What is a space bar click test?', 'It measures how many intentional Space presses you can make during a selected time window and converts the result into clicks per second.'],
          ['What does CPS mean in a spacebar speed test?', 'CPS means clicks per second. Average CPS uses all valid presses over elapsed time, while peak CPS tracks the strongest rolling one-second burst.'],
          ['Can I run a 100-click spacebar test?', 'Yes. Select the 100-click mode and the result records how long it takes to reach one hundred valid presses.'],
          ['Can I choose a custom test duration?', 'Yes. Custom mode accepts durations from 1 to 300 seconds and stores the best result locally for that selected mode.']
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
      <p>Galaxy Miner is the flagship space mining idle clicker on SpaceClickerGame.com. Start with manual Stardust extraction, then reinvest into Laser Drills, Mining Drones, Rovers, Lunar Bases, Orbital Stations, and Dyson Swarms. The loop shifts from active clicking toward automated production as the run grows.</p>
      <h2>Heat Flux and active mining</h2>
      <p>Every manual mining action adds Heat. Keeping Heat between 80% and 99% activates the 2x Heat Flux state, while crossing 100% overheats the mining beam and temporarily disables normal mining. Geodes can vent Heat, so active play rewards timing rather than simply holding the input.</p>
      <h2>Planet progression and production multipliers</h2>
      <p>The run starts on Proxima Centauri B at 1x production. Reaching 1 million Stardust unlocks Kepler-186f at 10x production, 1 billion unlocks Trappist-1e at 50x, and 1 trillion unlocks the Galactic Core at 200x. Once a planet is unlocked in the current run, spending Stardust does not move the run backward.</p>
      <h2>Automation and offline production</h2>
      <p>Automatic upgrades continue producing Stardust without repeated clicks. Supported saved runs can also credit capped offline production after time away, using the saved automation rate rather than pretending the game ran continuously in the background.</p>
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
      <p>Minerals pay for construction and can be generated manually or by Auto-Excavators. Colonists generate Credits over time, creating a second progression layer tied to maintaining a stable population rather than simply buying every building as soon as it appears.</p>
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
      <p>For a slower management loop, visit <a href="/game/mars_colony/">Mars Colony Idle</a>. For an economy-and-prestige clicker, play <a href="/game/galaxy_miner/">Galaxy Miner</a>.</p>
    </section>`,
  '/game/deep_signal': `
<section>
      <h2>Deep Space Signal gameplay</h2>
      <p>Deep Space Signal is a text-focused browser mystery built around scanning radio frequencies, receiving encrypted transmissions, and turning decoded messages into Data. Each scan consumes Energy, so progress is paced by both active decisions and passive regeneration.</p>
      <h2>Scanning and decryption</h2>
      <p>The Antenna Array unlocks deeper frequencies, while Crypto Core upgrades increase passive decryption speed. Players can also click undecoded messages to reduce their encryption manually instead of waiting for the processor to finish the work.</p>
      <h2>Energy and automation</h2>
      <p>Capacitor Bank raises maximum Energy, Solar Sails improve regeneration, and Auto-Scan AI can automate signal hunting once purchased. This creates a gradual shift from manual scanning toward a more idle signal-processing loop.</p>
      <h2>BIO, TECH, MIL, and VOID factions</h2>
      <p>Decoded transmissions can advance BIO, TECH, MIL, and VOID progression. Those factions modify Energy regeneration, decryption speed, scan cost, and maximum Energy, so the message stream also functions as a long-term upgrade path.</p>
      <p>For another systems-heavy simulation, try <a href="/game/gravity_idle/">Gravity Idle</a>, or return to the main <a href="/game/galaxy_miner/">Galaxy Miner</a> clicker.</p>
    </section>`,
  '/spacebar-games': `
<section>
      <h2>Choose the right Spacebar game or tool</h2>
      <p>The Spacebar Games hub separates several different search intents instead of forcing them into one page. Use Spacebar Clicker for an upgrade-based idle game, Spacebar Counter for an untimed press total, and Spacebar Clicker Test for timed CPS challenges.</p>
      <h2>Spacebar Clicker</h2>
      <p><a href="/spacebar-clicker/">Spacebar Clicker</a> turns each deliberate Space press into points. Buy manual upgrades, unlock automatic production, watch CPS, and use Hyperdrive Prestige to convert large runs into permanent Quantum Keys.</p>
      <h2>Spacebar Counter and CPS Test</h2>
      <p><a href="/spacebar-counter/">Spacebar Counter</a> keeps counting until you reset the session and shows total presses plus current, average, and peak CPS. <a href="/spacebar-clicker-test/">Spacebar Clicker Test</a> adds 1, 5, 10, 30, and 60 second modes, custom durations up to 300 seconds, and a 100-click sprint.</p>
      <h2>Spacebar Clicker 2 and instant browser mode</h2>
      <p><a href="/spacebar-clicker-2/">Spacebar Clicker 2</a> is a separate progression mode with Overdrive, offline production, and Nova Core ascension. <a href="/spacebar-clicker-unblocked/">Spacebar Clicker Instant Browser Mode</a> opens the classic game directly with no download or account; it does not bypass school, workplace, firewall, parental-control, or administrator restrictions.</p>
      <p>All current Spacebar modes work in a modern browser. Desktop users can use the physical Space key where supported, while mobile users can use the large on-screen controls.</p>
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
      <h2>Local browser save</h2>
      <p>Current progress is stored locally in the browser rather than in a cloud account. Clearing site storage, using private browsing, or moving to another device can separate or remove that save.</p>
      <p>For a pure speed benchmark, use the <a href="/spacebar-clicker-test/">Spacebar Clicker Test</a>. For an endless press total without upgrades, use the <a href="/spacebar-counter/">Spacebar Counter</a>. You can also browse the full <a href="/spacebar-games/">Spacebar Games hub</a>.</p>
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
      <p>Supported saved runs can calculate offline production when you return after time away. The offline reward is based on the saved production state and is stored locally in the current browser.</p>
      <h2>Nova Core ascension</h2>
      <p>Nova Ascension resets current points and standard upgrades in exchange for permanent Nova Cores. Nova Cores, lifetime records, and the permanent Nova bonus survive the reset and strengthen future runs.</p>
      <p>Prefer the original progression loop? Open the <a href="/spacebar-clicker/">classic Spacebar Clicker</a>, or compare all available modes on the <a href="/spacebar-games/">Spacebar Games hub</a>.</p>
    </section>`,
  '/spacebar-counter': `
<section>
      <h2>What is a Spacebar Counter?</h2>
      <p>Spacebar Counter is an untimed browser tool for counting deliberate Space key presses. It is useful when you want a running total rather than a fixed 5-second or 10-second challenge. The session continues until you choose to reset it.</p>
      <h2>Total presses and CPS metrics</h2>
      <p>The counter displays total presses, current CPS, average CPS, and peak CPS. Current CPS reflects the recent one-second window, average CPS uses the full active session, and peak CPS records the strongest rolling one-second burst.</p>
      <h2>Holding Space does not inflate the count</h2>
      <p>Browser-generated repeat events from holding the key down are ignored. Each count is based on a new deliberate Space keydown or an intentional press on the on-screen control.</p>
      <h2>Local best and privacy</h2>
      <p>The best count is stored locally in the current browser. It is not uploaded to a public leaderboard, and clearing site storage can remove the saved local best.</p>
      <h2>Counter vs Spacebar Clicker Test</h2>
      <p>Use this page when you want an endless count. Use the <a href="/spacebar-clicker-test/">Spacebar Clicker Test</a> for timed 1, 5, 10, 30, or 60 second CPS tests, custom durations, and the 100-click sprint. Use <a href="/spacebar-clicker/">Spacebar Clicker</a> when you want upgrades, automation, and prestige.</p>
    </section>`,
  '/spacebar-clicker-test': `
<section>
      <h2>Spacebar Clicker Test modes</h2>
      <p>The Spacebar Clicker Test measures deliberate Space presses over a chosen target. Timed presets include 1, 5, 10, 30, and 60 seconds. Custom mode accepts durations from 1 to 300 seconds, while the 100-click sprint measures how long it takes to reach one hundred valid presses.</p>
      <h2>Average CPS, current CPS, and peak CPS</h2>
      <p>Average CPS is the number of valid presses divided by elapsed test time. Current CPS reflects the rolling recent one-second window, while peak CPS records the strongest one-second burst reached during the run. Keeping these metrics separate makes a short burst easier to distinguish from sustained speed.</p>
      <h2>How timed tests start and finish</h2>
      <p>The first valid press starts the timer. Once the selected deadline is reached, later key presses are rejected rather than being counted after time has expired. In 100-click mode, the test ends on the one-hundredth valid press and records elapsed time.</p>
      <h2>Key-repeat protection</h2>
      <p>Holding the Space key does not generate a valid stream of clicks because browser-generated repeat events are ignored. The test is designed around repeated deliberate presses or intentional taps on the on-screen control.</p>
      <h2>Personal bests and sharing</h2>
      <p>The best result for each selected mode is stored locally in the current browser. After a completed test, supported devices can use the share sheet; otherwise the result can be copied where clipboard access is available.</p>
      <p>For an untimed session, use the <a href="/spacebar-counter/">Spacebar Counter</a>. For a progression game with upgrades and prestige, play <a href="/spacebar-clicker/">Spacebar Clicker</a>.</p>
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
      <h2>Saving, exporting, and clearing data</h2>
      <p>Local game data is used to restore supported progress and calculate offline earnings. Clearing browser site storage can permanently remove local saves. Exported save strings are portable text and should be treated as a backup rather than an encrypted secret.</p>
      <h2>Security and contact</h2>
      <p>The production site is served over HTTPS. Questions about privacy can be sent to <a href="mailto:info@spaceclickergame.com">info@spaceclickergame.com</a>. Effective date: October 5, 2026.</p>
    </section>`,
  '/terms': `
    <section>
      <h2>Use of the site</h2>
      <p>By using SpaceClickerGame.com, you agree to use its browser games, tools, and site materials lawfully and without intentionally degrading the service for other visitors. Access is provided for personal browser use unless a separate permission or agreement applies.</p>
      <h2>Software and content restrictions</h2>
      <p>The site license does not transfer ownership of the games or site materials. Do not commercially redistribute game assets, attempt malicious exploitation, or operate scripts or bots designed to disrupt availability or other users' access.</p>
      <h2>Local saves and availability</h2>
      <p>The service is provided on an as-is basis. Browser storage can be cleared by the user, browser, device, or privacy tools, and local save loss can occur. Availability, compatibility, and uninterrupted operation are not guaranteed.</p>
      <h2>Limitations and applicable law</h2>
      <p>To the extent permitted by applicable law, Space Clicker Game is not responsible for indirect losses caused by use of or inability to use the site. Non-waivable consumer rights and governing law depend on the jurisdiction that legally applies. Last updated: October 5, 2026.</p>
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
      <p>Browser controls can clear cookies and local storage. Clearing local storage will remove supported local game progress unless you kept an available exported backup. Use the in-site reset controls only when you intend to remove saved progress.</p>
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

const sitemapRoutes = routes.map(([route]) => route);
// Update this date only when the core indexable pages receive a meaningful
// content, gameplay, metadata, or routing change. Do not stamp every build.
const coreLastModified = '2026-10-05';
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapRoutes.map((route) => `  <url><loc>${site}${route === '/' ? '/' : route + '/'}</loc><lastmod>${coreLastModified}</lastmod></url>`).join('\n')}\n</urlset>\n`;
fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemap);

console.log(`Prerendered ${routes.length} routes (${Object.keys(blogStaticContent).length} full blog articles); generated sitemap.xml with ${sitemapRoutes.length} indexable URLs`);
