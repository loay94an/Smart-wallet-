/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import {
  AppState,
  Transaction,
  Category,
  Person,
  Debt,
  Payment,
  Work,
  WorkLog,
  WorkPayment,
  WorkGoal,
  Budget,
  FinancialGoal,
  SecurityConfig,
  NotebookNode,
  StandardNote,
  MindMap,
} from './types';
import { dbService, INITIAL_STATE, createSecureSyncKey } from './services/db';
import { cloudSyncService } from './services/cloudSync';
import { Navbar } from './components/Navbar';
import { BottomNav, NavTab } from './components/BottomNav';
import { Dashboard } from './components/Dashboard';
import { WalletPage } from './components/WalletPage';
import { PeoplePage } from './components/PeoplePage';
import { WorkPage } from './components/WorkPage';
import { InfoHubPage } from './components/InfoHubPage';
import { ToolsPage } from './components/ToolsPage';
import { MoreHub } from './components/MoreHub';
import { NotebooksPage } from './components/NotebooksPage';
import { LockScreen } from './components/LockScreen';
import { CloudSyncModal } from './components/CloudSyncModal';
import { ShareModal } from './components/ShareModal';
import { SettingsModal } from './components/SettingsModal';
import { BackupModal } from './components/BackupModal';
import { exportService } from './services/exportService';
import { formatCurrency } from './services/i18n';
import { createPinCredential } from './services/security';

export default function App() {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [hasLoadedState, setHasLoadedState] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [openAddTransactionOnWallet, setOpenAddTransactionOnWallet] = useState(false);
  const [isLocked, setIsLocked] = useState<boolean>(false);

  // Modals
  const [isSyncModalOpen, setIsSyncModalOpen] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState<boolean>(false);
  const [backupInitialTab, setBackupInitialTab] = useState<'export' | 'import'>('export');

  // Load from IndexedDB on startup
  useEffect(() => {
    async function initApp() {
      try {
        let loaded = await dbService.loadState();
        // Replace short legacy sync tokens; do not auto-upload to an old insecure cloud key.
        if ((loaded.settings?.syncKey || '').length < 40) {
          loaded = {
            ...loaded,
            settings: { ...loaded.settings, syncKey: createSecureSyncKey(), autoCloudSync: false },
          };
        }
        // One-time migration: replace legacy plaintext PIN with a salted PBKDF2 hash.
        if (loaded.security?.pin && !loaded.security.pinHash) {
          const credential = await createPinCredential(loaded.security.pin).catch(() => null);
          if (credential) {
            loaded = { ...loaded, security: { ...loaded.security, ...credential } };
            await dbService.saveState(loaded);
          }
        }
        setState(loaded);
        setHasLoadedState(true);
        if (loaded.security && loaded.security.enabled && loaded.security.type !== 'off') {
          setIsLocked(true);
        }
      } catch (err: any) {
        console.error('Failed to load state from IndexedDB:', err);
        setLoadError(err?.message || 'تعذر قراءة بيانات المحفظة المحفوظة');
      } finally {
        setIsLoaded(true);
      }
    }
    initApp();
  }, []);

  // Persist changes without serializing large wallet data on every keystroke.
  // Flush immediately when Android backgrounds the WebView or the page is being closed.
  useEffect(() => {
    if (!isLoaded || !hasLoadedState) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    const persist = () => {
      if (timer) clearTimeout(timer);
      timer = undefined;
      dbService.saveState(state).catch((err) => {
        console.error('تعذر حفظ بيانات المحفظة:', err);
      });
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') persist();
    };
    const onPageHide = () => persist();

    timer = setTimeout(persist, 650);
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pagehide', onPageHide);

    return () => {
      if (timer) clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pagehide', onPageHide);
    };
  }, [state, isLoaded, hasLoadedState]);

  // Apply the selected color palette and light/dark appearance.
  useEffect(() => {
    const root = document.documentElement;
    const lang = state.settings?.language || 'ar';
    root.lang = lang;
    root.dir = lang === 'ar' ? 'rtl' : 'ltr';

    const paletteAliases: Record<string, string> = { purple: 'mono', blue: 'ocean', green: 'emerald', red: 'rose', orange: 'amber', pink: 'rose' };
    const requestedPalette = state.settings?.theme || 'mono';
    const palette = paletteAliases[requestedPalette] || requestedPalette;
    const allowedPalettes = ['navy-emerald', 'mono', 'ocean', 'emerald', 'violet', 'amber', 'rose'];
    root.dataset.themePalette = allowedPalettes.includes(palette) ? palette : 'mono';
    const isDark = state.settings?.appearance === 'dark';
    root.dataset.themeMode = isDark ? 'dark' : 'light';
    if (Capacitor.isNativePlatform()) {
      StatusBar.setBackgroundColor({ color: isDark ? '#0B1120' : '#F8FAFC' }).catch(() => undefined);
      StatusBar.setStyle({ style: isDark ? Style.Light : Style.Dark }).catch(() => undefined);
    }
  }, [state.settings?.language, state.settings?.theme, state.settings?.appearance]);

  // Auto-sync is deliberately debounced: encrypting the full wallet uses PBKDF2
  // and must not run repeatedly while the user is actively editing records.
  useEffect(() => {
    if (!isLoaded || !state.settings?.autoCloudSync || !state.settings.syncKey) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (cancelled || document.visibilityState === 'hidden') return;
      cloudSyncService.pushToCloud(
        state.settings.syncKey,
        state,
        undefined,
        state.settings.syncServerUrl
      ).catch((error) => console.warn('Auto cloud sync failed:', error));
    }, 30000);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [state, isLoaded]);

  // State Mutators
  const handleSaveTransaction = (tx: Transaction) => {
    setState((prev) => {
      const idx = prev.transactions.findIndex((t) => t.id === tx.id);
      let updated: Transaction[];
      if (idx >= 0) {
        updated = [...prev.transactions];
        updated[idx] = tx;
      } else {
        updated = [tx, ...prev.transactions];
      }
      return { ...prev, transactions: updated };
    });
  };

  const handleDeleteTransaction = (id: string) => {
    setState((prev) => ({
      ...prev,
      transactions: prev.transactions.filter((t) => t.id !== id),
    }));
  };

  const handleAddCategory = (cat: Omit<Category, 'id'>): string => {
    const newCat: Category = {
      id: 'cat_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      ...cat,
    };
    setState((prev) => ({
      ...prev,
      categories: [...prev.categories, newCat],
    }));
    return newCat.id;
  };

  const handleDeleteCategory = (id: string) => {
    setState((prev) => ({
      ...prev,
      categories: prev.categories.filter((c) => c.id !== id),
    }));
  };

  // People & Debts Mutators
  const handleSavePerson = (person: Person) => {
    setState((prev) => {
      const idx = prev.people.findIndex((p) => p.id === person.id);
      let updated: Person[];
      if (idx >= 0) {
        updated = [...prev.people];
        updated[idx] = person;
      } else {
        updated = [...prev.people, person];
      }
      return { ...prev, people: updated };
    });
  };

  const handleDeletePerson = (id: string) => {
    setState((prev) => {
      const debtIdsToRemove = prev.debts.filter((d) => d.personId === id).map((d) => d.id);
      return {
        ...prev,
        people: prev.people.filter((p) => p.id !== id),
        debts: prev.debts.filter((d) => d.personId !== id),
        payments: prev.payments.filter((p) => !debtIdsToRemove.includes(p.debtId)),
      };
    });
  };

  const handleSaveDebt = (debt: Debt) => {
    setState((prev) => {
      const idx = prev.debts.findIndex((d) => d.id === debt.id);
      let updated: Debt[];
      if (idx >= 0) {
        updated = [...prev.debts];
        updated[idx] = debt;
      } else {
        updated = [debt, ...prev.debts];
      }
      return { ...prev, debts: updated };
    });
  };

  const handleDeleteDebt = (id: string) => {
    setState((prev) => ({
      ...prev,
      debts: prev.debts.filter((d) => d.id !== id),
      payments: prev.payments.filter((p) => p.debtId !== id),
    }));
  };

  const handleSavePayment = (pmt: Payment) => {
    setState((prev) => {
      const idx = prev.payments.findIndex((p) => p.id === pmt.id);
      let updated: Payment[];
      if (idx >= 0) {
        updated = [...prev.payments];
        updated[idx] = pmt;
      } else {
        updated = [pmt, ...prev.payments];
      }
      return { ...prev, payments: updated };
    });
  };

  const handleDeletePayment = (id: string) => {
    setState((prev) => ({
      ...prev,
      payments: prev.payments.filter((p) => p.id !== id),
    }));
  };

  // Persist work timer checkpoints immediately to IndexedDB, not only after the
  // general debounced app-state save. This survives Android process termination.
  const handleSaveWorkTimers = (workTimers: NonNullable<AppState['workTimers']>) => {
    const nextState = { ...state, workTimers };
    setState(nextState);
    dbService.saveState(nextState).catch((err) => {
      console.error('تعذر حفظ مؤقت العمل:', err);
    });
  };

  // Work Mutators
  const handleSaveWork = (work: Work) => {
    setState((prev) => {
      const idx = prev.works.findIndex((w) => w.id === work.id);
      let updated: Work[];
      if (idx >= 0) {
        updated = [...prev.works];
        updated[idx] = work;
      } else {
        updated = [...prev.works, work];
      }
      return { ...prev, works: updated };
    });
  };

  const handleDeleteWork = (id: string) => {
    setState((prev) => ({
      ...prev,
      works: prev.works.filter((w) => w.id !== id),
      workLogs: prev.workLogs.filter((l) => l.workId !== id),
      workPayments: prev.workPayments.filter((p) => p.workId !== id),
      workGoals: prev.workGoals.filter((g) => g.workId !== id),
    }));
  };

  const handleSaveWorkLog = (log: WorkLog) => {
    setState((prev) => {
      const idx = prev.workLogs.findIndex((l) => l.id === log.id);
      let updated: WorkLog[];
      if (idx >= 0) {
        updated = [...prev.workLogs];
        updated[idx] = log;
      } else {
        updated = [log, ...prev.workLogs];
      }
      return { ...prev, workLogs: updated };
    });
  };

  const handleDeleteWorkLog = (id: string) => {
    setState((prev) => ({
      ...prev,
      workLogs: prev.workLogs.filter((l) => l.id !== id),
    }));
  };

  const handleSaveWorkPayment = (pmt: WorkPayment) => {
    setState((prev) => {
      const idx = prev.workPayments.findIndex((p) => p.id === pmt.id);
      if (idx >= 0) {
        const updated = [...prev.workPayments];
        updated[idx] = pmt;
        return {
          ...prev,
          workPayments: updated,
        };
      } else {
        // Also register as an income transaction in main wallet for new payments
        const incCat = prev.categories.find((c) => c.type === 'income');
        const newTx: Transaction = {
          id: 'tx_work_' + Date.now().toString(36),
          date: pmt.date,
          type: 'income',
          category: incCat?.id || prev.categories[0]?.id || 'cat_salary',
          amount: pmt.amount,
          desc: pmt.desc,
        };

        return {
          ...prev,
          workPayments: [pmt, ...prev.workPayments],
          transactions: [newTx, ...prev.transactions],
        };
      }
    });
  };

  const handleDeleteWorkPayment = (id: string) => {
    setState((prev) => ({
      ...prev,
      workPayments: prev.workPayments.filter((p) => p.id !== id),
    }));
  };

  const handleSaveWorkGoal = (goal: WorkGoal) => {
    setState((prev) => {
      const idx = prev.workGoals.findIndex((g) => g.id === goal.id);
      let updated: WorkGoal[];
      if (idx >= 0) {
        updated = [...prev.workGoals];
        updated[idx] = goal;
      } else {
        updated = [...prev.workGoals, goal];
      }
      return { ...prev, workGoals: updated };
    });
  };

  const handleDeleteWorkGoal = (id: string) => {
    setState((prev) => ({
      ...prev,
      workGoals: prev.workGoals.filter((g) => g.id !== id),
    }));
  };

  // Info Hub Mutators
  const handleSaveBudget = (budget: Budget) => {
    setState((prev) => {
      const filtered = prev.budgets.filter((b) => b.categoryId !== budget.categoryId);
      return {
        ...prev,
        budgets: [...filtered, budget],
      };
    });
  };

  const handleDeleteBudget = (id: string) => {
    setState((prev) => ({
      ...prev,
      budgets: prev.budgets.filter((b) => b.id !== id),
    }));
  };

  const handleSaveFinancialGoal = (goal: FinancialGoal) => {
    setState((prev) => {
      const idx = prev.financialGoals.findIndex((g) => g.id === goal.id);
      let updated: FinancialGoal[];
      if (idx >= 0) {
        updated = [...prev.financialGoals];
        updated[idx] = goal;
      } else {
        updated = [...prev.financialGoals, goal];
      }
      return { ...prev, financialGoals: updated };
    });
  };

  const handleDeleteFinancialGoal = (id: string) => {
    setState((prev) => ({
      ...prev,
      financialGoals: prev.financialGoals.filter((g) => g.id !== id),
    }));
  };

  const handleAddAmountToGoal = (goalId: string, amount: number) => {
    setState((prev) => ({
      ...prev,
      financialGoals: prev.financialGoals.map((g) => {
        if (g.id === goalId) {
          return { ...g, savedAmount: (g.savedAmount || 0) + amount };
        }
        return g;
      }),
    }));
  };

  const handleSaveNotebooks = (notebooks: NotebookNode[]) => {
    setState((prev) => ({
      ...prev,
      notebooks,
    }));
  };

  const handleSaveStandardNotes = (standardNotes: StandardNote[]) => {
    setState((prev) => ({
      ...prev,
      standardNotes,
    }));
  };

  const handleSaveMindMaps = (mindMaps: MindMap[]) => {
    setState((prev) => ({
      ...prev,
      mindMaps,
    }));
  };

  // Exchange rates
  const handleUpdateExchangeRates = (rates: Record<string, number>) => {
    setState((prev) => ({
      ...prev,
      exchangeRates: { ...prev.exchangeRates, ...rates },
    }));
  };

  // Settings & Security
  const handleUpdateSettings = (newSettings: Partial<AppState['settings']>) => {
    setState((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...newSettings },
    }));
  };

  const handleUpdateSecurity = (newSecurity: SecurityConfig) => {
    setState((prev) => ({
      ...prev,
      security: newSecurity,
    }));
  };

  const handleApplyCloudState = async (rawState: any) => {
    try {
      const cleanState = dbService.sanitizeState(rawState);
      await dbService.saveState(cleanState);
      setState(cleanState);
    } catch (e: any) {
      console.error('Error applying cloud state:', e);
    }
  };

  const [importNotification, setImportNotification] = useState<string | null>(null);

  const handleApplyBackup = async (newState: AppState, isMerged: boolean) => {
    try {
      await dbService.saveState(newState);
      setState(newState);
      const msg = isMerged
        ? (lang === 'ar' ? '✅ تم دمج النسخة الاحتياطية بنجاح!' : '✅ Backup merged successfully!')
        : (lang === 'ar' ? '✅ تم استيراد وتطبيق النسخة الاحتياطية بنجاح!' : '✅ Backup imported and applied successfully!');
      setImportNotification(msg);
      setTimeout(() => setImportNotification(null), 3500);
    } catch (e: any) {
      setImportNotification(lang === 'ar' ? '❌ حدث خطأ: ' + e.message : 'Error: ' + e.message);
      setTimeout(() => setImportNotification(null), 4000);
    }
  };

  const handleImportFullState = async (rawState: any) => {
    try {
      const cleanState = dbService.sanitizeState(rawState);
      await dbService.saveState(cleanState);
      setState(cleanState);
      setImportNotification(lang === 'ar' ? '✅ تم استيراد النسخة الاحتياطية بنجاح!' : '✅ Backup imported successfully!');
      setTimeout(() => setImportNotification(null), 3500);
    } catch (e: any) {
      setImportNotification(lang === 'ar' ? '❌ حدث خطأ أثناء استيراد البيانات: ' + e.message : 'Error: ' + e.message);
      setTimeout(() => setImportNotification(null), 4000);
    }
  };

  const handleResetAllData = async () => {
    try {
      await dbService.clearAll();
      setState(INITIAL_STATE);
      setImportNotification(lang === 'ar' ? '🔄 تم مسح كافة البيانات وإعادة الضبط' : '🔄 All data reset to defaults');
      setTimeout(() => setImportNotification(null), 3500);
    } catch (e) {
      console.error('Error resetting data:', e);
    }
  };

  if (!isLoaded) {
    return (
      <div className="app-shell flex min-h-screen items-center justify-center text-[var(--accent)]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
          <span className="text-sm font-bold">جاري تشغيل قاعدة البيانات IndexedDB...</span>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="app-shell min-h-screen flex items-center justify-center p-6 text-center text-[var(--text-primary)]" dir="rtl">
        <div className="max-w-lg rounded-2xl border border-red-500/30 bg-[var(--surface)] p-6 shadow-xl">
          <h1 className="text-lg font-black text-red-300">تعذر فتح بيانات المحفظة</h1>
          <p className="mt-3 text-sm leading-7 text-purple-100">{loadError}</p>
          <p className="mt-3 text-xs leading-6 text-purple-300">لم يتم حفظ بيانات فارغة فوق البيانات السابقة. لا تمسح بيانات المتصفح. احتفظ بملف قاعدة البيانات وجرّب استعادة نسخة احتياطية بعد معالجة سبب الخطأ.</p>
          <button type="button" onClick={() => window.location.reload()} className="mt-5 rounded-xl bg-purple-600 px-5 py-2 text-sm font-bold">إعادة المحاولة</button>
        </div>
      </div>
    );
  }

  const lang = state.settings?.language || 'ar';

  return (
    <div className="app-shell min-h-screen flex flex-col selection:bg-[var(--accent)] selection:text-white">
      {/* Lock screen overlay if enabled and locked */}
      {isLocked && state.security.enabled && (
        <LockScreen
          security={state.security}
          onUnlock={() => setIsLocked(false)}
          language={lang}
        />
      )}

      {/* Main Top Header */}
      <Navbar
        onOpenSync={() => setIsSyncModalOpen(true)}
        onOpenShare={() => setIsShareModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenBackup={() => { setBackupInitialTab('export'); setIsBackupModalOpen(true); }}
        onOpenImport={() => { setBackupInitialTab('import'); setIsBackupModalOpen(true); }}
        onOpenTools={() => setActiveTab('tools')}
        onExportExcel={() => exportService.exportFullWorkbookToExcel(state, lang === 'ar')}
        onExportPDF={() => exportService.exportFullReportToPDF(state, lang === 'ar')}
        onLockApp={() => setIsLocked(true)}
        isSecurityEnabled={Boolean(state.security?.enabled && state.security.type !== 'off')}
        isIndexedDB={dbService.isIndexedDBSupported}
        language={lang}
      />

      {/* Content Container */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-3 sm:px-6">
        {activeTab === 'dashboard' && (
          <Dashboard
            state={state}
            onNavigate={(tab) => setActiveTab(tab)}
            onOpenAddTransaction={() => { setOpenAddTransactionOnWallet(true); setActiveTab('wallet'); }}
            onOpenAddPerson={() => setActiveTab('people')}
            onOpenAddWork={() => setActiveTab('work')}
            language={lang}
          />
        )}

        {activeTab === 'wallet' && (
          <WalletPage
            state={state}
            openAddTransactionOnMount={openAddTransactionOnWallet}
            onSaveTransaction={handleSaveTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            onAddCategory={handleAddCategory}
            onDeleteCategory={handleDeleteCategory}
            onPromptBudget={(_catId) => setActiveTab('info')}
            language={lang}
          />
        )}

        {activeTab === 'people' && (
          <PeoplePage
            state={state}
            onSavePerson={handleSavePerson}
            onDeletePerson={handleDeletePerson}
            onSaveDebt={handleSaveDebt}
            onDeleteDebt={handleDeleteDebt}
            onSavePayment={handleSavePayment}
            onDeletePayment={handleDeletePayment}
            language={lang}
          />
        )}

        {activeTab === 'work' && (
          <WorkPage
            state={state}
            onSaveWork={handleSaveWork}
            onDeleteWork={handleDeleteWork}
            onSaveWorkLog={handleSaveWorkLog}
            onDeleteWorkLog={handleDeleteWorkLog}
            onSaveWorkPayment={handleSaveWorkPayment}
            onDeleteWorkPayment={handleDeleteWorkPayment}
            onSaveWorkGoal={handleSaveWorkGoal}
            onDeleteWorkGoal={handleDeleteWorkGoal}
            onSaveWorkTimers={handleSaveWorkTimers}
            language={lang}
          />
        )}

        {activeTab === 'info' && (
          <InfoHubPage
            state={state}
            onSaveBudget={handleSaveBudget}
            onDeleteBudget={handleDeleteBudget}
            onSaveFinancialGoal={handleSaveFinancialGoal}
            onDeleteFinancialGoal={handleDeleteFinancialGoal}
            onAddAmountToGoal={handleAddAmountToGoal}
            language={lang}
          />
        )}

        {activeTab === 'more' && (
          <MoreHub
            onOpenBudget={() => setActiveTab('info')}
            onOpenTools={() => setActiveTab('tools')}
            language={lang}
          />
        )}

        {activeTab === 'tools' && (
          <ToolsPage
            state={state}
            onUpdateExchangeRates={handleUpdateExchangeRates}
            onSaveNotebooks={handleSaveNotebooks}
            onSaveStandardNotes={handleSaveStandardNotes}
            onSaveMindMaps={handleSaveMindMaps}
            language={lang}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={(tab) => { setOpenAddTransactionOnWallet(false); setActiveTab(tab); }}
        language={lang}
      />

      {/* Cloud Sync Modal */}
      <CloudSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        state={state}
        onApplyCloudState={handleApplyCloudState}
        onUpdateSyncKey={(newKey) => handleUpdateSettings({ syncKey: newKey })}
        onUpdateSyncServerUrl={(url) => handleUpdateSettings({ syncServerUrl: url })}
        language={lang}
      />

      {/* Share / Social Modal (WhatsApp / Telegram / Email) */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        state={state}
        onOpenBackupCenter={() => setIsBackupModalOpen(true)}
        language={lang}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        state={state}
        onUpdateSettings={handleUpdateSettings}
        onUpdateSecurity={handleUpdateSecurity}
        language={lang}
      />

      {/* Comprehensive Backup & Import Center Modal */}
      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        state={state}
        onApplyBackup={handleApplyBackup}
        initialTab={backupInitialTab}
        language={lang}
      />

      {/* Floating notification toast */}
      {importNotification && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 rounded-2xl border border-emerald-500/40 bg-[#14142d] px-5 py-3 text-xs font-black text-emerald-300 shadow-2xl backdrop-blur-md animate-fadeIn">
          {importNotification}
        </div>
      )}
    </div>
  );
}
