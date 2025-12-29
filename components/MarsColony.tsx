import React, { useState, useEffect } from 'react';
import { MarsBuilding, MarsResourceState } from '../types';
import { formatNumber } from '../utils';

const MARS_SAVE_KEY = 'mars_colony_save_v2';

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
    
    // --- LOOP ---
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
                // If deficit, shut down systems (simplified: just cap production)
                const efficiency = next.energy.current > 0 || energyProd >= energyCons ? 1 : 0.1;
                
                next.energy.current = Math.min(next.energy.max, Math.max(0, next.energy.current + (energyProd - energyCons)));

                // Resource Logic (scaled by efficiency)
                next.food.production = foodProd * efficiency;
                next.food.current = Math.min(next.food.max, Math.max(0, next.food.current + next.food.production - (prev.population * 0.1)));

                next.oxygen.production = oxyProd * efficiency;
                next.oxygen.current = Math.min(next.oxygen.max, Math.max(0, next.oxygen.current + next.oxygen.production - (prev.population * 0.1)));

                next.minerals += mineralProd * efficiency;

                // Population Logic
                // Grow if resources are abundant (>50%) and housing available
                if (next.food.current > 50 && next.oxygen.current > 50 && prev.population < housingCap) {
                    if (Math.random() < 0.1) next.population += 1;
                }
                // Starve if resources empty
                if (next.food.current <= 0 || next.oxygen.current <= 0) {
                     if (Math.random() < 0.2 && next.population > 0) next.population -= 1;
                }

                // Credit Generation (Tax)
                next.credits += prev.population * 0.05;

                return next;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [buildings]);

    // --- ACTIONS ---
    const handleExcavate = () => {
        setResources(prev => ({ ...prev, minerals: prev.minerals + 1 }));
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
    
    // Save/Load Logic
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

    useEffect(() => {
        const t = setInterval(() => {
             localStorage.setItem(MARS_SAVE_KEY, JSON.stringify({ resources, buildings }));
        }, 5000);
        return () => clearInterval(t);
    }, [resources, buildings]);

    const population = resources.population;

    return (
        <div className="w-full h-full bg-orange-950 relative overflow-hidden flex font-sans select-none text-white">
            {/* Background */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
            
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
                <div className="flex-1 flex items-center justify-center relative">
                    
                    {/* The Planet Logic from Snippet */}
                    <div 
                        onClick={handleExcavate}
                        className="relative w-56 h-56 md:w-72 md:h-72 rounded-full cursor-pointer group active:scale-95 transition-transform duration-100 z-20"
                    >
                        {/* Planet Surface */}
                        <div className={`absolute inset-0 rounded-full bg-gradient-to-tr transition-colors duration-1000 ${population > 100 ? 'from-orange-700 to-emerald-900' : 'from-orange-800 to-red-600'} shadow-[0_0_60px_rgba(234,88,12,0.4)] overflow-hidden border-4 border-orange-900/50`}>
                            {/* Craters (CSS Art) */}
                            <div className="absolute top-[20%] left-[30%] w-8 h-8 bg-black/20 rounded-full shadow-inner"></div>
                            <div className="absolute bottom-[30%] right-[20%] w-12 h-12 bg-black/20 rounded-full shadow-inner"></div>
                            <div className="absolute top-[50%] left-[10%] w-4 h-4 bg-black/20 rounded-full shadow-inner"></div>
                            
                            {/* Atmosphere Halo */}
                            {population > 100 && <div className="absolute inset-0 rounded-full shadow-[inset_0_0_40px_rgba(50,200,255,0.3)]"></div>}

                            {/* Terraforming Layers (Visual Evolution) */}
                            <div className={`absolute inset-0 rounded-full transition-opacity duration-[3000ms] ${population > 50 ? 'opacity-40' : 'opacity-0'}`}
                                 style={{ background: 'radial-gradient(circle at 30% 70%, #0ea5e9 0%, transparent 60%)' }}></div>
                            
                            <div className={`absolute inset-0 rounded-full transition-opacity duration-[3000ms] ${population > 150 ? 'opacity-50' : 'opacity-0'}`}
                                 style={{ background: 'radial-gradient(circle at 70% 40%, #22c55e 0%, transparent 50%)', mixBlendMode: 'overlay' }}></div>

                            {/* Buildings Visual Representation */}
                            <div className="absolute inset-0 transition-opacity duration-1000">
                                 {/* Auto Miners (Moving dots) */}
                                 {buildings.find(b => b.id === 'miner_bot')?.count! > 0 && Array.from({length: Math.min(5, buildings.find(b => b.id === 'miner_bot')?.count!)}).map((_, i) => (
                                     <div key={i} className="absolute w-2 h-2 bg-yellow-400 rounded-sm animate-pulse" style={{ top: `${40 + i * 10}%`, left: `${20 + i * 15}%` }}></div>
                                 ))}
                                 {/* Solar Panels Ring */}
                                 {buildings.find(b => b.id === 'solar_panel')?.count! > 0 && (
                                     <div className="absolute top-[10%] left-[50%] -translate-x-1/2 w-4 h-4 bg-blue-400 border border-white shadow-[0_0_10px_cyan]"></div>
                                 )}
                                 {/* Reactor Glow */}
                                 {buildings.find(b => b.id === 'reactor')?.count! > 0 && (
                                     <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-blue-500/20 blur-xl animate-pulse"></div>
                                 )}
                                 {/* Habs */}
                                 {buildings.find(b => b.id === 'habitat')?.count! > 0 && (
                                     <div className="absolute bottom-[40%] left-[50%] -translate-x-1/2 w-8 h-8 bg-white/80 rounded-t-full border-2 border-gray-400"></div>
                                 )}
                                 {/* Greenhouse */}
                                 {buildings.find(b => b.id === 'greenhouse')?.count! > 0 && (
                                     <div className="absolute bottom-[35%] right-[25%] w-6 h-4 bg-green-500/50 border border-green-300 rounded-sm"></div>
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
                <div className="p-4 border-b border-orange-500/30 bg-black/20">
                    <h2 className="font-display font-bold text-xl text-orange-400 tracking-wider">CONSTRUCTION</h2>
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
