import React, { useEffect, useState } from 'react';

interface GoldenCometProps {
  onCatch: () => void;
}

const GoldenComet: React.FC<GoldenCometProps> = ({ onCatch }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: '20%', duration: '5s' });

  useEffect(() => {
    // Random spawn between 30s and 90s
    const scheduleNext = () => {
      const delay = Math.random() * 60000 + 30000; 
      return setTimeout(() => {
        spawnComet();
      }, delay);
    };

    let timer = scheduleNext();

    const spawnComet = () => {
      setPosition({
        top: `${Math.random() * 60 + 10}%`, // Keep within 10-70% height to avoid UI overlap
        duration: `${Math.random() * 2 + 3}s` 
      });
      setIsVisible(true);
    };

    return () => clearTimeout(timer);
  }, [isVisible]);

  const handleAnimationEnd = () => {
    setIsVisible(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsVisible(false);
    onCatch();
  };

  if (!isVisible) return null;

  return (
    <div
      onClick={handleClick}
      onAnimationEnd={handleAnimationEnd}
      className="absolute z-[40] cursor-pointer w-10 h-10 md:w-14 md:h-14"
      style={{
        top: position.top,
        left: '-100px', // Start off-screen relative to container
        animation: `flyAcross ${position.duration} linear forwards`
      }}
    >
      <style>{`
        @keyframes flyAcross {
          from { left: -100px; transform: rotate(0deg); }
          to { left: 110%; transform: rotate(360deg); }
        }
      `}</style>
      <div className="relative w-full h-full animate-pulse">
         {/* Comet Head */}
         <div className="absolute inset-0 bg-yellow-300 rounded-full blur-md shadow-[0_0_20px_rgba(253,224,71,1)]"></div>
         <div className="absolute inset-2 bg-white rounded-full"></div>
         {/* Tail */}
         <div className="absolute top-1/2 right-1/2 w-32 h-2 bg-gradient-to-l from-transparent to-yellow-500 blur-sm transform -translate-y-1/2 origin-right -rotate-12 opacity-80"></div>
      </div>
    </div>
  );
};

export default GoldenComet;