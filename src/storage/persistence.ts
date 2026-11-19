import { STORAGE_KEY, getSeedData } from '../data/seedData';
import { AppState } from '../types';

const IDB_NAME = 'ClarityOSSecondBrainDB';
const IDB_VERSION = 1;
const IDB_STORE = 'workspace';
const IDB_RECORD_KEY = 'primary_state';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const request = indexedDB.open(IDB_NAME, IDB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB'));
  });
}

export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (navigator.storage && typeof navigator.storage.persist === 'function') {
      const already = await navigator.storage.persisted();
      if (already) return true;
      return await navigator.storage.persist();
    }
  } catch {
    // Ignore unsupported environments
  }
  return false;
}

export function hasLocalStorageKey(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

export function loadInitialStateSync(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        version: 1,
        tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
        longTermGoals: Array.isArray(parsed.longTermGoals) ? parsed.longTermGoals : [],
        shortTermExperiments: Array.isArray(parsed.shortTermExperiments)
          ? parsed.shortTermExperiments
          : [],
      };
    }
  } catch {
    // Fall through to seed data
  }
  return getSeedData();
}

export async function loadStateFromIndexedDB(): Promise<AppState | null> {
  try {
    const db = await openDB();
    return await new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(IDB_RECORD_KEY);
      req.onsuccess = () => {
        const val = req.result;
        if (
          val &&
          Array.isArray(val.tasks) &&
          Array.isArray(val.longTermGoals) &&
          Array.isArray(val.shortTermExperiments)
        ) {
          resolve(val as AppState);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function persistState(state: AppState): Promise<boolean> {
  let localOk = false;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    localOk = true;
  } catch {
    localOk = false;
  }

  let idbOk = false;
  try {
    const db = await openDB();
    idbOk = await new Promise<boolean>((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      store.put(state, IDB_RECORD_KEY);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch {
    idbOk = false;
  }

  return localOk || idbOk;
}
