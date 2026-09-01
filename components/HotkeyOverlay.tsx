import React, { useState } from 'react';

interface HotkeyOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
}

export const HotkeyOverlay: React.FC<HotkeyOverlayProps> = ({ isOpen, onClose, onToggle }) => {
  const HOTKEYS = [
    { key: 'SPACE', desc: 'Pulse Mining Laser (Manual Tap)', color: 'border-neon-blue text-neon-blue' },
    { key: '1 - 8', desc: 'Quick-Buy Upgrades (Tier 1 to 8)', color: 'border-yellow-400 text-yellow-400' },
    { key: 'P', desc: 'Toggle Dark Matter Prestige Chamber', color: 'border-purple-400 text-purple-400' },
    { key: 'S', desc: 'Open Fleet Telemetry & Save Backup', color: 'border-neon-green text-neon-green' },
    { key: 'M', desc: 'Toggle Audio Synthesis Sound FX', color: 'border-pink-400 text-pink-400' },
    { key: 'H or ?', desc: 'Toggle this Hotkeys Reference', color: 'border-gray-400 text-gray-300' },
  ];

  return (
    <>
      {/* Floating Trigger Button (Bottom Left) */}
      <button
        onClick={onToggle}
        className="fixed bottom-4 left-4 z-40 bg-space-900/80 hover:bg-space-800 border border-white/20 hover:border-neon-blue text-gray-400 hover:text-white px-2.5 py-1.5 rounded-lg text-xs font-mono backdrop-blur-sm transition-all shadow-lg flex items-center gap-1.5 group select-none"
        title="Keyboard Shortcuts"
      >
        <span className="text-sm">⌨️</span>
        <span className="hidden sm:inline font-bold">HOTKEYS</span>
        <span className="bg-black/60 px-1 py-0.2 rounded text-[10px] text-neon-blue border border-white/10 group-hover:border-neon-blue">
          [H]
        </span>
      </button>

      {/* Modal View */}
      {isOpen && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-space-850 border border-white/20 w-full max-w-md rounded-2xl p-6 shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-xl">⌨️</span>
                <h3 className="font-display font-bold text-white text-base tracking-wider uppercase">
                  Keyboard Pilot Controls
                </h3>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white text-sm bg-white/5 hover:bg-white/10 px-2 py-1 rounded transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs font-mono mb-6">
              {HOTKEYS.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-space-900/60 border border-white/5 hover:border-white/20 transition-colors"
                >
                  <span className="text-gray-300">{item.desc}</span>
                  <span
                    className={`font-bold font-mono px-2 py-1 rounded bg-black/80 border ${item.color} shadow-sm text-center min-w-[50px]`}
                  >
                    {item.key}
                  </span>
                </div>
              ))}
            </div>

            <div className="text-center text-[10px] font-mono text-gray-500">
              PRO TIP: HOLD SPACEBAR TO RAPID-FIRE MINE RESOURCES
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HotkeyOverlay;
