let projectStorageResetInProgress = false;
let storageWriteFailureNotified = false;

export const STORAGE_WRITE_FAILED_EVENT = 'spaceclicker:storage-write-failed';

const notifyStorageWriteFailure = () => {
  if (typeof window === 'undefined' || storageWriteFailureNotified) return;
  storageWriteFailureNotified = true;
  window.dispatchEvent(new Event(STORAGE_WRITE_FAILED_EVENT));
};

export const safeGetStorageItem = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

export const safeSetStorageItem = (key: string, value: string) => {
  if (projectStorageResetInProgress && isProjectStorageKey(key)) {
    return false;
  }

  try {
    localStorage.setItem(key, value);
    storageWriteFailureNotified = false;
    return true;
  } catch {
    notifyStorageWriteFailure();
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
  'spacebar_counter_',
  'spacebar_test_',
];

export const isProjectStorageKey = (key: string) =>
  PROJECT_STORAGE_EXACT_KEYS.has(key) ||
  PROJECT_STORAGE_PREFIXES.some((prefix) => key.startsWith(prefix));

export const clearProjectStorage = () => {
  projectStorageResetInProgress = true;

  try {
    const keys = Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index))
      .filter((key): key is string => Boolean(key));

    let removed = 0;
    let success = true;

    keys.forEach((key) => {
      if (!isProjectStorageKey(key)) return;
      if (safeRemoveStorageItem(key)) {
        removed += 1;
      } else {
        success = false;
      }
    });

    if (!success) {
      projectStorageResetInProgress = false;
    }

    return { success, removed };
  } catch {
    projectStorageResetInProgress = false;
    return { success: false, removed: 0 };
  }
};
