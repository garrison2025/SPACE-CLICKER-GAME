import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GravitySaveData } from '../types';
import { formatNumber } from '../utils';

const GRAVITY_SAVE_KEY = 'gravity_idle_save_v2';

// --- CONFIG ---
const UPGRADE_CONFIG = {
    gravity: { name: 'Event Horizon', desc: 'Increases gravity & Click Pulse area.', base: 100, mult: 1.6, max: 50 },
    launchers: { name: 'Orbital Cannon', desc: 'Adds more projectile sources.', base: 500, mult: 2.5, max: 12 },
    fireRate: { name: 'Auto-Loader', desc: 'Increases firing speed.', base: 200, mult: 1.4, max: 20 },
    power: { name: 'Kinetic Mass', desc: 'Increases impact damage.', base: 150, mult: 1.4, max: 100 },
    pierce: { name: 'Quantum Drill', desc: 'Projectiles pierce & split geodes.', base: 1000, mult: 3.0, max: 8 },
};

// Physics Constants
const G = 0.8; 
const CENTER_MASS_BASE = 800;
const FRICTION = 0.99; 

interface PhysicsBody {
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    color: string;
    type: 'projectile' | 'asteroid' | 'comet' | 'geode' | 'fragment' | 'particle' | 'pulse' | 'text';
    mass: number;
    // Stats
    hp?: number;
    maxHp?: number;
    damage?: number;
    pierce?: number;
    life?: number; // Frames
    val?: number; 
    text?: string;
    // Visuals
    tailLength?: number;
}

const GravityIdle: React.FC = () => {
    // --- STATE ---
    const [matter, setMatter] = useState(0);
    const [upgrades, setUpgrades] = useState<GravitySaveData['upgrades']>({
        gravity: 1,
        launchers: 1,
        fireRate: 1,
        power: 1,
        pierce: 0
    });
    const [showShop, setShowShop] = useState(false);
    
    // UI State
    const [buyAmount, setBuyAmount] = useState<1 | 10 | 'MAX'>(1);
    const [offlineReport, setOfflineReport] = useState<{time: number, earned: number} | null>(null);
    const [pulseCooldown, setPulseCooldown] = useState(0); // 0-100%

    // --- REFS ---
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const bodiesRef = useRef<PhysicsBody[]>([]);
    const lastFireRef = useRef<number>(0);
    const lastSpawnRef = useRef<number>(0);
    const lastPulseTimeRef = useRef<number>(0);
    const frameRef = useRef<number>();
    const sizeRef = useRef({ w: 0, h: 0, cx: 0, cy: 0 });

    // --- GAME LOOP ---
    const gameLoop = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d', { alpha: false }); // Opt for speed
        if (!canvas || !ctx) return;

        const { w, h, cx, cy } = sizeRef.current;
        const now = Date.now();

        // 0. Update Pulse Cooldown UI
        const timeSincePulse = now - lastPulseTimeRef.current;
        const pulseCD = 5000; // 5s cooldown
        const pct = Math.min(100, (timeSincePulse / pulseCD) * 100);
        if (Math.abs(pct - pulseCooldown) > 1) { // Optimize updates
            setPulseCooldown(pct);
        }

        // 1. Spawning Logic
        if (now - lastSpawnRef.current > 800) { 
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.min(w, h) * 0.55; // Spawn outside visible ring
            
            const roll = Math.random();
            let type: PhysicsBody['type'] = 'asteroid';
            let color = '#94a3b8';
            let radius = 10 + Math.random() * 10;
            let hpMult = 1;
            let valMult = 1;
            let speedMult = 1;

            if (roll > 0.90) { // Comet (10%)
                type = 'comet';
                color = '#00f3ff';
                radius = 8;
                hpMult = 0.5;
                valMult = 5;
                speedMult = 2.5;
            } else if (roll > 0.75) { // Geode (15%)
                type = 'geode';
                color = '#bc13fe';
                radius = 20 + Math.random() * 10;
                hpMult = 3;
                valMult = 3;
                speedMult = 0.5;
            } else if (roll > 0.70) { // Gold (5%)
                color = '#facc15';
                valMult = 10;
            }

            const baseHp = 10 * Math.pow(1.1, upgrades.power); 
            const speed = (0.5 + Math.random()) * speedMult;
            const tangent = angle + Math.PI / 2 + (Math.random() * 0.5 - 0.25); // Tangent + randomness

            bodiesRef.current.push({
                id: Math.random(),
                type,
                x: cx + Math.cos(angle) * dist,
                y: cy + Math.sin(angle) * dist,
                vx: Math.cos(tangent) * speed,
                vy: Math.sin(tangent) * speed,
                radius,
                color,
                mass: radius, // Mass scales with size
                hp: baseHp * hpMult,
                maxHp: baseHp * hpMult,
                val: 10 * valMult * Math.pow(1.1, upgrades.power),
                life: 2000
            });
            lastSpawnRef.current = now;
        }

        // 2. Firing Logic
        const fireDelay = 1000 / (1 + upgrades.fireRate * 0.8);
        if (now - lastFireRef.current > fireDelay) {
            const count = upgrades.launchers;
            const power = 5 * Math.pow(1.25, upgrades.power);
            const pierce = 1 + upgrades.pierce;

            for (let i = 0; i < count; i++) {
                const angle = (i / count) * Math.PI * 2 + (now * 0.0003);
                const dist = Math.min(w, h) * 0.45;
                const lx = cx + Math.cos(angle) * dist;
                const ly = cy + Math.sin(angle) * dist;
                
                // Shoot with prediction/lead? No, let physics do the chaos.
                // Just shoot roughly inward but slightly offset to orbit
                const aimAngle = angle + Math.PI + (Math.random() * 0.4 - 0.2); 
                const speed = 4 + (upgrades.gravity * 0.15); 

                bodiesRef.current.push({
                    id: Math.random(),
                    type: 'projectile',
                    x: lx,
                    y: ly,
                    vx: Math.cos(aimAngle) * speed,
                    vy: Math.sin(aimAngle) * speed,
                    radius: 3,
                    color: '#fff',
                    mass: 2,
                    damage: power,
                    pierce: pierce,
                    life: 400
                });
            }
            lastFireRef.current = now;
        }

        // 3. Rendering (Trails Effect)
        // Instead of clearRect, we fillRect with low opacity black to create trails
        ctx.fillStyle = 'rgba(5, 6, 10, 0.25)';
        ctx.fillRect(0, 0, w, h);

        // Draw Gravity Well (Singularity)
        const gravLevel = upgrades.gravity;
        // Visual size grows with matter (capped)
        const matterVisual = Math.min(50, Math.log10(matter + 1) * 5); 
        const wellRadius = 15 + matterVisual;
        
        // Accretion Disk
        const gradient = ctx.createRadialGradient(cx, cy, wellRadius * 0.5, cx, cy, wellRadius * 3);
        gradient.addColorStop(0, '#000');
        gradient.addColorStop(0.4, `rgba(188, 19, 254, ${0.2 + (Math.sin(now * 0.002) * 0.1)})`); // Pulsing Purple
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(cx, cy, wellRadius * 4, 0, Math.PI * 2);
        ctx.fill();

        // Black Hole Core
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(cx, cy, wellRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#bc13fe'; // Neon Purple Rim
        ctx.lineWidth = 2;
        ctx.stroke();

        // Pulse Ready Indicator
        if (timeSincePulse >= pulseCD) {
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(cx, cy, wellRadius + 5, 0, Math.PI * 2);
            ctx.stroke();
        }

        // 4. Physics Engine Update
        let matterGained = 0;
        const centerMass = CENTER_MASS_BASE * (1 + upgrades.gravity * 0.25);

        for (let i = bodiesRef.current.length - 1; i >= 0; i--) {
            const b = bodiesRef.current[i];
            
            // --- PHYSICS ---
            if (b.type !== 'text' && b.type !== 'pulse' && b.type !== 'particle') {
                const dx = cx - b.x;
                const dy = cy - b.y;
                const distSq = dx*dx + dy*dy;
                const dist = Math.sqrt(distSq);

                // Gravity
                if (dist > wellRadius) {
                    const force = (G * centerMass) / distSq;
                    const acc = force * (b.type === 'projectile' ? 1.5 : 1); 
                    
                    b.vx += (dx / dist) * acc;
                    b.vy += (dy / dist) * acc;
                    
                    // Friction
                    b.vx *= FRICTION;
                    b.vy *= FRICTION;
                } else {
                    // Sucked in
                    if (b.type !== 'projectile') {
                        // Consumed by black hole - maybe give partial value?
                        matterGained += (b.val || 0) * 0.1;
                        createParticles(b.x, b.y, b.color, 5, 2);
                    }
                    b.life = 0;
                }

                b.x += b.vx;
                b.y += b.vy;
            } else if (b.type === 'pulse') {
                // Expanding ring
                b.radius += 10; 
                b.life = (b.life || 0) - 1;
            } else if (b.type === 'particle') {
                b.x += b.vx;
                b.y += b.vy;
                b.life = (b.life || 0) - 0.03;
            } else if (b.type === 'text') {
                b.y -= 0.5;
                b.life = (b.life || 0) - 1;
            }

            // --- COLLISIONS ---
            // Pulse Collision
            if (b.type === 'pulse') {
                for (const target of bodiesRef.current) {
                    if ((target.type === 'asteroid' || target.type === 'comet' || target.type === 'geode' || target.type === 'fragment') && (target.hp || 0) > 0) {
                        const dist = Math.sqrt(Math.pow(target.x - cx, 2) + Math.pow(target.y - cy, 2));
                        if (Math.abs(dist - b.radius) < 20) {
                            target.vx += (target.x - cx) * 0.05; // Push back
                            target.vy += (target.y - cy) * 0.05;
                            target.hp! -= b.damage!;
                            if (Math.random() > 0.5) createParticles(target.x, target.y, '#bc13fe', 1, 1);
                        }
                    }
                }
            }

            // Projectile Collision
            if (b.type === 'projectile') {
                b.life = (b.life || 0) - 1;
                
                for (let j = 0; j < bodiesRef.current.length; j++) {
                    const target = bodiesRef.current[j];
                    if ((target.type === 'asteroid' || target.type === 'comet' || target.type === 'geode' || target.type === 'fragment') && (target.hp || 0) > 0) {
                        const dx = b.x - target.x;
                        const dy = b.y - target.y;
                        const dist = Math.sqrt(dx*dx + dy*dy);
                        
                        if (dist < b.radius + target.radius) {
                            // HIT
                            target.hp! -= b.damage!;
                            b.pierce! -= 1;
                            createParticles(b.x, b.y, b.color, 2, 1);
                            target.vx += b.vx * 0.05;
                            target.vy += b.vy * 0.05;

                            if (target.hp! <= 0) {
                                handleDestroy(target);
                                matterGained += target.val!;
                            }
                            if (b.pierce! <= 0) {
                                b.life = 0;
                                break;
                            }
                        }
                    }
                }
            }

            // Clean up dead objects
            if ((b.type === 'asteroid' || b.type === 'comet' || b.type === 'geode' || b.type === 'fragment') && b.hp! <= 0) {
                 b.life = 0;
            }

            // --- DRAWING ---
            if (b.life !== undefined && b.life <= 0) {
                bodiesRef.current.splice(i, 1);
                continue;
            }
            if (b.x < -200 || b.x > w + 200 || b.y < -200 || b.y > h + 200) {
                bodiesRef.current.splice(i, 1);
                continue;
            }

            // Render
            ctx.beginPath();
            if (b.type === 'projectile') {
                ctx.fillStyle = b.color;
                ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
                ctx.fill();
            } else if (b.type === 'comet') {
                ctx.fillStyle = b.color;
                ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
                ctx.fill();
            } else if (b.type === 'geode') {
                ctx.strokeStyle = b.color;
                ctx.lineWidth = 2;
                ctx.strokeRect(b.x - b.radius, b.y - b.radius, b.radius*2, b.radius*2);
                ctx.fillStyle = '#000';
                ctx.fillRect(b.x - b.radius + 2, b.y - b.radius + 2, b.radius*2 - 4, b.radius*2 - 4);
            } else if (b.type === 'pulse') {
                ctx.strokeStyle = `rgba(188, 19, 254, ${b.life! / 30})`;
                ctx.lineWidth = 5;
                ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
                ctx.stroke();
            } else if (b.type === 'text') {
                ctx.fillStyle = b.color;
                ctx.font = 'bold 12px "Rajdhani"';
                ctx.fillText(b.text || '', b.x, b.y);
            } else if (b.type === 'particle') {
                ctx.fillStyle = b.color;
                ctx.globalAlpha = b.life!;
                ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
            } else {
                ctx.fillStyle = b.color;
                ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
                ctx.fill();
                if (b.maxHp! > 50 && b.hp! < b.maxHp!) {
                     ctx.fillStyle = 'red';
                     ctx.fillRect(b.x - 10, b.y - b.radius - 8, 20, 3);
                     ctx.fillStyle = '#0f0';
                     ctx.fillRect(b.x - 10, b.y - b.radius - 8, 20 * (b.hp!/b.maxHp!), 3);
                }
            }
        }

        if (matterGained > 0) {
            setMatter(prev => prev + Math.floor(matterGained));
        }

        frameRef.current = requestAnimationFrame(gameLoop);
    }, [upgrades, matter, pulseCooldown]);

    // --- LOGIC HELPERS ---
    const createParticles = (x: number, y: number, color: string, count: number, speedMult: number) => {
        for(let i=0; i<count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 3 * speedMult;
            bodiesRef.current.push({
                id: Math.random(),
                type: 'particle',
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: Math.random() * 2 + 1,
                color,
                mass: 0,
                life: 1.0
            });
        }
    };

    const handleDestroy = (target: PhysicsBody) => {
        createParticles(target.x, target.y, target.color, 8, 1);
        
        bodiesRef.current.push({
            id: Math.random(),
            type: 'text',
            x: target.x,
            y: target.y,
            vx: 0,
            vy: -1,
            life: 40,
            text: `+${formatNumber(target.val!)}`,
            color: target.type === 'comet' ? '#00f3ff' : target.type === 'geode' ? '#bc13fe' : '#fff',
            radius: 0, mass: 0 
        } as any);

        if (target.type === 'geode') {
            for(let i=0; i<4; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 2;
                bodiesRef.current.push({
                    id: Math.random(),
                    type: 'fragment',
                    x: target.x,
                    y: target.y,
                    vx: target.vx + Math.cos(angle) * speed,
                    vy: target.vy + Math.sin(angle) * speed,
                    radius: target.radius / 2.5,
                    color: '#e879f9', // Lighter purple
                    mass: target.mass / 4,
                    hp: target.maxHp! * 0.3,
                    maxHp: target.maxHp! * 0.3,
                    val: target.val! * 0.25,
                    life: 1000
                });
            }
        }
    };

    const handleCanvasClick = (e: React.MouseEvent) => {
        const now = Date.now();
        if (now - lastPulseTimeRef.current < 5000) return; // 5s Cooldown

        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const { cx, cy } = sizeRef.current;

        const dist = Math.sqrt(Math.pow(x - cx, 2) + Math.pow(y - cy, 2));
        if (dist < 60) {
            lastPulseTimeRef.current = now;
            setPulseCooldown(0);

            bodiesRef.current.push({
                id: Math.random(),
                type: 'pulse',
                x: cx,
                y: cy,
                vx: 0, vy: 0,
                radius: 20,
                color: '#bc13fe',
                mass: 0,
                life: 50, 
                damage: 20 * Math.pow(1.5, upgrades.gravity) 
            } as any);
        }
    };

    const calculateCost = (key: keyof typeof UPGRADE_CONFIG, count: number) => {
        const cfg = UPGRADE_CONFIG[key];
        const currentLvl = upgrades[key];
        let total = 0;
        let base = cfg.base * Math.pow(cfg.mult, currentLvl);
        
        for(let i=0; i<count; i++) {
            total += Math.floor(base);
            base *= cfg.mult;
        }
        return total;
    };

    const getMaxBuy = (key: keyof typeof UPGRADE_CONFIG) => {
        const cfg = UPGRADE_CONFIG[key];
        let currentLvl = upgrades[key];
        let total = 0;
        let count = 0;
        let base = cfg.base * Math.pow(cfg.mult, currentLvl);
        
        // Cap at 100 to prevent freezes
        while(count < 100 && total + base <= matter && currentLvl + count < cfg.max) {
             total += Math.floor(base);
             base *= cfg.mult;
             count++;
        }
        return { count: count || 1, cost: count ? total : Math.floor(base) }; 
    };

    const handleBuy = (key: keyof GravitySaveData['upgrades']) => {
        const cfg = UPGRADE_CONFIG[key];
        const lvl = upgrades[key];
        if (lvl >= cfg.max) return;

        let count = 0;
        let cost = 0;

        if (buyAmount === 'MAX') {
            const res = getMaxBuy(key);
            count = res.count;
            cost = res.cost;
        } else {
            count = buyAmount;
            cost = calculateCost(key, count);
        }

        if (matter >= cost && count > 0) {
            setMatter(prev => prev - cost);
            setUpgrades(prev => ({ ...prev, [key]: lvl + count }));
        }
    };

    // --- LIFECYCLE ---
    useEffect(() => {
        const handleResize = () => {
             if (canvasRef.current) {
                 const rect = canvasRef.current.parentElement?.getBoundingClientRect();
                 if (rect) {
                     canvasRef.current.width = rect.width;
                     canvasRef.current.height = rect.height;
                     sizeRef.current = { 
                         w: rect.width, 
                         h: rect.height, 
                         cx: rect.width / 2, 
                         cy: rect.height / 2 
                     };
                 }
             }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        frameRef.current = requestAnimationFrame(gameLoop);
        
        return () => {
            window.removeEventListener('resize', handleResize);
            if (frameRef.current) cancelAnimationFrame(frameRef.current);
        };
    }, [gameLoop]);

    // Save/Load
    useEffect(() => {
        const saved = localStorage.getItem(GRAVITY_SAVE_KEY);
        if (saved) {
            try {
                const data = JSON.parse(saved);
                if (data.matter) setMatter(data.matter);
                if (data.upgrades) setUpgrades(data.upgrades);
                
                // OFFLINE CALCULATION
                if (data.lastSaveTime) {
                    const now = Date.now();
                    const seconds = (now - data.lastSaveTime) / 1000;
                    if (seconds > 60) { // Min 1 min
                        const launchers = data.upgrades.launchers || 1;
                        const power = data.upgrades.power || 1;
                        
                        // Approx Formula: 
                        // Avg Spawn Rate (1.2/s) * Value Factor (25) * Power Mult (1.1^P) * Efficiency (Launchers/10 cap at 1)
                        const powerMult = Math.pow(1.1, power);
                        const efficiency = Math.min(1, launchers * 0.15); 
                        const rate = 30 * powerMult * efficiency;
                        
                        const earned = Math.floor(rate * seconds);
                        if (earned > 0) {
                            setMatter(prev => prev + earned);
                            setOfflineReport({ time: seconds, earned });
                        }
                    }
                }

            } catch(e) {}
        }
    }, []);

    useEffect(() => {
        const t = setInterval(() => {
            localStorage.setItem(GRAVITY_SAVE_KEY, JSON.stringify({ matter, upgrades, lastSaveTime: Date.now() }));
        }, 5000);
        return () => clearInterval(t);
    }, [matter, upgrades]);

    return (
        <div className="w-full h-full relative bg-black flex flex-col font-sans text-white overflow-hidden">
             
             {/* CANVAS LAYER */}
             <div className="flex-1 relative w-full h-full cursor-crosshair">
                 <canvas 
                    ref={canvasRef} 
                    className="block w-full h-full" 
                    onClick={handleCanvasClick}
                 />
                 
                 {/* HUD OVERLAYS */}
                 <div className="absolute top-4 left-4 z-10 pointer-events-none">
                     <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">SINGULARITY MASS</div>
                     <div className="text-4xl font-mono text-neon-purple font-black drop-shadow-[0_0_15px_rgba(188,19,254,0.6)]">
                         {formatNumber(matter)}
                     </div>
                     <div className="mt-2 flex items-center gap-2">
                         <div className="text-[9px] text-gray-500 font-bold">PULSE CHARGE</div>
                         <div className="w-16 h-1 bg-gray-800 rounded-full overflow-hidden">
                             <div className="h-full bg-white transition-all duration-200" style={{ width: `${pulseCooldown}%` }}></div>
                         </div>
                     </div>
                 </div>

                 <div className="absolute bottom-4 right-4 z-10 flex gap-2">
                     <button 
                        onClick={() => setShowShop(!showShop)}
                        className={`px-6 py-3 rounded-xl font-bold text-xs shadow-lg transition-all hover:scale-105 active:scale-95 border ${showShop ? 'bg-white text-black border-white' : 'bg-black/60 backdrop-blur border-neon-purple text-neon-purple'}`}
                     >
                         {showShop ? 'CLOSE LAB' : 'PHYSICS LAB'}
                     </button>
                 </div>
             </div>

             {/* UPGRADE SHOP PANEL */}
             <div className={`
                absolute top-0 right-0 bottom-0 w-80 bg-stone-950/95 border-l border-neon-purple/30 backdrop-blur-xl z-20 transition-transform duration-300 transform shadow-2xl flex flex-col
                ${showShop ? 'translate-x-0' : 'translate-x-full'}
             `}>
                 <div className="p-6 border-b border-white/10 bg-black/40">
                     <div className="flex justify-between items-center mb-4">
                         <div>
                             <h3 className="font-display font-black text-xl text-neon-purple tracking-wide">PHYSICS LAB</h3>
                             <p className="text-[10px] text-gray-500">UPGRADE CONSTANTS</p>
                         </div>
                         <button onClick={() => setShowShop(false)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/20">✕</button>
                     </div>
                     
                     {/* Buy Amount Toggle */}
                     <div className="flex bg-black/60 rounded p-1 border border-white/10">
                        {[1, 10, 'MAX'].map(opt => (
                            <button
                                key={opt}
                                onClick={() => setBuyAmount(opt as any)}
                                className={`flex-1 py-1 text-[10px] font-bold rounded transition-colors ${buyAmount === opt ? 'bg-neon-purple text-black' : 'text-gray-500 hover:text-white'}`}
                            >
                                x{opt}
                            </button>
                        ))}
                     </div>
                 </div>
                 
                 <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-20">
                     {(Object.keys(UPGRADE_CONFIG) as (keyof typeof UPGRADE_CONFIG)[]).map(key => {
                         const cfg = UPGRADE_CONFIG[key];
                         const lvl = upgrades[key];
                         const isMax = lvl >= cfg.max;
                         
                         let cost = 0;
                         let buyCount = 0;

                         if (buyAmount === 'MAX') {
                             const res = getMaxBuy(key);
                             cost = res.cost;
                             buyCount = res.count;
                         } else {
                             buyCount = buyAmount;
                             cost = calculateCost(key, buyAmount);
                         }

                         const canAfford = matter >= cost && !isMax;

                         return (
                             <div key={key} 
                                  className={`p-4 rounded-xl border transition-all select-none group relative overflow-hidden ${canAfford ? 'border-neon-purple/40 bg-neon-purple/5 cursor-pointer hover:bg-neon-purple/10 hover:border-neon-purple' : 'border-white/5 bg-black/40 opacity-60'}`}
                                  onClick={() => canAfford && handleBuy(key)}>
                                 
                                 {/* Progress Bar BG */}
                                 {canAfford && <div className="absolute inset-0 bg-neon-purple/5 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>}

                                 <div className="relative z-10">
                                     <div className="flex justify-between items-center mb-1">
                                         <h4 className="font-bold text-sm text-gray-200 group-hover:text-white">{cfg.name}</h4>
                                         <span className="text-[9px] bg-white/10 px-2 py-0.5 rounded text-gray-400 font-mono">Lv.{lvl}</span>
                                     </div>
                                     <p className="text-[10px] text-gray-500 mb-3 group-hover:text-gray-400">{cfg.desc}</p>
                                     <div className="flex justify-between items-end">
                                        <div className={`text-sm font-mono font-bold ${isMax ? 'text-green-400' : canAfford ? 'text-neon-purple' : 'text-red-400'}`}>
                                            {isMax ? 'MAXED' : `${formatNumber(cost)} DM`}
                                        </div>
                                        {!isMax && (
                                            <div className="text-[10px] text-gray-500 font-mono">
                                                {buyAmount === 'MAX' ? `+${buyCount} Lvls` : `x${buyAmount}`}
                                            </div>
                                        )}
                                     </div>
                                 </div>
                             </div>
                         )
                     })}
                 </div>
             </div>

             {/* OFFLINE REPORT MODAL */}
             {offlineReport && (
                 <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in">
                     <div className="bg-stone-900 border border-neon-purple p-8 rounded-2xl max-w-sm w-full text-center shadow-[0_0_50px_rgba(188,19,254,0.3)]">
                         <div className="text-4xl mb-4">🌌</div>
                         <h2 className="text-xl font-display font-bold text-white mb-2">SIMULATION RESUMED</h2>
                         <p className="text-gray-400 text-xs mb-6">Matter accretion continued while you were away.</p>
                         
                         <div className="bg-black/40 rounded p-4 mb-6">
                             <div className="flex justify-between text-xs mb-2">
                                 <span className="text-gray-500">TIME ELAPSED</span>
                                 <span className="font-mono text-white">{Math.floor(offlineReport.time / 60)}m {Math.floor(offlineReport.time % 60)}s</span>
                             </div>
                             <div className="flex justify-between items-center border-t border-white/10 pt-2">
                                 <span className="text-gray-500 text-xs font-bold">GENERATED</span>
                                 <span className="font-mono text-neon-purple text-xl font-bold">+{formatNumber(offlineReport.earned)}</span>
                             </div>
                         </div>
                         
                         <button 
                            onClick={() => setOfflineReport(null)}
                            className="w-full py-3 bg-neon-purple text-black font-bold rounded hover:bg-white transition-colors"
                         >
                             ABSORB MATTER
                         </button>
                     </div>
                 </div>
             )}
        </div>
    );
};

export default GravityIdle;