import React, { useEffect, useRef, useState } from 'react';

type TestMode = { type: 'time'; seconds: number; label: string } | { type: 'clicks'; clicks: number; label: string };

const PRESETS: TestMode[] = [
  { type: 'time', seconds: 1, label: '1s' },
  { type: 'time', seconds: 5, label: '5s' },
  { type: 'time', seconds: 10, label: '10s' },
  { type: 'time', seconds: 30, label: '30s' },
  { type: 'time', seconds: 60, label: '60s' },
  { type: 'clicks', clicks: 100, label: '100 clicks' },
];

const BEST_PREFIX = 'spacebar_test_best_';
const HISTORY_KEY = 'spacebar_test_history_v1';

type TestHistoryEntry = {
  id: string;
  mode: string;
  clicks: number;
  elapsed: number;
  averageCps: number;
  peakCps: number;
  completedAt: number;
};

const loadHistory = (): TestHistoryEntry[] => {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((entry) =>
        entry &&
        typeof entry.id === 'string' &&
        typeof entry.mode === 'string' &&
        Number.isFinite(entry.clicks) &&
        Number.isFinite(entry.elapsed) &&
        Number.isFinite(entry.averageCps) &&
        Number.isFinite(entry.peakCps) &&
        Number.isFinite(entry.completedAt)
      )
      .slice(0, 10);
  } catch {
    return [];
  }
};

const modeKey = (mode: TestMode) =>
  mode.type === 'time' ? `time_${mode.seconds}` : `clicks_${mode.clicks}`;

const SpacebarClickerTest: React.FC = () => {
  const [mode, setMode] = useState<TestMode>(PRESETS[2]);
  const [customSeconds, setCustomSeconds] = useState(15);
  const [clicks, setClicks] = useState(0);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(mode.type === 'time' ? mode.seconds : 0);
  const [currentCps, setCurrentCps] = useState(0);
  const [peakCps, setPeakCps] = useState(0);
  const [finalElapsed, setFinalElapsed] = useState(0);
  const [bestCps, setBestCps] = useState(() => Number(localStorage.getItem(BEST_PREFIX + modeKey(PRESETS[2])) || 0));
  const [shareStatus, setShareStatus] = useState('');
  const [history, setHistory] = useState<TestHistoryEntry[]>(loadHistory);

  const startedAt = useRef<number | null>(null);
  const deadlineAt = useRef<number | null>(null);
  const pressTimes = useRef<number[]>([]);
  const clicksRef = useRef(0);
  const peakCpsRef = useRef(0);
  const finishedRef = useRef(false);

  const loadBest = (nextMode: TestMode) => {
    setBestCps(Number(localStorage.getItem(BEST_PREFIX + modeKey(nextMode)) || 0));
  };

  const reset = (nextMode: TestMode = mode) => {
    setMode(nextMode);
    loadBest(nextMode);
    setClicks(0);
    clicksRef.current = 0;
    setRunning(false);
    setFinished(false);
    finishedRef.current = false;
    setTimeLeft(nextMode.type === 'time' ? nextMode.seconds : 0);
    setCurrentCps(0);
    setPeakCps(0);
    peakCpsRef.current = 0;
    setFinalElapsed(0);
    setShareStatus('');
    startedAt.current = null;
    deadlineAt.current = null;
    pressTimes.current = [];
  };

  const finish = (elapsedSeconds: number) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const safeElapsed = Math.max(0.001, elapsedSeconds);
    const average = clicksRef.current / safeElapsed;
    const peak = peakCpsRef.current;

    setRunning(false);
    setFinished(true);
    setFinalElapsed(safeElapsed);
    setTimeLeft(0);
    setBestCps((best) => {
      const next = Math.max(best, average);
      localStorage.setItem(BEST_PREFIX + modeKey(mode), String(next));
      return next;
    });

    const entry: TestHistoryEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      mode: mode.type === 'time' ? `${mode.seconds}s` : `${mode.clicks} clicks`,
      clicks: clicksRef.current,
      elapsed: safeElapsed,
      averageCps: average,
      peakCps: peak,
      completedAt: Date.now(),
    };

    setHistory((previous) => {
      const next = [entry, ...previous].slice(0, 10);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      return next;
    });
  };

  const press = () => {
    if (finishedRef.current) return;
    const now = performance.now();

    if (mode.type === 'time' && startedAt.current !== null) {
      const deadline = deadlineAt.current ?? (startedAt.current + mode.seconds * 1000);
      if (now >= deadline) {
        finish(mode.seconds);
        return;
      }
    }

    if (!running) {
      startedAt.current = now;
      deadlineAt.current = mode.type === 'time' ? now + mode.seconds * 1000 : null;
      setRunning(true);
      setFinished(false);
    }

    pressTimes.current = [...pressTimes.current.filter((time) => now - time <= 1000), now];
    const rollingCps = pressTimes.current.length;
    peakCpsRef.current = Math.max(peakCpsRef.current, rollingCps);
    setCurrentCps(rollingCps);
    setPeakCps(peakCpsRef.current);

    clicksRef.current += 1;
    setClicks(clicksRef.current);

    if (mode.type === 'clicks' && clicksRef.current >= mode.clicks) {
      const elapsed = startedAt.current === null ? 0.001 : (now - startedAt.current) / 1000;
      finish(elapsed);
    }
  };

  const pressRef = useRef(press);
  useEffect(() => {
    pressRef.current = press;
  });

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
      if (event.code === 'Space' && !event.repeat) {
        event.preventDefault();
        pressRef.current();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!running || startedAt.current === null) return;
    const timer = window.setInterval(() => {
      const now = performance.now();
      const elapsed = (now - (startedAt.current || now)) / 1000;
      pressTimes.current = pressTimes.current.filter((time) => now - time <= 1000);
      const cps = pressTimes.current.length;
      setCurrentCps(cps);
      peakCpsRef.current = Math.max(peakCpsRef.current, cps);
      setPeakCps(peakCpsRef.current);

      if (mode.type === 'time') {
        const deadline = deadlineAt.current ?? ((startedAt.current || now) + mode.seconds * 1000);
        const remaining = Math.max(0, (deadline - now) / 1000);
        setTimeLeft(remaining);
        if (now >= deadline) finish(mode.seconds);
      }
    }, 100);
    return () => window.clearInterval(timer);
  }, [running, mode]);

  const averageCps = finished && finalElapsed > 0
    ? clicks / finalElapsed
    : running && startedAt.current
      ? clicks / Math.max(0.001, (performance.now() - startedAt.current) / 1000)
      : 0;

  const rating =
    averageCps >= 12 ? '12+ CPS BURST' :
    averageCps >= 9 ? '9+ CPS BURST' :
    averageCps >= 6 ? '6+ CPS BURST' :
    averageCps > 0 ? 'RESULT RECORDED' :
    'READY';

  const targetLabel = mode.type === 'time' ? `${mode.seconds}s` : `${mode.clicks} clicks`;

  const historyModeLabel = mode.type === 'time' ? `${mode.seconds}s` : `${mode.clicks} clicks`;
  const recentSameMode = history.filter((entry) => entry.mode === historyModeLabel).slice(0, 5);
  const recentAverageCps = recentSameMode.length > 0
    ? recentSameMode.reduce((sum, entry) => sum + entry.averageCps, 0) / recentSameMode.length
    : 0;
  const recentBestCps = recentSameMode.length > 0
    ? Math.max(...recentSameMode.map((entry) => entry.averageCps))
    : 0;

  const clearHistory = () => {
    localStorage.removeItem(HISTORY_KEY);
    setHistory([]);
  };

  const downloadResultCard = () => {
    if (!finished) return;

    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 630;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setShareStatus('Could not create the result image.');
      return;
    }

    const gradient = ctx.createLinearGradient(0, 0, 1200, 630);
    gradient.addColorStop(0, '#0b0d17');
    gradient.addColorStop(0.55, '#12182f');
    gradient.addColorStop(1, '#07161d');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1200, 630);

    ctx.strokeStyle = 'rgba(0,243,255,0.45)';
    ctx.lineWidth = 3;
    ctx.strokeRect(36, 36, 1128, 558);

    ctx.fillStyle = '#00f3ff';
    ctx.font = '700 28px system-ui, sans-serif';
    ctx.fillText('SPACEBAR CLICKER TEST', 78, 105);

    ctx.fillStyle = '#ffffff';
    ctx.font = '800 96px system-ui, sans-serif';
    ctx.fillText(`${averageCps.toFixed(2)} CPS`, 78, 235);

    ctx.fillStyle = '#9ca3af';
    ctx.font = '600 30px system-ui, sans-serif';
    ctx.fillText(`${targetLabel} • ${clicks} presses • ${finalElapsed.toFixed(2)}s elapsed`, 82, 300);

    const stats = [
      ['PEAK CPS', peakCps.toFixed(1)],
      ['MODE', targetLabel],
      ['PERSONAL BEST', bestCps.toFixed(2)]
    ];

    stats.forEach(([label, value], index) => {
      const x = 82 + index * 350;
      ctx.fillStyle = '#6b7280';
      ctx.font = '700 20px system-ui, sans-serif';
      ctx.fillText(label, x, 390);
      ctx.fillStyle = '#ffffff';
      ctx.font = '800 38px system-ui, sans-serif';
      ctx.fillText(value, x, 438);
    });

    ctx.fillStyle = '#00f3ff';
    ctx.font = '700 26px system-ui, sans-serif';
    ctx.fillText('SpaceClickerGame.com/spacebar-clicker-test/', 82, 535);

    canvas.toBlob((blob) => {
      if (!blob) {
        setShareStatus('Could not create the result image.');
        return;
      }

      const href = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = href;
      link.download = `spacebar-clicker-test-${targetLabel.replace(/\s+/g, '-')}-${averageCps.toFixed(2)}-cps.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(href), 1000);
      setShareStatus('Result card saved as PNG.');
    }, 'image/png');
  };

  const shareResult = async () => {
    if (!finished) return;
    const text = `I scored ${averageCps.toFixed(2)} CPS in the ${targetLabel} Spacebar Clicker Test on SpaceClickerGame.com.`;
    const url = 'https://spaceclickergame.com/spacebar-clicker-test/';

    try {
      if (navigator.share) {
        await navigator.share({ title: 'Spacebar Clicker Test Result', text, url });
        setShareStatus('Result shared.');
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(`${text} ${url}`);
        setShareStatus('Result copied to clipboard.');
      } else {
        setShareStatus('Sharing is not supported in this browser.');
      }
    } catch (error) {
      if ((error as DOMException)?.name !== 'AbortError') {
        setShareStatus('Could not share this result.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-space-950 text-gray-200">
      <section className="max-w-5xl mx-auto px-4 py-14">
        <div className="text-center mb-9">
          <div className="text-xs text-neon-blue font-mono tracking-[0.3em] mb-3">CPS SPEED TEST</div>
          <h1 className="text-4xl md:text-6xl font-display font-black text-white mb-4">Spacebar Clicker Test</h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Measure your space bar click speed with timed challenges or a 100-click sprint. See total presses, average CPS, peak CPS and your best local result.
          </p>
          <div className="mt-6 grid sm:grid-cols-3 gap-2 text-left max-w-3xl mx-auto">
            <a href="/spacebar-clicker-test/" aria-current="page" className="rounded-xl border border-neon-blue/40 bg-neon-blue/5 px-4 py-3">
              <div className="text-[10px] font-mono text-neon-blue uppercase tracking-wider">Speed test</div>
              <div className="mt-1 text-sm font-bold text-white">Timed CPS modes</div>
            </a>
            <a href="/spacebar-counter/" className="rounded-xl border border-white/10 bg-space-900/60 px-4 py-3 hover:border-neon-blue/40 transition-colors">
              <div className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Counter</div>
              <div className="mt-1 text-sm font-bold text-white">Untimed press total</div>
            </a>
            <a href="/spacebar-clicker/" className="rounded-xl border border-white/10 bg-space-900/60 px-4 py-3 hover:border-neon-blue/40 transition-colors">
              <div className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Idle game</div>
              <div className="mt-1 text-sm font-bold text-white">Upgrades + prestige</div>
            </a>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-space-900/80 p-6 md:p-10">
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            {PRESETS.map((preset) => (
              <button
                key={modeKey(preset)}
                type="button"
                disabled={running}
                onClick={() => reset(preset)}
                className={'px-4 py-2 rounded border text-sm ' + (modeKey(mode) === modeKey(preset) ? 'border-neon-blue text-neon-blue bg-neon-blue/5' : 'border-white/10 text-gray-400')}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap justify-center items-center gap-2 mb-7">
            <label className="text-xs text-gray-500" htmlFor="custom-seconds">Custom seconds</label>
            <input
              id="custom-seconds"
              type="number"
              min={1}
              max={300}
              value={customSeconds}
              disabled={running}
              onChange={(event) => setCustomSeconds(Math.min(300, Math.max(1, Number(event.target.value) || 1)))}
              className="w-24 rounded bg-black/30 border border-white/10 px-3 py-2 text-white"
            />
            <button
              type="button"
              disabled={running}
              onClick={() => reset({ type: 'time', seconds: customSeconds, label: `${customSeconds}s custom` })}
              className="px-4 py-2 rounded border border-white/10 text-sm hover:border-neon-blue"
            >
              Use Custom
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-7">
            <Metric label={mode.type === 'time' ? 'Time Left' : 'Target'} value={mode.type === 'time' ? timeLeft.toFixed(2) + 's' : `${clicks}/${mode.clicks}`} />
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
              {finished ? 'TEST COMPLETE' : running ? 'KEEP PRESSING' : `PRESS TO START • ${targetLabel}`}
            </span>
          </button>

          {finished && (
            <div className="mt-8 rounded-xl border border-neon-green/30 bg-neon-green/5 p-6 text-center">
              <div className="text-xs tracking-[0.25em] text-neon-green">RESULT</div>
              <div className="text-4xl font-display font-black text-white mt-2">{averageCps.toFixed(2)} CPS</div>
              <div className="mt-2 text-neon-blue font-mono">{rating}</div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-6">
                <Metric label="Clicks" value={String(clicks)} />
                <Metric label="Elapsed" value={finalElapsed.toFixed(2) + 's'} />
                <Metric label="Average CPS" value={averageCps.toFixed(2)} />
                <Metric label="Peak CPS" value={peakCps.toFixed(1)} />
                <Metric label="Personal Best" value={bestCps.toFixed(2)} />
              </div>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button type="button" onClick={() => reset()} className="px-6 py-2 rounded bg-neon-green text-black font-bold">
                  Try Again
                </button>
                <button type="button" onClick={shareResult} className="px-6 py-2 rounded border border-neon-blue/50 text-neon-blue hover:bg-neon-blue hover:text-black">
                  Share Result
                </button>
                <button type="button" onClick={downloadResultCard} className="px-6 py-2 rounded border border-white/15 text-white hover:border-neon-blue">
                  Save Result Card
                </button>
              </div>
              {shareStatus && <p className="mt-3 text-xs text-gray-400">{shareStatus}</p>}
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-3 mt-7">
            {!finished && <button type="button" onClick={() => reset()} className="px-5 py-2 rounded border border-white/10 hover:border-neon-blue">Reset</button>}
            <button type="button" onClick={() => document.documentElement.requestFullscreen?.()} className="px-5 py-2 rounded border border-white/10 hover:border-neon-blue">Fullscreen</button>
            <a href="/spacebar-counter/" className="px-5 py-2 rounded border border-white/10 hover:border-neon-blue">Open Counter</a>
            <a href="/spacebar-clicker/" className="px-5 py-2 rounded border border-white/10 hover:border-neon-blue">Play Game</a>
          </div>
        </div>

        <section className="mt-10 rounded-2xl border border-white/10 bg-space-900/60 p-5 md:p-7">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
            <div>
              <div className="text-[10px] font-mono tracking-[0.25em] text-neon-blue">LOCAL HISTORY</div>
              <h2 className="mt-1 text-xl font-display font-bold text-white">Recent Spacebar Test Results</h2>
              <p className="mt-1 text-xs text-gray-500">The last 10 completed runs are stored only in this browser.</p>
            </div>
            {history.length > 0 && (
              <button
                type="button"
                onClick={clearHistory}
                className="px-4 py-2 rounded border border-white/10 text-xs text-gray-400 hover:border-red-400/50 hover:text-red-300"
              >
                Clear history
              </button>
            )}
          </div>

          {history.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mb-5">
              <Metric label="Runs Stored" value={String(history.length)} />
              <Metric
                label={`Recent Avg • ${historyModeLabel}`}
                value={recentSameMode.length > 0 ? recentAverageCps.toFixed(2) : '—'}
              />
              <Metric
                label={`Recent Best • ${historyModeLabel}`}
                value={recentSameMode.length > 0 ? recentBestCps.toFixed(2) : '—'}
              />
            </div>
          )}

          {history.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-gray-500">
              Complete a test to start your local result history.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-[10px] uppercase tracking-wider text-gray-500">
                    <th className="py-3 pr-4">Mode</th>
                    <th className="py-3 pr-4">Clicks</th>
                    <th className="py-3 pr-4">Elapsed</th>
                    <th className="py-3 pr-4">Average CPS</th>
                    <th className="py-3 pr-4">Peak CPS</th>
                    <th className="py-3">Completed</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((entry) => (
                    <tr key={entry.id} className="border-b border-white/5 text-gray-300">
                      <td className="py-3 pr-4 font-bold text-white">{entry.mode}</td>
                      <td className="py-3 pr-4 font-mono">{entry.clicks}</td>
                      <td className="py-3 pr-4 font-mono">{entry.elapsed.toFixed(2)}s</td>
                      <td className="py-3 pr-4 font-mono text-neon-blue">{entry.averageCps.toFixed(2)}</td>
                      <td className="py-3 pr-4 font-mono">{entry.peakCps.toFixed(1)}</td>
                      <td className="py-3 text-xs text-gray-500">{new Date(entry.completedAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <article className="mt-14 space-y-8 text-gray-400 leading-relaxed">
          <section>
            <h2 className="text-2xl font-display text-white mb-3">How the Spacebar Clicker Test works</h2>
            <p>
              Choose a duration or the 100-click sprint and start with your first intentional Space press. Use the timed modes as a spacebar CPS test, or use the 100-click sprint as a fixed-workload space bar click test. Browser key-repeat is ignored, so holding the key down does not inflate the result. Average CPS is valid presses divided by elapsed time, while peak CPS measures the strongest rolling one-second burst.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-display text-white mb-3">Which test length should you use?</h2>
            <p>
              One and five seconds measure burst speed. Ten seconds is a useful general benchmark. Thirty and sixty seconds reward consistency. The 100-click mode measures how quickly you can finish a fixed workload, and Custom lets you choose any duration from 1 to 300 seconds.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-display text-white mb-3">How to compare CPS results</h2>
            <p>
              There is no universal “good CPS” threshold across every keyboard and test. For a meaningful comparison, use the same device, browser, duration, and input rule between attempts. Short tests emphasize burst speed; longer tests put more weight on consistency.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display text-white mb-3">Personal bests and recent results</h2>
            <p>
              Each mode keeps a local personal best, and the table above stores the last 10 completed runs in this browser with clicks, elapsed time, average CPS, peak CPS, and completion time. You can clear that history whenever you want; it is not uploaded to a public leaderboard. Completed results can also be saved as a locally generated PNG result card.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display text-white mb-3">Related CPS and hardware guides</h2>
            <p>
              Read <a href="/blog/mechanics-of-space-bar-clicking-game-physics/" className="text-neon-blue hover:text-white">Space Bar Clicking Game Mechanics</a> for input and CPS details, or <a href="/blog/ultimate-hardware-guide-space-bar-click-game/" className="text-neon-blue hover:text-white">Keyboard Factors for Space Bar Click Games</a> for hardware and ergonomics.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display text-white mb-3">Spacebar Clicker Test FAQ</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg text-white">What is a space bar click test?</h3>
                <p>It measures how many intentional Space presses you can make during a selected time window and converts the result into clicks per second.</p>
              </div>
              <div>
                <h3 className="text-lg text-white">What does CPS mean in a spacebar speed test?</h3>
                <p>CPS means clicks per second. Average CPS uses all valid presses over the elapsed test time, while peak CPS tracks the strongest rolling one-second burst.</p>
              </div>
              <div>
                <h3 className="text-lg text-white">Can I run a 100-click spacebar test?</h3>
                <p>Yes. Select the 100-click mode and the result records how long it takes to reach one hundred valid presses.</p>
              </div>
              <div>
                <h3 className="text-lg text-white">Can I choose a custom test duration?</h3>
                <p>Yes. Custom mode accepts durations from 1 to 300 seconds and stores the best result locally for that selected mode.</p>
              </div>
              <div>
                <h3 className="text-lg text-white">What is a good Spacebar CPS score?</h3>
                <p>There is no universal “good CPS” threshold across every keyboard and test. Compare your results using the same device, browser, duration, and input rules.</p>
              </div>
              <div>
                <h3 className="text-lg text-white">What is the difference between CPS and PPS?</h3>
                <p>CPS means clicks per second and PPS means presses per second. For this Spacebar test they describe the same basic rate: valid Space presses divided by elapsed time.</p>
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

export default SpacebarClickerTest;
