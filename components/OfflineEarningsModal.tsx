import React from 'react';
import { formatNumber } from '../utils';

interface OfflineEarningsModalProps {
  isOpen: boolean;
  awayTimeSeconds: number;
  earnedStardust: number;
  productionRate: number;
  onClaim: () => void;
}

export const OfflineEarningsModal: React.FC<OfflineEarningsModalProps> = ({
  isOpen,
  awayTimeSeconds,
  earnedStardust,
  productionRate,
  onClaim,
}) => {
  if (!isOpen || earnedStardust <= 0) return null;

  // Format away time into readable string (e.g. 2h 45m 12s)
  const formatDuration = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const seconds = Math.floor(secs % 60);

    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0 || hours > 0) parts.push(`${minutes}m`);
    parts.push(`${seconds}s`);
    return parts.join(' ');
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in zoom-in-95 duration-300">
      <div className="relative bg-gradient-to-b from-space-800 to-space-950 border-2 border-yellow-500/60 w-full max-w-lg rounded-3xl p-6 md:p-8 text-center shadow-[0_0_80px_rgba(234,179,8,0.25)] overflow-hidden">
        
        {/* Glow ambient background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-yellow-500/20 blur-3xl rounded-full pointer-events-none" />
        
        {/* Animated Badge */}
        <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/40 px-3 py-1 rounded-full text-yellow-400 font-mono text-xs mb-4 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-yellow-400 animate-ping" />
          AUTONOMOUS MINING LOG
        </div>

        {/* Title */}
        <h2 className="text-2xl md:text-3xl font-display font-black text-white tracking-widest uppercase mb-1">
          Welcome Back, Commander!
        </h2>
        <p className="text-xs font-mono text-gray-400 mb-6">
          Your drone fleet operated autonomously while your communications were offline.
        </p>

        {/* Earnings Card */}
        <div className="bg-black/60 border border-white/10 rounded-2xl p-5 mb-6 backdrop-blur-sm space-y-4">
          <div>
            <div className="text-[11px] font-mono text-gray-400 uppercase tracking-wider mb-1">
              Time Spent in Deep Space
            </div>
            <div className="text-xl font-mono font-bold text-white">
              {formatDuration(awayTimeSeconds)}
            </div>
          </div>

          <div className="border-t border-white/10 pt-4">
            <div className="text-[11px] font-mono text-yellow-500 uppercase tracking-wider mb-1">
              Automated Harvest
            </div>
            <div className="text-4xl md:text-5xl font-black font-display text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 drop-shadow-[0_0_20px_rgba(251,191,36,0.6)]">
              +{formatNumber(earnedStardust)} <span className="text-2xl text-yellow-400">SD</span>
            </div>
          </div>

          <div className="text-[11px] font-mono text-neon-blue bg-neon-blue/10 py-1.5 px-3 rounded-lg border border-neon-blue/20">
            Autonomous Fleet Rate: +{formatNumber(productionRate)}/s
          </div>
        </div>

        {/* Claim Button */}
        <button
          onClick={onClaim}
          className="w-full py-4 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-black font-display font-black text-lg rounded-2xl shadow-[0_0_30px_rgba(234,179,8,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all tracking-wider flex items-center justify-center gap-2"
        >
          <span>⚡</span>
          <span>CLAIM STARDUST HARVEST</span>
        </button>
      </div>
    </div>
  );
};

export default OfflineEarningsModal;
