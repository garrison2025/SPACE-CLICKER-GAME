import React from 'react';
import { Logo } from './Logo';

export type ViewMode = 'home' | 'game' | 'about' | 'contact' | 'privacy' | 'terms' | 'cookies' | 'blog' | 'sitemap' | 'compare' | 'achievements' | 'spacebar-clicker' | 'spacebar-counter' | 'spacebar-clicker-test' | 'spacebar-clicker-unblocked' | 'spacebar-games' | 'spacebar-clicker-2';

interface SiteLayoutProps {
  children: React.ReactNode;
  onNavigate: (view: ViewMode, id?: string) => void;
  currentView: ViewMode;
}

const SiteLayout: React.FC<SiteLayoutProps> = ({ children, onNavigate, currentView }) => {
  
  // Helper to create SPA-friendly links that bots can also follow
  const NavLink = ({ view, label, className = "" }: { view: ViewMode, label: string, className?: string }) => {
    // Determine path based on view
    let path = '/';
    if (view === 'game') path = '/game/galaxy_miner/';
    else if (view !== 'home') path = `/${view}/`;
    
    return (
        <a 
          href={path}
          onClick={(e) => { e.preventDefault(); onNavigate(view); }}
          className={`transition-colors font-bold tracking-wide text-sm ${currentView === view ? 'text-neon-blue' : 'text-gray-400 hover:text-white'} ${className}`}
        >
          {label}
        </a>
    );
  };

  return (
    <div className="min-h-screen flex flex-col relative bg-space-900 selection:bg-neon-blue selection:text-black font-sans text-gray-200">
      
      {/* Navigation */}
      <header className="sticky top-0 z-[100] w-full bg-space-950 md:bg-space-950/80 md:backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            {/* Logo */}
            <a 
                href="/"
                onClick={(e) => { e.preventDefault(); onNavigate('home'); }}
                className="group hover:opacity-90 transition-opacity"
            >
                <Logo withText={true} className="w-8 h-8 md:w-10 md:h-10" />
            </a>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-6 lg:gap-8">
                <NavLink view="home" label="HOME" />
                <NavLink view="game" label="GALAXY MINER" />
                <NavLink view="spacebar-clicker" label="SPACEBAR CLICKER" />
                <NavLink view="compare" label="COMPARE" />
                <NavLink view="achievements" label="ACHIEVEMENTS" />
                <NavLink view="blog" label="BLOG" />
                <NavLink view="about" label="ABOUT" />
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-2 md:gap-3">
                <button
                  onClick={() => onNavigate('spacebar-games')}
                  className="hidden lg:inline-flex px-3.5 py-1.5 bg-neon-purple/10 border border-neon-purple/40 text-neon-purple hover:bg-neon-purple hover:text-black transition-all rounded-full font-mono text-xs font-bold"
                >
                  SPACEBAR TOOLS
                </button>
                <button 
                  onClick={() => onNavigate('compare')}
                  className="hidden md:inline-flex px-3.5 py-1.5 bg-neon-blue/10 border border-neon-blue/40 text-neon-blue hover:bg-neon-blue hover:text-black transition-all rounded-full font-mono text-xs font-bold"
                >
                  VS IDLE GAMES
                </button>

                <details className="md:hidden relative">
                  <summary className="list-none cursor-pointer px-3 py-2 rounded-lg border border-white/10 bg-space-900 text-xs font-bold text-white">
                    MENU
                  </summary>
                  <nav className="absolute right-0 mt-2 w-64 max-h-[72vh] overflow-y-auto rounded-xl border border-white/10 bg-space-950 shadow-2xl p-2 z-[120]">
                    {[
                      ['home', 'Home'],
                      ['game', 'Galaxy Miner'],
                      ['spacebar-games', 'Spacebar Games'],
                      ['spacebar-clicker', 'Spacebar Clicker'],
                      ['spacebar-clicker-test', 'CPS Test'],
                      ['spacebar-counter', 'Spacebar Counter'],
                      ['compare', 'Feature Comparison'],
                      ['achievements', 'Milestones'],
                      ['blog', 'Blog'],
                      ['about', 'About']
                    ].map(([view, label]) => (
                      <a
                        key={view}
                        href={view === 'home' ? '/' : view === 'game' ? '/game/galaxy_miner/' : `/${view}/`}
                        onClick={(event) => {
                          event.preventDefault();
                          onNavigate(view as ViewMode);
                          const details = event.currentTarget.closest('details');
                          if (details) details.removeAttribute('open');
                        }}
                        className="block rounded-lg px-3 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-neon-blue transition-colors"
                      >
                        {label}
                      </a>
                    ))}
                  </nav>
                </details>
            </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full relative">
        {children}
      </main>

      {/* Footer - Consistent across pages */}
      <footer className="border-t border-white/10 bg-space-950 pt-16 pb-8 text-gray-400 text-sm relative z-10">
         <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
             <div className="col-span-1 md:col-span-1">
                 <div className="mb-4">
                    <Logo withText={true} className="w-8 h-8" />
                 </div>
                 <p className="text-xs leading-relaxed mb-4 text-gray-500">
                     A browser hub for <strong>space clicker game</strong> simulations and Spacebar tools. 
                     Play browser-based clicker games, build idle economies, and test your spacebar speed without downloads.
                 </p>
                 </div>
             
             <div>
                 <h4 className="font-bold text-white mb-4 tracking-wider text-xs">NAVIGATION</h4>
                 <ul className="space-y-2 text-xs text-gray-500 flex flex-col">
                     <li><NavLink view="home" label="Home Base" className="font-normal text-xs" /></li>
                     <li><NavLink view="game" label="Galaxy Miner" className="font-normal text-xs" /></li>
                     <li><NavLink view="spacebar-games" label="Spacebar Games" className="font-normal text-xs" /></li>
                     <li><NavLink view="spacebar-clicker" label="Spacebar Clicker" className="font-normal text-xs" /></li>
                     <li><NavLink view="spacebar-clicker-2" label="Spacebar Clicker 2" className="font-normal text-xs" /></li>
                     <li><NavLink view="spacebar-counter" label="Spacebar Counter" className="font-normal text-xs" /></li>
                     <li><NavLink view="spacebar-clicker-test" label="Spacebar Clicker Test" className="font-normal text-xs" /></li>
                     <li><NavLink view="compare" label="Feature Comparison" className="font-normal text-xs" /></li>
                     <li><NavLink view="achievements" label="Galaxy Miner Milestones" className="font-normal text-xs" /></li>
                     <li><NavLink view="blog" label="Mission Logs (Blog)" className="font-normal text-xs" /></li>
                     <li><NavLink view="about" label="About Us" className="font-normal text-xs" /></li>
                     <li><NavLink view="contact" label="Contact Command" className="font-normal text-xs" /></li>
                 </ul>
             </div>

             <div>
                 <h4 className="font-bold text-white mb-4 tracking-wider text-xs">FEATURED GAMES</h4>
                 <ul className="space-y-2 text-xs text-gray-500 flex flex-col">
                     <li><a href="/game/galaxy_miner/" onClick={(e) => { e.preventDefault(); onNavigate('game', 'galaxy_miner'); }} className="hover:text-neon-blue transition-colors">Galaxy Miner</a></li>
                     <li><a href="/game/mars_colony/" onClick={(e) => { e.preventDefault(); onNavigate('game', 'mars_colony'); }} className="hover:text-neon-blue transition-colors">Mars Colony Idle</a></li>
                     <li><a href="/game/star_defense/" onClick={(e) => { e.preventDefault(); onNavigate('game', 'star_defense'); }} className="hover:text-neon-blue transition-colors">Star Defense Force</a></li>
                     <li><a href="/game/merge_ships/" onClick={(e) => { e.preventDefault(); onNavigate('game', 'merge_ships'); }} className="hover:text-neon-blue transition-colors">Merge Ships Orbit</a></li>
                     <li><a href="/game/gravity_idle/" onClick={(e) => { e.preventDefault(); onNavigate('game', 'gravity_idle'); }} className="hover:text-neon-blue transition-colors">Gravity Well Idle</a></li>
                     <li><a href="/game/deep_signal/" onClick={(e) => { e.preventDefault(); onNavigate('game', 'deep_signal'); }} className="hover:text-neon-blue transition-colors">Deep Space Signal</a></li>
                 </ul>
             </div>

             <div>
                 <h4 className="font-bold text-white mb-4 tracking-wider text-xs">LEGAL & RESOURCES</h4>
                 <ul className="space-y-2 text-xs text-gray-500 flex flex-col">
                     <li><NavLink view="privacy" label="Privacy Policy" className="font-normal text-xs" /></li>
                     <li><NavLink view="terms" label="Terms of Service" className="font-normal text-xs" /></li>
                     <li><NavLink view="cookies" label="Cookie Settings" className="font-normal text-xs" /></li>
                     <li><NavLink view="sitemap" label="HTML Sitemap" className="font-normal text-xs" /></li>
                 </ul>
             </div>
         </div>
         <div className="border-t border-white/5 pt-8 text-center text-[10px] text-gray-600 font-mono uppercase tracking-widest">
             &copy; 2026 Space Clicker Game Network. All systems nominal.
         </div>
      </footer>
    </div>
  );
};

export default SiteLayout;