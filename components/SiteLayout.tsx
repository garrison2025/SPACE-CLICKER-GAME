
import React, { useEffect } from 'react';

export type ViewMode = 'home' | 'game' | 'about' | 'contact' | 'privacy' | 'terms' | 'cookies' | 'sitemap' | 'blog';

interface SiteLayoutProps {
  children: React.ReactNode;
  onNavigate: (view: ViewMode) => void;
  currentView: ViewMode;
}

const SiteLayout: React.FC<SiteLayoutProps> = ({ children, onNavigate, currentView }) => {
  
  // SEO: Inject Organization Schema
  useEffect(() => {
      const scriptId = 'org-schema';
      if (document.getElementById(scriptId)) return;

      const orgData = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "Space Clicker Game",
        "url": "https://spaceclickergame.com",
        "logo": "https://spaceclickergame.com/logo.png", // Replace with real logo if available
        "description": "The premier destination for browser-based space clicker and strategy games.",
        "sameAs": [
            "https://twitter.com/spaceclicker", // Example placeholder
            "https://discord.gg/spaceclicker"   // Example placeholder
        ],
        "contactPoint": {
            "@type": "ContactPoint",
            "email": "info@spaceclickergame.com",
            "contactType": "customer support"
        }
      };

      const script = document.createElement('script');
      script.id = scriptId;
      script.type = 'application/ld+json';
      script.text = JSON.stringify(orgData);
      document.head.appendChild(script);

      return () => {
          document.getElementById(scriptId)?.remove();
      };
  }, []);

  // Helper for internal routing links to support Open in New Tab
  const Link = ({ view, label, className }: { view: ViewMode, label: string, className?: string }) => (
      <a 
        href={view === 'home' ? '/' : `/?view=${view}`}
        onClick={(e) => { e.preventDefault(); onNavigate(view); }}
        className={className}
      >
          {label}
      </a>
  );

  return (
    <div className="min-h-screen flex flex-col relative bg-space-900 selection:bg-neon-blue selection:text-black font-sans text-gray-200">
      
      {/* Accessibility: Skip to Content */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[110] focus:bg-neon-blue focus:text-black focus:px-4 focus:py-2 focus:font-bold focus:rounded">
          Skip to main content
      </a>

      {/* Navigation */}
      <header className="sticky top-0 z-[100] w-full bg-space-950/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            {/* Logo */}
            <a 
                href="/"
                onClick={(e) => { e.preventDefault(); onNavigate('home'); }}
                className="flex items-center gap-3 cursor-pointer group"
            >
                <div className="w-8 h-8 bg-gradient-to-tr from-neon-blue to-blue-600 rounded flex items-center justify-center text-black font-black text-xs shadow-[0_0_15px_rgba(0,243,255,0.4)] group-hover:rotate-12 transition-transform">
                    SC
                </div>
                <div className="flex flex-col">
                    <span className="font-display font-bold text-lg tracking-widest leading-none text-white group-hover:text-neon-blue transition-colors">SPACE CLICKER GAME</span>
                    <span className="text-[9px] text-gray-400 tracking-[0.2em] font-mono">VOID EXPANSE UNIVERSE</span>
                </div>
            </a>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8 text-sm font-bold tracking-wide">
                <Link 
                  view="home" 
                  label="HOME" 
                  className={`transition-colors ${currentView === 'home' ? 'text-neon-blue' : 'text-gray-400 hover:text-white'}`} 
                />
                <Link 
                  view="game" 
                  label="ALL GAMES" 
                  className={`transition-colors ${currentView === 'game' ? 'text-neon-blue' : 'text-gray-400 hover:text-white'}`} 
                />
                <Link 
                  view="blog" 
                  label="BLOG" 
                  className={`transition-colors ${currentView === 'blog' ? 'text-neon-blue' : 'text-gray-400 hover:text-white'}`} 
                />
                <Link 
                  view="about" 
                  label="ABOUT" 
                  className={`transition-colors ${currentView === 'about' ? 'text-neon-blue' : 'text-gray-400 hover:text-white'}`} 
                />
                <Link 
                  view="contact" 
                  label="CONTACT" 
                  className={`transition-colors ${currentView === 'contact' ? 'text-neon-blue' : 'text-gray-400 hover:text-white'}`} 
                />
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-4">
                <div className="hidden md:flex items-center bg-space-900 border border-white/10 rounded-full px-3 py-1.5 gap-2 focus-within:border-neon-blue/50 transition-colors">
                    <span className="text-gray-500 text-xs">🔍</span>
                    <input type="text" placeholder="Search games..." className="bg-transparent text-xs text-white focus:outline-none w-24 placeholder-gray-600" />
                </div>
                <button className="md:hidden text-2xl text-white">☰</button>
            </div>
        </div>
      </header>

      {/* Main Content */}
      <main id="main-content" className="flex-1 w-full relative outline-none" tabIndex={-1}>
        {children}
      </main>

      {/* Footer - Consistent across pages */}
      <footer className="border-t border-white/10 bg-space-950 pt-16 pb-8 text-gray-400 text-sm relative z-10">
         <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
             <div className="col-span-1 md:col-span-1">
                 <div className="font-display font-bold text-xl text-white mb-4 flex items-center gap-2">
                    <span className="text-neon-blue">SC</span> SPACE CLICKER GAME
                 </div>
                 <p className="text-xs leading-relaxed mb-4 text-gray-500">
                     The premier destination for the <strong>space clicker game</strong> genre. 
                     Join thousands of commanders mining the void, building colonies, and decoding signals.
                 </p>
                 <div className="flex gap-4 text-xl opacity-50">
                     <a href="#" className="hover:text-neon-blue transition-colors" aria-label="Twitter">🐦</a>
                     <a href="#" className="hover:text-red-500 transition-colors" aria-label="YouTube">▶️</a>
                     <a href="#" className="hover:text-indigo-400 transition-colors" aria-label="Discord">👾</a>
                 </div>
             </div>
             
             <div>
                 <h4 className="font-bold text-white mb-4 tracking-wider text-xs">NAVIGATION</h4>
                 <ul className="space-y-2 text-xs text-gray-500">
                     <li><Link view="home" label="Home Base" className="hover:text-neon-blue transition-colors" /></li>
                     <li><Link view="game" label="Game Catalog" className="hover:text-neon-blue transition-colors" /></li>
                     <li><Link view="blog" label="Galactic Archives" className="hover:text-neon-blue transition-colors" /></li>
                     <li><Link view="about" label="About Us" className="hover:text-neon-blue transition-colors" /></li>
                     <li><Link view="contact" label="Contact Command" className="hover:text-neon-blue transition-colors" /></li>
                     <li><Link view="sitemap" label="Sitemap" className="hover:text-neon-blue transition-colors" /></li>
                 </ul>
             </div>

             <div>
                 <h4 className="font-bold text-white mb-4 tracking-wider text-xs">FEATURED GAMES</h4>
                 <ul className="space-y-2 text-xs text-gray-500">
                     <li><a href="/?game=galaxy_miner" onClick={(e) => { e.preventDefault(); onNavigate('game'); }} className="hover:text-neon-blue transition-colors">Galaxy Miner</a></li>
                     <li><a href="/?game=mars_colony" onClick={(e) => { e.preventDefault(); onNavigate('game'); }} className="hover:text-neon-blue transition-colors">Mars Colony Idle</a></li>
                     <li><a href="/?game=deep_signal" onClick={(e) => { e.preventDefault(); onNavigate('game'); }} className="hover:text-neon-blue transition-colors">Deep Space Signal</a></li>
                 </ul>
             </div>

             <div>
                 <h4 className="font-bold text-white mb-4 tracking-wider text-xs">LEGAL</h4>
                 <ul className="space-y-2 text-xs text-gray-500">
                     <li><Link view="privacy" label="Privacy Policy" className="hover:text-white transition-colors" /></li>
                     <li><Link view="terms" label="Terms of Service" className="hover:text-white transition-colors" /></li>
                     <li><Link view="cookies" label="Cookie Settings" className="hover:text-white transition-colors" /></li>
                 </ul>
             </div>
         </div>
         <div className="border-t border-white/5 pt-8 text-center text-[10px] text-gray-600 font-mono uppercase tracking-widest">
             &copy; 2025 Space Clicker Game Network. All systems nominal.
         </div>
      </footer>
    </div>
  );
};

export default SiteLayout;
