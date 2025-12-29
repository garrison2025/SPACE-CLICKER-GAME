
import React, { useState, useEffect } from 'react';
import { GAMES_CATALOG } from '../constants';
import { GameId } from '../types';
import { formatNumber } from '../utils';

interface LandingPageProps {
  onStart: (gameId: GameId) => void;
  onNavigate: (view: any, id?: string) => void;
  hasSave?: boolean;
  heroSlot?: React.ReactNode; 
}

// --- LIGHTWEIGHT HERO PREVIEW (CSS ONLY, NO LOGIC) ---
const HolographicPreview = ({ onStart }: { onStart: () => void }) => {
    return (
        <div 
            onClick={onStart}
            className="relative w-full aspect-video bg-black rounded-lg overflow-hidden border border-white/10 shadow-2xl group cursor-pointer select-none"
        >
            {/* Background Atmosphere */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#1e1b4b_0%,#000_100%)]"></div>
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
            
            {/* Animated Stars (CSS) */}
            <div className="absolute inset-0 animate-[pulse_4s_infinite]">
                <div className="absolute top-[20%] left-[20%] w-1 h-1 bg-white rounded-full opacity-50"></div>
                <div className="absolute top-[70%] left-[80%] w-1 h-1 bg-white rounded-full opacity-30"></div>
                <div className="absolute top-[40%] right-[10%] w-2 h-2 bg-blue-400 blur-sm rounded-full opacity-60"></div>
            </div>

            {/* Central Planet (CSS Animation) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 md:w-64 md:h-64">
                {/* Planet Body */}
                <div className="w-full h-full rounded-full bg-gradient-to-tr from-blue-900 to-cyan-500 shadow-[0_0_50px_rgba(6,182,212,0.3)] relative overflow-hidden group-hover:scale-105 transition-transform duration-700">
                    <div className="absolute inset-0 opacity-40 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
                    {/* Fake rotation effect */}
                    <div className="absolute top-0 -left-[100%] w-[200%] h-full bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 animate-[shimmer_8s_infinite_linear]"></div>
                </div>
                {/* Orbital Ring 1 */}
                <div className="absolute inset-[-20%] border border-white/10 rounded-full animate-[spin_10s_linear_infinite] border-t-cyan-500/50"></div>
                {/* Orbital Ring 2 */}
                <div className="absolute inset-[-40%] border border-white/5 rounded-full animate-[spin_15s_linear_infinite_reverse] border-b-purple-500/50"></div>
            </div>

            {/* Floating UI Elements (Fake HUD) */}
            <div className="absolute top-4 left-4 flex flex-col gap-1 opacity-80">
                <div className="text-[10px] text-cyan-500 font-bold tracking-widest animate-pulse">LIVE FEED</div>
                <div className="text-2xl font-mono text-white font-black">4,829,102 <span className="text-xs text-gray-500">SD</span></div>
                <div className="text-xs text-green-400 font-mono">+12,400/s</div>
            </div>

            <div className="absolute bottom-4 right-4 text-right opacity-80">
                <div className="text-[10px] text-purple-500 font-bold tracking-widest">DRONE FLEET</div>
                <div className="text-xl font-mono text-white">ACTIVE</div>
            </div>

            {/* Central CTA Overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] transition-all duration-300 group-hover:bg-black/20 group-hover:backdrop-blur-none">
                <div className="relative">
                    <div className="absolute inset-0 bg-neon-blue blur-xl opacity-20 group-hover:opacity-40 transition-opacity animate-pulse"></div>
                    <button className="relative bg-space-900/90 border border-neon-blue text-neon-blue px-8 py-3 rounded text-sm md:text-base font-display font-black tracking-[0.2em] shadow-[0_0_20px_rgba(0,243,255,0.2)] group-hover:bg-neon-blue group-hover:text-black transition-all transform group-hover:scale-110">
                        RESUME MINING
                    </button>
                </div>
            </div>

            {/* Scanlines */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%] pointer-events-none"></div>
        </div>
    );
};

// --- SUB-COMPONENTS ---

const LiveStatsTicker = () => {
  return (
    <div className="w-full bg-space-950 border-y border-white/10 overflow-hidden py-2 relative z-20">
       <div className="absolute inset-0 bg-neon-blue/5"></div>
       <div className="flex gap-12 items-center animate-[scroll_40s_linear_infinite] whitespace-nowrap text-xs font-mono text-gray-400">
          <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> SYSTEM STATUS: NOMINAL</span>
          <span className="flex items-center gap-2 text-neon-blue"><span>★</span> COMMANDERS ACTIVE: 14,203</span>
          <span className="flex items-center gap-2"><span>⛏️</span> TOTAL STARDUST MINED: {formatNumber(84932000000000)}</span>
          <span className="flex items-center gap-2 text-yellow-400"><span>⚠</span> SECTOR 7 WARNING: HIGH RADIATION</span>
          <span className="flex items-center gap-2"><span>🚀</span> NEW COLONIES ESTABLISHED: 842</span>
          {/* Duplicate for smooth loop */}
          <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> SYSTEM STATUS: NOMINAL</span>
          <span className="flex items-center gap-2 text-neon-blue"><span>★</span> COMMANDERS ACTIVE: 14,203</span>
          <span className="flex items-center gap-2"><span>⛏️</span> TOTAL STARDUST MINED: {formatNumber(84932000000000)}</span>
       </div>
       <style>{`
         @keyframes scroll {
           0% { transform: translateX(0); }
           100% { transform: translateX(-50%); }
         }
       `}</style>
    </div>
  );
};

const BrandHero = () => {
    const scrollToConsole = () => {
        const el = document.getElementById('console-anchor');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <section className="relative min-h-[90vh] flex flex-col items-center justify-center overflow-hidden bg-space-950">
            {/* Dynamic Background */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-space-800 via-space-950 to-black pointer-events-none"></div>
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
            
            {/* Animated Grid Floor */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,243,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,243,255,0.03)_1px,transparent_1px)] bg-[size:100px_100px] [transform:perspective(1000px)_rotateX(60deg)_translateY(-100px)_scale(2)] opacity-30 pointer-events-none"></div>

            <div className="relative z-10 text-center px-4 max-w-5xl mx-auto space-y-8">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-4 animate-in fade-in slide-in-from-top-4 duration-1000">
                    <span className="w-2 h-2 bg-neon-green rounded-full animate-pulse"></span>
                    <span className="text-xs font-mono text-neon-green tracking-widest">V.3.0 SYSTEM ONLINE</span>
                </div>

                {/* Main Title (H1) - LCP OPTIMIZED (Removed animations) */}
                <h1 className="text-5xl md:text-7xl lg:text-9xl font-display font-black text-white tracking-tighter leading-none drop-shadow-[0_0_50px_rgba(0,243,255,0.3)]">
                    SPACE <span className="text-transparent bg-clip-text bg-gradient-to-br from-neon-blue via-blue-500 to-purple-600">CLICKER GAME</span>
                </h1>

                {/* Subtitle - SEO OPTIMIZED */}
                <p className="text-lg md:text-2xl text-gray-400 font-light max-w-3xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
                    Enter the <strong>Void Expanse</strong>. <br className="hidden md:block"/>
                    Build your fleet, manage colonies, and dominate the galaxy in the ultimate browser-based idle strategy experience.
                    <br/>
                    <span className="text-sm text-neon-blue mt-4 inline-block font-mono tracking-widest border border-neon-blue/30 px-3 py-1 rounded bg-neon-blue/5">NO DOWNLOAD • FREE TO PLAY</span>
                </p>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-8 border-y border-white/5 bg-black/20 backdrop-blur-sm animate-in fade-in duration-1000 delay-300">
                    {[
                        { label: 'Universes', val: '6+' },
                        { label: 'Active Players', val: '14k' },
                        { label: 'Price', val: 'Free' },
                        { label: 'Genre', val: 'Idle RPG' },
                    ].map((stat, i) => (
                        <div key={i}>
                            <div className="text-2xl md:text-3xl font-display font-bold text-white">{stat.val}</div>
                            <div className="text-[10px] uppercase tracking-widest text-gray-500">{stat.label}</div>
                        </div>
                    ))}
                </div>

                {/* CTA Button */}
                <div className="pt-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
                    <button 
                        onClick={scrollToConsole}
                        className="group relative px-8 py-4 bg-white text-black font-display font-black text-xl tracking-widest hover:bg-neon-blue transition-all duration-300 shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:shadow-[0_0_50px_rgba(0,243,255,0.6)] hover:scale-105"
                    >
                        START MINING
                        <span className="absolute -bottom-2 -right-2 w-full h-full border-2 border-white/30 -z-10 group-hover:translate-x-1 group-hover:translate-y-1 transition-transform"></span>
                    </button>
                    <div className="mt-4 text-xs text-gray-500 font-mono animate-pulse">
                        SCROLL FOR TERMINAL ACCESS ↓
                    </div>
                </div>
            </div>
            
            {/* Decorative Planet */}
            <div className="absolute -bottom-64 -right-64 w-[800px] h-[800px] bg-gradient-to-tr from-purple-900/20 to-blue-900/20 rounded-full blur-3xl pointer-events-none"></div>
        </section>
    );
};

const WhyChooseUs = () => (
    <section className="max-w-6xl mx-auto py-16 px-4">
        <div className="text-center mb-12">
            <h2 className="text-3xl font-display font-bold text-white mb-4">Why This is the Best <span className="text-neon-blue">Space Clicker Game</span></h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
                Unlike a generic <strong>space clicker game</strong> that only offers repetitive tapping, we deliver a deep, interconnected universe with strategy, automation, and discovery.
            </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
                { title: 'True Idle Strategy', desc: 'Most space clicker games require constant attention. We focus on automation. Build your drone fleet and let the game play itself while you sleep.' },
                { title: 'Cross-Platform Progress', desc: 'Access your space clicker game empire from any device. Our browser-based engine ensures smooth performance on mobile and desktop without downloads.' },
                { title: 'Evolving Universe', desc: 'This is not just a mining simulator. It is a full space clicker game RPG with combat, colonization, and text-based mystery adventures.' }
            ].map((item, i) => (
                <div key={i} className="bg-space-800/40 p-6 rounded-xl border border-white/10 hover:border-neon-blue/50 transition-colors">
                    <div className="text-4xl mb-4 text-neon-purple opacity-80">0{i+1}</div>
                    <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
                </div>
            ))}
        </div>
    </section>
);

const HowToPlay = () => (
    <section className="bg-space-950 border-y border-white/5 py-16 px-4">
        <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-4 mb-12">
                <div className="w-1 h-8 bg-neon-green"></div>
                <h2 className="text-2xl font-display text-white tracking-widest uppercase">
                    Mastering the Space Clicker Game Loop
                </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div className="space-y-8">
                    {[
                        { step: '01', title: 'Initialize Mining Protocols', text: 'Start your journey in our premier space clicker game by manually extracting Stardust. Every click counts towards your first automated drone.' },
                        { step: '02', title: 'Automate & Expand', text: 'The core of any top-tier space clicker game is automation. Purchase Rovers and Orbital Stations to harvest resources while you are AFK.' },
                        { step: '03', title: 'Prestige & Evolve', text: 'Reached the Galactic Core? Reset your progress to gain Dark Matter. This is the ultimate goal of the space clicker game experience.' }
                    ].map((s, i) => (
                        <div key={i} className="flex gap-4">
                            <div className="text-neon-green font-mono font-bold text-xl">{s.step}</div>
                            <div>
                                <h3 className="text-white font-bold mb-1">{s.title}</h3>
                                <p className="text-sm text-gray-500">{s.text}</p>
                            </div>
                        </div>
                    ))}
                </div>
                
                {/* Visual Graphic */}
                <div className="relative h-64 bg-space-900 rounded-2xl border border-white/10 flex items-center justify-center overflow-hidden group">
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(68,68,68,.2)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%,100%_100%] animate-[shimmer_3s_infinite]"></div>
                    <div className="text-center relative z-10">
                        <div className="text-5xl mb-2">🚀</div>
                        <div className="font-display font-bold text-white text-lg">LAUNCH YOUR FLEET</div>
                        <div className="text-xs text-neon-green mt-2 px-4 py-1 bg-neon-green/10 rounded-full inline-block">
                            PLAY THE BEST SPACE CLICKER GAME
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
);

const NewsletterSection = () => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'success'>('idle');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('success');
        setEmail('');
    };

    return (
        <section className="relative overflow-hidden rounded-2xl border border-neon-blue/30 bg-space-900/80 p-8 md:p-12 text-center max-w-4xl mx-auto my-16 shadow-[0_0_30px_rgba(0,243,255,0.1)]">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-neon-blue to-transparent"></div>
            <div className="relative z-10">
                <div className="text-4xl mb-4">📡</div>
                <h3 className="text-2xl font-display font-bold text-white mb-2">SUBSPACE TRANSMISSION</h3>
                <p className="text-gray-400 mb-8 max-w-lg mx-auto">
                    Receive encrypted coordinates for new galaxies, patch notes, and exclusive artifact codes directly to your datalink.
                </p>
                
                {status === 'success' ? (
                    <div className="bg-green-500/10 border border-green-500 text-green-400 py-3 px-6 rounded inline-block animate-in fade-in zoom-in">
                        ✓ SIGNAL LOCKED. STANDBY FOR TRANSMISSION.
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 justify-center max-w-md mx-auto">
                        <input 
                            type="email" 
                            placeholder="commander@starfleet.com" 
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="flex-1 bg-black/50 border border-white/20 rounded px-4 py-3 text-white focus:outline-none focus:border-neon-blue transition-colors"
                        />
                        <button type="submit" className="bg-neon-blue hover:bg-white text-black font-bold px-6 py-3 rounded transition-colors uppercase tracking-wider">
                            Connect
                        </button>
                    </form>
                )}
                <p className="text-xs text-gray-600 mt-4">No spam. Only high-priority intel.</p>
            </div>
        </section>
    );
};

const CommunitySection = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        {[
            { user: "Cmdr. Shepard", role: "Elite Miner", text: "The automation depth in Galaxy Miner is insane. I've been running my Dyson Swarm for 3 weeks straight." },
            { user: "Xeno_Hunter_99", role: "Defense Specialist", text: "Star Defense wave 50 boss is brutal. Make sure you upgrade your EMP cooldowns first!" },
            { user: "Red_Planet_Architect", role: "Colony Governor", text: "Mars Colony perfectly captures the balance of resources. One dust storm nearly wiped me out." }
        ].map((review, i) => (
            <div key={i} className="bg-space-800/30 border border-white/5 p-6 rounded-xl hover:bg-space-800/50 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-lg border border-white/10">
                        {['👨‍🚀', '👽', '🤖'][i]}
                    </div>
                    <div>
                        <div className="font-bold text-white text-sm">{review.user}</div>
                        <div className="text-xs text-neon-blue">{review.role}</div>
                    </div>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed italic">"{review.text}"</p>
                <div className="mt-4 flex gap-1 text-yellow-500 text-xs">★★★★★</div>
            </div>
        ))}
    </div>
);

const GalacticArchives = () => (
    <section className="max-w-7xl mx-auto mt-24 border-t border-white/10 pt-16">
        <div className="flex items-center gap-4 mb-8">
             <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
             <h2 className="text-sm font-display font-bold text-gray-400 tracking-[0.2em] uppercase">Galactic Archives // Data Logs</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-gray-500 text-sm leading-relaxed">
            <div>
                <h3 className="text-white font-bold mb-3 text-lg">What defines a true Space Clicker Game?</h3>
                <p className="mb-4">
                    A <strong>space clicker game</strong> (often referred to as an incremental space game) is a genre of simulation where players start with a simple manual mining laser and progressively build a galactic empire. The core appeal of a <strong>space clicker game</strong> lies in the satisfaction of watching numbers grow exponentially through strategic upgrades.
                </p>
                <p>
                    We elevate the standard <strong>space clicker game</strong> formula by integrating real-time physics, active combat modules, and a complex economy. It is not just about clicking; it is about managing a starfleet.
                </p>
            </div>
            <div>
                <h3 className="text-white font-bold mb-3 text-lg">Why are Browser Space Clicker Games so popular?</h3>
                <ul className="space-y-2 list-disc pl-4">
                    <li><strong>Instant Access:</strong> Start your <strong>space clicker game</strong> adventure instantly in Chrome, Firefox, or Safari without large downloads.</li>
                    <li><strong>Passive Progression:</strong> The best <strong>space clicker game</strong> respects your time. Your miners work 24/7, even when you are offline.</li>
                    <li><strong>Infinite Scale:</strong> From a single asteroid to a Dyson Sphere, the scale of our <strong>space clicker game</strong> is mathematically infinite.</li>
                </ul>
            </div>
        </div>

        <div className="mt-12 p-6 bg-space-900 rounded-lg border border-white/5">
            <h3 className="text-white font-bold mb-4">System Keywords</h3>
            <div className="flex flex-wrap gap-2">
                {['Space Clicker Game', 'Idle Mining', 'Space Simulation', 'Strategy Game', 'Tower Defense', 'Mars Colonization', 'Text Adventure', 'Incremental Game', 'Web Game', 'Free Online Games'].map(tag => (
                    <span key={tag} className="text-xs bg-black/40 px-3 py-1 rounded text-gray-400 border border-white/5">
                        {tag}
                    </span>
                ))}
            </div>
        </div>
    </section>
);

const TacticalDatabank = () => (
    <section className="max-w-4xl mx-auto my-16">
        <div className="text-center mb-12">
            <h2 className="text-2xl font-display font-bold text-white tracking-widest">TACTICAL DATABANK</h2>
            <p className="text-xs text-gray-500 mt-2 font-mono">FREQUENTLY REQUESTED INTEL</p>
        </div>
        <div className="grid gap-4">
            {[
                { q: "Is this space clicker game free to play?", a: "Yes. Our Space Clicker Game is 100% free with no paywalls blocking your galactic progression." },
                { q: "Does the game save my progress?", a: "The system auto-saves to your local browser storage every 10 seconds, ensuring your space clicker game empire is always safe." },
                { q: "How do I unlock new games?", a: "Currently all simulations are open for testing. Future updates to our space clicker game platform may lock them behind Galaxy Miner prestige levels." },
                { q: "What happens when I Prestige?", a: "You reset your mining progress but gain Dark Matter, a core mechanic of any deep space clicker game that boosts production permanently." }
            ].map((item, i) => (
                <div key={i} className="bg-space-800/30 border border-white/5 rounded-lg p-6 hover:border-neon-blue/30 transition-colors">
                    <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                        <span className="text-neon-blue">Q:</span> {item.q}
                    </h3>
                    <p className="text-gray-400 text-sm pl-6 leading-relaxed">
                        <span className="text-gray-600 font-bold mr-2">A:</span> {item.a}
                    </p>
                </div>
            ))}
        </div>
    </section>
);

const LandingPage: React.FC<LandingPageProps> = ({ onStart, onNavigate, hasSave, heroSlot }) => {
  const featuredGame = GAMES_CATALOG.find(g => g.id === 'galaxy_miner');

  // Inject Structured Data (Schema.org)
  useEffect(() => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      
      const structuredData = {
          "@context": "https://schema.org",
          "@graph": [
              {
                  "@type": "WebSite",
                  "name": "Space Clicker Game",
                  "url": "https://spaceclickergame.com",
                  "potentialAction": {
                      "@type": "SearchAction",
                      "target": "https://spaceclickergame.com?search={search_term_string}",
                      "query-input": "required name=search_term_string"
                  }
              },
              {
                  "@type": "Organization",
                  "name": "Void Expanse Games",
                  "url": "https://spaceclickergame.com",
                  "logo": "https://images.unsplash.com/photo-1614728263952-84ea256f9679?auto=format&fit=crop&q=80&w=200",
                  "sameAs": [
                      "https://twitter.com/spaceclicker",
                      "https://discord.gg/spaceclicker"
                  ]
              },
              {
                  "@type": "FAQPage",
                  "mainEntity": [
                      {
                          "@type": "Question",
                          "name": "Is this space clicker game free to play?",
                          "acceptedAnswer": {
                              "@type": "Answer",
                              "text": "Yes. Our Space Clicker Game is 100% free with no paywalls blocking your galactic progression."
                          }
                      },
                      {
                          "@type": "Question",
                          "name": "Does the game save my progress?",
                          "acceptedAnswer": {
                              "@type": "Answer",
                              "text": "The system auto-saves to your local browser storage every 10 seconds, ensuring your space clicker game empire is always safe."
                          }
                      }
                  ]
              }
          ]
      };

      script.text = JSON.stringify(structuredData);
      document.head.appendChild(script);

      return () => {
          document.head.removeChild(script);
      };
  }, []);

  return (
    <div className="w-full flex flex-col bg-space-900 overflow-x-hidden">
      
      {/* 1. BRAND HERO */}
      <BrandHero />
      
      {/* 2. STATS TICKER */}
      <LiveStatsTicker />

      {/* 3. ACTIVE TERMINAL */}
      <section id="console-anchor" className="w-full relative bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-space-800 via-space-950 to-black py-24 px-4 scroll-mt-16">
         
         <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-white tracking-widest flex items-center justify-center gap-3">
                <span className="w-12 h-px bg-neon-blue"></span>
                ACTIVE TERMINAL
                <span className="w-12 h-px bg-neon-blue"></span>
            </h2>
            <p className="text-gray-400 text-sm mt-2">Remote Link Established. You may now operate the drone mining fleet.</p>
         </div>

         <div className="relative z-10 w-full flex flex-col items-center">
             
             {heroSlot ? (
                // If heroSlot is provided externally, render it
                <div className="w-full animate-in fade-in zoom-in duration-700 px-4">
                    {heroSlot}
                </div>
             ) : (
                // Default Internal Hero
                <div className="w-full animate-in fade-in zoom-in duration-700 px-4">
                    <header className="max-w-7xl mx-auto flex justify-between items-end mb-2 px-2 opacity-80">
                         <div className="flex items-center gap-2">
                             <div className="w-1 h-4 bg-neon-blue"></div>
                             <h3 className="flex flex-col md:flex-row md:items-center gap-2 text-xs font-display font-bold tracking-[0.2em] text-white/70">
                                <span className="text-white">GALAXY MINER</span>
                                <span className="hidden md:inline text-neon-blue">//</span>
                                <span className="text-neon-blue">REMOTE ACCESS</span>
                             </h3>
                         </div>
                         <div className="text-[10px] font-mono text-neon-blue animate-pulse">Connection: STABLE (12ms)</div>
                    </header>

                    <div className="relative max-w-[1400px] mx-auto bg-black rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-white/10">
                        <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-neon-blue"></div>
                        <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-neon-blue"></div>
                        <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-neon-blue"></div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-neon-blue"></div>
                        
                        <div className="relative overflow-hidden rounded-lg">
                           <HolographicPreview onStart={() => onStart('galaxy_miner')} />
                           <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-[60] bg-[length:100%_2px,3px_100%] opacity-10"></div>
                        </div>
                    </div>
                    
                    <div className="max-w-7xl mx-auto mt-4 grid grid-cols-3 border-t border-white/10 pt-4 gap-4 text-center md:text-left">
                        <div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-widest">Current Operation</div>
                            <div className="text-sm font-display text-white">{featuredGame?.title}</div>
                        </div>
                        <div className="hidden md:block text-center">
                            <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">System Load</div>
                            <div className="h-1 w-32 bg-gray-800 mx-auto rounded overflow-hidden">
                                <div className="h-full bg-neon-green w-[45%] animate-pulse"></div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] text-gray-500 uppercase tracking-widest">Net Worth</div>
                            <div className="text-sm font-mono text-neon-blue">CALCULATING...</div>
                        </div>
                    </div>
                </div>
             )}
         </div>
      </section>

      {/* 4. GAME CATALOG (Holographic Grid) */}
      <section id="games-section" className="relative py-24 px-4 bg-black/40 backdrop-blur-md border-b border-white/5">
         <div className="max-w-7xl mx-auto relative z-10">
            <div className="flex items-center gap-4 mb-12">
               <div className="w-2 h-2 bg-neon-purple rounded-full shadow-[0_0_10px_purple]"></div>
               <h2 className="text-2xl font-display text-white tracking-widest">
                  SIMULATION DATABASE
               </h2>
               <div className="h-px flex-1 bg-gradient-to-r from-neon-purple/50 to-transparent"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {GAMES_CATALOG.filter(g => g.id !== 'galaxy_miner').map((game) => (
                  <a 
                    key={game.id}
                    href={`?view=game&id=${game.id}`}
                    className="group relative h-64 perspective-1000 cursor-pointer block"
                    onClick={(e) => {
                        e.preventDefault();
                        if (game.status === 'LIVE') onStart(game.id);
                        else alert("Simulation constructing...");
                    }}
                  >
                     <div className="relative h-full w-full bg-space-800/40 border border-white/10 hover:border-neon-blue/50 transition-all duration-300 rounded-xl overflow-hidden hover:shadow-[0_0_30px_rgba(0,243,255,0.1)] hover:-translate-y-1">
                        
                        {/* Card Header Color */}
                        <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${game.color}`}></div>
                        
                        <div className="p-6 h-full flex flex-col">
                           <div className="flex justify-between items-start mb-4">
                              <span className="text-4xl filter drop-shadow-lg">{game.icon}</span>
                              <span className={`text-[9px] px-2 py-1 rounded border ${game.status === 'LIVE' ? 'border-neon-green/30 text-neon-green bg-neon-green/5' : 'border-gray-600 text-gray-500'}`}>
                                 {game.status}
                              </span>
                           </div>
                           
                           <h3 className="text-xl font-bold font-display text-white mb-1 group-hover:text-neon-blue transition-colors">{game.title}</h3>
                           <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">{game.subtitle}</p>
                           
                           <p className="text-sm text-gray-400 line-clamp-2 mb-auto">{game.description}</p>
                           
                           <div className="flex items-center gap-2 text-xs font-bold text-neon-blue opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-10px] group-hover:translate-x-0 duration-300">
                               <span>INITIATE PROTOCOL</span>
                               <span>→</span>
                           </div>
                        </div>

                        {/* Tech BG Effect */}
                        <div className="absolute right-0 bottom-0 opacity-5 text-9xl font-display font-black pointer-events-none group-hover:opacity-10 transition-opacity">
                            {game.id.slice(0, 2).toUpperCase()}
                        </div>
                     </div>
                  </a>
               ))}
            </div>
         </div>
      </section>

      {/* 5. LORE & SEO TEXT */}
      <div className="w-full bg-space-950 py-24 px-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-neon-purple/5 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-neon-blue/5 rounded-full blur-[80px] pointer-events-none"></div>

        <div className="max-w-6xl mx-auto space-y-24 relative z-10">
            <WhyChooseUs />
            <HowToPlay />
            <section>
                <div className="flex items-center gap-4 mb-8">
                     <h2 className="text-xl font-display font-bold text-white tracking-widest">GALACTIC FEDERATION</h2>
                     <div className="h-px flex-1 bg-white/10"></div>
                </div>
                <CommunitySection />
            </section>
            <TacticalDatabank />
            <NewsletterSection />
            <GalacticArchives />

            {/* Bottom CTA */}
            <section className="relative rounded-3xl overflow-hidden border border-neon-blue/30 mt-12">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-900/40 to-purple-900/40 backdrop-blur-sm"></div>
                <div className="relative z-10 p-12 text-center">
                    <h2 className="text-3xl font-display font-black text-white mb-4">READY TO ASCEND?</h2>
                    <p className="text-gray-300 mb-8 max-w-xl mx-auto">The Galactic Core awaits. Your first mining laser is charged and ready.</p>
                    <button 
                        onClick={() => {
                            const el = document.getElementById('console-anchor');
                            if(el) el.scrollIntoView({behavior: 'smooth'});
                        }}
                        className="px-8 py-3 bg-white text-black font-bold rounded hover:bg-neon-blue transition-colors shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                    >
                        RETURN TO CONSOLE
                    </button>
                </div>
            </section>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
