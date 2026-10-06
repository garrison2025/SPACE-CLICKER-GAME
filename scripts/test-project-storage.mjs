import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const expect = (condition, message) => {
  if (!condition) throw new Error(message);
};

const projectStorageSource = fs.readFileSync(
  path.resolve('utils/projectStorage.ts'),
  'utf8'
);

const transpiledProjectStorage = ts.transpileModule(projectStorageSource, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;

const loadProjectStorageModule = async (tag) => {
  const encoded = Buffer.from(transpiledProjectStorage, 'utf8').toString('base64');
  return import(`data:text/javascript;base64,${encoded}#${tag}`);
};

class MemoryStorage {
  constructor({ failRemove = false, failLength = false } = {}) {
    this.map = new Map();
    this.failRemove = failRemove;
    this.failLength = failLength;
  }

  get length() {
    if (this.failLength) throw new Error('storage blocked');
    return this.map.size;
  }

  key(index) {
    return [...this.map.keys()][index] ?? null;
  }

  getItem(key) {
    return this.map.has(key) ? this.map.get(key) : null;
  }

  setItem(key, value) {
    this.map.set(String(key), String(value));
  }

  removeItem(key) {
    if (this.failRemove) throw new Error('remove blocked');
    this.map.delete(key);
  }
}

const successStorage = new MemoryStorage();
globalThis.localStorage = successStorage;
const successModule = await loadProjectStorageModule('success');

expect(successModule.safeSetStorageItem('cosmic-miner-save-v2', 'before'), 'Project save should write before reset');
expect(successModule.safeSetStorageItem('unrelated-key', 'keep'), 'Unrelated key should write before reset');

const successResult = successModule.clearProjectStorage();
expect(successResult.success, 'Factory reset should report success');
expect(successResult.removed === 1, 'Factory reset should remove exactly the project key');
expect(successStorage.getItem('cosmic-miner-save-v2') === null, 'Project key should be deleted');
expect(successStorage.getItem('unrelated-key') === 'keep', 'Unrelated storage must be preserved');

expect(
  !successModule.safeSetStorageItem('cosmic-miner-save-v2', 'resurrected'),
  'Project saves must stay blocked after a successful reset until reload'
);
expect(
  successStorage.getItem('cosmic-miner-save-v2') === null,
  'beforeunload-style save must not resurrect a cleared project key'
);
expect(
  successModule.safeSetStorageItem('unrelated-key-2', 'allowed'),
  'Reset guard must not block unrelated origin storage'
);

// Prevent future save/settings keys from silently falling outside the scoped
// factory-reset rules. Extract the storage constants used by the live source
// and assert that each one is recognized by projectStorage.ts.
const storageSourceFiles = [
  'constants.ts',
  'components/MarsColony.tsx',
  'components/StarDefense.tsx',
  'components/MergeShips.tsx',
  'components/GravityIdle.tsx',
  'components/DeepSpaceSignal.tsx',
  'components/SpacebarGame.tsx',
  'components/SpacebarClicker2.tsx',
  'components/SpacebarCounter.tsx',
  'components/SpacebarClickerTest.tsx',
  'services/audioService.ts',
  'App.tsx',
];

const discoveredKeys = new Set();
for (const relativePath of storageSourceFiles) {
  const source = fs.readFileSync(path.resolve(relativePath), 'utf8');

  for (const match of source.matchAll(
    /(?:SAVE_KEY|BEST_KEY|CURRENT_KEY|BEST_PREFIX|HISTORY_KEY)\s*=\s*['"]([^'"]+)['"]/g
  )) {
    discoveredKeys.add(match[1]);
  }

  for (const match of source.matchAll(
    /['"](space_haptic|space_screenshake|sc_mute)['"]/g
  )) {
    discoveredKeys.add(match[1]);
  }
}

expect(discoveredKeys.size >= 11, 'Storage key discovery should cover every current game/tool setting key');
for (const key of discoveredKeys) {
  expect(
    successModule.isProjectStorageKey(key),
    `Factory reset scope is missing storage key/prefix: ${key}`
  );
}
expect(
  !successModule.isProjectStorageKey('unrelated-key'),
  'Unrelated origin storage must never be classified as project data'
);

// Page-level reset contract:
// A reset control must delete the persisted save, not only clear React state.
const classicSpacebarSource = fs.readFileSync(
  path.resolve('components/SpacebarGame.tsx'),
  'utf8'
);
expect(
  /const hardReset\s*=\s*\(\)\s*=>\s*\{[\s\S]*?safeRemoveStorageItem\(SAVE_KEY\)/.test(classicSpacebarSource),
  'Classic Spacebar hardReset must delete the persisted save before clearing the session'
);

const clicker2Source = fs.readFileSync(
  path.resolve('components/SpacebarClicker2.tsx'),
  'utf8'
);
expect(
  /const resetAll\s*=\s*\(\)\s*=>\s*\{[\s\S]*?safeRemoveStorageItem\(SAVE_KEY\)/.test(clicker2Source),
  'Spacebar Clicker 2 resetAll must delete the persisted save before clearing the session'
);

const appSource = fs.readFileSync(path.resolve('App.tsx'), 'utf8');
expect(
  /onResetGame=\{\(\)\s*=>\s*\{[\s\S]*?safeRemoveStorageItem\(SAVE_KEY\)/.test(appSource),
  'Galaxy Miner telemetry reset must delete the persisted save before reloading'
);
expect(
  /onResetGame=\{\(\)\s*=>\s*\{[\s\S]*?safeRemoveStorageItem\(SAVE_KEY\)[\s\S]*?suppressSaveRef\.current\s*=\s*true[\s\S]*?window\.location\.reload\(\)/.test(appSource),
  'Galaxy Miner telemetry reset must suppress pagehide autosave before reloading'
);
expect(
  /const saveGame\s*=\s*useCallback\(\(\)\s*=>\s*\{\s*if\s*\(suppressSaveRef\.current\)\s*return true;/.test(appSource),
  'Galaxy Miner saveGame must honor the reset autosave suppression guard'
);

const failureStorage = new MemoryStorage({ failRemove: true });
failureStorage.setItem('spacebar_clicker_save_v1', 'before');
globalThis.localStorage = failureStorage;
const failureModule = await loadProjectStorageModule('failure');

const failureResult = failureModule.clearProjectStorage();
expect(!failureResult.success, 'Failed storage deletion should report failure');
expect(
  failureModule.safeSetStorageItem('spacebar_clicker_save_v1', 'still-writable'),
  'A failed reset must release the write guard so normal persistence can continue'
);
expect(
  failureStorage.getItem('spacebar_clicker_save_v1') === 'still-writable',
  'Project persistence should recover after a failed reset'
);

console.log(`Project storage tests passed: scoped clearing, ${discoveredKeys.size} discovered project keys, page-level reset deletion, Galaxy reset autosave suppression, failure reporting, and reset write guard are verified.`);
