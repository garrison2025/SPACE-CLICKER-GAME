
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MarsBuilding, MarsResourceState, FloatingText } from '../types';
import { formatNumber } from '../utils';

const MARS_SAVE_KEY = 'mars_colony_save_v2';

interface MarsParticle {
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    color: string;
    size: number;
}

const INITIAL_BUILDINGS: MarsBuilding[] = [
    {
        id: 'solar_panel',
        name: 'Solar Panel',
        description: 'Generates Energy from sunlight.',
        cost: 10,
        energyCost: 0,
        production: { type: 'energy', amount: 5 },
        count: 1,
        icon: '☀️'
    },
    {
        id: 'miner_bot',
        name: 'Auto-Excavator',
        description: 'Automates mineral extraction.',
        cost: 50,
        energyCost: 2,
        production: { type: 'minerals', amount: 2 },
        count: 0,
        icon: '🤖'
    },
    {
        id: 'greenhouse',
        name: 'Hydroponics',
        description: 'Converts Energy into Food.',
        cost: 100,
        energyCost: 5,
        production: { type: 'food', amount: 2 },
        count: 0,
        icon: '🌱'
    },
    {
        id: 'oxy_gen',
        name: 'Oxygenator',
        description: 'Splits CO2 into breathable Oxygen.',
        cost: 150,
        energyCost: 8,
        production: { type: 'oxygen', amount: 3 },
        count: 0,
        icon: '💨'
    },
    {
        id: 'habitat',
        name: 'Habitat Module',
        description: 'Housing for colonists. Requires Oxygen/Food.',
        cost: 500,
        energyCost: 10,
        production: { type: 'housing', amount: 5 },
        count: 1,
        icon: '🏠'
    },
    {
        id: 'reactor',
        name: 'Fusion Reactor',
        description: 'Massive energy output.',
        cost: 5000,
        energyCost: 0,
        production: { type: 'energy', amount: 100 },
        count: 0,
        icon: '⚛️'
    }
];

const MarsColony: React.FC = () => {
    // --- STATE ---
    const [resources, setResources] = useState<MarsResourceState>({
        minerals: 0,
        credits: 0,
        population: 0,
        energy: { current: 100, max: 100, production: 0, consumption: 0 },
        food: { current: 100, max: 100, production: 0 },
        oxygen: { current: 100, max: 100, production: 0 }
    });
    
    const [buildings, setBuildings] = useState<MarsBuilding[]>(INITIAL_BUILDINGS);
    const [lastSaved, setLastSaved] = useState(Date.now());
    
    // Visual State
    const [clicks, setClicks] = useState<FloatingText[]>([]);
    const [particles, setParticles] = useState<MarsParticle[]>([]);
    const frameRef = useRef<number>();

    // --- GAME LOOP (Logic) ---
    useEffect(() => {
        const timer = setInterval(() => {
            setResources(prev => {
                const next = { ...prev };
                
                // 1. Calculate Production & Consumption
                let energyProd = 0;
                let energyCons = 0;
                let foodProd = 0;
                let oxyProd = 0;
                let housingCap = 0;
                let mineralProd = 0;

                buildings.forEach(b => {
                    energyCons += b.energyCost * b.count;
                    if (b.production.type === 'energy') energyProd += b.production.amount * b.count;
                    if (b.production.type === 'food') foodProd += b.production.amount * b.count;
                    if (b.production.type === 'oxygen') oxyProd += b.production.amount * b.count;
                    if (b.production.type === 'housing') housingCap += b.production.amount * b.count;
                    if (b.production.type === 'minerals') mineralProd += b.production.amount * b.count;
                });

                // Energy Logic
                next.energy.production = energyProd;
                next.energy.consumption = energyCons;
                const efficiency = next.energy.current > 0 || energyProd >= energyCons ? 1 : 0.1;
                
                next.energy.current = Math.min(next.energy.max, Math.max(0, next.energy.current + (energyProd - energyCons)));

                // Resource Logic (scaled by efficiency)
                next.food.production = foodProd * efficiency;
                next.food.current = Math.min(next.food.max, Math.max(0, next.food.current + next.food.production - (prev.population * 0.1)));

                next.oxygen.production = oxyProd * efficiency;
                next.oxygen.current = Math.min(next.oxygen.max, Math.max(0, next.oxygen.current + next.oxygen.production - (prev.population * 0.1)));

                next.minerals += mineralProd * efficiency;

                // Population Logic
                if (next.food.current > 50 && next.oxygen.current > 50 && prev.population < housingCap) {
                    if (Math.random() < 0.1) next.population += 1;
                }
                if (next.food.current <= 0 || next.oxygen.current <= 0) {
                     if (Math.random() < 0.2 && next.population > 0) next.population -= 1;
                }

                // Credit Generation
                next.credits += prev.population * 0.05;

                return next;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [buildings]);

    // --- PHYSICS LOOP (Visuals) ---
    const visualLoop = useCallback(() => {
        setParticles(prev => prev.map(p => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.5, // Gravity
            life: p.life - 0.05
        })).filter(p => p.life > 0));

        setClicks(prev => prev.filter(c => c.opacity > 0).map(c => ({...c, opacity: c.opacity - 0.02, y: c.y - 1})));

        frameRef.current = requestAnimationFrame(visualLoop);
    }, []);

    useEffect(() => {
        frameRef.current = requestAnimationFrame(visualLoop);
        return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
    }, [visualLoop]);

    // --- ACTIONS ---
    const spawnParticles = (x: number, y: number, color: string, count: number = 8) => {
        const newParticles: MarsParticle[] = [];
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 4 + 2;
            newParticles.push({
                id: Math.random(),
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2,
                life: 1.0,
                color,
                size: Math.random() * 4 + 2
            });
        }
        setParticles(prev => [...prev, ...newParticles]);
    };

    const handleExcavate = (e: React.MouseEvent, bonus: number = 0, color: string = '#fdba74') => {
        e.stopPropagation(); // Prevent bubbling if clicking internal elements
        
        const rect = e.currentTarget.getBoundingClientRect();
        // Fallback for getting coordinates if triggered from a non-mouse event (rare)
        const clientX = e.clientX || (rect.left + rect.width/2);
        const clientY = e.clientY || (rect.top + rect.height/2);

        const amount = 1 + bonus;
        setResources(prev => ({ ...prev, minerals: prev.minerals + amount }));
        
        // Visuals
        setClicks(prev => [...prev, {
            id: Math.random(),
            x: clientX,
            y: clientY - 20,
            text: `+${amount} MINERALS`,
            opacity: 1
        }]);

        spawnParticles(clientX, clientY, color);
    };

    const handleBuy = (id: string) => {
        const building = buildings.find(b => b.id === id);
        if (!building) return;
        
        const cost = Math.floor(building.cost * Math.pow(1.15, building.count));
        if (resources.minerals >= cost) {
            setResources(prev => ({ ...prev, minerals: prev.minerals - cost }));
            setBuildings(prev => prev.map(b => b.id === id ? { ...b, count: b.count + 1 } : b));
        }
    };
    
    // --- PERSISTENCE ---
    // Init Load
    useEffect(() => {
        const saved = localStorage.getItem(MARS_SAVE_KEY);
        if (saved) {
             try {
                 const data = JSON.parse(saved);
                 if (data.resources) setResources(data.resources);
                 if (data.buildings) setBuildings(data.buildings);
             } catch(e) {}
        }
    }, []);

    // Refs for saving logic to avoid closure staleness
    const stateRef = useRef({ resources, buildings });
    useEffect(() => { stateRef.current = { resources, buildings }; }, [resources, buildings]);

    const saveGame = useCallback(() => {
        localStorage.setItem(MARS_SAVE_KEY, JSON.stringify(stateRef.current));
        setLastSaved(Date.now());
    }, []);

    // Save Loop & Events
    useEffect(() => {
        const timer = setInterval(saveGame, 5000);
        
        const handleForceSave = () => {
            saveGame();
        };

        const handleBeforeUnload = () => {
            saveGame();
        };

        window.addEventListener('game-save-trigger', handleForceSave);
        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            clearInterval(timer);
            window.removeEventListener('game-save-trigger', handleForceSave);
            window.removeEventListener('beforeunload', handleBeforeUnload);
            saveGame();
        };
    }, [saveGame]);

    const population = resources.population;

    return (
        <div className="w-full h-full bg-orange-950 relative overflow-hidden flex font-sans select-none text-white">
            {/* Background */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
            
            {/* Particles Overlay */}
            <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
                {particles.map(p => (
                    <div 
                        key={p.id}
                        className="absolute rounded-sm"
                        style={{
                            left: p.x, top: p.y,
                            width: p.size, height: p.size,
                            backgroundColor: p.color,
                            opacity: p.life,
                            transform: `translate(-50%, -50%) rotate(${p.life * 360}deg)`
                        }}
                    />
                ))}
                {clicks.map(c => (
                    <div 
                        key={c.id}
                        className="absolute font-display font-bold text-orange-200 text-lg whitespace-nowrap shadow-black drop-shadow-md"
                        style={{
                            left: c.x, top: c.y,
                            opacity: c.opacity,
                            transform: `translate(-50%, -50%) scale(${0.5 + c.opacity * 0.5})`
                        }}
                    >
                        {c.text}
                    </div>
                ))}
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col relative z-10">
                
                {/* Top HUD */}
                <div className="h-16 bg-black/40 border-b border-orange-500/30 flex items-center justify-between px-6 backdrop-blur-md">
                    <div className="flex gap-6">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-orange-400 font-bold uppercase tracking-widest">MINERALS</span>
                            <span className="text-2xl font-mono font-bold text-white">{formatNumber(resources.minerals)}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] text-yellow-400 font-bold uppercase tracking-widest">CREDITS</span>
                            <span className="text-2xl font-mono font-bold text-white">${formatNumber(resources.credits)}</span>
                        </div>
                         <div className="flex flex-col">
                            <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">COLONISTS</span>
                            <span className="text-2xl font-mono font-bold text-white">{formatNumber(resources.population)}</span>
                        </div>
                    </div>
                </div>

                {/* Planet Viewport */}
                <div className="flex-1 flex items-center justify-center relative perspective-1000">
                    
                    {/* The Interactive Planet */}
                    <div 
                        onClick={(e) => handleExcavate(e, 0)}
                        className="relative w-56 h-56 md:w-72 md:h-72 rounded-full cursor-pointer group active:scale-95 transition-transform duration-100 z-20"
                    >
                        {/* Planet Surface */}
                        <div className={`absolute inset-0 rounded-full bg-gradient-to-tr transition-colors duration-1000 ${population > 100 ? 'from-orange-700 to-emerald-900' : 'from-orange-800 to-red-600'} shadow-[0_0_60px_rgba(234,88,12,0.4)] overflow-hidden border-4 border-orange-900/50 group-hover:border-orange-400/50 transition-colors`}>
                            {/* Craters (CSS Art) */}
                            <div className="absolute top-[20%] left-[30%] w-8 h-8 bg-black/20 rounded-full shadow-inner pointer-events-none"></div>
                            <div className="absolute bottom-[30%] right-[20%] w-12 h-12 bg-black/20 rounded-full shadow-inner pointer-events-none"></div>
                            <div className="absolute top-[50%] left-[10%] w-4 h-4 bg-black/20 rounded-full shadow-inner pointer-events-none"></div>
                            
                            {/* Atmosphere Halo */}
                            {population > 100 && <div className="absolute inset-0 rounded-full shadow-[inset_0_0_40px_rgba(50,200,255,0.3)] pointer-events-none"></div>}

                            {/* Terraforming Layers (Visual Evolution) */}
                            <div className={`absolute inset-0 rounded-full transition-opacity duration-[3000ms] pointer-events-none ${population > 50 ? 'opacity-40' : 'opacity-0'}`}
                                 style={{ background: 'radial-gradient(circle at 30% 70%, #0ea5e9 0%, transparent 60%)' }}></div>
                            
                            <div className={`absolute inset-0 rounded-full transition-opacity duration-[3000ms] pointer-events-none ${population > 150 ? 'opacity-50' : 'opacity-0'}`}
                                 style={{ background: 'radial-gradient(circle at 70% 40%, #22c55e 0%, transparent 50%)', mixBlendMode: 'overlay' }}></div>

                            {/* Buildings Visual Representation (Interactive) */}
                            <div className="absolute inset-0 transition-opacity duration-1000">
                                 {/* Auto Miners (Moving dots) */}
                                 {buildings.find(b => b.id === 'miner_bot')?.count! > 0 && Array.from({length: Math.min(5, buildings.find(b => b.id === 'miner_bot')?.count!)}).map((_, i) => (
                                     <div 
                                        key={i} 
                                        onClick={(e) => handleExcavate(e, 2, '#fbbf24')}
                                        className="absolute w-3 h-3 bg-yellow-400 rounded-sm animate-pulse cursor-pointer hover:scale-150 transition-transform hover:bg-white shadow-[0_0_5px_gold]" 
                                        style={{ top: `${40 + i * 10}%`, left: `${20 + i * 15}%` }}
                                        title="Auto-Miner (Click for bonus)"
                                     ></div>
                                 ))}
                                 {/* Solar Panels Ring */}
                                 {buildings.find(b => b.id === 'solar_panel')?.count! > 0 && (
                                     <div 
                                        onClick={(e) => handleExcavate(e, 1, '#60a5fa')}
                                        className="absolute top-[10%] left-[50%] -translate-x-1/2 w-6 h-6 bg-blue-400 border-2 border-white shadow-[0_0_15px_cyan] cursor-pointer hover:scale-125 transition-transform"
                                        title="Solar Array"
                                     ></div>
                                 )}
                                 {/* Reactor Glow */}
                                 {buildings.find(b => b.id === 'reactor')?.count! > 0 && (
                                     <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-blue-500/20 blur-xl animate-pulse pointer-events-none"></div>
                                 )}
                                 {/* Habs */}
                                 {buildings.find(b => b.id === 'habitat')?.count! > 0 && (
                                     <div 
                                        onClick={(e) => handleExcavate(e, 1, '#ffffff')}
                                        className="absolute bottom-[40%] left-[50%] -translate-x-1/2 w-10 h-10 bg-white/80 rounded-t-full border-2 border-gray-400 cursor-pointer hover:bg-white hover:shadow-[0_0_20px_white] transition-all"
                                        title="Colony Habitat"
                                     ></div>
                                 )}
                                 {/* Greenhouse */}
                                 {buildings.find(b => b.id === 'greenhouse')?.count! > 0 && (
                                     <div 
                                        onClick={(e) => handleExcavate(e, 1, '#4ade80')}
                                        className="absolute bottom-[35%] right-[25%] w-8 h-6 bg-green-500/50 border border-green-300 rounded-sm cursor-pointer hover:bg-green-400 hover:shadow-[0_0_15px_lime] transition-all"
                                        title="Greenhouse"
                                     ></div>
                                 )}
                            </div>
                        </div>
                        
                        {/* Interaction Hint */}
                        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-orange-200 font-display text-sm tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            CLICK TO EXCAVATE
                        </div>
                    </div>
                </div>

                {/* Resource Stats Bar */}
                <div className="h-24 bg-black/60 border-t border-orange-500/30 grid grid-cols-3 gap-4 px-6 py-2">
                     <div className="flex flex-col justify-center">
                         <div className="flex justify-between text-xs text-yellow-500 font-bold mb-1">
                             <span>ENERGY ({resources.energy.production > resources.energy.consumption ? '+' : ''}{resources.energy.production - resources.energy.consumption}/s)</span>
                             <span>{Math.floor(resources.energy.current)}/{resources.energy.max}</span>
                         </div>
                         <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                             <div className="h-full bg-yellow-400" style={{ width: `${(resources.energy.current / resources.energy.max)*100}%` }}></div>
                         </div>
                     </div>
                     <div className="flex flex-col justify-center">
                         <div className="flex justify-between text-xs text-green-500 font-bold mb-1">
                             <span>FOOD</span>
                             <span>{Math.floor(resources.food.current)}/{resources.food.max}</span>
                         </div>
                         <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                             <div className="h-full bg-green-500" style={{ width: `${(resources.food.current / resources.food.max)*100}%` }}></div>
                         </div>
                     </div>
                     <div className="flex flex-col justify-center">
                         <div className="flex justify-between text-xs text-blue-400 font-bold mb-1">
                             <span>OXYGEN</span>
                             <span>{Math.floor(resources.oxygen.current)}/{resources.oxygen.max}</span>
                         </div>
                         <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                             <div className="h-full bg-blue-400" style={{ width: `${(resources.oxygen.current / resources.oxygen.max)*100}%` }}></div>
                         </div>
                     </div>
                </div>

            </div>

            {/* Sidebar Shop */}
            <div className="w-80 bg-orange-950 border-l border-orange-500/30 flex flex-col z-20">
                <div className="p-4 border-b border-orange-500/30 bg-black/20 flex justify-between items-center">
                    <h2 className="font-display font-bold text-xl text-orange-400 tracking-wider">CONSTRUCTION</h2>
                    <button 
                        onClick={saveGame} 
                        className="text-[10px] border border-orange-500/50 text-orange-300 px-2 py-1 rounded hover:bg-orange-900 transition-colors"
                    >
                        SAVE
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {buildings.map(b => {
                        const cost = Math.floor(b.cost * Math.pow(1.15, b.count));
                        const canAfford = resources.minerals >= cost;
                        return (
                            <div 
                                key={b.id}
                                onClick={() => canAfford && handleBuy(b.id)}
                                className={`p-3 rounded border flex items-center gap-3 transition-all select-none
                                    ${canAfford ? 'bg-orange-900/40 border-orange-500/50 hover:bg-orange-800 cursor-pointer active:scale-95' : 'opacity-50 grayscale cursor-not-allowed border-transparent bg-black/20'}
                                `}
                            >
                                <div className="text-2xl w-10 h-10 flex items-center justify-center bg-black/40 rounded">{b.icon}</div>
                                <div className="flex-1">
                                    <div className="flex justify-between">
                                        <span className="font-bold text-sm text-orange-100">{b.name}</span>
                                        <span className="text-xs bg-black/40 px-1.5 rounded text-orange-300">x{b.count}</span>
                                    </div>
                                    <div className="text-[10px] text-orange-200/60 mb-1">{b.description}</div>
                                    <div className="flex justify-between items-center">
                                        <span className={`text-xs font-mono font-bold ${canAfford ? 'text-white' : 'text-red-400'}`}>{formatNumber(cost)} MIN</span>
                                        <span className="text-[10px] text-yellow-500 font-mono">-{b.energyCost}⚡</span>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

        </div>
    );
};

export default MarsColony;
