import React from 'react';
import { PrestigeUpgrade } from '../types';
import { PRESTIGE_UPGRADES } from '../constants';
import { formatNumber } from '../utils';

interface PrestigeShopProps {
  darkMatter: number;
  upgrades: { [id: string]: number };
  onBuy: (id: string) => void;
  onClose: () => void;
}

const PrestigeShop: React.FC<PrestigeShopProps> = ({ darkMatter, upgrades, onBuy, onClose }) => {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in">
      <div className="bg-space-800 w-full max-w-4xl h-[80vh] rounded-2xl border border-neon-purple shadow-[0_0_50px_rgba(188,19,254,0.2)] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-space-600 flex justify-between items-center bg-space-900">
          <div>
             <h2 className="text-3xl font-display text-neon-purple">VOID TECHNOLOGY</h2>
             <p className="text-gray-400 text-sm">Spend Dark Matter to warp reality.</p>
          </div>
          <div className="text-right">
             <div className="text-2xl font-bold text-white">{formatNumber(darkMatter)} <span className="text-neon-purple text-sm">DM</span></div>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
            <button onClick={onClose} className="text-gray-400 hover:text-white">CLOSE TERMINAL</button>
        </div>

      </div>
    </div>
  );
};

export default PrestigeShop;