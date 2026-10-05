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

const known = await run('https://spaceclickergame.com/spacebar-clicker/');
expect(known.status === 200, 'Known Spacebar route should pass through');

const knownGame = await run('https://spaceclickergame.com/game/galaxy_miner/');
expect(knownGame.status === 200, 'Known game route should pass through');

const knownBlog = await run('https://spaceclickergame.com/blog/evolution-of-space-clicker-game-genre/');
expect(knownBlog.status === 200, 'Known blog route should pass through');

const asset = await run('https://spaceclickergame.com/assets/index-ABC123.js');
expect(asset.status === 200, 'Static asset should pass through');

const legacyGame = await run('https://spaceclickergame.com/?view=game&id=galaxy_miner');
expect(legacyGame.status === 301, 'Legacy game URL should redirect');
expect(legacyGame.headers.get('location') === 'https://spaceclickergame.com/game/galaxy_miner/', 'Legacy game redirect target is wrong');

const legacyBlog = await run('https://spaceclickergame.com/?view=blog&post=evolution-of-space-clicker-game-genre');
expect(legacyBlog.status === 301, 'Legacy blog URL should redirect');
expect(legacyBlog.headers.get('location') === 'https://spaceclickergame.com/blog/evolution-of-space-clicker-game-genre/', 'Legacy blog redirect target is wrong');

const missing = await run('https://spaceclickergame.com/not-a-real-route/');
expect(missing.status === 404, 'Unknown route must return HTTP 404');
expect((await missing.text()).includes('noindex,nofollow'), '404 HTML must include noindex');

const invalidGame = await run('https://spaceclickergame.com/game/not-a-real-game/');
expect(invalidGame.status === 404, 'Unknown game route must return HTTP 404');

const invalidBlog = await run('https://spaceclickergame.com/blog/not-a-real-post/');
expect(invalidBlog.status === 404, 'Unknown blog route must return HTTP 404');

console.log('Middleware routing tests passed.');
