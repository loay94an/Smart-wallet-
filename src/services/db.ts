import { AppState } from '../types';
import { parseAndInspectBackup } from './backupParser';

const DB_NAME = 'SmartWalletDB_v14';
const DB_VERSION = 1;
const STATE_STORE = 'app_state';
const LEGACY_STORAGE_KEY = 'wallet_v14';

export const DEFAULT_RATES: Record<string, number> = {
  SAR: 3.75,
  AED: 3.67,
  EGP: 50.0,
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.79,
  KWD: 0.31,
  QAR: 3.64,
  JOD: 0.71,
  BHD: 0.38,
  OMR: 0.38,
  TND: 3.15,
  MAD: 10.0,
  DZD: 135.0,
};

export function createSecureSyncKey(): string {
  if (!globalThis.crypto?.getRandomValues) {
    throw new Error('يتطلب توليد رمز مزامنة آمن متصفحاً يدعم Web Crypto');
  }
  const bytes = new Uint8Array(32);
  globalThis.crypto.getRandomValues(bytes);
  return 'SW-' + Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

export const INITIAL_STATE: AppState = {
  transactions: [],
  categories: [
    { id: 'cat_food', name: 'طعام ومشتريات', type: 'expense' },
    { id: 'cat_salary', name: 'راتب ودخل', type: 'income' },
    { id: 'cat_transport', name: 'مواصلات وبنزين', type: 'expense' },
    { id: 'cat_bills', name: 'فواتير واشتراكات', type: 'expense' },
    { id: 'cat_freelance', name: 'أعمال حرة', type: 'income' },
    { id: 'cat_shopping', name: 'تسوق وملابس', type: 'expense' },
  ],
  people: [],
  debts: [],
  payments: [],
  workLogs: [],
  workPayments: [],
  workGoals: [],
  budgets: [],
  financialGoals: [],
  notebooks: [],
  standardNotes: [],
  mindMaps: [],
  exchangeRates: { ...DEFAULT_RATES },
  settings: {
    currency: 'ر.س',
    language: 'ar',
    theme: 'purple',
    autoCloudSync: false,
    syncKey: createSecureSyncKey(),
    userEmail: 'loay94an@gmail.com',
  },
  security: {
    enabled: false,
    type: 'off',
    pin: '',
    pattern: [],
  },
  lastUpdated: new Date().toISOString(),
};

class IndexedDBStorage {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private saveQueue: Promise<void> = Promise.resolve();
  public isIndexedDBSupported: boolean = typeof window !== 'undefined' && 'indexedDB' in window;

  private openDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (!this.isIndexedDBSupported) {
        reject(new Error('IndexedDB is not supported in this browser'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STATE_STORE)) {
          db.createObjectStore(STATE_STORE);
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  // Load app state from IndexedDB (with fallback and migration from localStorage)
  async loadState(): Promise<AppState> {
    try {
      if (this.isIndexedDBSupported) {
        const db = await this.openDB();
        const stateFromIDB = await new Promise<AppState | null>((resolve, reject) => {
          const transaction = db.transaction(STATE_STORE, 'readonly');
          const store = transaction.objectStore(STATE_STORE);
          const req = store.get('current_state');

          req.onsuccess = () => {
            resolve(req.result || null);
          };
          req.onerror = () => {
            reject(req.error);
          };
        });

        if (stateFromIDB) {
          // Verify required arrays exist
          return this.sanitizeState(stateFromIDB);
        }
      }
    } catch (err) {
      console.warn('Could not read state from IndexedDB, falling back to localStorage:', err);
    }

    // Check localStorage fallback or legacy data migration
    try {
      const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacyRaw) {
        const parsed = JSON.parse(legacyRaw);
        const migrated = this.sanitizeState({ ...INITIAL_STATE, ...parsed });
        // Save to IndexedDB
        await this.saveState(migrated);
        return migrated;
      }
    } catch (e) {
      console.warn('Error reading legacy localStorage:', e);
    }

    // Default state if nothing found
    const defaultState = this.sanitizeState(INITIAL_STATE);
    await this.saveState(defaultState);
    return defaultState;
  }

  // Save app state to IndexedDB and backup mirror to localStorage
  async saveState(state: AppState): Promise<void> {
    const snapshot: AppState = {
      ...state,
      lastUpdated: new Date().toISOString(),
    };
    const write = async () => {
      if (this.isIndexedDBSupported) {
        const db = await this.openDB();
        await new Promise<void>((resolve, reject) => {
          const transaction = db.transaction(STATE_STORE, 'readwrite');
          transaction.objectStore(STATE_STORE).put(snapshot, 'current_state');
          transaction.oncomplete = () => resolve();
          transaction.onerror = () => reject(transaction.error || new Error('IndexedDB write failed'));
          transaction.onabort = () => reject(transaction.error || new Error('IndexedDB write aborted'));
        });
      }
      // Keep a compatibility mirror only after the primary write succeeds.
      try {
        localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(snapshot));
      } catch (error) {
        console.warn('Local storage mirror unavailable:', error);
      }
    };
    this.saveQueue = this.saveQueue.then(write, write);
    return this.saveQueue;
  }

  // Clear all data
  async clearAll(): Promise<void> {
    try {
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      localStorage.removeItem('currentWorkId');
      localStorage.removeItem('timer_state');
      localStorage.removeItem('wallet_theme');
      localStorage.removeItem('wallet_lang');
    } catch (e) {}

    if (this.isIndexedDBSupported) {
      try {
        const db = await this.openDB();
        await new Promise<void>((resolve, reject) => {
          const transaction = db.transaction(STATE_STORE, 'readwrite');
          const store = transaction.objectStore(STATE_STORE);
          const req = store.clear();
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        });
      } catch (err) {
        console.error('Error clearing IndexedDB:', err);
      }
    }
  }

  // Get storage usage estimate
  async getStorageInfo(): Promise<{ usedBytes: number; quotaBytes: number; isPersisted: boolean }> {
    let usedBytes = 0;
    let quotaBytes = 0;
    let isPersisted = false;

    if (navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        usedBytes = estimate.usage || 0;
        quotaBytes = estimate.quota || 0;
      } catch (e) {}
    }

    if (navigator.storage && navigator.storage.persisted) {
      try {
        isPersisted = await navigator.storage.persisted();
      } catch (e) {}
    }

    return { usedBytes, quotaBytes, isPersisted };
  }

  // Ensure state structure is always complete and valid using universal parser
  public sanitizeState(raw: any): AppState {
    if (!raw) return INITIAL_STATE;
    const parsed = parseAndInspectBackup(raw);
    if (parsed.success && parsed.inspection) {
      return parsed.inspection.state;
    }
    return INITIAL_STATE;
  }
}

export const dbService = new IndexedDBStorage();
