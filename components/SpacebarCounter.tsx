import React, { useEffect, useRef, useState } from 'react';
import { playSound } from '../services/audioService';
import { isInteractiveKeyboardTarget } from '../utils/keyboard';
import { safeGetStorageItem, safeSetStorageItem } from '../utils/projectStorage';

const BEST_KEY = 'spacebar_counter_best_v1';
const CURRENT_KEY = 'spacebar_counter_current_v1';

const loadCounterValue = (key: string) => {
  const value = Number(safeGetStorageItem(key) || 0);
  return Number.isFinite(value) && value >= 0
    ? Math.min(Number.MAX_SAFE_INTEGER, Math.floor(value))
    : 0;
};

const loadBestCount = () => loadCounterValue(BEST_KEY);
const loadCurrentCount = () => loadCounterValue(CURRENT_KEY);

const SpacebarCounter: React.FC = () => {
  const [count, setCount] = useState(loadCurrentCount);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [running, setRunning] = useState(false);
  const [currentCps, setCurrentCps] = useState(0);
  const [peakCps, setPeakCps] = useState(0);
  const [bestCount, setBestCount] = useState(() => Math.max(loadBestCount(), loadCurrentCount()));
  const [manualCountInput, setManualCountInput] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const pressTimes = useRef<number[]>([]);
  const startedAt = useRef<number | null>(null);
  const countRef = useRef(count);
  const bestCountRef = useRef(bestCount);
  const hiddenAtRef = useRef<number | null>(null);

  const press = () => {
    const now = performance.now();
    if (soundEnabled) playSound('click');
    if (startedAt.current === null) {
      startedAt.current = now;
      setRunning(true);
    }

    pressTimes.current = [...pressTimes.current.filter((time) => now - time <= 1000), now];

    const nextCount = Math.min(Number.MAX_SAFE_INTEGER, countRef.current + 1);
    const nextBest = Math.max(bestCountRef.current, nextCount);
    countRef.current = nextCount;
    bestCountRef.current = nextBest;
    setCount(nextCount);
    setBestCount(nextBest);
    safeSetStorageItem(CURRENT_KEY, String(nextCount));
    safeSetStorageItem(BEST_KEY, String(nextBest));
  };

  const pressRef = useRef(press);
  useEffect(() => {
    pressRef.current = press;
  });

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (isInteractiveKeyboardTarget(event.target)) return;
      if (event.code === 'Space' && !event.repeat) {
        event.preventDefault();
        pressRef.current();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      if (document.hidden) return;
      const now = performance.now();
      pressTimes.current = pressTimes.current.filter((time) => now - time <= 1000);
      const cps = pressTimes.current.length;
      setCurrentCps(cps);
      setPeakCps((value) => Math.max(value, cps));
      if (startedAt.current !== null) setElapsedMs(now - startedAt.current);
    }, 200);
    return () => window.clearInterval(timer);
  }, [running]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const now = performance.now();

      if (document.hidden) {
        hiddenAtRef.current = running ? now : null;
        pressTimes.current = [];
        setCurrentCps(0);
        return;
      }

      if (running && hiddenAtRef.current !== null && startedAt.current !== null) {
        const hiddenDuration = Math.max(0, now - hiddenAtRef.current);
        startedAt.current += hiddenDuration;
        setElapsedMs(Math.max(0, now - startedAt.current));
      }
      hiddenAtRef.current = null;
      pressTimes.current = [];
      setCurrentCps(0);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [running]);

  const resetSessionMetrics = () => {
    setElapsedMs(0);
    setRunning(false);
    setCurrentCps(0);
    setPeakCps(0);
    pressTimes.current = [];
    startedAt.current = null;
    hiddenAtRef.current = null;
  };

  const reset = () => {
    countRef.current = 0;
    setCount(0);
    safeSetStorageItem(CURRENT_KEY, '0');
    resetSessionMetrics();
    setStatusMessage('Current count reset to zero. Highest total is kept.');
  };

  const decrement = () => {
    const nextCount = Math.max(0, countRef.current - 1);
    countRef.current = nextCount;
    setCount(nextCount);
    safeSetStorageItem(CURRENT_KEY, String(nextCount));
    setStatusMessage(nextCount === 0 ? 'Current count is zero.' : 'Removed one from the current total.');
  };

  const applyManualCount = () => {
    const raw = manualCountInput.trim();
    if (!raw) {
      setStatusMessage('Enter a whole number from 0 up to the browser-safe integer limit.');
      return;
    }

    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed < 0) {
      setStatusMessage('Enter a valid non-negative number.');
      return;
    }

    const nextCount = Math.min(Number.MAX_SAFE_INTEGER, Math.floor(parsed));
    const nextBest = Math.max(bestCountRef.current, nextCount);
    countRef.current = nextCount;
    bestCountRef.current = nextBest;
    setCount(nextCount);
    setBestCount(nextBest);
    setManualCountInput('');
    safeSetStorageItem(CURRENT_KEY, String(nextCount));
    safeSetStorageItem(BEST_KEY, String(nextBest));
    resetSessionMetrics();
    setStatusMessage(`Current count set to ${nextCount}. Timing metrics restarted.`);
  };

  const seconds = elapsedMs / 1000;
  const average = seconds > 0 ? count / seconds : 0;

  const enterFullscreen = async () => {
    if (document.fullscreenElement || !document.documentElement.requestFullscreen) {
      setStatusMessage(document.fullscreenElement ? 'Fullscreen is already active.' : 'Fullscreen is not supported in this browser.');
      return;
    }

    try {
      await document.documentElement.requestFullscreen();
      setStatusMessage('Fullscreen enabled.');
    } catch {
      setStatusMessage('Fullscreen request was blocked by the browser.');
    }
  };

  return (
    <div className="min-h-screen bg-space-950 text-gray-200">
      <section className="max-w-5xl mx-auto px-4 py-14">
        <div className="text-center mb-10">
          <div className="text-xs text-neon-blue font-mono tracking-[0.3em] mb-3">KEYBOARD UTILITY</div>
          <h1 className="text-4xl md:text-6xl font-display font-black text-white mb-4">Spacebar Counter</h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Count every deliberate spacebar press, correct the total when needed, and keep the current and highest totals saved in this browser.
          </p>
          <div className="mt-6 grid sm:grid-cols-3 gap-2 text-left max-w-3xl mx-auto">
            <a href="/spacebar-counter/" aria-current="page" className="rounded-xl border border-neon-blue/40 bg-neon-blue/5 px-4 py-3">
              <div className="text-[10px] font-mono text-neon-blue uppercase tracking-wider">Counter</div>
              <div className="mt-1 text-sm font-bold text-white">Untimed press total</div>
            </a>
            <a href="/spacebar-clicker-test/" className="rounded-xl border border-white/10 bg-space-900/60 px-4 py-3 hover:border-neon-blue/40 transition-colors">
              <div className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Speed test</div>
              <div className="mt-1 text-sm font-bold text-white">Timed CPS modes</div>
            </a>
            <a href="/spacebar-clicker/" className="rounded-xl border border-white/10 bg-space-900/60 px-4 py-3 hover:border-neon-blue/40 transition-colors">
              <div className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Idle game</div>
              <div className="mt-1 text-sm font-bold text-white">Upgrades + prestige</div>
            </a>
          </div>
          <a href="/spacebar-games/" className="inline-block mt-4 text-xs font-bold text-neon-blue hover:text-white">
            Browse all Spacebar modes →
          </a>
        </div>

        <div className="rounded-2xl border border-white/10 bg-space-900/80 p-6 md:p-10">
          <div className="text-center mb-8">
            <div className="text-7xl md:text-9xl font-mono font-black text-white tabular-nums">{count}</div>
            <div className="text-xs tracking-[0.25em] text-gray-500 mt-2">SPACEBAR PRESSES</div>
          </div>

          <button
            type="button"
            onPointerDown={(event) => { event.preventDefault(); press(); }}
            onKeyDown={(event) => {
              if ((event.key === 'Enter' || event.key === ' ') && !event.repeat) {
                event.preventDefault();
                press();
              }
            }}
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
            <Metric label="Highest Total" value={String(bestCount)} />
          </div>

          <div className="mt-7 rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end justify-center">
              <label className="text-left sm:w-64">
                <span className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1.5">Set current total</span>
                <input
                  type="number"
                  min="0"
                  max={Number.MAX_SAFE_INTEGER}
                  step="1"
                  inputMode="numeric"
                  value={manualCountInput}
                  onChange={(event) => setManualCountInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      applyManualCount();
                    }
                  }}
                  placeholder={String(count)}
                  className="w-full min-h-11 rounded-lg border border-white/10 bg-space-950 px-3 py-2 font-mono text-white focus:outline-none focus:border-neon-blue"
                />
              </label>
              <button type="button" onClick={applyManualCount} className="min-h-11 px-5 py-2 rounded border border-white/10 hover:border-neon-blue">
                Set total
              </button>
              <button type="button" onClick={decrement} disabled={count <= 0} className="min-h-11 px-5 py-2 rounded border border-white/10 hover:border-neon-blue disabled:opacity-40 disabled:cursor-not-allowed">
                −1 correction
              </button>
            </div>
            <p className="mt-2 text-center text-[11px] text-gray-500">
              Setting or correcting the total updates the local counter. Setting a new total restarts the timing metrics.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 mt-4">
            <button type="button" onClick={reset} className="min-h-11 px-5 py-2 rounded border border-white/10 hover:border-neon-blue">Reset current</button>
            <button type="button" onClick={enterFullscreen} className="min-h-11 px-5 py-2 rounded border border-white/10 hover:border-neon-blue">Fullscreen</button>
            <button type="button" onClick={() => setSoundEnabled((value) => !value)} className="min-h-11 px-5 py-2 rounded border border-white/10 hover:border-neon-blue">{soundEnabled ? 'Sound On' : 'Sound Off'}</button>
            <a href="/spacebar-clicker/" className="min-h-11 px-5 py-2 rounded border border-white/10 hover:border-neon-blue flex items-center">Play Spacebar Clicker</a>
            <a href="/spacebar-clicker-test/" className="min-h-11 px-5 py-2 rounded border border-white/10 hover:border-neon-blue flex items-center">Open Speed Test</a>
          </div>
          {statusMessage && (
            <p role="status" aria-live="polite" className="mt-3 text-center text-xs text-gray-400">{statusMessage}</p>
          )}
        </div>

        <article className="mt-14 space-y-8 text-gray-400 leading-relaxed">
          <section>
            <h2 className="text-2xl font-display text-white mb-3">What is a Spacebar Counter?</h2>
            <p>
              A spacebar counter is a simple keyboard tool for spacebar counting: it records intentional Space key presses while showing a running total and live CPS. This page keeps the interface minimal:
              no upgrades, no idle economy, and no game progression. The current total is saved locally, can be corrected with a minus-one control, and can be set to a chosen starting value when you are continuing an existing tally.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-display text-white mb-3">Counter vs speed test</h2>
            <p>
              The counter runs until you reset it. If you switch to another tab or background the browser, active timing pauses and resumes when the page is visible again, so hidden time does not dilute average CPS. For a timed challenge such as five, ten, thirty, or sixty seconds, use the dedicated Spacebar Clicker Test. For an incremental game with upgrades and prestige, use Spacebar Clicker.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-display text-white mb-3">Related keyboard guides</h2>
            <p>
              Read <a href="/blog/mechanics-of-space-bar-clicking-game-physics/" className="text-neon-blue hover:text-white">Space Bar Clicking Game Mechanics</a> for CPS and input behavior, or the <a href="/blog/ultimate-hardware-guide-space-bar-click-game/" className="text-neon-blue hover:text-white">keyboard factors guide</a> for switches, stabilizers, and ergonomics.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display text-white mb-3">Spacebar Counter FAQ</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg text-white">Does the space bar counter have a time limit?</h3>
                <p>No. It keeps counting deliberate Space presses until you reset the current session.</p>
              </div>
              <div>
                <h3 className="text-lg text-white">Can I use this as a spacebar CPS counter?</h3>
                <p>Yes. The page shows current CPS, average CPS and peak CPS while also keeping the total press count.</p>
              </div>
              <div>
                <h3 className="text-lg text-white">Does holding the Space key increase the count?</h3>
                <p>No. Browser-generated repeat events from holding the key are ignored, so the counter tracks intentional presses.</p>
              </div>
              <div>
                <h3 className="text-lg text-white">Are my current and highest totals saved?</h3>
                <p>Yes. Both are stored locally in this browser. You can also set or correct the current total without creating an account, and nothing is uploaded to a public leaderboard.</p>
              </div>
            </div>
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
