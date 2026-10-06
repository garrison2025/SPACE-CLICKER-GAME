import fs from 'node:fs';
import path from 'node:path';
import { CORE_ROUTE_META } from '../content/routeSeo.js';

const distDir = path.resolve('dist');
const site = 'https://spaceclickergame.com';
const legacyPublicSitemap = path.resolve('public/sitemap.xml');

const coreRoutes = new Set();
const coreViews = new Set();
const primaryIntentOwners = new Map();

for (const meta of CORE_ROUTE_META) {
  if (!meta.route || !meta.view || !meta.title || !meta.description || !meta.h1 || !meta.primaryIntent) {
    throw new Error('routeSeo.js contains an incomplete core route metadata record');
  }
  if (coreRoutes.has(meta.route)) {
    throw new Error('routeSeo.js contains a duplicate route owner: ' + meta.route);
  }
  if (meta.view !== 'game' && coreViews.has(meta.view)) {
    throw new Error('routeSeo.js contains a duplicate view owner: ' + meta.view);
  }
  if (primaryIntentOwners.has(meta.primaryIntent)) {
    throw new Error(
      'SEO intent cannibalization contract: "' + meta.primaryIntent + '" is owned by both ' +
      primaryIntentOwners.get(meta.primaryIntent) + ' and ' + meta.route
    );
  }

  coreRoutes.add(meta.route);
  if (meta.view !== 'game') coreViews.add(meta.view);
  primaryIntentOwners.set(meta.primaryIntent, meta.route);
}

if (CORE_ROUTE_META.length !== 22) {
  throw new Error('Expected 22 core route metadata records, found ' + CORE_ROUTE_META.length);
}

if (fs.existsSync(legacyPublicSitemap)) {
  throw new Error('public/sitemap.xml must not exist; sitemap.xml is generated from the prerender route catalog at build time.');
}

if (!fs.existsSync(distDir)) {
  throw new Error('dist/ not found. Run the production build before static audit.');
}

const manifestPath = path.join(distDir, 'manifest.webmanifest');
if (!fs.existsSync(manifestPath)) {
  throw new Error('manifest.webmanifest is missing from dist/.');
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
for (const field of ['name', 'short_name', 'start_url', 'display']) {
  if (!manifest[field]) {
    throw new Error('manifest.webmanifest is missing required field: ' + field);
  }
}

if (!Array.isArray(manifest.icons) || manifest.icons.length === 0) {
  throw new Error('manifest.webmanifest must define application icons.');
}

if (!Array.isArray(manifest.categories) || !manifest.categories.includes('games')) {
  throw new Error('manifest.webmanifest must categorize the app as games.');
}

const expectedShortcuts = new Set([
  '/game/galaxy_miner/',
  '/spacebar-clicker/',
  '/spacebar-clicker-test/'
]);
if (!Array.isArray(manifest.shortcuts) || manifest.shortcuts.length !== expectedShortcuts.size) {
  throw new Error('manifest.webmanifest must expose exactly the three core app shortcuts.');
}
for (const shortcut of manifest.shortcuts) {
  if (!shortcut?.name || !shortcut?.url || !expectedShortcuts.has(shortcut.url)) {
    throw new Error('manifest.webmanifest contains an invalid core shortcut.');
  }
  expectedShortcuts.delete(shortcut.url);
}
if (expectedShortcuts.size > 0) {
  throw new Error('manifest.webmanifest is missing one or more required core shortcuts.');
}

const manifestIconSizes = new Set(
  manifest.icons.flatMap((icon) =>
    String(icon?.sizes || '')
      .split(/\s+/)
      .filter(Boolean)
  )
);

for (const requiredSize of ['192x192', '512x512']) {
  if (!manifestIconSizes.has(requiredSize)) {
    throw new Error('manifest.webmanifest must declare a ' + requiredSize + ' app icon.');
  }
}

const readPngDimensions = (filePath) => {
  const buffer = fs.readFileSync(filePath);
  const pngSignature = '89504e470d0a1a0a';
  if (buffer.length < 24 || buffer.subarray(0, 8).toString('hex') !== pngSignature) {
    throw new Error(path.basename(filePath) + ': expected a valid PNG file.');
  }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20)
  };
};

for (const icon of manifest.icons) {
  const src = String(icon?.src || '');
  if (!src.startsWith('/')) {
    throw new Error('manifest.webmanifest icon must use a local absolute path: ' + src);
  }
  const iconPath = path.join(distDir, src.replace(/^\/+/, ''));
  if (!fs.existsSync(iconPath) || fs.statSync(iconPath).size === 0) {
    throw new Error('manifest.webmanifest icon is missing from dist/: ' + src);
  }

  if (icon.type === 'image/png' && /^\d+x\d+$/.test(String(icon.sizes || ''))) {
    const [expectedWidth, expectedHeight] = String(icon.sizes).split('x').map(Number);
    const dimensions = readPngDimensions(iconPath);
    if (dimensions.width !== expectedWidth || dimensions.height !== expectedHeight) {
      throw new Error(
        src + ': declared ' + icon.sizes + ' but PNG is ' +
        dimensions.width + 'x' + dimensions.height
      );
    }
  }
}

const appleTouchIconPath = path.join(distDir, 'apple-touch-icon.png');
if (!fs.existsSync(appleTouchIconPath) || fs.statSync(appleTouchIconPath).size === 0) {
  throw new Error('apple-touch-icon.png is missing from dist/.');
}
const appleTouchDimensions = readPngDimensions(appleTouchIconPath);
if (appleTouchDimensions.width !== 180 || appleTouchDimensions.height !== 180) {
  throw new Error(
    'apple-touch-icon.png must be 180x180; found ' +
    appleTouchDimensions.width + 'x' + appleTouchDimensions.height
  );
}

const rootHtmlPath = path.join(distDir, 'index.html');
const rootHtml = fs.readFileSync(rootHtmlPath, 'utf8');
if (!/<link\s+rel="apple-touch-icon"\s+sizes="180x180"\s+href="\/apple-touch-icon\.png">/i.test(rootHtml)) {
  throw new Error('index.html must reference /apple-touch-icon.png as a 180x180 Apple touch icon.');
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
const descriptions = new Map();
const auditedRoutes = [];

// Editorial external-link safety contract:
// Third-party http(s) references in blog source open in a new tab and always
// include noopener/noreferrer. First-party absolute links stay in the same tab.
const blogSourcePath = path.resolve('content/blogPosts.ts');
const blogSource = fs.readFileSync(blogSourcePath, 'utf8');
for (const match of blogSource.matchAll(/<a\s+([^>]*href=["'](https?:\/\/[^"']+)["'][^>]*)>/gi)) {
  const attrs = match[1];
  const href = match[2];
  let hostname = '';
  try {
    hostname = new URL(href).hostname.toLowerCase();
  } catch {
    throw new Error('content/blogPosts.ts: invalid absolute link ' + href);
  }

  const isFirstParty =
    hostname === 'spaceclickergame.com' ||
    hostname === 'www.spaceclickergame.com';

  if (!isFirstParty) {
    if (!/target=["']_blank["']/i.test(attrs)) {
      throw new Error('content/blogPosts.ts: external link must use target="_blank": ' + href);
    }
    if (!/rel=["'][^"']*\bnoopener\b[^"']*\bnoreferrer\b[^"']*["']/i.test(attrs)) {
      throw new Error('content/blogPosts.ts: external link must include rel="noopener noreferrer": ' + href);
    }
  }
}

// Runtime <head> ownership contract:
// App.tsx owns route-level title/meta/canonical/schema through SEOHead.
// BlogPage may replace only the prerendered Article JSON-LD block after hydration.
// Other page components must not create a second route-level SEO source.
const componentsDir = path.resolve('components');
for (const sourceName of fs.readdirSync(componentsDir).filter((name) => name.endsWith('.tsx'))) {
  const sourcePath = path.join(componentsDir, sourceName);
  const source = fs.readFileSync(sourcePath, 'utf8');

  if (sourceName !== 'SEOHead.tsx' && /(?:import\s+SEOHead\b|<SEOHead\b)/.test(source)) {
    throw new Error(sourceName + ': route-level SEOHead must be owned by App.tsx');
  }

  if (sourceName !== 'BlogPage.tsx' && sourceName !== 'SEOHead.tsx') {
    if (/document\.title\s*=|document\.head\./.test(source)) {
      throw new Error(sourceName + ': direct document head/title mutation is not allowed');
    }
  }
}
const gameRoutes = new Set([
  '/game/galaxy_miner/',
  '/game/mars_colony/',
  '/game/star_defense/',
  '/game/merge_ships/',
  '/game/gravity_idle/',
  '/game/deep_signal/'
]);

const highValueSchemaRoutes = new Set([
  '/',
  ...gameRoutes,
  '/spacebar-games/',
  '/spacebar-clicker/',
  '/spacebar-clicker-2/',
  '/spacebar-counter/',
  '/spacebar-clicker-test/',
  '/spacebar-clicker-unblocked/',
  '/compare/',
  '/achievements/',
  '/blog/',
  '/about/'
]);

const spacebarSchemaRoutes = new Set([
  '/spacebar-games/',
  '/spacebar-clicker/',
  '/spacebar-clicker-2/',
  '/spacebar-counter/',
  '/spacebar-clicker-test/',
  '/spacebar-clicker-unblocked/'
]);

const requiredSpacebarHubLinks = [
  '/spacebar-clicker/',
  '/spacebar-clicker-test/',
  '/spacebar-counter/',
  '/spacebar-clicker-2/',
  '/spacebar-clicker-unblocked/'
];

const requiredHomeClusterLinks = [
  '/blog/strategy-guide-clicker-game-space-empire/',
  '/spacebar-clicker/',
  '/spacebar-counter/',
  '/spacebar-clicker-test/'
];

const expectedSpacebarOgImages = new Map([
  ['/spacebar-games/', site + '/og/spacebar-games.svg'],
  ['/spacebar-clicker/', site + '/og/spacebar-clicker.svg'],
  ['/spacebar-clicker-2/', site + '/og/spacebar-clicker-2.svg'],
  ['/spacebar-counter/', site + '/og/spacebar-counter.svg'],
  ['/spacebar-clicker-test/', site + '/og/spacebar-clicker-test.svg'],
  ['/spacebar-clicker-unblocked/', site + '/og/spacebar-clicker-unblocked.svg']
]);

const deepSpacebarContentRoutes = new Set([
  '/spacebar-games/',
  '/spacebar-clicker/',
  '/spacebar-clicker-2/',
  '/spacebar-counter/',
  '/spacebar-clicker-test/',
  '/spacebar-clicker-unblocked/'
]);

const trustContentRoutes = new Set([
  '/contact/',
  '/privacy/',
  '/terms/',
  '/cookies/'
]);

const requiredBlogHubIntentLinks = [
  '/blog/strategy-guide-clicker-game-space-empire/',
  '/blog/active-vs-passive-space-click-game-styles/',
  '/blog/mastering-the-space-bar-clicking-game/',
  '/blog/mechanics-of-space-bar-clicking-game-physics/'
];

const strategyGuideRequiredHeadings = [
  'Space Clicker Strategy Guide: Start With the Current Bottleneck',
  'Idle Space Clicker Strategy: When Automation Takes Over',
  'Space Clicker on Mobile: What Changes'
];

const geoExtractionRequirements = new Map([
  ['/', ['Space Clicker is a free browser-based incremental space game.']],
  ['/spacebar-games/', ['Spacebar mode comparison', '<table>']],
  ['/spacebar-clicker-test/', ['How CPS and press interval are calculated', 'valid presses ÷ active elapsed seconds', '1000 ÷ average CPS']],
  ['/about/', ['Editorial and testing principles']]
]);

const blogClusterTargets = new Map([
  ['/game/galaxy_miner/', 7],
  ['/spacebar-games/', 2],
  ['/spacebar-clicker/', 3],
  ['/spacebar-clicker-2/', 1],
  ['/spacebar-counter/', 3],
  ['/spacebar-clicker-test/', 3],
  ['/compare/', 1],
  ['/achievements/', 1]
]);
const blogClusterLinkCounts = new Map([...blogClusterTargets.keys()].map((href) => [href, 0]));

const forbiddenStaleTrustClaims = [
  '14,203',
  'commanders active',
  'xeno_hunter',
  'red_planet',
  'subspace transmission',
  'premier destination for space clicker'
];

// Comparison source parity contract:
// The interactive comparison cards and prerendered no-JS comparison must cite
// the same external product/source URLs.
const comparisonSourcePath = path.join(componentsDir, 'ComparisonPage.tsx');
const comparisonSource = fs.readFileSync(comparisonSourcePath, 'utf8');
const runtimeComparisonSources = [
  ...comparisonSource.matchAll(/sourceUrl:\s*"([^"]+)"/g)
]
  .map((match) => match[1])
  .filter((sourceUrl) => /^https?:\/\//i.test(sourceUrl));

if (runtimeComparisonSources.length !== 5) {
  throw new Error(
    'ComparisonPage.tsx: expected exactly 5 third-party comparison source URLs, found ' +
    runtimeComparisonSources.length
  );
}

const prerenderedComparisonPath = path.join(distDir, 'compare', 'index.html');
if (!fs.existsSync(prerenderedComparisonPath)) {
  throw new Error('/compare/: prerendered comparison page is missing');
}
const prerenderedComparisonHtml = fs.readFileSync(prerenderedComparisonPath, 'utf8');
for (const sourceUrl of runtimeComparisonSources) {
  if (!prerenderedComparisonHtml.includes(`href="${sourceUrl}"`)) {
    throw new Error(
      '/compare/: prerender source drift; missing runtime comparison source ' + sourceUrl
    );
  }
}

for (const file of htmlFiles) {
  const route = routeForFile(file);
  const html = fs.readFileSync(file, 'utf8');
  const normalizedHtml = html.toLowerCase();

  for (const staleClaim of forbiddenStaleTrustClaims) {
    if (normalizedHtml.includes(staleClaim)) {
      throw new Error(route + ': stale or unverified trust claim reintroduced: ' + staleClaim);
    }
  }

  const title = getOne(html, /<title\s+data-rh="true">([^<]+)<\/title>/gi, 'title', route).trim();
  const description = getOne(html, /<meta\s+[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/gi, 'meta description', route).trim();
  const canonical = getOne(html, /<link\s+[^>]*rel="canonical"[^>]*href="([^"]+)"[^>]*>/gi, 'canonical', route).trim();
  const h1Count = (html.match(/<h1\b/gi) || []).length;
  const robotsMatches = [...html.matchAll(/<meta\s+name="robots"[^>]*content="([^"]*)"/gi)];
  const hreflangMatches = [...html.matchAll(/<link\s+rel="alternate"[^>]*href="([^"]+)"[^>]*hreflang="([^"]+)"/gi)];
  const ogImage = getOne(html, /<meta\s+[^>]*property="og:image"[^>]*content="([^"]+)"[^>]*>/gi, 'og:image', route).trim();
  const ogLocale = getOne(html, /<meta\s+[^>]*property="og:locale"[^>]*content="([^"]+)"[^>]*>/gi, 'og:locale', route).trim();
  const ogImageWidth = getOne(html, /<meta\s+[^>]*property="og:image:width"[^>]*content="([^"]+)"[^>]*>/gi, 'og:image:width', route).trim();
  const ogImageHeight = getOne(html, /<meta\s+[^>]*property="og:image:height"[^>]*content="([^"]+)"[^>]*>/gi, 'og:image:height', route).trim();
  const ogImageAlt = getOne(html, /<meta\s+[^>]*property="og:image:alt"[^>]*content="([^"]+)"[^>]*>/gi, 'og:image:alt', route).trim();
  const twitterCard = getOne(html, /<meta\s+[^>]*name="twitter:card"[^>]*content="([^"]+)"[^>]*>/gi, 'twitter:card', route).trim();
  const twitterImage = getOne(html, /<meta\s+[^>]*name="twitter:image"[^>]*content="([^"]+)"[^>]*>/gi, 'twitter:image', route).trim();
  const twitterImageAlt = getOne(html, /<meta\s+[^>]*name="twitter:image:alt"[^>]*content="([^"]+)"[^>]*>/gi, 'twitter:image:alt', route).trim();

  if (!title) throw new Error(route + ': empty title');
  if (!description) throw new Error(route + ': empty meta description');
  if (title.length < 25 || title.length > 70) {
    throw new Error(route + ': title length should stay between 25 and 70 characters; found ' + title.length);
  }
  if (description.length < 80 || description.length > 165) {
    throw new Error(route + ': meta description length should stay between 80 and 165 characters; found ' + description.length);
  }
  if (!/^https:\/\//.test(ogImage)) throw new Error(route + ': og:image must be absolute');
  if (ogImageWidth !== '1200' || ogImageHeight !== '630') {
    throw new Error(route + ': social image dimensions must be 1200x630');
  }
  if (ogImageAlt !== title) throw new Error(route + ': og:image:alt must match the page title');
  if (ogLocale !== 'en_US') throw new Error(route + ': monolingual English pages must declare og:locale=en_US');
  if (twitterCard !== 'summary_large_image') throw new Error(route + ': twitter:card must be summary_large_image');
  if (twitterImage !== ogImage) throw new Error(route + ': twitter:image must match og:image');
  if (twitterImageAlt !== title) throw new Error(route + ': twitter:image:alt must match the page title');
  if (expectedSpacebarOgImages.has(route) && ogImage !== expectedSpacebarOgImages.get(route)) {
    throw new Error(route + ': Spacebar social image must be the route-specific first-party asset');
  }
  if (canonical !== site + route) {
    throw new Error(route + ': canonical mismatch; expected ' + site + route + ', found ' + canonical);
  }
  if (!/<link\s+rel="canonical"\s+data-rh="true"/i.test(html)) {
    throw new Error(route + ': canonical is not marked for Helmet handoff');
  }
  if (!/<meta\s+name="description"\s+data-rh="true"/i.test(html)) {
    throw new Error(route + ': description is not marked for Helmet handoff');
  }
  if (robotsMatches.length !== 1 || !/\bindex\b/i.test(robotsMatches[0][1]) || !/\bfollow\b/i.test(robotsMatches[0][1])) {
    throw new Error(route + ': expected one index,follow robots directive');
  }
  if (hreflangMatches.length !== 0) {
    throw new Error(route + ': monolingual site must not emit hreflang/x-default until real localized equivalents exist');
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

  if (descriptions.has(description)) {
    throw new Error(route + ': duplicate meta description with ' + descriptions.get(description));
  }
  descriptions.set(description, route);

  if (gameRoutes.has(route)) {
    const gameH2Count = (html.match(/<h2\b/gi) || []).length;
    const visibleText = html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (gameH2Count < 4) {
      throw new Error(route + ': expected at least four static gameplay sections, found ' + gameH2Count);
    }
    if (visibleText.length < 900) {
      throw new Error(route + ': static gameplay copy is too thin (' + visibleText.length + ' chars)');
    }

    if (route === '/game/galaxy_miner/') {
      for (const requiredText of ['1 million Stardust', '1 billion', '1 trillion', '200x']) {
        if (!html.includes(requiredText)) {
          throw new Error(route + ': missing planet progression detail ' + requiredText);
        }
      }
    }
  }

  if (highValueSchemaRoutes.has(route)) {
    const schemaMatches = [...html.matchAll(/<script id="prerender-route-jsonld" type="application\/ld\+json">([\s\S]*?)<\/script>/gi)];
    if (schemaMatches.length !== 1) {
      throw new Error(route + ': expected one static route JSON-LD block, found ' + schemaMatches.length);
    }
    try {
      const parsedSchema = JSON.parse(schemaMatches[0][1]);
      if (parsedSchema['@context'] !== 'https://schema.org') {
        throw new Error('missing schema.org context');
      }

      const schemaNodes = Array.isArray(parsedSchema['@graph'])
        ? parsedSchema['@graph']
        : [parsedSchema];

      if (spacebarSchemaRoutes.has(route)) {
        if (!schemaNodes.some((node) => node?.['@type'] === 'BreadcrumbList')) {
          throw new Error('Spacebar route schema is missing BreadcrumbList');
        }
        if (!schemaNodes.some((node) => node?.['@type'] === 'FAQPage')) {
          throw new Error('Spacebar route schema is missing FAQPage');
        }
      }

      if (gameRoutes.has(route) && !schemaNodes.some((node) => node?.['@type'] === 'VideoGame')) {
        throw new Error('Game route schema is missing VideoGame');
      }

      if (
        (route === '/spacebar-clicker/' ||
          route === '/spacebar-clicker-2/' ||
          route === '/spacebar-clicker-unblocked/') &&
        !schemaNodes.some((node) => node?.['@type'] === 'VideoGame')
      ) {
        throw new Error('Spacebar game route schema is missing VideoGame');
      }

      if (
        (route === '/spacebar-counter/' || route === '/spacebar-clicker-test/') &&
        !schemaNodes.some((node) => node?.['@type'] === 'WebApplication')
      ) {
        throw new Error('Spacebar utility route schema is missing WebApplication');
      }

      if (
        (route === '/spacebar-games/' || route === '/blog/') &&
        !schemaNodes.some((node) => node?.['@type'] === 'ItemList')
      ) {
        throw new Error('Collection route schema is missing ItemList');
      }

      if (route === '/about/' && !schemaNodes.some((node) => node?.['@type'] === 'AboutPage')) {
        throw new Error('About route schema is missing AboutPage');
      }

      if (route === '/') {
        const websiteNode = schemaNodes.find((node) => node?.['@type'] === 'WebSite');
        const organizationNode = schemaNodes.find((node) => node?.['@id'] === site + '/#organization');
        if (!websiteNode) {
          throw new Error('Homepage schema is missing WebSite');
        }
        if (!schemaNodes.some((node) => node?.['@type'] === 'VideoGame')) {
          throw new Error('Homepage schema is missing flagship VideoGame');
        }
        if (!organizationNode || organizationNode?.['@type'] !== 'Organization') {
          throw new Error('Homepage schema is missing the stable publisher Organization node');
        }
        if (websiteNode?.publisher?.['@id'] !== site + '/#organization') {
          throw new Error('Homepage WebSite publisher must reference the stable Organization @id');
        }
      }

      if (route === '/compare/' || route === '/achievements/') {
        if (!schemaNodes.some((node) => node?.['@type'] === 'BreadcrumbList')) {
          throw new Error('Editorial route schema is missing BreadcrumbList');
        }
        if (!schemaNodes.some((node) => node?.['@type'] === 'ItemList')) {
          throw new Error('Editorial route schema is missing ItemList');
        }
      }
    } catch (error) {
      throw new Error(route + ': invalid static route JSON-LD: ' + error.message);
    }
  } else if (html.includes('id="prerender-route-jsonld"')) {
    throw new Error(route + ': unexpected static route JSON-LD on a non-core route');
  }

  if (geoExtractionRequirements.has(route)) {
    for (const snippet of geoExtractionRequirements.get(route)) {
      if (!html.includes(snippet)) {
        throw new Error(route + ': GEO extraction requirement is missing: ' + snippet);
      }
    }
  }

  if (deepSpacebarContentRoutes.has(route)) {
    const h2Count = (html.match(/<h2\b/gi) || []).length;
    const visibleText = html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (h2Count < 4) {
      throw new Error(route + ': high-value Spacebar prerender needs at least four static sections');
    }
    if (visibleText.length < 900) {
      throw new Error(route + ': high-value Spacebar prerender is too thin (' + visibleText.length + ' chars)');
    }
    if (!html.includes('href="/blog/')) {
      throw new Error(route + ': high-value Spacebar page must link back to a relevant guide');
    }
  }

  if (trustContentRoutes.has(route)) {
    const h2Count = (html.match(/<h2\b/gi) || []).length;
    const visibleText = html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (h2Count < 3) {
      throw new Error(route + ': trust/policy prerender needs at least three static sections');
    }
    if (visibleText.length < 650) {
      throw new Error(route + ': trust/policy prerender is too thin (' + visibleText.length + ' chars)');
    }
  }

  if (route === '/') {
    for (const href of requiredHomeClusterLinks) {
      if (!html.includes('href="' + href + '"')) {
        throw new Error(route + ': homepage is missing contextual cluster link to ' + href);
      }
    }
  }

  if (route === '/spacebar-games/') {
    for (const href of requiredSpacebarHubLinks) {
      if (!html.includes('href="' + href + '"')) {
        throw new Error(route + ': missing static crawl link to ' + href);
      }
    }
  }

  if (route === '/compare/') {
    const compareH2Count = (html.match(/<h2\b/gi) || []).length;
    if (compareH2Count < 3) {
      throw new Error(route + ': comparison prerender is too thin; expected at least three static sections');
    }
    for (const requiredText of ['Cookie Clicker', 'Universal Paperclips', 'Antimatter Dimensions', 'Spaceplan', 'Melvor Idle']) {
      if (!html.includes(requiredText)) {
        throw new Error(route + ': missing static comparison entity ' + requiredText);
      }
    }
  }

  if (route === '/achievements/') {
    const achievementsH2Count = (html.match(/<h2\b/gi) || []).length;
    if (achievementsH2Count < 4) {
      throw new Error(route + ': milestone prerender is too thin; expected at least four static sections');
    }
    for (const requiredText of ['1 trillion', '25 Mining Drones', '50 Orbital Stations', '100 Dark Matter']) {
      if (!html.includes(requiredText)) {
        throw new Error(route + ': missing static milestone detail ' + requiredText);
      }
    }
  }

  if (route === '/blog/') {
    const postLinks = [...html.matchAll(/href="(\/blog\/[^"]+\/)"/g)].map((match) => match[1]);
    if (new Set(postLinks).size < 10) {
      throw new Error(route + ': expected crawl links to all 10 blog articles');
    }
    if (!html.includes('Space clicker guides and strategy')) {
      throw new Error(route + ': static blog hub introduction is missing');
    }
    for (const href of requiredBlogHubIntentLinks) {
      if (!html.includes('href="' + href + '"')) {
        throw new Error(route + ': high-intent guide shortcut is missing ' + href);
      }
    }
  }

  if (route === '/blog/strategy-guide-clicker-game-space-empire/') {
    for (const heading of strategyGuideRequiredHeadings) {
      if (!html.includes(heading)) {
        throw new Error(route + ': strategy search-intent section is missing ' + heading);
      }
    }
  }

  if (route === '/about/') {
    const aboutH2Count = (html.match(/<h2\b/gi) || []).length;
    if (aboutH2Count < 3 || !html.includes('six simulations')) {
      throw new Error(route + ': About prerender is missing trust/product detail');
    }
  }

  if (route === '/sitemap/') {
    for (const href of [
      '/game/galaxy_miner/',
      '/game/mars_colony/',
      '/game/star_defense/',
      '/game/merge_ships/',
      '/game/gravity_idle/',
      '/game/deep_signal/',
      '/spacebar-games/',
      '/blog/',
      '/about/'
    ]) {
      if (!html.includes('href="' + href + '"')) {
        throw new Error(route + ': HTML sitemap prerender is missing ' + href);
      }
    }
  }

  if (route.startsWith('/blog/') && route !== '/blog/') {
    for (const href of blogClusterLinkCounts.keys()) {
      const matches = html.split('href="' + href + '"').length - 1;
      blogClusterLinkCounts.set(href, blogClusterLinkCounts.get(href) + matches);
    }

    const h2Count = (html.match(/<h2\b/gi) || []).length;
    if (h2Count < 2) throw new Error(route + ': full static blog body appears missing (H2 count ' + h2Count + ')');

    const articleSchemaMatch = html.match(/<script id="prerender-article-jsonld" type="application\/ld\+json">([\s\S]*?)<\/script>/i);
    if (!articleSchemaMatch) {
      throw new Error(route + ': static Article JSON-LD is missing');
    }

    try {
      const articleSchema = JSON.parse(articleSchemaMatch[1]);
      const nodes = Array.isArray(articleSchema['@graph']) ? articleSchema['@graph'] : [articleSchema];
      const articleNode = nodes.find((node) => node?.['@type'] === 'Article');
      if (!articleNode) {
        throw new Error('Article node is missing');
      }
      if (!nodes.some((node) => node?.['@type'] === 'BreadcrumbList')) {
        throw new Error('BreadcrumbList node is missing');
      }
      if (articleNode?.publisher?.['@id'] !== site + '/#organization') {
        throw new Error('Article publisher must reference the stable Organization @id');
      }
      const publisherNode = nodes.find((node) => node?.['@id'] === site + '/#organization');
      if (!publisherNode || publisherNode?.['@type'] !== 'Organization' || publisherNode?.name !== 'Space Clicker Game') {
        throw new Error('Article graph must include the stable publisher Organization node');
      }
      const authorNode = Array.isArray(articleNode.author) ? articleNode.author[0] : articleNode.author;
      if (authorNode?.['@id'] !== site + '/#editorial') {
        throw new Error('Article author must use the stable Editorial @id');
      }
      if (authorNode?.parentOrganization?.['@id'] !== site + '/#organization') {
        throw new Error('Article Editorial author must reference the publisher Organization');
      }
    } catch (error) {
      throw new Error(route + ': invalid article JSON-LD: ' + error.message);
    }

    if (!/<meta\s+[^>]*property="og:type"[^>]*content="article"[^>]*>/i.test(html)) {
      throw new Error(route + ': article Open Graph type is missing');
    }
    if (!/<meta\s+[^>]*property="article:published_time"[^>]*content="[^"]+"[^>]*>/i.test(html)) {
      throw new Error(route + ': article published time is missing');
    }
    if (!/<meta\s+[^>]*property="article:modified_time"[^>]*content="[^"]+"[^>]*>/i.test(html)) {
      throw new Error(route + ': article modified time is missing');
    }
    if (!/<meta\s+[^>]*property="article:author"[^>]*content="https:\/\/spaceclickergame\.com\/about\/"[^>]*>/i.test(html)) {
      throw new Error(route + ': article author profile link is missing');
    }
  }

  auditedRoutes.push(route);
}

const expectedPrerenderedRouteCount = CORE_ROUTE_META.length + 10;
if (auditedRoutes.length !== expectedPrerenderedRouteCount) {
  throw new Error(
    'Expected ' + expectedPrerenderedRouteCount +
    ' prerendered routes from shared core metadata plus 10 blog articles, found ' + auditedRoutes.length
  );
}

for (const [href, minimum] of blogClusterTargets) {
  const actual = blogClusterLinkCounts.get(href) || 0;
  if (actual < minimum) {
    throw new Error('Blog topic cluster is under-linking ' + href + ': expected at least ' + minimum + ', found ' + actual);
  }
}

// Validate internal crawl links across every prerendered page. Internal links
// should point directly to a real prerendered route instead of relying on a
// client-side fallback or silently creating a soft navigation dead end.
const auditedRouteSet = new Set(auditedRoutes);

for (const shortcut of manifest.shortcuts) {
  const normalized = shortcut.url === '/'
    ? '/'
    : '/' + String(shortcut.url).split('/').filter(Boolean).join('/') + '/';
  if (!auditedRouteSet.has(normalized)) {
    throw new Error('manifest.webmanifest shortcut points to a missing prerendered route: ' + shortcut.url);
  }
}

const incomingLinkCounts = new Map(auditedRoutes.map((route) => [route, 0]));

for (const file of htmlFiles) {
  const route = routeForFile(file);
  const html = fs.readFileSync(file, 'utf8');
  const hrefs = [...html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/gi)].map((match) => match[1]);

  for (const href of hrefs) {
    if (!href.startsWith('/') || href.startsWith('//')) continue;

    const pathname = href.split('#')[0].split('?')[0] || '/';
    if (
      pathname.startsWith('/assets/') ||
      pathname === '/robots.txt' ||
      pathname === '/sitemap.xml' ||
      /\.[a-z0-9]{2,8}$/i.test(pathname)
    ) {
      continue;
    }

    const normalized = pathname === '/'
      ? '/'
      : '/' + pathname.split('/').filter(Boolean).join('/') + '/';

    if (!auditedRouteSet.has(normalized)) {
      throw new Error(route + ': broken or non-canonical internal href ' + href + ' -> ' + normalized);
    }

    if (normalized !== route) {
      incomingLinkCounts.set(normalized, (incomingLinkCounts.get(normalized) || 0) + 1);
    }
  }
}

const orphanedRoutes = [...incomingLinkCounts.entries()]
  .filter(([route, count]) => route !== '/' && count === 0)
  .map(([route]) => route);

if (orphanedRoutes.length > 0) {
  throw new Error('Orphaned prerendered routes with no cross-page internal links: ' + orphanedRoutes.join(', '));
}

for (const route of highValueSchemaRoutes) {
  const incoming = incomingLinkCounts.get(route) || 0;
  if (incoming < 20) {
    throw new Error(route + ': core page needs at least 20 cross-page incoming links; found ' + incoming);
  }
}

for (const [route, incoming] of incomingLinkCounts) {
  if (route.startsWith('/blog/') && route !== '/blog/' && incoming < 2) {
    throw new Error(route + ': article needs at least 2 cross-page incoming links; found ' + incoming);
  }
}

console.log(
  'Incoming internal links: ' +
  [...incomingLinkCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([route, count]) => route + '=' + count)
    .join(' | ')
);

const faviconPath = path.join(distDir, 'favicon.svg');
if (!fs.existsSync(faviconPath)) throw new Error('dist/favicon.svg is missing');
const favicon = fs.readFileSync(faviconPath, 'utf8');
if (!/<svg\b/i.test(favicon) || !/viewBox="0 0 100 100"/i.test(favicon)) {
  throw new Error('favicon.svg is not the expected local SVG asset');
}
for (const file of htmlFiles) {
  const route = routeForFile(file);
  const html = fs.readFileSync(file, 'utf8');
  if (!/<link\s+rel="icon"\s+type="image\/svg\+xml"\s+href="\/favicon\.svg"\s*\/?>/i.test(html)) {
    throw new Error(route + ': local SVG favicon link is missing');
  }
}

const notFoundPath = path.join(distDir, '404.html');
if (!fs.existsSync(notFoundPath)) throw new Error('dist/404.html is missing');
const notFound = fs.readFileSync(notFoundPath, 'utf8');
if (!/<meta\s+name="robots"\s+content="noindex,nofollow"/i.test(notFound)) {
  throw new Error('404.html must include a noindex,nofollow robots directive');
}
if (!/<title>404 - Signal Lost \| Space Clicker Game<\/title>/i.test(notFound)) {
  throw new Error('404.html is missing the expected title');
}
if (!/href="\/"/i.test(notFound)) {
  throw new Error('404.html must include a link back to the homepage');
}
if (/<link\s+[^>]*rel="canonical"/i.test(notFound)) {
  throw new Error('404.html must not advertise an indexable canonical URL');
}

const sitemapPath = path.join(distDir, 'sitemap.xml');
if (!fs.existsSync(sitemapPath)) throw new Error('dist/sitemap.xml is missing');

const feedPath = path.join(distDir, 'feed.xml');
if (!fs.existsSync(feedPath)) throw new Error('dist/feed.xml is missing');
const feed = fs.readFileSync(feedPath, 'utf8');
const rssItemCount = (feed.match(/<item>/g) || []).length;
if (rssItemCount !== 10) throw new Error('Expected 10 RSS items, found ' + rssItemCount);
if (!feed.includes('<link>https://spaceclickergame.com/blog/</link>')) {
  throw new Error('RSS channel link is missing or incorrect');
}
if (!feed.includes('<title>Space Clicker Game Blog</title>')) {
  throw new Error('RSS channel title is missing or incorrect');
}
if (!feed.includes('<atom:link href="https://spaceclickergame.com/feed.xml" rel="self" type="application/rss+xml" />')) {
  throw new Error('RSS self link is missing');
}
const firstRssItem = feed.match(/<item>[\s\S]*?<link>([^<]+)<\/link>/);
if (
  !firstRssItem ||
  firstRssItem[1] !== 'https://spaceclickergame.com/blog/ultimate-hardware-guide-space-bar-click-game/'
) {
  throw new Error('RSS items must be ordered newest publication first');
}

const headersPath = path.join(distDir, '_headers');
if (!fs.existsSync(headersPath)) throw new Error('dist/_headers is missing');
const headers = fs.readFileSync(headersPath, 'utf8');
for (const required of [
  '/assets/*',
  'Cache-Control: public, max-age=31536000, immutable',
  '/sitemap.xml',
  '/feed.xml',
  '/llms.txt',
  '/robots.txt',
  'Cache-Control: public, max-age=900, stale-while-revalidate=3600',
  'Cache-Control: public, max-age=3600, stale-while-revalidate=86400',
  'Referrer-Policy: strict-origin-when-cross-origin',
  'X-Content-Type-Options: nosniff',
  'X-Frame-Options: DENY',
  'X-Permitted-Cross-Domain-Policies: none',
  'Permissions-Policy: camera=(), microphone=(), geolocation=()'
]) {
  if (!headers.includes(required)) throw new Error('dist/_headers is missing required cache policy: ' + required);
}

const llmsPath = path.join(distDir, 'llms.txt');
if (!fs.existsSync(llmsPath)) throw new Error('dist/llms.txt is missing');
const llms = fs.readFileSync(llmsPath, 'utf8');
for (const required of [
  '# Space Clicker Game',
  'https://spaceclickergame.com/game/galaxy_miner/',
  'https://spaceclickergame.com/spacebar-clicker/',
  'https://spaceclickergame.com/spacebar-clicker-test/',
  'https://spaceclickergame.com/privacy/',
  'https://spaceclickergame.com/feed.xml'
]) {
  if (!llms.includes(required)) throw new Error('llms.txt is missing ' + required);
}

for (const route of auditedRoutes) {
  const canonicalUrl = 'https://spaceclickergame.com' + route;
  if (!llms.includes(canonicalUrl)) {
    throw new Error('llms.txt is missing indexable route: ' + canonicalUrl);
  }
}

if (/https:\/\/spaceclickergame\.com\/[^\s)]+\\_/.test(llms)) {
  throw new Error('llms.txt contains a backslash-escaped underscore inside a URL');
}

const sitemap = fs.readFileSync(sitemapPath, 'utf8');
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const lastmods = [...sitemap.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map((match) => match[1]);
if (locs.length !== auditedRoutes.length) {
  throw new Error('Expected sitemap coverage for all ' + auditedRoutes.length + ' indexable prerendered routes, found ' + locs.length);
}
if (lastmods.length !== locs.length) throw new Error('Every sitemap URL must include one lastmod date');
for (const lastmod of lastmods) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(lastmod)) {
    throw new Error('Invalid sitemap lastmod format: ' + lastmod);
  }
  const timestamp = Date.parse(lastmod + 'T00:00:00Z');
  if (!Number.isFinite(timestamp) || timestamp > Date.now() + 86_400_000) {
    throw new Error('Invalid or future sitemap lastmod date: ' + lastmod);
  }
}
if (new Set(locs).size !== locs.length) throw new Error('Duplicate URLs found in sitemap.xml');
if (locs.includes(site + '/game/')) throw new Error('Duplicate /game/ URL must not return to the sitemap');

for (const loc of locs) {
  if (!loc.startsWith(site)) throw new Error('Unexpected sitemap origin: ' + loc);
  const pathname = new URL(loc).pathname;
  if (!auditedRoutes.includes(pathname)) {
    throw new Error('Sitemap URL has no prerendered route: ' + loc);
  }
}

const sitemapPathnames = new Set(locs.map((loc) => new URL(loc).pathname));
for (const route of auditedRoutes) {
  if (!sitemapPathnames.has(route)) {
    throw new Error('Indexable prerendered route is missing from sitemap.xml: ' + route);
  }
}

const home = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');
if (!home.includes('<title data-rh="true">Space Clicker – Free Space Clicker Game Online</title>')) {
  throw new Error('Homepage title no longer matches the primary Space Clicker target');
}
if (!home.includes('<h2>How to play Space Clicker</h2>')) {
  throw new Error('Homepage static search-intent answer is missing');
}

console.log('Static SEO/GEO audit passed: ' + auditedRoutes.length + ' prerendered routes, shared core metadata with unique primary-intent ownership, monolingual canonical policy without premature hreflang/x-default, custom noindex 404.html, ' + locs.length + ' sitemap URLs with lastmod, canonical/robots and 1200x630 social preview handoff, extractable comparison/formula blocks, 17 core route schemas, Spacebar breadcrumbs/crawl links and deep core intent pages, full compare/milestone/blog/about hubs and trust pages, 6 deep game summaries, 10 full blog articles, topic-cluster authority links, RSS/llms discovery files, and internal link integrity.');
