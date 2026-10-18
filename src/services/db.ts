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

export const INITIAL_STATE: AppState = {
  transactions: [
    {
      id: 'tx_init_1',
      date: new Date(Date.now() - 86400000 * 2).toISOString(),
      type: 'income',
      category: 'cat_salary',
      amount: 4500,
      desc: 'راتب شهري',
    },
    {
      id: 'tx_init_2',
      date: new Date(Date.now() - 86400000).toISOString(),
      type: 'expense',
      category: 'cat_food',
      amount: 230,
      desc: 'مشتريات بقالة وتموينات',
    },
    {
      id: 'tx_init_3',
      date: new Date().toISOString(),
      type: 'expense',
      category: 'cat_transport',
      amount: 85,
      desc: 'وقود ومواصلات',
    },
  ],
  categories: [
    { id: 'cat_food', name: 'طعام ومشتريات', type: 'expense' },
    { id: 'cat_salary', name: 'راتب ودخل', type: 'income' },
    { id: 'cat_transport', name: 'مواصلات وبنزين', type: 'expense' },
    { id: 'cat_bills', name: 'فواتير واشتراكات', type: 'expense' },
    { id: 'cat_freelance', name: 'أعمال حرة', type: 'income' },
    { id: 'cat_shopping', name: 'تسوق وملابس', type: 'expense' },
  ],
  people: [
    {
      id: 'p_1',
      name: 'أحمد محمود',
      phone: '+966501234567',
      email: 'ahmed@example.com',
      notes: 'شريك عمل',
    },
    {
      id: 'p_2',
      name: 'خالد العمري',
      phone: '+966559876543',
      email: 'khaled@example.com',
      notes: 'مكتب التصميم',
    },
  ],
  debts: [
    {
      id: 'd_1',
      personId: 'p_1',
      type: 'receivable', // مستحق لك
      amount: 1200,
      desc: 'سلفة مشروع التطوير',
      date: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
    {
      id: 'd_2',
      personId: 'p_2',
      type: 'debt', // دين عليك
      amount: 400,
      desc: 'أتعاب تصميم شعار',
      date: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
  ],
  payments: [],
  works: [
    {
      id: 'w_1',
      name: 'تطوير موقع التجارة الإلكترونية',
      client: 'شركة التقنية الحديثة',
      calculationType: 'hourly',
      rate: 75,
      unitName: 'ساعة',
      status: 'active',
      startDate: new Date(Date.now() - 86400000 * 10).toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 86400000 * 15).toISOString().slice(0, 10),
      desc: 'بناء متجر رقمي متكامل',
    },
    {
      id: 'w_2',
      name: 'إنتاج محتوى وتصاميم سوشيال',
      client: 'متجر الزهور',
      calculationType: 'piece',
      rate: 35,
      unitName: 'تصميم',
      status: 'active',
      startDate: new Date(Date.now() - 86400000 * 7).toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 86400000 * 20).toISOString().slice(0, 10),
      desc: 'تصميم بوستات انستغرام وبانرات',
    },
  ],
  workLogs: [
    {
      id: 'wl_1',
      workId: 'w_1',
      date: new Date(Date.now() - 86400000 * 2).toISOString().slice(0, 10),
      start: '09:00',
      end: '14:00',
      hours: 5,
      quantity: 0,
      desc: 'تصميم واجهة المستخدم وسلة المشتريات',
    },
    {
      id: 'wl_2',
      workId: 'w_2',
      date: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
      start: '10:00',
      end: '13:00',
      hours: 3,
      quantity: 8,
      desc: 'إنجاز 8 تصاميم للمنتجات الجديدة',
    },
  ],
  workPayments: [
    {
      id: 'wp_1',
      workId: 'w_1',
      type: 'payment',
      amount: 200,
      date: new Date().toISOString(),
      method: 'bank',
      desc: 'دفعة مقدمة للمشروع',
    },
  ],
  workGoals: [
    {
      id: 'wg_1',
      workId: 'w_2',
      type: 'weekly',
      target: 25,
    },
  ],
  budgets: [
    {
      id: 'b_1',
      categoryId: 'cat_food',
      categoryName: 'طعام ومشتريات',
      amount: 1200,
    },
    {
      id: 'b_2',
      categoryId: 'cat_transport',
      categoryName: 'مواصلات وبنزين',
      amount: 400,
    },
  ],
  financialGoals: [
    {
      id: 'fg_1',
      name: 'صندوق الطوارئ',
      target: 10000,
      savedAmount: 3200,
      deadline: new Date(Date.now() + 86400000 * 180).toISOString().slice(0, 10),
      icon: '🛡️',
    },
    {
      id: 'fg_2',
      name: 'شراء حاسوب جديد للعمل',
      target: 6500,
      savedAmount: 2800,
      deadline: new Date(Date.now() + 86400000 * 60).toISOString().slice(0, 10),
      icon: '💻',
    },
  ],
  notebooks: [
    {
      id: 'nb_1',
      title: 'العمل',
      icon: '💼',
      children: [
        {
          id: 'nb_1_1',
          title: 'مشروع موقع شركة ABC',
          icon: '📌',
          children: [
            {
              id: 'nb_1_1_1',
              title: '5 أكتوبر - 50 قطعة',
              icon: '📅',
              date: '2026-10-05',
              amount: 2500,
              children: [
                { id: 'nb_1_1_1_1', title: 'اجتماع مع العميل', icon: '📝', date: '2026-10-04', children: [] },
                { id: 'nb_1_1_1_2', title: 'تسليم المرحلة الأولى', icon: '📝', date: '2026-10-05', children: [] },
              ],
            },
            {
              id: 'nb_1_1_2',
              title: '7 أكتوبر - 10 قطع',
              icon: '📅',
              date: '2026-10-07',
              amount: 500,
              children: [
                { id: 'nb_1_1_2_1', title: 'عمل صباحي', icon: '📝', children: [] },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'nb_2',
      title: 'المالية والتخطيط',
      icon: '💰',
      children: [
        {
          id: 'nb_2_1',
          title: 'الميزانية الشهرية',
          icon: '📌',
          children: [
            { id: 'nb_2_1_1', title: 'يناير - دخل: 10,000 / مصروف: 7,000', icon: '💵', amount: 3000, children: [] },
            { id: 'nb_2_1_2', title: 'فبراير - دخل: 12,000 / مصروف: 8,000', icon: '💵', amount: 4000, children: [] },
          ],
        },
      ],
    },
  ],
  standardNotes: [
    {
      id: 'sn_1',
      title: 'أفكار لتطوير التطبيق',
      content: 'إضافة وضع الليل، وتصدير التقارير بصيغة PDF، وتحسين أداء البحث.',
      date: '2026-10-10',
      category: 'تطوير',
      tags: ['برمجة', 'أفكار'],
    },
    {
      id: 'sn_2',
      title: 'قائمة مهام الأسبوع',
      content: '1. مراجعة الحسابات الشهرية\n2. اجتماع مع فريق التصميم\n3. إنهاء توثيق المشروع الجديد',
      date: '2026-10-12',
      category: 'مهام',
      tags: ['عاجل', 'عمل'],
    },
  ],
  mindMaps: [
    {
      id: 'mm_1',
      title: 'خريطة مشروع التطبيق الشامل',
      date: '2026-10-14',
      root: {
        id: 'root_1',
        title: 'المشروع الرئيسي',
        color: 'indigo',
        children: [
          {
            id: 'node_1',
            title: 'الواجهة الأمامية',
            color: 'blue',
            children: [
              { id: 'node_1_1', title: 'تصميم الصفحات', color: 'cyan' },
              { id: 'node_1_2', title: 'إدارة الحالة', color: 'cyan' },
            ],
          },
          {
            id: 'node_2',
            title: 'قاعدة البيانات والتخزين',
            color: 'emerald',
            children: [
              { id: 'node_2_1', title: 'IndexedDB', color: 'green' },
              { id: 'node_2_2', title: 'النسخ الاحتياطي', color: 'green' },
            ],
          },
          {
            id: 'node_3',
            title: 'التسويق والنشر',
            color: 'purple',
            children: [
              { id: 'node_3_1', title: 'إطلاق النسخة التجريبية', color: 'violet' },
            ],
          },
        ],
      },
    },
  ],
  exchangeRates: { ...DEFAULT_RATES },
  settings: {
    currency: 'ر.س',
    language: 'ar',
    theme: 'purple',
    autoCloudSync: false,
    syncKey: 'WALLET-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
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
    const updatedState = {
      ...state,
      lastUpdated: new Date().toISOString(),
    };

    // Mirror to localStorage as instant sync fallback
    try {
      localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(updatedState));
    } catch (e) {
      // Storage quota or private mode
    }

    if (!this.isIndexedDBSupported) return;

    try {
      const db = await this.openDB();
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(STATE_STORE, 'readwrite');
        const store = transaction.objectStore(STATE_STORE);
        const req = store.put(updatedState, 'current_state');

        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.error('Error saving state to IndexedDB:', err);
    }
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
