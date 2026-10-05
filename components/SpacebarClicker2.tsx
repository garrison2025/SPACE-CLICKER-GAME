import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { formatNumber } from '../utils';

type UpgradeId = 'carbonKey' | 'torqueMultiplier' | 'microBot' | 'reactorBank' | 'overdriveCapacitor' | 'fluxAmplifier';

interface SaveData {
  version: number;
  points: number;
  lifetimePoints: number;
  presses: number;
  novaCores: number;
  upgrades: Record<UpgradeId, number>;
  bestCps: number;
  lastSaveTime: number;
}

interface UpgradeDef {
  id: UpgradeId;
  name: string;
  description: string;
  baseCost: number;
  scale: number;
  max?: number;
}

const SAVE_KEY = 'spacebar_clicker_2_save_v1';
const SAVE_VERSION = 1;
const ASCENSION_THRESHOLD = 250_000_000;

const defs: UpgradeDef[] = [
  { id: 'carbonKey', name: 'Carbon Key', description: '+2 base points per press.', baseCost: 25, scale: 1.55 },
  { id: 'torqueMultiplier', name: 'Torque Multiplier', description: 'Doubles manual press output.', baseCost: 900, scale: 4.5, max: 9 },
  { id: 'microBot', name: 'Micro Bot', description: '+3 points per second.', baseCost: 120, scale: 1.62 },
  { id: 'reactorBank', name: 'Reactor Bank', description: 'Doubles automatic production.', baseCost: 2400, scale: 4.8, max: 8 },
  { id: 'overdriveCapacitor', name: 'Overdrive Capacitor', description: 'Charges Overdrive faster and extends its duration.', baseCost: 4500, scale: 2.35, max: 10 },
  { id: 'fluxAmplifier', name: 'Flux Amplifier', description: '+25% to all production.', baseCost: 18000, scale: 2.7, max: 12 },
];

const emptyUpgrades = (): Record<UpgradeId, number> => ({
  carbonKey: 0,
  torqueMultiplier: 0,
  microBot: 0,
  reactorBank: 0,
  overdriveCapacitor: 0,
  fluxAmplifier: 0,
});

const defaultSave = (): SaveData => ({
  version: SAVE_VERSION,
  points: 0,
  lifetimePoints: 0,
  presses: 0,
  novaCores: 0,
  upgrades: emptyUpgrades(),
  bestCps: 0,
  lastSaveTime: Date.now(),
});

const MAX_RESOURCE_VALUE = 1e300;
const MAX_COUNTER_VALUE = Number.MAX_SAFE_INTEGER;
const MAX_NOVA_CORES = 1e12;
const MAX_CPS_VALUE = 10_000;

const num = (value: unknown, fallback = 0, max = MAX_RESOURCE_VALUE) =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? Math.min(value, max)
    : fallback;

const sanitize = (raw: unknown): SaveData => {
  if (!raw || typeof raw !== 'object') return defaultSave();
  const data = raw as Partial<SaveData>;
  const incoming = data.upgrades && typeof data.upgrades === 'object' ? data.upgrades : {};
  const upgrades = emptyUpgrades();
  (Object.keys(upgrades) as UpgradeId[]).forEach((id) => {
    const def = defs.find((item) => item.id === id);
    const maxLevel = def?.max ?? 1000;
    upgrades[id] = Math.min(
      maxLevel,
      Math.max(0, Math.floor(num((incoming as Record<string, unknown>)[id])))
    );
  });
  return {
    version: SAVE_VERSION,
    points: num(data.points),
    lifetimePoints: num(data.lifetimePoints),
    presses: Math.floor(num(data.presses, 0, MAX_COUNTER_VALUE)),
    novaCores: Math.floor(num(data.novaCores, 0, MAX_NOVA_CORES)),
    upgrades,
    bestCps: num(data.bestCps, 0, MAX_CPS_VALUE),
    lastSaveTime: num(data.lastSaveTime, Date.now()),
  };
};

const loadSave = (): SaveData => {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? sanitize(JSON.parse(raw)) : defaultSave();
  } catch {
    return defaultSave();
  }
};

const Metric = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg border border-white/5 bg-black/25 p-3 text-center">
    <div className="text-[10px] uppercase tracking-widest text-gray-500">{label}</div>
    <div className="mt-1 text-xl font-mono text-white tabular-nums">{value}</div>
  </div>
);

const SpacebarClicker2: React.FC = () => {
  const initial = useMemo(loadSave, []);
  const [points, setPoints] = useState(initial.points);
  const [lifetimePoints, setLifetimePoints] = useState(initial.lifetimePoints);
  const [presses, setPresses] = useState(initial.presses);
  const [novaCores, setNovaCores] = useState(initial.novaCores);
  const [upgrades, setUpgrades] = useState<Record<UpgradeId, number>>(initial.upgrades);
  const [bestCps, setBestCps] = useState(initial.bestCps);
  const [currentCps, setCurrentCps] = useState(0);
  const [energy, setEnergy] = useState(0);
  const [overdriveUntil, setOverdriveUntil] = useState(0);
  const [clock, setClock] = useState(Date.now());
  const [offlineEarned, setOfflineEarned] = useState(0);
  const [saveTransferStatus, setSaveTransferStatus] = useState('');
  const [showSaveImport, setShowSaveImport] = useState(false);
  const [saveImportText, setSaveImportText] = useState('');
  const pressTimes = useRef<number[]>([]);

  const isOverdrive = overdriveUntil > clock;
  const overdriveRemaining = Math.max(0, (overdriveUntil - clock) / 1000);
  const overdriveMultiplier = isOverdrive ? 3 : 1;
  const permanentMultiplier = 1 + novaCores * 0.15;
  const fluxMultiplier = 1 + upgrades.fluxAmplifier * 0.25;

  const manualPower = useMemo(
    () =>
      (1 + upgrades.carbonKey * 2) *
      Math.pow(2, upgrades.torqueMultiplier) *
      permanentMultiplier *
      fluxMultiplier *
      overdriveMultiplier,
    [upgrades.carbonKey, upgrades.torqueMultiplier, permanentMultiplier, fluxMultiplier, overdriveMultiplier]
  );

  const autoRate = useMemo(
    () =>
      upgrades.microBot *
      3 *
      Math.pow(2, upgrades.reactorBank) *
      permanentMultiplier *
      fluxMultiplier *
      overdriveMultiplier,
    [upgrades.microBot, upgrades.reactorBank, permanentMultiplier, fluxMultiplier, overdriveMultiplier]
  );

  const ascensionGain = Math.floor(Math.sqrt(points / ASCENSION_THRESHOLD));
  const ascensionProgress = Math.min(100, (points / ASCENSION_THRESHOLD) * 100);
  const pointsToAscension = Math.max(0, ASCENSION_THRESHOLD - points);

  const saveRef = useRef({
    points,
    lifetimePoints,
    presses,
    novaCores,
    upgrades,
    bestCps,
  });

  useEffect(() => {
    saveRef.current = { points, lifetimePoints, presses, novaCores, upgrades, bestCps };
  }, [points, lifetimePoints, presses, novaCores, upgrades, bestCps]);

  const saveNow = useCallback(() => {
    const payload: SaveData = {
      version: SAVE_VERSION,
      ...saveRef.current,
      lastSaveTime: Date.now(),
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
  }, []);

  useEffect(() => {
    const initialGlobal = (1 + initial.novaCores * 0.15) * (1 + initial.upgrades.fluxAmplifier * 0.25);
    const initialRate = initial.upgrades.microBot * 3 * Math.pow(2, initial.upgrades.reactorBank) * initialGlobal;
    const awaySeconds = Math.min(43_200, Math.max(0, (Date.now() - initial.lastSaveTime) / 1000));

    if (awaySeconds >= 60 && initialRate > 0) {
      const earned = Math.floor(initialRate * awaySeconds);
      const nextSnapshot = {
        ...saveRef.current,
        points: initial.points + earned,
        lifetimePoints: initial.lifetimePoints + earned,
      };

      // Credit and persist offline production immediately. Refreshing before the
      // next autosave must not award the same away period a second time.
      saveRef.current = nextSnapshot;
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        version: SAVE_VERSION,
        ...nextSnapshot,
        lastSaveTime: Date.now(),
      }));

      setPoints(nextSnapshot.points);
      setLifetimePoints(nextSnapshot.lifetimePoints);
      setOfflineEarned(earned);
    }
  }, [initial]);

  useEffect(() => {
    const now = Date.now();
    setClock(now);
    if (overdriveUntil <= now) return;

    const timer = window.setInterval(() => {
      const tick = Date.now();
      setClock(tick);
      if (tick >= overdriveUntil) window.clearInterval(timer);
    }, 200);

    return () => window.clearInterval(timer);
  }, [overdriveUntil]);

  useEffect(() => {
    if (autoRate <= 0) return;
    const timer = window.setInterval(() => {
      const gain = autoRate / 5;
      setPoints((value) => value + gain);
      setLifetimePoints((value) => value + gain);
    }, 200);
    return () => window.clearInterval(timer);
  }, [autoRate]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const now = performance.now();
      pressTimes.current = pressTimes.current.filter((time) => now - time <= 1000);
      const cps = pressTimes.current.length;
      setCurrentCps(cps);
      setBestCps((value) => Math.max(value, cps));
    }, 200);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(saveNow, 10000);
    const beforeUnload = () => saveNow();
    window.addEventListener('beforeunload', beforeUnload);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('beforeunload', beforeUnload);
      saveNow();
    };
  }, [saveNow]);

  const press = useCallback(() => {
    const now = performance.now();
    pressTimes.current = [...pressTimes.current.filter((time) => now - time <= 1000), now];

    setPoints((value) => value + manualPower);
    setLifetimePoints((value) => value + manualPower);
    setPresses((value) => value + 1);

    if (!isOverdrive) {
      const charge = 7 + upgrades.overdriveCapacitor * 1.5;
      setEnergy((value) => {
        const next = value + charge;
        if (next >= 100) {
          const duration = 10_000 + upgrades.overdriveCapacitor * 1_000;
          setOverdriveUntil(Date.now() + duration);
          return 0;
        }
        return next;
      });
    }
  }, [manualPower, isOverdrive, upgrades.overdriveCapacitor]);

  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
      if (event.code === 'Space' && !event.repeat) {
        event.preventDefault();
        press();
      }
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [press]);

  const cost = (def: UpgradeDef) => Math.floor(def.baseCost * Math.pow(def.scale, upgrades[def.id]));

  const buy = (def: UpgradeDef) => {
    const level = upgrades[def.id];
    if (def.max !== undefined && level >= def.max) return;
    const price = cost(def);
    if (points < price) return;
    setPoints((value) => value - price);
    setUpgrades((value) => ({ ...value, [def.id]: value[def.id] + 1 }));
  };

  const ascend = () => {
    if (ascensionGain < 1) return;
    if (!window.confirm(`Ascend this run for +${ascensionGain} Nova Core${ascensionGain > 1 ? 's' : ''}? Points and standard upgrades reset.`)) return;

    const nextNovaCores = novaCores + ascensionGain;
    const nextUpgrades = emptyUpgrades();
    const nextSnapshot = {
      ...saveRef.current,
      points: 0,
      novaCores: nextNovaCores,
      upgrades: nextUpgrades,
    };

    // Persist permanent Nova Cores before updating the UI so an immediate close
    // cannot restore the pre-ascension run and duplicate the same reward.
    saveRef.current = nextSnapshot;
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      version: SAVE_VERSION,
      ...nextSnapshot,
      lastSaveTime: Date.now(),
    }));

    setNovaCores(nextNovaCores);
    setPoints(0);
    setUpgrades(nextUpgrades);
    setEnergy(0);
    setOverdriveUntil(0);
  };

  const buildExportCode = () => {
    const payload: SaveData = {
      version: SAVE_VERSION,
      ...saveRef.current,
      lastSaveTime: Date.now(),
    };
    return 'SCG2.' + window.btoa(JSON.stringify(payload));
  };

  const applyImportedSaveCode = (rawCode: string) => {
    const code = rawCode.trim();
    if (!code) {
      setSaveTransferStatus('No save data was provided.');
      return false;
    }
    if (code.length > 50_000) {
      setSaveTransferStatus('Save code is too large.');
      return false;
    }

    try {
      const json = code.startsWith('SCG2.')
        ? window.atob(code.slice(5))
        : code;
      const parsed = JSON.parse(json);
      const imported = sanitize(parsed);

      if (!window.confirm('Replace the current Spacebar Clicker 2 save with this imported backup?')) {
        setSaveTransferStatus('Restore cancelled.');
        return false;
      }

      const next: SaveData = {
        ...imported,
        version: SAVE_VERSION,
        lastSaveTime: Date.now(),
      };

      saveRef.current = {
        points: next.points,
        lifetimePoints: next.lifetimePoints,
        presses: next.presses,
        novaCores: next.novaCores,
        upgrades: next.upgrades,
        bestCps: next.bestCps,
      };

      localStorage.setItem(SAVE_KEY, JSON.stringify(next));
      setPoints(next.points);
      setLifetimePoints(next.lifetimePoints);
      setPresses(next.presses);
      setNovaCores(next.novaCores);
      setUpgrades(next.upgrades);
      setBestCps(next.bestCps);
      setCurrentCps(0);
      setEnergy(0);
      setOverdriveUntil(0);
      setOfflineEarned(0);
      pressTimes.current = [];
      setSaveTransferStatus('Save imported successfully.');
      return true;
    } catch {
      setSaveTransferStatus('That Spacebar Clicker 2 backup could not be read.');
      return false;
    }
  };

  const copySaveCode = async () => {
    const code = buildExportCode();

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
        setSaveTransferStatus('Save code copied to clipboard.');
      } else {
        setSaveImportText(code);
        setShowSaveImport(true);
        setSaveTransferStatus('Clipboard access is unavailable. The save code is shown below for manual copying.');
      }
    } catch {
      setSaveImportText(code);
      setShowSaveImport(true);
      setSaveTransferStatus('Clipboard access was blocked. The save code is shown below for manual copying.');
    }
  };

  const downloadSave = () => {
    try {
      const code = buildExportCode();
      const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
      const href = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = href;
      link.download = `spacebar-clicker-2-save-${new Date().toISOString().slice(0, 10)}.scg`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(href), 1000);
      setSaveTransferStatus('Backup file downloaded.');
    } catch {
      setSaveTransferStatus('Could not create the backup file.');
    }
  };

  const restorePastedSave = () => {
    if (!saveImportText.trim()) {
      setSaveTransferStatus('Paste a save code or choose a backup file first.');
      return;
    }

    if (applyImportedSaveCode(saveImportText)) {
      setSaveImportText('');
      setShowSaveImport(false);
    }
  };

  const importSaveFile = () => {
    const picker = document.createElement('input');
    picker.type = 'file';
    picker.accept = '.scg,.txt,text/plain,application/json';
    picker.onchange = async () => {
      const selected = picker.files?.[0];
      if (!selected) return;
      if (selected.size > 100_000) {
        setSaveTransferStatus('Backup file is too large.');
        return;
      }

      try {
        const code = await selected.text();
        if (applyImportedSaveCode(code)) {
          setSaveImportText('');
          setShowSaveImport(false);
        }
      } catch {
        setSaveTransferStatus('Could not read that backup file.');
      }
    };
    picker.click();
  };

  const resetAll = () => {
    if (!window.confirm('Erase all Spacebar Clicker 2 progress from this browser?')) return;
    localStorage.removeItem(SAVE_KEY);
    saveRef.current = {
      points: 0,
      lifetimePoints: 0,
      presses: 0,
      novaCores: 0,
      upgrades: emptyUpgrades(),
      bestCps: 0,
    };
    setPoints(0);
    setLifetimePoints(0);
    setPresses(0);
    setNovaCores(0);
    setUpgrades(emptyUpgrades());
    setBestCps(0);
    setCurrentCps(0);
    setEnergy(0);
    setOverdriveUntil(0);
    setOfflineEarned(0);
    setSaveImportText('');
    setShowSaveImport(false);
    setSaveTransferStatus('Local Spacebar Clicker 2 progress was reset.');
  };

  const achievements = [
    ['Second Launch', presses >= 1, 'Make the first press.'],
    ['Rapid Orbit', bestCps >= 8, 'Reach 8 CPS.'],
    ['Machine Age', autoRate >= 30, 'Reach 30 automatic points per second.'],
    ['Overdrive', overdriveUntil > 0, 'Trigger Overdrive at least once this session.'],
    ['Nova Ascension', novaCores >= 1, 'Earn your first Nova Core.'],
  ] as const;

  return (
    <div className="min-h-screen bg-space-950 text-gray-200">
      <section className="max-w-7xl mx-auto px-4 pt-12 pb-8 text-center">
        <div className="text-xs font-mono tracking-[0.3em] text-neon-purple mb-3">OVERDRIVE EDITION</div>
        <h1 className="text-4xl md:text-6xl font-display font-black text-white mb-5">Spacebar Clicker 2</h1>
        <p className="max-w-3xl mx-auto text-gray-400 leading-relaxed">
          A separate upgraded edition with an Overdrive meter, stronger automation, Nova Core ascension and its own local save.
          Press Space, charge the reactor and turn short bursts into a permanent idle economy.
        </p>
        <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-2 text-left max-w-5xl mx-auto">
          <a href="/spacebar-clicker-2/" aria-current="page" className="rounded-xl border border-neon-purple/40 bg-neon-purple/5 px-4 py-3">
            <div className="text-[10px] font-mono text-neon-purple uppercase tracking-wider">Clicker 2</div>
            <div className="mt-1 text-sm font-bold text-white">Overdrive + ascension</div>
          </a>
          <a href="/spacebar-clicker/" className="rounded-xl border border-white/10 bg-space-900/60 px-4 py-3 hover:border-neon-blue/40 transition-colors">
            <div className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Classic</div>
            <div className="mt-1 text-sm font-bold text-white">Upgrades + Hyperdrive</div>
          </a>
          <a href="/spacebar-clicker-test/" className="rounded-xl border border-white/10 bg-space-900/60 px-4 py-3 hover:border-neon-blue/40 transition-colors">
            <div className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Speed test</div>
            <div className="mt-1 text-sm font-bold text-white">Timed CPS modes</div>
          </a>
          <a href="/spacebar-counter/" className="rounded-xl border border-white/10 bg-space-900/60 px-4 py-3 hover:border-neon-blue/40 transition-colors">
            <div className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Counter</div>
            <div className="mt-1 text-sm font-bold text-white">Untimed press total</div>
          </a>
        </div>
        <a href="/spacebar-games/" className="inline-block mt-4 text-xs font-bold text-neon-blue hover:text-white">
          Browse all Spacebar modes →
        </a>
      </section>

      <section className="max-w-7xl mx-auto px-4 pb-12 grid lg:grid-cols-[1fr_380px] gap-6">
        <div className="rounded-2xl border border-white/10 bg-space-900/80 p-5 md:p-8">
          {offlineEarned > 0 && (
            <div className="mb-5 rounded-lg border border-neon-green/30 bg-neon-green/5 p-3 text-sm text-neon-green">
              Offline production recovered: +{formatNumber(offlineEarned)} points
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-7">
            <Metric label="Points" value={formatNumber(points)} />
            <Metric label="CPS" value={currentCps.toFixed(1)} />
            <Metric label="Auto / sec" value={formatNumber(autoRate)} />
            <Metric label="Nova Cores" value={formatNumber(novaCores)} />
          </div>

          <div className="rounded-xl border border-neon-purple/30 bg-neon-purple/5 p-4 mb-7">
            <div className="flex justify-between gap-4 text-xs font-mono">
              <span className="text-neon-purple">{isOverdrive ? 'OVERDRIVE ACTIVE' : 'OVERDRIVE CHARGE'}</span>
              <span className="text-white">{isOverdrive ? overdriveRemaining.toFixed(1) + 's' : Math.floor(energy) + '%'}</span>
            </div>
            <div className="mt-3 h-3 rounded-full bg-black/40 overflow-hidden">
              <div
                className="h-full bg-neon-purple transition-all duration-100"
                style={{ width: `${isOverdrive ? 100 : Math.min(100, energy)}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-gray-500">
              {isOverdrive ? 'Manual and automatic production are tripled.' : 'Rapid Space presses fill the meter. Capacitors charge it faster and extend the surge.'}
            </p>
          </div>

          <div className="text-center">
            <div className="text-5xl md:text-7xl font-mono font-black text-white mb-5">{formatNumber(points)}</div>
            <button
              type="button"
              onPointerDown={(event) => {
                event.preventDefault();
                press();
              }}
              className="w-full min-h-[145px] rounded-2xl border-2 border-neon-purple bg-gradient-to-b from-space-700 to-black text-white shadow-[0_12px_0_#3b145d,0_0_35px_rgba(180,80,255,0.16)] active:translate-y-2 active:shadow-[0_4px_0_#3b145d] transition-all select-none touch-manipulation"
            >
              <span className="block text-4xl md:text-5xl font-display font-black tracking-[0.35em]">SPACE</span>
              <span className="block mt-2 text-xs text-neon-purple font-mono">CHARGE OVERDRIVE</span>
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
            <Metric label="Per Press" value={formatNumber(manualPower)} />
            <Metric label="Best CPS" value={bestCps.toFixed(1)} />
            <Metric label="Lifetime Presses" value={formatNumber(presses)} />
            <Metric label="Lifetime Points" value={formatNumber(lifetimePoints)} />
          </div>

          <div className="mt-7 rounded-xl border border-neon-blue/30 bg-neon-blue/5 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-display text-white">Nova Ascension</h2>
              <p className="text-sm text-gray-400 mt-1">
                Reach {formatNumber(ASCENSION_THRESHOLD)} points. Every Nova Core permanently adds +15% to manual and automatic production.
              </p>
              <div className="mt-4">
                <div className="flex justify-between text-[11px] font-mono text-gray-500 mb-1">
                  <span>{ascensionProgress.toFixed(1)}%</span>
                  <span>{pointsToAscension > 0 ? formatNumber(pointsToAscension) + ' points remaining' : 'Ascension ready'}</span>
                </div>
                <div className="h-2 rounded-full bg-black/40 overflow-hidden">
                  <div
                    className="h-full bg-neon-blue transition-all duration-300"
                    style={{ width: `${ascensionProgress}%` }}
                  />
                </div>
              </div>
            </div>
            <button
              type="button"
              disabled={ascensionGain < 1}
              onClick={ascend}
              className="px-5 py-3 rounded bg-neon-blue text-black font-bold disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed"
            >
              {ascensionGain > 0 ? `ASCEND +${ascensionGain}` : 'ASCENSION LOCKED'}
            </button>
          </div>
        </div>

        <aside className="rounded-2xl border border-white/10 bg-space-900/80 overflow-hidden">
          <div className="p-5 border-b border-white/10">
            <h2 className="text-2xl font-display text-white">UPGRADE LAB</h2>
            <p className="text-xs text-gray-500 mt-1">This edition has a separate progression tree.</p>
          </div>
          <div className="p-4 space-y-3 max-h-[760px] overflow-y-auto">
            {defs.map((def) => {
              const level = upgrades[def.id];
              const maxed = def.max !== undefined && level >= def.max;
              const price = cost(def);
              return (
                <button
                  key={def.id}
                  type="button"
                  disabled={maxed || points < price}
                  onClick={() => buy(def)}
                  className="w-full text-left rounded-xl border border-white/10 bg-black/20 p-4 hover:border-neon-purple/50 disabled:opacity-45 disabled:cursor-not-allowed"
                >
                  <div className="flex justify-between gap-3">
                    <strong className="text-white">{def.name}</strong>
                    <span className="text-xs text-neon-purple font-mono">LV {level}{def.max ? '/' + def.max : ''}</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">{def.description}</p>
                  <div className="mt-3 text-xs font-mono text-gray-300">{maxed ? 'MAXED' : formatNumber(price) + ' points'}</div>
                </button>
              );
            })}
          </div>
        </aside>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-20">
        <div className="grid md:grid-cols-5 gap-3 mb-10">
          {achievements.map(([name, unlocked, detail]) => (
            <div key={name} className={'rounded-xl border p-4 ' + (unlocked ? 'border-neon-green/30 bg-neon-green/5' : 'border-white/10 bg-black/20 opacity-55')}>
              <div className="text-white font-bold">{unlocked ? '✓ ' : '○ '}{name}</div>
              <p className="text-xs text-gray-500 mt-1">{detail}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <a href="/spacebar-clicker/" className="px-4 py-2 rounded border border-white/10 hover:border-neon-purple">Classic Spacebar Clicker</a>
          <a href="/spacebar-games/" className="px-4 py-2 rounded border border-white/10 hover:border-neon-purple">All Spacebar Games</a>
          <a href="/spacebar-clicker-test/" className="px-4 py-2 rounded border border-white/10 hover:border-neon-purple">CPS Test</a>
          <button type="button" onClick={copySaveCode} className="px-4 py-2 rounded border border-white/10 hover:border-neon-purple">Copy save code</button>
          <button type="button" onClick={downloadSave} className="px-4 py-2 rounded border border-white/10 hover:border-neon-purple">Download backup</button>
          <button
            type="button"
            aria-expanded={showSaveImport}
            onClick={() => {
              setShowSaveImport((open) => !open);
              setSaveTransferStatus('');
            }}
            className="px-4 py-2 rounded border border-white/10 hover:border-neon-purple"
          >
            {showSaveImport ? 'Close restore' : 'Restore save'}
          </button>
          <button type="button" onClick={resetAll} className="px-4 py-2 rounded border border-red-500/20 text-red-300 hover:border-red-500/60">Reset Edition 2</button>
        </div>

        {showSaveImport && (
          <div className="mb-6 rounded-xl border border-neon-purple/30 bg-space-900/70 p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <h3 className="font-display font-bold text-white">Restore Spacebar Clicker 2 save</h3>
                <p className="mt-1 text-xs text-gray-500">
                  Paste an SCG2 save code below, or choose a .scg backup file. Imported values are validated before replacing this browser's current Edition 2 save.
                </p>
              </div>
              <button
                type="button"
                onClick={importSaveFile}
                className="min-h-11 shrink-0 px-4 py-2 rounded border border-white/15 text-sm text-white hover:border-neon-purple"
              >
                Choose backup file
              </button>
            </div>
            <label htmlFor="spacebar-2-save-import" className="sr-only">Spacebar Clicker 2 save code</label>
            <textarea
              id="spacebar-2-save-import"
              value={saveImportText}
              onChange={(event) => setSaveImportText(event.target.value)}
              placeholder="Paste SCG2 save code here..."
              spellCheck={false}
              className="mt-4 h-28 w-full resize-y rounded-lg border border-white/10 bg-black/30 p-3 font-mono text-xs text-gray-200 outline-none focus:border-neon-purple"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={restorePastedSave}
                className="min-h-11 px-4 py-2 rounded bg-neon-purple text-black text-sm font-bold hover:bg-white"
              >
                Restore pasted code
              </button>
              <button
                type="button"
                onClick={() => {
                  setSaveImportText('');
                  setShowSaveImport(false);
                  setSaveTransferStatus('Restore cancelled.');
                }}
                className="min-h-11 px-4 py-2 rounded border border-white/10 text-sm text-gray-300 hover:border-white/30"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {saveTransferStatus && (
          <p role="status" aria-live="polite" className="mb-10 text-sm text-gray-400">
            {saveTransferStatus}
          </p>
        )}

        <article className="rounded-2xl border border-white/10 bg-black/20 p-6 md:p-9 space-y-8 text-gray-400 leading-relaxed">
          <section>
            <h2 className="text-2xl font-display text-white mb-3">What is Spacebar Clicker 2?</h2>
            <p>
              Spacebar Clicker 2 is SpaceClickerGame.com's own enhanced second edition of the one-key incremental format. It is not an embedded copy
              of another website's game. This version uses a separate save, an Overdrive meter, a different upgrade economy and Nova Core ascension.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-display text-white mb-3">How Overdrive changes the clicker loop</h2>
            <p>
              Manual Space presses fill the Overdrive meter. When it reaches 100%, both manual and automatic production are tripled for a limited
              period. Overdrive Capacitor upgrades charge the meter faster and extend the surge, so active clicking remains useful even after automation grows.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-display text-white mb-3">Related strategy guide</h2>
            <p>
              Read <a href="/blog/active-vs-passive-space-click-game-styles/" className="text-neon-blue hover:text-white">Active Clicking vs. Passive Mining</a> for a deeper explanation of when manual input gives way to automatic production.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display text-white mb-3">Spacebar Clicker 2 FAQ</h2>
            <div className="space-y-4">
              <div><h3 className="text-lg text-white">Is this the same as the classic Spacebar Clicker?</h3><p>No. It is a separate enhanced mode with its own mechanics and local save.</p></div>
              <div><h3 className="text-lg text-white">Does Spacebar Clicker 2 have auto-clickers?</h3><p>Yes. Micro Bots generate passive points and Reactor Banks multiply automatic production.</p></div>
              <div><h3 className="text-lg text-white">What does Nova Ascension reset?</h3><p>It resets current points and standard upgrades. Nova Cores, lifetime records and the permanent Nova bonus remain.</p></div>
              <div><h3 className="text-lg text-white">Does it work on mobile?</h3><p>Yes. Mobile players can use the large on-screen Space button, while desktop players can press the physical Space key.</p></div>
              <div><h3 className="text-lg text-white">Can I move my Edition 2 save to another browser?</h3><p>Yes. Copy an SCG2 save code or download a .scg backup file, then restore it in another browser or device. Imported values are validated before replacing the local save.</p></div>
            </div>
          </section>
        </article>
      </section>
    </div>
  );
};

export default SpacebarClicker2;
