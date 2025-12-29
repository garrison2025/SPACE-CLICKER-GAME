import React, { useEffect } from 'react';
import { BlogPost, GameId } from '../types';
import { BLOG_POSTS, GAMES_CATALOG } from '../constants';

interface BlogPageProps {
  postId?: string | null;
  onNavigate: (view: 'blog', postId?: string) => void;
  onGameStart: (id: GameId) => void;
}

const BlogPage: React.FC<BlogPageProps> = ({ postId, onNavigate, onGameStart }) => {
  
  // --- SINGLE POST VIEW ---
  if (postId) {
    const post = BLOG_POSTS.find(p => p.slug === postId);
    
    // SEO: Handle Soft 404
    useEffect(() => {
        if (!post) {
            const meta = document.createElement('meta');
            meta.name = "robots";
            meta.content = "noindex";
            document.head.appendChild(meta);
            return () => { document.head.removeChild(meta); };
        }
    }, [post]);

    if (!post) {
      return (
        <div className="min-h-screen pt-32 pb-12 px-4 text-center">
          <h1 className="text-4xl font-display text-white mb-4">404 - DATA NOT FOUND</h1>
          <p className="text-gray-400 mb-8">The requested archive entry has been corrupted or deleted.</p>
          <button 
            onClick={() => onNavigate('blog')}
            className="text-neon-blue hover:text-white underline"
          >
            Return to Archives
          </button>
        </div>
      );
    }

    const relatedGame = post.relatedGameId ? GAMES_CATALOG.find(g => g.id === post.relatedGameId) : null;

    // SEO: Inject Article & Breadcrumb Schema
    useEffect(() => {
        const scriptId = 'blog-article-schema';
        if (document.getElementById(scriptId)) document.getElementById(scriptId)?.remove();

        const schemaData = [
            {
                "@context": "https://schema.org",
                "@type": "BlogPosting",
                "headline": post.title,
                "image": [post.image],
                "datePublished": new Date(post.date).toISOString(),
                "dateModified": new Date(post.lastUpdated || post.date).toISOString(), // Use lastUpdated if available
                "author": [{
                    "@type": "Person",
                    "name": post.author
                }],
                "publisher": {
                    "@type": "Organization",
                    "name": "Space Clicker Game",
                    "logo": {
                        "@type": "ImageObject",
                        "url": "https://spaceclickergame.com/logo.png"
                    }
                },
                "description": post.excerpt,
                "articleBody": post.content.replace(/<[^>]+>/g, ''),
                "mainEntityOfPage": {
                    "@type": "WebPage",
                    "@id": `https://spaceclickergame.com/?view=blog&post=${post.slug}`
                }
            },
            {
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                "itemListElement": [{
                    "@type": "ListItem",
                    "position": 1,
                    "name": "Home",
                    "item": "https://spaceclickergame.com"
                },{
                    "@type": "ListItem",
                    "position": 2,
                    "name": "Blog",
                    "item": "https://spaceclickergame.com/?view=blog"
                },{
                    "@type": "ListItem",
                    "position": 3,
                    "name": post.title
                }]
            }
        ];

        const script = document.createElement('script');
        script.id = scriptId;
        script.type = 'application/ld+json';
        script.text = JSON.stringify(schemaData);
        document.head.appendChild(script);

        return () => {
            document.getElementById(scriptId)?.remove();
        };
    }, [post]);

    return (
      <div className="min-h-screen bg-space-950 pt-24 pb-24 px-4">
        {/* Progress Bar (Reading Position) */}
        <div className="fixed top-0 left-0 h-1 bg-gradient-to-r from-neon-blue to-purple-500 z-[100] w-full origin-left transform scale-x-0 animate-scroll-progress"></div>

        <article className="max-w-5xl mx-auto">
           {/* Breadcrumbs */}
           <nav className="text-xs text-gray-500 font-mono mb-8 flex items-center gap-2" aria-label="Breadcrumb">
              <a href="/" onClick={(e) => {e.preventDefault(); onNavigate('blog');}} className="hover:text-neon-blue transition-colors">HOME</a>
              <span>/</span>
              <a href="/?view=blog" onClick={(e) => {e.preventDefault(); onNavigate('blog');}} className="hover:text-neon-blue transition-colors">ARCHIVES</a>
              <span>/</span>
              <span className="text-gray-300 truncate max-w-[200px]">{post.slug.toUpperCase()}</span>
           </nav>

           {/* Header */}
           <header className="mb-12 border-b border-white/10 pb-12">
              <div className="flex flex-wrap gap-2 mb-6">
                 {post.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 rounded-full bg-white/5 text-[10px] text-neon-blue font-bold tracking-wider uppercase border border-white/10 hover:bg-white/10 transition-colors cursor-default">
                       {tag}
                    </span>
                 ))}
              </div>
              <h1 className="text-4xl md:text-6xl font-display font-black text-white mb-8 leading-tight drop-shadow-lg">
                 {post.title}
              </h1>
              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-400 font-mono mb-8">
                 <span className="flex items-center gap-2 text-white">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    {post.author}
                 </span>
                 <span>•</span>
                 <time className="text-gray-300" dateTime={post.date}>{post.date}</time>
                 <span>•</span>
                 <span className="text-neon-blue">{post.readTime}</span>
              </div>
              
              {post.image && (
                  <div className="w-full aspect-[21/9] md:h-[500px] rounded-2xl overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative group bg-space-800">
                      <img 
                        src={post.image} 
                        alt={post.title} 
                        width="1200"
                        height="500"
                        loading="eager" 
                        decoding="async"
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <div className="absolute inset-0 hidden flex items-center justify-center bg-space-800">
                          <span className="text-6xl">🌌</span>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-space-950 via-transparent to-transparent opacity-40 pointer-events-none"></div>
                  </div>
              )}
           </header>

           <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              {/* Main Content */}
              <div className="lg:col-span-8">
                 <div 
                    className="blog-content prose prose-invert prose-lg max-w-none prose-headings:font-display prose-headings:text-white prose-a:text-neon-blue prose-strong:text-white"
                    dangerouslySetInnerHTML={{ __html: post.content }}
                 />
                 
                 {/* Author Bio Box */}
                 <div className="mt-20 p-8 bg-space-900 border border-white/10 rounded-2xl flex items-start md:items-center gap-6 shadow-xl">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex-shrink-0 flex items-center justify-center text-2xl border-2 border-white/20">
                       👨‍🚀
                    </div>
                    <div>
                       <div className="text-xs text-neon-blue uppercase tracking-widest font-bold mb-1">Transmission Source</div>
                       <div className="text-xl font-bold text-white mb-1">{post.author}</div>
                       <div className="text-sm text-gray-400 leading-relaxed">
                           Senior Archivist at Void Expanse Command. Specializing in deep space strategy and economic optimization for the modern galactic emperor.
                       </div>
                    </div>
                 </div>

                 {/* Related Topics (Internal Linking Mesh) */}
                 <div className="mt-12 pt-8 border-t border-white/10">
                     <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Related Topics</h3>
                     <div className="flex flex-wrap gap-2">
                         {post.tags.map(tag => (
                             <a 
                                key={tag} 
                                href="/?view=blog" 
                                onClick={(e) => { e.preventDefault(); onNavigate('blog'); }}
                                className="text-xs bg-space-800 text-gray-400 px-3 py-1 rounded hover:bg-space-700 hover:text-white transition-colors"
                             >
                                 #{tag}
                             </a>
                         ))}
                         <a href="/?game=galaxy_miner" onClick={(e) => {e.preventDefault(); onGameStart('galaxy_miner');}} className="text-xs bg-space-800 text-gray-400 px-3 py-1 rounded hover:bg-space-700 hover:text-white transition-colors">#SpaceClickerGame</a>
                         <a href="/?game=mars_colony" onClick={(e) => {e.preventDefault(); onGameStart('mars_colony');}} className="text-xs bg-space-800 text-gray-400 px-3 py-1 rounded hover:bg-space-700 hover:text-white transition-colors">#Strategy</a>
                     </div>
                 </div>
              </div>

              {/* Sidebar / CTA */}
              <aside className="lg:col-span-4 space-y-8">
                 {relatedGame && (
                    <div className="sticky top-24 bg-space-800/80 border border-neon-blue/30 rounded-2xl p-8 backdrop-blur-md shadow-[0_0_30px_rgba(0,243,255,0.15)] animate-in slide-in-from-right duration-700">
                        <div className="text-xs text-neon-blue font-bold tracking-widest uppercase mb-4">Recommended Simulation</div>
                        <div className="text-4xl mb-4">{relatedGame.icon}</div>
                        <h3 className="text-2xl font-bold text-white mb-2">{relatedGame.title}</h3>
                        <p className="text-sm text-gray-400 mb-6">{relatedGame.description}</p>
                        <button 
                            onClick={() => onGameStart(relatedGame.id)}
                            className="w-full py-4 bg-neon-blue text-black font-bold rounded hover:bg-white transition-colors shadow-lg"
                        >
                            PLAY NOW
                        </button>
                    </div>
                 )}
              </aside>
           </div>
        </article>
      </div>
    );
  }

  // --- BLOG INDEX VIEW ---
  return (
    <div className="min-h-screen bg-space-950 pt-24 pb-24 px-4">
       <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
              <h1 className="text-5xl md:text-7xl font-display font-black text-white mb-6 tracking-tight">
                  GALACTIC <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-purple-600">ARCHIVES</span>
              </h1>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                  Deep dives into strategy, lore, and the mathematics behind the Void Expanse universe.
              </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {BLOG_POSTS.map((post) => (
                  <article 
                    key={post.slug}
                    onClick={() => onNavigate('blog', post.slug)}
                    className="group bg-space-900 border border-white/10 rounded-2xl overflow-hidden hover:border-neon-blue/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(0,0,0,0.5)] cursor-pointer flex flex-col h-full"
                  >
                      <div className="relative h-48 overflow-hidden">
                          {post.image ? (
                              <img 
                                src={post.image} 
                                alt={post.title} 
                                loading="lazy"
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                              />
                          ) : (
                              <div className="w-full h-full bg-space-800 flex items-center justify-center text-4xl">🚀</div>
                          )}
                          <div className="absolute top-4 left-4">
                              <span className="px-3 py-1 bg-black/60 backdrop-blur text-[10px] font-bold text-white uppercase tracking-wider rounded border border-white/10">
                                  {post.tags[0]}
                              </span>
                          </div>
                      </div>
                      
                      <div className="p-6 flex-1 flex flex-col">
                          <div className="flex items-center gap-2 text-xs text-gray-500 font-mono mb-3">
                              <span>{post.date}</span>
                              <span>•</span>
                              <span>{post.readTime}</span>
                          </div>
                          
                          <h2 className="text-xl font-bold text-white mb-3 leading-tight group-hover:text-neon-blue transition-colors">
                              {post.title}
                          </h2>
                          
                          <p className="text-sm text-gray-400 leading-relaxed mb-6 line-clamp-3 flex-1">
                              {post.excerpt}
                          </p>
                          
                          <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
                              <div className="flex items-center gap-2 text-xs font-bold text-gray-300">
                                  <div className="w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center">👨‍🚀</div>
                                  {post.author}
                              </div>
                              <span className="text-xs font-bold text-neon-blue group-hover:translate-x-1 transition-transform">
                                  READ ENTRY →
                              </span>
                          </div>
                      </div>
                  </article>
              ))}
          </div>
       </div>
    </div>
  );
};

export default BlogPage;