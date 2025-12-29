import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MarsBuilding, MarsResourceState, FloatingText } from '../types';
import { formatNumber } from '../utils';

const MARS_SAVE_KEY = 'mars_colony_save_v2';

// --- CONFIG ---
const INITIAL_BUILDINGS: MarsBuilding[] = [
    {
        id: 'miner_bot',
        name: 'Auto-Miner',
        description: 'Automated rover that extracts surface minerals.',
        cost: 25,
        energyCost: 1, // Consumes Energy
        production: { type: 'minerals', amount: 1 }, // Produces Minerals
        count: 0,
        icon: '🚜'
    },
    {
        id: 'solar_panel',
        name: 'Solar Array',
        description: 'Generates clean energy. Affected by Dust Storms.',
        cost: 15, // Minerals
        energyCost: 0,
        production: { type: 'energy', amount: 5 },
        count: 0,
        icon: '☀️'
    },
    {
        id: 'battery',
        name: 'Power Cell',
        description: 'Stores excess energy for emergencies.',
        cost: 25,
        energyCost: 0,
        production: { type: 'energy', amount: 0 }, 
        count: 0,
        icon: '🔋'
    },
    {
        id: 'greenhouse',
        name: 'Hydroponics',
        description: 'Converts energy into synthetic food.',
        cost: 40,
        energyCost: 2,
        production: { type: 'food', amount: 2 },
        count: 0,
        icon: '🥔'
    },
    {
        id: 'oxy_gen',
        name: 'Atmo Generator',
        description: 'Electrolysis unit. Extracts oxygen from ice.',
        cost: 50,
        energyCost: 3,
        production: { type: 'oxygen', amount: 3 },
        count: 0,
        icon: '🫧'
    },
    {
        id: 'habitat',
        name: 'Hab Module',
        description: 'Living quarters. Increases max population.',
        cost: 100,
        energyCost: 5,
        production: { type: 'housing', amount: 4 },
        count: 0,
        icon: '🏠'
    },
    {
        id: 'reactor',
        name: 'Fusion Reactor',
        description: 'Massive energy output. Immune to Dust Storms.',
        cost: 5000,
        energyCost: 0,
        production: { type: 'energy', amount: 100 },
        count: 0,
        icon: '⚛️'
    }
];

interface Research {
    id: string;
    name: string;
    description: string;
    cost: number; // Credits
    reqPop: number; // Required population to unlock
    effectType: 'production_mult' | 'click_mult' | 'pop_cap' | 'storage_mult';
    target?: string; // 'energy', 'food', 'minerals', etc.
    value: number; // Multiplier (e.g., 1.5 for +50%)
    purchased: boolean;
    icon: string;
}

const INITIAL_RESEARCH: Research[] = [
    { id: 'adv_drill', name: 'Diamond Drills', description: 'Doubles manual mining efficiency.', cost: 100, reqPop: 0, effectType: 'click_mult', value: 2, purchased: false, icon: '💎' },
    { id: 'eff_panels', name: 'Perovskite Cells', description: '+50% Solar Panel output.', cost: 500, reqPop: 10, effectType: 'production_mult', target: 'energy', value: 1.5, purchased: false, icon: '⚡' },
    { id: 'gmo_crops', name: 'GMO Algae', description: '+50% Food production.', cost: 1200, reqPop: 25, effectType: 'production_mult', target: 'food', value: 1.5, purchased: false, icon: '🧬' },
    { id: 'dense_housing', name: 'Bunk Beds', description: '+25% Hab Module capacity.', cost: 2500, reqPop: 50, effectType: 'pop_cap', value: 1.25, purchased: false, icon: '🛏️' },
    { id: 'deep_mining', name: 'Core Boring', description: '+100% Auto-Miner output.', cost: 5000, reqPop: 75, effectType: 'production_mult', target: 'minerals', value: 2, purchased: false, icon: '🌋' },
    { id: 'ai_grid', name: 'Smart Grid AI', description: '+50% Battery capacity & Energy output.', cost: 10000, reqPop: 100, effectType: 'storage_mult', target: 'energy', value: 1.5, purchased: false, icon: '🧠' },
    { id: 'terra_1', name: 'Atmo Stabilizer', description: '+100% Oxygen output.', cost: 25000, reqPop: 150, effectType: 'production_mult', target: 'oxygen', value: 2, purchased: false, icon: '🌍' },
];

interface Artifact {
    id: string;
    name: string;
    description: string;
    effectDescription: string;
    type: 'click_mult' | 'storage_mult' | 'production_mult' | 'pop_cap';
    target?: string;
    value: number;
    icon: string;
    rarity: number; // Lower is rarer
}

const ARTIFACTS_DB: Artifact[] = [
    { id: 'ancient_geode', name: 'Singing Geode', description: 'Resonates with nearby minerals.', effectDescription: '+50% Manual Mining', type: 'click_mult', value: 1.5, icon: '💎', rarity: 0.1 },
    { id: 'alien_cell', name: 'Xeno-Cell', description: 'A battery that never dies.', effectDescription: '+20% Max Energy', type: 'storage_mult', target: 'energy', value: 1.2, icon: '🔋', rarity: 0.05 },
    { id: 'void_root', name: 'Void Root', description: 'Grows in vacuum.', effectDescription: '+10% Food Gen', type: 'production_mult', target: 'food', value: 1.1, icon: '🥕', rarity: 0.08 },
    { id: 'monolith_frag', name: 'Monolith Fragment', description: 'Inspires the colonists.', effectDescription: '+10% Max Pop', type: 'pop_cap', value: 1.1, icon: '🗿', rarity: 0.02 },
    { id: 'star_map', name: 'Star Map', description: 'Coordinates to rich asteroids.', effectDescription: '+10% Mineral Gen', type: 'production_mult', target: 'minerals', value: 1.1, icon: '🗺️', rarity: 0.05 },
];

interface TradeOffer {
    id: number;
    name: string;
    description: string;
    req: { type: 'minerals' | 'credits' | 'food'; amount: number };
    offer: { type: 'credits' | 'minerals' | 'energy' | 'food'; amount: number };
    timeLeft: number;
}

const MarsColony: React.FC = () => {
    // --- STATE ---
    const [minerals, setMinerals] = useState(0);
    const [credits, setCredits] = useState(0);
    const [population, setPopulation] = useState(0);
    
    // Resource Tanks
    const [energy, setEnergy] = useState(100);
    const [food, setFood] = useState(50);
    const [oxygen, setOxygen] = useState(50);

    const [buildings, setBuildings] = useState<MarsBuilding[]>(INITIAL_BUILDINGS);
    const [research, setResearch] = useState<Research[]>(INITIAL_RESEARCH);
    const [discoveredArtifacts, setDiscoveredArtifacts] = useState<string[]>([]);
    
    // Mechanics
    const [clicks, setClicks] = useState<FloatingText[]>([]);
    const [dustStorm, setDustStorm] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [showResearch, setShowResearch] = useState(false);
    const [showArtifactsPanel, setShowArtifactsPanel] = useState(false);
    const [buyAmount, setBuyAmount] = useState<1 | 10>(1);
    const [offlineReport, setOfflineReport] = useState<{time: number, minerals: number, credits: number} | null>(null);
    const [activeTrade, setActiveTrade] = useState<TradeOffer | null>(null);

    // --- DERIVED STATS & MULTIPLIERS ---
    const getMultiplier = useCallback((type: string, target?: string) => {
        let mult = 1;
        
        // Research Bonuses
        research.filter(r => r.purchased).forEach(r => {
            if (r.effectType === type) {
                if (!target || r.target === target) {
                    mult *= r.value;
                }
            }
        });

        // Artifact Bonuses
        discoveredArtifacts.forEach(id => {
            const art = ARTIFACTS_DB.find(a => a.id === id);
            if (art && art.type === type) {
                if (!target || art.target === target) {
                    mult *= art.value;
                }
            }
        });

        return mult;
    }, [research, discoveredArtifacts]);

    // Capacity Logic
    const popCapMult = getMultiplier('pop_cap');
    const storageMult = getMultiplier('storage_mult', 'energy');
    
    const maxPopulation = Math.floor((buildings.find(b => b.id === 'habitat')?.count! * 4 * popCapMult) + 5); 
    const maxEnergy = Math.floor((100 + (buildings.find(b => b.id === 'battery')?.count! * 50)) * storageMult);
    const maxFood = 100 + (buildings.find(b => b.id === 'greenhouse')?.count! * 20);
    const maxOxygen = 100 + (buildings.find(b => b.id === 'oxy_gen')?.count! * 20);

    // Colony Stage (Terraforming Status)
    const getTerraformStage = () => {
        if (population >= 200) return { name: 'Terraformed', color: 'text-green-400', percent: 100 };
        if (population >= 100) return { name: 'Sustainable', color: 'text-blue-400', percent: 75 };
        if (population >= 50) return { name: 'Established', color: 'text-yellow-400', percent: 50 };
        if (population >= 20) return { name: 'Outpost', color: 'text-orange-400', percent: 25 };
        return { name: 'Landing Site', color: 'text-red-400', percent: 5 };
    };
    const stage = getTerraformStage();

    const calcProduction = useCallback(() => {
        let eProd = 0; // Total
        let solarProd = 0;
        let reactorProd = 0;
        let eCons = 0;
        let fProd = 0;
        let oProd = 0;
        let mProd = 0;

        // Apply Research Multipliers
        const eMult = getMultiplier('production_mult', 'energy');
        const fMult = getMultiplier('production_mult', 'food');
        const oMult = getMultiplier('production_mult', 'oxygen');
        const mMult = getMultiplier('production_mult', 'minerals');

        buildings.forEach(b => {
            const count = b.count;
            if (b.id === 'solar_panel') solarProd += count * b.production.amount * eMult;
            if (b.id === 'reactor') reactorProd += count * b.production.amount * eMult;
            
            if (b.id === 'greenhouse') fProd += count * b.production.amount * fMult;
            if (b.id === 'oxy_gen') oProd += count * b.production.amount * oMult;
            if (b.id === 'miner_bot') mProd += count * b.production.amount * mMult;
            
            // Consumption
            eCons += count * b.energyCost;
        });

        // Dust storm penalty (-80% ONLY to Solar)
        if (dustStorm) solarProd *= 0.2;

        eProd = solarProd + reactorProd;

        return { eProd, eCons, fProd, oProd, mProd };
    }, [buildings, dustStorm, getMultiplier]);

    // --- GAME LOOP ---
    useEffect(() => {
        const timer = setInterval(() => {
            const { eProd, eCons, fProd, oProd, mProd } = calcProduction();
            
            // 1. Energy Calculation
            const netEnergy = eProd - eCons;
            // Allow battery draining
            setEnergy(prev => Math.min(maxEnergy, Math.max(0, prev + netEnergy)));
            
            // System Status check (Need energy to run life support & miners)
            const hasPower = energy > 0;

            // 2. Resource Gen (Only if power exists)
            const realFoodProd = hasPower ? fProd : 0;
            const realOxyProd = hasPower ? oProd : 0;
            const realMineralsProd = hasPower ? mProd : 0;

            if (realMineralsProd > 0) {
                setMinerals(prev => prev + realMineralsProd);
            }

            // 3. Population Consumption
            // Pop eats 0.2 Food and 0.2 Oxy per tick
            const foodCost = population * 0.2;
            const oxyCost = population * 0.2;

            setFood(prev => Math.min(maxFood, Math.max(0, prev + realFoodProd - foodCost)));
            setOxygen(prev => Math.min(maxOxygen, Math.max(0, prev + realOxyProd - oxyCost)));

            // 4. Population Dynamics
            // Growth: If Food & Oxy > 50% capacity, and Pop < Max
            if (food > maxFood * 0.2 && oxygen > maxOxygen * 0.2 && population < maxPopulation) {
                if (Math.random() < 0.1) { // 10% chance per tick to grow
                     setPopulation(prev => prev + 1);
                     showFloatingText(window.innerWidth / 2, window.innerHeight / 2, "Colonist Arrived!", "#10b981");
                }
            }
            // Death: If Food or Oxy is 0
            if ((food <= 0 || oxygen <= 0) && population > 0) {
                 if (Math.random() < 0.2) {
                     setPopulation(prev => prev - 1);
                     setMessage("WARNING: COLONIST DEATH DUE TO STARVATION/SUFFOCATION");
                 }
            }

            // 5. Economy (Credits)
            // 1 Pop = 0.5 Credit/s
            if (population > 0) {
                setCredits(prev => prev + population * 0.5);
            }

        }, 1000);
        return () => clearInterval(timer);
    }, [buildings, energy, food, oxygen, population, maxEnergy, maxFood, maxOxygen, dustStorm, maxPopulation, calcProduction]);

    // --- TRADING EVENT ---
    useEffect(() => {
        const tradeTimer = setInterval(() => {
            if (!activeTrade && Math.random() < 0.3) { // 30% chance check every 60s
                spawnTrade();
            }
        }, 60000); // Check every minute

        const expireTimer = setInterval(() => {
            if (activeTrade) {
                setActiveTrade(prev => {
                    if (!prev) return null;
                    if (prev.timeLeft <= 1) return null;
                    return { ...prev, timeLeft: prev.timeLeft - 1 };
                });
            }
        }, 1000);

        return () => {
            clearInterval(tradeTimer);
            clearInterval(expireTimer);
        };
    }, [activeTrade]);

    const spawnTrade = () => {
        const trades: Partial<TradeOffer>[] = [
            { name: 'Mineral Export', description: 'Offworld contractors need raw ore.', req: { type: 'minerals', amount: 100 + Math.floor(population * 5) }, offer: { type: 'credits', amount: 50 + Math.floor(population * 2) } },
            { name: 'Emergency Supplies', description: 'A passing freighter offers food.', req: { type: 'credits', amount: 100 }, offer: { type: 'food', amount: 200 } },
            { name: 'Energy Transfer', description: 'Recharge from orbit.', req: { type: 'credits', amount: 50 }, offer: { type: 'energy', amount: 500 } },
        ];
        
        const template = trades[Math.floor(Math.random() * trades.length)];
        if (!template) return;

        setActiveTrade({
            id: Date.now(),
            name: template.name!,
            description: template.description!,
            req: template.req!,
            offer: template.offer!,
            timeLeft: 30 // 30 seconds
        });
        setMessage("INCOMING TRANSMISSION: TRADING VESSEL DOCKED");
    };

    const acceptTrade = () => {
        if (!activeTrade) return;
        
        // Check Requirements
        let canAfford = false;
        if (activeTrade.req.type === 'minerals' && minerals >= activeTrade.req.amount) canAfford = true;
        if (activeTrade.req.type === 'credits' && credits >= activeTrade.req.amount) canAfford = true;
        if (activeTrade.req.type === 'food' && food >= activeTrade.req.amount) canAfford = true;

        if (canAfford) {
            // Deduct
            if (activeTrade.req.type === 'minerals') setMinerals(prev => prev - activeTrade.req.amount);
            if (activeTrade.req.type === 'credits') setCredits(prev => prev - activeTrade.req.amount);
            if (activeTrade.req.type === 'food') setFood(prev => prev - activeTrade.req.amount);

            // Reward
            if (activeTrade.offer.type === 'minerals') setMinerals(prev => prev + activeTrade.offer.amount);
            if (activeTrade.offer.type === 'credits') setCredits(prev => prev + activeTrade.offer.amount);
            if (activeTrade.offer.type === 'food') setFood(prev => Math.min(maxFood, prev + activeTrade.offer.amount));
            if (activeTrade.offer.type === 'energy') setEnergy(prev => Math.min(maxEnergy, prev + activeTrade.offer.amount));

            showFloatingText(window.innerWidth/2, window.innerHeight/2, "TRADE SUCCESSFUL", "#10b981");
            setActiveTrade(null);
        } else {
            showFloatingText(window.innerWidth/2, window.innerHeight/2, "INSUFFICIENT FUNDS", "#ef4444");
        }
    };

    // --- EVENTS ---
    useEffect(() => {
        const stormTimer = setInterval(() => {
            if (Math.random() < 0.05) { // 5% chance every 10s check
                triggerDustStorm();
            }
        }, 10000);
        return () => clearInterval(stormTimer);
    }, []);

    const triggerDustStorm = () => {
        setDustStorm(true);
        setMessage("⚠️ ALERT: MASSIVE DUST STORM DETECTED! SOLAR EFFICIENCY DROPPING.");
        setTimeout(() => {
            setDustStorm(false);
            setMessage("SYSTEM: WEATHER CLEARED.");
        }, 15000); // 15s storm
    };

    // --- INTERACTION ---
    const showFloatingText = (x: number, y: number, text: string, color: string = 'white') => {
        const newClick = { id: Date.now() + Math.random(), x, y, text, opacity: 1 };
        setClicks(prev => [...prev, newClick]);
        setTimeout(() => setClicks(prev => prev.filter(c => c.id !== newClick.id)), 1000);
    };

    const handleExcavate = (e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX;
        const y = e.clientY;
        
        // Manual Mining Calc
        const clickMult = getMultiplier('click_mult');
        const amount = (1 + Math.floor(population * 0.1)) * clickMult; 
        
        setMinerals(prev => prev + amount);
        showFloatingText(x, y, `+${Math.floor(amount)}`, '#fb923c');

        // Artifact Drop Chance (0.5%)
        if (Math.random() < 0.005) {
            const undiscovered = ARTIFACTS_DB.filter(a => !discoveredArtifacts.includes(a.id));
            if (undiscovered.length > 0) {
                // Weight by rarity logic could go here, for now random
                const found = undiscovered[Math.floor(Math.random() * undiscovered.length)];
                setDiscoveredArtifacts(prev => [...prev, found.id]);
                setMessage(`ARTIFACT DISCOVERED: ${found.name}`);
                showFloatingText(x, y - 50, `★ ${found.name} ★`, '#f472b6');
            }
        }
    };

    const handleBuy = (buildingId: string) => {
        const b = buildings.find(b => b.id === buildingId);
        if (!b) return;

        let totalCost = 0;
        let currentCostBase = b.cost * Math.pow(1.2, b.count);
        
        // Calculate total cost for buyAmount
        for(let i=0; i<buyAmount; i++) {
            totalCost += Math.floor(currentCostBase);
            currentCostBase *= 1.2;
        }

        if (minerals >= totalCost) {
            setMinerals(prev => prev - totalCost);
            setBuildings(prev => prev.map(item => 
                item.id === buildingId ? { ...item, count: item.count + buyAmount } : item
            ));
        }
    };

    const handleResearch = (techId: string) => {
        const tech = research.find(r => r.id === techId);
        if (!tech || tech.purchased) return;
        
        if (credits >= tech.cost) {
            setCredits(prev => prev - tech.cost);
            setResearch(prev => prev.map(r => r.id === techId ? { ...r, purchased: true } : r));
            showFloatingText(window.innerWidth/2, window.innerHeight/2, "TECH UNLOCKED!", "#bc13fe");
        }
    };

    // --- PERSISTENCE & OFFLINE ---
    useEffect(() => {
        const saved = localStorage.getItem(MARS_SAVE_KEY);
        if (saved) {
            try {
                const data = JSON.parse(saved);
                setMinerals(data.minerals || 0);
                setCredits(data.credits || 0);
                setPopulation(data.population || 0);
                
                if (data.buildings) {
                     const mergedBuildings = INITIAL_BUILDINGS.map(ib => {
                         const existing = data.buildings.find((db: any) => db.id === ib.id);
                         return existing ? { ...ib, count: existing.count } : ib;
                     });
                     setBuildings(mergedBuildings);
                }

                if (data.research) {
                    const mergedResearch = INITIAL_RESEARCH.map(ir => {
                        const existing = data.research.find((dr: any) => dr.id === ir.id);
                        return existing ? { ...ir, purchased: existing.purchased } : ir;
                    });
                    setResearch(mergedResearch);
                }

                if (data.discoveredArtifacts) {
                    setDiscoveredArtifacts(data.discoveredArtifacts);
                }

                setEnergy(data.energy || 100);
                setFood(data.food || 50);
                setOxygen(data.oxygen || 50);

                // OFFLINE CALCULATION
                if (data.lastSaveTime) {
                    const now = Date.now();
                    const seconds = (now - data.lastSaveTime) / 1000;
                    
                    if (seconds > 60) { // Min 1 minute away
                        // Simplified Offline Sim
                        // We need to calculate rates based on the LOADED buildings, not current state yet
                        // But since we just set state, we can try to approximate or use the data object
                        
                        // Recalc rates helper
                        const getOfflineMult = (type: string) => {
                             // Simplified multiplier lookup from loaded research
                             return 1; // Simplification: ignore research mults for offline for safety or iterate data.research
                        };

                        // Let's rely on basic counts
                        let offMinerals = 0;
                        let offCredits = (data.population || 0) * 0.5 * seconds;
                        
                        // Find miner count
                        const minerB = data.buildings?.find((b:any) => b.id === 'miner_bot');
                        if (minerB && minerB.count > 0) {
                            offMinerals = minerB.count * 1 * seconds; // Base rate 1
                        }

                        // Cap offline earnings to avoid game breaking
                        const maxOffline = 24 * 60 * 60; // 24h limit
                        const effectiveSeconds = Math.min(seconds, maxOffline);
                        
                        // Adjust if we capped
                        if (effectiveSeconds < seconds) {
                            offMinerals = (offMinerals / seconds) * effectiveSeconds;
                            offCredits = (offCredits / seconds) * effectiveSeconds;
                        }

                        if (offMinerals > 0 || offCredits > 0) {
                            setMinerals(prev => prev + offMinerals);
                            setCredits(prev => prev + offCredits);
                            setOfflineReport({
                                time: effectiveSeconds,
                                minerals: Math.floor(offMinerals),
                                credits: Math.floor(offCredits)
                            });
                        }
                    }
                }

            } catch(e) {}
        }
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            const data = { 
                minerals, credits, population, buildings, research, energy, food, oxygen, discoveredArtifacts,
                lastSaveTime: Date.now()
            };
            localStorage.setItem(MARS_SAVE_KEY, JSON.stringify(data));
        }, 5000);
        return () => clearInterval(interval);
    }, [minerals, credits, population, buildings, research, energy, food, oxygen, discoveredArtifacts]);

    const { eProd, eCons, fProd, oProd, mProd } = calcProduction();
    const netEnergy = eProd - eCons;

    return (
        <div className="w-full h-full relative bg-stone-950 overflow-hidden flex flex-col font-sans select-none text-white">
            <style>{`
                @keyframes dust {
                    0% { transform: translateX(0); opacity: 0.3; }
                    50% { transform: translateX(-20px); opacity: 0.6; }
                    100% { transform: translateX(0); opacity: 0.3; }
                }
                @keyframes emergency {
                    0%, 100% { box-shadow: inset 0 0 50px rgba(255,0,0,0); }
                    50% { box-shadow: inset 0 0 100px rgba(255,0,0,0.3); }
                }
            `}</style>

            {/* Background Visuals */}
            <div className="absolute inset-0 bg-gradient-to-b from-orange-950/80 to-stone-900 pointer-events-none"></div>
            <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay pointer-events-none"></div>
            
            {/* Low Power Emergency Light */}
            {energy <= 0 && (
                <div className="absolute inset-0 pointer-events-none z-50 animate-[emergency_2s_infinite]"></div>
            )}
            
            {/* Dust Storm Overlay */}
            {dustStorm && (
                 <div className="absolute inset-0 bg-orange-600/30 backdrop-blur-[1px] z-30 animate-[pulse_2s_infinite] pointer-events-none flex items-center justify-center">
                    <div className="text-4xl md:text-6xl font-black text-orange-200 opacity-50 tracking-[1em] animate-[dust_5s_infinite]">SANDSTORM</div>
                 </div>
            )}

            {/* --- TOP HUD: COMMAND CENTER --- */}
            <div className="relative z-40 bg-stone-900/95 border-b border-orange-500/30 p-2 md:p-4 grid grid-cols-4 md:grid-cols-6 gap-2 backdrop-blur-md shadow-xl">
                
                {/* 1. Population & Credits */}
                <div className="col-span-1 md:col-span-1 border-r border-white/10 pr-4 flex flex-col justify-center">
                    <div className="flex justify-between items-baseline mb-1">
                         <span className="text-[10px] text-gray-400 uppercase tracking-widest">COLONY</span>
                         <span className={`text-[10px] font-bold ${stage.color}`}>{stage.name}</span>
                    </div>
                    <div className="text-2xl font-black text-white leading-none mb-1">
                        {population} <span className="text-sm text-gray-500 font-normal">/ {maxPopulation}</span>
                    </div>
                    <div className="text-xs text-neon-purple font-mono flex items-center gap-1">
                        <span>💳</span> {formatNumber(credits)}
                        <span className="text-[9px] text-gray-500">(+{formatNumber(population * 0.5)}/s)</span>
                    </div>
                </div>

                {/* 2. Energy */}
                <div className="col-span-1 flex flex-col justify-center px-2">
                    <div className="flex justify-between text-[9px] md:text-[10px] text-orange-400 uppercase tracking-widest mb-1">
                        <span>PWR</span>
                        <span className={netEnergy >= 0 ? 'text-green-400' : 'text-red-500'}>{netEnergy > 0 ? '+' : ''}{netEnergy.toFixed(1)}/s</span>
                    </div>
                    <div className="h-1.5 bg-stone-800 rounded-full overflow-hidden mb-1">
                        <div className={`h-full transition-all duration-500 ${energy < 20 ? 'bg-red-500 animate-pulse' : 'bg-orange-500'}`} style={{ width: `${(energy / maxEnergy) * 100}%` }}></div>
                    </div>
                    <div className="text-[9px] text-gray-500 text-right">{Math.floor(energy)}/{maxEnergy}</div>
                </div>

                {/* 3. Oxygen */}
                <div className="col-span-1 flex flex-col justify-center px-2">
                    <div className="flex justify-between text-[9px] md:text-[10px] text-cyan-400 uppercase tracking-widest mb-1">
                        <span>O2</span>
                        <span>{(oProd - population * 0.2).toFixed(1)}/s</span>
                    </div>
                    <div className="h-1.5 bg-stone-800 rounded-full overflow-hidden mb-1">
                        <div className={`h-full transition-all duration-500 ${oxygen < 20 ? 'bg-red-500 animate-pulse' : 'bg-cyan-500'}`} style={{ width: `${(oxygen / maxOxygen) * 100}%` }}></div>
                    </div>
                    <div className="text-[9px] text-gray-500 text-right">{Math.floor(oxygen)}/{maxOxygen}</div>
                </div>

                {/* 4. Food (Hidden on small mobile) */}
                <div className="hidden md:flex col-span-1 flex-col justify-center px-2">
                    <div className="flex justify-between text-[9px] md:text-[10px] text-green-400 uppercase tracking-widest mb-1">
                        <span>NUTRI</span>
                        <span>{(fProd - population * 0.2).toFixed(1)}/s</span>
                    </div>
                    <div className="h-1.5 bg-stone-800 rounded-full overflow-hidden mb-1">
                        <div className={`h-full transition-all duration-500 ${food < 20 ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} style={{ width: `${(food / maxFood) * 100}%` }}></div>
                    </div>
                    <div className="text-[9px] text-gray-500 text-right">{Math.floor(food)}/{maxFood}</div>
                </div>

                {/* 5. Buttons Group */}
                <div className="col-span-2 flex items-center justify-end pl-2 border-l border-white/10 gap-2">
                     <button 
                        onClick={() => setShowArtifactsPanel(true)}
                        className="flex flex-col items-center justify-center h-full aspect-square rounded bg-space-800 border border-pink-500/30 text-pink-400 hover:bg-space-700 transition-colors"
                        title="Xeno-Archaeology"
                    >
                        <span className="text-lg">🗿</span>
                    </button>
                    <button 
                        onClick={() => setShowResearch(!showResearch)}
                        className={`flex flex-col items-center justify-center h-full px-3 rounded border transition-all ${showResearch ? 'bg-neon-purple text-black border-neon-purple' : 'bg-space-800 border-neon-purple/30 text-neon-purple hover:bg-space-700'}`}
                    >
                        <span className="text-xl">🔬</span>
                        <span className="text-[9px] font-bold">TECH</span>
                    </button>
                </div>
            </div>

            {/* --- MIDDLE: VISUALS & CLICKER --- */}
            <div className="flex-1 relative flex items-center justify-center p-8 overflow-hidden">
                {/* Floating Notifications */}
                {message && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-500/20 border border-red-500 text-red-100 px-4 py-2 rounded text-xs font-bold animate-bounce z-50 shadow-lg backdrop-blur">
                        {message}
                    </div>
                )}
                
                {/* Active Trade Offer Card */}
                {activeTrade && (
                    <div className="absolute top-4 right-4 z-[55] w-64 bg-space-900/90 border border-blue-400 rounded-lg p-3 animate-in slide-in-from-right shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="text-sm font-bold text-blue-300 animate-pulse">Incoming Transmission</h4>
                            <span className="text-xs font-mono text-gray-400">{activeTrade.timeLeft}s</span>
                        </div>
                        <p className="text-xs text-gray-300 mb-2">{activeTrade.name}</p>
                        <div className="bg-black/30 p-2 rounded text-[10px] mb-2 space-y-1">
                            <div className="flex justify-between text-red-300">
                                <span>GIVE:</span>
                                <span>{activeTrade.req.amount} {activeTrade.req.type.toUpperCase()}</span>
                            </div>
                            <div className="flex justify-between text-green-300">
                                <span>GET:</span>
                                <span>{activeTrade.offer.amount} {activeTrade.offer.type.toUpperCase()}</span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={acceptTrade} className="flex-1 bg-blue-600 text-white text-xs font-bold py-1 rounded hover:bg-blue-500">ACCEPT</button>
                            <button onClick={() => setActiveTrade(null)} className="px-2 bg-space-700 text-gray-400 text-xs rounded hover:text-white">✕</button>
                        </div>
                    </div>
                )}

                {/* Offline Report Modal */}
                {offlineReport && (
                    <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
                        <div className="bg-stone-900 border border-orange-500 p-6 rounded-2xl max-w-sm w-full text-center shadow-2xl">
                            <h2 className="text-xl font-display font-bold text-orange-400 mb-2">SYSTEM REBOOT</h2>
                            <p className="text-gray-400 text-xs mb-4">Operations continued during hibernation.</p>
                            <div className="bg-black/40 rounded p-4 mb-4 grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-[10px] text-gray-500">OFFLINE TIME</div>
                                    <div className="text-lg font-mono text-white">{Math.floor(offlineReport.time / 60)}m</div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-gray-500">REVENUE</div>
                                    <div className="text-lg font-mono text-green-400">+{formatNumber(offlineReport.credits)} CR</div>
                                </div>
                                <div className="col-span-2 border-t border-white/10 pt-2">
                                    <div className="text-[10px] text-gray-500">MINERALS EXTRACTED</div>
                                    <div className="text-lg font-mono text-orange-400">+{formatNumber(offlineReport.minerals)}</div>
                                </div>
                            </div>
                            <button onClick={() => setOfflineReport(null)} className="w-full py-2 bg-orange-600 text-white font-bold rounded hover:bg-orange-500">ACKNOWLEDGE</button>
                        </div>
                    </div>
                )}

                {/* Main Planet/Base Visual */}
                <div 
                    onClick={handleExcavate}
                    className="relative w-64 h-64 md:w-80 md:h-80 rounded-full cursor-pointer group active:scale-95 transition-transform duration-100 z-20"
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

                {/* Floating Clicks */}
                {clicks.map(c => (
                    <div 
                        key={c.id} 
                        className="fixed pointer-events-none text-xl font-black z-50 animate-float"
                        style={{ left: c.x, top: c.y, color: c.text.includes('TECH') ? '#d946ef' : '#fb923c' }}
                    >
                        {c.text}
                    </div>
                ))}

                {/* Left Stats: Mining Info */}
                <div className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 space-y-4 pointer-events-none z-30">
                    <div>
                        <div className="text-4xl font-black text-white drop-shadow-md">{formatNumber(minerals)}</div>
                        <div className="text-orange-500 font-bold text-xs tracking-[0.2em]">MINERALS</div>
                        {mProd > 0 && <div className="text-xs text-green-400 mt-1">+{formatNumber(mProd)}/s (Auto)</div>}
                    </div>
                </div>
                
                {/* Artifacts Panel (Overlay) */}
                {showArtifactsPanel && (
                    <div className="absolute inset-4 md:inset-10 z-[55] bg-space-900/95 border border-pink-500 rounded-xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 backdrop-blur-xl shadow-2xl">
                         <div className="p-4 border-b border-pink-500/30 flex justify-between items-center bg-black/20">
                            <h3 className="font-display font-bold text-pink-400 text-xl">XENO-ARCHAEOLOGY</h3>
                            <button onClick={() => setShowArtifactsPanel(false)} className="text-gray-400 hover:text-white">✕</button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 md:grid-cols-3 gap-4">
                            {ARTIFACTS_DB.map(art => {
                                const found = discoveredArtifacts.includes(art.id);
                                return (
                                    <div key={art.id} className={`p-4 rounded border flex flex-col items-center text-center gap-2 ${found ? 'border-pink-500/50 bg-pink-500/10' : 'border-white/5 bg-white/5 opacity-50'}`}>
                                        <div className="text-4xl mb-2">{found ? art.icon : '❓'}</div>
                                        <h4 className="font-bold text-sm text-white">{found ? art.name : 'Unknown Artifact'}</h4>
                                        <p className="text-[10px] text-gray-400">{found ? art.description : 'Excavate more minerals to find this.'}</p>
                                        {found && <div className="text-xs text-pink-300 font-bold mt-1">{art.effectDescription}</div>}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Research Panel (Overlay) */}
                {showResearch && (
                    <div className="absolute inset-4 md:inset-10 z-50 bg-space-900/95 border border-neon-purple rounded-xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 backdrop-blur-xl shadow-2xl">
                        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/20">
                            <h3 className="font-display font-bold text-neon-purple text-xl">RESEARCH LAB</h3>
                            <button onClick={() => setShowResearch(false)} className="text-gray-400 hover:text-white">✕</button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {research.map(r => {
                                const locked = population < r.reqPop;
                                const canAfford = credits >= r.cost;
                                
                                return (
                                    <div key={r.id} className={`p-3 rounded border flex gap-3 ${r.purchased ? 'border-green-500/30 bg-green-500/10' : locked ? 'border-white/5 bg-white/5 opacity-50' : 'border-white/20 bg-white/5'}`}>
                                        <div className="text-3xl">{locked ? '🔒' : r.icon}</div>
                                        <div className="flex-1">
                                            <div className="flex justify-between">
                                                <h4 className="font-bold text-sm text-white">{r.name}</h4>
                                                {r.purchased ? <span className="text-xs text-green-400 font-bold">ACTIVE</span> : <span className="text-xs text-neon-purple font-mono">{formatNumber(r.cost)} CR</span>}
                                            </div>
                                            <p className="text-[10px] text-gray-400 mb-2">{r.description}</p>
                                            
                                            {!r.purchased && !locked && (
                                                <button 
                                                    onClick={() => handleResearch(r.id)}
                                                    disabled={!canAfford}
                                                    className={`w-full py-1 rounded text-xs font-bold ${canAfford ? 'bg-neon-purple text-black hover:bg-white' : 'bg-gray-700 text-gray-500'}`}
                                                >
                                                    RESEARCH
                                                </button>
                                            )}
                                            {locked && !r.purchased && (
                                                <div className="text-[10px] text-red-400">Req: {r.reqPop} Pop</div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* --- BOTTOM: BUILDINGS GRID --- */}
            <div className="relative z-40 bg-stone-900 border-t border-white/10 p-4 h-64 md:h-72 flex flex-col">
                <div className="flex justify-between items-center mb-2">
                    <div className="text-xs font-bold text-gray-500 flex items-center gap-2">
                        <span>CONSTRUCTION BAY</span>
                        <div className="h-px w-10 bg-white/10"></div>
                        <span>MINERALS: {formatNumber(minerals)}</span>
                    </div>
                    
                    {/* Bulk Buy Toggle */}
                    <div className="flex bg-stone-800 rounded p-0.5">
                        {[1, 10].map(amt => (
                            <button
                                key={amt}
                                onClick={() => setBuyAmount(amt as 1 | 10)}
                                className={`px-3 py-0.5 text-[10px] font-bold rounded ${buyAmount === amt ? 'bg-orange-600 text-white' : 'text-gray-500 hover:text-white'}`}
                            >
                                x{amt}
                            </button>
                        ))}
                    </div>
                </div>
                
                <div className="flex gap-4 overflow-x-auto pb-4 h-full snap-x">
                    {buildings.map(b => {
                        let totalCost = 0;
                        let currentCostBase = b.cost * Math.pow(1.2, b.count);
                        for(let i=0; i<buyAmount; i++) {
                            totalCost += Math.floor(currentCostBase);
                            currentCostBase *= 1.2;
                        }

                        const canAfford = minerals >= totalCost;
                        
                        return (
                            <div 
                                key={b.id}
                                onClick={() => handleBuy(b.id)}
                                className={`
                                    flex-shrink-0 w-48 h-full rounded-xl border p-4 flex flex-col justify-between cursor-pointer transition-all snap-start select-none relative overflow-hidden
                                    ${canAfford 
                                        ? 'bg-stone-800 border-stone-600 hover:border-orange-500 hover:bg-stone-700 active:scale-95' 
                                        : 'bg-stone-900/50 border-stone-800 opacity-60 cursor-not-allowed'}
                                `}
                            >
                                {b.id === 'reactor' && <div className="absolute -top-4 -right-4 w-12 h-12 bg-blue-500 rotate-45 blur-xl opacity-50"></div>}

                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="text-3xl relative z-10">{b.icon}</div>
                                        <div className="text-xs bg-black/40 px-2 py-1 rounded text-white font-mono z-10">Lv.{b.count}</div>
                                    </div>
                                    <div className="font-bold text-white text-sm mb-1">{b.name}</div>
                                    <div className="text-[10px] text-gray-400 leading-tight min-h-[2.5em]">{b.description}</div>
                                </div>

                                <div>
                                    <div className="space-y-1 mb-3">
                                        {b.production.type === 'minerals' ? (
                                             <div className="flex justify-between text-[10px] text-orange-400">
                                                <span className="uppercase">Output</span>
                                                <span>+{formatNumber(b.production.amount * getMultiplier('production_mult', 'minerals'))} Ore/s</span>
                                             </div>
                                        ) : b.production.amount > 0 && (
                                            <div className="flex justify-between text-[10px] text-green-400">
                                                <span className="uppercase">Output</span>
                                                <span>+{formatNumber(b.production.amount)} {b.production.type === 'energy' ? 'PWR' : b.production.type}</span>
                                            </div>
                                        )}
                                        {b.energyCost > 0 && (
                                            <div className="flex justify-between text-[10px] text-yellow-400">
                                                <span className="uppercase">Energy</span>
                                                <span>-{b.energyCost}/s</span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className={`w-full py-2 rounded text-center text-xs font-bold flex justify-center items-center gap-1 ${canAfford ? 'bg-orange-600 text-white' : 'bg-stone-700 text-gray-500'}`}>
                                        Build <span className="text-[9px] opacity-70">x{buyAmount}</span>
                                        <span>{formatNumber(totalCost)}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default MarsColony;