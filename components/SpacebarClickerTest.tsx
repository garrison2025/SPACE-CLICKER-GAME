import React, { useEffect, useRef, useState } from 'react';

const DURATIONS = [1, 5, 10, 30, 60] as const;
const BEST_PREFIX = 'spacebar_test_best_';

const SpacebarClickerTest: React.FC = () => {
  const [duration, setDuration] = useState<number>(10);
  const [clicks, setClicks] = useState(0);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(duration);
  const [currentCps, setCurrentCps] = useState(0);
  const [peakCps, setPeakCps] = useState(0);
  const [bestCps, setBestCps] = useState(() => Number(localStorage.getItem(BEST_PREFIX + duration) || 0));
  const startedAt = useRef<number | null>(null);
  const pressTimes = useRef<number[]>([]);
  const clicksRef = useRef(0);

  useEffect(() => {
    setBestCps(Number(localStorage.getItem(BEST_PREFIX + duration) || 0));
    setTimeLeft(duration);
  }, [duration]);

  const finish = (elapsed: number) => {
    const average = elapsed > 0 ? clicksRef.current / elapsed : 0;
    setRunning(false);
    setFinished(true);
    setTimeLeft(0);
    setBestCps((best) => {
      const next = Math.max(best, average);
      localStorage.setItem(BEST_PREFIX + duration, String(next));
      return next;
    });
  };

  const press = () => {
    if (finished) return;
    const now = performance.now();
    if (!running) {
      startedAt.current = now;
      setRunning(true);
      setFinished(false);
    }
    pressTimes.current = [...pressTimes.current.filter((time) => now - time <= 1000), now];
    clicksRef.current += 1;
    setClicks(clicksRef.current);
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
    if (!running || startedAt.current === null) return;
    const timer = window.setInterval(() => {
      const now = performance.now();
      const elapsed = (now - (startedAt.current || now)) / 1000;
      const remaining = Math.max(0, duration - elapsed);
      pressTimes.current = pressTimes.current.filter((time) => now - time <= 1000);
      const cps = pressTimes.current.length;
      setCurrentCps(cps);
      setPeakCps((value) => Math.max(value, cps));
      setTimeLeft(remaining);
      if (remaining <= 0) finish(duration);
    }, 50);
    return () => window.clearInterval(timer);
  }, [running, duration]);

  const reset = (nextDuration = duration) => {
    setDuration(nextDuration);
    setClicks(0);
    clicksRef.current = 0;
    setRunning(false);
    setFinished(false);
    setTimeLeft(nextDuration);
    setCurrentCps(0);
    setPeakCps(0);
    startedAt.current = null;
    pressTimes.current = [];
  };

  const elapsed = running
    ? Math.max(0, duration - timeLeft)
    : finished
      ? duration
      : 0;
  const averageCps = elapsed > 0 ? clicks / elapsed : 0;
  const rating =
    averageCps >= 12 ? 'ELITE' :
    averageCps >= 9 ? 'FAST' :
    averageCps >= 6 ? 'SOLID' :
    averageCps > 0 ? 'WARMING UP' :
    'READY';

  return (
    <div className="min-h-screen bg-space-950 text-gray-200">
      <section className="max-w-5xl mx-auto px-4 py-14">
        <div className="text-center mb-9">
          <div className="text-xs text-neon-blue font-mono tracking-[0.3em] mb-3">CPS SPEED TEST</div>
          <h1 className="text-4xl md:text-6xl font-display font-black text-white mb-4">Spacebar Clicker Test</h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Measure your space bar click speed over a fixed duration. The test reports total presses, average CPS, peak CPS and your best local result.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-space-900/80 p-6 md:p-10">
          <div className="flex flex-wrap justify-center gap-2 mb-7">
            {DURATIONS.map((value) => (
              <button
                key={value}
                type="button"
                disabled={running}
                onClick={() => reset(value)}
                className={'px-4 py-2 rounded border text-sm ' + (duration === value ? 'border-neon-blue text-neon-blue bg-neon-blue/5' : 'border-white/10 text-gray-400')}
              >
                {value}s
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-7">
            <Metric label="Time Left" value={timeLeft.toFixed(2) + 's'} />
            <Metric label="Clicks" value={String(clicks)} />
            <Metric label="Current CPS" value={currentCps.toFixed(1)} />
            <Metric label="Peak CPS" value={peakCps.toFixed(1)} />
          </div>

          <button
            type="button"
            disabled={finished}
            onPointerDown={(event) => { event.preventDefault(); press(); }}
            className="w-full min-h-[150px] rounded-2xl border-2 border-neon-blue bg-gradient-to-b from-space-700 to-black shadow-[0_12px_0_#062f38] active:translate-y-2 active:shadow-[0_4px_0_#062f38] disabled:opacity-50 transition-all select-none touch-manipulation"
          >
            <span className="block text-4xl md:text-5xl font-display font-black tracking-[0.35em] text-white">SPACE</span>
            <span className="block mt-2 text-xs text-neon-blue font-mono">
              {finished ? 'TEST COMPLETE' : running ? 'KEEP PRESSING' : 'PRESS TO START'}
            </span>
          </button>

          {finished && (
            <div className="mt-8 rounded-xl border border-neon-green/30 bg-neon-green/5 p-6 text-center">
              <div className="text-xs tracking-[0.25em] text-neon-green">RESULT</div>
              <div className="text-4xl font-display font-black text-white mt-2">{averageCps.toFixed(2)} CPS</div>
              <div className="mt-2 text-neon-blue font-mono">{rating}</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
                <Metric label="Clicks" value={String(clicks)} />
                <Metric label="Average CPS" value={averageCps.toFixed(2)} />
                <Metric label="Peak CPS" value={peakCps.toFixed(1)} />
                <Metric label="Personal Best" value={bestCps.toFixed(2)} />
              </div>
              <button type="button" onClick={() => reset()} className="mt-6 px-6 py-2 rounded bg-neon-green text-black font-bold">
                Try Again
              </button>
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-3 mt-7">
            {!finished && <button type="button" onClick={() => reset()} className="px-5 py-2 rounded border border-white/10 hover:border-neon-blue">Reset</button>}
            <a href="/spacebar-counter/" className="px-5 py-2 rounded border border-white/10 hover:border-neon-blue">Open Counter</a>
            <a href="/spacebar-clicker/" className="px-5 py-2 rounded border border-white/10 hover:border-neon-blue">Play Game</a>
          </div>
        </div>

        <article className="mt-14 space-y-8 text-gray-400 leading-relaxed">
          <section>
            <h2 className="text-2xl font-display text-white mb-3">How the Spacebar Clicker Test works</h2>
            <p>
              Choose a duration and start with your first intentional Space press. Browser key-repeat is ignored, so holding the key down does not inflate the result.
              Average CPS is total valid presses divided by the selected duration, while peak CPS measures the strongest rolling one-second burst.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-display text-white mb-3">Which test length should you use?</h2>
            <p>
              One and five seconds measure burst speed. Ten seconds is a useful general benchmark. Thirty and sixty seconds reward consistency rather than a short sprint.
              Your best average result is stored locally for each test duration.
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

export default SpacebarClickerTest;
