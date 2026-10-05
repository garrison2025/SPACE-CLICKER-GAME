import fs from 'node:fs';
import path from 'node:path';

const distDir = path.resolve('dist');
const basePath = path.join(distDir, 'index.html');

if (!fs.existsSync(basePath)) {
  throw new Error('dist/index.html not found. Run vite build before prerender.');
}

const baseHtml = fs.readFileSync(basePath, 'utf8');
const site = 'https://spaceclickergame.com';

const blogSourcePath = path.resolve('content/blogPosts.ts');
const blogStaticContent = {};

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
}

if (Object.keys(blogStaticContent).length !== 10) {
  throw new Error(`Expected 10 blog posts for prerender, found ${Object.keys(blogStaticContent).length}`);
}

const routes = [
  ['/', 'Space Clicker – Free Space Clicker Game Online', 'Play Space Clicker free online. Mine Stardust, automate production, manage Heat Flux, catch Golden Comets, and reset for permanent Dark Matter upgrades.', 'Space Clicker Game'],
  ['/game/galaxy_miner', 'Galaxy Miner – Space Mining Idle Clicker Online', 'Play Galaxy Miner online: mine Stardust, automate a space economy, manage Heat Flux, catch Golden Comets, and reset for permanent Dark Matter upgrades.', 'Galaxy Miner'],
  ['/game/mars_colony', 'Mars Colony Idle - Free Space Strategy Game', 'Build and balance a browser-based Mars colony with resources, production and idle progression.', 'Mars Colony Idle'],
  ['/game/star_defense', 'Star Defense - Free Space Defense Clicker', 'Defend the sector in a browser-based space defense clicker with upgrades and waves.', 'Star Defense'],
  ['/game/merge_ships', 'Merge Spaceships - Free Browser Merge Game', 'Merge ships, expand your orbit and build passive production in a free browser game.', 'Merge Spaceships'],
  ['/game/gravity_idle', 'Gravity Idle - Free Physics Idle Game', 'Experiment with gravity, matter and upgrades in a free browser-based idle simulation.', 'Gravity Idle'],
  ['/game/deep_signal', 'Deep Space Signal - Free Browser Text Adventure', 'Scan, decode and analyze strange transmissions in a free browser-based deep space signal game.', 'Deep Space Signal'],
  ['/spacebar-games', 'Spacebar Games - Clicker, Counter & CPS Tests', 'Play free spacebar games online: Spacebar Clicker, Spacebar Counter, timed CPS tests, a 100-click sprint and instant browser play.', 'Spacebar Games'],
  ['/spacebar-clicker-2', 'Spacebar Clicker 2 - Upgraded Idle Space Bar Game', 'Play Spacebar Clicker 2, an enhanced browser idle game with Overdrive, auto-production, upgrades, offline earnings and Nova Core ascension.', 'Spacebar Clicker 2'],
  ['/spacebar-clicker', 'Spacebar Clicker - Space Bar Clicker Game & CPS', 'Play Spacebar Clicker online: press Space, build CPS, buy upgrades, automate points and prestige for permanent Quantum Keys.', 'Spacebar Clicker'],
  ['/spacebar-counter', 'Spacebar Counter - Count Space Bar Presses & CPS', 'Free online Spacebar Counter with total presses, current CPS, average CPS, peak CPS and local best.', 'Spacebar Counter'],
  ['/spacebar-clicker-test', 'Spacebar Clicker Test - Space Bar CPS & Speed Test', 'Test your spacebar speed with 1, 5, 10, 30 or 60 second CPS tests and save your best local score.', 'Spacebar Clicker Test'],
  ['/spacebar-clicker-unblocked', 'Spacebar Clicker Unblocked - Play Instantly in Your Browser', 'Play Spacebar Clicker instantly in your browser with no download or account. Keyboard and mobile controls with local save.', 'Spacebar Clicker Unblocked'],
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
    </section>`,
  '/game/galaxy_miner': `
    <section>
      <h2>Galaxy Miner gameplay</h2>
      <p>Galaxy Miner is a browser-based space mining idle clicker. Mine Stardust, automate production, manage Heat Flux, catch Golden Comets, respond to crisis events, and reset large runs for Dark Matter.</p>
      <h2>Permanent progression</h2>
      <p>Galactic Reset becomes available from 1 trillion Stardust. Stardust and standard upgrades reset while Dark Matter and permanent Void Technology remain.</p>
    </section>`,
  '/spacebar-games': `
    <section>
      <h2>Choose a Spacebar mode</h2>
      <p>Use Spacebar Clicker for an idle upgrade game, Spacebar Counter for an untimed press total, and Spacebar Clicker Test for timed CPS challenges including 1, 5, 10, 30 and 60 seconds plus a 100-click sprint.</p>
    </section>`,
  '/spacebar-clicker': `
    <section>
      <h2>Spacebar Clicker idle game</h2>
      <p>Press Space to earn points, buy manual and automatic upgrades, watch live CPS, and use Hyperdrive Prestige to convert large runs into permanent Quantum Keys.</p>
      <p>Holding Space does not create valid repeated presses because browser-generated key-repeat events are ignored.</p>
    </section>`,
  '/spacebar-clicker-2': `
    <section>
      <h2>Spacebar Clicker 2</h2>
      <p>This separate enhanced mode adds Overdrive, automatic production, offline earnings, upgrades and Nova Core ascension. Its save is stored locally and separately from the classic Spacebar Clicker.</p>
    </section>`,
  '/spacebar-counter': `
    <section>
      <h2>What is a Spacebar Counter?</h2>
      <p>This page records deliberate Space key presses without a fixed timer. It shows total presses, current CPS, average CPS, peak CPS and a local best count.</p>
    </section>`,
  '/spacebar-clicker-test': `
    <section>
      <h2>Spacebar CPS speed test</h2>
      <p>Choose a 1, 5, 10, 30 or 60 second test, set a custom duration from 1 to 300 seconds, or race to 100 presses. Results include total clicks, average CPS, peak CPS and the best result stored locally for the selected mode.</p>
    </section>`,
  '/spacebar-clicker-unblocked': `
    <section>
      <h2>Instant browser Spacebar Clicker</h2>
      <p>This page opens the Spacebar Clicker game directly with no download, launcher or account. “Unblocked” here does not mean bypassing school, workplace, parental-control, firewall or network-administrator restrictions.</p>
    </section>`
};

const renderHtml = (route, title, description, h1) => {
  const canonical = site + (route === '/' ? '/' : route + '/');
  const isArticle = route.startsWith('/blog/');
  let html = baseHtml;
  html = html.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(title)}</title>`);
  html = html.replace(/<meta name="description"[^>]*>/i, `<meta name="description" content="${escapeHtml(description)}">`);
  html = html.replace(/<meta property="og:title"[^>]*>/i, `<meta property="og:title" content="${escapeHtml(title)}" />`);
  html = html.replace(/<meta property="og:description"[^>]*>/i, `<meta property="og:description" content="${escapeHtml(description)}" />`);
  html = html.replace(/<meta property="og:type"[^>]*>/i, `<meta property="og:type" content="${isArticle ? 'article' : 'website'}" />`);
  if (isArticle) {
    html = html.replace('</head>', '  <meta name="author" content="SpaceClickerGame.com Editorial" />\n  <meta property="article:modified_time" content="2026-10-05T00:00:00Z" />\n</head>');
  }
  if (/<meta property="og:url"[^>]*>/i.test(html)) {
    html = html.replace(/<meta property="og:url"[^>]*>/i, `<meta property="og:url" content="${canonical}" />`);
  } else {
    html = html.replace('</head>', `  <meta property="og:url" content="${canonical}" />\n</head>`);
  }
  if (/<meta name="twitter:title"[^>]*>/i.test(html)) {
    html = html.replace(/<meta name="twitter:title"[^>]*>/i, `<meta name="twitter:title" content="${escapeHtml(title)}" />`);
  } else {
    html = html.replace('</head>', `  <meta name="twitter:title" content="${escapeHtml(title)}" />\n</head>`);
  }
  if (/<meta name="twitter:description"[^>]*>/i.test(html)) {
    html = html.replace(/<meta name="twitter:description"[^>]*>/i, `<meta name="twitter:description" content="${escapeHtml(description)}" />`);
  } else {
    html = html.replace('</head>', `  <meta name="twitter:description" content="${escapeHtml(description)}" />\n</head>`);
  }
  html = html.replace('</head>', `  <link rel="canonical" href="${canonical}" />\n</head>`);
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
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapRoutes.map((route) => `  <url><loc>${site}${route === '/' ? '/' : route + '/'}</loc></url>`).join('\n')}\n</urlset>\n`;
fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemap);

console.log(`Prerendered ${routes.length} routes (${Object.keys(blogStaticContent).length} full blog articles); generated sitemap.xml with ${sitemapRoutes.length} core URLs`);
