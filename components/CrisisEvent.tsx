import React, { useState, useEffect } from 'react';

interface CrisisEventProps {
  onResolve: (success: boolean) => void;
}

const CrisisEvent: React.FC<CrisisEventProps> = ({ onResolve }) => {
  const [health, setHealth] = useState(10);
  const [timeLeft, setTimeLeft] = useState(5.0);
  const [isActive, setIsActive] = useState(false);

  // Randomly start a crisis
  useEffect(() => {
    // Spawns between 2 and 8 minutes
    const scheduleNext = () => Math.random() * 360000 + 120000;
    
    let timer: ReturnType<typeof setTimeout>;
    
    const startCrisis = () => {
       setIsActive(true);
       setHealth(10); 
       setTimeLeft(5.0);
    };

    const loop = () => {
        timer = setTimeout(() => {
            startCrisis();
        }, scheduleNext());
    };

    loop();
    return () => clearTimeout(timer);
  }, [isActive]);

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0.1) {
          clearInterval(interval);
          handleFail();
          return 0;
        }
        return prev - 0.1;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isActive]);

  const handleFail = () => {
    setIsActive(false);
    onResolve(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (health <= 1) {
      setIsActive(false);
      onResolve(true);
    } else {
      setHealth(prev => prev - 1);
      const target = e.currentTarget as HTMLElement;
      target.animate([
        { transform: 'translate(0,0) scale(1)' },
        { transform: 'translate(-5px, 5px) scale(0.9)' },
        { transform: 'translate(5px, -5px) scale(1.1)' },
        { transform: 'translate(0,0) scale(1)' }
      ], { duration: 100 });
    }
  };

  if (!isActive) return null;

  return (
    <>
      {/* Red Alert Overlay - Scoped to container via absolute */}
      <div className="absolute inset-0 pointer-events-none z-[80] animate-pulse bg-red-900/20 border-[4px] border-red-600/50 mix-blend-overlay"></div>
      
      {/* Warning Text */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 text-red-500 font-display font-black text-xl z-[90] animate-bounce text-center whitespace-nowrap">
         ⚠️ IMPACT IMMINENT ⚠️
         <div className="text-white text-sm font-mono mt-1">{timeLeft.toFixed(1)}s</div>
      </div>

      {/* The Meteor */}
      <div 
        onClick={handleClick}
        className="absolute z-[90] cursor-crosshair w-24 h-24 md:w-32 md:h-32 drop-shadow-2xl animate-spin-slow"
        style={{
            top: '50%',
            left: '50%',
            marginTop: '-4rem',
            marginLeft: '-4rem',
            animationDuration: '3s'
        }}
      >
        <div className="w-full h-full bg-stone-800 rounded-full border-4 border-red-500 relative overflow-hidden shadow-[0_0_50px_rgba(220,38,38,0.8)]">
            <div className="absolute inset-0 opacity-50 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
            <div className="absolute top-2 left-4 w-4 h-4 bg-black/40 rounded-full"></div>
            
            {/* Health Bar */}
            <div className="absolute bottom-0 left-0 h-full bg-red-600/50 transition-all duration-100" style={{ width: `${(health / 10) * 100}%` }}></div>
            
            <div className="absolute inset-0 flex items-center justify-center text-3xl font-black text-white pointer-events-none">
                {health}
            </div>
        </div>
      </div>
    </>
  );
};

export default CrisisEvent;