import { onRequest } from '../functions/_middleware.js';

const nextResponse = () => new Response('OK', { status: 200 });

const run = async (url) => {
  const response = await onRequest({
    request: new Request(url),
    next: async () => nextResponse()
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

const sequel = await run('https://spaceclickergame.com/spacebar-clicker-2/');
expect(sequel.status === 200, 'Known Spacebar Clicker 2 route should pass through');

const knownGame = await run('https://spaceclickergame.com/game/galaxy_miner/');
expect(knownGame.status === 200, 'Known game route should pass through');

const gameRoot = await run('https://spaceclickergame.com/game/');
expect(gameRoot.status === 301, 'Duplicate game root should redirect');
expect(gameRoot.headers.get('location') === 'https://spaceclickergame.com/game/galaxy_miner/', 'Game root redirect target is wrong');

const knownBlog = await run('https://spaceclickergame.com/blog/evolution-of-space-clicker-game-genre/');
expect(knownBlog.status === 200, 'Known blog route should pass through');

const asset = await run('https://spaceclickergame.com/assets/index-ABC123.js');
expect(asset.status === 200, 'Static asset should pass through');

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

const supportRoutes = ['/about/', '/contact/', '/privacy/', '/terms/', '/cookies/', '/sitemap/', '/compare/', '/achievements/'];
for (const route of supportRoutes) {
  const response = await run('https://spaceclickergame.com' + route);
  expect(response.status === 200, 'Known support route should pass through: ' + route);
}

const robots = await run('https://spaceclickergame.com/robots.txt');
expect(robots.status === 200, 'robots.txt should pass through');

const sitemap = await run('https://spaceclickergame.com/sitemap.xml');
expect(sitemap.status === 200, 'sitemap.xml should pass through');

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

const invalidGame = await run('https://spaceclickergame.com/game/not-a-real-game/');
expect(invalidGame.status === 404, 'Unknown game route must return HTTP 404');

const invalidBlog = await run('https://spaceclickergame.com/blog/not-a-real-post/');
expect(invalidBlog.status === 404, 'Unknown blog route must return HTTP 404');

console.log('Middleware routing tests passed.');
