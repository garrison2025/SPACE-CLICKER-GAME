
import React, { useEffect, useMemo, useState } from 'react';
import { BLOG_POSTS } from '../constants';
import { ViewMode } from './SiteLayout';
import Breadcrumbs from './Breadcrumbs';
import SocialShare from './SocialShare';

interface BlogPageProps {
    postId: string | null;
    onNavigate: (view: ViewMode, id?: string) => void;
}

const BlogPage: React.FC<BlogPageProps> = ({ postId, onNavigate }) => {
    const [toc, setToc] = useState<{ id: string; text: string; level: number }[]>([]);

    const post = useMemo(() => 
        postId ? BLOG_POSTS.find(p => p.slug === postId || p.id === postId) : null, 
    [postId]);

    // Calculate related posts based on shared tags
    const relatedPosts = useMemo(() => {
        if (!post) return [];
        return BLOG_POSTS
            .filter(p => p.id !== post.id) // Exclude current
            .map(p => ({
                post: p,
                score: p.tags.filter(tag => post.tags.includes(tag)).length
            }))
            .filter(match => match.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 3) // Top 3
            .map(match => match.post);
    }, [post]);

    // Inject JSON-LD Structure for Article
    useEffect(() => {
        if (post) {
            const script = document.createElement('script');
            script.type = 'application/ld+json';
            script.text = JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Article",
                "headline": post.title,
                "image": [post.image],
                "datePublished": new Date(post.date).toISOString(), 
                "author": [{
                    "@type": "Person",
                    "name": post.author
                }],
                "description": post.excerpt,
                "mainEntityOfPage": {
                    "@type": "WebPage",
                    "@id": `https://spaceclickergame.com?view=blog&post=${post.slug}`
                }
            });
            document.head.appendChild(script);
            return () => { document.head.removeChild(script); };
        }
    }, [post]);

    // Generate TOC
    useEffect(() => {
        if (postId && post) {
            // We need to parse the content string to find headers since we render via dangerousHTML
            // This is a simple regex parser for <h2> and <h3> tags
            const matches = [...post.content.matchAll(/<(h[23])>(.*?)<\/\1>/g)];
            const items = matches.map((match, index) => {
                const tag = match[1];
                const text = match[2].replace(/<[^>]*>?/gm, ''); // strip inner html if any
                const id = `section-${index}`;
                return { id, text, level: parseInt(tag.charAt(1)) };
            });
            setToc(items);
        }
    }, [postId, post]);

    // --- SINGLE POST VIEW ---
    if (postId) {
        if (!post) {
            return (
                <div className="min-h-screen pt-32 px-4 text-center">
                    <h2 className="text-2xl text-red-500 mb-4">LOG ENTRY CORRUPTED</h2>
                    <button onClick={() => onNavigate('blog')} className="text-neon-blue underline">RETURN TO ARCHIVES</button>
                </div>
            );
        }

        // Process content to add IDs for TOC
        let processedContent = post.content;
        toc.forEach((item) => {
            // Replace the first occurrence of the header text with the ID injected
            // Note: This is fragile if multiple headers have exact same text, but sufficient for this scale
            const regex = new RegExp(`(<h${item.level}>)(${item.text})(</h${item.level}>)`);
            processedContent = processedContent.replace(regex, `$1<span id="${item.id}" class="scroll-mt-24 relative">$2</span>$3`);
        });

        return (
            <div className="min-h-screen bg-space-950 pt-24 pb-16 px-4">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
                    
                    {/* Left Sidebar: TOC (Desktop) */}
                    <aside className="hidden lg:block lg:col-span-3">
                        <div className="sticky top-24 p-6 bg-space-900/50 border border-white/5 rounded-xl backdrop-blur-sm">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Table of Contents</h4>
                            <nav>
                                <ul className="space-y-2 text-sm">
                                    {toc.map(item => (
                                        <li key={item.id} style={{ paddingLeft: `${(item.level - 2) * 12}px` }}>
                                            <a 
                                                href={`#${item.id}`}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' });
                                                }}
                                                className="text-gray-400 hover:text-neon-blue transition-colors block leading-tight"
                                            >
                                                {item.text}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </nav>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <div className="lg:col-span-9">
                        <Breadcrumbs 
                            items={[
                                { label: 'Mission Logs', view: 'blog' },
                                { label: post.title.length > 20 ? post.title.substring(0,20) + '...' : post.title }
                            ]} 
                            onNavigate={onNavigate} 
                        />

                        <article className="bg-space-900/80 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md shadow-2xl relative">
                            {/* Cover Image with CLS Fix */}
                            {post.image && (
                                <div className="w-full aspect-video relative overflow-hidden bg-space-800">
                                    <div className="absolute inset-0 bg-gradient-to-t from-space-900 via-transparent to-transparent z-10"></div>
                                    <img 
                                        src={post.image} 
                                        alt={post.title} 
                                        loading="eager"
                                        className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700 opacity-80"
                                    />
                                </div>
                            )}

                            <div className="p-8 md:p-12 relative z-20 -mt-20">
                                <header className="mb-10 border-b border-white/10 pb-8">
                                    <div className="flex flex-wrap gap-4 text-xs font-mono text-gray-400 mb-4 uppercase tracking-widest bg-black/50 inline-block px-4 py-2 rounded backdrop-blur-sm border border-white/5">
                                        <span className="text-neon-green">{post.date}</span>
                                        <span>//</span>
                                        <span>{post.readTime}</span>
                                        <span>//</span>
                                        <span className="text-purple-400">AUTH: {post.author}</span>
                                    </div>
                                    <h1 className="text-3xl md:text-5xl font-display font-black text-white mb-6 leading-tight drop-shadow-lg">
                                        {post.title}
                                    </h1>
                                    <div className="flex flex-wrap gap-2">
                                        {post.tags.map(tag => (
                                            <span key={tag} className="text-[10px] bg-neon-blue/10 border border-neon-blue/30 px-3 py-1 rounded text-neon-blue uppercase">#{tag}</span>
                                        ))}
                                    </div>
                                </header>

                                {/* Content Render with Custom Typography Styles */}
                                <div 
                                    className="
                                        text-gray-300 font-sans text-lg leading-8
                                        
                                        [&_p]:mb-8 [&_p]:block
                                        
                                        [&_h2]:text-3xl [&_h2]:font-display [&_h2]:font-bold [&_h2]:text-white [&_h2]:mt-16 [&_h2]:mb-6 [&_h2]:border-b [&_h2]:border-white/10 [&_h2]:pb-4
                                        
                                        [&_h3]:text-2xl [&_h3]:font-display [&_h3]:font-bold [&_h3]:text-neon-blue [&_h3]:mt-12 [&_h3]:mb-4
                                        
                                        [&_h4]:text-lg [&_h4]:font-bold [&_h4]:text-white [&_h4]:mt-8 [&_h4]:mb-3
                                        
                                        [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-8 [&_ul]:space-y-3 [&_ul]:marker:text-neon-blue
                                        
                                        [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-8 [&_ol]:space-y-3 [&_ol]:marker:text-neon-blue
                                        
                                        [&_li]:pl-2
                                        
                                        [&_a]:text-neon-blue [&_a]:font-bold [&_a]:no-underline hover:[&_a]:underline hover:[&_a]:text-white hover:[&_a]:shadow-[0_0_10px_rgba(0,243,255,0.5)] transition-all
                                        
                                        [&_strong]:text-white [&_strong]:font-black
                                        
                                        [&_blockquote]:border-l-4 [&_blockquote]:border-neon-purple [&_blockquote]:bg-white/5 [&_blockquote]:p-6 [&_blockquote]:my-10 [&_blockquote]:rounded-r-xl [&_blockquote]:italic [&_blockquote]:text-gray-400
                                        
                                        [&_img]:rounded-xl [&_img]:shadow-2xl [&_img]:my-10 [&_img]:w-full [&_img]:border [&_img]:border-white/10
                                        
                                        [&_.lead]:text-xl [&_.lead]:text-white [&_.lead]:font-light [&_.lead]:mb-10 [&_.lead]:border-l-2 [&_.lead]:border-neon-blue [&_.lead]:pl-6 [&_.lead]:leading-loose
                                    "
                                    dangerouslySetInnerHTML={{ __html: processedContent }}
                                />
                                
                                {/* Social Share Widget */}
                                <SocialShare title={post.title} />

                                {/* Related Posts (Topic Cluster) */}
                                {relatedPosts.length > 0 && (
                                    <div className="mt-16 pt-8 border-t border-white/10">
                                        <h3 className="text-xl font-display font-bold text-white mb-6">RELATED TRANSMISSIONS</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            {relatedPosts.map(rp => (
                                                <a 
                                                    key={rp.id}
                                                    href={`?view=blog&post=${rp.slug}`}
                                                    onClick={(e) => { e.preventDefault(); onNavigate('blog', rp.slug); }}
                                                    className="group bg-black/40 border border-white/5 rounded-lg p-4 hover:border-neon-blue/50 transition-all cursor-pointer block"
                                                >
                                                    <div className="text-[10px] text-neon-green mb-2">{rp.date}</div>
                                                    <h4 className="font-bold text-white text-sm group-hover:text-neon-blue line-clamp-2">{rp.title}</h4>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Article Footer */}
                                <div className="mt-12 text-center">
                                    <button 
                                        onClick={() => onNavigate('home')}
                                        className="px-8 py-3 bg-white/10 hover:bg-neon-blue hover:text-black text-white font-bold rounded transition-all"
                                    >
                                        RETURN TO COMMAND
                                    </button>
                                </div>
                            </div>
                        </article>
                    </div>
                </div>
            </div>
        );
    }

    // --- LIST VIEW ---
    return (
        <div className="min-h-screen bg-space-950 pt-24 pb-16 px-4">
            <div className="max-w-6xl mx-auto">
                <Breadcrumbs 
                    items={[{ label: 'Mission Logs' }]} 
                    onNavigate={onNavigate} 
                />

                <header className="mb-12 text-center">
                    <h1 className="text-4xl md:text-6xl font-display font-black text-white mb-4 tracking-widest">
                        MISSION <span className="text-neon-blue">LOGS</span>
                    </h1>
                    <p className="text-gray-400 font-mono text-sm max-w-2xl mx-auto">
                        DECODED TRANSMISSIONS REGARDING STRATEGY, HISTORY, AND THE EVOLUTION OF THE SPACE CLICKER GAME GENRE.
                    </p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {BLOG_POSTS.map(post => (
                        <a 
                            key={post.id}
                            href={`?view=blog&post=${post.slug}`}
                            onClick={(e) => { e.preventDefault(); onNavigate('blog', post.slug); }}
                            className="group bg-space-900 border border-white/10 rounded-xl overflow-hidden hover:border-neon-blue/50 transition-all cursor-pointer hover:-translate-y-2 shadow-lg flex flex-col h-full block"
                        >
                            {post.image && (
                                <div className="aspect-[16/9] overflow-hidden relative bg-space-800">
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors z-10"></div>
                                    <img 
                                        src={post.image} 
                                        alt={post.title} 
                                        loading="lazy" 
                                        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" 
                                    />
                                </div>
                            )}
                            
                            <div className="p-6 flex flex-col flex-1 relative">
                                <div className="h-1 bg-gradient-to-r from-space-800 to-space-700 group-hover:from-neon-blue group-hover:to-purple-500 transition-all absolute top-0 left-0 right-0"></div>
                                
                                <div className="text-[10px] font-mono text-gray-500 mb-3 flex justify-between">
                                    <span>{post.date}</span>
                                    <span>{post.readTime}</span>
                                </div>
                                <h2 className="text-xl font-display font-bold text-white mb-3 group-hover:text-neon-blue transition-colors line-clamp-2">
                                    {post.title}
                                </h2>
                                <p className="text-sm text-gray-400 mb-6 line-clamp-3 leading-relaxed flex-1">
                                    {post.excerpt}
                                </p>
                                <div className="text-xs font-bold text-neon-blue flex items-center gap-2 group-hover:gap-3 transition-all mt-auto">
                                    ACCESS DATA <span>→</span>
                                </div>
                            </div>
                        </a>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default BlogPage;
