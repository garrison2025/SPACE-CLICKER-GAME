import fs from 'node:fs';
import path from 'node:path';

const distDir = path.resolve('dist');
const basePath = path.join(distDir, 'index.html');

if (!fs.existsSync(basePath)) {
  throw new Error('dist/index.html not found. Run vite build before prerender.');
}

const baseHtml = fs.readFileSync(basePath, 'utf8');
const site = 'https://spaceclickergame.com';

const routes = [
  ['/', 'Space Clicker Game - Play Free Idle Mining & Strategy Online', 'Play Space Clicker Game free in your browser. Mine Stardust, automate production, explore space simulations, and prestige for permanent Dark Matter upgrades.', 'Space Clicker Game'],
  ['/game', 'Galaxy Miner - Free Online Space Clicker Game', 'Play Galaxy Miner, the flagship space clicker game with Stardust mining, upgrades, automation, offline progress and Dark Matter prestige.', 'Galaxy Miner'],
  ['/game/galaxy_miner', 'Galaxy Miner - Free Online Space Clicker Game', 'Mine Stardust, automate a growing space economy, manage heat and prestige for permanent Dark Matter upgrades.', 'Galaxy Miner'],
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
  ['/compare', 'Compare Space Clicker Games | Space Clicker Game', 'Compare the browser games and progression systems available on SpaceClickerGame.com.', 'Compare Space Clicker Games'],
  ['/achievements', 'Achievements & Trophy Guide | Space Clicker Game', 'Browse achievement goals and progression challenges across Space Clicker Game simulations.', 'Achievements & Trophy Guide'],
  ['/blog', 'Space Clicker Game Blog - Guides & Strategy', 'Read guides, mechanics explainers and strategy articles for space clicker and incremental browser games.', 'Space Clicker Game Blog'],
  ['/about', 'About | Space Clicker Game', 'Learn about SpaceClickerGame.com and its free browser-based clicker, idle and spacebar experiences.', 'About Space Clicker Game'],
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
    html = html.replace('</head>', '  <meta name="author" content="Space Clicker Game Editorial" />\n</head>');
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
    `<div id="root"><main style="max-width:900px;margin:0 auto;padding:48px 20px;color:#e5e7eb;background:#0b0d17;min-height:100vh"><h1>${escapeHtml(h1)}</h1><p>${escapeHtml(description)}</p><nav><a href="/" style="color:#00f3ff">Space Clicker Game</a> · <a href="/spacebar-games/" style="color:#00f3ff">Spacebar Games</a> · <a href="/spacebar-clicker/" style="color:#00f3ff">Spacebar Clicker</a> · <a href="/spacebar-clicker-2/" style="color:#00f3ff">Spacebar Clicker 2</a> · <a href="/spacebar-counter/" style="color:#00f3ff">Spacebar Counter</a> · <a href="/spacebar-clicker-test/" style="color:#00f3ff">Spacebar Clicker Test</a></nav></main></div>`
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
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapRoutes.map((route) => `  <url><loc>${site}${route === '/' ? '/' : route + '/'}</loc></url>`).join('\n')}\n</urlset>\n`;
fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemap);

console.log(`Prerendered ${routes.length} indexable routes and generated sitemap.xml`);
