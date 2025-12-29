
import React from 'react';

interface LogoProps {
  className?: string;
  withText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = "w-8 h-8", withText = false }) => {
  return (
    <div className="flex items-center gap-3 select-none">
      <div className={`relative flex items-center justify-center ${className}`}>
        <svg 
          viewBox="0 0 100 100" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg" 
          className="w-full h-full drop-shadow-[0_0_10px_rgba(0,243,255,0.6)]"
        >
          <defs>
            <linearGradient id="planetGrad" x1="10" y1="10" x2="90" y2="90">
              <stop offset="0%" stopColor="#00f3ff" />
              <stop offset="50%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#1e3a8a" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          
          {/* Planet Body */}
          <circle cx="50" cy="50" r="35" fill="url(#planetGrad)" />
          
          {/* Shadow/Crater Detail */}
          <circle cx="65" cy="35" r="5" fill="rgba(0,0,0,0.2)" />
          <circle cx="35" cy="65" r="8" fill="rgba(0,0,0,0.1)" />

          {/* Orbital Ring (Back) */}
          <path 
            d="M15 65 Q 50 85 85 65" 
            stroke="white" 
            strokeWidth="4" 
            strokeLinecap="round" 
            fill="none" 
            opacity="0.3"
            transform="rotate(-30 50 50)"
          />
          
          {/* Orbital Ring (Front) */}
          <path 
            d="M85 65 Q 50 45 15 65" 
            stroke="white" 
            strokeWidth="4" 
            strokeLinecap="round" 
            fill="none" 
            transform="rotate(-30 50 50)"
          />
          
          {/* Shine */}
          <circle cx="35" cy="35" r="3" fill="white" opacity="0.8" />
        </svg>
      </div>
      
      {withText && (
        <div className="flex flex-col">
            <span className="font-display font-bold text-lg tracking-widest leading-none text-white group-hover:text-neon-blue transition-colors">SPACE CLICKER</span>
            <span className="text-[9px] text-gray-400 tracking-[0.2em] font-mono">VOID UNIVERSE</span>
        </div>
      )}
    </div>
  );
};
