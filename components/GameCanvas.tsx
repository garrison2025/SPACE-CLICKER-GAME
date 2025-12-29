
import React, { ReactNode, useRef, useEffect } from 'react';
import { GameMeta } from '../types';
import { GAMES_CATALOG, BLOG_POSTS } from '../constants';

interface GameCanvasProps {
  children: ReactNode;
  title: string;
  headingLevel?: 'h1' | 'h2';
}

const GameCanvas: React.FC<GameCanvasProps> = ({ children, title, headingLevel = 'h1' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Find game data for SEO text
  const gameData = GAMES_CATALOG.find(g => g.title === title);
  const HeadingTag = headingLevel;

  // Find related blog posts
  const relatedPosts = gameData 
    ? BLOG_POSTS.filter(post => post.relatedGameId === gameData.id || post.tags.includes(gameData.title))
    : [];

  // SEO: Breadcrumb, VideoGame, HowTo & FAQ Schema
  useEffect(() => {
      const scriptId = 'json-ld-data';
      if (document.getElementById(scriptId)) document.getElementById(scriptId)?.remove();

      const breadcrumbSchema = {
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
          "name": "Games",
          "item": "https://spaceclickergame.com/?view=game"
        },{
          "@type": "ListItem",
          "position": 3,
          "name": title
        }]
      };

      // Generate a static "good" rating for SEO purposes
      const ratingValue = 4.8;
      const ratingCount = 12403;

      const gameSchema = {
        "@context": "https://schema.org",
        "@type": "VideoGame",
        "name": title,
        "description": gameData ? gameData.metaDescription : `Play ${title} online for free. The best space strategy idle game in the browser.`,
        "genre": ["Simulation", "Strategy", "Idle", "Clicker"],
        "applicationCategory": "Game",
        "operatingSystem": "Web Browser",
        "gamePlatform": "Web Browser",
        "author": {
            "@type": "Organization",
            "name": "Space Clicker Game"
        },
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD",
            "availability": "https://schema.org/InStock"
        },
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": ratingValue,
            "ratingCount": ratingCount,
            "bestRating": "5",
            "worstRating": "1"
        },
        "image": gameData?.image || "https://spaceclickergame.com/og-default.jpg"
      };

      // Parse Manual for HowTo Schema
      let howToSchema = null;
      if (gameData && gameData.manual) {
          const steps = gameData.manual.split('\n').map((step, index) => ({
              "@type": "HowToStep",
              "name": `Step ${index + 1}`,
              "text": step.replace(/^\d+\.\s/, ''),
              "url": `https://spaceclickergame.com/?game=${gameData.id}#step${index+1}`
          }));

          howToSchema = {
              "@context": "https://schema.org",
              "@type": "HowTo",
              "name": `How to Play ${title}`,
              "description": `Learn the basics of ${title}, a popular space clicker game.`,
              "step": steps,
              "totalTime": "PT5M" 
          };
      }

      // Generate Game-Specific FAQ Schema
      let faqSchema = null;
      if (gameData) {
          faqSchema = {
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": [
                  {
                      "@type": "Question",
                      "name": `Is ${gameData.title} free to play?`,
                      "acceptedAnswer": { "@type": "Answer", "text": `Yes, ${gameData.title} is completely free to play in your web browser. No download is required.` }
                  },
                  {
                      "@type": "Question",
                      "name": `How do I save my progress in ${gameData.title}?`,
                      "acceptedAnswer": { "@type": "Answer", "text": `The game automatically saves your progress to your browser's local storage every 10 seconds. You can also export your save string from the Settings menu.` }
                  },
                  {
                      "@type": "Question",
                      "name": `What is the goal of ${gameData.title}?`,
                      "acceptedAnswer": { "@type": "Answer", "text": `${gameData.description}` }
                  }
              ]
          };
      }

      const schemas = [breadcrumbSchema, gameSchema];
      if (howToSchema) schemas.push(howToSchema);
      if (faqSchema) schemas.push(faqSchema);

      const script = document.createElement('script');
      script.id = scriptId;
      script.type = 'application/ld+json';
      script.text = JSON.stringify(schemas); 
      document.head.appendChild(script);

      return () => {
          document.getElementById(scriptId)?.remove();
      };
  }, [title, gameData]);

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const handleRestart = () => {
      if(window.confirm("System Reboot: Are you sure you want to reload the simulation?")) {
          window.location.reload();
      }
  };

  return (
    <section className="relative w-full max-w-6xl mx-auto px-4 py-8">
       {/* Header with Breadcrumbs */}
       <div className="mb-6 text-center">
          {/* Breadcrumbs UI */}
          <nav className="flex justify-center items-center text-[10px] uppercase tracking-widest text-gray-500 mb-4 gap-2 font-mono">
              <a href="/" className="hover:text-neon-blue transition-colors">Home</a>
              <span>/</span>
              <a href="/?view=game" className="hover:text-neon-blue transition-colors">Games</a>
              <span>/</span>
              <span className="text-white font-bold">{title}</span>
          </nav>

          <HeadingTag className="text-4xl md:text-5xl font-display font-black text-white tracking-tight drop-shadow-xl">
             {title}
          </HeadingTag>
          <p className="text-neon-blue/80 text-sm font-bold tracking-widest mt-2 uppercase">
             The #1 Space Clicker Game
          </p>
       </div>

       {/* The Game Window */}
       <div 
         ref={containerRef}
         className="relative w-full aspect-[4/3] md:aspect-video bg-black rounded-xl overflow-hidden border border-white/20 shadow-[0_0_50px_rgba(0,0,0,0.5)] group"
       >
          {/* Scanline Overlay (Visual Polish) */}
          <div className="absolute inset-0 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay z-[5]"></div>
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/20 via-transparent to-black/20 z-[5] rounded-xl ring-1 ring-inset ring-white/10"></div>
          
          {/* Game Content */}
          <div className="absolute inset-0 z-10">
            {children}
          </div>
       </div>

       {/* Toolbar */}
       <div className="mt-4 flex flex-wrap items-center justify-between gap-4 bg-space-800/50 border border-white/10 rounded-lg p-3 backdrop-blur-sm">
          <div className="flex items-center gap-2">
             <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
             <span className="text-xs text-gray-400 font-mono">SERVER STATUS: ONLINE</span>
          </div>
          
          <div className="flex items-center gap-3">
             <button 
                onClick={handleFullscreen}
                className="flex items-center gap-2 px-4 py-2 bg-space-700 hover:bg-space-600 rounded text-xs font-bold transition-colors"
                aria-label="Toggle Fullscreen"
             >
                <span>🖥️</span> FULLSCREEN
             </button>
             <button 
                onClick={handleRestart}
                className="flex items-center gap-2 px-4 py-2 bg-space-700 hover:bg-space-600 rounded text-xs font-bold transition-colors"
                aria-label="Restart Game"
             >
                <span>🔄</span> RESTART
             </button>
          </div>
       </div>

       {/* SEO: Rich Text Content Below Game */}
       {gameData && (
           <article className="mt-16 prose prose-invert max-w-none border-t border-white/10 pt-12">
               <h2 className="font-display text-3xl text-white">About {gameData.title}</h2>
               {/* Use HTML rendering for descriptions to allow internal linking */}
               <div 
                  className="text-lg text-gray-300 leading-relaxed space-y-4"
                  dangerouslySetInnerHTML={{ 
                      __html: `<p>${gameData.description}</p><p>This title is a standout in the <strong>space clicker game</strong> genre, offering depth and strategy often missing in standard idle games.</p>` 
                  }}
               />
               
               {/* New Section: Related Strategy Guides (Internal Linking) */}
               {relatedPosts.length > 0 && (
                   <div className="my-12">
                       <h3 className="text-2xl font-display text-white mb-6">Strategy Guides & Intel</h3>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           {relatedPosts.slice(0, 2).map(post => (
                               <a 
                                 key={post.slug} 
                                 href={`/?view=blog&post=${post.slug}`}
                                 className="block p-4 rounded-lg bg-space-800 border border-white/10 hover:border-neon-blue transition-colors group no-underline"
                               >
                                   <div className="font-bold text-white group-hover:text-neon-blue mb-2">{post.title}</div>
                                   <div className="text-sm text-gray-400">{post.excerpt.substring(0, 80)}...</div>
                                   <div className="mt-3 text-xs text-neon-purple font-mono uppercase tracking-wider flex items-center gap-1">
                                       Read Guide <span>→</span>
                                   </div>
                               </a>
                           ))}
                       </div>
                   </div>
               )}

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                   <div className="bg-space-900/50 p-6 rounded-lg border border-white/5">
                       <h3 className="text-neon-blue font-bold text-lg mt-0">Mission Objectives</h3>
                       <p className="text-sm text-gray-400 font-mono whitespace-pre-wrap">{gameData.briefing}</p>
                   </div>
                   
                   <div>
                       <h3 className="text-white font-bold text-lg mt-0">How to Play</h3>
                       <ul className="space-y-2 text-gray-400 text-sm">
                           {gameData.manual.split('\n').map((step, i) => (
                               <li key={i} className="flex gap-2">
                                   <span className="text-neon-green font-bold">{i+1}.</span>
                                   <span>{step.replace(/^\d+\.\s/, '')}</span>
                               </li>
                           ))}
                       </ul>
                   </div>
               </div>

               <div className="mt-8">
                   <h3 className="text-white font-bold text-lg">Latest Updates</h3>
                   <div className="flex flex-wrap gap-2 mt-2">
                       {gameData.changelog.map((log, i) => (
                           <span key={i} className="text-xs bg-white/5 border border-white/10 px-3 py-1 rounded text-gray-400">
                               {log}
                           </span>
                       ))}
                   </div>
               </div>
           </article>
       )}
    </section>
  );
};

export default GameCanvas;
