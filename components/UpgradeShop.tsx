import React, { useState } from 'react';
import { Upgrade } from '../types';
import { formatNumber } from '../utils';

interface UpgradeShopProps {
  upgrades: Upgrade[];
  currency: number;
  onBuy: (id: string, amount: number) => void;
}

type BuyAmount = 1 | 10 | 'MAX';

const UpgradeShop: React.FC<UpgradeShopProps> = ({ upgrades, currency, onBuy }) => {
  const [buyAmount, setBuyAmount] = useState<BuyAmount>(1);

  // Helper to calculate cost for N upgrades
  // Formula for geometric series: Cost * (Multiplier^N - 1) / (Multiplier - 1)
  // However, since we track current cost step by step in the App state implicitly,
  // we need to calculate starting from current count.
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
    
    // Safety break at 100 to prevent freezes, though typically can afford less
    while (total + currentBase <= currency && count < 100) {
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
          <h2 className="text-2xl font-display text-neon-blue mb-3 flex items-center justify-between">
            <span>FABRICATOR</span>
            <span className="text-xs font-sans text-gray-500">V.2.1</span>
          </h2>
          
          {/* Buy Amount Toggle */}
          <div className="flex bg-space-900 rounded p-1 border border-space-600">
             {[1, 10, 'MAX'].map((amt) => (
                 <button
                    key={amt}
                    onClick={() => setBuyAmount(amt as BuyAmount)}
                    className={`flex-1 text-xs font-bold py-1 rounded transition-colors ${buyAmount === amt ? 'bg-neon-blue text-black' : 'text-gray-400 hover:text-white'}`}
                 >
                    {amt === 'MAX' ? 'MAX' : `x${amt}`}
                 </button>
             ))}
          </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-20 custom-scrollbar">
        {upgrades.map((upgrade) => {
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
              className={`relative overflow-hidden p-4 rounded-lg border transition-all duration-200 group select-none ${
                canAfford 
                  ? 'border-space-600 bg-space-700/40 hover:bg-space-700 hover:border-neon-blue cursor-pointer active:scale-[0.98]' 
                  : 'border-space-800 bg-space-900/40 opacity-70 cursor-not-allowed grayscale-[0.8]'
              }`}
              onClick={() => canAfford && onBuy(upgrade.id, buyCount)}
            >
              {/* Cost Progress Hint (Background) */}
              <div 
                className="absolute bottom-0 left-0 h-full bg-gradient-to-r from-neon-blue/5 to-transparent transition-all duration-500" 
                style={{ width: canAfford ? '0%' : `${Math.min(100, (currency / cost) * 100)}%` }}
              />

              <div className="flex justify-between items-start mb-2 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-space-800 flex items-center justify-center text-2xl border border-space-600 group-hover:border-neon-blue transition-colors relative">
                    {upgrade.icon}
                    {/* Milestone Badge */}
                    <div className="absolute -top-2 -right-2 bg-black border border-gray-600 text-[8px] px-1 rounded text-white font-mono">
                        {upgrade.count}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-white leading-none tracking-wide text-sm">{upgrade.name}</h3>
                    <p className="text-[10px] text-neon-blue uppercase tracking-wider mt-0.5">{upgrade.type === 'manual' ? 'Click Efficiency' : 'Auto-Miner'}</p>
                  </div>
                </div>
              </div>

              {/* Milestone Progress Bar */}
              <div className="mb-3 relative h-1.5 w-full bg-space-900 rounded-full overflow-hidden">
                  <div 
                    className="absolute top-0 left-0 h-full bg-yellow-500 transition-all duration-300"
                    style={{ width: `${progressToMilestone}%` }}
                  ></div>
              </div>
              <div className="flex justify-between text-[9px] text-gray-500 mb-2 font-mono">
                  <span>LEVEL {upgrade.count}</span>
                  <span className={progressToMilestone > 80 ? 'text-yellow-400 animate-pulse' : ''}>NEXT BOOST: LVL {nextMilestone} (x2)</span>
              </div>
              
              <div className="flex justify-between items-center text-sm relative z-10">
                <div className={`flex items-center gap-1 font-mono font-bold ${canAfford ? 'text-neon-green' : 'text-red-400'}`}>
                   <span>⚡</span>
                   {formatNumber(cost)}
                   {buyAmount !== 1 && <span className="text-[9px] ml-1 opacity-70">({buyCount}x)</span>}
                </div>
                <div className="text-neon-blue text-xs font-bold bg-neon-blue/10 px-2 py-1 rounded">
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