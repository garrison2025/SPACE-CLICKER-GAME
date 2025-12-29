import React, { useState, useEffect, useRef } from 'react';
import { DeepSignalSaveData, SignalMessage } from '../types';
import { generateAlienMessage } from '../services/geminiService';
import { playSound } from '../services/audioService';
import { formatNumber } from '../utils';

const DEEP_SIGNAL_SAVE_KEY = 'deep_signal_save_v3';

const UPGRADE_CONFIG = {
    antenna: { name: 'Antenna Array', desc: 'Unlock deeper frequencies.', base: 100, mult: 2.0, max: 10 },
    processor: { name: 'Crypto Core', desc: 'Passive decryption speed.', base: 150, mult: 1.5, max: 20 },
    battery: { name: 'Capacitor Bank', desc: 'Increase Max Energy.', base: 50, mult: 1.4, max: 20 },
    solar: { name: 'Solar Sails', desc: 'Energy regeneration rate.', base: 200, mult: 1.6, max: 15 },
    ai: { name: 'Auto-Scan AI', desc: 'Automated signal hunting.', base: 1000, mult: 3.0, max: 1 },
};

const TYPE_COLORS = {
    BIO: 'text-green-400',
    TECH: 'text-cyan-400',
    MIL: 'text-red-400',
    VOID: 'text-purple-400',
    UNKNOWN: 'text-gray-400'
};

const FACTION_BONUSES = {
    BIO: { name: 'Bio-Synthesis', effect: 'Energy Regen' },
    TECH: { name: 'Overclock', effect: 'Decrypt Speed' },
    MIL: { name: 'Tactical Scan', effect: 'Scan Cost Reduc.' },
    VOID: { name: 'Dark Channel', effect: 'Max Energy' }
};

const DeepSpaceSignal: React.FC = () => {
    // --- STATE ---
    const [dataBytes, setDataBytes] = useState(0);
    const [energy, setEnergy] = useState(100);
    const [messages, setMessages] = useState<SignalMessage[]>([]);
    const [upgrades, setUpgrades] = useState<DeepSignalSaveData['upgrades']>({
        antenna: 1,
        processor: 1,
        battery: 1,
        solar: 1,
        ai: 0
    });
    const [factions, setFactions] = useState<DeepSignalSaveData['factions']>({
        BIO: 0, TECH: 0, MIL: 0, VOID: 0
    });

    const [isScanning, setIsScanning] = useState(false);
    const [frequency, setFrequency] = useState(1420.0); 
    const [showUpgrades, setShowUpgrades] = useState(false);
    const [hexLines, setHexLines] = useState<string[]>([]);

    // Refs
    const logContainerRef = useRef<HTMLDivElement>(null);
    const spectrumCanvasRef = useRef<HTMLCanvasElement>(null);
    
    // Derived Stats
    // VOID faction increases max energy by 1% per level
    const maxEnergy = (100 * Math.pow(1.2, upgrades.battery - 1)) * (1 + (factions.VOID * 0.01));
    
    // BIO faction increases regen by 1% per level
    const regenRate = (1 * Math.pow(1.3, upgrades.solar - 1)) * (1 + (factions.BIO * 0.01));
    
    // TECH faction increases decrypt speed by 2% per level
    const decryptSpeed = (1 * Math.pow(1.2, upgrades.processor - 1)) * (1 + (factions.TECH * 0.02));
    
    // MIL faction reduces scan cost (Base 20, Min 5)
    const scanCost = Math.max(5, 20 * (1 - (factions.MIL * 0.01)));

    // --- VISUALIZER LOOP ---
    useEffect(() => {
        const canvas = spectrumCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationId: number;
        const bars = 64;
        const barWidth = canvas.width / bars;

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Random glitch line
            if (Math.random() < 0.1) {
                ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
                ctx.fillRect(0, Math.random() * canvas.height, canvas.width, 2);
            }

            for (let i = 0; i < bars; i++) {
                // Height depends on scanning state + randomness
                const baseHeight = isScanning ? Math.random() * canvas.height : Math.random() * (canvas.height * 0.2);
                const x = i * barWidth;
                const y = (canvas.height - baseHeight) / 2; // Center it vertically-ish
                
                // Color based on activity
                ctx.fillStyle = isScanning ? '#22c55e' : '#14532d';
                if (isScanning && Math.random() > 0.9) ctx.fillStyle = '#4ade80'; // Highlights

                ctx.fillRect(x, y, barWidth - 1, baseHeight);
            }
            animationId = requestAnimationFrame(draw);
        };
        draw();
        return () => cancelAnimationFrame(animationId);
    }, [isScanning]);

    // --- HEX RAIN LOOP ---
    useEffect(() => {
        const interval = setInterval(() => {
            setHexLines(prev => {
                const next = [...prev];
                // Generate random hex string
                let line = "";
                for(let i=0; i<8; i++) line += Math.floor(Math.random()*16).toString(16).toUpperCase() + " ";
                next.push(line);
                if (next.length > 20) next.shift();
                return next;
            });
        }, 100); // Fast update
        return () => clearInterval(interval);
    }, []);

    // --- GAME LOOP ---
    useEffect(() => {
        const interval = setInterval(() => {
            // 1. Energy Regen
            setEnergy(prev => Math.min(maxEnergy, prev + (regenRate / 10))); 

            // 2. Decryption Logic
            setMessages(prev => prev.map(msg => {
                if (msg.isDecoded) return msg;
                // Passive decay
                const newLevel = Math.max(0, msg.encryptionLevel - (decryptSpeed / 10));
                
                if (newLevel <= 0 && msg.encryptionLevel > 0) {
                    setDataBytes(d => d + msg.rewardData);
                    playSound('success');
                    return { ...msg, isDecoded: true, encryptionLevel: 0 };
                }
                return { ...msg, encryptionLevel: newLevel };
            }));

            // 3. Auto Scan
            if (upgrades.ai > 0 && !isScanning && energy >= scanCost + 10 && Math.random() < 0.02) {
                handleScan();
            }

        }, 100);
        return () => clearInterval(interval);
    }, [maxEnergy, regenRate, decryptSpeed, upgrades.ai, isScanning, energy, scanCost]);

    // Auto-scroll
    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [messages.length, isScanning]); 

    // --- ACTIONS ---
    const handleScan = async () => {
        if (isScanning || energy < scanCost) {
            if(energy < scanCost) playSound('error');
            return;
        }
        
        setIsScanning(true);
        setEnergy(prev => prev - scanCost);
        playSound('scan');

        // Visual "Scanning..." effect
        const tempId = Date.now().toString();
        setMessages(prev => [...prev, {
            id: tempId,
            timestamp: new Date().toLocaleTimeString(),
            sender: "SYSTEM",
            content: `Scanning Sector ${frequency.toFixed(2)} MHz...`,
            isDecoded: true,
            encryptionLevel: 0,
            rewardData: 0
        }]);

        try {
            const result = await generateAlienMessage(frequency, upgrades.antenna);
            
            // Replace placeholder
            setMessages(prev => {
                const filtered = prev.filter(m => m.id !== tempId);
                return [...filtered, {
                    id: Date.now().toString(),
                    timestamp: new Date().toLocaleTimeString(),
                    sender: result.sender,
                    content: result.content,
                    isDecoded: false,
                    encryptionLevel: result.encryption,
                    rewardData: result.dataValue,
                    type: result.type
                }];
            });

            setFrequency(prev => prev + (Math.random() * 5 - 2));

        } catch (e) {
            console.error(e);
        } finally {
            setIsScanning(false);
        }
    };

    const handleMessageClick = (msgId: string) => {
        setMessages(prev => prev.map(msg => {
            if (msg.id === msgId && !msg.isDecoded) {
                playSound('decode');
                // Manual Hack: Reduce encryption by flat 5 + processor bonus + TECH bonus
                const hackPower = 5 + (upgrades.processor * 0.5) + (factions.TECH * 0.1);
                const newLevel = Math.max(0, msg.encryptionLevel - hackPower);
                
                if (newLevel <= 0) {
                    setDataBytes(d => d + msg.rewardData);
                    playSound('success');
                    return { ...msg, isDecoded: true, encryptionLevel: 0 };
                }
                return { ...msg, encryptionLevel: newLevel };
            }
            return msg;
        }));
    };

    const handleAnalyze = (msgId: string) => {
        const msg = messages.find(m => m.id === msgId);
        if (!msg || !msg.isDecoded || msg.analyzed || energy < 10) {
            playSound('error');
            return;
        }

        setEnergy(prev => prev - 10);
        playSound('analyze');
        
        // Grant Faction XP
        if (msg.type) {
            const type = msg.type;
            setFactions(prev => ({
                ...prev,
                [type]: (prev[type] || 0) + 1
            }));
        }

        setDataBytes(prev => prev + Math.floor(msg.rewardData * 0.5)); 
        
        setMessages(prev => prev.map(m => 
            m.id === msgId ? { ...m, analyzed: true, content: `${m.content} [UPLOADED TO ${m.type || 'ARCHIVE'}]` } : m
        ));
    };

    const handleBuy = (key: keyof typeof UPGRADE_CONFIG) => {
        const cfg = UPGRADE_CONFIG[key];
        const lvl = upgrades[key];
        if (lvl >= cfg.max) return;
        
        const cost = Math.floor(cfg.base * Math.pow(cfg.mult, lvl));
        if (dataBytes >= cost) {
            playSound('click');
            setDataBytes(prev => prev - cost);
            setUpgrades(prev => ({ ...prev, [key]: lvl + 1 }));
        } else {
            playSound('error');
        }
    };

    const clearLogs = () => {
        setMessages([]);
        playSound('click');
    };

    // --- PERSISTENCE ---
    useEffect(() => {
        const saved = localStorage.getItem(DEEP_SIGNAL_SAVE_KEY);
        if (saved) {
            try {
                const data = JSON.parse(saved);
                if (data.dataBytes) setDataBytes(data.dataBytes);
                if (data.energy) setEnergy(data.energy);
                if (data.upgrades) setUpgrades(data.upgrades);
                if (data.messages) setMessages(data.messages);
                if (data.factions) setFactions(data.factions);
            } catch(e) {}
        }
    }, []);

    useEffect(() => {
        const t = setInterval(() => {
            localStorage.setItem(DEEP_SIGNAL_SAVE_KEY, JSON.stringify({ 
                dataBytes, energy, upgrades, factions, messages: messages.slice(-50) 
            }));
        }, 5000);
        return () => clearInterval(t);
    }, [dataBytes, energy, upgrades, messages, factions]);


    // --- RENDER ---
    return (
        <div className="w-full h-full bg-black font-mono text-green-500 relative overflow-hidden flex flex-col p-4 md:p-6 select-none">
            {/* CRT Effects */}
            <style>{`
                .scanline {
                    width: 100%;
                    height: 100px;
                    z-index: 21;
                    background: linear-gradient(0deg, rgba(0,0,0,0) 0%, rgba(32, 255, 77, 0.04) 50%, rgba(0,0,0,0) 100%);
                    opacity: 0.1;
                    position: absolute;
                    bottom: 100%;
                    animation: scanline 10s linear infinite;
                    pointer-events: none;
                }
                @keyframes scanline { 0% { transform: translateY(-100%); } 100% { transform: translateY(100%); } }
                .text-glow { text-shadow: 0 0 5px #4ade80; }
                .hex-column { mask-image: linear-gradient(to bottom, transparent, black 10%, black 90%, transparent); }
            `}</style>

            <div className="absolute inset-0 border-[20px] border-stone-900 rounded-[2rem] pointer-events-none z-30 shadow-[inset_0_0_50px_black]"></div>
            <div className="scanline"></div>

            {/* Background Hex Rain (Right Side) */}
            <div className="absolute top-0 right-4 bottom-0 w-24 z-0 opacity-10 hex-column hidden md:flex flex-col font-mono text-[10px] pointer-events-none">
                {hexLines.map((line, i) => (
                    <div key={i} className="whitespace-nowrap">{line}</div>
                ))}
            </div>

            {/* VISUALIZER & HEADER */}
            <header className="relative z-20 mb-4 border-b-2 border-green-900/50 pb-2 flex-shrink-0">
                <div className="absolute inset-0 opacity-30">
                    <canvas ref={spectrumCanvasRef} width={600} height={100} className="w-full h-full object-cover opacity-50" />
                </div>
                
                <div className="relative flex justify-between items-end px-2">
                    <div>
                        <h1 className="text-3xl font-black tracking-widest text-glow">DEEP_SIGNAL</h1>
                        <div className="text-xs text-green-700 font-bold flex gap-4">
                            <span>ENCRYPTION: {isScanning ? 'BYPASSING...' : 'SECURE'}</span>
                            <span className="hidden md:inline">FREQ: {frequency.toFixed(4)} MHz</span>
                        </div>
                    </div>
                    <div className="text-right bg-black/60 p-2 rounded border border-green-900/30 backdrop-blur-sm">
                        <div className="text-[10px] text-green-600 uppercase tracking-widest">CACHE STORAGE</div>
                        <div className="text-2xl font-bold text-white text-glow font-mono">{formatNumber(dataBytes)} <span className="text-sm text-green-500">DAT</span></div>
                    </div>
                </div>
            </header>

            {/* FACTIONS STATUS BAR (NEW) */}
            <div className="relative z-20 flex gap-2 mb-2 overflow-x-auto scrollbar-hide shrink-0">
                {Object.entries(factions).map(([type, level]) => (
                     <div key={type} className="flex-1 min-w-[80px] bg-green-900/10 border border-green-900/30 rounded p-1.5 flex flex-col items-center">
                         <div className={`text-[10px] font-bold ${TYPE_COLORS[type as keyof typeof TYPE_COLORS]}`}>{type}</div>
                         <div className="text-xs font-mono text-white">Lv.{level}</div>
                         <div className="text-[8px] text-gray-500 text-center leading-none mt-0.5">{FACTION_BONUSES[type as keyof typeof FACTION_BONUSES].effect}</div>
                     </div>
                ))}
            </div>

            {/* LOG OUTPUT */}
            <div 
                ref={logContainerRef}
                className="flex-1 overflow-y-auto font-mono text-sm space-y-3 pr-2 mb-4 custom-scrollbar z-20 scroll-smooth relative"
            >
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-green-800 animate-pulse opacity-50">
                        <div className="text-6xl mb-4">📡</div>
                        <p>SYSTEM IDLE. INITIATE SCAN.</p>
                        <p className="text-xs mt-2">Audio Synthesis: Enabled</p>
                    </div>
                )}
                
                {messages.map((msg) => (
                    <div 
                        key={msg.id} 
                        onClick={() => handleMessageClick(msg.id)}
                        className={`
                            relative border-l-4 pl-3 py-2 bg-green-900/5 transition-all duration-200 group
                            ${msg.sender === 'SYSTEM' ? 'border-green-800 text-green-600 text-xs py-1' : 
                              msg.isDecoded ? `border-l-green-500 bg-green-500/5` : 
                              'border-l-red-500 bg-red-900/10 cursor-pointer hover:bg-red-900/20 active:scale-[0.99]'}
                        `}
                    >
                        {/* Header Line */}
                        <div className="flex gap-3 text-[10px] opacity-60 mb-1 font-bold uppercase tracking-wider">
                            <span>{msg.timestamp}</span>
                            {msg.type && msg.isDecoded && <span className={`${TYPE_COLORS[msg.type] || 'text-white'}`}>[{msg.type}]</span>}
                            <span>SRC: {msg.sender}</span>
                        </div>

                        {/* Content */}
                        <div className={`leading-relaxed font-bold ${msg.sender === 'SYSTEM' ? '' : 'text-lg'}`}>
                            {msg.isDecoded ? (
                                <span className={msg.type ? TYPE_COLORS[msg.type] : 'text-green-300'}>{msg.content}</span>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <span className="text-red-500 animate-pulse">[ENCRYPTED]</span>
                                    <span className="text-red-900/50 break-all text-xs font-mono">{msg.content.substring(0, 20)}...</span>
                                    <div className="ml-auto text-xs text-red-400 font-bold bg-red-900/20 px-2 py-0.5 rounded">
                                        CLICK TO HACK: {Math.ceil(msg.encryptionLevel)}%
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Analysis Action */}
                        {msg.isDecoded && !msg.analyzed && msg.sender !== 'SYSTEM' && (
                            <button
                                onClick={(e) => { e.stopPropagation(); handleAnalyze(msg.id); }}
                                disabled={energy < 10}
                                className="mt-2 text-[10px] border border-green-700 text-green-700 px-2 py-1 rounded hover:bg-green-700 hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase"
                            >
                                [ UPLOAD TO {msg.type || 'DB'} (-10 PWR) ]
                            </button>
                        )}
                        
                        {/* Rewards */}
                        {msg.isDecoded && msg.rewardData > 0 && msg.sender !== 'SYSTEM' && (
                             <div className="absolute top-2 right-2 text-xs font-bold text-yellow-600/50 group-hover:text-yellow-500 transition-colors">
                                 +{msg.rewardData} DAT {msg.analyzed && <span className="text-green-500 ml-1"> +REP</span>}
                             </div>
                        )}
                    </div>
                ))}
            </div>

            {/* CONTROL DECK */}
            <div className="relative z-40 bg-black border-t-2 border-green-900/50 pt-4 grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
                
                {/* 1. Energy */}
                <div className="bg-green-900/10 p-4 rounded border border-green-900/30 flex flex-col justify-between">
                    <div className="flex justify-between text-xs mb-2 font-bold tracking-widest text-green-600">
                        <span>CAPACITOR</span>
                        <span className={energy < 20 ? 'text-red-500 animate-pulse' : 'text-green-400'}>{Math.floor(energy)} / {Math.floor(maxEnergy)}</span>
                    </div>
                    <div className="w-full bg-green-900/30 h-2 rounded overflow-hidden">
                        <div 
                            className={`h-full transition-all duration-200 ${energy < 20 ? 'bg-red-500' : 'bg-green-500 shadow-[0_0_10px_lime]'}`} 
                            style={{ width: `${(energy/maxEnergy)*100}%` }}
                        ></div>
                    </div>
                    <div className="text-[10px] text-green-800 mt-2 text-right">RECHARGE: +{regenRate.toFixed(1)}/s</div>
                </div>

                {/* 2. Main Action */}
                <button
                    onClick={handleScan}
                    disabled={isScanning || energy < scanCost}
                    className={`
                        relative group overflow-hidden border-2 rounded flex flex-col items-center justify-center transition-all
                        ${isScanning || energy < scanCost ? 'border-gray-800 text-gray-700 cursor-not-allowed' : 'border-green-500 text-green-400 hover:bg-green-500 hover:text-black hover:shadow-[0_0_30px_lime]'}
                    `}
                >
                    <div className="text-xl font-black tracking-widest">{isScanning ? 'SCANNING...' : 'BROADCAST'}</div>
                    <div className="text-[10px] font-mono mt-1 opacity-70">-{Math.floor(scanCost)} ENERGY</div>
                    
                    {/* Scan effect overlay */}
                    {isScanning && <div className="absolute inset-0 bg-green-500/20 animate-pulse"></div>}
                </button>

                {/* 3. Upgrades Toggle */}
                <div className="grid grid-rows-2 gap-2">
                    <button 
                        onClick={() => { setShowUpgrades(!showUpgrades); playSound('click'); }}
                        className={`border border-green-700 text-xs font-bold tracking-wider hover:bg-green-900/30 transition-colors ${showUpgrades ? 'bg-green-900 text-white' : 'text-green-600'}`}
                    >
                        SYSTEM UPGRADES
                    </button>
                    <button 
                        onClick={clearLogs}
                        className="border border-green-900 text-green-800 text-xs font-bold hover:text-red-400 hover:border-red-900 transition-colors"
                    >
                        PURGE LOGS
                    </button>
                </div>
            </div>

            {/* UPGRADE MODAL */}
            {showUpgrades && (
                <div className="absolute inset-x-4 bottom-28 top-20 z-50 bg-black/95 border-2 border-green-500 p-6 shadow-[0_0_50px_rgba(0,255,0,0.1)] animate-in slide-in-from-bottom duration-300 flex flex-col">
                    <div className="flex justify-between items-center mb-6 border-b border-green-800 pb-2">
                        <h2 className="text-xl font-bold text-glow">ENGINEERING BAY</h2>
                        <button onClick={() => setShowUpgrades(false)} className="text-green-500 hover:text-white">✕</button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4 custom-scrollbar">
                        {(Object.keys(UPGRADE_CONFIG) as (keyof typeof UPGRADE_CONFIG)[]).map(key => {
                            const cfg = UPGRADE_CONFIG[key];
                            const lvl = upgrades[key];
                            const isMax = lvl >= cfg.max;
                            const cost = Math.floor(cfg.base * Math.pow(cfg.mult, lvl));
                            const canAfford = dataBytes >= cost;

                            return (
                                <div key={key} className="border border-green-900/50 bg-green-900/10 p-4 flex justify-between items-center group hover:border-green-500 transition-colors">
                                    <div>
                                        <div className="font-bold text-green-400 group-hover:text-glow">{cfg.name} <span className="text-xs text-green-700 bg-black px-1 rounded ml-2">Lvl {lvl}</span></div>
                                        <div className="text-xs text-green-600/70 mb-1">{cfg.desc}</div>
                                    </div>
                                    <button
                                        onClick={() => handleBuy(key)}
                                        disabled={isMax || !canAfford}
                                        className={`px-3 py-2 text-xs font-bold border min-w-[80px] text-center transition-all ${isMax ? 'border-transparent text-gray-600' : canAfford ? 'border-green-500 text-green-500 hover:bg-green-500 hover:text-black' : 'border-red-900 text-red-900 opacity-50'}`}
                                    >
                                        {isMax ? 'MAX' : `${formatNumber(cost)}`}
                                    </button>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

        </div>
    );
};

export default DeepSpaceSignal;