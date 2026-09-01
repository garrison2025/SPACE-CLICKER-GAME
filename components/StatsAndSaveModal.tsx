import React, { useState } from 'react';
import { formatNumber } from '../utils';
import { ResourceType, Upgrade, Planet } from '../types';

interface StatsAndSaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  resources: { [key in ResourceType]: number };
  lifetimeEarnings: number;
  totalClicks: number;
  totalCrits: number;
  cometsCaught: number;
  crisesResolved: number;
  productionRate: number;
  clickPower: number;
  currentPlanet: Planet;
  upgrades: { [id: string]: Upgrade };
  prestigeUpgrades: { [id: string]: number };
  hapticEnabled: boolean;
  onToggleHaptic: () => void;
  screenShakeEnabled: boolean;
  onToggleScreenShake: () => void;
  onImportSave: (saveData: any) => void;
  onResetGame: () => void;
}

export const StatsAndSaveModal: React.FC<StatsAndSaveModalProps> = ({
  isOpen,
  onClose,
  resources,
  lifetimeEarnings,
  totalClicks,
  totalCrits,
  cometsCaught,
  crisesResolved,
  productionRate,
  clickPower,
  currentPlanet,
  upgrades,
  prestigeUpgrades,
  hapticEnabled,
  onToggleHaptic,
  screenShakeEnabled,
  onToggleScreenShake,
  onImportSave,
  onResetGame,
}) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'save' | 'settings'>('stats');
  const [importString, setImportString] = useState('');
  const [copied, setCopied] = useState(false);
  const [importError, setImportError] = useState('');

  if (!isOpen) return null;

  // Calculate export string
  const generateExportString = () => {
    try {
      const saveData = {
        resources,
        lifetimeEarnings,
        totalClicks,
        totalCrits,
        cometsCaught,
        crisesResolved,
        upgrades,
        prestigeUpgrades,
        lastSaveTime: Date.now(),
        version: '3.1.0'
      };
      return btoa(JSON.stringify(saveData));
    } catch {
      return '';
    }
  };

  const handleCopySave = () => {
    const code = generateExportString();
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplyImport = () => {
    setImportError('');
    if (!importString.trim()) {
      setImportError('Please enter a valid save string.');
      return;
    }

    try {
      const decoded = atob(importString.trim());
      const parsed = JSON.parse(decoded);
      if (!parsed.resources && !parsed.upgrades) {
        throw new Error('Corrupted format');
      }
      onImportSave(parsed);
      onClose();
    } catch (err) {
      setImportError('Invalid save string! Please check your code.');
    }
  };

  const critRatePercent = totalClicks > 0 ? ((totalCrits / totalClicks) * 100).toFixed(1) : '0.0';
  const totalBuildingLevels = Object.values(upgrades).reduce((sum, u) => sum + u.count, 0);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
      <div className="bg-space-850 border border-neon-blue/40 w-full max-w-2xl rounded-2xl shadow-[0_0_50px_rgba(0,243,255,0.15)] overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex justify-between items-center bg-space-900">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📊</span>
            <div>
              <h2 className="font-display font-black text-lg text-white tracking-widest">
                COMMAND TELEMETRY & BACKUP
              </h2>
              <p className="text-[11px] font-mono text-neon-blue">
                COSMIC MINER FLEET DIAGNOSTICS
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/20 text-gray-400 hover:text-white flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 bg-space-900/60 p-2 gap-2">
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex-1 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
              activeTab === 'stats' 
                ? 'bg-neon-blue text-black shadow-[0_0_15px_rgba(0,243,255,0.3)]' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            📈 FLEET STATS
          </button>
          <button
            onClick={() => setActiveTab('save')}
            className={`flex-1 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
              activeTab === 'save' 
                ? 'bg-neon-blue text-black shadow-[0_0_15px_rgba(0,243,255,0.3)]' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            💾 CLOUD SAVE / RESTORE
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
              activeTab === 'settings' 
                ? 'bg-neon-blue text-black shadow-[0_0_15px_rgba(0,243,255,0.3)]' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            ⚙️ PREFERENCES
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar text-sm">
          
          {/* STATS TAB */}
          {activeTab === 'stats' && (
            <div className="space-y-6">
              {/* Primary Highlights Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-space-900/80 border border-white/10 p-3 rounded-xl">
                  <div className="text-[10px] text-gray-400 font-mono">LIFETIME STARDUST</div>
                  <div className="text-lg font-mono font-black text-yellow-400 mt-0.5">
                    {formatNumber(lifetimeEarnings)}
                  </div>
                </div>
                <div className="bg-space-900/80 border border-white/10 p-3 rounded-xl">
                  <div className="text-[10px] text-gray-400 font-mono">CURRENT FLEET SD/S</div>
                  <div className="text-lg font-mono font-black text-neon-green mt-0.5">
                    +{formatNumber(productionRate)}/s
                  </div>
                </div>
                <div className="bg-space-900/80 border border-white/10 p-3 rounded-xl">
                  <div className="text-[10px] text-gray-400 font-mono">DARK MATTER HELD</div>
                  <div className="text-lg font-mono font-black text-neon-purple mt-0.5">
                    {formatNumber(resources[ResourceType.DarkMatter])} DM
                  </div>
                </div>
                <div className="bg-space-900/80 border border-white/10 p-3 rounded-xl">
                  <div className="text-[10px] text-gray-400 font-mono">CLICK LASER POWER</div>
                  <div className="text-lg font-mono font-black text-neon-blue mt-0.5">
                    {formatNumber(clickPower)}/tap
                  </div>
                </div>
              </div>

              {/* Combat & Interaction Analytics */}
              <div className="bg-space-900/50 border border-white/10 rounded-xl p-4">
                <h3 className="text-xs font-mono font-bold text-gray-300 uppercase tracking-wider mb-3">
                  Sector Activity Log
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2.5 text-xs font-mono">
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-gray-400">Total Manual Pulses:</span>
                    <span className="text-white font-bold">{totalClicks.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1 sm:pl-4">
                    <span className="text-gray-400">Critical Flux Overdrives:</span>
                    <span className="text-amber-400 font-bold">{totalCrits.toLocaleString()} ({critRatePercent}%)</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-gray-400">Golden Comets Captured:</span>
                    <span className="text-neon-blue font-bold">{cometsCaught.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1 sm:pl-4">
                    <span className="text-gray-400">Solar Storms Repelled:</span>
                    <span className="text-neon-green font-bold">{crisesResolved.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-gray-400">Total Installed Upgrades:</span>
                    <span className="text-white font-bold">{totalBuildingLevels.toLocaleString()} levels</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1 sm:pl-4">
                    <span className="text-gray-400">Active Sector Target:</span>
                    <span className="text-cyan-400 font-bold">{currentPlanet.name} (x{currentPlanet.productionMultiplier})</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SAVE / RESTORE TAB */}
          {activeTab === 'save' && (
            <div className="space-y-6">
              {/* Export Box */}
              <div className="bg-space-900/80 border border-white/10 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-white text-xs font-mono uppercase">
                      Export Encrypted Save String
                    </h3>
                    <p className="text-[11px] text-gray-400">
                      Copy this secure string to transfer your empire to another device or browser.
                    </p>
                  </div>
                  <button
                    onClick={handleCopySave}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                      copied 
                        ? 'bg-neon-green text-black' 
                        : 'bg-neon-blue text-black hover:bg-white'
                    }`}
                  >
                    {copied ? 'COPIED! ✓' : 'COPY SAVE CODE'}
                  </button>
                </div>
                <textarea
                  readOnly
                  value={generateExportString()}
                  className="w-full h-20 bg-black/60 border border-white/10 rounded-lg p-2.5 text-[10px] font-mono text-gray-300 resize-none focus:outline-none focus:border-neon-blue"
                />
              </div>

              {/* Import Box */}
              <div className="bg-space-900/80 border border-white/10 rounded-xl p-4 space-y-3">
                <div>
                  <h3 className="font-bold text-white text-xs font-mono uppercase">
                    Import Save String
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    Paste your previously exported code string below to restore progress.
                  </p>
                </div>
                <textarea
                  value={importString}
                  onChange={(e) => setImportString(e.target.value)}
                  placeholder="Paste your base64 save string here..."
                  className="w-full h-20 bg-black/60 border border-white/10 rounded-lg p-2.5 text-[10px] font-mono text-white resize-none focus:outline-none focus:border-neon-blue"
                />
                {importError && (
                  <p className="text-xs font-mono text-red-400 animate-pulse">{importError}</p>
                )}
                <button
                  onClick={handleApplyImport}
                  className="w-full py-2.5 bg-neon-green text-black font-mono font-bold rounded-lg text-xs hover:bg-emerald-400 transition-colors shadow-md"
                >
                  RESTORE SAVED STATE
                </button>
              </div>
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="space-y-4">
              <div className="bg-space-900/80 border border-white/10 rounded-xl p-4 space-y-4">
                {/* Haptic Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white text-sm">HAPTIC VIBRATION FEEDBACK</div>
                    <div className="text-xs text-gray-400">Provide subtle vibration pulses on mobile devices when mining or scoring crits.</div>
                  </div>
                  <button
                    onClick={onToggleHaptic}
                    className={`w-12 h-6 rounded-full relative transition-colors ${
                      hapticEnabled ? 'bg-neon-blue' : 'bg-gray-700'
                    }`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                      hapticEnabled ? 'left-7' : 'left-1'
                    }`} />
                  </button>
                </div>

                {/* Screen Shake Toggle */}
                <div className="flex items-center justify-between border-t border-white/10 pt-4">
                  <div>
                    <div className="font-bold text-white text-sm">IMPACT SCREEN SHAKE</div>
                    <div className="text-xs text-gray-400">Dynamic physics shake during Flux state and critical strikes. (Disable if prone to motion sickness)</div>
                  </div>
                  <button
                    onClick={onToggleScreenShake}
                    className={`w-12 h-6 rounded-full relative transition-colors ${
                      screenShakeEnabled ? 'bg-neon-blue' : 'bg-gray-700'
                    }`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                      screenShakeEnabled ? 'left-7' : 'left-1'
                    }`} />
                  </button>
                </div>
              </div>

              {/* Reset Protocol */}
              <div className="bg-red-950/20 border border-red-500/30 rounded-xl p-4 space-y-3">
                <div className="font-bold text-red-400 text-sm">EMERGENCY DATA PURGE</div>
                <p className="text-xs text-gray-400">
                  Wipes all game progress and returns to fresh state. Make sure you back up your save code first!
                </p>
                <button
                  onClick={onResetGame}
                  className="w-full py-2.5 border border-red-500 text-red-400 hover:bg-red-500 hover:text-white font-mono font-bold rounded-lg text-xs transition-colors"
                >
                  PURGE ALL LOCAL FLEET DATA
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer info */}
        <div className="p-4 bg-space-900 border-t border-white/10 text-center text-[10px] font-mono text-gray-500">
          HOTKEY SHORTCUT: PRESS <span className="text-neon-blue">[S]</span> TO OPEN STATS | <span className="text-neon-blue">[SPACE]</span> TO MINE
        </div>

      </div>
    </div>
  );
};

export default StatsAndSaveModal;
