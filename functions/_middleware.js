export async function onRequest(context) {
  const url = new URL(context.request.url);
  const legacyView = url.searchParams.get('view');

  if (legacyView) {
    let destination = '/';

    if (legacyView === 'game') {
      const id = url.searchParams.get('id');
      destination = id ? `/game/${encodeURIComponent(id)}` : '/game';
    } else if (legacyView === 'blog') {
      const post = url.searchParams.get('post');
      destination = post ? `/blog/${encodeURIComponent(post)}` : '/blog';
    } else {
      const allowed = new Set([
        'about',
        'contact',
        'privacy',
        'terms',
        'cookies',
        'blog',
        'sitemap',
        'compare',
        'achievements'
      ]);
      if (allowed.has(legacyView)) destination = `/${legacyView}`;
    }

    return Response.redirect(new URL(destination, url.origin).toString(), 301);
  }

  return context.next();
}
