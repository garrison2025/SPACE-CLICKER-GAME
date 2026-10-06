const expect = (condition, message) => {
  if (!condition) throw new Error(message);
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
const successModule = await import(new URL('../utils/projectStorage.ts?success', import.meta.url));

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

const failureStorage = new MemoryStorage({ failRemove: true });
failureStorage.setItem('spacebar_clicker_save_v1', 'before');
globalThis.localStorage = failureStorage;
const failureModule = await import(new URL('../utils/projectStorage.ts?failure', import.meta.url));

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

console.log('Project storage tests passed: scoped clearing, failure reporting, and reset write guard are verified.');
