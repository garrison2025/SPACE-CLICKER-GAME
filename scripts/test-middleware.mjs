import fs from 'node:fs';
import { onRequest } from '../functions/_middleware.js';

const nextResponse = () => new Response('OK', { status: 200 });

const run = async (url) => {
  const request = new Request(url);
  const response = await onRequest({
    request,
    next: async () => nextResponse(),
    env: {
      ASSETS: {
        fetch: async (assetRequest) => {
          const assetUrl = new URL(assetRequest.url);
          if (
            assetUrl.pathname.includes('not-a-real') ||
            assetUrl.pathname === '/404.html'
          ) {
            return new Response('Missing', { status: 404 });
          }
          return nextResponse();
        }
      }
    }
  });
  return response;
};

const expect = (condition, message) => {
  if (!condition) throw new Error(message);
};

const hub = await run('https://spaceclickergame.com/spacebar-games/');
expect(hub.status === 200, 'Known Spacebar games hub should pass through');

const known = await run('https://spaceclickergame.com/spacebar-clicker/');
expect(known.status === 200, 'Known Spacebar route should pass through');
expect(known.headers.get('referrer-policy') === 'strict-origin-when-cross-origin', 'Known route must include Referrer-Policy');
expect(known.headers.get('x-content-type-options') === 'nosniff', 'Known route must include X-Content-Type-Options');
expect(known.headers.get('x-frame-options') === 'DENY', 'Known route must deny framing');
expect(known.headers.get('x-permitted-cross-domain-policies') === 'none', 'Known route must disable cross-domain policy files');
expect(known.headers.get('permissions-policy') === 'camera=(), microphone=(), geolocation=()', 'Known route must include Permissions-Policy');

const sequel = await run('https://spaceclickergame.com/spacebar-clicker-2/');
expect(sequel.status === 200, 'Known Spacebar Clicker 2 route should pass through');

const knownGame = await run('https://spaceclickergame.com/game/galaxy_miner/');
expect(knownGame.status === 200, 'Known game route should pass through');

const noSlashSpacebar = await run('https://spaceclickergame.com/spacebar-clicker');
expect(noSlashSpacebar.status === 301, 'Known Spacebar route without trailing slash should redirect');
expect(noSlashSpacebar.headers.get('location') === 'https://spaceclickergame.com/spacebar-clicker/', 'Spacebar trailing-slash redirect target is wrong');
expect(noSlashSpacebar.headers.get('x-content-type-options') === 'nosniff', 'Redirect must include security headers');

const noSlashGame = await run('https://spaceclickergame.com/game/galaxy_miner');
expect(noSlashGame.status === 301, 'Known game route without trailing slash should redirect');
expect(noSlashGame.headers.get('location') === 'https://spaceclickergame.com/game/galaxy_miner/', 'Game trailing-slash redirect target is wrong');

const noSlashBlog = await run('https://spaceclickergame.com/blog/evolution-of-space-clicker-game-genre');
expect(noSlashBlog.status === 301, 'Known blog route without trailing slash should redirect');
expect(noSlashBlog.headers.get('location') === 'https://spaceclickergame.com/blog/evolution-of-space-clicker-game-genre/', 'Blog trailing-slash redirect target is wrong');

const noSlashTracked = await run('https://spaceclickergame.com/spacebar-clicker?utm_source=test');
expect(noSlashTracked.status === 301, 'Tracked known route without trailing slash should redirect');
expect(noSlashTracked.headers.get('location') === 'https://spaceclickergame.com/spacebar-clicker/?utm_source=test', 'Trailing-slash redirect should preserve tracking parameters');

const duplicateSlash = await run('https://spaceclickergame.com//spacebar-clicker//');
expect(duplicateSlash.status === 301, 'Known route with duplicate slashes should canonicalize');
expect(duplicateSlash.headers.get('location') === 'https://spaceclickergame.com/spacebar-clicker/', 'Duplicate-slash canonical target is wrong');

const gameRoot = await run('https://spaceclickergame.com/game/');
expect(gameRoot.status === 301, 'Duplicate game root should redirect');
expect(gameRoot.headers.get('location') === 'https://spaceclickergame.com/game/galaxy_miner/', 'Game root redirect target is wrong');

const indexHtml = await run('https://spaceclickergame.com/index.html');
expect(indexHtml.status === 301, 'index.html should permanently redirect to the canonical homepage');
expect(indexHtml.headers.get('location') === 'https://spaceclickergame.com/', 'index.html redirect target is wrong');

const knownBlog = await run('https://spaceclickergame.com/blog/evolution-of-space-clicker-game-genre/');
expect(knownBlog.status === 200, 'Known blog route should pass through');

const asset = await run('https://spaceclickergame.com/assets/index-ABC123.js');
expect(asset.status === 200, 'Static asset should pass through');
expect(asset.headers.get('x-content-type-options') === 'nosniff', 'Static asset must include X-Content-Type-Options');
expect(asset.headers.get('x-frame-options') === 'DENY', 'Static asset must include frame protection');
expect(asset.headers.get('cache-control') === 'public, max-age=31536000, immutable', 'Hashed static assets must use immutable one-year caching');

const missingAsset = await run('https://spaceclickergame.com/assets/not-a-real-file.js');
expect(missingAsset.status === 404, 'Missing static asset must return HTTP 404');

const missingHtmlAsset = await run('https://spaceclickergame.com/not-a-real-page.html');
expect(missingHtmlAsset.status === 404, 'Missing .html request must return HTTP 404');

const legacyGame = await run('https://spaceclickergame.com/?view=game&id=galaxy_miner');
expect(legacyGame.status === 301, 'Legacy game URL should redirect');
expect(legacyGame.headers.get('location') === 'https://spaceclickergame.com/game/galaxy_miner/', 'Legacy game redirect target is wrong');

const legacyGameParam = await run('https://spaceclickergame.com/?game=galaxy_miner');
expect(legacyGameParam.status === 301, 'Legacy ?game URL should redirect');
expect(legacyGameParam.headers.get('location') === 'https://spaceclickergame.com/game/galaxy_miner/', 'Legacy ?game redirect target is wrong');

const legacyPostParam = await run('https://spaceclickergame.com/?post=evolution-of-space-clicker-game-genre');
expect(legacyPostParam.status === 301, 'Legacy ?post URL should redirect');
expect(legacyPostParam.headers.get('location') === 'https://spaceclickergame.com/blog/evolution-of-space-clicker-game-genre/', 'Legacy ?post redirect target is wrong');

const legacyBlog = await run('https://spaceclickergame.com/?view=blog&post=evolution-of-space-clicker-game-genre');
expect(legacyBlog.status === 301, 'Legacy blog URL should redirect');
expect(legacyBlog.headers.get('location') === 'https://spaceclickergame.com/blog/evolution-of-space-clicker-game-genre/', 'Legacy blog redirect target is wrong');

const legacySpacebar = await run('https://spaceclickergame.com/?view=spacebar-clicker');
expect(legacySpacebar.status === 301, 'Legacy Spacebar Clicker view should redirect');
expect(legacySpacebar.headers.get('location') === 'https://spaceclickergame.com/spacebar-clicker/', 'Legacy Spacebar Clicker redirect target is wrong');

const legacySpacebarTest = await run('https://spaceclickergame.com/?view=spacebar-clicker-test');
expect(legacySpacebarTest.status === 301, 'Legacy Spacebar test view should redirect');
expect(legacySpacebarTest.headers.get('location') === 'https://spaceclickergame.com/spacebar-clicker-test/', 'Legacy Spacebar test redirect target is wrong');

const invalidLegacyView = await run('https://spaceclickergame.com/?view=not-a-real-view');
expect(invalidLegacyView.status === 404, 'Unknown legacy view must return HTTP 404 instead of redirecting to home');

const invalidLegacyViewGame = await run('https://spaceclickergame.com/?view=game&id=not-a-real-game');
expect(invalidLegacyViewGame.status === 404, 'Unknown legacy view=game id must return HTTP 404');

const invalidLegacyViewPost = await run('https://spaceclickergame.com/?view=blog&post=not-a-real-post');
expect(invalidLegacyViewPost.status === 404, 'Unknown legacy view=blog post must return HTTP 404');

const supportRoutes = ['/about/', '/contact/', '/privacy/', '/terms/', '/cookies/', '/sitemap/', '/compare/', '/achievements/'];
for (const route of supportRoutes) {
  const response = await run('https://spaceclickergame.com' + route);
  expect(response.status === 200, 'Known support route should pass through: ' + route);
}

const robots = await run('https://spaceclickergame.com/robots.txt');
expect(robots.status === 200, 'robots.txt should pass through');

const sitemap = await run('https://spaceclickergame.com/sitemap.xml');
expect(sitemap.status === 200, 'sitemap.xml should pass through');

const feed = await run('https://spaceclickergame.com/feed.xml');
expect(feed.status === 200, 'feed.xml should pass through');

const llms = await run('https://spaceclickergame.com/llms.txt');
expect(llms.status === 200, 'llms.txt should pass through');

const trackedHome = await run('https://spaceclickergame.com/?utm_source=test&utm_medium=qa');
expect(trackedHome.status === 200, 'Normal tracking parameters must not break the homepage');

const trackedGame = await run('https://spaceclickergame.com/game/galaxy_miner/?utm_source=test');
expect(trackedGame.status === 200, 'Tracking parameters must not break known game routes');

const invalidLegacyGame = await run('https://spaceclickergame.com/?game=not-a-real-game');
expect(invalidLegacyGame.status === 404, 'Unknown legacy ?game URL must return HTTP 404');

const invalidLegacyPost = await run('https://spaceclickergame.com/?post=not-a-real-post');
expect(invalidLegacyPost.status === 404, 'Unknown legacy ?post URL must return HTTP 404');

const missing = await run('https://spaceclickergame.com/not-a-real-route/');
expect(missing.status === 404, 'Unknown route must return HTTP 404');
const missingHtml = await missing.text();
expect(missingHtml.includes('noindex,nofollow'), '404 HTML must include noindex');
expect(!missingHtml.includes('rel="canonical"'), '404 HTML must not canonicalize to the homepage');
expect(missing.headers.get('x-robots-tag') === 'noindex, nofollow', '404 response must send X-Robots-Tag noindex');
expect(missing.headers.get('referrer-policy') === 'strict-origin-when-cross-origin', '404 response must include Referrer-Policy');
expect(missing.headers.get('x-content-type-options') === 'nosniff', '404 response must include X-Content-Type-Options');
expect(missing.headers.get('x-frame-options') === 'DENY', '404 response must deny framing');

const invalidGame = await run('https://spaceclickergame.com/game/not-a-real-game/');
expect(invalidGame.status === 404, 'Unknown game route must return HTTP 404');

const invalidBlog = await run('https://spaceclickergame.com/blog/not-a-real-post/');
expect(invalidBlog.status === 404, 'Unknown blog route must return HTTP 404');

// Build-output contract: every indexable URL published in sitemap.xml must be
// accepted by middleware, and every non-root HTML route must canonicalize its
// no-trailing-slash variant with a permanent redirect.
const builtSitemap = fs.readFileSync(new URL('../dist/sitemap.xml', import.meta.url), 'utf8');
const sitemapUrls = [...builtSitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
expect(sitemapUrls.length === 32, 'Middleware test expected all 32 sitemap URLs');

for (const canonicalUrl of sitemapUrls) {
  const canonicalResponse = await run(canonicalUrl);
  expect(canonicalResponse.status === 200, 'Sitemap URL must pass middleware: ' + canonicalUrl);

  const parsed = new URL(canonicalUrl);
  if (parsed.pathname === '/') continue;

  const noSlashUrl = parsed.origin + parsed.pathname.replace(/\/$/, '');
  const noSlashResponse = await run(noSlashUrl);
  expect(noSlashResponse.status === 301, 'No-slash sitemap URL must redirect: ' + noSlashUrl);
  expect(
    noSlashResponse.headers.get('location') === canonicalUrl,
    'No-slash sitemap redirect target is wrong: ' + noSlashUrl
  );
}

console.log('Middleware routing tests passed: canonical routes, redirects, 404s, security headers, static discovery files, and 32/32 sitemap URLs are verified.');
