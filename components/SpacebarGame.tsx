import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { formatNumber } from '../utils';

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

const safeNumber = (value: unknown, fallback = 0) =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback;

const sanitizeSave = (raw: unknown): SpacebarSave => {
  if (!raw || typeof raw !== 'object') return defaultSave();
  const data = raw as Partial<SpacebarSave>;
  const incoming = data.upgrades && typeof data.upgrades === 'object' ? data.upgrades : {};
  const upgrades = emptyUpgrades();

  (Object.keys(upgrades) as UpgradeId[]).forEach((id) => {
    upgrades[id] = Math.max(0, Math.floor(safeNumber((incoming as Record<string, unknown>)[id])));
  });

  return {
    version: SAVE_VERSION,
    points: safeNumber(data.points),
    lifetimePoints: safeNumber(data.lifetimePoints),
    lifetimePresses: Math.floor(safeNumber(data.lifetimePresses)),
    quantumKeys: Math.floor(safeNumber(data.quantumKeys)),
    upgrades,
    bestCps: safeNumber(data.bestCps),
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
  const [combo, setCombo] = useState(0);
  const [lastGain, setLastGain] = useState(0);
  const [lastWasCrit, setLastWasCrit] = useState(false);
  const [offlineEarned, setOfflineEarned] = useState(0);
  const pressTimes = useRef<number[]>([]);
  const lastPressAt = useRef(0);

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

  const prestigeGain = Math.floor(Math.sqrt(points / PRESTIGE_THRESHOLD));

  const saveNow = useCallback(() => {
    if (typeof window === 'undefined') return;
    const payload: SpacebarSave = {
      version: SAVE_VERSION,
      points,
      lifetimePoints,
      lifetimePresses,
      quantumKeys,
      upgrades,
      bestCps,
      lastSaveTime: Date.now(),
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
  }, [points, lifetimePoints, lifetimePresses, quantumKeys, upgrades, bestCps]);

  useEffect(() => {
    const elapsed = Math.min(86400, Math.max(0, (Date.now() - initial.lastSaveTime) / 1000));
    const initialGlobal = (1 + initial.upgrades.quantumKeyboard * 0.25) * (1 + initial.quantumKeys * 0.1);
    const initialRate =
      (initial.upgrades.autoPresser * 2 + initial.upgrades.spacebarReactor * 5) *
      Math.pow(2, initial.upgrades.turboSwitch) *
      initialGlobal;

    if (elapsed >= 60 && initialRate > 0) {
      const earned = Math.floor(initialRate * elapsed);
      setPoints((value) => value + earned);
      setLifetimePoints((value) => value + earned);
      setOfflineEarned(earned);
    }
  }, [initial]);

  useEffect(() => {
    if (autoRate <= 0) return;
    const timer = window.setInterval(() => {
      const gain = autoRate / 10;
      setPoints((value) => value + gain);
      setLifetimePoints((value) => value + gain);
    }, 100);
    return () => window.clearInterval(timer);
  }, [autoRate]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const now = performance.now();
      pressTimes.current = pressTimes.current.filter((time) => now - time <= 1000);
      const cps = pressTimes.current.length;
      setCurrentCps(cps);
      setBestCps((best) => Math.max(best, cps));
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

  const performPress = useCallback(() => {
    const now = performance.now();
    pressTimes.current = [...pressTimes.current.filter((time) => now - time <= 1000), now];

    const nextCombo = now - lastPressAt.current <= 1100 ? Math.min(combo + 1, 100) : 1;
    lastPressAt.current = now;
    setCombo(nextCombo);

    const comboBonus = 1 + Math.min(0.5, nextCombo * upgrades.comboEngine * 0.0025);
    const critChance = Math.min(0.35, upgrades.criticalPress * 0.02);
    const isCrit = Math.random() < critChance;
    const amount = clickPower * comboBonus * (isCrit ? 5 : 1);

    setPoints((value) => value + amount);
    setLifetimePoints((value) => value + amount);
    setLifetimePresses((value) => value + 1);
    setLastGain(amount);
    setLastWasCrit(isCrit);
  }, [clickPower, combo, upgrades.comboEngine, upgrades.criticalPress]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
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

  const buyUpgrade = (def: UpgradeDef) => {
    const level = upgrades[def.id];
    if (def.maxLevel !== undefined && level >= def.maxLevel) return;
    const cost = getUpgradeCost(def);
    if (points < cost) return;
    setPoints((value) => value - cost);
    setUpgrades((value) => ({ ...value, [def.id]: value[def.id] + 1 }));
  };

  const prestige = () => {
    if (prestigeGain < 1) return;
    if (!window.confirm('Initiate Hyperdrive Reset? Current points and standard upgrades will reset, but Quantum Keys and records stay.')) return;
    setQuantumKeys((value) => value + prestigeGain);
    setPoints(0);
    setUpgrades(emptyUpgrades());
    setCombo(0);
    pressTimes.current = [];
  };

  const hardReset = () => {
    if (!window.confirm('Erase all Spacebar Clicker progress on this browser?')) return;
    localStorage.removeItem(SAVE_KEY);
    setPoints(0);
    setLifetimePoints(0);
    setLifetimePresses(0);
    setQuantumKeys(0);
    setUpgrades(emptyUpgrades());
    setBestCps(0);
    setCurrentCps(0);
    setCombo(0);
    setOfflineEarned(0);
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
            <h2 className="font-display text-2xl text-white">UPGRADES</h2>
            <p className="text-xs text-gray-500 mt-1">Spend points to accelerate this run.</p>
          </div>
          <div className="p-4 space-y-3 max-h-[760px] overflow-y-auto">
            {UPGRADE_DEFS.map((def) => {
              const level = upgrades[def.id];
              const maxed = def.maxLevel !== undefined && level >= def.maxLevel;
              const cost = getUpgradeCost(def);
              return (
                <button
                  key={def.id}
                  type="button"
                  onClick={() => buyUpgrade(def)}
                  disabled={maxed || points < cost}
                  className="w-full text-left rounded-xl border border-white/10 bg-black/20 p-4 hover:border-neon-blue/40 disabled:opacity-45 disabled:cursor-not-allowed transition-colors"
                >
                  <div className="flex justify-between gap-3">
                    <strong className="text-white">{def.name}</strong>
                    <span className="text-xs text-neon-blue font-mono">
                      LV {level}{def.maxLevel ? '/' + def.maxLevel : ''}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{def.description}</p>
                  <div className="text-xs font-mono mt-3 text-gray-300">
                    {maxed ? 'MAXED' : formatNumber(cost) + ' points'}
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
            onClick={hardReset}
            className="px-4 py-2 rounded border border-red-500/20 text-red-300 hover:border-red-500/60 text-sm"
          >
            Reset local progress
          </button>
        </div>

        <article className="text-gray-400 space-y-8 leading-relaxed">
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
              <div>
                <h3 className="text-lg text-white">Is Spacebar Clicker free?</h3>
                <p>Yes. It runs in a modern browser with no download or account required.</p>
              </div>
              <div>
                <h3 className="text-lg text-white">Does holding Space increase CPS?</h3>
                <p>No. Repeated keyboard events generated by holding the key are ignored.</p>
              </div>
              <div>
                <h3 className="text-lg text-white">Does progress sync between devices?</h3>
                <p>No. Progress is saved locally in the current browser.</p>
              </div>
              <div>
                <h3 className="text-lg text-white">What survives a prestige reset?</h3>
                <p>Quantum Keys, lifetime presses, best CPS and achievement progress remain.</p>
              </div>
            </div>
          </section>
        </article>
      </section>
    </div>
  );
};

export default SpacebarGame;
