
import React, { useState } from 'react';
import { GlobalSettings } from '../types';
import { setGlobalMute } from '../services/audioService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GlobalSettings;
  onSettingsChange: (newSettings: GlobalSettings) => void;
}

const ALL_SAVE_KEYS = [
    'cosmic-miner-save-v2',
    'mars_colony_save_v2',
    'star_defense_save_v4',
    'merge_ships_save_v3',
    'gravity_idle_save_v2',
    'deep_signal_save_v3'
];

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSettingsChange }) => {
  const [importString, setImportString] = useState('');
  const [statusMsg, setStatusMsg] = useState<{text: string, type: 'success' | 'error'} | null>(null);

  if (!isOpen) return null;

  const toggleAudio = () => {
      const newVal = !settings.audioMuted;
      onSettingsChange({ ...settings, audioMuted: newVal });
      setGlobalMute(newVal);
  };

  const togglePerf = () => {
      onSettingsChange({ ...settings, lowPerformance: !settings.lowPerformance });
  };

  const handleExport = () => {
      const backup: {[key: string]: any} = {};
      ALL_SAVE_KEYS.forEach(key => {
          const data = localStorage.getItem(key);
          if(data) backup[key] = JSON.parse(data);
      });
      
      const b64 = btoa(JSON.stringify(backup));
      navigator.clipboard.writeText(b64).then(() => {
          setStatusMsg({ text: "SAVE DATA COPIED TO CLIPBOARD", type: 'success' });
      }).catch(() => {
          setStatusMsg({ text: "FAILED TO COPY", type: 'error' });
      });
  };

  const handleImport = () => {
      try {
          if (!importString) return;
          const jsonStr = atob(importString);
          const data = JSON.parse(jsonStr);
          
          let count = 0;
          Object.keys(data).forEach(key => {
              if (ALL_SAVE_KEYS.includes(key)) {
                  localStorage.setItem(key, JSON.stringify(data[key]));
                  count++;
              }
          });

          setStatusMsg({ text: `SUCCESS: ${count} MODULES UPDATED. RELOADING...`, type: 'success' });
          setTimeout(() => window.location.reload(), 2000);
      } catch (e) {
          setStatusMsg({ text: "INVALID SAVE STRING", type: 'error' });
      }
  };

  const handleWipe = () => {
      if (window.confirm("CRITICAL WARNING: THIS WILL ERASE ALL PROGRESS ACROSS ALL GAMES. CONFIRM?")) {
          localStorage.clear();
          window.location.reload();
      }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in">
        <div className="bg-space-900 w-full max-w-lg border border-neon-blue rounded-lg shadow-[0_0_50px_rgba(0,243,255,0.2)] overflow-hidden">
            
            {/* Header */}
            <div className="p-4 border-b border-white/10 bg-black/40 flex justify-between items-center">
                <h2 className="font-display font-bold text-xl text-white tracking-widest">SYSTEM SETTINGS</h2>
                <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-8">
                
                {/* Toggles */}
                <div className="grid grid-cols-2 gap-4">
                    <button 
                        onClick={toggleAudio}
                        className={`p-4 rounded border flex flex-col items-center gap-2 transition-all ${settings.audioMuted ? 'border-red-500/50 text-red-400 bg-red-900/10' : 'border-green-500/50 text-green-400 bg-green-900/10'}`}
                    >
                        <span className="text-2xl">{settings.audioMuted ? '🔇' : '🔊'}</span>
                        <span className="text-xs font-bold">AUDIO: {settings.audioMuted ? 'OFF' : 'ON'}</span>
                    </button>
                    <button 
                        onClick={togglePerf}
                        className={`p-4 rounded border flex flex-col items-center gap-2 transition-all ${settings.lowPerformance ? 'border-yellow-500/50 text-yellow-400 bg-yellow-900/10' : 'border-blue-500/50 text-blue-400 bg-blue-900/10'}`}
                    >
                        <span className="text-2xl">{settings.lowPerformance ? '🔋' : '✨'}</span>
                        <span className="text-xs font-bold">MODE: {settings.lowPerformance ? 'ECO' : 'HIGH'}</span>
                    </button>
                </div>

                {/* Data Management */}
                <div className="space-y-4 pt-4 border-t border-white/10">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Data Persistence</h3>
                    
                    <button 
                        onClick={handleExport}
                        className="w-full py-3 bg-space-800 hover:bg-space-700 border border-white/10 text-white rounded font-mono text-sm transition-colors flex items-center justify-center gap-2"
                    >
                        <span>💾</span> EXPORT SAVE TO CLIPBOARD
                    </button>

                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            placeholder="Paste save string here..."
                            value={importString}
                            onChange={(e) => setImportString(e.target.value)}
                            className="flex-1 bg-black border border-white/20 rounded px-3 text-xs text-white focus:border-neon-blue outline-none font-mono"
                        />
                        <button 
                            onClick={handleImport}
                            disabled={!importString}
                            className="px-4 py-2 bg-neon-blue text-black font-bold rounded text-xs hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            IMPORT
                        </button>
                    </div>

                    {statusMsg && (
                        <div className={`text-center text-xs font-bold p-2 rounded ${statusMsg.type === 'success' ? 'text-green-400 bg-green-900/20' : 'text-red-400 bg-red-900/20'}`}>
                            {statusMsg.text}
                        </div>
                    )}
                </div>

                {/* Danger Zone */}
                <div className="pt-4 border-t border-white/10 text-center">
                    <button onClick={handleWipe} className="text-[10px] text-red-500 hover:text-red-400 hover:underline">
                        FACTORY RESET (WIPE ALL DATA)
                    </button>
                </div>

            </div>
        </div>
    </div>
  );
};

export default SettingsModal;
