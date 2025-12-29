
import React, { useState, useRef, useEffect } from 'react';
import { FloatingText, Planet, Upgrade } from '../types';
import { formatNumber } from '../utils';

interface ClickAreaProps {
  onMine: (x: number, y: number, multiplier?: number, isGeode?: boolean) => { amount: number; isCrit: boolean };
  productionRate: number;
  currency: number; 
  clickPower: number;
  planet: Planet;
  heat: number;
  overheated: boolean;
  upgrades: Upgrade[]; 
  isFlux: boolean;
}

interface Geode {
    id: number;
    top: number;
    left: number;
}

interface Debris {
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    rotation: number;
    vRot: number;
    color: string;
    size: number;
    life: number;
}

const ClickArea: React.FC<ClickAreaProps> = ({ 
  onMine, productionRate, currency, clickPower, planet, heat, overheated, upgrades, isFlux 
}) => {
  const [clicks, setClicks] = useState<FloatingText[]>([]);
  const [debris, setDebris] = useState<Debris[]>([]); 
  const [beams, setBeams] = useState<{id: number, x: number, y: number, color: string, width: number}[]>([]);
  const [geodes, setGeodes] = useState<Geode[]>([]);
  const [shake, setShake] = useState(0);
  const planetRef = useRef<HTMLDivElement>(null);

  // Safety check to prevent crash if planet data is missing
  if (!planet) return <div className="w-full h-full flex items-center justify-center text-red-500 font-mono">PLANET DATA CORRUPTED</div>;

  // Screen Shake Decay & Chromatic Abberation logic
  useEffect(() => {
    if (shake > 0) {
        const timer = requestAnimationFrame(() => setShake(prev => Math.max(0, prev - 1)));
        return () => cancelAnimationFrame(timer);
    }
  }, [shake]);

  // Helper to add a floating text
  const addFloatingText = (textObj: FloatingText) => {
      setClicks(prev => {
          const list = [...prev, textObj];
          if (list.length > 15) return list.slice(list.length - 15);
          return list;
      });
      setTimeout(() => {
          setClicks(prev => prev.filter(c => c.id !== textObj.id));
      }, 800);
  };

  // Passive Visuals (Automated Production)
  useEffect(() => {
      if (productionRate <= 0) return;
      const timer = setInterval(() => {
          if (!planetRef.current) return;
          const rect = planetRef.current.getBoundingClientRect();
          // Fallback if rect is zero (e.g. hidden)
          if (rect.width === 0) return;

          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          const angle = Math.random() * Math.PI * 2;
          const radius = rect.width / 2 + 10 + Math.random() * 30;
          
          const x = cx + Math.cos(angle) * radius;
          const y = cy + Math.sin(angle) * radius;
          
          // Spawn small passive particles
          const newDebris: Debris = {
              id: Date.now() + Math.random(),
              x: x,
              y: y,
              vx: Math.cos(angle) * 2,
              vy: Math.sin(angle) * 2,
              rotation: Math.random() * 360,
              vRot: Math.random() * 10 - 5,
              color: planet.colors.secondary,
              size: Math.random() * 3 + 2,
              life: 1.0
          };
          setDebris(prev => [...prev, newDebris]);

      }, 500); 
      return () => clearInterval(timer);
  }, [productionRate, planet]);

  // Geode Spawner
  useEffect(() => {
      const schedule = () => Math.random() * 15000 + 5000; 
      let timer: ReturnType<typeof setTimeout>;
      const spawn = () => {
          const newGeode = {
              id: Date.now(),
              top: 20 + Math.random() * 60,
              left: 20 + Math.random() * 60
          };
          setGeodes(prev => [...prev, newGeode]);
          setTimeout(() => setGeodes(prev => prev.filter(g => g.id !== newGeode.id)), 4000);
          timer = setTimeout(spawn, schedule());
      };
      timer = setTimeout(spawn, schedule());
      return () => clearTimeout(timer);
  }, []);

  const handleInteraction = (clientX: number, clientY: number, multiplier = 1, isGeode = false) => {
    if (overheated && !isGeode) return;

    // 1. Logic Call
    const { amount, isCrit } = onMine(clientX, clientY, multiplier, isGeode);

    // Shake Calculation
    const impact = isFlux ? 10 : (isCrit ? 5 : 2);
    setShake(prev => Math.min(prev + impact, 20));

    // 2. Visual: Dynamic Plasma Beam
    let beamColor = '#3b82f6'; 
    if (heat > 30) beamColor = '#06b6d4'; 
    if (heat > 60) beamColor = '#d946ef'; 
    if (heat > 80) beamColor = '#f43f5e'; 
    if (isCrit) beamColor = '#fbbf24'; 
    if (isGeode) beamColor = '#a855f7'; 

    const beamWidth = Math.max(2, (heat / 10) + (isCrit ? 10 : 0));

    const newBeam = { 
        id: Date.now() + Math.random(), 
        x: clientX, 
        y: clientY, 
        color: beamColor,
        width: beamWidth
    };
    setBeams(prev => [...prev, newBeam]);
    setTimeout(() => setBeams(prev => prev.filter(b => b.id !== newBeam.id)), 150); 

    // 3. Visual: Floating Text
    const newClick: FloatingText = {
      id: Date.now() + Math.random(),
      x: clientX - 20 + (Math.random() * 40 - 20),
      y: clientY - 50,
      text: isGeode ? `VENT! +${formatNumber(amount)}` : isCrit ? `CRIT! +${formatNumber(amount)}` : `+${formatNumber(amount)}`,
      opacity: 1,
      isCrit
    };
    addFloatingText(newClick);

    // 4. Visual: Physics Debris (Gravity based)
    const newDebris: Debris[] = [];
    const count = isCrit || isGeode || isFlux ? 8 : 3;
    
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 2;
      const pColor = Math.random() > 0.5 ? planet.colors.primary : beamColor;
      
      newDebris.push({
        id: Date.now() + Math.random() + i,
        x: clientX,
        y: clientY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 5,
        rotation: Math.random() * 360,
        vRot: Math.random() * 20 - 10,
        color: pColor,
        size: Math.random() * 6 + 2,
        life: 1.0
      });
    }
    setDebris(prev => [...prev, ...newDebris]);

     // 5. Visual: Planet Impact Flash
    if (planetRef.current) {
      planetRef.current.animate([
        { filter: 'brightness(1)' },
        { filter: `brightness(${isCrit ? 2 : 1.3})` }, 
        { filter: 'brightness(1)' }
      ], {
        duration: 80,
        easing: 'ease-out'
      });
    }
  };

  const handleGeodeClick = (e: React.MouseEvent, id: number) => {
      e.stopPropagation();
      setGeodes(prev => prev.filter(g => g.id !== id));
      handleInteraction(e.clientX, e.clientY, 50, true);
  };

  // Physics Loop for Debris
  useEffect(() => {
    let frameId: number;
    const gravity = 0.5;
    const friction = 0.98;

    const update = () => {
        setDebris(prev => prev.map(p => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vx: p.vx * friction,
            vy: p.vy * friction + gravity, 
            rotation: p.rotation + p.vRot,
            life: p.life - 0.02
        })).filter(p => p.life > 0));
        frameId = requestAnimationFrame(update);
    };
    update();
    return () => cancelAnimationFrame(frameId);
  }, []);

  // Orbiters Logic
  const droneCount = Math.min(upgrades.find(u => u.id === 'drone')?.count || 0, 8);
  const stationCount = Math.min(upgrades.find(u => u.id === 'station')?.count || 0, 3);
  const roverCount = Math.min(upgrades.find(u => u.id === 'rover')?.count || 0, 5);

  // Shake Style
  const containerStyle = { 
      transform: `translate(${Math.random() * shake - shake/2}px, ${Math.random() * shake - shake/2}px)`,
      filter: isFlux || shake > 10 ? `drop-shadow(${Math.random()*4-2}px 0 0 rgba(255,0,0,0.5)) drop-shadow(${Math.random()*-4+2}px 0 0 rgba(0,0,255,0.5))` : 'none'
  };

  return (
    <div 
      className={`relative w-full h-full min-h-[400px] flex flex-col items-center justify-center select-none overflow-visible ${overheated ? 'cursor-not-allowed' : 'cursor-crosshair'}`}
      onMouseDown={(e) => handleInteraction(e.clientX, e.clientY)}
    >
      <style>{`
        @keyframes fadeUp {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-60px) scale(1.2); }
        }
      `}</style>

      {/* Shake Container - Visuals ONLY */}
      <div className="absolute inset-0 transition-transform duration-75" style={containerStyle}>
          
          {/* Flux Overlay Effect */}
          {isFlux && (
              <div className="absolute inset-0 z-0 pointer-events-none opacity-30 mix-blend-overlay bg-gradient-to-t from-fuchsia-900 to-transparent animate-pulse"></div>
          )}
          
          {/* Laser Beams Layer */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible filter drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
              <defs>
                  <filter id="glow">
                      <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                      <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                  </filter>
              </defs>
              {beams.map(beam => (
                  <line 
                    key={beam.id}
                    x1="50%" y1="120%" 
                    x2={beam.x} y2={beam.y} 
                    stroke={beam.color}
                    strokeWidth={beam.width}
                    strokeLinecap="round"
                    filter="url(#glow)"
                    className="opacity-80"
                  />
              ))}
          </svg>
          
          {/* Overheat Warning Overlay */}
          {overheated && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-red-900/30 backdrop-blur-[2px] animate-pulse">
                  <div className="bg-black/80 border-2 border-red-500 text-red-500 px-6 py-4 rounded-xl font-display font-black text-2xl tracking-widest shadow-[0_0_50px_red]">
                      WEAPON OVERHEATED
                      <div className="text-xs text-white font-mono mt-2 text-center">COOLING DOWN...</div>
                  </div>
              </div>
          )}

          {/* MAIN HUD: Resources, Production, and Heat - Centered Top */}
          <div className="absolute top-8 text-center z-30 pointer-events-none w-full flex flex-col items-center gap-3">
            
            {/* Currency (Total) */}
            <div className="relative group bg-black/60 px-8 py-3 rounded-2xl backdrop-blur-md border border-white/10 shadow-2xl">
                <div className="text-[10px] text-gray-400 font-bold tracking-[0.2em] mb-1">RESOURCES</div>
                <div className="text-5xl md:text-7xl font-black text-white drop-shadow-[0_0_20px_rgba(255,215,0,0.5)]">
                    {formatNumber(currency)} <span className="text-xl md:text-3xl text-yellow-400">SD</span>
                </div>
            </div>

            {/* Production Rate (Per Second) */}
            <div className="flex items-center gap-2 bg-black/60 px-4 py-1.5 rounded-full border border-white/10 backdrop-blur-sm shadow-lg">
                <span className="w-2 h-2 bg-neon-green rounded-full animate-pulse"></span>
                <p className="text-base md:text-xl font-mono text-neon-blue">
                    +{formatNumber(productionRate)}/s
                </p>
            </div>

            {/* Horizontal Heat Gauge */}
            <div className="flex flex-col items-center gap-1 w-64 md:w-80">
                <div className="flex justify-between w-full text-[9px] font-bold tracking-widest text-gray-500">
                    <span>HEAT</span>
                    <span className={heat > 80 ? 'text-red-500 animate-pulse' : 'text-gray-400'}>{Math.floor(heat)}%</span>
                </div>
                <div className={`w-full h-2 bg-gray-800 rounded-full overflow-hidden border border-white/10 ${isFlux ? 'shadow-[0_0_10px_fuchsia]' : ''}`}>
                    <div 
                        className={`h-full transition-all duration-200 ${overheated ? 'bg-red-600' : isFlux ? 'bg-gradient-to-r from-fuchsia-600 to-white animate-pulse' : heat > 50 ? 'bg-gradient-to-r from-orange-500 to-yellow-400' : 'bg-gradient-to-r from-blue-600 to-cyan-400'}`}
                        style={{ width: `${heat}%` }}
                    ></div>
                </div>
                {isFlux && <div className="text-[9px] text-fuchsia-400 animate-pulse font-bold tracking-wider">FLUX STATE ACTIVE</div>}
            </div>

            {/* Planet Name */}
            <p className="text-[10px] text-gray-500 tracking-widest mt-1 uppercase border-t border-white/10 pt-2 w-32 drop-shadow-md bg-black/40 rounded px-2">
                {planet.name}
            </p>
          </div>

          {/* The Planet Container - Centered Vertically */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-80 h-80 md:w-[34rem] md:h-[34rem] max-w-[90vw] max-h-[90vh] aspect-square flex items-center justify-center">
            {/* Geodes */}
            {geodes.map(g => (
                <div 
                    key={g.id}
                    onClick={(e) => handleGeodeClick(e, g.id)}
                    className="absolute w-12 h-12 z-50 cursor-pointer animate-pulse hover:scale-125 transition-transform group"
                    style={{ top: `${g.top}%`, left: `${g.left}%` }}
                >
                    <div className="w-full h-full bg-fuchsia-500 rotate-45 border-2 border-white shadow-[0_0_20px_fuchsia] group-hover:bg-white transition-colors"></div>
                </div>
            ))}

            {/* Orbiters */}
            <div className="absolute inset-0 pointer-events-none animate-[spin_20s_linear_infinite]">
                {Array.from({ length: droneCount }).map((_, i) => (
                    <div key={`drone-${i}`} className="absolute top-0 left-1/2 -translate-x-1/2 -mt-4 w-3 h-3 bg-white rounded-full shadow-[0_0_10px_white]" style={{ transform: `rotate(${i * (360/droneCount)}deg) translateY(-30px)` }}></div>
                ))}
            </div>
            <div className="absolute inset-4 pointer-events-none animate-[spin_15s_linear_infinite_reverse] opacity-80">
                 {Array.from({ length: roverCount }).map((_, i) => (
                    <div key={`rover-${i}`} className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-3 bg-orange-400 rounded-sm" style={{ transform: `rotate(${i * (360/roverCount)}deg) translateY(15px)` }}></div>
                ))}
            </div>
            <div className="absolute -inset-16 pointer-events-none animate-[spin_60s_linear_infinite]">
                 {Array.from({ length: stationCount }).map((_, i) => (
                    <div key={`station-${i}`} className="absolute top-1/2 right-0 w-8 h-8 border border-neon-blue bg-black/80 rounded-full flex items-center justify-center text-[10px] shadow-[0_0_15px_blue]" style={{ transform: `rotate(${i * (360/stationCount)}deg) translateX(50%)` }}>🛰️</div>
                ))}
            </div>

            {/* Planet Surface */}
            <div 
                ref={planetRef}
                className={`w-full h-full rounded-full transition-all duration-300 relative overflow-hidden group ${isFlux ? 'shadow-[0_0_120px_fuchsia]' : ''}`}
                style={{
                    background: `radial-gradient(circle at 35% 35%, ${isFlux ? '#d946ef' : planet.colors.primary}, ${planet.colors.secondary})`,
                    boxShadow: isFlux ? `0 0 100px ${planet.colors.atmosphere}, inset -10px -10px 40px rgba(0,0,0,0.8)` : `0 0 60px ${planet.colors.atmosphere}, inset -10px -10px 40px rgba(0,0,0,0.8)`
                }}
            >
                <div className="absolute inset-0 rounded-full opacity-60 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] border-[2px] border-white/10 rounded-full animate-spin-slow pointer-events-none"></div>
                
                {/* Glow on hover/active */}
                <div 
                    className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-30 transition-opacity duration-300 bg-white mix-blend-overlay"
                ></div>
            </div>
          </div>

          {/* Physics Debris */}
          {debris.map(p => (
            <div 
              key={p.id}
              className="absolute rounded-sm pointer-events-none z-30"
              style={{
                left: p.x,
                top: p.y,
                width: `${p.size}px`,
                height: `${p.size}px`,
                backgroundColor: p.color,
                opacity: p.life,
                transform: `rotate(${p.rotation}deg)`,
                boxShadow: `0 0 ${p.size}px ${p.color}`
              }}
            />
          ))}
      </div>

      {/* Floating Text - Rendered OUTSIDE shake container to ensure fixed positioning works */}
      {clicks.map(click => (
        <div
          key={click.id}
          className={`fixed font-display font-black pointer-events-none select-none whitespace-nowrap ${click.isCrit ? 'text-5xl text-yellow-400 z-[60]' : 'text-3xl text-white z-50'}`}
          style={{
            left: click.x,
            top: click.y,
            animation: 'fadeUp 0.8s ease-out forwards', 
            textShadow: click.isCrit ? '0 0 30px rgba(251, 191, 36, 1), 0 0 5px white' : '0 0 10px rgba(0, 243, 255, 0.8)',
            color: click.isCrit ? '#fcd34d' : undefined,
            transform: 'translate(-50%, -50%)' // Ensure centered on click
          }}
        >
          {click.text}
        </div>
      ))}
    </div>
  );
};

export default ClickArea;
