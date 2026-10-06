import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { formatNumber } from '../utils';
import { isInteractiveKeyboardTarget } from '../utils/keyboard';

type UpgradeId =
  | 'strongerKey'
  | 'mechanicalSwitch'
  | 'autoPresser'
  | 'turboSwitch'
  | 'comboEngine'
  | 'criticalPress'
  | 'quantumKeyboard'
  | 'spacebarReactor';

interface UpgradeDef {
  id: UpgradeId;
  name: string;
  description: string;
  baseCost: number;
  costMultiplier: number;
  maxLevel?: number;
}

interface SpacebarSave {
  version: number;
  points: number;
  lifetimePoints: number;
  lifetimePresses: number;
  quantumKeys: number;
  upgrades: Record<UpgradeId, number>;
  bestCps: number;
  lastSaveTime: number;
}

interface SpacebarGameProps {
  mode?: 'standard' | 'unblocked';
}

const SAVE_KEY = 'spacebar_clicker_save_v1';
const SAVE_VERSION = 1;
const PRESTIGE_THRESHOLD = 100_000_000;

const UPGRADE_DEFS: UpgradeDef[] = [
  { id: 'strongerKey', name: 'Stronger Key', description: '+1 base point per press.', baseCost: 25, costMultiplier: 1.55 },
  { id: 'mechanicalSwitch', name: 'Mechanical Switch', description: 'Doubles manual press output.', baseCost: 300, costMultiplier: 4, maxLevel: 8 },
  { id: 'autoPresser', name: 'Auto Presser', description: '+2 points per second.', baseCost: 80, costMultiplier: 1.6 },
  { id: 'turboSwitch', name: 'Turbo Switch', description: 'Doubles all automatic production.', baseCost: 1200, costMultiplier: 5, maxLevel: 7 },
  { id: 'comboEngine', name: 'Combo Engine', description: 'Fast consecutive presses scale harder.', baseCost: 500, costMultiplier: 2.2, maxLevel: 10 },
  { id: 'criticalPress', name: 'Critical Press', description: '+2% chance for a 5x press.', baseCost: 900, costMultiplier: 2.5, maxLevel: 15 },
  { id: 'quantumKeyboard', name: 'Quantum Keyboard', description: '+25% global production.', baseCost: 5000, costMultiplier: 2.8, maxLevel: 12 },
  { id: 'spacebarReactor', name: 'Spacebar Reactor', description: '+5 automatic points per second.', baseCost: 10000, costMultiplier: 1.8 },
];

const emptyUpgrades = (): Record<UpgradeId, number> => ({
  strongerKey: 0,
  mechanicalSwitch: 0,
  autoPresser: 0,
  turboSwitch: 0,
  comboEngine: 0,
  criticalPress: 0,
  quantumKeyboard: 0,
  spacebarReactor: 0,
});

const defaultSave = (): SpacebarSave => ({
  version: SAVE_VERSION,
  points: 0,
  lifetimePoints: 0,
  lifetimePresses: 0,
  quantumKeys: 0,
  upgrades: emptyUpgrades(),
  bestCps: 0,
  lastSaveTime: Date.now(),
});

const MAX_IMPORTED_RESOURCE = 1e300;
const MAX_UPGRADE_LEVEL = 1000;
const MAX_IMPORTED_COUNTER = Number.MAX_SAFE_INTEGER;
const MAX_IMPORTED_QUANTUM_KEYS = 1e12;
const MAX_IMPORTED_CPS = 10_000;

const safeNumber = (value: unknown, fallback = 0, max = MAX_IMPORTED_RESOURCE) =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? Math.min(value, max)
    : fallback;

const sanitizeSave = (raw: unknown): SpacebarSave => {
  if (!raw || typeof raw !== 'object') return defaultSave();
  const data = raw as Partial<SpacebarSave>;
  const incoming = data.upgrades && typeof data.upgrades === 'object' ? data.upgrades : {};
  const upgrades = emptyUpgrades();

  (Object.keys(upgrades) as UpgradeId[]).forEach((id) => {
    const def = UPGRADE_DEFS.find((item) => item.id === id);
    const maxLevel = def?.maxLevel ?? MAX_UPGRADE_LEVEL;
    upgrades[id] = Math.min(
      maxLevel,
      Math.max(0, Math.floor(safeNumber((incoming as Record<string, unknown>)[id])))
    );
  });

  return {
    version: SAVE_VERSION,
    points: safeNumber(data.points),
    lifetimePoints: safeNumber(data.lifetimePoints),
    lifetimePresses: Math.floor(safeNumber(data.lifetimePresses, 0, MAX_IMPORTED_COUNTER)),
    quantumKeys: Math.floor(safeNumber(data.quantumKeys, 0, MAX_IMPORTED_QUANTUM_KEYS)),
    upgrades,
    bestCps: safeNumber(data.bestCps, 0, MAX_IMPORTED_CPS),
    lastSaveTime: safeNumber(data.lastSaveTime, Date.now()),
  };
};

const loadSave = (): SpacebarSave => {
  if (typeof window === 'undefined') return defaultSave();
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? sanitizeSave(JSON.parse(raw)) : defaultSave();
  } catch {
    return defaultSave();
  }
};

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg bg-black/25 border border-white/5 p-3">
    <div className="text-[10px] uppercase tracking-widest text-gray-500">{label}</div>
    <div className="text-lg md:text-xl font-mono font-bold text-white tabular-nums">{value}</div>
  </div>
);

const SpacebarGame: React.FC<SpacebarGameProps> = ({ mode = 'standard' }) => {
  const initial = useMemo(loadSave, []);
  const [points, setPoints] = useState(initial.points);
  const [lifetimePoints, setLifetimePoints] = useState(initial.lifetimePoints);
  const [lifetimePresses, setLifetimePresses] = useState(initial.lifetimePresses);
  const [quantumKeys, setQuantumKeys] = useState(initial.quantumKeys);
  const [upgrades, setUpgrades] = useState<Record<UpgradeId, number>>(initial.upgrades);
  const [bestCps, setBestCps] = useState(initial.bestCps);
  const [currentCps, setCurrentCps] = useState(0);
  const [cpsTrackingActive, setCpsTrackingActive] = useState(false);
  const [combo, setCombo] = useState(0);
  const [lastGain, setLastGain] = useState(0);
  const [lastWasCrit, setLastWasCrit] = useState(false);
  const [offlineEarned, setOfflineEarned] = useState(0);
  const [saveTransferStatus, setSaveTransferStatus] = useState('');
  const [showSaveImport, setShowSaveImport] = useState(false);
  const [saveImportText, setSaveImportText] = useState('');
  const [buyMode, setBuyMode] = useState<1 | 10 | 'max'>(1);
  const pressTimes = useRef<number[]>([]);
  const lastPressAt = useRef(0);
  const comboRef = useRef(0);

  const globalMultiplier = useMemo(
    () => (1 + upgrades.quantumKeyboard * 0.25) * (1 + quantumKeys * 0.1),
    [upgrades.quantumKeyboard, quantumKeys]
  );

  const clickPower = useMemo(
    () => (1 + upgrades.strongerKey) * Math.pow(2, upgrades.mechanicalSwitch) * globalMultiplier,
    [upgrades.strongerKey, upgrades.mechanicalSwitch, globalMultiplier]
  );

  const autoRate = useMemo(
    () =>
      (upgrades.autoPresser * 2 + upgrades.spacebarReactor * 5) *
      Math.pow(2, upgrades.turboSwitch) *
      globalMultiplier,
    [upgrades.autoPresser, upgrades.spacebarReactor, upgrades.turboSwitch, globalMultiplier]
  );

  const prestigeGain = Math.max(
    0,
    Math.min(
      Math.floor(Math.sqrt(points / PRESTIGE_THRESHOLD)),
      MAX_IMPORTED_QUANTUM_KEYS - quantumKeys
    )
  );
  const prestigeProgress = Math.min(100, (points / PRESTIGE_THRESHOLD) * 100);
  const pointsToPrestige = Math.max(0, PRESTIGE_THRESHOLD - points);

  const nearestUpgrade = useMemo(() => {
    return UPGRADE_DEFS
      .filter((def) => upgrades[def.id] < (def.maxLevel ?? MAX_UPGRADE_LEVEL))
      .map((def) => ({
        def,
        cost: Math.floor(def.baseCost * Math.pow(def.costMultiplier, upgrades[def.id]))
      }))
      .sort((a, b) => a.cost - b.cost)[0] || null;
  }, [upgrades]);

  const saveStateRef = useRef({
    points,
    lifetimePoints,
    lifetimePresses,
    quantumKeys,
    upgrades,
    bestCps,
  });

  useEffect(() => {
    saveStateRef.current = {
      points,
      lifetimePoints,
      lifetimePresses,
      quantumKeys,
      upgrades,
      bestCps,
    };
  }, [points, lifetimePoints, lifetimePresses, quantumKeys, upgrades, bestCps]);

  const saveNow = useCallback(() => {
    if (typeof window === 'undefined') return;
    const payload: SpacebarSave = {
      version: SAVE_VERSION,
      ...saveStateRef.current,
      lastSaveTime: Date.now(),
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
  }, []);

  useEffect(() => {
    const elapsed = Math.min(86400, Math.max(0, (Date.now() - initial.lastSaveTime) / 1000));
    const initialGlobal = (1 + initial.upgrades.quantumKeyboard * 0.25) * (1 + initial.quantumKeys * 0.1);
    const initialRate =
      (initial.upgrades.autoPresser * 2 + initial.upgrades.spacebarReactor * 5) *
      Math.pow(2, initial.upgrades.turboSwitch) *
      initialGlobal;

    if (elapsed >= 60 && initialRate > 0) {
      const earned = Math.floor(initialRate * elapsed);
      const nextPoints = Math.min(MAX_IMPORTED_RESOURCE, initial.points + earned);
      const nextLifetimePoints = Math.min(MAX_IMPORTED_RESOURCE, initial.lifetimePoints + earned);
      const credited = Math.max(0, nextPoints - initial.points);
      const nextSnapshot = {
        ...saveStateRef.current,
        points: nextPoints,
        lifetimePoints: nextLifetimePoints,
      };

      // Persist credited offline production immediately so a fast refresh cannot
      // award the same away period more than once.
      saveStateRef.current = nextSnapshot;
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        version: SAVE_VERSION,
        ...nextSnapshot,
        lastSaveTime: Date.now(),
      }));

      setPoints(nextSnapshot.points);
      setLifetimePoints(nextSnapshot.lifetimePoints);
      setOfflineEarned(credited);
    }
  }, [initial]);

  useEffect(() => {
    if (autoRate <= 0) return;
    const timer = window.setInterval(() => {
      const gain = autoRate / 5;
      const snapshot = saveStateRef.current;
      const nextPoints = Math.min(MAX_IMPORTED_RESOURCE, snapshot.points + gain);
      const nextLifetimePoints = Math.min(MAX_IMPORTED_RESOURCE, snapshot.lifetimePoints + gain);
      saveStateRef.current = {
        ...snapshot,
        points: nextPoints,
        lifetimePoints: nextLifetimePoints,
      };
      setPoints(nextPoints);
      setLifetimePoints(nextLifetimePoints);
    }, 200);
    return () => window.clearInterval(timer);
  }, [autoRate]);

  useEffect(() => {
    if (!cpsTrackingActive) return;

    const timer = window.setInterval(() => {
      const now = performance.now();
      pressTimes.current = pressTimes.current.filter((time) => now - time <= 1000);
      const cps = pressTimes.current.length;
      setCurrentCps(cps);
      setBestCps((best) => Math.max(best, cps));
      if (cps === 0) setCpsTrackingActive(false);
    }, 200);

    return () => window.clearInterval(timer);
  }, [cpsTrackingActive]);

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

  const performPress = useCallback(() => {
    const now = performance.now();
    pressTimes.current = [...pressTimes.current.filter((time) => now - time <= 1000), now];
    setCpsTrackingActive(true);

    const nextCombo = now - lastPressAt.current <= 1100 ? Math.min(comboRef.current + 1, 100) : 1;
    lastPressAt.current = now;
    comboRef.current = nextCombo;
    setCombo(nextCombo);

    const comboBonus = 1 + Math.min(0.5, nextCombo * upgrades.comboEngine * 0.0025);
    const critChance = Math.min(0.35, upgrades.criticalPress * 0.02);
    const isCrit = Math.random() < critChance;
    const amount = clickPower * comboBonus * (isCrit ? 5 : 1);

    const snapshot = saveStateRef.current;
    const nextPoints = Math.min(MAX_IMPORTED_RESOURCE, snapshot.points + amount);
    const nextLifetimePoints = Math.min(MAX_IMPORTED_RESOURCE, snapshot.lifetimePoints + amount);
    const nextLifetimePresses = Math.min(MAX_IMPORTED_COUNTER, snapshot.lifetimePresses + 1);
    saveStateRef.current = {
      ...snapshot,
      points: nextPoints,
      lifetimePoints: nextLifetimePoints,
      lifetimePresses: nextLifetimePresses,
    };
    setPoints(nextPoints);
    setLifetimePoints(nextLifetimePoints);
    setLifetimePresses(nextLifetimePresses);
    setLastGain(Math.max(0, nextPoints - snapshot.points));
    setLastWasCrit(isCrit);
  }, [clickPower, combo, upgrades.comboEngine, upgrades.criticalPress]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isInteractiveKeyboardTarget(event.target)) return;
      if (event.code === 'Space' && !event.repeat) {
        event.preventDefault();
        performPress();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [performPress]);

  const getUpgradeCost = (def: UpgradeDef) =>
    Math.floor(def.baseCost * Math.pow(def.costMultiplier, upgrades[def.id]));

  const getPurchasePlan = (def: UpgradeDef) => {
    const level = upgrades[def.id];
    const effectiveMax = def.maxLevel ?? MAX_UPGRADE_LEVEL;
    const remainingLevels = Math.max(0, effectiveMax - level);
    const targetCount = buyMode === 'max' ? remainingLevels : Math.min(buyMode, remainingLevels);
    let totalCost = 0;
    let count = 0;

    for (let index = 0; index < targetCount; index++) {
      const nextCost = Math.floor(def.baseCost * Math.pow(def.costMultiplier, level + index));
      if (totalCost + nextCost > points) break;
      totalCost += nextCost;
      count += 1;
    }

    return { count, totalCost };
  };

  const buyUpgrade = (def: UpgradeDef) => {
    const snapshot = saveStateRef.current;
    const level = snapshot.upgrades[def.id];
    const effectiveMax = def.maxLevel ?? MAX_UPGRADE_LEVEL;
    const remainingLevels = Math.max(0, effectiveMax - level);
    const targetCount = buyMode === 'max' ? remainingLevels : Math.min(buyMode, remainingLevels);

    let totalCost = 0;
    let count = 0;
    for (let index = 0; index < targetCount; index++) {
      const nextCost = Math.floor(def.baseCost * Math.pow(def.costMultiplier, level + index));
      if (totalCost + nextCost > snapshot.points) break;
      totalCost += nextCost;
      count += 1;
    }
    if (count < 1) return;

    const nextPoints = snapshot.points - totalCost;
    const nextUpgrades = {
      ...snapshot.upgrades,
      [def.id]: level + count,
    };

    saveStateRef.current = {
      ...snapshot,
      points: nextPoints,
      upgrades: nextUpgrades,
    };
    setPoints(nextPoints);
    setUpgrades(nextUpgrades);
  };

  const prestige = () => {
    const snapshot = saveStateRef.current;
    const availableGain = Math.max(
      0,
      Math.min(
        Math.floor(Math.sqrt(snapshot.points / PRESTIGE_THRESHOLD)),
        MAX_IMPORTED_QUANTUM_KEYS - snapshot.quantumKeys
      )
    );
    if (availableGain < 1) return;
    if (!window.confirm('Initiate Hyperdrive Reset? Current points and standard upgrades will reset, but Quantum Keys and records stay.')) return;

    const nextQuantumKeys = snapshot.quantumKeys + availableGain;
    const nextUpgrades = emptyUpgrades();
    const nextSnapshot: Omit<SpacebarSave, 'version' | 'lastSaveTime'> = {
      ...snapshot,
      points: 0,
      quantumKeys: nextQuantumKeys,
      upgrades: nextUpgrades,
    };

    // Persist permanent currency before the UI update so closing immediately after
    // prestige cannot restore the pre-reset run and award the same keys twice.
    saveStateRef.current = nextSnapshot;
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      version: SAVE_VERSION,
      ...nextSnapshot,
      lastSaveTime: Date.now(),
    }));

    setQuantumKeys(nextQuantumKeys);
    setPoints(0);
    setUpgrades(nextUpgrades);
    comboRef.current = 0;
    setCombo(0);
    pressTimes.current = [];
  };

  const buildExportCode = () => {
    const payload: SpacebarSave = {
      version: SAVE_VERSION,
      ...saveStateRef.current,
      lastSaveTime: Date.now(),
    };
    return 'SCG1.' + window.btoa(JSON.stringify(payload));
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
      const json = code.startsWith('SCG1.')
        ? window.atob(code.slice(5))
        : code;
      const parsed = JSON.parse(json);
      const validShape =
        parsed &&
        typeof parsed === 'object' &&
        parsed.upgrades &&
        typeof parsed.upgrades === 'object' &&
        !Array.isArray(parsed.upgrades) &&
        Object.prototype.hasOwnProperty.call(parsed, 'quantumKeys') &&
        Object.prototype.hasOwnProperty.call(parsed, 'lifetimePresses') &&
        !Object.prototype.hasOwnProperty.call(parsed, 'novaCores');
      if (!validShape) {
        throw new Error('Wrong game or corrupted format');
      }
      const imported = sanitizeSave(parsed);

      if (!window.confirm('Replace the current Spacebar Clicker save with this imported backup?')) {
        setSaveTransferStatus('Import cancelled.');
        return false;
      }

      const next: SpacebarSave = {
        ...imported,
        version: SAVE_VERSION,
        lastSaveTime: Date.now(),
      };

      saveStateRef.current = {
        points: next.points,
        lifetimePoints: next.lifetimePoints,
        lifetimePresses: next.lifetimePresses,
        quantumKeys: next.quantumKeys,
        upgrades: next.upgrades,
        bestCps: next.bestCps,
      };

      localStorage.setItem(SAVE_KEY, JSON.stringify(next));
      setPoints(next.points);
      setLifetimePoints(next.lifetimePoints);
      setLifetimePresses(next.lifetimePresses);
      setQuantumKeys(next.quantumKeys);
      setUpgrades(next.upgrades);
      setBestCps(next.bestCps);
      setCurrentCps(0);
      comboRef.current = 0;
    setCombo(0);
      setOfflineEarned(0);
      pressTimes.current = [];
      setSaveTransferStatus('Save imported successfully.');
      return true;
    } catch {
      setSaveTransferStatus('That save backup could not be read.');
      return false;
    }
  };

  const exportSave = async () => {
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
      link.download = `spacebar-clicker-save-${new Date().toISOString().slice(0, 10)}.scg`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(href), 1000);
      setSaveTransferStatus('Backup file downloaded.');
    } catch {
      setSaveTransferStatus('Could not create the backup file.');
    }
  };

  const importSave = () => {
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

  const hardReset = () => {
    if (!window.confirm('Erase all Spacebar Clicker progress on this browser?')) return;

    const nextUpgrades = emptyUpgrades();
    saveStateRef.current = {
      points: 0,
      lifetimePoints: 0,
      lifetimePresses: 0,
      quantumKeys: 0,
      upgrades: nextUpgrades,
      bestCps: 0,
    };

    localStorage.removeItem(SAVE_KEY);
    setPoints(0);
    setLifetimePoints(0);
    setLifetimePresses(0);
    setQuantumKeys(0);
    setUpgrades(nextUpgrades);
    setBestCps(0);
    setCurrentCps(0);
    comboRef.current = 0;
    setCombo(0);
    setOfflineEarned(0);
    setSaveImportText('');
    setShowSaveImport(false);
    setSaveTransferStatus('Local Spacebar Clicker progress was reset.');
  };

  const achievements = [
    { label: 'First Contact', unlocked: lifetimePresses >= 1, detail: 'Press Space once.' },
    { label: 'Key Cadet', unlocked: lifetimePresses >= 100, detail: 'Reach 100 lifetime presses.' },
    { label: 'Rapid Signal', unlocked: bestCps >= 8, detail: 'Reach 8 CPS.' },
    { label: 'Automation Online', unlocked: autoRate >= 10, detail: 'Produce 10 points per second automatically.' },
    { label: 'Hyperdrive', unlocked: quantumKeys >= 1, detail: 'Earn your first Quantum Key.' },
  ];

  return (
    <div className="min-h-screen bg-space-950 text-gray-200">
      <section className="max-w-7xl mx-auto px-4 pt-12 pb-8">
        <div className="text-center max-w-3xl mx-auto">
          <div className="text-xs font-mono tracking-[0.3em] text-neon-blue mb-4">
            {mode === 'unblocked' ? 'INSTANT BROWSER MODE' : 'KEYBOARD SIMULATION'}
          </div>
          <h1 className="text-4xl md:text-6xl font-display font-black text-white mb-5">
            {mode === 'unblocked' ? 'Spacebar Clicker Unblocked' : 'Spacebar Clicker'}
          </h1>
          <p className="text-gray-400 leading-relaxed">
            {mode === 'unblocked'
              ? 'Play Spacebar Clicker instantly in your browser with no download or account. Press the physical Space key on desktop or use the on-screen key on mobile; progress is stored locally in this browser.'
              : 'A fast spacebar clicker game that combines manual key presses, CPS feedback, upgrades, automation and a complete prestige loop. Press Space to earn points, then turn every run into a faster one.'}
          </p>
          <div className="mt-6 grid sm:grid-cols-3 gap-2 text-left">
            <a
              href={mode === 'unblocked' ? '/spacebar-clicker-unblocked/' : '/spacebar-clicker/'}
              aria-current="page"
              className="rounded-xl border border-neon-blue/40 bg-neon-blue/5 px-4 py-3"
            >
              <div className="text-[10px] font-mono text-neon-blue uppercase tracking-wider">Idle game</div>
              <div className="mt-1 text-sm font-bold text-white">Upgrades + prestige</div>
            </a>
            <a
              href="/spacebar-clicker-test/"
              className="rounded-xl border border-white/10 bg-space-900/60 px-4 py-3 hover:border-neon-blue/40 transition-colors"
            >
              <div className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Speed test</div>
              <div className="mt-1 text-sm font-bold text-white">Timed CPS modes</div>
            </a>
            <a
              href="/spacebar-counter/"
              className="rounded-xl border border-white/10 bg-space-900/60 px-4 py-3 hover:border-neon-blue/40 transition-colors"
            >
              <div className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Counter</div>
              <div className="mt-1 text-sm font-bold text-white">Untimed press total</div>
            </a>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 pb-12 grid lg:grid-cols-[1fr_380px] gap-6">
        <div className="bg-space-900/80 border border-white/10 rounded-2xl p-5 md:p-8 shadow-2xl">
          {offlineEarned > 0 && (
            <div className="mb-5 rounded-lg border border-neon-green/30 bg-neon-green/5 p-3 text-sm text-neon-green flex justify-between gap-4">
              <span>Offline production recovered</span>
              <strong>+{formatNumber(offlineEarned)} points</strong>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-7">
            <Stat label="Points" value={formatNumber(points)} />
            <Stat label="CPS" value={currentCps.toFixed(1)} />
            <Stat label="Combo" value={'x' + combo} />
            <Stat label="Auto / sec" value={formatNumber(autoRate)} />
          </div>

          {nearestUpgrade && (
            <div className="mb-6 rounded-xl border border-white/10 bg-black/20 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
              <div>
                <span className="text-gray-500">Nearest upgrade:</span>{' '}
                <strong className="text-white">{nearestUpgrade.def.name}</strong>
              </div>
              <div className="font-mono text-neon-blue">
                {points >= nearestUpgrade.cost
                  ? 'READY • ' + formatNumber(nearestUpgrade.cost)
                  : formatNumber(nearestUpgrade.cost - points) + ' points to go'}
              </div>
            </div>
          )}

          <div className="text-center py-6">
            <div className="text-5xl md:text-7xl font-mono font-black text-white mb-3 tabular-nums">
              {formatNumber(points)}
            </div>
            <div className="h-7 text-sm font-mono mb-4">
              {lastGain > 0 && (
                <span className={lastWasCrit ? 'text-yellow-300' : 'text-neon-blue'}>
                  {lastWasCrit ? 'CRITICAL ' : '+'}{formatNumber(lastGain)}
                </span>
              )}
            </div>

            <button
              type="button"
              onPointerDown={(event) => {
                event.preventDefault();
                performPress();
              }}
              className="w-full max-w-3xl mx-auto min-h-[118px] md:min-h-[145px] rounded-2xl border-2 border-neon-blue bg-gradient-to-b from-space-700 to-black text-white shadow-[0_12px_0_#062f38,0_0_35px_rgba(0,243,255,0.16)] active:translate-y-2 active:shadow-[0_4px_0_#062f38,0_0_25px_rgba(0,243,255,0.28)] transition-all select-none touch-manipulation"
              aria-label="Press the spacebar clicker"
            >
              <span className="block text-3xl md:text-5xl font-display font-black tracking-[0.35em]">SPACE</span>
              <span className="block mt-2 text-[11px] text-neon-blue font-mono tracking-widest">
                PRESS PHYSICAL SPACE OR TAP HERE
              </span>
            </button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-8">
            <Stat label="Per Press" value={formatNumber(clickPower)} />
            <Stat label="Best CPS" value={bestCps.toFixed(1)} />
            <Stat label="Lifetime Presses" value={formatNumber(lifetimePresses)} />
            <Stat label="Quantum Keys" value={formatNumber(quantumKeys)} />
          </div>

          <div className="mt-7 rounded-xl border border-neon-purple/30 bg-neon-purple/5 p-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-xl text-white">Hyperdrive Prestige</h2>
                <p className="text-sm text-gray-400 mt-1">
                  Reach {formatNumber(PRESTIGE_THRESHOLD)} points to convert this run into permanent Quantum Keys.
                  Each key adds +10% global production.
                </p>
                <div className="mt-4">
                  <div className="flex justify-between text-[11px] font-mono text-gray-500 mb-1">
                    <span>{prestigeProgress.toFixed(1)}%</span>
                    <span>{pointsToPrestige > 0 ? formatNumber(pointsToPrestige) + ' points remaining' : 'Hyperdrive ready'}</span>
                  </div>
                  <div className="h-2 rounded-full bg-black/40 overflow-hidden">
                    <div
                      className="h-full bg-neon-purple transition-all duration-300"
                      style={{ width: `${prestigeProgress}%` }}
                    />
                  </div>
                </div>
              </div>
              <button
                type="button"
                disabled={prestigeGain < 1}
                onClick={prestige}
                className="px-5 py-3 rounded-lg font-bold bg-neon-purple text-black disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed"
              >
                {prestigeGain > 0
                  ? 'RESET FOR +' + prestigeGain + ' KEY' + (prestigeGain > 1 ? 'S' : '')
                  : 'HYPERDRIVE LOCKED'}
              </button>
            </div>
          </div>
        </div>

        <aside className="bg-space-900/80 border border-white/10 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-white/10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl text-white">UPGRADES</h2>
                <p className="text-xs text-gray-500 mt-1">Spend points to accelerate this run.</p>
              </div>
              <div className="flex rounded-lg border border-white/10 overflow-hidden">
                {([1, 10, 'max'] as const).map((modeValue) => (
                  <button
                    key={String(modeValue)}
                    type="button"
                    onClick={() => setBuyMode(modeValue)}
                    className={'min-h-11 px-3 py-2 text-[10px] font-bold transition-colors ' + (buyMode === modeValue ? 'bg-neon-blue text-black' : 'bg-black/20 text-gray-400 hover:text-white')}
                  >
                    {modeValue === 'max' ? 'MAX' : 'x' + modeValue}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="p-4 space-y-3 max-h-[760px] overflow-y-auto">
            {UPGRADE_DEFS.map((def) => {
              const level = upgrades[def.id];
              const maxed = level >= (def.maxLevel ?? MAX_UPGRADE_LEVEL);
              const cost = getUpgradeCost(def);
              const plan = getPurchasePlan(def);
              return (
                <button
                  key={def.id}
                  type="button"
                  onClick={() => buyUpgrade(def)}
                  disabled={maxed || plan.count < 1}
                  className="w-full text-left rounded-xl border border-white/10 bg-black/20 p-4 hover:border-neon-blue/40 disabled:opacity-45 disabled:cursor-not-allowed transition-colors"
                >
                  <div className="flex justify-between gap-3">
                    <strong className="text-white">{def.name}</strong>
                    <span className="text-xs text-neon-blue font-mono">
                      LV {level}{def.maxLevel ? '/' + def.maxLevel : ''}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{def.description}</p>
                  <div className="flex justify-between gap-3 text-xs font-mono mt-3">
                    <span className="text-gray-300">{maxed ? 'MAXED' : formatNumber(cost) + ' next'}</span>
                    {!maxed && (
                      <span className={plan.count > 0 ? 'text-neon-blue' : 'text-gray-600'}>
                        {plan.count > 0 ? 'BUY x' + plan.count + ' • ' + formatNumber(plan.totalCost) : 'LOCKED'}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </aside>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-20">
        <div className="grid md:grid-cols-5 gap-3 mb-10">
          {achievements.map((item) => (
            <div
              key={item.label}
              className={
                'rounded-xl border p-4 ' +
                (item.unlocked
                  ? 'border-neon-green/30 bg-neon-green/5'
                  : 'border-white/10 bg-black/20 opacity-55')
              }
            >
              <div className="text-lg mb-1">
                {item.unlocked ? '✓' : '○'} <strong className="text-white">{item.label}</strong>
              </div>
              <p className="text-xs text-gray-500">{item.detail}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 mb-12">
          <a href="/spacebar-games/" className="px-4 py-2 rounded border border-white/10 hover:border-neon-blue text-sm">
            All Spacebar Games
          </a>
          <a href="/spacebar-clicker-2/" className="px-4 py-2 rounded border border-white/10 hover:border-neon-purple text-sm">
            Spacebar Clicker 2
          </a>
          <a href="/spacebar-counter/" className="px-4 py-2 rounded border border-white/10 hover:border-neon-blue text-sm">
            Spacebar Counter
          </a>
          <a href="/spacebar-clicker-test/" className="px-4 py-2 rounded border border-white/10 hover:border-neon-blue text-sm">
            Spacebar Clicker Test
          </a>
          {mode !== 'unblocked' && (
            <a
              href="/spacebar-clicker-unblocked/"
              className="px-4 py-2 rounded border border-white/10 hover:border-neon-blue text-sm"
            >
              Instant browser mode
            </a>
          )}
          <button
            type="button"
            onClick={exportSave}
            className="px-4 py-2 rounded border border-white/10 hover:border-neon-blue text-sm"
          >
            Copy save code
          </button>
          <button
            type="button"
            onClick={downloadSave}
            className="px-4 py-2 rounded border border-white/10 hover:border-neon-blue text-sm"
          >
            Download backup
          </button>
          <button
            type="button"
            aria-expanded={showSaveImport}
            onClick={() => {
              setShowSaveImport((open) => !open);
              setSaveTransferStatus('');
            }}
            className="px-4 py-2 rounded border border-white/10 hover:border-neon-blue text-sm"
          >
            {showSaveImport ? 'Close restore' : 'Restore save'}
          </button>
          <button
            type="button"
            onClick={hardReset}
            className="px-4 py-2 rounded border border-red-500/20 text-red-300 hover:border-red-500/60 text-sm"
          >
            Reset local progress
          </button>
        </div>

        {showSaveImport && (
          <div className="mb-6 rounded-xl border border-neon-blue/30 bg-space-900/70 p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <h3 className="font-display font-bold text-white">Restore Spacebar Clicker save</h3>
                <p className="mt-1 text-xs text-gray-500">
                  Paste an SCG1 save code below, or choose a .scg backup file. Imported values are validated before replacing this browser's current save.
                </p>
              </div>
              <button
                type="button"
                onClick={importSaveFile}
                className="min-h-11 shrink-0 px-4 py-2 rounded border border-white/15 text-sm text-white hover:border-neon-blue"
              >
                Choose backup file
              </button>
            </div>
            <label htmlFor="spacebar-save-import" className="sr-only">Spacebar Clicker save code</label>
            <textarea
              id="spacebar-save-import"
              value={saveImportText}
              onChange={(event) => setSaveImportText(event.target.value)}
              placeholder="Paste SCG1 save code here..."
              spellCheck={false}
              className="mt-4 h-28 w-full resize-y rounded-lg border border-white/10 bg-black/30 p-3 font-mono text-xs text-gray-200 outline-none focus:border-neon-blue"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={importSave}
                className="min-h-11 px-4 py-2 rounded bg-neon-blue text-black text-sm font-bold hover:bg-white"
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

        <article className="text-gray-400 space-y-8 leading-relaxed">
          {mode === 'unblocked' ? (
            <>
              <section>
                <h2 className="text-2xl font-display text-white mb-3">Instant browser play</h2>
                <p>
                  This version opens directly in a modern browser with no download, account, launcher, or extension required. The game itself is the same interactive Spacebar Clicker economy: press Space, buy upgrades, unlock automation, and use Hyperdrive prestige once a run is large enough.
                </p>
              </section>
              <section>
                <h2 className="text-2xl font-display text-white mb-3">What “unblocked” means here</h2>
                <p>
                  On this site, “unblocked” describes an instant browser-play page with no installation step. It does not promise to bypass school, workplace, parental-control, firewall, or network-administrator restrictions. Whether a network permits access is controlled by that network.
                </p>
              </section>
              <section>
                <h2 className="text-2xl font-display text-white mb-3">Local progress and offline earnings</h2>
                <p>
                  Progress is saved in local browser storage on the current device. There is no login or cloud sync. Once automatic production is unlocked, returning after time away can award capped offline earnings based on the saved production rate.
                </p>
              </section>
              <section>
                <h2 className="text-2xl font-display text-white mb-3">Desktop and mobile controls</h2>
                <p>
                  Desktop players can use the physical Space key. Phones and tablets use the large on-screen Space button with the same scoring and upgrade logic. Holding a physical key is not treated as repeated intentional input.
                </p>
              </section>
              <section>
                <h2 className="text-2xl font-display text-white mb-3">Related Spacebar tools</h2>
                <p>
                  Use the Spacebar Counter when you only need a running press total, or the Spacebar Clicker Test for fixed-duration CPS challenges and the 100-click sprint. The main Spacebar Clicker page is the full incremental game.
                </p>
              </section>
              <section>
                <h2 className="text-2xl font-display text-white mb-3">Spacebar Clicker Unblocked FAQ</h2>
                <div className="space-y-4">
                  <div><h3 className="text-lg text-white">What does “unblocked” mean on this page?</h3><p>It means the game opens directly in a browser with no installation, launcher, extension, or account step. It does not bypass network restrictions.</p></div>
                  <div><h3 className="text-lg text-white">Can a school or workplace network still block the game?</h3><p>Yes. Access depends on the rules applied by the network, device, firewall, parental controls, or administrator.</p></div>
                  <div><h3 className="text-lg text-white">Does the instant-play version save progress?</h3><p>Yes. Progress is stored locally in the current browser. There is no cloud or cross-device sync.</p></div>
                  <div><h3 className="text-lg text-white">Is this the same Spacebar Clicker game?</h3><p>Yes. The instant-play route uses the same upgrades, automation, CPS logic, and Hyperdrive prestige system as the main Spacebar Clicker page.</p></div>
                </div>
              </section>
            </>
          ) : (
            <>
              <section>
                <h2 className="text-2xl font-display text-white mb-3">How to play Spacebar Clicker</h2>
                <p>
                  Start by pressing the physical space bar on a desktop keyboard or the large on-screen Space key on a phone or tablet.
                  Each valid press adds points. Holding the key does not count as repeated input, so the score reflects deliberate presses
                  rather than browser key-repeat. The live CPS meter shows how many valid presses occurred during the most recent second.
                </p>
              </section>
              <section>
                <h2 className="text-2xl font-display text-white mb-3">Upgrades, automation and prestige</h2>
                <p>
                  Spend points on manual power or automatic production. Stronger Key and Mechanical Switch reward active play, while
                  Auto Presser, Turbo Switch and Spacebar Reactor build passive income. Hyperdrive converts a sufficiently large run into
                  Quantum Keys, which permanently raise global production and make the next run faster.
                </p>
              </section>
              <section>
                <h2 className="text-2xl font-display text-white mb-3">Spacebar Clicker vs Spacebar Counter</h2>
                <p>
                  This page is the incremental game. If the goal is only to count key presses, use the dedicated Spacebar Counter.
                  If the goal is to measure speed over a fixed duration, the Spacebar Clicker Test provides timed tests, peak CPS,
                  average CPS and a saved personal best.
                </p>
              </section>
              <section>
                <h2 className="text-2xl font-display text-white mb-3">Keyboard and mobile support</h2>
                <p>
                  Desktop players can use the physical Space key, while mobile players receive the same scoring logic through the
                  large touch target. Progress is stored in local browser storage. There is no account system and no claim of cloud
                  synchronization or cross-device progress.
                </p>
              </section>
              <section>
                <h2 className="text-2xl font-display text-white mb-3">Frequently asked questions</h2>
                <div className="space-y-4">
                  <div><h3 className="text-lg text-white">Is Spacebar Clicker free?</h3><p>Yes. It runs in a modern browser with no download or account required.</p></div>
                  <div><h3 className="text-lg text-white">Does holding Space increase CPS?</h3><p>No. Repeated keyboard events generated by holding the key are ignored.</p></div>
                  <div><h3 className="text-lg text-white">Does progress sync between devices?</h3><p>No. Progress is saved locally in the current browser.</p></div>
                  <div><h3 className="text-lg text-white">What survives a prestige reset?</h3><p>Quantum Keys, lifetime presses, best CPS and achievement progress remain.</p></div>
                  <div><h3 className="text-lg text-white">Can I move my Spacebar Clicker save to another browser?</h3><p>Yes. Copy a save code or download a .scg backup file, move it to the other browser or device, then paste the code or import the backup file. Imported data is validated before it replaces the local save.</p></div>
                </div>
              </section>
            </>
          )}

          <section>
            <h2 className="text-2xl font-display text-white mb-3">Related Spacebar guides</h2>
            <p>
              {mode === 'unblocked' ? (
                <>Read <a href="/blog/mastering-the-space-bar-clicking-game/" className="text-neon-blue hover:text-white">Mastering the Space Bar</a> for a broader guide to Spacebar input, upgrades, and automation.</>
              ) : (
                <>Read <a href="/blog/mastering-the-space-bar-clicking-game/" className="text-neon-blue hover:text-white">Mastering the Space Bar</a> for input and automation strategy, and <a href="/blog/active-vs-passive-space-click-game-styles/" className="text-neon-blue hover:text-white">Active Clicking vs. Passive Mining</a> for playstyle tradeoffs.</>
              )}
            </p>
          </section>
        </article>
      </section>
    </div>
  );
};

export default SpacebarGame;
