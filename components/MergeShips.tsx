
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MergeShip, FloatingText, MergeUpgradeState, Particle } from '../types';
import { formatNumber } from '../utils';

const MERGE_SAVE_KEY = 'merge_ships_save_v3';
const HANGAR_SLOTS = 12; // 4x3 Grid

// Config
const BASE_SHIP_COST = 50;
const COST_SCALE = 1.15; 

const SHIP_COLORS = [
    '#94a3b8', // Lvl 1: Gray
    '#3b82f6', // Lvl 2: Blue
    '#22c55e', // Lvl 3: Green
    '#eab308', // Lvl 4: Yellow
    '#f97316', // Lvl 5: Orange
    '#ef4444', // Lvl 6: Red
    '#d946ef', // Lvl 7: Pink
    '#a855f7', // Lvl 8: Purple
    '#00f3ff', // Lvl 9: Cyan Neon
    '#bc13fe', // Lvl 10: Purple Neon
    '#ffffff', // Lvl 11: White
    '#000000', // Lvl 12: Black Matter
];

interface Asteroid {
    id: number;
    x: number;
    y: number;
    hp: number;
    maxHp: number;
    value: number;
    speed: number;
    type: 'normal' | 'gold' | 'boss';
    size: number;
}

interface Laser {
    id: number;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    color: string;
    life: number;
    width: number;
}

const UPGRADE_CONFIG = {
    orbitSlots: { name: 'Orbit Expansion', base: 500, mult: 2.5, max: 5, desc: 'Unlock +1 Orbit Slot' },
    shipLevel: { name: 'Adv. Fabrication', base: 1000, mult: 3, max: 5, desc: 'Buy higher level ships' },
    crateSpeed: { name: 'Logistics Net', base: 250, mult: 1.5, max: 10, desc: 'Crates drop faster' },
};

const MergeShips: React.FC = () => {
    // --- STATE ---
    const [credits, setCredits] = useState(100);
    const [hangar, setHangar] = useState<(MergeShip | null)[]>(Array(HANGAR_SLOTS).fill(null));
    const [orbit, setOrbit] = useState<(MergeShip | null)[]>(Array(3).fill(null)); 
    
    const [tech, setTech] = useState<MergeUpgradeState>({ orbitSlots: 0, shipLevel: 0, crateSpeed: 0 });
    const [shipsPurchased, setShipsPurchased] = useState(0);
    const [highestLevel, setHighestLevel] = useState(1);
    
    // Mechanics
    const [showShop, setShowShop] = useState(false);
    const [totalDps, setTotalDps] = useState(0);
    const [offlineProfit, setOfflineProfit] = useState<{time: number, amount: number} | null>(null);
    const [selectedShip, setSelectedShip] = useState<{ship: MergeShip, index: number, region: 'hangar' | 'orbit'} | null>(null);
    const [bossWarning, setBossWarning] = useState(false);
    
    // UI Effects
    const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
    const [dragging, setDragging] = useState<{ origin: 'hangar' | 'orbit', index: number } | null>(null);
    const [dragOver, setDragOver] = useState<{ target: 'hangar' | 'orbit', index: number } | null>(null);

    // Visual Refs
    const asteroidsRef = useRef<Asteroid[]>([]);
    const lasersRef = useRef<Laser[]>([]);
    const particlesRef = useRef<Particle[]>([]);
    const orbitShipsRef = useRef<(MergeShip | null)[]>([]); 
    const lastTimeRef = useRef<number>(0);
    const spawnTimerRef = useRef<number>(0);
    const fireTimersRef = useRef<number[]>([]); 
    
    const [_, setRenderTrigger] = useState(0); 

    // Sync State to Refs
    useEffect(() => { orbitShipsRef.current = orbit; }, [orbit]);

    // Resize Orbit array based on Tech
    useEffect(() => {
        const targetSize = 3 + tech.orbitSlots;
        setOrbit(prev => {
            if (prev.length === targetSize) return prev;
            const next = [...prev];
            while (next.length < targetSize) next.push(null);
            return next;
        });
        fireTimersRef.current = Array(targetSize).fill(0);
    }, [tech.orbitSlots]);

    // Income Logic
    const getShipDps = (level: number) => Math.pow(2, level - 1) * 10; 
    
    // Calculate Total DPS for UI
    useEffect(() => {
        const dps = orbit.reduce((acc, s) => acc + (s ? getShipDps(s.level) : 0), 0);
        setTotalDps(dps);
    }, [orbit]);

    // Derived Cost
    const purchaseLevel = 1 + tech.shipLevel;
    const nextShipCost = Math.floor(BASE_SHIP_COST * Math.pow(COST_SCALE, shipsPurchased) * Math.pow(1.8, tech.shipLevel));
    
    // --- GAME LOOP ---
    const gameLoop = useCallback((timestamp: number) => {
        if (!lastTimeRef.current) lastTimeRef.current = timestamp;
        const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.1); 
        lastTimeRef.current = timestamp;

        // 1. Spawn Asteroids
        spawnTimerRef.current -= dt;
        if (spawnTimerRef.current <= 0) {
            const isBoss = Math.random() < 0.05;
            const isGold = !isBoss && Math.random() < 0.1;
            
            if (isBoss) {
                setBossWarning(true);
                setTimeout(() => setBossWarning(false), 3000);
            }

            const hpScale = Math.pow(2, highestLevel - 1) * 20;

            asteroidsRef.current.push({
                id: Math.random(),
                x: Math.random() * 80 + 10,
                y: -20,
                hp: isBoss ? hpScale * 15 : isGold ? hpScale * 3 : hpScale,
                maxHp: isBoss ? hpScale * 15 : isGold ? hpScale * 3 : hpScale,
                value: (isBoss ? 1000 : isGold ? 100 : 10) * Math.pow(1.5, highestLevel - 1),
                speed: (isBoss ? 4 : isGold ? 12 : 8),
                type: isBoss ? 'boss' : isGold ? 'gold' : 'normal',
                size: isBoss ? 80 : isGold ? 40 : 30
            });
            spawnTimerRef.current = isBoss ? 6 : 1.5; 
        }

        // 2. Move Asteroids
        asteroidsRef.current.forEach(a => {
            a.y += a.speed * dt;
        });
        asteroidsRef.current = asteroidsRef.current.filter(a => a.y < 120 && a.hp > 0);

        // 3. Orbit Ships Fire
        orbitShipsRef.current.forEach((ship, idx) => {
            if (!ship) return;
            
            fireTimersRef.current[idx] -= dt;
            if (fireTimersRef.current[idx] <= 0) {
                const validTargets = asteroidsRef.current.filter(a => a.y > 0 && a.y < 90);
                if (validTargets.length > 0) {
                    const target = validTargets.reduce((prev, curr) => curr.y > prev.y ? curr : prev);
                    
                    const dps = getShipDps(ship.level);
                    target.hp -= dps;
                    
                    const startX = (idx + 1) * (100 / (orbitShipsRef.current.length + 1));
                    lasersRef.current.push({
                        id: Math.random(),
                        startX: startX,
                        startY: 90,
                        endX: target.x + (Math.random()*4-2),
                        endY: target.y + (Math.random()*4-2),
                        color: SHIP_COLORS[(ship.level - 1) % SHIP_COLORS.length],
                        life: 0.15,
                        width: Math.min(8, 2 + ship.level * 0.5)
                    });
                    
                    fireTimersRef.current[idx] = 0.5; // Fire rate: 2/s

                    if (target.hp <= 0) {
                        setCredits(prev => prev + target.value);
                        createParticles(target.x, target.y, target.type === 'gold' ? '#facc15' : target.type === 'boss' ? '#bc13fe' : '#ef4444', target.type === 'boss' ? 20 : 8);
                        showFloatText(target.x, target.y, `+$${formatNumber(target.value)}`, target.type === 'gold' ? '#facc15' : '#fff');
                    }
                }
            }
        });

        // 4. Update Visuals
        lasersRef.current = lasersRef.current.filter(l => {
            l.life -= dt;
            return l.life > 0;
        });
        
        particlesRef.current = particlesRef.current.map(p => ({
            ...p,
            x: p.x + p.vx * dt * 60,
            y: p.y + p.vy * dt * 60,
            life: p.life - 2 * dt
        })).filter(p => p.life > 0);

        requestAnimationFrame(gameLoop);
        setRenderTrigger(prev => prev + 1); 
    }, [highestLevel]);

    useEffect(() => {
        const frame = requestAnimationFrame(gameLoop);
        return () => cancelAnimationFrame(frame);
    }, [gameLoop]);

    // Crate Drop Effect
    useEffect(() => {
        const baseTime = 15000;
        const reduction = tech.crateSpeed * 1000;
        const delay = Math.max(2000, baseTime - reduction);

        const timer = setInterval(() => {
             setHangar(prev => {
                 const emptyIndices = prev.map((s, i) => s === null ? i : -1).filter(i => i !== -1);
                 if (emptyIndices.length > 0) {
                     const idx = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
                     const newHangar = [...prev];
                     const lvl = Math.max(1, Math.floor(highestLevel / 3));
                     newHangar[idx] = { id: Date.now().toString(), level: lvl, isCrate: true };
                     return newHangar;
                 }
                 return prev;
             });
        }, delay);
        return () => clearInterval(timer);
    }, [tech.crateSpeed, highestLevel]);


    // --- HELPERS ---
    const createParticles = (x: number, y: number, color: string, count: number) => {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 2 + 1;
            particlesRef.current.push({
                id: Math.random(),
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0,
                color
            });
        }
    };

    const showFloatText = (x: number, y: number, text: string, color: string) => {
        setFloatingTexts(prev => [...prev, {
            id: Date.now() + Math.random(),
            x, y, text, opacity: 1, isCrit: true
        }]);
    };

    // --- INTERACTIONS ---
    const buyShip = () => {
        if (credits >= nextShipCost) {
            const idx = hangar.findIndex(s => s === null);
            if (idx !== -1) {
                setCredits(prev => prev - nextShipCost);
                setShipsPurchased(prev => prev + 1);
                setHangar(prev => {
                    const next = [...prev];
                    next[idx] = { id: Date.now().toString(), level: purchaseLevel };
                    return next;
                });
                setHighestLevel(prev => Math.max(prev, purchaseLevel));
            }
        }
    };
    
    const buyTech = (key: keyof MergeUpgradeState) => {
        const cfg = UPGRADE_CONFIG[key];
        const currentLvl = tech[key];
        if (currentLvl >= cfg.max) return;
        
        const cost = Math.floor(cfg.base * Math.pow(cfg.mult, currentLvl));
        if (credits >= cost) {
            setCredits(prev => prev - cost);
            setTech(prev => ({ ...prev, [key]: currentLvl + 1 }));
        }
    };

    const openCrate = (index: number) => {
        setHangar(prev => {
            const next = [...prev];
            const item = next[index];
            if (item && item.isCrate) {
                next[index] = { ...item, isCrate: false };
                showFloatText(50, 50, `Lv.${item.level} FOUND!`, '#10b981');
            }
            return next;
        });
    };

    const handleShipClick = (ship: MergeShip, index: number, region: 'hangar' | 'orbit') => {
        if (ship.isCrate) {
            if (region === 'hangar') openCrate(index);
        } else {
            setSelectedShip({ ship, index, region });
        }
    };

    const sellShip = () => {
        if (!selectedShip) return;
        const { ship, index, region } = selectedShip;
        
        // Sell Value = ~50% of cost to reach this level
        // Approximation: Base Cost * 2^(level-1) * 0.5
        const value = Math.floor(BASE_SHIP_COST * Math.pow(2, ship.level - 1) * 0.5);
        
        setCredits(prev => prev + value);
        showFloatText(50, 50, `SOLD +$${formatNumber(value)}`, '#ef4444');
        
        if (region === 'hangar') {
            setHangar(prev => { const n = [...prev]; n[index] = null; return n; });
        } else {
            setOrbit(prev => { const n = [...prev]; n[index] = null; return n; });
        }
        setSelectedShip(null);
    };

    // Drag & Drop
    const handleDragStart = (origin: 'hangar' | 'orbit', index: number) => {
        const item = origin === 'hangar' ? hangar[index] : orbit[index];
        if (item && !item.isCrate) {
            setDragging({ origin, index });
            setSelectedShip(null); // Close modal on drag
        }
    };

    const handleDrop = (target: 'hangar' | 'orbit', targetIndex: number) => {
        if (!dragging) return;
        
        const sourceList = dragging.origin === 'hangar' ? hangar : orbit;
        const targetList = target === 'hangar' ? hangar : orbit;
        const sourceItem = sourceList[dragging.index];
        const targetItem = targetList[targetIndex];

        if (!sourceItem) return;

        const newHangar = [...hangar];
        const newOrbit = [...orbit];
        const setSource = (val: MergeShip | null) => dragging.origin === 'hangar' ? newHangar[dragging.index] = val : newOrbit[dragging.index] = val;
        const setTarget = (val: MergeShip | null) => target === 'hangar' ? newHangar[targetIndex] = val : newOrbit[targetIndex] = val;

        if (target === 'hangar' && targetItem && !targetItem.isCrate && targetItem.level === sourceItem.level && targetItem.id !== sourceItem.id) {
            setSource(null);
            setTarget({ ...targetItem, level: targetItem.level + 1, id: Date.now().toString() });
            setHighestLevel(prev => Math.max(prev, targetItem.level + 1));
            showFloatText(50, 50, "MERGE!", "#a855f7");
        } 
        else if (!targetItem?.isCrate) {
            setSource(targetItem || null);
            setTarget(sourceItem);
        }

        setHangar(newHangar);
        setOrbit(newOrbit);
        setDragging(null);
        setDragOver(null);
    };

    // --- SAVE SYSTEM FIX ---
    const saveStateRef = useRef({ credits, hangar, orbit, tech, shipsPurchased, highestLevel });

    // Keep ref updated
    useEffect(() => {
        saveStateRef.current = { credits, hangar, orbit, tech, shipsPurchased, highestLevel };
    }, [credits, hangar, orbit, tech, shipsPurchased, highestLevel]);

    const saveGame = useCallback(() => {
        localStorage.setItem(MERGE_SAVE_KEY, JSON.stringify({ 
            ...saveStateRef.current,
            lastSaveTime: Date.now() 
        }));
    }, []);

    // Initial Load
    useEffect(() => {
        const saved = localStorage.getItem(MERGE_SAVE_KEY);
        if (saved) {
            try {
                const data = JSON.parse(saved);
                if (data.credits) setCredits(data.credits);
                if (data.hangar) setHangar(data.hangar);
                if (data.orbit) setOrbit(data.orbit); 
                if (data.tech) setTech(data.tech);
                if (data.shipsPurchased) setShipsPurchased(data.shipsPurchased);
                if (data.highestLevel) setHighestLevel(data.highestLevel);

                // Offline Calc
                if (data.lastSaveTime) {
                    const now = Date.now();
                    const seconds = (now - data.lastSaveTime) / 1000;
                    if (seconds > 60) {
                         // Calc offline dps
                         const loadedOrbit = data.orbit || [];
                         const dps = loadedOrbit.reduce((acc: number, s: any) => acc + (s ? Math.pow(2, s.level - 1) * 10 : 0), 0);
                         
                         // Efficiency factor 0.5 (asteroids need to spawn)
                         const earning = Math.floor(dps * seconds * 0.5);
                         if (earning > 0) {
                             setCredits(prev => prev + earning);
                             setOfflineProfit({ time: seconds, amount: earning });
                         }
                    }
                }
            } catch(e) {}
        }
    }, []);

    // Auto Save & Event Listeners
    useEffect(() => {
        const t = setInterval(saveGame, 5000);
        
        const handleForceSave = () => saveGame();
        const handleBeforeUnload = () => saveGame();

        window.addEventListener('game-save-trigger', handleForceSave);
        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            clearInterval(t);
            window.removeEventListener('game-save-trigger', handleForceSave);
            window.removeEventListener('beforeunload', handleBeforeUnload);
            saveGame();
        };
    }, [saveGame]);

    const renderShip = (level: number) => {
        const color = SHIP_COLORS[(level - 1) % SHIP_COLORS.length];
        return (
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg p-1.5 pointer-events-none">
                <defs>
                    <filter id={`glow-${level}`}>
                        <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                        <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                </defs>
                <g filter={`url(#glow-${level})`}>
                    <path d="M50 10 L80 80 L50 70 L20 80 Z" fill="#1e293b" stroke={color} strokeWidth="3" />
                    <circle cx="50" cy="50" r={level * 1.5 + 5} fill={color} className="animate-pulse" />
                    {level > 3 && <path d="M20 60 L5 80 L20 80 Z M80 60 L95 80 L80 80 Z" fill={color} opacity="0.8" />}
                    {level > 6 && <path d="M50 0 L60 20 L40 20 Z" fill={color} />}
                    {level > 9 && <circle cx="50" cy="50" r="30" stroke="white" strokeWidth="1" fill="none" className="animate-spin-slow" />}
                </g>
                <text x="50" y="90" textAnchor="middle" fontSize="16" fill="white" fontWeight="bold">Lv.{level}</text>
            </svg>
        );
    };

    return (
        <div className="w-full h-full bg-slate-950 flex flex-col font-sans select-none text-white relative overflow-hidden">
             
             {/* --- SPACE VIEW --- */}
             <div className="flex-1 relative bg-black overflow-hidden border-b-2 border-neon-blue/50 group">
                 <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                 
                 {/* Boss Warning */}
                 {bossWarning && (
                     <div className="absolute inset-0 z-50 flex items-center justify-center bg-purple-900/30 backdrop-blur-[2px] animate-pulse">
                         <div className="text-5xl font-black text-purple-400 tracking-[0.5em] animate-bounce shadow-black drop-shadow-lg">
                             ⚠️ BOSS DETECTED ⚠️
                         </div>
                     </div>
                 )}

                 {/* Asteroids */}
                 {asteroidsRef.current.map(a => (
                     <div 
                        key={a.id} 
                        className="absolute flex items-center justify-center transition-transform"
                        style={{ 
                            left: `${a.x}%`, 
                            top: `${a.y}%`, 
                            width: `${a.size}px`, 
                            height: `${a.size}px`,
                            transform: `translate(-50%, -50%) rotate(${a.y * 2}deg)`
                        }}
                     >
                         <div className={`w-full h-full rounded-full border-2 ${a.type === 'boss' ? 'border-purple-500 bg-purple-900 shadow-[0_0_30px_purple]' : a.type === 'gold' ? 'border-yellow-400 bg-yellow-900 shadow-[0_0_15px_gold]' : 'border-gray-500 bg-gray-800'}`}>
                             {a.type === 'boss' && <div className="absolute inset-0 flex items-center justify-center text-xs font-bold animate-pulse">BOSS</div>}
                         </div>
                         <div className="absolute -top-3 w-full h-1.5 bg-gray-700 rounded-full border border-black">
                             <div className="h-full bg-red-500" style={{ width: `${(a.hp / a.maxHp)*100}%` }}></div>
                         </div>
                     </div>
                 ))}
                 
                 {/* Lasers */}
                 <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                     {lasersRef.current.map(l => (
                         <line 
                            key={l.id} 
                            x1={`${l.startX}%`} y1={`${l.startY}%`} 
                            x2={`${l.endX}%`} y2={`${l.endY}%`} 
                            stroke={l.color} 
                            strokeWidth={l.width}
                            strokeLinecap="round"
                            className="drop-shadow-[0_0_8px_currentColor]"
                         />
                     ))}
                 </svg>

                 {/* Particles */}
                 {particlesRef.current.map(p => (
                     <div 
                        key={p.id}
                        className="absolute w-1 h-1 rounded-full pointer-events-none z-20"
                        style={{ left: `${p.x}%`, top: `${p.y}%`, backgroundColor: p.color, opacity: p.life, transform: `scale(${p.life})` }}
                     ></div>
                 ))}

                 {/* Floating Text */}
                 {floatingTexts.map(ft => (
                     <div 
                        key={ft.id}
                        className="absolute pointer-events-none z-50 font-black text-xl animate-float"
                        style={{ left: `${ft.x}%`, top: `${ft.y}%`, color: ft.isCrit ? ft.text : '#fff', textShadow: '0 0 5px black' }}
                     >
                         {ft.text}
                     </div>
                 ))}
                 
                 {/* Top Stats */}
                 <div className="absolute top-4 left-4 z-40 bg-black/50 px-3 py-1 rounded border border-white/10 backdrop-blur-sm">
                     <div className="text-xs text-gray-400 font-bold tracking-widest">FLEET DPS</div>
                     <div className="text-xl font-mono text-neon-blue">{formatNumber(totalDps)}/s</div>
                 </div>

                 {/* --- ORBIT DOCK --- */}
                 <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-900 to-transparent flex items-end justify-center gap-2 pb-2 px-4 z-10">
                     {orbit.map((ship, i) => (
                         <div 
                            key={`orbit-${i}`}
                            onClick={() => ship && handleShipClick(ship, i, 'orbit')}
                            onDragOver={(e) => { e.preventDefault(); setDragOver({ target: 'orbit', index: i }); }}
                            onDrop={() => handleDrop('orbit', i)}
                            onDragEnter={() => setDragOver({ target: 'orbit', index: i })}
                            onDragLeave={() => setDragOver(null)}
                            draggable={!!ship}
                            onDragStart={() => handleDragStart('orbit', i)}
                            className={`
                                relative w-16 h-16 rounded-t-lg border-x border-t border-b-0 border-white/20 flex items-center justify-center transition-all bg-black/40
                                ${dragOver?.target === 'orbit' && dragOver?.index === i ? 'bg-neon-blue/20 border-neon-blue' : ''}
                                ${ship ? 'cursor-pointer hover:bg-white/5' : ''}
                            `}
                         >
                             {ship ? renderShip(ship.level) : <span className="text-white/10 text-xs font-mono">SLOT {i+1}</span>}
                             {ship && fireTimersRef.current[i] > 0.4 && (
                                 <div className="absolute -top-4 w-4 h-10 bg-gradient-to-t from-white to-transparent opacity-50 blur-sm"></div>
                             )}
                         </div>
                     ))}
                     {tech.orbitSlots < 5 && (
                         <div 
                            onClick={() => setShowShop(true)}
                            className="w-16 h-16 rounded-t-lg border-x border-t border-b-0 border-dashed border-white/10 flex items-center justify-center text-gray-600 cursor-pointer hover:bg-white/5 hover:text-white transition-colors"
                         >
                             +
                         </div>
                     )}
                 </div>
             </div>

             {/* --- CONTROLS STRIP --- */}
             <div className="h-16 bg-slate-900 border-b border-white/10 flex items-center justify-between px-4 z-20 shadow-lg relative">
                 <div className="flex flex-col">
                     <span className="text-[10px] text-gray-500 uppercase tracking-widest">CREDITS</span>
                     <span className="text-2xl font-mono text-neon-green font-bold">${formatNumber(credits)}</span>
                 </div>

                 <div className="flex gap-2">
                     <button 
                        onClick={() => setShowShop(!showShop)}
                        className={`px-4 py-2 rounded font-bold text-xs flex items-center gap-2 transition-all ${showShop ? 'bg-white text-black' : 'bg-slate-800 text-neon-blue border border-neon-blue'}`}
                     >
                         <span>🛠️</span> UPGRADES
                     </button>
                     <button
                        onClick={buyShip}
                        disabled={credits < nextShipCost || !hangar.some(s => s === null)}
                        className={`px-6 py-2 rounded font-bold text-xs flex flex-col items-center leading-tight transition-all
                            ${credits >= nextShipCost && hangar.some(s => s === null) ? 'bg-neon-blue text-black hover:scale-105 shadow-[0_0_15px_rgba(0,243,255,0.4)]' : 'bg-slate-800 text-gray-500 cursor-not-allowed'}
                        `}
                     >
                         <span>BUY SHIP Lv.{purchaseLevel}</span>
                         <span className="text-[10px] opacity-70">${formatNumber(nextShipCost)}</span>
                     </button>
                 </div>
             </div>

             {/* --- HANGAR GRID --- */}
             <div className="flex-1 bg-slate-950 p-4 relative z-10 overflow-y-auto">
                 <div className="grid grid-cols-4 gap-3 md:gap-4 max-w-2xl mx-auto">
                     {hangar.map((ship, i) => (
                         <div 
                            key={`hangar-${i}`}
                            onClick={() => ship && handleShipClick(ship, i, 'hangar')}
                            onDragOver={(e) => { e.preventDefault(); setDragOver({ target: 'hangar', index: i }); }}
                            onDrop={() => handleDrop('hangar', i)}
                            onDragEnter={() => setDragOver({ target: 'hangar', index: i })}
                            onDragLeave={() => setDragOver(null)}
                            draggable={!!ship && !ship.isCrate}
                            onDragStart={() => handleDragStart('hangar', i)}
                            className={`
                                aspect-square rounded-xl border-2 flex items-center justify-center relative transition-all
                                ${dragOver?.target === 'hangar' && dragOver?.index === i ? 'bg-white/10 border-white scale-105' : 'border-slate-800 bg-slate-900'}
                                ${ship?.isCrate ? 'cursor-pointer hover:scale-105 animate-bounce border-yellow-500/50' : ship ? 'cursor-pointer hover:bg-slate-800' : ''}
                            `}
                         >
                             {ship?.isCrate ? (
                                 <div className="text-4xl filter drop-shadow-[0_0_10px_gold]">📦</div>
                             ) : ship ? (
                                 renderShip(ship.level)
                             ) : (
                                 <div className="w-2 h-2 rounded-full bg-slate-800"></div>
                             )}
                         </div>
                     ))}
                 </div>
             </div>

             {/* --- MODALS --- */}
             
             {/* Tech Shop */}
             {showShop && (
                 <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end md:items-center justify-center animate-in slide-in-from-bottom">
                     <div className="bg-slate-900 border border-white/20 w-full max-w-lg rounded-t-2xl md:rounded-2xl p-6 shadow-2xl">
                         <div className="flex justify-between items-center mb-6">
                             <h3 className="font-display font-bold text-xl text-white">TECH BAY</h3>
                             <button onClick={() => setShowShop(false)} className="text-gray-400 hover:text-white text-xl">✕</button>
                         </div>
                         
                         <div className="space-y-4">
                             {(Object.keys(UPGRADE_CONFIG) as (keyof MergeUpgradeState)[]).map(key => {
                                 const cfg = UPGRADE_CONFIG[key];
                                 const current = tech[key];
                                 const isMax = current >= cfg.max;
                                 const cost = Math.floor(cfg.base * Math.pow(cfg.mult, current));
                                 const canAfford = credits >= cost;
                                 
                                 return (
                                     <div key={key} className="bg-black/30 p-4 rounded-lg flex items-center justify-between border border-white/5">
                                         <div>
                                             <div className="font-bold text-neon-blue">{cfg.name} <span className="text-xs text-gray-500 ml-2">Lvl {current}/{cfg.max}</span></div>
                                             <div className="text-xs text-gray-400">{cfg.desc}</div>
                                         </div>
                                         <button
                                            onClick={() => buyTech(key)}
                                            disabled={isMax || !canAfford}
                                            className={`px-4 py-2 rounded text-xs font-bold w-24 ${
                                                isMax ? 'bg-green-900 text-green-400 cursor-default' :
                                                canAfford ? 'bg-neon-blue text-black hover:bg-white' :
                                                'bg-slate-800 text-gray-600'
                                            }`}
                                         >
                                             {isMax ? 'MAX' : `$${formatNumber(cost)}`}
                                         </button>
                                     </div>
                                 )
                             })}
                         </div>
                     </div>
                 </div>
             )}

             {/* Ship Inspector */}
             {selectedShip && (
                 <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-[2px] animate-in fade-in" onClick={() => setSelectedShip(null)}>
                     <div className="bg-slate-800 border border-blue-500 p-6 rounded-2xl w-72 text-center shadow-[0_0_50px_rgba(59,130,246,0.3)]" onClick={e => e.stopPropagation()}>
                         <div className="text-gray-400 text-xs font-bold tracking-widest mb-4 uppercase">{selectedShip.region === 'hangar' ? 'Hangar Unit' : 'Active Duty'}</div>
                         <div className="w-32 h-32 mx-auto mb-4 relative">
                             {renderShip(selectedShip.ship.level)}
                         </div>
                         <h3 className="text-2xl font-black text-white mb-2">LEVEL {selectedShip.ship.level}</h3>
                         <div className="bg-black/40 rounded p-3 mb-4 space-y-2">
                             <div className="flex justify-between text-sm">
                                 <span className="text-gray-400">DPS</span>
                                 <span className="text-neon-blue font-bold">{formatNumber(getShipDps(selectedShip.ship.level))}</span>
                             </div>
                             <div className="flex justify-between text-sm">
                                 <span className="text-gray-400">Rate</span>
                                 <span className="text-white">2.0/s</span>
                             </div>
                         </div>
                         <div className="flex gap-2">
                             <button 
                                onClick={() => setSelectedShip(null)}
                                className="flex-1 py-2 bg-slate-700 text-white rounded font-bold hover:bg-slate-600"
                             >
                                CLOSE
                             </button>
                             <button 
                                onClick={sellShip}
                                className="flex-1 py-2 bg-red-900/50 text-red-400 border border-red-900 rounded font-bold hover:bg-red-900 hover:text-white"
                             >
                                SELL (${formatNumber(Math.floor(BASE_SHIP_COST * Math.pow(2, selectedShip.ship.level - 1) * 0.5))})
                             </button>
                         </div>
                     </div>
                 </div>
             )}

             {/* Offline Report */}
             {offlineProfit && (
                 <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/90 animate-in zoom-in-95">
                     <div className="bg-slate-900 border border-green-500 p-8 rounded-2xl w-full max-w-sm text-center shadow-[0_0_100px_rgba(16,185,129,0.2)]">
                         <div className="text-6xl mb-4">💤</div>
                         <h2 className="text-2xl font-black text-white mb-2">FLEET REPORT</h2>
                         <p className="text-gray-400 text-sm mb-6">Your orbit ships continued to defend the sector while you were away.</p>
                         <div className="bg-black/40 p-4 rounded-lg mb-6">
                             <div className="flex justify-between items-center mb-2">
                                 <span className="text-xs text-gray-500 font-bold">TIME AWAY</span>
                                 <span className="font-mono text-white">{Math.floor(offlineProfit.time / 60)}m {Math.floor(offlineProfit.time % 60)}s</span>
                             </div>
                             <div className="flex justify-between items-center">
                                 <span className="text-xs text-gray-500 font-bold">EARNINGS</span>
                                 <span className="font-mono text-neon-green text-xl font-bold">+${formatNumber(offlineProfit.amount)}</span>
                             </div>
                         </div>
                         <button 
                            onClick={() => setOfflineProfit(null)}
                            className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded shadow-lg transition-transform hover:scale-105"
                         >
                             COLLECT BOUNTY
                         </button>
                     </div>
                 </div>
             )}

        </div>
    );
};

export default MergeShips;
