import React, { useState, useMemo } from 'react';
import { AppState, Transaction, Category } from '../types';
import { formatCurrency } from '../services/i18n';
import { ConfirmModal } from './ConfirmModal';
import { exportService } from '../services/exportService';
import {
  Receipt,
  Search,
  Plus,
  Filter,
  Trash2,
  Edit2,
  ArrowDownLeft,
  ArrowUpRight,
  Download,
  FileSpreadsheet,
  FileText,
  Layers,
  X,
  RotateCcw,
  AlertCircle,
  MoreVertical,
  ChevronDown,
} from 'lucide-react';

interface WalletPageProps {
  state: AppState;
  onSaveTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onAddCategory: (category: Omit<Category, 'id'>) => void;
  onDeleteCategory: (id: string) => void;
  onPromptBudget: (categoryId: string) => void;
  language: 'ar' | 'en';
}

export const WalletPage: React.FC<WalletPageProps> = ({
  state,
  onSaveTransaction,
  onDeleteTransaction,
  onAddCategory,
  onDeleteCategory,
  onPromptBudget,
  language,
}) => {
  const isRTL = language === 'ar';
  const cur = state.settings.currency || 'ر.س';

  const [activeTab, setActiveTab] = useState<'all' | 'income' | 'expense'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');
  const [selectedCat, setSelectedCat] = useState<string>('');

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

  // Modal States
  const [isTxModalOpen, setIsTxModalOpen] = useState<boolean>(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [formError, setFormError] = useState<string>('');

  const [isCatModalOpen, setIsCatModalOpen] = useState<boolean>(false);
  const [newCatName, setNewCatName] = useState<string>('');
  const [newCatType, setNewCatType] = useState<'income' | 'expense'>('expense');

  // Transaction form states
  const [txType, setTxType] = useState<'income' | 'expense'>('expense');
  const [txCategory, setTxCategory] = useState<string>('');
  const [txAmount, setTxAmount] = useState<string>('');
  const [txDate, setTxDate] = useState<string>('');
  const [txDesc, setTxDesc] = useState<string>('');

  const openNewTxModal = () => {
    setEditingTx(null);
    setFormError('');
    setTxType('expense');
    const firstExpenseCat = state.categories.find((c) => c.type === 'expense') || state.categories[0];
    setTxCategory(firstExpenseCat ? firstExpenseCat.id : '');
    setTxAmount('');
    const now = new Date();
    const localIso = now.toISOString().slice(0, 16);
    setTxDate(localIso);
    setTxDesc('');
    setIsTxModalOpen(true);
  };

  const openEditTxModal = (tx: Transaction) => {
    setEditingTx(tx);
    setFormError('');
    setTxType(tx.type);
    setTxCategory(tx.category);
    setTxAmount(String(tx.amount));
    setTxDate(tx.date.slice(0, 16));
    setTxDesc(tx.desc || '');
    setIsTxModalOpen(true);
  };

  const handleSaveTx = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(txAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setFormError(isRTL ? 'يرجى إدخال مبلغ صحيح أكبر من الصفر' : 'Please enter a valid amount greater than 0');
      return;
    }

    if (!txCategory) {
      setFormError(isRTL ? 'يرجى اختيار الفئة' : 'Please choose a category');
      return;
    }

    setFormError('');
    const tx: Transaction = {
      id: editingTx ? editingTx.id : 'tx_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      date: txDate ? new Date(txDate).toISOString() : new Date().toISOString(),
      type: txType,
      category: txCategory,
      amount: amountNum,
      desc: txDesc.trim(),
    };

    onSaveTransaction(tx);
    setIsTxModalOpen(false);
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    onAddCategory({
      name: newCatName.trim(),
      type: newCatType,
    });
    setNewCatName('');
  };

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return state.transactions.filter((tx) => {
      if (activeTab !== 'all' && tx.type !== activeTab) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const cat = state.categories.find((c) => c.id === tx.category);
        const matchDesc = (tx.desc || '').toLowerCase().includes(q);
        const matchCat = (cat?.name || '').toLowerCase().includes(q);
        if (!matchDesc && !matchCat) return false;
      }

      if (selectedCat && tx.category !== selectedCat) return false;

      if (dateFrom && tx.date.slice(0, 10) < dateFrom) return false;
      if (dateTo && tx.date.slice(0, 10) > dateTo) return false;

      const amt = Number(tx.amount);
      if (minAmount && amt < parseFloat(minAmount)) return false;
      if (maxAmount && amt > parseFloat(maxAmount)) return false;

      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [state.transactions, state.categories, activeTab, searchQuery, selectedCat, dateFrom, dateTo, minAmount, maxAmount]);

  const resetFilters = () => {
    setSearchQuery('');
    setDateFrom('');
    setDateTo('');
    setMinAmount('');
    setMaxAmount('');
    setSelectedCat('');
  };

  const exportCSV = () => {
    const rows = [
      ['Date', 'Type', 'Category', 'Amount', 'Description'],
      ...filteredTransactions.map((tx) => {
        const cat = state.categories.find((c) => c.id === tx.category);
        return [
          tx.date,
          tx.type === 'income' ? 'Income' : 'Expense',
          cat?.name || '',
          tx.amount,
          tx.desc || '',
        ];
      }),
    ];
    const csvContent = '\uFEFF' + rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(filteredTransactions, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transactions-${new Date().toISOString().slice(0, 10)}.json`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState<boolean>(false);

  return (
    <div className="space-y-5 pb-20 pt-2">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Receipt className="h-6 w-6 text-purple-400" />
            <span>{isRTL ? 'المحفظة وسجل المعاملات' : 'Wallet & Transactions'}</span>
          </h2>
          <p className="text-xs text-purple-300/70">
            {isRTL ? 'إدارة الدخل والمصروفات والبحث المتقدم' : 'Track incomes, expenses and search'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Primary Action: New Transaction */}
          <button
            type="button"
            onClick={openNewTxModal}
            className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-purple-600/30 transition-all hover:bg-purple-500 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>{isRTL ? 'معاملة جديدة' : 'New Transaction'}</span>
          </button>

          {/* Options & Exports Dropdown Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsOptionsMenuOpen((prev) => !prev)}
              className="flex items-center justify-center p-2 rounded-xl border border-purple-800/40 bg-[#161633] text-purple-200 hover:bg-purple-800/40 hover:text-white transition-all shadow-sm active:scale-95"
              title={isRTL ? 'خيارات وتصدير' : 'Options & Exports'}
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {isOptionsMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsOptionsMenuOpen(false)}
                />
                <div
                  className={`absolute ${isRTL ? 'left-0' : 'right-0'} mt-1.5 w-56 rounded-2xl border border-purple-800/50 bg-[#15152f] p-1.5 shadow-2xl z-50 animate-fadeIn`}
                >
                  {/* Categories */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsOptionsMenuOpen(false);
                      setIsCatModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-purple-200 hover:bg-purple-900/40 rounded-xl transition-all"
                  >
                    <Layers className="h-4 w-4 text-purple-400" />
                    <span>{isRTL ? 'إدارة الفئات' : 'Manage Categories'}</span>
                  </button>

                  <div className="my-1 border-t border-purple-900/40" />

                  {/* Export Excel */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsOptionsMenuOpen(false);
                      exportService.exportWalletToExcel(state, isRTL);
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
                      setIsOptionsMenuOpen(false);
                      const catMap = new Map(state.categories.map((c) => [c.id, c.name]));
                      const items = filteredTransactions.slice(0, 50).map((t) => ({
                        title: t.desc || catMap.get(t.category) || t.category,
                        subtitle: `${catMap.get(t.category) || ''} • ${new Date(t.date).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}`,
                        amount: (t.type === 'income' ? '+' : '-') + formatCurrency(t.amount, cur),
                      }));

                      const totalInc = filteredTransactions
                        .filter((t) => t.type === 'income')
                        .reduce((s, t) => s + Number(t.amount), 0);
                      const totalExp = filteredTransactions
                        .filter((t) => t.type === 'expense')
                        .reduce((s, t) => s + Number(t.amount), 0);

                      exportService.exportSectionReportPDF(
                        isRTL ? 'كشف المعاملات المالية' : 'Transactions Statement',
                        state,
                        items,
                        [
                          { label: isRTL ? 'إجمالي الدخل' : 'Total Income', value: formatCurrency(totalInc, cur) },
                          { label: isRTL ? 'إجمالي المصروفات' : 'Total Expense', value: formatCurrency(totalExp, cur) },
                          { label: isRTL ? 'الصافي' : 'Net Flow', value: formatCurrency(totalInc - totalExp, cur) },
                        ],
                        isRTL
                      );
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-purple-200 hover:bg-purple-900/40 rounded-xl transition-all"
                  >
                    <FileText className="h-4 w-4 text-purple-400" />
                    <span>{isRTL ? 'تصدير تقرير PDF' : 'Export PDF'}</span>
                  </button>

                  {/* Export CSV */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsOptionsMenuOpen(false);
                      exportCSV();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-cyan-300 hover:bg-cyan-950/40 rounded-xl transition-all"
                  >
                    <Download className="h-4 w-4 text-cyan-400" />
                    <span>{isRTL ? 'تصدير ملف CSV' : 'Export CSV'}</span>
                  </button>

                  {/* Export JSON */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsOptionsMenuOpen(false);
                      exportJSON();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-amber-300 hover:bg-amber-950/40 rounded-xl transition-all"
                  >
                    <Download className="h-4 w-4 text-amber-400" />
                    <span>{isRTL ? 'تصدير ملف JSON' : 'Export JSON'}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Search & Advanced Filters */}
      <div className="rounded-2xl border border-purple-900/30 bg-[#14142d] p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isRTL ? 'ابحث في الوصف أو الفئة...' : 'Search by description or category...'}
              className="w-full rounded-xl border border-purple-900/50 bg-[#1a1a38] py-2 pr-9 pl-9 text-xs text-white placeholder-purple-400/50 outline-none focus:border-purple-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-all ${
              showAdvancedFilters || selectedCat || dateFrom || dateTo || minAmount || maxAmount
                ? 'border-purple-500 bg-purple-600 text-white shadow-md'
                : 'border-purple-900/40 bg-[#1a1a38] text-purple-300 hover:text-white'
            }`}
          >
            <Filter className="h-4 w-4" />
          </button>
        </div>

        {/* Advanced Filters Drawer */}
        {showAdvancedFilters && (
          <div className="rounded-xl border border-purple-900/40 bg-[#101026] p-3 text-xs space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-purple-900/30 pb-2">
              <span className="font-bold text-purple-300">{isRTL ? 'فلاتر متقدمة' : 'Advanced Filters'}</span>
              <button
                type="button"
                onClick={resetFilters}
                className="flex items-center gap-1 text-[11px] font-bold text-red-400 hover:text-red-300"
              >
                <RotateCcw className="h-3 w-3" />
                <span>{isRTL ? 'إعادة تعيين' : 'Reset'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div>
                <label className="text-[10px] text-purple-400 block mb-1">{isRTL ? 'من تاريخ' : 'Date from'}</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full rounded-lg border border-purple-900/50 bg-[#181836] p-1.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[10px] text-purple-400 block mb-1">{isRTL ? 'إلى تاريخ' : 'Date to'}</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full rounded-lg border border-purple-900/50 bg-[#181836] p-1.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[10px] text-purple-400 block mb-1">{isRTL ? 'أقل مبلغ' : 'Min Amount'}</label>
                <input
                  type="number"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-lg border border-purple-900/50 bg-[#181836] p-1.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[10px] text-purple-400 block mb-1">{isRTL ? 'أعلى مبلغ' : 'Max Amount'}</label>
                <input
                  type="number"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                  placeholder="99999"
                  className="w-full rounded-lg border border-purple-900/50 bg-[#181836] p-1.5 text-xs text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-purple-400 block mb-1">{isRTL ? 'تصفية حسب الفئة' : 'Filter Category'}</label>
              <select
                value={selectedCat}
                onChange={(e) => setSelectedCat(e.target.value)}
                className="w-full rounded-lg border border-purple-900/50 bg-[#181836] p-1.5 text-xs text-white"
              >
                <option value="">{isRTL ? 'جميع الفئات' : 'All Categories'}</option>
                {state.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.type === 'income' ? '+' : '-'})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Quick Tabs: All / Income / Expense */}
        <div className="flex gap-2 border-t border-purple-900/30 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`flex-1 rounded-xl py-1.5 text-xs font-bold transition-all ${
              activeTab === 'all'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-[#181836] text-purple-300 hover:text-white'
            }`}
          >
            {isRTL ? 'الكل' : 'All'} ({state.transactions.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('income')}
            className={`flex-1 rounded-xl py-1.5 text-xs font-bold transition-all flex items-center justify-center gap-1 ${
              activeTab === 'income'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-[#181836] text-emerald-400 hover:bg-emerald-950/30'
            }`}
          >
            <ArrowDownLeft className="h-3.5 w-3.5" />
            <span>{isRTL ? 'دخل' : 'Income'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('expense')}
            className={`flex-1 rounded-xl py-1.5 text-xs font-bold transition-all flex items-center justify-center gap-1 ${
              activeTab === 'expense'
                ? 'bg-red-600 text-white shadow-md'
                : 'bg-[#181836] text-red-400 hover:bg-red-950/30'
            }`}
          >
            <ArrowUpRight className="h-3.5 w-3.5" />
            <span>{isRTL ? 'مصروف' : 'Expense'}</span>
          </button>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-xs text-purple-300/70 px-1">
        <span>{isRTL ? `المعاملات المعروضة: ${filteredTransactions.length}` : `Showing: ${filteredTransactions.length}`}</span>
      </div>

      {/* Transactions List */}
      {filteredTransactions.length === 0 ? (
        <div className="rounded-2xl border border-purple-900/30 bg-[#14142d] p-12 text-center text-xs text-purple-300/60">
          <Receipt className="mx-auto h-8 w-8 text-purple-500/40 mb-2" />
          <p>{isRTL ? 'لا توجد معاملات مطابقة للبحث أو الفلتر' : 'No transactions found'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTransactions.map((tx) => {
            const cat = state.categories.find((c) => c.id === tx.category);
            const isIncome = tx.type === 'income';
            return (
              <div
                key={tx.id}
                className="flex items-center justify-between rounded-2xl border border-purple-900/30 bg-[#14142d] p-3.5 transition-all hover:border-purple-700/50"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl shadow-sm ${
                      isIncome ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {isIncome ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                  </div>

                  <div>
                    <h4 className="text-xs font-black text-white">
                      {tx.desc || cat?.name || (isRTL ? 'معاملة' : 'Transaction')}
                    </h4>
                    <div className="flex items-center gap-2 text-[11px] text-purple-300/70">
                      <span>{new Date(tx.date).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}</span>
                      <span>•</span>
                      <span className="rounded bg-purple-950/60 px-1.5 py-0.5 font-bold text-purple-300">
                        {cat?.name || (isRTL ? 'عام' : 'General')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`text-sm font-black ${isIncome ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isIncome ? '+' : '-'}
                    {formatCurrency(tx.amount, cur)}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditTxModal(tx)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-purple-900/40 bg-purple-950/30 text-purple-300 hover:text-white hover:bg-purple-800/40"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmModal({
                          isOpen: true,
                          title: isRTL ? 'حذف المعاملة' : 'Delete Transaction',
                          message: isRTL
                            ? `هل تريد بالتأكيد حذف هذه المعاملة (${formatCurrency(tx.amount, cur)}) نهائياً؟`
                            : `Are you sure you want to delete this transaction (${formatCurrency(tx.amount, cur)}) permanently?`,
                          onConfirm: () => onDeleteTransaction(tx.id),
                        });
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-900/40 bg-red-950/30 text-red-300 hover:text-white hover:bg-red-800/40 transition-colors"
                      title={isRTL ? 'حذف المعاملة' : 'Delete transaction'}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Transaction Modal */}
      {isTxModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-purple-500/30 bg-[#15152f] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-purple-900/40 pb-3 mb-4">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Receipt className="h-5 w-5 text-purple-400" />
                <span>
                  {editingTx
                    ? isRTL ? 'تعديل المعاملة' : 'Edit Transaction'
                    : isRTL ? 'إضافة معاملة جديدة' : 'Add New Transaction'}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setIsTxModalOpen(false)}
                className="text-purple-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTx} className="space-y-4">
              {formError && (
                <div className="rounded-xl bg-red-950/60 border border-red-500/40 p-2.5 text-xs text-red-200 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Type Switcher */}
              <div>
                <label className="text-xs font-bold text-purple-300 block mb-1.5">{isRTL ? 'نوع المعاملة' : 'Type'}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTxType('expense')}
                    className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      txType === 'expense'
                        ? 'bg-red-600 text-white shadow-md'
                        : 'bg-[#1e1e3e] text-red-400 border border-red-900/40'
                    }`}
                  >
                    <ArrowUpRight className="h-4 w-4" />
                    <span>{isRTL ? 'مصروف' : 'Expense'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTxType('income')}
                    className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      txType === 'income'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-[#1e1e3e] text-emerald-400 border border-emerald-900/40'
                    }`}
                  >
                    <ArrowDownLeft className="h-4 w-4" />
                    <span>{isRTL ? 'دخل' : 'Income'}</span>
                  </button>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="text-xs font-bold text-purple-300 block mb-1">{isRTL ? 'المبلغ *' : 'Amount *'}</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-xl border border-purple-900/50 bg-[#1c1c3c] p-2.5 text-base font-bold text-white outline-none focus:border-purple-500"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-purple-400">
                    {cur}
                  </span>
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="text-xs font-bold text-purple-300 block mb-1">{isRTL ? 'الفئة *' : 'Category *'}</label>
                <select
                  required
                  value={txCategory}
                  onChange={(e) => setTxCategory(e.target.value)}
                  className="w-full rounded-xl border border-purple-900/50 bg-[#1c1c3c] p-2.5 text-xs font-bold text-white outline-none focus:border-purple-500"
                >
                  {state.categories
                    .filter((c) => c.type === txType)
                    .map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="text-xs font-bold text-purple-300 block mb-1">{isRTL ? 'التاريخ والوقت' : 'Date & Time'}</label>
                <input
                  type="datetime-local"
                  required
                  value={txDate}
                  onChange={(e) => setTxDate(e.target.value)}
                  className="w-full rounded-xl border border-purple-900/50 bg-[#1c1c3c] p-2.5 text-xs text-white outline-none focus:border-purple-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-bold text-purple-300 block mb-1">{isRTL ? 'الوصف أو الملاحظات' : 'Description'}</label>
                <input
                  type="text"
                  value={txDesc}
                  onChange={(e) => setTxDesc(e.target.value)}
                  placeholder={isRTL ? 'تفاصيل المعاملة...' : 'Transaction notes...'}
                  className="w-full rounded-xl border border-purple-900/50 bg-[#1c1c3c] p-2.5 text-xs text-white outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex gap-2 pt-2 items-center">
                {editingTx && (
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmModal({
                        isOpen: true,
                        title: isRTL ? 'حذف المعاملة' : 'Delete Transaction',
                        message: isRTL
                          ? `هل أنت متأكد من حذف هذه المعاملة (${formatCurrency(editingTx.amount, cur)}) نهائياً؟`
                          : `Delete transaction (${formatCurrency(editingTx.amount, cur)}) permanently?`,
                        onConfirm: () => {
                          onDeleteTransaction(editingTx.id);
                          setIsTxModalOpen(false);
                        },
                      });
                    }}
                    className="rounded-xl border border-red-900/40 bg-red-950/30 px-3 py-2.5 text-xs font-bold text-red-400 hover:bg-red-900/40 hover:text-white transition-colors flex items-center gap-1"
                    title={isRTL ? 'حذف المعاملة' : 'Delete'}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>{isRTL ? 'حذف' : 'Delete'}</span>
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-purple-600 py-2.5 text-xs font-bold text-white shadow-md hover:bg-purple-500 transition-colors"
                >
                  {isRTL ? 'حفظ المعاملة' : 'Save Transaction'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsTxModalOpen(false)}
                  className="rounded-xl border border-purple-900/50 bg-[#1c1c3c] px-4 py-2.5 text-xs font-bold text-purple-300 hover:text-white"
                >
                  {isRTL ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Manager Modal */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-purple-500/30 bg-[#15152f] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-purple-900/40 pb-3 mb-4">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Layers className="h-5 w-5 text-purple-400" />
                <span>{isRTL ? 'إدارة الفئات' : 'Category Manager'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsCatModalOpen(false)}
                className="text-purple-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Existing Categories List */}
            <div className="max-h-52 overflow-y-auto space-y-1.5 mb-4 pr-1">
              {state.categories.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-xl border border-purple-900/30 bg-[#1a1a38] p-2.5 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        c.type === 'income' ? 'bg-emerald-400' : 'bg-red-400'
                      }`}
                    />
                    <span className="font-bold text-white">{c.name}</span>
                    <span className="text-[10px] text-purple-400">
                      ({c.type === 'income' ? (isRTL ? 'دخل' : 'Income') : (isRTL ? 'مصروف' : 'Expense')})
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {c.type === 'expense' && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsCatModalOpen(false);
                          onPromptBudget(c.id);
                        }}
                        className="rounded px-2 py-0.5 text-[10px] font-bold text-cyan-400 hover:bg-cyan-950/40 border border-cyan-800/40"
                      >
                        {isRTL ? 'تحديد ميزانية' : 'Set Budget'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmModal({
                          isOpen: true,
                          title: isRTL ? 'حذف الفئة' : 'Delete Category',
                          message: isRTL
                            ? `هل أنت متأكد من حذف فئة "${c.name}"؟ لن يتم حذف المعاملات السابقة المرتبطة بها.`
                            : `Are you sure you want to delete category "${c.name}"?`,
                          onConfirm: () => onDeleteCategory(c.id),
                        });
                      }}
                      className="p-1 text-red-400 hover:text-red-300 transition-colors"
                      title={isRTL ? 'حذف الفئة' : 'Delete category'}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add New Category Form */}
            <form onSubmit={handleAddCategory} className="border-t border-purple-900/40 pt-4 space-y-3">
              <h4 className="text-xs font-bold text-purple-300">{isRTL ? 'إضافة فئة جديدة' : 'Add New Category'}</h4>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setNewCatType('expense')}
                  className={`py-1.5 rounded-lg text-xs font-bold ${
                    newCatType === 'expense'
                      ? 'bg-red-600 text-white'
                      : 'bg-[#1c1c3c] text-red-400 border border-red-900/40'
                  }`}
                >
                  {isRTL ? 'فئة مصروف' : 'Expense'}
                </button>
                <button
                  type="button"
                  onClick={() => setNewCatType('income')}
                  className={`py-1.5 rounded-lg text-xs font-bold ${
                    newCatType === 'income'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#1c1c3c] text-emerald-400 border border-emerald-900/40'
                  }`}
                >
                  {isRTL ? 'فئة دخل' : 'Income'}
                </button>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder={isRTL ? 'اسم الفئة الجديد...' : 'Category name...'}
                  className="flex-1 rounded-xl border border-purple-900/50 bg-[#1c1c3c] p-2 text-xs text-white outline-none focus:border-purple-500"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-500"
                >
                  {isRTL ? 'إضافة' : 'Add'}
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
