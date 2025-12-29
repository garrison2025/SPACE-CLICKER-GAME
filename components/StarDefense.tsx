
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DefenseUpgrade, Enemy, Projectile, Particle, FloatingText, PowerUp } from '../types';
import { formatNumber } from '../utils';

const DEFENSE_SAVE_KEY = 'star_defense_save_v4';

// --- CONFIG ---
const INITIAL_UPGRADES: DefenseUpgrade[] = [
    { id: 'blaster', name: 'Plasma Cannons', description: 'Increases manual click damage.', cost: 50, costMult: 1.5, level: 1, value: 10, type: 'click', icon: '🔫' },
    { id: 'turret_alpha', name: 'Alpha Turret', description: 'Fast-firing auto-turret.', cost: 150, costMult: 1.4, level: 0, value: 5, type: 'turret', icon: '📡' },
    { id: 'turret_beta', name: 'Missile Battery', description: 'Heavy damage, slow fire rate.', cost: 1000, costMult: 1.5, level: 0, value: 50, type: 'turret', icon: '🚀' },
    { id: 'shield_gen', name: 'Void Shield Gen', description: 'Regenerating energy barrier.', cost: 300, costMult: 1.3, level: 0, value: 50, type: 'shield', icon: '🛡️' },
    { id: 'hull', name: 'Hull Plating', description: 'Increases Max HP.', cost: 200, costMult: 1.3, level: 0, value: 20, type: 'hp', icon: '🧱' },
    { id: 'repair', name: 'Nanite Repair', description: 'Instantly restores 30% Hull.', cost: 100, costMult: 1.1, level: 0, value: 0, type: 'utility', icon: '🔧' },
];

const ENEMY_TYPES = {
    scout: { hp: 20, speed: 0.8, color: '#facc15', score: 10, size: 24, shootRate: 0 },
    fighter: { hp: 60, speed: 0.5, color: '#ef4444', score: 25, size: 32, shootRate: 3000 },
    tank: { hp: 250, speed: 0.2, color: '#3b82f6', score: 100, size: 48, shootRate: 5000 },
    boss: { hp: 3000, speed: 0.1, color: '#bc13fe', score: 1000, size: 96, shootRate: 1500 },
};

const SKILLS = [
    { id: 'emp', name: 'EMP SHOCK', cooldown: 30, color: '#00f3ff', icon: '⚡', duration: 3000, key: '1' },
    { id: 'rapid', name: 'RAPID FIRE', cooldown: 45, color: '#facc15', icon: '🔥', duration: 5000, key: '2' },
    { id: 'nuke', name: 'NUKE', cooldown: 60, color: '#ef4444', icon: '☢️', duration: 0, key: '3' },
];

const COMBO_TIMEOUT = 180; // Frames (approx 3s)

const StarDefense: React.FC = () => {
    // --- STATE ---
    const [scraps, setScraps] = useState(0); 
    const [wave, setWave] = useState(1);
    const [hp, setHp] = useState(100);
    const [shield, setShield] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [bossWarning, setBossWarning] = useState(false);
    
    // Combo System
    const [combo, setCombo] = useState(0);
    const [comboTimer, setComboTimer] = useState(0); // For UI bar
    
    const [skillCooldowns, setSkillCooldowns] = useState<{[key:string]: number}>({});
    const [activeEffects, setActiveEffects] = useState<{[key:string]: number}>({}); 
    
    const [upgrades, setUpgrades] = useState<DefenseUpgrade[]>(INITIAL_UPGRADES);
    
    // Refs for Game Loop
    const enemiesRef = useRef<Enemy[]>([]);
    const projectilesRef = useRef<Projectile[]>([]);
    const powerupsRef = useRef<PowerUp[]>([]);
    const particlesRef = useRef<Particle[]>([]);
    const floatTextRef = useRef<FloatingText[]>([]);
    
    const comboTimerRef = useRef(0);
    const lastTimeRef = useRef<number>(0);
    const lastHitTimeRef = useRef<number>(0);
    const waveTimerRef = useRef<number>(0);
    const spawnTimerRef = useRef<number>(0);
    const turretCooldownsRef = useRef<{[key:string]: number}>({});
    const turretAnglesRef = useRef<{[key:string]: number}>({ turret_alpha: 0, turret_beta: 0 }); 
    const muzzleFlashRef = useRef<number>(0); // Opacity of muzzle flash
    const animationFrameRef = useRef<number>();
    
    // Force Render for UI
    const [_, setRenderTrigger] = useState(0);

    // Derived Stats
    const maxHp = 100 + ((upgrades.find(u => u.id === 'hull')?.level || 0) * (upgrades.find(u => u.id === 'hull')?.value || 20));
    const maxShield = (upgrades.find(u => u.id === 'shield_gen')?.level || 0) * (upgrades.find(u => u.id === 'shield_gen')?.value || 50);
    const baseClickDamage = (upgrades.find(u => u.id === 'blaster')?.value || 10) * (1 + (upgrades.find(u => u.id === 'blaster')?.level || 1) * 0.2);
    
    const clickDamage = activeEffects['rapid'] > 0 ? baseClickDamage * 2 : activeEffects['double_damage'] > 0 ? baseClickDamage * 2 : baseClickDamage;
    const comboMultiplier = 1 + (combo * 0.1);

    // --- GAME LOOP ---
    const gameLoop = useCallback((timestamp: number) => {
        if (gameOver) return;
        if (!lastTimeRef.current) lastTimeRef.current = timestamp;
        const deltaTime = Math.min((timestamp - lastTimeRef.current) / 16.66, 4); // Normalize to 60fps
        lastTimeRef.current = timestamp;
        const nowMs = Date.now();

        // 0. Visual Decay
        if (muzzleFlashRef.current > 0) muzzleFlashRef.current = Math.max(0, muzzleFlashRef.current - 0.2 * deltaTime);

        // 1. Combo Decay
        if (comboTimerRef.current > 0) {
            comboTimerRef.current -= deltaTime;
            setComboTimer(comboTimerRef.current); // Sync to state for UI bar
            if (comboTimerRef.current <= 0) {
                setCombo(0);
                addFloatingText(50, 50, "COMBO LOST", "#ef4444");
            }
        }

        // 2. Shield Regen
        if (maxShield > 0 && nowMs - lastHitTimeRef.current > 3000) {
            setShield(prev => Math.min(maxShield, prev + (maxShield * 0.01 * deltaTime))); 
        }

        // 3. Cooldowns
        setSkillCooldowns(prev => {
            const next = { ...prev };
            let changed = false;
            Object.keys(next).forEach(k => {
                if (next[k] > 0) {
                    next[k] = Math.max(0, next[k] - (deltaTime * 16.66));
                    changed = true;
                }
            });
            return changed ? next : prev;
        });

        setActiveEffects(prev => {
             const next = { ...prev };
             let changed = false;
             Object.keys(next).forEach(k => {
                 if (next[k] > 0) {
                     next[k] = Math.max(0, next[k] - (deltaTime * 16.66));
                     changed = true;
                 }
             });
             return changed ? next : prev;
        });

        // 4. Spawning
        spawnTimerRef.current -= deltaTime;
        if (spawnTimerRef.current <= 0) {
            spawnEnemy();
            spawnTimerRef.current = Math.max(30, 120 - (wave * 5)); 
        }

        // 5. Enemy Logic
        const timeSec = nowMs / 1000;
        enemiesRef.current = enemiesRef.current.filter(enemy => {
            if (enemy.hp <= 0) return false;

            if (!enemy.isStunned) {
                // Movement
                if (enemy.type === 'scout') {
                    enemy.y += enemy.speed * deltaTime;
                    enemy.x = enemy.spawnX + Math.sin(timeSec * 3 + enemy.id) * 20;
                } else if (enemy.type === 'fighter') {
                    enemy.y += enemy.speed * deltaTime;
                    enemy.x = enemy.spawnX + Math.sin(timeSec * 1 + enemy.id) * 10;
                } else {
                    enemy.y += enemy.speed * deltaTime;
                }
                enemy.x = Math.max(5, Math.min(95, enemy.x));

                // BOSS LOGIC
                if (enemy.type === 'boss') {
                    enemy.bossCD = (enemy.bossCD || 0) - deltaTime;
                    if (enemy.bossCD <= 0) {
                        const action = Math.random();
                        if (action < 0.4) {
                            // Spread Shot
                            for(let i=-2; i<=2; i++) {
                                projectilesRef.current.push({
                                    id: Math.random(),
                                    x: enemy.x,
                                    y: enemy.y,
                                    targetId: null,
                                    damage: 15,
                                    color: '#bc13fe',
                                    source: 'enemy',
                                    vx: i * 0.3,
                                    vy: 0.8
                                });
                            }
                            addFloatingText(enemy.x, enemy.y + 10, "SCATTER!", "#bc13fe");
                        } else if (action < 0.7) {
                            // Summon
                            spawnEnemy('scout', enemy.x - 10, enemy.y);
                            spawnEnemy('scout', enemy.x + 10, enemy.y);
                            addFloatingText(enemy.x, enemy.y + 10, "MINIONS!", "#facc15");
                        }
                        enemy.bossCD = 150; // 2.5s CD
                    }
                }
            }

            // Shooting
            if (enemy.shootRate && enemy.shootRate > 0 && !enemy.isStunned && enemy.type !== 'boss') {
                if (!enemy.lastShot || nowMs - enemy.lastShot > enemy.shootRate) {
                    enemy.lastShot = nowMs;
                    const dx = 50 - enemy.x;
                    const dy = 90 - enemy.y;
                    const mag = Math.sqrt(dx*dx + dy*dy);
                    projectilesRef.current.push({
                        id: Math.random(),
                        x: enemy.x,
                        y: enemy.y,
                        targetId: null,
                        damage: 10 * (1 + wave * 0.1),
                        color: '#ff0000',
                        source: 'enemy',
                        vx: (dx/mag) * 0.5,
                        vy: (dy/mag) * 0.5
                    });
                }
            }

            // Base Collision
            if (enemy.y > 90) { 
                takeDamage(enemy.type === 'boss' ? 50 : 10); 
                createParticles(enemy.x, enemy.y, enemy.type === 'boss' ? '#bc13fe' : '#ef4444', 10);
                return false; 
            }
            return true;
        });

        // 6. Turrets
        upgrades.forEach(u => {
            if (u.type === 'turret' && u.level > 0) {
                const cdKey = u.id;
                turretCooldownsRef.current[cdKey] = (turretCooldownsRef.current[cdKey] || 0) - deltaTime;
                const speedMod = activeEffects['rapid'] > 0 ? 2 : 1;

                if (enemiesRef.current.length > 0) {
                    const target = enemiesRef.current.reduce((prev, curr) => {
                         const distPrev = Math.sqrt(Math.pow(prev.x - 50, 2) + Math.pow(prev.y - 90, 2));
                         const distCurr = Math.sqrt(Math.pow(curr.x - 50, 2) + Math.pow(curr.y - 90, 2));
                         return distCurr < distPrev ? curr : prev;
                    });
                    
                    const dx = target.x - (u.id === 'turret_alpha' ? 20 : 80); 
                    const dy = target.y - 90;
                    turretAnglesRef.current[u.id] = (Math.atan2(dy, dx) * 180 / Math.PI) - 90;

                    if (turretCooldownsRef.current[cdKey] <= 0) {
                        projectilesRef.current.push({
                            id: Math.random(),
                            x: u.id === 'turret_alpha' ? 20 : 80, 
                            y: 85,
                            targetId: target.id,
                            damage: u.value * u.level,
                            color: u.id === 'turret_beta' ? '#ef4444' : '#3b82f6',
                            source: 'player'
                        });
                        const baseCD = u.id === 'turret_beta' ? 120 : 20; 
                        turretCooldownsRef.current[cdKey] = baseCD / speedMod; 
                    }
                }
            }
        });

        // 7. Projectiles
        projectilesRef.current = projectilesRef.current.filter(proj => {
            let hit = false;
            
            if (proj.source === 'player') {
                if (proj.targetId) {
                    const target = enemiesRef.current.find(e => e.id === proj.targetId);
                    if (target) {
                        const dx = target.x - proj.x;
                        const dy = target.y - proj.y;
                        const dist = Math.sqrt(dx*dx + dy*dy);
                        if (dist < 4) {
                            damageEnemy(target, proj.damage);
                            hit = true;
                        } else {
                            proj.x += (dx / dist) * 2 * deltaTime;
                            proj.y += (dy / dist) * 2 * deltaTime;
                        }
                    } else { hit = true; }
                } else {
                    proj.y -= 2 * deltaTime; 
                    const hitEnemy = enemiesRef.current.find(e => 
                        Math.abs(e.x - proj.x) < (e.type === 'boss' ? 15 : 5) && 
                        Math.abs(e.y - proj.y) < (e.type === 'boss' ? 15 : 5)
                    );
                    if (hitEnemy) {
                        damageEnemy(hitEnemy, proj.damage);
                        hit = true;
                    } else if (proj.y < 0) hit = true;
                }
            } else {
                if (proj.vx !== undefined && proj.vy !== undefined) {
                    proj.x += proj.vx * deltaTime;
                    proj.y += proj.vy * deltaTime;
                }
                if (proj.y > 85 && Math.abs(proj.x - 50) < 15) {
                    takeDamage(proj.damage);
                    createParticles(proj.x, proj.y, '#ff0000', 3);
                    hit = true;
                } else if (proj.y > 100 || proj.x < 0 || proj.x > 100) {
                    hit = true;
                }
            }
            return !hit;
        });

        // 8. Powerups
        powerupsRef.current = powerupsRef.current.filter(p => {
             p.y += 0.2 * deltaTime; 
             p.life -= deltaTime;
             return p.life > 0 && p.y < 100;
        });

        // 9. Particles
        particlesRef.current = particlesRef.current.map(p => ({
            ...p,
            x: p.x + p.vx * deltaTime,
            y: p.y + p.vy * deltaTime,
            life: p.life - 0.05 * deltaTime
        })).filter(p => p.life > 0);

        // 10. Wave
        waveTimerRef.current += deltaTime;
        if (waveTimerRef.current > 1800) { 
            setWave(prev => prev + 1);
            waveTimerRef.current = 0;
            if ((wave + 1) % 5 === 0) {
                 setBossWarning(true);
                 setTimeout(() => setBossWarning(false), 3000);
            } else {
                 addFloatingText(50, 40, `WAVE ${wave + 1}`, '#fff', true);
            }
        }

        const stunActive = activeEffects['emp'] > 0;
        enemiesRef.current.forEach(e => e.isStunned = stunActive);

        setRenderTrigger(prev => prev + 1);
        animationFrameRef.current = requestAnimationFrame(gameLoop);
    }, [gameOver, upgrades, wave, maxHp, maxShield, activeEffects]);

    // --- HELPERS ---
    const spawnEnemy = (forceType?: string, forceX?: number, forceY?: number) => {
        const isBoss = wave % 5 === 0 && Math.random() < 0.1;
        const roll = Math.random();
        let typeKey = 'scout';
        
        if (forceType) typeKey = forceType;
        else if (isBoss) typeKey = 'boss';
        else if (wave > 2 && roll > 0.8) typeKey = 'tank';
        else if (wave > 1 && roll > 0.6) typeKey = 'fighter';

        const stats = ENEMY_TYPES[typeKey as keyof typeof ENEMY_TYPES];
        const waveMult = 1 + (wave * 0.25);
        const startX = forceX !== undefined ? forceX : 10 + Math.random() * 80;
        const startY = forceY !== undefined ? forceY : -10;

        enemiesRef.current.push({
            id: Math.random(),
            x: startX,
            y: startY,
            spawnX: startX,
            hp: stats.hp * waveMult,
            maxHp: stats.hp * waveMult,
            speed: stats.speed * (1 + wave * 0.05),
            type: typeKey as any,
            scoreValue: Math.floor(stats.score * waveMult),
            shootRate: stats.shootRate,
            bossCD: 100 // Initial delay for bosses
        });
    };

    const damageEnemy = (enemy: Enemy, dmg: number) => {
        enemy.hp -= dmg;
        addFloatingText(enemy.x + (Math.random()*4-2), enemy.y, Math.floor(dmg).toString(), '#fff', false, true);

        if (enemy.hp <= 0) {
            // Powerup Logic
            if (Math.random() < 0.05) { 
                const types: PowerUp['type'][] = ['heal', 'scrap', 'double_damage'];
                powerupsRef.current.push({
                    id: Math.random(),
                    x: enemy.x,
                    y: enemy.y,
                    type: types[Math.floor(Math.random() * types.length)],
                    life: 600
                });
            }
            createParticles(enemy.x, enemy.y, ENEMY_TYPES[enemy.type].color, 12);
            
            // Combo Logic
            setCombo(prev => prev + 1);
            comboTimerRef.current = COMBO_TIMEOUT;
            
            setScraps(prev => prev + Math.floor(enemy.scoreValue * comboMultiplier));
            addFloatingText(enemy.x, enemy.y, `+${Math.floor(enemy.scoreValue * comboMultiplier)}`, '#fbbf24');
        } else {
            createParticles(enemy.x, enemy.y, '#fff', 2);
        }
    };

    const takeDamage = (amount: number) => {
        lastHitTimeRef.current = Date.now();
        setCombo(0); // Break combo
        comboTimerRef.current = 0;
        
        // Shield
        let remaining = amount;
        setShield(prev => {
            if (prev >= remaining) {
                remaining = 0;
                return prev - amount;
            } else {
                remaining -= prev;
                return 0;
            }
        });

        if (remaining > 0) {
            setHp(prev => {
                const newHp = prev - remaining;
                if (newHp <= 0) {
                    setGameOver(true);
                    return 0;
                }
                return newHp;
            });
        }
    };

    const createParticles = (x: number, y: number, color: string, count: number) => {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 1.5 + 0.5;
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

    const addFloatingText = (x: number, y: number, text: string, color: string = '#fff', isCrit: boolean = false, isDamage: boolean = false) => {
        const id = Math.random();
        floatTextRef.current.push({ id, x, y, text, opacity: 1, isCrit, isDamage });
        setTimeout(() => {
            floatTextRef.current = floatTextRef.current.filter(t => t.id !== id);
        }, isDamage ? 500 : 1000);
    };

    const activateSkill = (skillId: string) => {
        if (skillCooldowns[skillId] > 0) return;
        const skill = SKILLS.find(s => s.id === skillId);
        if (!skill) return;

        setSkillCooldowns(prev => ({ ...prev, [skillId]: skill.cooldown * 1000 }));
        
        if (skillId === 'emp') {
            setActiveEffects(prev => ({ ...prev, emp: skill.duration }));
            addFloatingText(50, 50, "EMP BLAST!", "#00f3ff", true);
        } else if (skillId === 'rapid') {
            setActiveEffects(prev => ({ ...prev, rapid: skill.duration }));
            addFloatingText(50, 50, "RAPID FIRE!", "#facc15", true);
        } else if (skillId === 'nuke') {
            enemiesRef.current.forEach(e => damageEnemy(e, 5000));
            addFloatingText(50, 50, "TACTICAL NUKE", "#ef4444", true);
            createParticles(50, 50, '#ff0000', 50);
        }
    };

    // --- INTERACTIONS ---
    const handleFieldClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (gameOver) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        
        // Muzzle Flash Effect
        muzzleFlashRef.current = 1;

        projectilesRef.current.push({
            id: Math.random(),
            x: x,
            y: 90,
            targetId: null,
            damage: clickDamage,
            color: activeEffects['rapid'] > 0 ? '#facc15' : '#00f3ff',
            source: 'player'
        });
    };

    const handlePowerUpClick = (e: React.MouseEvent, p: PowerUp) => {
        e.stopPropagation();
        powerupsRef.current = powerupsRef.current.filter(i => i.id !== p.id);
        
        if (p.type === 'heal') {
            setHp(prev => Math.min(maxHp, prev + 25));
            addFloatingText(p.x, p.y, "+25 HP", "#10b981", true);
        } else if (p.type === 'scrap') {
            const amount = 100 * wave;
            setScraps(prev => prev + amount);
            addFloatingText(p.x, p.y, `+${amount} SCRAP`, "#fbbf24", true);
        } else if (p.type === 'double_damage') {
             setActiveEffects(prev => ({ ...prev, double_damage: 10000 })); 
             addFloatingText(p.x, p.y, "DAMAGE BOOST!", "#ef4444", true);
        }
    };

    const handleBuyUpgrade = (id: string) => {
        const u = upgrades.find(up => up.id === id);
        if (!u) return;
        let cost = Math.floor(u.cost * Math.pow(u.costMult, u.level));
        if (id === 'repair') cost = u.cost;

        if (scraps >= cost) {
            setScraps(prev => prev - cost);
            if (id === 'repair') {
                setHp(prev => Math.min(maxHp, prev + (maxHp * 0.3)));
                addFloatingText(50, 50, "REPAIRED", "#10b981", true);
            } else {
                setUpgrades(prev => prev.map(item => item.id === id ? { ...item, level: item.level + 1 } : item));
            }
        }
    };

    const handleRestart = () => {
        setGameOver(false);
        setHp(100);
        setShield(0);
        setWave(1);
        setScraps(0);
        setCombo(0);
        setSkillCooldowns({});
        setActiveEffects({});
        enemiesRef.current = [];
        projectilesRef.current = [];
        powerupsRef.current = [];
        particlesRef.current = [];
        setUpgrades(INITIAL_UPGRADES);
        lastTimeRef.current = 0;
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    // Keyboard controls
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (gameOver) return;
            if (e.key === '1') activateSkill('emp');
            if (e.key === '2') activateSkill('rapid');
            if (e.key === '3') activateSkill('nuke');
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [gameOver, skillCooldowns]);

    // --- LIFECYCLE ---
    useEffect(() => {
        animationFrameRef.current = requestAnimationFrame(gameLoop);
        return () => { if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current); };
    }, [gameLoop]);

    useEffect(() => {
        const saved = localStorage.getItem(DEFENSE_SAVE_KEY);
        if (saved) {
            try {
                const data = JSON.parse(saved);
                setScraps(data.scraps || 0);
                setWave(data.wave || 1);
                if (data.upgrades) {
                     const merged = INITIAL_UPGRADES.map(iu => {
                         const existing = data.upgrades.find((du:any) => du.id === iu.id);
                         return existing ? { ...iu, level: existing.level } : iu;
                     });
                     setUpgrades(merged);
                }
            } catch(e) {}
        }
    }, []);

    // --- SAVE SYSTEM FIX ---
    const saveStateRef = useRef({ scraps, wave, upgrades });

    // Keep ref updated
    useEffect(() => {
        saveStateRef.current = { scraps, wave, upgrades };
    }, [scraps, wave, upgrades]);

    const saveGame = useCallback(() => {
        if (!gameOver) {
            localStorage.setItem(DEFENSE_SAVE_KEY, JSON.stringify({ 
                ...saveStateRef.current,
                lastSaveTime: Date.now() 
            }));
        }
    }, [gameOver]);

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

    return (
        <div className="w-full h-full relative bg-black overflow-hidden flex font-sans select-none text-white">
            
            {/* --- GAME AREA --- */}
            <div 
                className="flex-1 relative border-r border-white/20 bg-space-950 cursor-crosshair overflow-hidden group"
                onMouseDown={handleFieldClick}
            >
                 {/* Moving Starfield Background */}
                 <div className="absolute inset-0 opacity-50">
                      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                      {Array.from({length: 30}).map((_, i) => (
                          <div key={i} className="absolute w-1 h-1 bg-white rounded-full animate-[float_3s_linear_infinite]" 
                               style={{ left: `${Math.random()*100}%`, top: '-10px', animationDuration: `${Math.random()*3+1}s`, opacity: Math.random() }}></div>
                      ))}
                 </div>
                 
                 {/* Boss Warning Overlay */}
                 {bossWarning && (
                     <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none bg-red-900/20 animate-pulse">
                         <div className="text-4xl md:text-6xl font-black text-red-500 tracking-[0.5em] animate-bounce">
                             WARNING: BOSS DETECTED
                         </div>
                     </div>
                 )}
                 
                 {/* EMP Overlay */}
                 {activeEffects['emp'] > 0 && <div className="absolute inset-0 bg-cyan-500/10 pointer-events-none z-10 animate-pulse"></div>}
                 
                 {/* Nuke Overlay */}
                 {skillCooldowns['nuke'] > 59000 && <div className="absolute inset-0 bg-white pointer-events-none z-[60] animate-ping opacity-50"></div>}

                 {/* Top HUD */}
                 <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-start pointer-events-none">
                     <div className="flex flex-col gap-2 w-56">
                         {/* Shield Bar */}
                         {maxShield > 0 && (
                            <div className="flex flex-col gap-0.5">
                                <div className="flex justify-between text-[10px] font-bold text-blue-300">
                                    <span>SHIELDS</span>
                                    <span>{Math.floor(shield)}/{maxShield}</span>
                                </div>
                                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden border border-blue-900">
                                    <div 
                                        className="h-full bg-blue-400 shadow-[0_0_10px_blue]"
                                        style={{ width: `${(shield/maxShield)*100}%` }}
                                    ></div>
                                </div>
                            </div>
                         )}
                         
                         {/* HP Bar */}
                         <div className="flex flex-col gap-0.5">
                             <div className="flex justify-between text-[10px] font-bold text-gray-400">
                                 <span>HULL</span>
                                 <span>{Math.floor(hp)}/{maxHp}</span>
                             </div>
                             <div className="h-2 bg-gray-800 rounded-full overflow-hidden border border-gray-600">
                                 <div 
                                    className={`h-full transition-all duration-200 ${hp < maxHp*0.3 ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}
                                    style={{ width: `${(hp/maxHp)*100}%` }}
                                 ></div>
                             </div>
                         </div>
                     </div>
                     <div className="text-right">
                         <div className="text-3xl font-black text-white tracking-widest">WAVE {wave}</div>
                         <div className="text-xs text-neon-blue font-mono">THREAT LEVEL: {Math.min(100, wave * 5)}%</div>
                     </div>
                 </div>

                 {/* Combo Meter (Center Top) */}
                 {combo > 0 && (
                     <div className="absolute top-20 left-1/2 -translate-x-1/2 flex flex-col items-center z-20 pointer-events-none animate-in zoom-in">
                         <div className="text-4xl font-black italic text-yellow-400 drop-shadow-[0_0_10px_orange]">x{combo}</div>
                         <div className="text-xs font-bold text-yellow-600 tracking-widest">COMBO</div>
                         <div className="w-24 h-1 bg-gray-800 mt-1 rounded-full overflow-hidden">
                             <div className="h-full bg-yellow-400" style={{ width: `${(comboTimer / COMBO_TIMEOUT) * 100}%` }}></div>
                         </div>
                     </div>
                 )}

                 {/* Skills Bar */}
                 <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex gap-2 pointer-events-auto">
                     {SKILLS.map(skill => {
                         const cd = skillCooldowns[skill.id] || 0;
                         const active = activeEffects[skill.id] > 0;
                         const pct = Math.min(100, (cd / (skill.cooldown * 1000)) * 100);
                         
                         return (
                             <button
                                key={skill.id}
                                onClick={(e) => { e.stopPropagation(); activateSkill(skill.id); }}
                                disabled={cd > 0}
                                className={`relative w-12 h-12 md:w-16 md:h-16 rounded-lg border-2 flex items-center justify-center text-2xl bg-black/80 overflow-hidden transition-transform active:scale-95 ${active ? 'border-white shadow-[0_0_15px_white]' : cd > 0 ? 'border-gray-700 opacity-50' : 'border-gray-500 hover:border-neon-blue'}`}
                                style={{ borderColor: active ? skill.color : undefined }}
                             >
                                 {cd > 0 && <div className="absolute bottom-0 left-0 right-0 bg-black/60" style={{ height: `${pct}%` }}></div>}
                                 <span className="relative z-10">{skill.icon}</span>
                                 <span className="absolute bottom-1 right-1 text-[8px] font-bold">{cd > 0 ? Math.ceil(cd/1000) : ''}</span>
                                 <div className="absolute top-1 left-1 text-[8px] text-gray-500 font-mono">[{skill.key}]</div>
                             </button>
                         )
                     })}
                 </div>

                 {/* RENDER ENTITIES */}
                 {powerupsRef.current.map(p => (
                     <div 
                        key={p.id}
                        onClick={(e) => handlePowerUpClick(e, p)}
                        className="absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2 z-30 cursor-pointer animate-bounce"
                        style={{ left: `${p.x}%`, top: `${p.y}%` }}
                     >
                         <div className={`w-full h-full rounded-full border-2 flex items-center justify-center font-bold text-xs bg-black shadow-lg
                            ${p.type === 'heal' ? 'border-green-500 text-green-500 shadow-green-500/50' : p.type === 'scrap' ? 'border-yellow-500 text-yellow-500 shadow-yellow-500/50' : 'border-red-500 text-red-500 shadow-red-500/50'}
                         `}>
                             {p.type === 'heal' ? '+' : p.type === 'scrap' ? '$' : '⚡'}
                         </div>
                     </div>
                 ))}

                 {enemiesRef.current.map(e => (
                     <div 
                        key={e.id}
                        className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center transition-transform"
                        style={{
                            left: `${e.x}%`,
                            top: `${e.y}%`,
                            width: `${ENEMY_TYPES[e.type].size}px`,
                            height: `${ENEMY_TYPES[e.type].size}px`,
                        }}
                     >
                         <svg viewBox="0 0 100 100" className={`w-full h-full drop-shadow-lg ${e.isStunned ? 'brightness-200 grayscale' : ''} ${e.type === 'boss' ? 'animate-pulse' : ''}`} style={{ fill: ENEMY_TYPES[e.type].color }}>
                             {e.type === 'scout' && <path d="M50 100 L0 0 L50 20 L100 0 Z" />}
                             {e.type === 'fighter' && <path d="M50 100 L20 40 L0 0 L50 20 L100 0 L80 40 Z" />}
                             {e.type === 'tank' && <path d="M10 10 H90 V60 L50 90 L10 60 Z" />}
                             {e.type === 'boss' && <path d="M50 100 L10 40 L0 0 L30 10 L50 30 L70 10 L100 0 L90 40 Z" />}
                         </svg>
                         <div className="absolute -top-3 w-full h-1 bg-gray-700 rounded-full overflow-hidden">
                             <div className="h-full bg-red-500" style={{ width: `${(e.hp/e.maxHp)*100}%` }}></div>
                         </div>
                     </div>
                 ))}

                 {projectilesRef.current.map(p => (
                     <div
                        key={p.id}
                        className="absolute rounded-full"
                        style={{
                            left: `${p.x}%`,
                            top: `${p.y}%`,
                            width: p.source === 'enemy' ? '6px' : '4px',
                            height: p.source === 'enemy' ? '6px' : '12px',
                            backgroundColor: p.color,
                            boxShadow: `0 0 8px ${p.color}`,
                            transform: `translate(-50%, -50%) rotate(${p.vx ? Math.atan2(p.vy!, p.vx!) * 180 / Math.PI + 90 : 0}deg)`
                        }}
                     ></div>
                 ))}

                 {particlesRef.current.map(p => (
                     <div
                        key={p.id}
                        className="absolute w-1 h-1 rounded-full pointer-events-none"
                        style={{
                            left: `${p.x}%`,
                            top: `${p.y}%`,
                            backgroundColor: p.color,
                            opacity: p.life,
                            transform: `scale(${p.life}) translate(-50%, -50%)`
                        }}
                     ></div>
                 ))}

                 {floatTextRef.current.map(t => (
                     <div 
                        key={t.id}
                        className={`absolute pointer-events-none font-bold whitespace-nowrap animate-float 
                            ${t.isDamage ? 'text-xs text-red-200' : t.isCrit ? 'text-xl z-50' : 'text-sm z-40'}`}
                        style={{ left: `${t.x}%`, top: `${t.y}%`, color: t.isCrit ? '#fbbf24' : t.isDamage ? '#ffaaaa' : '#fff', transform: 'translate(-50%, -50%)', textShadow: '0 0 2px black' }}
                     >
                         {t.text}
                     </div>
                 ))}

                 {/* Player Ship */}
                 <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-16 h-16 z-10 pointer-events-none">
                     <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_15px_rgba(0,243,255,0.5)]">
                         <path d="M50 0 L85 85 L50 70 L15 85 Z" fill="#fff" />
                         <path d="M50 0 L85 85 L50 70 Z" fill="#94a3b8" />
                         <circle cx="50" cy="80" r="4" fill="#00f3ff" className="animate-pulse" />
                     </svg>
                     <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-8 bg-blue-400 blur-md animate-pulse"></div>
                     
                     {/* Muzzle Flash */}
                     <div 
                        className="absolute -top-4 left-1/2 -translate-x-1/2 w-12 h-12 bg-blue-300 rounded-full blur-md"
                        style={{ opacity: muzzleFlashRef.current }}
                     ></div>
                 </div>

                 {/* Turrets Visuals */}
                 {upgrades.find(u => u.id === 'turret_alpha' && u.level > 0) && (
                     <>
                        <div className="absolute bottom-10 left-[20%] w-8 h-8 text-blue-500 transition-transform duration-75" style={{ transform: `rotate(${turretAnglesRef.current['turret_alpha']}deg)` }}>
                            <svg viewBox="0 0 100 100" fill="currentColor"><rect x="40" y="-10" width="20" height="60"/><circle cx="50" cy="50" r="30"/></svg>
                        </div>
                        <div className="absolute bottom-10 right-[20%] w-8 h-8 text-blue-500 transition-transform duration-75" style={{ transform: `rotate(${turretAnglesRef.current['turret_alpha']}deg)` }}>
                            <svg viewBox="0 0 100 100" fill="currentColor"><rect x="40" y="-10" width="20" height="60"/><circle cx="50" cy="50" r="30"/></svg>
                        </div>
                     </>
                 )}
                 {upgrades.find(u => u.id === 'turret_beta' && u.level > 0) && (
                     <div className="absolute bottom-14 left-1/2 -translate-x-1/2 w-10 h-10 text-red-500 transition-transform duration-100" style={{ transform: `translateX(-50%) rotate(${turretAnglesRef.current['turret_beta']}deg)` }}>
                          <svg viewBox="0 0 100 100" fill="currentColor"><rect x="35" y="-20" width="30" height="70"/><rect x="20" y="40" width="60" height="40"/></svg>
                     </div>
                 )}

                 {/* GAME OVER OVERLAY */}
                 {gameOver && (
                     <div className="absolute inset-0 bg-black/90 z-[100] flex flex-col items-center justify-center animate-in fade-in backdrop-blur-sm">
                         <h2 className="text-5xl font-black text-red-500 mb-4 tracking-widest">CRITICAL FAILURE</h2>
                         <p className="text-gray-400 mb-8 font-mono">SECTOR LOST AT WAVE {wave}</p>
                         <button 
                            onClick={handleRestart}
                            className="px-8 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded shadow-[0_0_20px_red] transition-all"
                         >
                             REINITIALIZE SYSTEM
                         </button>
                     </div>
                 )}
            </div>

            {/* --- SIDEBAR (UPGRADES) --- */}
            <div className="w-80 bg-space-900 flex flex-col border-l border-white/10 z-30">
                <div className="p-4 border-b border-white/10 bg-black/20">
                    <div className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">RESOURCES</div>
                    <div className="text-3xl font-mono text-yellow-400 font-bold flex items-center gap-2">
                        <span>🔩</span> {formatNumber(scraps)}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {upgrades.map(u => {
                        let cost = Math.floor(u.cost * Math.pow(u.costMult, u.level));
                        if(u.id === 'repair') cost = u.cost;
                        const canAfford = scraps >= cost;

                        return (
                            <div 
                                key={u.id}
                                onClick={() => canAfford && handleBuyUpgrade(u.id)}
                                className={`
                                    p-3 rounded border flex items-center gap-3 transition-all select-none
                                    ${canAfford 
                                        ? 'bg-space-800 border-gray-600 hover:bg-space-700 hover:border-yellow-400 cursor-pointer active:scale-95' 
                                        : 'bg-black/40 border-white/5 opacity-50 cursor-not-allowed'}
                                `}
                            >
                                <div className="text-2xl w-10 h-10 flex items-center justify-center bg-black/50 rounded border border-white/10">
                                    {u.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center mb-1">
                                        <h4 className="font-bold text-sm text-gray-200 truncate">{u.name}</h4>
                                        <span className="text-[10px] bg-white/10 px-1.5 rounded text-gray-400">Lv.{u.level}</span>
                                    </div>
                                    <p className="text-[10px] text-gray-500 mb-2 leading-tight">{u.description}</p>
                                    <div className={`text-xs font-mono font-bold ${canAfford ? 'text-yellow-400' : 'text-red-400'}`}>
                                        {formatNumber(cost)} SCRAP
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                
                <div className="p-4 border-t border-white/10 bg-black/40">
                    <div className="text-xs font-bold text-gray-500 mb-2">TACTICAL READOUT</div>
                    <div className="space-y-1 text-[10px] font-mono text-gray-400">
                        <div className="flex justify-between"><span>BASE DMG:</span> <span className="text-neon-blue">{Math.floor(baseClickDamage)}</span></div>
                        <div className="flex justify-between"><span>FIRE RATE:</span> <span className={activeEffects['rapid'] ? 'text-yellow-400' : ''}>{activeEffects['rapid'] ? '200%' : '100%'}</span></div>
                        <div className="flex justify-between"><span>SHIELD MAX:</span> <span className="text-blue-400">{maxShield}</span></div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default StarDefense;
