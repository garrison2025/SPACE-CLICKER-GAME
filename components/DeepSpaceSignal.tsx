
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DeepSignalSaveData, SignalMessage } from '../types';
import { generateAlienMessage } from '../services/eventService';
import { playSound } from '../services/audioService';
import { formatNumber } from '../utils';
import { safeGetStorageItem, safeSetStorageItem } from '../utils/projectStorage';

const DEEP_SIGNAL_SAVE_KEY = 'deep_signal_save_v3';
const MAX_LIVE_MESSAGES = 100;

const UPGRADE_CONFIG = {
    antenna: { name: 'Antenna Array', desc: 'Increases Data recovered from newly scanned signals.', base: 100, mult: 2.0, max: 10 },
    processor: { name: 'Crypto Core', desc: 'Passive decryption speed.', base: 150, mult: 1.5, max: 20 },
    battery: { name: 'Capacitor Bank', desc: 'Increase Max Energy.', base: 50, mult: 1.4, max: 20 },
    solar: { name: 'Solar Sails', desc: 'Energy regeneration rate.', base: 200, mult: 1.6, max: 15 },
    ai: { name: 'Auto-Scan AI', desc: 'Automated signal hunting.', base: 1000, mult: 3.0, max: 1 },
};

const MAX_RESOURCE_VALUE = 1e300;
const MAX_FACTION_LEVEL = 1_000_000;
const MAX_MESSAGE_REWARD = 1e9;
const SIGNAL_TYPES = new Set(['BIO', 'TECH', 'VOID', 'MIL']);

const safeFinite = (value: unknown, fallback = 0, max = MAX_RESOURCE_VALUE) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? Math.min(max, parsed) : fallback;
};

const safeUpgradeLevel = (
    value: unknown,
    key: keyof typeof UPGRADE_CONFIG,
    minimum: number
) => Math.min(
    UPGRADE_CONFIG[key].max,
    Math.max(minimum, Math.floor(safeFinite(value, minimum, UPGRADE_CONFIG[key].max)))
);

const sanitizeMessage = (raw: unknown): SignalMessage | null => {
    if (!raw || typeof raw !== 'object') return null;
    const msg = raw as Partial<SignalMessage>;
    const id = typeof msg.id === 'string' ? msg.id.slice(0, 120) : '';
    const sender = typeof msg.sender === 'string' ? msg.sender.slice(0, 120) : '';
    const content = typeof msg.content === 'string' ? msg.content.slice(0, 2000) : '';
    if (!id || !sender || !content) return null;

    const type = typeof msg.type === 'string' && SIGNAL_TYPES.has(msg.type)
        ? msg.type as SignalMessage['type']
        : undefined;

    return {
        id,
        timestamp: typeof msg.timestamp === 'string' ? msg.timestamp.slice(0, 80) : '',
        sender,
        content,
        isDecoded: msg.isDecoded === true,
        encryptionLevel: Math.min(100, safeFinite(msg.encryptionLevel, 0, 100)),
        rewardData: safeFinite(msg.rewardData, 0, MAX_MESSAGE_REWARD),
        ...(type ? { type } : {}),
        ...(msg.analyzed === true ? { analyzed: true } : {}),
    };
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
    const messagesRef = useRef<SignalMessage[]>(messages);
    const rewardedMessageIdsRef = useRef<Set<string>>(new Set());
    const dataBytesRef = useRef(dataBytes);
    const upgradesRef = useRef(upgrades);
    const factionsRef = useRef(factions);
    const energyRef = useRef(energy);
    const isScanningRef = useRef(isScanning);
    const handleScanRef = useRef<() => void>(() => undefined);
    const saveStateRef = useRef({ dataBytes, energy, upgrades, messages, factions });

    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    useEffect(() => {
        dataBytesRef.current = dataBytes;
    }, [dataBytes]);

    useEffect(() => {
        upgradesRef.current = upgrades;
    }, [upgrades]);

    useEffect(() => {
        factionsRef.current = factions;
    }, [factions]);

    useEffect(() => {
        energyRef.current = energy;
    }, [energy]);

    useEffect(() => {
        isScanningRef.current = isScanning;
    }, [isScanning]);

    const commitMessages = (nextMessages: SignalMessage[]) => {
        const capped = nextMessages.length > MAX_LIVE_MESSAGES
            ? nextMessages.slice(-MAX_LIVE_MESSAGES)
            : nextMessages;
        const retainedIds = new Set(capped.map(message => message.id));
        rewardedMessageIdsRef.current = new Set(
            [...rewardedMessageIdsRef.current].filter(id => retainedIds.has(id))
        );
        messagesRef.current = capped;
        saveStateRef.current = { ...saveStateRef.current, messages: capped };
        setMessages(capped);
    };
    
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
    // The spectrum is decorative, so it does not need a permanent 60fps loop.
    // Use a bounded timer instead: faster while scanning, slower while idle,
    // and much slower for users who prefer reduced motion.
    useEffect(() => {
        const canvas = spectrumCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const bars = 64;
        const barWidth = canvas.width / bars;
        const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

        const draw = () => {
            if (document.hidden) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            if (Math.random() < 0.1) {
                ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
                ctx.fillRect(0, Math.random() * canvas.height, canvas.width, 2);
            }

            for (let i = 0; i < bars; i++) {
                const baseHeight = isScanning
                    ? Math.random() * canvas.height
                    : Math.random() * (canvas.height * 0.2);
                const x = i * barWidth;
                const y = (canvas.height - baseHeight) / 2;
                
                ctx.fillStyle = isScanning ? '#22c55e' : '#14532d';
                if (isScanning && Math.random() > 0.9) ctx.fillStyle = '#4ade80';

                ctx.fillRect(x, y, barWidth - 1, baseHeight);
            }
        };

        draw();
        const intervalMs = reduceMotion ? 400 : isScanning ? 50 : 150;
        const interval = window.setInterval(draw, intervalMs);
        return () => window.clearInterval(interval);
    }, [isScanning]);

    // --- HEX RAIN LOOP ---
    useEffect(() => {
        const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
        const interval = window.setInterval(() => {
            if (document.hidden) return;
            let line = "";
            for (let i = 0; i < 8; i++) {
                line += Math.floor(Math.random() * 16).toString(16).toUpperCase() + " ";
            }
            setHexLines(prev => {
                const next = [...prev, line];
                return next.length > 20 ? next.slice(-20) : next;
            });
        }, reduceMotion ? 800 : 350);
        return () => window.clearInterval(interval);
    }, []);

    // --- GAME LOOP ---
    useEffect(() => {
        const interval = setInterval(() => {
            if (document.hidden) return;

            // 1. Energy Regen
            const nextEnergy = Math.min(maxEnergy, energyRef.current + (regenRate / 5));
            energyRef.current = nextEnergy;
            saveStateRef.current = { ...saveStateRef.current, energy: nextEnergy };
            setEnergy(nextEnergy); 

            // 2. Decryption Logic
            let rewardEarned = 0;
            let changed = false;
            const nextMessages = messagesRef.current.map(msg => {
                if (msg.isDecoded) return msg;

                const newLevel = Math.max(0, msg.encryptionLevel - (decryptSpeed / 5));
                if (newLevel === msg.encryptionLevel) return msg;
                changed = true;

                if (newLevel <= 0 && msg.encryptionLevel > 0) {
                    if (!rewardedMessageIdsRef.current.has(msg.id)) {
                        rewardedMessageIdsRef.current.add(msg.id);
                        rewardEarned += msg.rewardData;
                    }
                    return { ...msg, isDecoded: true, encryptionLevel: 0 };
                }

                return { ...msg, encryptionLevel: newLevel };
            });

            if (changed) {
                commitMessages(nextMessages);
            }
            if (rewardEarned > 0) {
                const nextDataBytes = Math.min(MAX_RESOURCE_VALUE, dataBytesRef.current + rewardEarned);
                dataBytesRef.current = nextDataBytes;
                saveStateRef.current = { ...saveStateRef.current, dataBytes: nextDataBytes };
                setDataBytes(nextDataBytes);
                playSound('success');
            }

            // 3. Auto Scan
            if (
                upgrades.ai > 0 &&
                !isScanningRef.current &&
                energyRef.current >= scanCost + 10 &&
                Math.random() < 0.04
            ) {
                handleScanRef.current();
            }

        }, 200);
        return () => clearInterval(interval);
    }, [maxEnergy, regenRate, decryptSpeed, upgrades.ai, scanCost]);

    // Auto-scroll
    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [messages.length, isScanning]); 

    // --- ACTIONS ---
    const handleScan = async () => {
        if (isScanningRef.current || energyRef.current < scanCost) {
            if (energyRef.current < scanCost) playSound('error');
            return;
        }

        isScanningRef.current = true;
        setIsScanning(true);
        const nextEnergy = Math.max(0, energyRef.current - scanCost);
        energyRef.current = nextEnergy;
        saveStateRef.current = { ...saveStateRef.current, energy: nextEnergy };
        setEnergy(nextEnergy);
        playSound('scan');

        // Visual "Scanning..." effect
        const tempId = Date.now().toString();
        commitMessages([
            ...messagesRef.current,
            {
                id: tempId,
                timestamp: new Date().toLocaleTimeString(),
                sender: "SYSTEM",
                content: `Scanning Sector ${frequency.toFixed(2)} MHz...`,
                isDecoded: true,
                encryptionLevel: 0,
                rewardData: 0
            }
        ]);

        try {
            const result = await generateAlienMessage(frequency, upgradesRef.current.antenna);
            
            // Replace placeholder
            const filtered = messagesRef.current.filter(m => m.id !== tempId);
            commitMessages([
                ...filtered,
                {
                    id: Date.now().toString(),
                    timestamp: new Date().toLocaleTimeString(),
                    sender: result.sender,
                    content: result.content,
                    isDecoded: false,
                    encryptionLevel: result.encryption,
                    rewardData: result.dataValue,
                    type: result.type
                }
            ]);

            setFrequency(prev => prev + (Math.random() * 5 - 2));

        } catch {
            const refundedEnergy = Math.min(maxEnergy, energyRef.current + scanCost);
            energyRef.current = refundedEnergy;
            saveStateRef.current = { ...saveStateRef.current, energy: refundedEnergy };
            setEnergy(refundedEnergy);

            const failedAt = Date.now();
            commitMessages([
                ...messagesRef.current.filter(message => message.id !== tempId),
                {
                    id: `scan-error-${failedAt}`,
                    timestamp: new Date(failedAt).toLocaleTimeString(),
                    sender: 'SYSTEM',
                    content: 'SCAN FAILED — no signal data was recovered. The scan Energy cost was refunded.',
                    isDecoded: true,
                    encryptionLevel: 0,
                    rewardData: 0
                }
            ]);
            playSound('error');
        } finally {
            isScanningRef.current = false;
            setIsScanning(false);
        }
    };

    handleScanRef.current = handleScan;

    const handleMessageClick = (msgId: string) => {
        const msg = messagesRef.current.find(item => item.id === msgId);
        if (!msg || msg.isDecoded) return;

        playSound('decode');
        const hackPower =
            5 +
            (upgradesRef.current.processor * 0.5) +
            (factionsRef.current.TECH * 0.1);
        const newLevel = Math.max(0, msg.encryptionLevel - hackPower);
        let rewardEarned = 0;

        const nextMessages = messagesRef.current.map(item => {
            if (item.id !== msgId || item.isDecoded) return item;

            if (newLevel <= 0) {
                if (!rewardedMessageIdsRef.current.has(item.id)) {
                    rewardedMessageIdsRef.current.add(item.id);
                    rewardEarned = item.rewardData;
                }
                return { ...item, isDecoded: true, encryptionLevel: 0 };
            }

            return { ...item, encryptionLevel: newLevel };
        });

        commitMessages(nextMessages);

        if (rewardEarned > 0) {
            const nextDataBytes = Math.min(MAX_RESOURCE_VALUE, dataBytesRef.current + rewardEarned);
            dataBytesRef.current = nextDataBytes;
            saveStateRef.current = { ...saveStateRef.current, dataBytes: nextDataBytes };
            setDataBytes(nextDataBytes);
            playSound('success');
        }
    };

    const handleAnalyze = (msgId: string) => {
        const msg = messagesRef.current.find(m => m.id === msgId);
        if (!msg || !msg.isDecoded || msg.analyzed || energyRef.current < 10) {
            playSound('error');
            return;
        }

        const nextEnergy = Math.max(0, energyRef.current - 10);
        energyRef.current = nextEnergy;
        saveStateRef.current = { ...saveStateRef.current, energy: nextEnergy };
        setEnergy(nextEnergy);
        playSound('analyze');
        
        // Grant Faction XP
        if (msg.type) {
            const type = msg.type;
            const nextFactions = {
                ...factionsRef.current,
                [type]: Math.min(
                    MAX_FACTION_LEVEL,
                    (factionsRef.current[type] || 0) + 1
                )
            };
            factionsRef.current = nextFactions;
            saveStateRef.current = { ...saveStateRef.current, factions: nextFactions };
            setFactions(nextFactions);
        }

        const analysisReward = Math.floor(msg.rewardData * 0.5);
        const nextDataBytes = Math.min(
            MAX_RESOURCE_VALUE,
            dataBytesRef.current + analysisReward
        );
        dataBytesRef.current = nextDataBytes;
        saveStateRef.current = { ...saveStateRef.current, dataBytes: nextDataBytes };
        setDataBytes(nextDataBytes);

        commitMessages(messagesRef.current.map(m =>
            m.id === msgId
                ? { ...m, analyzed: true, content: `${m.content} [UPLOADED TO ${m.type || 'ARCHIVE'}]` }
                : m
        ));
    };

    const handleBuy = (key: keyof typeof UPGRADE_CONFIG) => {
        const cfg = UPGRADE_CONFIG[key];
        const currentUpgrades = upgradesRef.current;
        const lvl = currentUpgrades[key];
        if (lvl >= cfg.max) return;

        const cost = Math.floor(cfg.base * Math.pow(cfg.mult, lvl));
        if (dataBytesRef.current < cost) {
            playSound('error');
            return;
        }

        const nextDataBytes = dataBytesRef.current - cost;
        const nextUpgrades = { ...currentUpgrades, [key]: lvl + 1 };
        dataBytesRef.current = nextDataBytes;
        upgradesRef.current = nextUpgrades;
        saveStateRef.current = {
            ...saveStateRef.current,
            dataBytes: nextDataBytes,
            upgrades: nextUpgrades,
        };
        playSound('click');
        setDataBytes(nextDataBytes);
        setUpgrades(nextUpgrades);
    };

    const clearLogs = () => {
        commitMessages([]);
        rewardedMessageIdsRef.current.clear();
        playSound('click');
    };

    // --- SAVE SYSTEM FIX ---
    // Keep ref updated
    useEffect(() => {
        saveStateRef.current = { dataBytes, energy, upgrades, messages, factions };
    }, [dataBytes, energy, upgrades, messages, factions]);

    const saveGame = useCallback(() => {
        // Only save last 50 messages to prevent storage bloat
        const stateToSave = { ...saveStateRef.current, messages: saveStateRef.current.messages.slice(-50) };
        safeSetStorageItem(DEEP_SIGNAL_SAVE_KEY, JSON.stringify({ 
            ...stateToSave,
            lastSaveTime: Date.now() 
        }));
    }, []);

    // Auto-save plus page-lifecycle persistence.
    useEffect(() => {
        const t = setInterval(saveGame, 5000);
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') saveGame();
        };
        const handlePageHide = () => saveGame();

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('pagehide', handlePageHide);

        return () => {
            clearInterval(t);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('pagehide', handlePageHide);
            saveGame();
        };
    }, [saveGame]);

    // Initial Load
    useEffect(() => {
        const saved = safeGetStorageItem(DEEP_SIGNAL_SAVE_KEY);
        if (!saved) return;

        try {
            const data = JSON.parse(saved);
            if (!data || typeof data !== 'object') throw new Error('Invalid Deep Space Signal save payload');

            const loadedUpgrades: DeepSignalSaveData['upgrades'] = {
                antenna: safeUpgradeLevel(data.upgrades?.antenna, 'antenna', 1),
                processor: safeUpgradeLevel(data.upgrades?.processor, 'processor', 1),
                battery: safeUpgradeLevel(data.upgrades?.battery, 'battery', 1),
                solar: safeUpgradeLevel(data.upgrades?.solar, 'solar', 1),
                ai: safeUpgradeLevel(data.upgrades?.ai, 'ai', 0),
            };
            const loadedFactions: DeepSignalSaveData['factions'] = {
                BIO: Math.floor(safeFinite(data.factions?.BIO, 0, MAX_FACTION_LEVEL)),
                TECH: Math.floor(safeFinite(data.factions?.TECH, 0, MAX_FACTION_LEVEL)),
                MIL: Math.floor(safeFinite(data.factions?.MIL, 0, MAX_FACTION_LEVEL)),
                VOID: Math.floor(safeFinite(data.factions?.VOID, 0, MAX_FACTION_LEVEL)),
            };

            const loadedMaxEnergy =
                (100 * Math.pow(1.2, loadedUpgrades.battery - 1)) *
                (1 + loadedFactions.VOID * 0.01);
            const loadedEnergy = Math.min(
                loadedMaxEnergy,
                safeFinite(data.energy, 100, loadedMaxEnergy)
            );
            const loadedDataBytes = safeFinite(data.dataBytes);
            const loadedMessages = Array.isArray(data.messages)
                ? data.messages
                    .slice(-50)
                    .map(sanitizeMessage)
                    .filter((message): message is SignalMessage => message !== null)
                : [];

            const nextSnapshot = {
                dataBytes: loadedDataBytes,
                energy: loadedEnergy,
                upgrades: loadedUpgrades,
                messages: loadedMessages,
                factions: loadedFactions,
            };

            // Hydrate the save ref in the same turn as React state. This prevents
            // an immediate close from writing the component's default values over
            // a valid loaded save, including a legitimate energy value of zero.
            saveStateRef.current = nextSnapshot;
            safeSetStorageItem(DEEP_SIGNAL_SAVE_KEY, JSON.stringify({
                ...nextSnapshot,
                lastSaveTime: Date.now(),
            }));

            dataBytesRef.current = loadedDataBytes;
            energyRef.current = loadedEnergy;
            upgradesRef.current = loadedUpgrades;
            factionsRef.current = loadedFactions;
            setDataBytes(loadedDataBytes);
            setEnergy(loadedEnergy);
            setUpgrades(loadedUpgrades);
            commitMessages(loadedMessages);
            setFactions(loadedFactions);
        } catch (error) {
            console.warn('Could not load Deep Space Signal save.', error);
        }
    }, []);

    // --- RENDER ---
    return (
        <div className="w-full h-full bg-black font-mono text-green-500 relative overflow-hidden flex flex-col p-2.5 sm:p-4 md:p-6 select-none">
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

            <div className="absolute inset-0 border-[8px] sm:border-[12px] md:border-[20px] border-stone-900 rounded-xl sm:rounded-2xl md:rounded-[2rem] pointer-events-none z-30 shadow-[inset_0_0_50px_black]"></div>
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
                    <canvas ref={spectrumCanvasRef} width={600} height={100} aria-hidden="true" className="w-full h-full object-cover opacity-50" />
                </div>
                
                <div className="relative flex justify-between items-end px-2">
                    <div>
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-wide sm:tracking-widest text-glow">DEEP_SIGNAL</h1>
                        <div className="text-xs text-green-700 font-bold flex gap-4">
                            <span>ENCRYPTION: {isScanning ? 'BYPASSING...' : 'SECURE'}</span>
                            <span className="hidden md:inline">FREQ: {frequency.toFixed(4)} MHz</span>
                        </div>
                    </div>
                    <div className="text-right bg-black/60 p-1.5 sm:p-2 rounded border border-green-900/30 md:backdrop-blur-sm min-w-0">
                        <div className="text-[10px] text-green-600 uppercase tracking-widest">CACHE STORAGE</div>
                        <div className="text-lg sm:text-xl md:text-2xl font-bold text-white text-glow font-mono truncate">{formatNumber(dataBytes)} <span className="text-sm text-green-500">DAT</span></div>
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
                        role={!msg.isDecoded && msg.sender !== 'SYSTEM' ? 'button' : undefined}
                        tabIndex={!msg.isDecoded && msg.sender !== 'SYSTEM' ? 0 : -1}
                        aria-label={!msg.isDecoded && msg.sender !== 'SYSTEM' ? `Encrypted transmission from ${msg.sender}. Activate to attempt decoding.` : undefined}
                        onKeyDown={(event) => {
                            if (!msg.isDecoded && msg.sender !== 'SYSTEM' && (event.key === 'Enter' || event.key === ' ')) {
                                event.preventDefault();
                                handleMessageClick(msg.id);
                            }
                        }}
                        onClick={() => handleMessageClick(msg.id)}
                        className={`
                            relative border-l-4 pl-3 py-2 bg-green-900/5 transition-all duration-200 group focus:outline-none focus:ring-1 focus:ring-green-500/60
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
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleAnalyze(msg.id); }}
                                disabled={energy < 10}
                                className="mt-2 min-h-11 text-[10px] border border-green-700 text-green-700 px-3 py-2 rounded hover:bg-green-700 hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase"
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
            <div className="relative z-40 bg-black border-t-2 border-green-900/50 pt-3 md:pt-4 grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4 shrink-0">
                
                {/* 1. Energy */}
                <div className="col-span-2 md:col-span-1 bg-green-900/10 p-3 md:p-4 rounded border border-green-900/30 flex flex-col justify-between">
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
                    type="button"
                    onClick={handleScan}
                    disabled={isScanning || energy < scanCost}
                    className={`
                        min-h-12 md:min-h-0 relative group overflow-hidden border-2 rounded flex flex-col items-center justify-center transition-all
                        ${isScanning || energy < scanCost ? 'border-gray-800 text-gray-700 cursor-not-allowed' : 'border-green-500 text-green-400 hover:bg-green-500 hover:text-black hover:shadow-[0_0_30px_lime]'}
                    `}
                >
                    <div className="text-xl font-black tracking-widest">{isScanning ? 'SCANNING...' : 'SCAN FREQUENCY'}</div>
                    <div className="text-[10px] font-mono mt-1 opacity-70">-{Math.floor(scanCost)} ENERGY</div>
                    
                    {/* Scan effect overlay */}
                    {isScanning && <div className="absolute inset-0 bg-green-500/20 animate-pulse"></div>}
                </button>

                {/* 3. Upgrades Toggle */}
                <div className="grid grid-rows-2 gap-2 min-h-12">
                    <button
                        type="button"
                        onClick={() => { setShowUpgrades(!showUpgrades); playSound('click'); }}
                        className={`min-h-11 border border-green-700 text-[10px] sm:text-xs font-bold tracking-wide sm:tracking-wider hover:bg-green-900/30 transition-colors ${showUpgrades ? 'bg-green-900 text-white' : 'text-green-600'}`}
                    >
                        SYSTEM UPGRADES
                    </button>
                    <button
                        type="button"
                        onClick={clearLogs}
                        className="min-h-11 border border-green-900 text-green-800 text-[10px] sm:text-xs font-bold hover:text-red-400 hover:border-red-900 transition-colors"
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
                        <button
                            type="button"
                            aria-label="Close Engineering Bay"
                            onClick={() => setShowUpgrades(false)}
                            className="w-11 h-11 flex items-center justify-center text-green-500 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 rounded"
                        >✕</button>
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
                                        type="button"
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
