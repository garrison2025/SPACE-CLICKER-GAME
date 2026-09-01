import React, { useState } from 'react';
import { Upgrade } from '../types';
import { formatNumber } from '../utils';

interface UpgradeShopProps {
  upgrades: Upgrade[];
  currency: number;
  onBuy: (id: string, amount: number) => void;
}

type BuyAmount = 1 | 10 | 100 | 'MAX';

const UpgradeShop: React.FC<UpgradeShopProps> = ({ upgrades, currency, onBuy }) => {
  const [buyAmount, setBuyAmount] = useState<BuyAmount>(1);

  // Helper to calculate cost for N upgrades
  const calculateCost = (upgrade: Upgrade, n: number): number => {
    let total = 0;
    let currentBase = upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.count);
    
    for (let i = 0; i < n; i++) {
        total += Math.floor(currentBase);
        currentBase *= upgrade.costMultiplier;
    }
    return total;
  };

  const calculateMax = (upgrade: Upgrade): { count: number, cost: number } => {
    let total = 0;
    let count = 0;
    let currentBase = upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.count);
    
    // Safety break at 500 to prevent freezes
    while (total + currentBase <= currency && count < 500) {
        total += Math.floor(currentBase);
        currentBase *= upgrade.costMultiplier;
        count++;
    }
    return { count, cost: total };
  };

  const getNextMilestone = (current: number) => {
      if (current < 25) return 25;
      if (current < 50) return 50;
      if (current < 100) return 100;
      if (current < 200) return 200;
      return 500;
  };

  return (
    <div className="flex flex-col h-full bg-space-800/90 border-l border-space-700 backdrop-blur-xl overflow-hidden w-full md:w-96 shadow-2xl">
      <div className="p-4 border-b border-space-700 shrink-0 bg-space-900/50">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-display text-neon-blue flex items-center gap-2">
              <span>FABRICATOR</span>
              <span className="text-[10px] font-mono text-neon-green bg-neon-green/10 border border-neon-green/30 px-1.5 py-0.5 rounded">V.3.1</span>
            </h2>
            <div className="text-[10px] font-mono text-gray-500">
              HOTKEYS: [1-8]
            </div>
          </div>
          
          {/* Buy Amount Toggle */}
          <div className="grid grid-cols-4 gap-1 bg-space-900 rounded-lg p-1 border border-space-600">
             {[1, 10, 100, 'MAX'].map((amt) => (
                 <button
                    key={amt}
                    onClick={() => setBuyAmount(amt as BuyAmount)}
                    className={`text-xs font-bold font-mono py-1 rounded transition-all ${
                      buyAmount === amt 
                        ? 'bg-neon-blue text-black shadow-[0_0_10px_rgba(0,243,255,0.4)]' 
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                 >
                    {amt === 'MAX' ? 'MAX' : `x${amt}`}
                 </button>
             ))}
          </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-20 custom-scrollbar">
        {upgrades.map((upgrade, index) => {
          let buyCount = 0;
          let cost = 0;

          if (buyAmount === 'MAX') {
              const res = calculateMax(upgrade);
              buyCount = res.count;
              cost = res.cost;
          } else {
              buyCount = buyAmount;
              cost = calculateCost(upgrade, buyCount);
          }

          // If MAX returns 0, show cost for 1 but disable it (visual feedback)
          if (buyAmount === 'MAX' && buyCount === 0) {
              buyCount = 1;
              cost = calculateCost(upgrade, 1);
          }

          const canAfford = currency >= cost;
          const nextMilestone = getNextMilestone(upgrade.count);
          const progressToMilestone = Math.min(100, (upgrade.count / nextMilestone) * 100);

          return (
            <div 
              key={upgrade.id}
              className={`relative overflow-hidden p-3.5 rounded-xl border transition-all duration-200 group select-none ${
                canAfford 
                  ? 'border-space-600 bg-space-700/40 hover:bg-space-700 hover:border-neon-blue cursor-pointer active:scale-[0.98]' 
                  : 'border-space-800 bg-space-900/40 opacity-70 cursor-not-allowed grayscale-[0.8]'
              }`}
              onClick={() => canAfford && onBuy(upgrade.id, buyCount)}
            >
              {/* Cost Progress Hint (Background) */}
              <div 
                className="absolute bottom-0 left-0 h-full bg-gradient-to-r from-neon-blue/10 to-transparent transition-all duration-500" 
                style={{ width: canAfford ? '0%' : `${Math.min(100, (currency / cost) * 100)}%` }}
              />

              <div className="flex justify-between items-start mb-2 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-space-800 flex items-center justify-center text-2xl border border-space-600 group-hover:border-neon-blue transition-colors relative shadow-inner">
                    {upgrade.icon}
                    {/* Level Badge */}
                    <div className="absolute -top-2 -right-2 bg-black border border-gray-600 text-[8px] px-1.5 py-0.5 rounded text-white font-mono font-bold">
                        {upgrade.count}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono text-gray-400 bg-black/60 px-1 rounded border border-white/5">
                        [{index + 1}]
                      </span>
                      <h3 className="font-bold text-white leading-none tracking-wide text-sm">{upgrade.name}</h3>
                    </div>
                    <p className="text-[10px] text-neon-blue uppercase tracking-wider mt-1">{upgrade.type === 'manual' ? 'Click Efficiency' : 'Auto-Miner'}</p>
                  </div>
                </div>
              </div>

              {/* Milestone Progress Bar */}
              <div className="mb-2 relative h-1.5 w-full bg-space-900 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-yellow-500 to-amber-300 transition-all duration-300"
                    style={{ width: `${progressToMilestone}%` }}
                  ></div>
              </div>
              <div className="flex justify-between text-[9px] text-gray-500 mb-2 font-mono">
                  <span>LEVEL {upgrade.count}</span>
                  <span className={progressToMilestone > 80 ? 'text-yellow-400 font-bold animate-pulse' : ''}>NEXT BOOST: LVL {nextMilestone} (x2)</span>
              </div>
              
              <div className="flex justify-between items-center text-xs relative z-10">
                <div className={`flex items-center gap-1 font-mono font-bold ${canAfford ? 'text-neon-green' : 'text-red-400'}`}>
                   <span>⚡</span>
                   {formatNumber(cost)}
                   {buyAmount !== 1 && <span className="text-[9px] ml-1 opacity-70">({buyCount}x)</span>}
                </div>
                <div className="text-neon-blue text-[11px] font-mono font-bold bg-neon-blue/10 border border-neon-blue/20 px-2 py-0.5 rounded">
                  +{formatNumber(upgrade.baseProduction * buyCount)}/s
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UpgradeShop;