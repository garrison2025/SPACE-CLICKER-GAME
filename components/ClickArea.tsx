import React, { useState, useRef, useEffect } from 'react';
import { FloatingText, Particle, Planet, Upgrade } from '../types';
import { formatNumber } from '../utils';

interface ClickAreaProps {
  onMine: (x: number, y: number, multiplier?: number, isGeode?: boolean) => { amount: number; isCrit: boolean };
  productionRate: number;
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

const ClickArea: React.FC<ClickAreaProps> = ({ 
  onMine, productionRate, clickPower, planet, heat, overheated, upgrades, isFlux 
}) => {
  const [clicks, setClicks] = useState<FloatingText[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [beams, setBeams] = useState<{id: number, x: number, y: number, color: string}[]>([]);
  const [geodes, setGeodes] = useState<Geode[]>([]);
  const [shake, setShake] = useState(0);
  const planetRef = useRef<HTMLDivElement>(null);

  // Screen Shake Decay
  useEffect(() => {
    if (shake > 0) {
        const timer = requestAnimationFrame(() => setShake(prev => Math.max(0, prev - 1)));
        return () => cancelAnimationFrame(timer);
    }
  }, [shake]);

  // Helper to add a floating text with auto-removal
  const addFloatingText = (textObj: FloatingText) => {
      setClicks(prev => {
          // Keep max 20 items to prevent lag/clutter
          const list = [...prev, textObj];
          if (list.length > 20) return list.slice(list.length - 20);
          return list;
      });

      // Force remove after animation duration (1s)
      setTimeout(() => {
          setClicks(prev => prev.filter(c => c.id !== textObj.id));
      }, 800);
  };

  // Passive Visuals (Automated Production)
  useEffect(() => {
      if (productionRate <= 0) return;
      
      const timer = setInterval(() => {
          if (!planetRef.current) return;
          
          // Get planet bounds to spawn text around it
          const rect = planetRef.current.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          
          // Random position in a ring around the planet
          const angle = Math.random() * Math.PI * 2;
          const radius = rect.width / 2 + 20 + Math.random() * 40;
          
          const x = cx + Math.cos(angle) * radius;
          const y = cy + Math.sin(angle) * radius;

          // Show aggregate amount for the interval (2s)
          const amount = productionRate * 2;
          
          const newClick: FloatingText = {
              id: Date.now() + Math.random(),
              x: x,
              y: y,
              text: `+${formatNumber(amount)}`,
              opacity: 0.7, // Initial opacity handled by CSS now, but keeping for logic
              isCrit: false
          };
          
          addFloatingText(newClick);

      }, 2000); // Trigger every 2 seconds

      return () => clearInterval(timer);
  }, [productionRate]);

  // Geode Spawner
  useEffect(() => {
      const schedule = () => Math.random() * 15000 + 5000; // 5-20s spawn rate
      let timer: ReturnType<typeof setTimeout>;
      const spawn = () => {
          const newGeode = {
              id: Date.now(),
              top: 20 + Math.random() * 60, // 20% to 80%
              left: 20 + Math.random() * 60
          };
          setGeodes(prev => [...prev, newGeode]);
          setTimeout(() => setGeodes(prev => prev.filter(g => g.id !== newGeode.id)), 3000);
          timer = setTimeout(spawn, schedule());
      };
      timer = setTimeout(spawn, schedule());
      return () => clearTimeout(timer);
  }, []);

  const handleInteraction = (clientX: number, clientY: number, multiplier = 1, isGeode = false) => {
    if (overheated && !isGeode) return;

    // 1. Logic Call
    const { amount, isCrit } = onMine(clientX, clientY, multiplier, isGeode);

    // Shake
    if (isCrit || multiplier > 1 || isFlux) {
        setShake(prev => Math.min(prev + (isFlux ? 8 : 5), 15));
    }

    // 2. Visual: Laser Beam
    const beamColor = isFlux ? '#d946ef' : (isGeode ? '#a855f7' : (isCrit ? '#fbbf24' : '#00f3ff')); 
    const newBeam = { id: Date.now(), x: clientX, y: clientY, color: beamColor };
    setBeams(prev => [...prev, newBeam]);
    setTimeout(() => setBeams(prev => prev.filter(b => b.id !== newBeam.id)), 100); 

    // 3. Visual: Floating Text
    const newClick: FloatingText = {
      id: Date.now() + Math.random(),
      x: clientX - 20 + (Math.random() * 20 - 10),
      y: clientY - 40,
      text: isGeode ? `VENT! +${formatNumber(amount)}` : isCrit ? `CRIT! +${formatNumber(amount)}` : `+${formatNumber(amount)}`,
      opacity: 1,
      isCrit
    };
    addFloatingText(newClick);

    // 4. Visual: Particles
    const newParticles: Particle[] = [];
    const count = isCrit || isGeode || isFlux ? 12 : 5;
    const speed = isCrit || isGeode || isFlux ? 6 : 3;
    
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const velocity = Math.random() * speed + 2;
      newParticles.push({
        id: Date.now() + Math.random() + i,
        x: clientX,
        y: clientY,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        life: 1.0,
        color: isGeode ? '#a855f7' : (isFlux ? '#d946ef' : (isCrit ? '#fbbf24' : '#00f3ff'))
      });
    }
    setParticles(prev => [...prev, ...newParticles]);

     // 5. Visual: Bounce
    if (planetRef.current) {
      planetRef.current.animate([
        { transform: 'scale(1)' },
        { transform: `scale(${isCrit ? 1.05 : 0.98})` },
        { transform: 'scale(1)' }
      ], {
        duration: 100,
        easing: 'ease-out'
      });
    }
  };

  const handleGeodeClick = (e: React.MouseEvent, id: number) => {
      e.stopPropagation();
      setGeodes(prev => prev.filter(g => g.id !== id));
      handleInteraction(e.clientX, e.clientY, 50, true);
  };

  // Particle Loop
  useEffect(() => {
    let frameId: number;
    const update = () => {
        setParticles(prev => prev.map(p => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            life: p.life - 0.05
        })).filter(p => p.life > 0));
        frameId = requestAnimationFrame(update);
    };
    update();
    return () => cancelAnimationFrame(frameId);
  }, []);

  // Determine Orbiters
  const droneCount = Math.min(upgrades.find(u => u.id === 'drone')?.count || 0, 8);
  const stationCount = Math.min(upgrades.find(u => u.id === 'station')?.count || 0, 3);
  const roverCount = Math.min(upgrades.find(u => u.id === 'rover')?.count || 0, 5);

  const containerStyle = shake > 0 ? { transform: `translate(${Math.random() * shake - shake/2}px, ${Math.random() * shake - shake/2}px)` } : {};

  return (
    <div 
      className={`relative w-full h-full flex flex-col items-center justify-center select-none overflow-hidden ${overheated ? 'cursor-not-allowed' : 'cursor-crosshair'}`}
      onMouseDown={(e) => handleInteraction(e.clientX, e.clientY)}
      style={containerStyle}
    >
      <style>{`
        @keyframes fadeUp {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          50% { opacity: 1; transform: translateY(-20px) scale(1.1); }
          100% { opacity: 0; transform: translateY(-40px) scale(0.9); }
        }
        @keyframes chromaticPulse {
          0% { text-shadow: 2px 0 red, -2px 0 blue; filter: hue-rotate(0deg); }
          50% { text-shadow: -2px 0 red, 2px 0 blue; filter: hue-rotate(10deg); }
          100% { text-shadow: 2px 0 red, -2px 0 blue; filter: hue-rotate(0deg); }
        }
      `}</style>
      
      {/* Flux Overlay Effect */}
      {isFlux && (
          <div className="absolute inset-0 z-0 pointer-events-none opacity-20 mix-blend-screen bg-fuchsia-900 animate-pulse"></div>
      )}
      {isFlux && (
          <div className="absolute inset-0 z-50 pointer-events-none border-[10px] border-fuchsia-500/20 blur-sm"></div>
      )}

      {/* Laser Beams Layer */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible">
          {beams.map(beam => (
              <line 
                key={beam.id}
                x1="50%" y1="120%" 
                x2={beam.x} y2={beam.y} 
                stroke={beam.color}
                strokeWidth={isFlux ? "8" : "4"}
                strokeLinecap="round"
                className="opacity-60"
                style={{ filter: isFlux ? 'drop-shadow(0 0 10px #d946ef)' : 'none' }}
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

      {/* Production Rate HUD */}
      <div className="absolute top-8 text-center z-10 pointer-events-none mix-blend-screen">
        <p className="text-neon-blue text-xs md:text-sm tracking-[0.3em] font-display opacity-80 mb-1">
          AUTO-HARVEST
        </p>
        <p className="text-3xl md:text-5xl font-black text-white drop-shadow-[0_0_15px_rgba(0,243,255,0.5)]">
          {formatNumber(productionRate)} <span className="text-sm text-gray-500 font-sans font-normal">/s</span>
        </p>
        <p className="text-[10px] text-gray-500 tracking-widest mt-1 uppercase">{planet.name}</p>
        
        {isFlux && (
            <div className="mt-2 text-fuchsia-400 font-black text-xs animate-pulse tracking-[0.5em] border border-fuchsia-500/50 bg-fuchsia-900/20 px-2 py-1 rounded inline-block shadow-[0_0_20px_fuchsia]">
                ⚡ MAX FLUX OUTPUT ⚡
            </div>
        )}
      </div>

      {/* Heat Gauge */}
      <div className={`absolute left-4 md:left-20 top-1/2 -translate-y-1/2 h-64 w-4 bg-gray-900 rounded-full border overflow-hidden flex flex-col justify-end z-20 ${isFlux ? 'border-fuchsia-500 shadow-[0_0_15px_fuchsia] animate-pulse' : 'border-gray-700'}`}>
          <div className="absolute top-[1%] left-0 w-full h-[19%] bg-white/10 pointer-events-none z-10 border-b border-white/20"></div>
          <div 
             className={`w-full transition-all duration-200 ${overheated ? 'bg-red-500' : isFlux ? 'bg-fuchsia-400 shadow-[0_0_20px_fuchsia]' : heat > 50 ? 'bg-yellow-400' : 'bg-neon-blue'}`}
             style={{ height: `${heat}%` }}
          ></div>
      </div>
      <div className={`absolute left-10 md:left-28 top-1/2 -translate-y-1/2 -rotate-90 origin-left text-[10px] font-bold tracking-widest whitespace-nowrap ${isFlux ? 'text-fuchsia-400 animate-pulse' : 'text-gray-500'}`}>
          LASER HEAT {Math.floor(heat)}%
      </div>

      {/* The Planet Container */}
      <div className="relative z-20 w-64 h-64 md:w-96 md:h-96">
        {/* Geodes */}
        {geodes.map(g => (
            <div 
                key={g.id}
                onClick={(e) => handleGeodeClick(e, g.id)}
                className="absolute w-8 h-8 z-50 cursor-pointer animate-pulse hover:scale-125 transition-transform"
                style={{ top: `${g.top}%`, left: `${g.left}%` }}
            >
                <div className="w-full h-full bg-fuchsia-500 rotate-45 border-2 border-white shadow-[0_0_15px_fuchsia]"></div>
            </div>
        ))}

        {/* Orbiters */}
        <div className="absolute inset-0 pointer-events-none animate-[spin_20s_linear_infinite]">
            {Array.from({ length: droneCount }).map((_, i) => (
                <div key={`drone-${i}`} className="absolute top-0 left-1/2 -translate-x-1/2 -mt-4 w-2 h-2 bg-white rounded-full shadow-[0_0_10px_white]" style={{ transform: `rotate(${i * (360/droneCount)}deg) translateY(-20px)` }}></div>
            ))}
        </div>
        <div className="absolute inset-4 pointer-events-none animate-[spin_15s_linear_infinite_reverse] opacity-80">
             {Array.from({ length: roverCount }).map((_, i) => (
                <div key={`rover-${i}`} className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-orange-400 rounded-sm" style={{ transform: `rotate(${i * (360/roverCount)}deg) translateY(10px)` }}></div>
            ))}
        </div>
        <div className="absolute -inset-12 pointer-events-none animate-[spin_60s_linear_infinite]">
             {Array.from({ length: stationCount }).map((_, i) => (
                <div key={`station-${i}`} className="absolute top-1/2 right-0 w-6 h-6 border border-neon-blue bg-black rounded-full flex items-center justify-center text-[8px]" style={{ transform: `rotate(${i * (360/stationCount)}deg) translateX(50%)` }}>🛰️</div>
            ))}
        </div>

        {/* Planet Surface */}
        <div 
            ref={planetRef}
            className={`w-full h-full rounded-full transition-all duration-1000 relative overflow-hidden group ${isFlux ? 'shadow-[0_0_100px_fuchsia]' : ''}`}
            style={{
                background: `radial-gradient(circle at 35% 35%, ${planet.colors.primary}, ${planet.colors.secondary})`,
                boxShadow: isFlux ? `0 0 80px ${planet.colors.atmosphere}, inset -10px -10px 40px rgba(0,0,0,0.8)` : `0 0 60px ${planet.colors.atmosphere}, inset -10px -10px 40px rgba(0,0,0,0.8)`
            }}
        >
            <div className="absolute inset-0 rounded-full opacity-60 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] border-[2px] border-white/10 rounded-full animate-spin-slow pointer-events-none"></div>
            <div 
                className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ boxShadow: `0 0 100px ${planet.colors.atmosphere}` }}
            ></div>
        </div>
      </div>

      {/* Visual Particles */}
      {particles.map(p => (
        <div 
          key={p.id}
          className="absolute rounded-full pointer-events-none z-30"
          style={{
            left: p.x,
            top: p.y,
            width: '6px',
            height: '6px',
            backgroundColor: p.color,
            opacity: p.life,
            transform: `scale(${p.life})`,
            boxShadow: `0 0 10px ${p.color}`
          }}
        />
      ))}

      {/* Floating Text */}
      {clicks.map(click => (
        <div
          key={click.id}
          className={`fixed font-display font-black pointer-events-none select-none ${click.isCrit ? 'text-4xl text-yellow-400 z-50' : 'text-3xl text-white z-40'}`}
          style={{
            left: click.x,
            top: click.y,
            animation: 'fadeUp 0.8s ease-out forwards', 
            textShadow: click.isCrit ? '0 0 20px rgba(251, 191, 36, 1)' : '0 0 10px rgba(0, 243, 255, 0.8)',
            color: click.opacity < 0.8 && !click.isCrit ? '#aaa' : undefined
          }}
        >
          {click.text}
        </div>
      ))}
    </div>
  );
};

export default ClickArea;