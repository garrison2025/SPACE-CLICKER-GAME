const GAME_ROUTES = new Set([
  'galaxy_miner',
  'mars_colony',
  'star_defense',
  'merge_ships',
  'gravity_idle',
  'deep_signal'
]);

const BLOG_ROUTES = new Set([
  'evolution-of-space-clicker-game-genre',
  'psychology-of-space-clicking-games',
  'mastering-the-space-bar-clicking-game',
  'top-10-space-clicking-games-features-2025',
  'mechanics-of-space-bar-clicking-game-physics',
  'strategy-guide-clicker-game-space-empire',
  'educational-value-of-space-clicker-games',
  'active-vs-passive-space-click-game-styles',
  'narrative-design-clicker-game-space-adventure',
  'ultimate-hardware-guide-space-bar-click-game'
]);

const STATIC_ROUTES = new Set([
  '/',
  '/blog',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/cookies',
  '/sitemap',
  '/compare',
  '/achievements',
  '/spacebar-games',
  '/spacebar-clicker',
  '/spacebar-clicker-2',
  '/spacebar-counter',
  '/spacebar-clicker-test',
  '/spacebar-clicker-unblocked'
]);

const normalizePath = (pathname) => {
  if (pathname === '/') return '/';
  return '/' + pathname.split('/').filter(Boolean).join('/');
};

const isStaticAssetRequest = (pathname) =>
  pathname.startsWith('/assets/') ||
  pathname === '/robots.txt' ||
  pathname === '/sitemap.xml' ||
  /\.[a-z0-9]{2,8}$/i.test(pathname);

const isKnownRoute = (pathname) => {
  const path = normalizePath(pathname);
  if (STATIC_ROUTES.has(path)) return true;

  if (path.startsWith('/game/')) {
    return GAME_ROUTES.has(path.slice('/game/'.length));
  }

  if (path.startsWith('/blog/')) {
    return BLOG_ROUTES.has(path.slice('/blog/'.length));
  }

  return false;
};

const html404 = (url) => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
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

const applySecurityHeaders = (headers) => {
  headers.set('referrer-policy', 'strict-origin-when-cross-origin');
  headers.set('x-content-type-options', 'nosniff');
  headers.set('permissions-policy', 'camera=(), microphone=(), geolocation=()');
  return headers;
};

const withSecurityHeaders = (response) => new Response(response.body, {
  status: response.status,
  statusText: response.statusText,
  headers: applySecurityHeaders(new Headers(response.headers))
});

const redirectResponse = (destination, status = 301) =>
  withSecurityHeaders(Response.redirect(destination, status));

const notFoundResponse = (url) => new Response(html404(url), {
  status: 404,
  headers: applySecurityHeaders(new Headers({
    'content-type': 'text/html; charset=UTF-8',
    'cache-control': 'public, max-age=60',
    'x-robots-tag': 'noindex, nofollow'
  }))
});

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const pathname = url.pathname;
  const legacyView = url.searchParams.get('view');
  const legacyGame = url.searchParams.get('game');
  const legacyPost = url.searchParams.get('post');

  if (pathname === '/index.html') {
    const homeUrl = new URL('/', url.origin);
    return redirectResponse(homeUrl.toString(), 301);
  }

  if (!legacyView && legacyGame) {
    if (GAME_ROUTES.has(legacyGame)) {
      return redirectResponse(new URL(`/game/${encodeURIComponent(legacyGame)}/`, url.origin).toString(), 301);
    }
    return notFoundResponse(url);
  }

  if (!legacyView && legacyPost) {
    if (BLOG_ROUTES.has(legacyPost)) {
      return redirectResponse(new URL(`/blog/${encodeURIComponent(legacyPost)}/`, url.origin).toString(), 301);
    }
    return notFoundResponse(url);
  }

  if (legacyView) {
    let destination = '/';

    if (legacyView === 'game') {
      const id = url.searchParams.get('id');
      if (id && !GAME_ROUTES.has(id)) return notFoundResponse(url);
      destination = id ? `/game/${encodeURIComponent(id)}/` : '/game/galaxy_miner/';
    } else if (legacyView === 'blog') {
      const post = url.searchParams.get('post');
      if (post && !BLOG_ROUTES.has(post)) return notFoundResponse(url);
      destination = post ? `/blog/${encodeURIComponent(post)}/` : '/blog/';
    } else if (legacyView === 'home') {
      destination = '/';
    } else {
      const staticPath = `/${legacyView}`;
      if (!STATIC_ROUTES.has(staticPath) || staticPath === '/') {
        return notFoundResponse(url);
      }
      destination = staticPath + '/';
    }

    return redirectResponse(new URL(destination, url.origin).toString(), 301);
  }

  if (normalizePath(pathname) === '/game') {
    return redirectResponse(new URL('/game/galaxy_miner/', url.origin).toString(), 301);
  }

  if (isKnownRoute(pathname) && pathname !== '/') {
    const canonicalPath = normalizePath(pathname) + '/';
    if (pathname !== canonicalPath) {
      const canonicalUrl = new URL(url.toString());
      canonicalUrl.pathname = canonicalPath;
      return redirectResponse(canonicalUrl.toString(), 301);
    }
  }

  if (isKnownRoute(pathname)) {
    return withSecurityHeaders(await context.next());
  }

  if (isStaticAssetRequest(pathname)) {
    // Ask Pages' static asset binding directly instead of falling through the
    // SPA route chain. Existing hashed assets and generated discovery files are
    // served normally; a missing asset stays a real 404 instead of becoming the
    // homepage with HTTP 200.
    const assetFetch = context.env?.ASSETS?.fetch
      ? context.env.ASSETS.fetch.bind(context.env.ASSETS)
      : context.next;
    const response = await assetFetch(context.request);
    if (response.status === 404) {
      return notFoundResponse(url);
    }

    return withSecurityHeaders(response);
  }

  return notFoundResponse(url);
}
