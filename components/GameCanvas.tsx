import React, { ReactNode, useRef } from 'react';

interface GameCanvasProps {
  children: ReactNode;
  title: string;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ children, title }) => {
  const containerRef = useRef<HTMLDivElement>(null);

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
       {/* Header */}
       <div className="mb-6 text-center">
          <h1 className="text-4xl md:text-5xl font-display font-black text-white tracking-tight drop-shadow-xl">
             {title}
          </h1>
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
             >
                <span>🖥️</span> FULLSCREEN
             </button>
             <button 
                onClick={handleRestart}
                className="flex items-center gap-2 px-4 py-2 bg-space-700 hover:bg-space-600 rounded text-xs font-bold transition-colors"
             >
                <span>🔄</span> RESTART
             </button>
          </div>
       </div>
    </section>
  );
};

export default GameCanvas;