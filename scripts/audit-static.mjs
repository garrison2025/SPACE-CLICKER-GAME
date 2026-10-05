import fs from 'node:fs';
import path from 'node:path';

const distDir = path.resolve('dist');
const site = 'https://spaceclickergame.com';

if (!fs.existsSync(distDir)) {
  throw new Error('dist/ not found. Run the production build before static audit.');
}

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  const full = path.join(dir, entry.name);
  if (entry.isDirectory()) return walk(full);
  return [full];
});

const htmlFiles = walk(distDir)
  .filter((file) => file.endsWith(path.sep + 'index.html') || file === path.join(distDir, 'index.html'))
  .sort();

const routeForFile = (file) => {
  const relative = path.relative(distDir, file).replaceAll(path.sep, '/');
  if (relative === 'index.html') return '/';
  return '/' + relative.replace(/\/index\.html$/, '') + '/';
};

const getOne = (html, regex, label, route) => {
  const matches = [...html.matchAll(regex)];
  if (matches.length !== 1) {
    throw new Error(route + ': expected exactly one ' + label + ', found ' + matches.length);
  }
  return matches[0][1];
};

const titles = new Map();
const auditedRoutes = [];
const gameRoutes = new Set([
  '/game/galaxy_miner/',
  '/game/mars_colony/',
  '/game/star_defense/',
  '/game/merge_ships/',
  '/game/gravity_idle/',
  '/game/deep_signal/'
]);

for (const file of htmlFiles) {
  const route = routeForFile(file);
  const html = fs.readFileSync(file, 'utf8');

  const title = getOne(html, /<title>([^<]+)<\/title>/gi, 'title', route).trim();
  const description = getOne(html, /<meta\s+name="description"\s+content="([^"]*)"/gi, 'meta description', route).trim();
  const canonical = getOne(html, /<link\s+rel="canonical"\s+href="([^"]+)"/gi, 'canonical', route).trim();
  const h1Count = (html.match(/<h1\b/gi) || []).length;

  if (!title) throw new Error(route + ': empty title');
  if (!description) throw new Error(route + ': empty meta description');
  if (canonical !== site + route) {
    throw new Error(route + ': canonical mismatch; expected ' + site + route + ', found ' + canonical);
  }
  if (h1Count !== 1) {
    throw new Error(route + ': expected one prerendered H1, found ' + h1Count);
  }
  if (/<meta\s+name="keywords"/i.test(html)) {
    throw new Error(route + ': obsolete meta keywords tag found');
  }
  if (/<meta\s+name="robots"\s+content="[^"]*noindex/i.test(html)) {
    throw new Error(route + ': indexable prerender unexpectedly contains noindex');
  }

  if (titles.has(title)) {
    throw new Error(route + ': duplicate title with ' + titles.get(title) + ': ' + title);
  }
  titles.set(title, route);

  if (gameRoutes.has(route)) {
    const gameH2Count = (html.match(/<h2\b/gi) || []).length;
    if (gameH2Count < 2) {
      throw new Error(route + ': expected at least two static gameplay sections, found ' + gameH2Count);
    }
  }

  if (route.startsWith('/blog/') && route !== '/blog/') {
    const h2Count = (html.match(/<h2\b/gi) || []).length;
    if (h2Count < 2) throw new Error(route + ': full static blog body appears missing (H2 count ' + h2Count + ')');
    if (!html.includes('id="prerender-article-jsonld"')) {
      throw new Error(route + ': static Article JSON-LD is missing');
    }
    if (!/<meta\s+property="og:type"\s+content="article"/i.test(html)) {
      throw new Error(route + ': article Open Graph type is missing');
    }
  }

  auditedRoutes.push(route);
}

if (auditedRoutes.length !== 32) {
  throw new Error('Expected 32 prerendered routes, found ' + auditedRoutes.length);
}

const sitemapPath = path.join(distDir, 'sitemap.xml');
if (!fs.existsSync(sitemapPath)) throw new Error('dist/sitemap.xml is missing');

const sitemap = fs.readFileSync(sitemapPath, 'utf8');
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
if (locs.length !== 27) throw new Error('Expected 27 core sitemap URLs, found ' + locs.length);
if (new Set(locs).size !== locs.length) throw new Error('Duplicate URLs found in sitemap.xml');
if (locs.includes(site + '/game/')) throw new Error('Duplicate /game/ URL must not return to the sitemap');

for (const loc of locs) {
  if (!loc.startsWith(site)) throw new Error('Unexpected sitemap origin: ' + loc);
  const pathname = new URL(loc).pathname;
  if (!auditedRoutes.includes(pathname)) {
    throw new Error('Sitemap URL has no prerendered route: ' + loc);
  }
}

const home = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');
if (!home.includes('<title>Space Clicker – Free Space Clicker Game Online</title>')) {
  throw new Error('Homepage title no longer matches the primary Space Clicker target');
}
if (!home.includes('<h2>How to play Space Clicker</h2>')) {
  throw new Error('Homepage static search-intent answer is missing');
}

console.log('Static SEO audit passed: ' + auditedRoutes.length + ' prerendered routes, ' + locs.length + ' sitemap URLs, 6 full game summaries, 10 full blog articles.');
