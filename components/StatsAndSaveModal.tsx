import React, { useEffect, useRef, useState } from 'react';
import { formatNumber } from '../utils';
import { ResourceType, Upgrade, Planet } from '../types';
import { trapDialogFocus, useDialogFocus } from '../utils/dialogFocus';
import { decodeBase64Utf8, encodeBase64Utf8 } from '../utils/base64Utf8';

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
  level: number;
  planetIndex: number;
  upgrades: { [id: string]: Upgrade };
  prestigeUpgrades: { [id: string]: number };
  hapticEnabled: boolean;
  onToggleHaptic: () => void;
  screenShakeEnabled: boolean;
  onToggleScreenShake: () => void;
  onImportSave: (saveData: any) => void;
  onResetGame: () => void;
}

const MAX_SAVE_IMPORT_SIZE = 100_000;

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
  level,
  planetIndex,
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
  const [backupNotice, setBackupNotice] = useState('');
  const copiedTimerRef = useRef<number>();

  useEffect(() => {
    return () => {
      if (copiedTimerRef.current !== undefined) {
        window.clearTimeout(copiedTimerRef.current);
      }
    };
  }, []);

  const dialogRef = useDialogFocus<HTMLDivElement>(isOpen);

  if (!isOpen) return null;

  // Calculate export string
  const generateExportString = () => {
    try {
      const compactUpgrades = Object.fromEntries(
        Object.entries(upgrades).map(([id, upgrade]) => [id, { count: upgrade.count }])
      );
      const saveData = {
        resources,
        lifetimeEarnings,
        totalClicks,
        totalCrits,
        cometsCaught,
        crisesResolved,
        level,
        planetIndex,
        upgrades: compactUpgrades,
        prestigeUpgrades,
        lastSaveTime: Date.now(),
        version: 3
      };
      return encodeBase64Utf8(JSON.stringify(saveData));
    } catch {
      return '';
    }
  };

  const handleCopySave = async () => {
    const code = generateExportString();
    if (!code) {
      setCopied(false);
      setBackupNotice('Could not create a backup code.');
      return;
    }

    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setBackupNotice('Backup code copied to the clipboard.');
      if (copiedTimerRef.current !== undefined) window.clearTimeout(copiedTimerRef.current);
      copiedTimerRef.current = window.setTimeout(() => {
        copiedTimerRef.current = undefined;
        setCopied(false);
      }, 2000);
    } catch {
      setCopied(false);
      setBackupNotice('Clipboard access was blocked. Select the backup code below and copy it manually.');
    }
  };

  const handleDownloadSave = () => {
    const code = generateExportString();
    if (!code) {
      setBackupNotice('Could not create a backup file.');
      return;
    }

    try {
      const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
      const href = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = href;
      link.download = `galaxy-miner-save-${new Date().toISOString().slice(0, 10)}.scg`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(href), 1000);
      setBackupNotice('Backup file downloaded.');
    } catch {
      setBackupNotice('Could not create a backup file.');
    }
  };

  const handleLoadImportFile = () => {
    const picker = document.createElement('input');
    picker.type = 'file';
    picker.accept = '.scg,.txt,text/plain';
    picker.onchange = async () => {
      const selected = picker.files?.[0];
      if (!selected) return;
      if (selected.size > MAX_SAVE_IMPORT_SIZE) {
        setImportError('Backup file is too large.');
        return;
      }

      try {
        const code = (await selected.text()).trim();
        if (!code) throw new Error('Empty backup');
        setImportString(code);
        setImportError('');
        setBackupNotice('Backup file loaded. Use Restore Saved State to apply it.');
      } catch {
        setImportError('Could not read that backup file.');
      }
    };
    picker.click();
  };

  const handleApplyImport = () => {
    setImportError('');
    const code = importString.trim();
    if (!code) {
      setImportError('Please enter a valid save string.');
      return;
    }
    if (code.length > MAX_SAVE_IMPORT_SIZE) {
      setImportError('Save data is too large.');
      return;
    }

    try {
      const decoded = decodeBase64Utf8(code);
      const parsed = JSON.parse(decoded);
      const validShape =
        parsed &&
        typeof parsed === 'object' &&
        parsed.resources &&
        typeof parsed.resources === 'object' &&
        !Array.isArray(parsed.resources) &&
        parsed.upgrades &&
        typeof parsed.upgrades === 'object' &&
        !Array.isArray(parsed.upgrades) &&
        Object.prototype.hasOwnProperty.call(parsed, 'planetIndex') &&
        Object.prototype.hasOwnProperty.call(parsed, 'lifetimeEarnings');
      if (!validShape) {
        throw new Error('Wrong game or corrupted format');
      }
      if (!window.confirm('Replace the current Galaxy Miner save with this imported backup?')) {
        setBackupNotice('Restore cancelled.');
        return;
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
    <div className="safe-screen-overlay fixed inset-0 z-[120] flex items-center justify-center bg-black/85 md:backdrop-blur-md animate-in fade-in">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="stats-backup-title"
        tabIndex={-1}
        onKeyDown={trapDialogFocus}
        className="bg-space-850 border border-neon-blue/40 w-full max-w-2xl rounded-2xl shadow-[0_0_50px_rgba(0,243,255,0.15)] overflow-hidden flex flex-col max-h-full outline-none focus-visible:ring-2 focus-visible:ring-neon-blue"
      >
        
        {/* Header */}
        <div className="p-3 sm:p-5 border-b border-white/10 flex justify-between items-center gap-3 bg-space-900">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📊</span>
            <div>
              <h2 id="stats-backup-title" className="font-display font-black text-sm sm:text-lg text-white tracking-wide sm:tracking-widest leading-tight">
                COMMAND TELEMETRY & BACKUP
              </h2>
              <p className="hidden sm:block text-[11px] font-mono text-neon-blue">
                COSMIC MINER FLEET DIAGNOSTICS
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close telemetry and backup"
            onClick={onClose}
            className="w-11 h-11 rounded-lg bg-white/5 hover:bg-white/20 text-gray-400 hover:text-white flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-3 border-b border-white/10 bg-space-900/60 p-2 gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('stats')}
            className={`min-w-0 min-h-11 px-1 py-2 rounded-lg text-[9px] sm:text-xs font-mono font-bold transition-all ${
              activeTab === 'stats' 
                ? 'bg-neon-blue text-black shadow-[0_0_15px_rgba(0,243,255,0.3)]' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            📈 FLEET STATS
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('save')}
            className={`min-w-0 min-h-11 px-1 py-2 rounded-lg text-[9px] sm:text-xs font-mono font-bold transition-all ${
              activeTab === 'save' 
                ? 'bg-neon-blue text-black shadow-[0_0_15px_rgba(0,243,255,0.3)]' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            💾 EXPORT / RESTORE
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`min-w-0 min-h-11 px-1 py-2 rounded-lg text-[9px] sm:text-xs font-mono font-bold transition-all ${
              activeTab === 'settings' 
                ? 'bg-neon-blue text-black shadow-[0_0_15px_rgba(0,243,255,0.3)]' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            ⚙️ PREFERENCES
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-6 custom-scrollbar text-sm">
          
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
                    <span className="text-gray-400">Critical Hits:</span>
                    <span className="text-amber-400 font-bold">{totalCrits.toLocaleString()} ({critRatePercent}%)</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-gray-400">Golden Comets Captured:</span>
                    <span className="text-neon-blue font-bold">{cometsCaught.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1 sm:pl-4">
                    <span className="text-gray-400">Impact Crises Resolved:</span>
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
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                  <div>
                    <h3 className="font-bold text-white text-xs font-mono uppercase">
                      Export Base64 Save Code
                    </h3>
                    <p className="text-[11px] text-gray-400">
                      Copy the portable code or download a local .scg backup file. Neither option is encryption or cloud storage.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 sm:justify-end">
                    <button
                      type="button"
                      onClick={handleCopySave}
                      className={`min-h-11 px-3 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
                        copied 
                          ? 'bg-neon-green text-black' 
                          : 'bg-neon-blue text-black hover:bg-white'
                      }`}
                    >
                      {copied ? 'COPIED! ✓' : 'COPY SAVE CODE'}
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadSave}
                      className="min-h-11 px-3 py-2 rounded-lg border border-white/15 text-xs font-mono font-bold text-white hover:border-neon-blue transition-colors"
                    >
                      DOWNLOAD BACKUP
                    </button>
                  </div>
                </div>
                <textarea
                  readOnly
                  value={generateExportString()}
                  className="w-full h-20 bg-black/60 border border-white/10 rounded-lg p-2.5 text-[10px] font-mono text-gray-300 resize-none focus:outline-none focus:border-neon-blue"
                />
              </div>

              {/* Import Box */}
              <div className="bg-space-900/80 border border-white/10 rounded-xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-white text-xs font-mono uppercase">
                      Import Save String
                    </h3>
                    <p className="text-[11px] text-gray-400">
                      Paste a previously exported Base64 code or load a .scg backup file, then restore progress in this browser.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleLoadImportFile}
                    className="min-h-11 shrink-0 px-3 py-2 rounded-lg border border-white/15 text-xs font-mono font-bold text-white hover:border-neon-blue transition-colors"
                  >
                    LOAD BACKUP FILE
                  </button>
                </div>
                <textarea
                  value={importString}
                  maxLength={MAX_SAVE_IMPORT_SIZE}
                  onChange={(e) => setImportString(e.target.value)}
                  placeholder="Paste your base64 save string here..."
                  className="w-full h-20 bg-black/60 border border-white/10 rounded-lg p-2.5 text-[10px] font-mono text-white resize-none focus:outline-none focus:border-neon-blue"
                />
                {backupNotice && (
                  <p role="status" aria-live="polite" className="text-xs font-mono text-neon-blue">{backupNotice}</p>
                )}
                {importError && (
                  <p role="alert" className="text-xs font-mono text-red-400 animate-pulse">{importError}</p>
                )}
                <button
                  type="button"
                  onClick={handleApplyImport}
                  className="w-full min-h-11 py-2.5 bg-neon-green text-black font-mono font-bold rounded-lg text-xs hover:bg-emerald-400 transition-colors shadow-md"
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
                    type="button"
                    aria-label="Toggle haptic vibration feedback"
                    aria-pressed={hapticEnabled}
                    onClick={onToggleHaptic}
                    className="w-12 h-11 shrink-0 flex items-center justify-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-blue"
                  >
                    <span className={`relative block w-12 h-6 rounded-full transition-colors ${
                      hapticEnabled ? 'bg-neon-blue' : 'bg-gray-700'
                    }`} aria-hidden="true">
                      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                        hapticEnabled ? 'left-7' : 'left-1'
                      }`} />
                    </span>
                  </button>
                </div>

                {/* Screen Shake Toggle */}
                <div className="flex items-center justify-between border-t border-white/10 pt-4">
                  <div>
                    <div className="font-bold text-white text-sm">IMPACT SCREEN SHAKE</div>
                    <div className="text-xs text-gray-400">Dynamic physics shake during Flux state and critical strikes. (Disable if prone to motion sickness)</div>
                  </div>
                  <button
                    type="button"
                    aria-label="Toggle impact screen shake"
                    aria-pressed={screenShakeEnabled}
                    onClick={onToggleScreenShake}
                    className="w-12 h-11 shrink-0 flex items-center justify-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-blue"
                  >
                    <span className={`relative block w-12 h-6 rounded-full transition-colors ${
                      screenShakeEnabled ? 'bg-neon-blue' : 'bg-gray-700'
                    }`} aria-hidden="true">
                      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                        screenShakeEnabled ? 'left-7' : 'left-1'
                      }`} />
                    </span>
                  </button>
                </div>
              </div>

              {/* Reset Protocol */}
              <div className="bg-red-950/20 border border-red-500/30 rounded-xl p-4 space-y-3">
                <div className="font-bold text-red-400 text-sm">EMERGENCY DATA PURGE</div>
                <p className="text-xs text-gray-400">
                  Wipes Galaxy Miner progress stored in this browser and returns the game to a fresh state. Copy a save code or download a backup file first if you want a manual backup.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Permanently erase Galaxy Miner progress stored in this browser?')) {
                      onResetGame();
                    }
                  }}
                  className="w-full min-h-11 py-2.5 border border-red-500 text-red-400 hover:bg-red-500 hover:text-white font-mono font-bold rounded-lg text-xs transition-colors"
                >
                  PURGE ALL LOCAL FLEET DATA
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer info */}
        <div className="hidden sm:block p-4 bg-space-900 border-t border-white/10 text-center text-[10px] font-mono text-gray-500">
          HOTKEY SHORTCUT: PRESS <span className="text-neon-blue">[S]</span> TO OPEN STATS | <span className="text-neon-blue">[SPACE]</span> TO MINE
        </div>

      </div>
    </div>
  );
};

export default StatsAndSaveModal;
