/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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
import { dbService, INITIAL_STATE } from './services/db';
import { cloudSyncService } from './services/cloudSync';
import { Navbar } from './components/Navbar';
import { BottomNav, NavTab } from './components/BottomNav';
import { Dashboard } from './components/Dashboard';
import { WalletPage } from './components/WalletPage';
import { PeoplePage } from './components/PeoplePage';
import { WorkPage } from './components/WorkPage';
import { InfoHubPage } from './components/InfoHubPage';
import { ToolsPage } from './components/ToolsPage';
import { NotebooksPage } from './components/NotebooksPage';
import { LockScreen } from './components/LockScreen';
import { CloudSyncModal } from './components/CloudSyncModal';
import { ShareModal } from './components/ShareModal';
import { SettingsModal } from './components/SettingsModal';
import { BackupModal } from './components/BackupModal';
import { exportService } from './services/exportService';
import { formatCurrency } from './services/i18n';

export default function App() {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isLocked, setIsLocked] = useState<boolean>(false);

  // Modals
  const [isSyncModalOpen, setIsSyncModalOpen] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState<boolean>(false);

  // Load from IndexedDB on startup
  useEffect(() => {
    async function initApp() {
      try {
        const loaded = await dbService.loadState();
        setState(loaded);
        if (loaded.security && loaded.security.enabled && loaded.security.type !== 'off') {
          setIsLocked(true);
        }
      } catch (err) {
        console.error('Failed to load state from IndexedDB:', err);
      } finally {
        setIsLoaded(true);
      }
    }
    initApp();
  }, []);

  // Sync to IndexedDB whenever state changes
  useEffect(() => {
    if (isLoaded) {
      dbService.saveState(state);
    }
  }, [state, isLoaded]);

  // Apply theme and direction
  useEffect(() => {
    const lang = state.settings?.language || 'ar';
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

    const themeColors: Record<string, string> = {
      purple: '#7c3aed',
      blue: '#2563eb',
      green: '#059669',
      red: '#dc2626',
      orange: '#ea580c',
      pink: '#db2777',
    };

    const theme = state.settings?.theme || 'purple';
    const primary = themeColors[theme] || '#7c3aed';
    document.documentElement.style.setProperty('--primary-theme', primary);
  }, [state.settings?.language, state.settings?.theme]);

  // Auto Cloud Sync if enabled
  useEffect(() => {
    if (isLoaded && state.settings?.autoCloudSync && state.settings.syncKey) {
      const timer = setTimeout(() => {
        cloudSyncService.pushToCloud(state.settings.syncKey, state);
      }, 5000);
      return () => clearTimeout(timer);
    }
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

  const handleAddCategory = (cat: Omit<Category, 'id'>) => {
    const newCat: Category = {
      id: 'cat_' + Date.now().toString(36),
      ...cat,
    };
    setState((prev) => ({
      ...prev,
      categories: [...prev.categories, newCat],
    }));
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
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a1a] text-purple-400">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
          <span className="text-sm font-bold">جاري تشغيل قاعدة البيانات IndexedDB...</span>
        </div>
      </div>
    );
  }

  const lang = state.settings?.language || 'ar';

  return (
    <div className="min-h-screen bg-[#0a0a1a] text-[#e8e8ff] flex flex-col selection:bg-purple-600 selection:text-white">
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
        onOpenBackup={() => setIsBackupModalOpen(true)}
        onOpenTools={() => setActiveTab('tools')}
        onExportExcel={() => exportService.exportFullWorkbookToExcel(state, lang === 'ar')}
        onExportPDF={() => {
          const cur = state.settings.currency || 'ر.س';
          const items = state.transactions.slice(0, 20).map((t) => ({
            title: t.desc || t.category,
            subtitle: new Date(t.date).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US'),
            amount: (t.type === 'income' ? '+' : '-') + formatCurrency(t.amount, cur),
          }));
          const totalInc = state.transactions.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
          const totalExp = state.transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);

          exportService.exportSectionReportPDF(
            lang === 'ar' ? 'تقرير المحفظة المالية العام' : 'Complete Wallet Financial Report',
            state,
            items,
            [
              { label: lang === 'ar' ? 'إجمالي الدخل' : 'Total Income', value: formatCurrency(totalInc, cur) },
              { label: lang === 'ar' ? 'إجمالي المصروفات' : 'Total Expense', value: formatCurrency(totalExp, cur) },
              { label: lang === 'ar' ? 'الرصيد الصافي' : 'Net Balance', value: formatCurrency(totalInc - totalExp, cur) },
            ],
            lang === 'ar'
          );
        }}
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
            onOpenAddTransaction={() => setActiveTab('wallet')}
            onOpenAddPerson={() => setActiveTab('people')}
            onOpenAddWork={() => setActiveTab('work')}
            language={lang}
          />
        )}

        {activeTab === 'wallet' && (
          <WalletPage
            state={state}
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
        onTabChange={(tab) => setActiveTab(tab)}
        language={lang}
      />

      {/* Cloud Sync Modal */}
      <CloudSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        state={state}
        onApplyCloudState={handleApplyCloudState}
        onUpdateSyncKey={(newKey) => handleUpdateSettings({ syncKey: newKey })}
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
        onImportFullState={handleImportFullState}
        onResetAllData={handleResetAllData}
        onOpenBackupCenter={() => setIsBackupModalOpen(true)}
        language={lang}
      />

      {/* Comprehensive Backup & Import Center Modal */}
      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        state={state}
        onApplyBackup={handleApplyBackup}
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
