import React, { useState } from 'react';
import { AppState, Budget, FinancialGoal } from '../types';
import { formatCurrency } from '../services/i18n';
import { ConfirmModal } from './ConfirmModal';
import { exportService } from '../services/exportService';
import {
  PieChart,
  Target,
  Flag,
  FileBarChart,
  Plus,
  Trash2,
  Edit2,
  FileSpreadsheet,
  FileText,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Calendar,
  X,
  CheckCircle2,
  MoreVertical,
} from 'lucide-react';

interface InfoHubPageProps {
  state: AppState;
  onSaveBudget: (budget: Budget) => void;
  onDeleteBudget: (id: string) => void;
  onSaveFinancialGoal: (goal: FinancialGoal) => void;
  onDeleteFinancialGoal: (id: string) => void;
  onAddAmountToGoal: (goalId: string, amount: number) => void;
  language: 'ar' | 'en';
}

export const InfoHubPage: React.FC<InfoHubPageProps> = ({
  state,
  onSaveBudget,
  onDeleteBudget,
  onSaveFinancialGoal,
  onDeleteFinancialGoal,
  onAddAmountToGoal,
  language,
}) => {
  const isRTL = language === 'ar';
  const cur = state.settings.currency || 'ر.س';

  const [activeSubTab, setActiveSubTab] = useState<'budget' | 'goals' | 'reports' | 'categories'>('budget');
  const [isExportMenuOpen, setIsExportMenuOpen] = useState<boolean>(false);

  // Confirmation Modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Budget Modal & Editing
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState<boolean>(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [budgetCatId, setBudgetCatId] = useState<string>('');
  const [budgetAmount, setBudgetAmount] = useState<string>('');

  // Financial Goal Modal & Editing
  const [isGoalModalOpen, setIsGoalModalOpen] = useState<boolean>(false);
  const [editingGoal, setEditingGoal] = useState<FinancialGoal | null>(null);
  const [goalName, setGoalName] = useState<string>('');
  const [goalTarget, setGoalTarget] = useState<string>('');
  const [goalSaved, setGoalSaved] = useState<string>('0');
  const [goalDeadline, setGoalDeadline] = useState<string>('');
  const [goalIcon, setGoalIcon] = useState<string>('🎯');

  // Quick Add Savings Modal
  const [isAddSavingsModalOpen, setIsAddSavingsModalOpen] = useState<boolean>(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string>('');
  const [savingsInput, setSavingsInput] = useState<string>('');

  // Current month transactions for budget calculations
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const currentDay = now.getDate();

  const currentMonthTx = state.transactions.filter((t) => {
    const d = new Date(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const getMonthlySpentForCat = (catId: string) => {
    return currentMonthTx
      .filter((t) => t.type === 'expense' && t.category === catId)
      .reduce((s, t) => s + Number(t.amount), 0);
  };

  const openNewBudgetModal = () => {
    setEditingBudget(null);
    const firstExpenseCat = state.categories.find((c) => c.type === 'expense') || state.categories[0];
    setBudgetCatId(firstExpenseCat ? firstExpenseCat.id : '');
    setBudgetAmount('');
    setIsBudgetModalOpen(true);
  };

  const openEditBudgetModal = (b: Budget) => {
    setEditingBudget(b);
    setBudgetCatId(b.categoryId);
    setBudgetAmount(String(b.amount));
    setIsBudgetModalOpen(true);
  };

  const openNewGoalModal = () => {
    setEditingGoal(null);
    setGoalName('');
    setGoalTarget('');
    setGoalSaved('0');
    setGoalDeadline('');
    setGoalIcon('🎯');
    setIsGoalModalOpen(true);
  };

  const openEditGoalModal = (g: FinancialGoal) => {
    setEditingGoal(g);
    setGoalName(g.name);
    setGoalTarget(String(g.target));
    setGoalSaved(String(g.savedAmount || 0));
    setGoalDeadline(g.deadline || '');
    setGoalIcon(g.icon || '🎯');
    setIsGoalModalOpen(true);
  };

  const handleSaveBudgetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amtNum = parseFloat(budgetAmount);
    if (!budgetCatId || isNaN(amtNum) || amtNum <= 0) return;

    const cat = state.categories.find((c) => c.id === budgetCatId);
    if (!cat) return;

    const b: Budget = {
      id: editingBudget ? editingBudget.id : 'b_' + Date.now().toString(36),
      categoryId: cat.id,
      categoryName: cat.name,
      amount: amtNum,
    };

    onSaveBudget(b);
    setBudgetAmount('');
    setIsBudgetModalOpen(false);
  };

  const handleSaveGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetNum = parseFloat(goalTarget);
    const savedNum = parseFloat(goalSaved) || 0;
    if (!goalName.trim() || isNaN(targetNum) || targetNum <= 0) return;

    const g: FinancialGoal = {
      id: editingGoal ? editingGoal.id : 'fg_' + Date.now().toString(36),
      name: goalName.trim(),
      target: targetNum,
      savedAmount: savedNum,
      deadline: goalDeadline || undefined,
      icon: goalIcon.trim() || '🎯',
    };

    onSaveFinancialGoal(g);
    setGoalName('');
    setGoalTarget('');
    setGoalSaved('0');
    setGoalDeadline('');
    setIsGoalModalOpen(false);
  };

  const handleAddSavingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const addNum = parseFloat(savingsInput);
    if (!selectedGoalId || isNaN(addNum) || addNum <= 0) return;

    onAddAmountToGoal(selectedGoalId, addNum);
    setSavingsInput('');
    setIsAddSavingsModalOpen(false);
  };

  // Analytics for reports tab
  const totalMonthIncome = currentMonthTx
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + Number(t.amount), 0);
  const totalMonthExpense = currentMonthTx
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + Number(t.amount), 0);
  const netSavings = totalMonthIncome - totalMonthExpense;
  const savingsRate = totalMonthIncome > 0 ? (netSavings / totalMonthIncome) * 100 : 0;

  const avgDailyIncome = currentDay > 0 ? totalMonthIncome / currentDay : 0;
  const avgDailyExpense = currentDay > 0 ? totalMonthExpense / currentDay : 0;
  const projectedMonthExpense = avgDailyExpense * daysInCurrentMonth;

  return (
    <div className="space-y-5 pb-20 pt-2">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <PieChart className="h-6 w-6 text-purple-400" />
            <span>{isRTL ? 'مركز المعلومات والميزانية' : 'Info Hub & Budget'}</span>
          </h2>
          <p className="text-xs text-purple-300/70">
            {isRTL ? 'تتبع الميزانيات، الأهداف المالية والتقارير الشهرية' : 'Manage budgets, goals and monthly analytics'}
          </p>
        </div>

        {/* Options & Exports Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsExportMenuOpen((prev) => !prev)}
            className="flex items-center justify-center p-2 rounded-xl border border-purple-800/40 bg-[#161633] text-purple-200 hover:bg-purple-800/40 hover:text-white transition-all shadow-sm active:scale-95"
            title={isRTL ? 'خيارات وتصدير' : 'Options & Exports'}
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {isExportMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsExportMenuOpen(false)}
              />
              <div
                className={`absolute ${isRTL ? 'left-0' : 'right-0'} mt-1.5 w-56 rounded-2xl border border-purple-800/50 bg-[#15152f] p-1.5 shadow-2xl z-50 animate-fadeIn`}
              >
                {/* Export Excel */}
                <button
                  type="button"
                  onClick={() => {
                    setIsExportMenuOpen(false);
                    exportService.exportBudgetsToExcel(state, isRTL);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-green-300 hover:bg-green-950/40 rounded-xl transition-all"
                >
                  <FileSpreadsheet className="h-4 w-4 text-green-400" />
                  <span>{isRTL ? 'تصدير كشف إكسل (XLSX)' : 'Export Excel (.xlsx)'}</span>
                </button>

                {/* Export PDF */}
                <button
                  type="button"
                  onClick={() => {
                    setIsExportMenuOpen(false);
                    const budgetItems = state.budgets.map((b) => {
                      const spent = getMonthlySpentForCat(b.categoryId);
                      return {
                        title: b.categoryName,
                        subtitle: `${isRTL ? 'المصروف' : 'Spent'}: ${formatCurrency(spent, cur)}`,
                        amount: formatCurrency(b.amount, cur),
                      };
                    });
                    exportService.exportSectionReportPDF(
                      isRTL ? 'تقرير الميزانيات والأهداف' : 'Budgets & Financial Goals',
                      state,
                      budgetItems,
                      [
                        { label: isRTL ? 'عدد الميزانيات' : 'Budgets Count', value: String(state.budgets.length) },
                        { label: isRTL ? 'الأهداف المالية' : 'Goals Count', value: String(state.financialGoals.length) },
                        { label: isRTL ? 'دخل الشهر' : 'Month Income', value: formatCurrency(totalMonthIncome, cur) },
                        { label: isRTL ? 'مصروف الشهر' : 'Month Expense', value: formatCurrency(totalMonthExpense, cur) },
                      ],
                      isRTL
                    );
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-purple-200 hover:bg-purple-900/40 rounded-xl transition-all"
                >
                  <FileText className="h-4 w-4 text-purple-400" />
                  <span>{isRTL ? 'تصدير تقرير PDF' : 'Export PDF'}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex gap-2 rounded-2xl bg-[#14142d] p-1 border border-purple-900/40">
        <button
          type="button"
          onClick={() => setActiveSubTab('budget')}
          className={`flex-1 rounded-xl py-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'budget'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-purple-300 hover:text-white'
          }`}
        >
          <Target className="h-3.5 w-3.5" />
          <span>{isRTL ? 'الميزانية' : 'Budget'}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('goals')}
          className={`flex-1 rounded-xl py-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'goals'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-purple-300 hover:text-white'
          }`}
        >
          <Flag className="h-3.5 w-3.5" />
          <span>{isRTL ? 'الأهداف' : 'Goals'}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('reports')}
          className={`flex-1 rounded-xl py-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'reports'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-purple-300 hover:text-white'
          }`}
        >
          <FileBarChart className="h-3.5 w-3.5" />
          <span>{isRTL ? 'التقارير' : 'Reports'}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('categories')}
          className={`flex-1 rounded-xl py-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'categories'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-purple-300 hover:text-white'
          }`}
        >
          <PieChart className="h-3.5 w-3.5" />
          <span>{isRTL ? 'الفئات' : 'Categories'}</span>
        </button>
      </div>

      {/* 1. BUDGET TAB */}
      {activeSubTab === 'budget' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-white">{isRTL ? 'ميزانيات الشهر الحالي' : 'Monthly Category Budgets'}</h3>
            <button
              type="button"
              onClick={openNewBudgetModal}
              className="flex items-center gap-1 rounded-xl bg-purple-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-purple-500 shadow-md"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{isRTL ? 'إضافة ميزانية' : 'Add Budget'}</span>
            </button>
          </div>

          {state.budgets.length === 0 ? (
            <div className="rounded-2xl border border-purple-900/30 bg-[#14142d] p-10 text-center text-xs text-purple-300/60">
              <Target className="mx-auto h-8 w-8 text-purple-500/40 mb-2" />
              <p>{isRTL ? 'لم تقم بتحديد أي ميزانيات شهرية بعد' : 'No monthly budgets set'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {state.budgets.map((b) => {
                const spent = getMonthlySpentForCat(b.categoryId);
                const pct = Math.min(100, (spent / (b.amount || 1)) * 100);
                const remaining = b.amount - spent;
                const isOverBudget = spent > b.amount;
                const isNearLimit = pct >= 80 && !isOverBudget;

                return (
                  <div
                    key={b.id}
                    className="rounded-2xl border border-purple-900/30 bg-[#14142d] p-4 shadow-sm space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-black text-white">{b.categoryName}</h4>
                        <div className="flex items-center gap-2 text-[11px] text-purple-300/70 mt-0.5">
                          <span>
                            {isRTL ? 'المصروف:' : 'Spent:'} {formatCurrency(spent, cur)}
                          </span>
                          <span>/</span>
                          <span>
                            {isRTL ? 'الميزانية:' : 'Budget:'} {formatCurrency(b.amount, cur)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isOverBudget ? (
                          <span className="flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-extrabold text-red-400 border border-red-500/40">
                            <AlertTriangle className="h-3 w-3" />
                            <span>{isRTL ? 'تجاوزت الميزانية!' : 'Exceeded!'}</span>
                          </span>
                        ) : isNearLimit ? (
                          <span className="flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-extrabold text-amber-400 border border-amber-500/40">
                            <AlertTriangle className="h-3 w-3" />
                            <span>{isRTL ? 'اقتربت من الحد' : 'Near limit'}</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-400">
                            {isRTL ? 'متبقي:' : 'Left:'} {formatCurrency(remaining, cur)}
                          </span>
                        )}

                        {/* Edit budget button */}
                        <button
                          type="button"
                          onClick={() => openEditBudgetModal(b)}
                          className="p-1 text-purple-300 hover:text-white hover:bg-purple-900/40 rounded transition-colors"
                          title={isRTL ? 'تعديل الميزانية' : 'Edit budget'}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setConfirmModal({
                              isOpen: true,
                              title: isRTL ? 'حذف الميزانية' : 'Delete Budget',
                              message: isRTL ? 'هل أنت متأكد من حذف هذه الميزانية؟' : 'Delete this budget?',
                              onConfirm: () => onDeleteBudget(b.id),
                            });
                          }}
                          className="p-1 text-red-400 hover:text-white hover:bg-red-900/40 rounded transition-colors"
                          title={isRTL ? 'حذف الميزانية' : 'Delete budget'}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-2 w-full rounded-full bg-purple-950 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isOverBudget
                            ? 'bg-red-500'
                            : isNearLimit
                            ? 'bg-amber-400'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 2. FINANCIAL GOALS TAB */}
      {activeSubTab === 'goals' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-white">{isRTL ? 'الأهداف والادخار المالي' : 'Financial Saving Goals'}</h3>
            <button
              type="button"
              onClick={openNewGoalModal}
              className="flex items-center gap-1 rounded-xl bg-purple-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-purple-500 shadow-md"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{isRTL ? 'هدف جديد' : 'New Goal'}</span>
            </button>
          </div>

          {state.financialGoals.length === 0 ? (
            <div className="rounded-2xl border border-purple-900/30 bg-[#14142d] p-10 text-center text-xs text-purple-300/60">
              <Flag className="mx-auto h-8 w-8 text-purple-500/40 mb-2" />
              <p>{isRTL ? 'لا توجد أهداف ادخارية مسجلة' : 'No savings goals set'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {state.financialGoals.map((g) => {
                const saved = Number(g.savedAmount || 0);
                const pct = Math.min(100, (saved / (g.target || 1)) * 100);
                const remaining = Math.max(0, g.target - saved);

                let monthsLeft = 0;
                let monthlyNeeded = 0;
                if (g.deadline) {
                  const dDate = new Date(g.deadline);
                  monthsLeft = Math.max(1, Math.ceil((dDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30)));
                  monthlyNeeded = remaining / monthsLeft;
                }

                return (
                  <div
                    key={g.id}
                    className="rounded-2xl border border-purple-900/30 bg-[#14142d] p-4 shadow-sm space-y-2.5"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{g.icon || '🎯'}</span>
                        <div>
                          <h4 className="text-xs font-black text-white">{g.name}</h4>
                          <div className="flex items-center gap-2 text-[11px] text-purple-300/70 mt-0.5">
                            <span>
                              {isRTL ? 'الموفر:' : 'Saved:'}{' '}
                              <strong className="text-emerald-400">{formatCurrency(saved, cur)}</strong>
                            </span>
                            <span>/</span>
                            <span>{formatCurrency(g.target, cur)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedGoalId(g.id);
                            setSavingsInput('');
                            setIsAddSavingsModalOpen(true);
                          }}
                          className="rounded-lg bg-emerald-600/30 border border-emerald-500/40 px-2 py-1 text-[10px] font-bold text-emerald-300 hover:bg-emerald-600/50"
                        >
                          + {isRTL ? 'إيداع ادخار' : 'Add funds'}
                        </button>
                        {/* Edit goal button */}
                        <button
                          type="button"
                          onClick={() => openEditGoalModal(g)}
                          className="p-1 text-purple-300 hover:text-white hover:bg-purple-900/40 rounded transition-colors"
                          title={isRTL ? 'تعديل الهدف' : 'Edit goal'}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setConfirmModal({
                              isOpen: true,
                              title: isRTL ? 'حذف الهدف المالي' : 'Delete Financial Goal',
                              message: isRTL ? `هل أنت متأكد من حذف هدف "${g.name}"؟` : `Delete goal "${g.name}"?`,
                              onConfirm: () => onDeleteFinancialGoal(g.id),
                            });
                          }}
                          className="p-1 text-red-400 hover:text-white hover:bg-red-900/40 rounded transition-colors"
                          title={isRTL ? 'حذف الهدف' : 'Delete goal'}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-2 w-full rounded-full bg-purple-950 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-purple-500 to-emerald-400 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-purple-300/70 pt-1">
                      <span>{pct.toFixed(0)}% {isRTL ? 'مكتمل' : 'completed'}</span>
                      {g.deadline && (
                        <span>
                          {isRTL
                            ? `متبقي ${monthsLeft} شهر • وفر ${formatCurrency(monthlyNeeded, cur)}/شهر`
                            : `${monthsLeft} mo left • Save ${formatCurrency(monthlyNeeded, cur)}/mo`}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3. REPORTS TAB */}
      {activeSubTab === 'reports' && (
        <div className="space-y-4">
          <div className="rounded-3xl border border-purple-500/20 bg-[#14142d] p-5 shadow-lg space-y-4">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <FileBarChart className="h-4 w-4 text-purple-400" />
              <span>{isRTL ? 'التحليل المالي للشهر الحالي' : 'Monthly Financial Analytics'}</span>
            </h3>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="rounded-xl border border-purple-900/40 bg-[#181838] p-3 text-center">
                <span className="text-[10px] text-purple-300 block">{isRTL ? 'إجمالي دخل الشهر' : 'Total Income'}</span>
                <span className="text-sm font-black text-emerald-400 mt-1 block">
                  {formatCurrency(totalMonthIncome, cur)}
                </span>
              </div>

              <div className="rounded-xl border border-purple-900/40 bg-[#181838] p-3 text-center">
                <span className="text-[10px] text-purple-300 block">{isRTL ? 'إجمالي مصروف الشهر' : 'Total Expense'}</span>
                <span className="text-sm font-black text-red-400 mt-1 block">
                  {formatCurrency(totalMonthExpense, cur)}
                </span>
              </div>

              <div className="rounded-xl border border-purple-900/40 bg-[#181838] p-3 text-center">
                <span className="text-[10px] text-purple-300 block">{isRTL ? 'معدل الادخار' : 'Savings Rate'}</span>
                <span className="text-sm font-black text-purple-300 mt-1 block">
                  {savingsRate.toFixed(1)}%
                </span>
              </div>

              <div className="rounded-xl border border-purple-900/40 bg-[#181838] p-3 text-center">
                <span className="text-[10px] text-purple-300 block">{isRTL ? 'متوسط الصرف اليومي' : 'Daily Avg Expense'}</span>
                <span className="text-sm font-black text-amber-400 mt-1 block">
                  {formatCurrency(avgDailyExpense, cur)}
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-purple-800/30 bg-purple-950/20 p-3 text-xs text-purple-200">
              💡 {isRTL
                ? `بناءً على معدل صرفك الحالي، من المتوقع أن يصل إجمالي مصروفات الشهر إلى ${formatCurrency(projectedMonthExpense, cur)} بنهاية الشهر.`
                : `Based on your average spending, projected monthly expenses are ${formatCurrency(projectedMonthExpense, cur)}.`}
            </div>
          </div>
        </div>
      )}

      {/* 4. CATEGORIES BREAKDOWN TAB */}
      {activeSubTab === 'categories' && (
        <div className="space-y-3">
          {state.categories.map((cat) => {
            const catTxs = state.transactions.filter((t) => t.category === cat.id);
            const total = catTxs.reduce((s, t) => s + Number(t.amount), 0);
            return (
              <div
                key={cat.id}
                className="flex items-center justify-between rounded-2xl border border-purple-900/30 bg-[#14142d] p-3.5"
              >
                <div>
                  <h4 className="text-xs font-black text-white">{cat.name}</h4>
                  <p className="text-[10px] text-purple-300/60">
                    {catTxs.length} {isRTL ? 'معاملة مسجلة' : 'transactions'}
                  </p>
                </div>
                <div
                  className={`text-xs font-black ${
                    cat.type === 'income' ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {cat.type === 'income' ? '+' : '-'}
                  {formatCurrency(total, cur)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Budget Modal */}
      {isBudgetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-purple-500/30 bg-[#15152f] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-purple-900/40 pb-3 mb-4">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-400" />
                <span>
                  {editingBudget
                    ? isRTL ? 'تعديل الميزانية الشهرية' : 'Edit Monthly Budget'
                    : isRTL ? 'تحديد ميزانية شهرية' : 'Set Monthly Budget'}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setIsBudgetModalOpen(false)}
                className="text-purple-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBudgetSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-purple-300 block mb-1">{isRTL ? 'الفئة *' : 'Category *'}</label>
                <select
                  required
                  value={budgetCatId}
                  onChange={(e) => setBudgetCatId(e.target.value)}
                  className="w-full rounded-xl border border-purple-900/50 bg-[#1c1c3c] p-2.5 text-xs text-white outline-none focus:border-purple-500"
                >
                  {state.categories
                    .filter((c) => c.type === 'expense')
                    .map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-purple-300 block mb-1">{isRTL ? 'المبلغ الشهري الأقصى *' : 'Monthly Limit *'}</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={budgetAmount}
                    onChange={(e) => setBudgetAmount(e.target.value)}
                    placeholder="1500"
                    className="w-full rounded-xl border border-purple-900/50 bg-[#1c1c3c] p-2.5 text-base font-bold text-white outline-none focus:border-purple-500"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-purple-400">
                    {cur}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-purple-600 py-2.5 text-xs font-bold text-white shadow-md hover:bg-purple-500"
                >
                  {editingBudget ? (isRTL ? 'حفظ التعديلات' : 'Update Budget') : (isRTL ? 'حفظ الميزانية' : 'Save Budget')}
                </button>
                <button
                  type="button"
                  onClick={() => setIsBudgetModalOpen(false)}
                  className="rounded-xl border border-purple-900/50 bg-[#1c1c3c] px-4 py-2.5 text-xs font-bold text-purple-300"
                >
                  {isRTL ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Goal Modal */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-purple-500/30 bg-[#15152f] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-purple-900/40 pb-3 mb-4">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Flag className="h-5 w-5 text-purple-400" />
                <span>
                  {editingGoal
                    ? isRTL ? 'تعديل الهدف المالي' : 'Edit Savings Goal'
                    : isRTL ? 'إضافة هدف مالي / ادخار' : 'New Savings Goal'}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setIsGoalModalOpen(false)}
                className="text-purple-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGoalSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-purple-300 block mb-1">{isRTL ? 'اسم الهدف *' : 'Goal Name *'}</label>
                <input
                  type="text"
                  required
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  placeholder={isRTL ? 'شراء سيارة / صندوق طوارئ...' : 'Emergency fund...'}
                  className="w-full rounded-xl border border-purple-900/50 bg-[#1c1c3c] p-2.5 text-xs text-white outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-purple-300 block mb-1">{isRTL ? 'المبلغ المستهدف *' : 'Target Amount *'}</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={goalTarget}
                    onChange={(e) => setGoalTarget(e.target.value)}
                    placeholder="10000"
                    className="w-full rounded-xl border border-purple-900/50 bg-[#1c1c3c] p-2.5 text-xs text-white outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-purple-300 block mb-1">{isRTL ? 'الموفر حالياً' : 'Initial Saved'}</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={goalSaved}
                    onChange={(e) => setGoalSaved(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-xl border border-purple-900/50 bg-[#1c1c3c] p-2.5 text-xs text-white outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-purple-300 block mb-1">{isRTL ? 'تاريخ الإنجاز المطلوب' : 'Target Date'}</label>
                <input
                  type="date"
                  value={goalDeadline}
                  onChange={(e) => setGoalDeadline(e.target.value)}
                  className="w-full rounded-xl border border-purple-900/50 bg-[#1c1c3c] p-2.5 text-xs text-white outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-purple-600 py-2.5 text-xs font-bold text-white shadow-md hover:bg-purple-500"
                >
                  {editingGoal ? (isRTL ? 'حفظ التعديلات' : 'Update Goal') : (isRTL ? 'حفظ الهدف' : 'Save Goal')}
                </button>
                <button
                  type="button"
                  onClick={() => setIsGoalModalOpen(false)}
                  className="rounded-xl border border-purple-900/50 bg-[#1c1c3c] px-4 py-2.5 text-xs font-bold text-purple-300"
                >
                  {isRTL ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Savings to Goal Modal */}
      {isAddSavingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl border border-purple-500/30 bg-[#15152f] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-purple-900/40 pb-3 mb-4">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-400" />
                <span>{isRTL ? 'إيداع مبلغ في الهدف' : 'Deposit to Goal'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddSavingsModalOpen(false)}
                className="text-purple-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddSavingsSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-purple-300 block mb-1">{isRTL ? 'المبلغ المراد إضافته *' : 'Amount to add *'}</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={savingsInput}
                    onChange={(e) => setSavingsInput(e.target.value)}
                    placeholder="500"
                    className="w-full rounded-xl border border-purple-900/50 bg-[#1c1c3c] p-2.5 text-base font-bold text-white outline-none focus:border-purple-500"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-purple-400">
                    {cur}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-500"
                >
                  {isRTL ? 'إيداع' : 'Deposit'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddSavingsModalOpen(false)}
                  className="rounded-xl border border-purple-900/50 bg-[#1c1c3c] px-4 py-2.5 text-xs font-bold text-purple-300"
                >
                  {isRTL ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        language={language}
      />
    </div>
  );
};
