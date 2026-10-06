export const safeGetStorageItem = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

export const safeSetStorageItem = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
};

export const safeRemoveStorageItem = (key: string) => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
};

const PROJECT_STORAGE_EXACT_KEYS = new Set([
  'space_haptic',
  'space_screenshake',
  'sc_mute',
]);

const PROJECT_STORAGE_PREFIXES = [
  'cosmic-miner-save-',
  'mars_colony_save_',
  'star_defense_save_',
  'merge_ships_save_',
  'gravity_idle_save_',
  'deep_signal_save_',
  'spacebar_clicker_save_',
  'spacebar_clicker_2_save_',
  'spacebar_counter_best_',
  'spacebar_test_',
];

export const isProjectStorageKey = (key: string) =>
  PROJECT_STORAGE_EXACT_KEYS.has(key) ||
  PROJECT_STORAGE_PREFIXES.some((prefix) => key.startsWith(prefix));

export const clearProjectStorage = () => {
  try {
    const keys = Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index))
      .filter((key): key is string => Boolean(key));

    let removed = 0;
    keys.forEach((key) => {
      if (isProjectStorageKey(key) && safeRemoveStorageItem(key)) {
        removed += 1;
      }
    });

    return removed;
  } catch {
    return 0;
  }
};
