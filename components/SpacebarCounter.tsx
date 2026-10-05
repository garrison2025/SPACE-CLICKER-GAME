import React, { useEffect, useRef, useState } from 'react';

const BEST_KEY = 'spacebar_counter_best_v1';

const SpacebarCounter: React.FC = () => {
  const [count, setCount] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [running, setRunning] = useState(false);
  const [currentCps, setCurrentCps] = useState(0);
  const [peakCps, setPeakCps] = useState(0);
  const [bestCount, setBestCount] = useState(() => Number(localStorage.getItem(BEST_KEY) || 0));
  const pressTimes = useRef<number[]>([]);
  const startedAt = useRef<number | null>(null);

  const press = () => {
    const now = performance.now();
    if (!running) {
      setRunning(true);
      startedAt.current = now;
    }
    pressTimes.current = [...pressTimes.current.filter((time) => now - time <= 1000), now];
    setCount((value) => {
      const next = value + 1;
      setBestCount((best) => {
        const nextBest = Math.max(best, next);
        localStorage.setItem(BEST_KEY, String(nextBest));
        return nextBest;
      });
      return next;
    });
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
      if (event.code === 'Space' && !event.repeat) {
        event.preventDefault();
        press();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      const now = performance.now();
      pressTimes.current = pressTimes.current.filter((time) => now - time <= 1000);
      const cps = pressTimes.current.length;
      setCurrentCps(cps);
      setPeakCps((value) => Math.max(value, cps));
      if (startedAt.current !== null) setElapsedMs(now - startedAt.current);
    }, 100);
    return () => window.clearInterval(timer);
  }, [running]);

  const reset = () => {
    setCount(0);
    setElapsedMs(0);
    setRunning(false);
    setCurrentCps(0);
    setPeakCps(0);
    pressTimes.current = [];
    startedAt.current = null;
  };

  const seconds = elapsedMs / 1000;
  const average = seconds > 0 ? count / seconds : 0;

  return (
    <div className="min-h-screen bg-space-950 text-gray-200">
      <section className="max-w-5xl mx-auto px-4 py-14">
        <div className="text-center mb-10">
          <div className="text-xs text-neon-blue font-mono tracking-[0.3em] mb-3">KEYBOARD UTILITY</div>
          <h1 className="text-4xl md:text-6xl font-display font-black text-white mb-4">Spacebar Counter</h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Count every deliberate spacebar press, watch live CPS, and compare your current run with the best count saved in this browser.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-space-900/80 p-6 md:p-10">
          <div className="text-center mb-8">
            <div className="text-7xl md:text-9xl font-mono font-black text-white tabular-nums">{count}</div>
            <div className="text-xs tracking-[0.25em] text-gray-500 mt-2">SPACEBAR PRESSES</div>
          </div>

          <button
            type="button"
            onPointerDown={(event) => { event.preventDefault(); press(); }}
            className="w-full min-h-[130px] rounded-2xl border-2 border-neon-blue bg-gradient-to-b from-space-700 to-black shadow-[0_12px_0_#062f38] active:translate-y-2 active:shadow-[0_4px_0_#062f38] transition-all select-none touch-manipulation"
          >
            <span className="block text-4xl font-display font-black tracking-[0.35em] text-white">SPACE</span>
            <span className="block mt-2 text-xs text-neon-blue font-mono">PRESS OR TAP</span>
          </button>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-8">
            <Metric label="Time" value={seconds.toFixed(1) + 's'} />
            <Metric label="Current CPS" value={currentCps.toFixed(1)} />
            <Metric label="Average CPS" value={average.toFixed(2)} />
            <Metric label="Peak CPS" value={peakCps.toFixed(1)} />
            <Metric label="Best Count" value={String(bestCount)} />
          </div>

          <div className="flex flex-wrap justify-center gap-3 mt-7">
            <button type="button" onClick={reset} className="px-5 py-2 rounded border border-white/10 hover:border-neon-blue">Reset</button>
            <button type="button" onClick={() => document.documentElement.requestFullscreen?.()} className="px-5 py-2 rounded border border-white/10 hover:border-neon-blue">Fullscreen</button>
            <a href="/spacebar-clicker/" className="px-5 py-2 rounded border border-white/10 hover:border-neon-blue">Play Spacebar Clicker</a>
            <a href="/spacebar-clicker-test/" className="px-5 py-2 rounded border border-white/10 hover:border-neon-blue">Open Speed Test</a>
          </div>
        </div>

        <article className="mt-14 space-y-8 text-gray-400 leading-relaxed">
          <section>
            <h2 className="text-2xl font-display text-white mb-3">What is a Spacebar Counter?</h2>
            <p>
              A spacebar counter is a simple keyboard tool that records intentional Space key presses. This page keeps the interface minimal:
              no upgrades, no idle economy, and no game progression. It is useful when the only goal is to count presses and watch current,
              average, and peak CPS.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-display text-white mb-3">Counter vs speed test</h2>
            <p>
              The counter runs until you reset it. For a timed challenge such as five, ten, thirty, or sixty seconds, use the dedicated
              Spacebar Clicker Test. For an incremental game with upgrades and prestige, use Spacebar Clicker.
            </p>
          </section>
        </article>
      </section>
    </div>
  );
};

const Metric = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg border border-white/5 bg-black/20 p-3 text-center">
    <div className="text-[10px] uppercase tracking-widest text-gray-500">{label}</div>
    <div className="mt-1 text-xl font-mono text-white">{value}</div>
  </div>
);

export default SpacebarCounter;
