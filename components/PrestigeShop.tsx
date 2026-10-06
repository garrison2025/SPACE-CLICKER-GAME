import React, { useEffect } from 'react';
import { PrestigeUpgrade } from '../types';
import { PRESTIGE_UPGRADES } from '../constants';
import { formatNumber } from '../utils';
import { trapDialogFocus } from '../utils/dialogFocus';

interface PrestigeShopProps {
  darkMatter: number;
  upgrades: { [id: string]: number };
  prestigeGain: number;
  canPrestige: boolean;
  thresholdLabel: string;
  onPrestige: () => void;
  onBuy: (id: string) => void;
  onClose: () => void;
}

const PrestigeShop: React.FC<PrestigeShopProps> = ({ darkMatter, upgrades, prestigeGain, canPrestige, thresholdLabel, onPrestige, onBuy, onClose }) => {
  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    return () => previousFocus?.focus();
  }, []);

  return (
    <div className="safe-screen-overlay fixed inset-0 z-[70] flex items-center justify-center bg-black/90 md:backdrop-blur-md animate-in fade-in">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="prestige-shop-title"
        tabIndex={-1}
        autoFocus
        onKeyDown={trapDialogFocus}
        className="bg-space-800 w-full max-w-4xl max-h-full rounded-2xl border border-neon-purple shadow-[0_0_50px_rgba(188,19,254,0.2)] flex flex-col overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-neon-purple"
      >
        
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-space-600 flex justify-between items-center gap-3 bg-space-900">
          <div>
             <h2 id="prestige-shop-title" className="text-2xl sm:text-3xl font-display text-neon-purple">VOID TECHNOLOGY</h2>
             <p className="text-gray-400 text-sm">Spend Dark Matter to warp reality.</p>
          </div>
          <div className="text-right">
             <div className="text-lg sm:text-2xl font-bold text-white whitespace-nowrap">{formatNumber(darkMatter)} <span className="text-neon-purple text-sm">DM</span></div>
          </div>
        </div>

        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-space-600 bg-neon-purple/5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-white font-display text-xl">GALACTIC RESET</h3>
              <p className="text-sm text-gray-400 mt-1">
                Reach {thresholdLabel} Stardust, then reset Stardust and standard upgrades for permanent Dark Matter.
              </p>
            </div>
            <button
              type="button"
              disabled={!canPrestige}
              onClick={onPrestige}
              className="px-5 py-3 rounded font-bold bg-neon-purple text-black disabled:bg-space-700 disabled:text-gray-500 disabled:cursor-not-allowed"
            >
              {canPrestige ? `PRESTIGE +${prestigeGain} DM` : 'PRESTIGE LOCKED'}
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PRESTIGE_UPGRADES.map(u => {
             const currentLevel = upgrades[u.id] || 0;
             const isMaxed = u.maxLevel !== -1 && currentLevel >= u.maxLevel;
             const cost = Math.floor(u.cost * Math.pow(1.5, currentLevel));
             const canAfford = darkMatter >= cost;

             return (
               <div key={u.id} className="bg-space-900/50 border border-space-600 p-4 rounded-lg hover:border-neon-purple transition-all group relative overflow-hidden">
                  <div className="relative z-10">
                    <div className="flex justify-between mb-2">
                        <h3 className="font-bold text-lg">{u.name}</h3>
                        <span className="text-xs text-gray-500 bg-space-800 px-2 py-1 rounded">Lvl {currentLevel} {u.maxLevel > 0 ? `/ ${u.maxLevel}` : ''}</span>
                    </div>
                    <p className="text-sm text-gray-400 mb-4 h-10">{u.description}</p>
                    <div className="text-neon-purple text-xs font-mono mb-4">
                        Current: {u.effectDescription(currentLevel)}
                        {!isMaxed && <span className="block text-gray-500">Next: {u.effectDescription(currentLevel + 1)}</span>}
                    </div>
                    
                    <button
                        type="button"
                        onClick={() => !isMaxed && canAfford && onBuy(u.id)}
                        disabled={isMaxed || !canAfford}
                        className={`w-full py-2 rounded font-bold text-sm transition-all ${
                            isMaxed ? 'bg-gray-700 text-gray-400 cursor-not-allowed' :
                            canAfford ? 'bg-neon-purple text-black hover:bg-white' : 
                            'bg-space-700 text-gray-500 cursor-not-allowed'
                        }`}
                    >
                        {isMaxed ? 'MAXED' : `Research (${formatNumber(cost)} DM)`}
                    </button>
                  </div>
               </div>
             )
          })}
        </div>

        <div className="p-4 border-t border-space-600 bg-space-900 text-center">
            <button type="button" onClick={onClose} className="min-h-11 px-4 text-gray-400 hover:text-white">CLOSE TERMINAL</button>
        </div>

      </div>
    </div>
  );
};

export default PrestigeShop;