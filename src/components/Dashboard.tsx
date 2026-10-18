import React, { useState } from 'react';
import { AppState } from '../types';
import { formatCurrency } from '../services/i18n';
import { exportService } from '../services/exportService';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Briefcase,
  Users,
  Lightbulb,
  Clock,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronRight,
  Sparkles,
  Zap,
  FileSpreadsheet,
  FileText,
  MoreVertical,
  ChevronDown,
} from 'lucide-react';

interface DashboardProps {
  state: AppState;
  onNavigate: (tab: any) => void;
  onOpenAddTransaction: () => void;
  onOpenAddPerson: () => void;
  onOpenAddWork: () => void;
  language: 'ar' | 'en';
}

export const Dashboard: React.FC<DashboardProps> = ({
  state,
  onNavigate,
  onOpenAddTransaction,
  onOpenAddPerson,
  onOpenAddWork,
  language,
}) => {
  const isRTL = language === 'ar';
  const cur = state.settings.currency || 'ر.س';

  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number | null>(null);
  const [isBannerMenuOpen, setIsBannerMenuOpen] = useState<boolean>(false);

  // Current month transactions
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthTx = state.transactions.filter((t) => {
    const d = new Date(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const monthIncome = monthTx
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + Number(t.amount), 0);
  const monthExpense = monthTx
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + Number(t.amount), 0);
  const monthNetFlow = monthIncome - monthExpense;

  const totalIncome = state.transactions
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = state.transactions
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + Number(t.amount), 0);
  const totalBalance = totalIncome - totalExpense;

  // Debts and Receivables
  const totalDebtAmount = state.debts
    .filter((d) => d.type === 'debt')
    .reduce((s, d) => s + Number(d.amount), 0);
  const totalReceivableAmount = state.debts
    .filter((d) => d.type === 'receivable')
    .reduce((s, d) => s + Number(d.amount), 0);

  const paidDebts = state.payments
    .filter((p) => state.debts.some((d) => d.id === p.debtId && d.type === 'debt'))
    .reduce((s, p) => s + Number(p.amount), 0);
  const collectedReceivables = state.payments
    .filter((p) => state.debts.some((d) => d.id === p.debtId && d.type === 'receivable'))
    .reduce((s, p) => s + Number(p.amount), 0);

  const debtsYouOwe = Math.max(0, totalDebtAmount - paidDebts);
  const receivablesOwedToYou = Math.max(0, totalReceivableAmount - collectedReceivables);

  // Work Earnings
  let totalWorkGross = 0;
  state.workLogs.forEach((log) => {
    const w = state.works.find((x) => x.id === log.workId);
    if (w) {
      if (w.calculationType === 'piece') {
        totalWorkGross += Number(w.rate) * Number(log.quantity || 0);
      } else {
        totalWorkGross += Number(w.rate) * Number(log.hours || 0);
      }
    }
  });
  const totalWorkPaymentsReceived = state.workPayments.reduce((s, p) => s + Number(p.amount), 0);
  const workNetRemaining = totalWorkGross - totalWorkPaymentsReceived;

  // Smart circle segments
  const segments = [
    { name: isRTL ? '💰 الدخل العام' : 'Income', value: totalIncome, color: '#10b981' },
    { name: isRTL ? '💸 المصروفات' : 'Expenses', value: totalExpense, color: '#ef4444' },
    { name: isRTL ? '💼 مستحقات الأعمال' : 'Work Dues', value: Math.max(0, workNetRemaining), color: '#8b5cf6' },
    { name: isRTL ? '🔴 ديون عليك' : 'Debts You Owe', value: debtsYouOwe, color: '#f59e0b' },
    { name: isRTL ? '🟢 مستحقات لك' : 'Receivables', value: receivablesOwedToYou, color: '#06b6d4' },
  ].filter((s) => s.value > 0);

  const circleTotal = segments.reduce((s, i) => s + i.value, 0);

  // SVG parameters
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  let accumulatedOffset = 0;

  // Recent transactions
  const recentTransactions = [...state.transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6 pb-20 pt-2">
      {/* Overview Header banner */}
      <div className="relative overflow-hidden rounded-3xl border border-purple-500/20 bg-gradient-to-r from-purple-950/60 via-[#181133] to-[#121226] p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-purple-300 text-xs font-semibold mb-1">
              <Sparkles className="h-4 w-4 text-purple-400" />
              <span>{isRTL ? 'نظرة عامة على محفظتك المالية' : 'Wallet Overview'}</span>
            </div>
            <h2 className="text-3xl font-black tracking-tight text-white">
              {formatCurrency(totalBalance, cur)}
            </h2>
            <p className="mt-1 text-xs text-purple-300/80">
              {isRTL
                ? `صافي التدفق لهذا الشهر: ${monthNetFlow >= 0 ? '+' : ''}${formatCurrency(monthNetFlow, cur)}`
                : `Net flow this month: ${formatCurrency(monthNetFlow, cur)}`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Primary Action: Add Transaction */}
            <button
              type="button"
              onClick={onOpenAddTransaction}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-3.5 py-2 text-xs font-bold text-white shadow-lg shadow-purple-600/30 transition-all hover:opacity-95 active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span>{isRTL ? 'معاملة جديدة' : 'Add Transaction'}</span>
            </button>

            {/* Options Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsBannerMenuOpen((prev) => !prev)}
                className="flex items-center justify-center p-2 rounded-xl border border-purple-700/50 bg-[#161633] text-purple-200 hover:bg-purple-800/40 hover:text-white transition-all shadow-sm active:scale-95"
                title={isRTL ? 'خيارات إضافية وتصدير' : 'More Options & Exports'}
              >
                <MoreVertical className="h-4 w-4" />
              </button>

              {isBannerMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsBannerMenuOpen(false)}
                  />
                  <div
                    className={`absolute ${isRTL ? 'left-0' : 'right-0'} mt-1.5 w-56 rounded-2xl border border-purple-800/50 bg-[#15152f] p-1.5 shadow-2xl z-50 animate-fadeIn`}
                  >
                    {/* Add Work */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsBannerMenuOpen(false);
                        onOpenAddWork();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-purple-200 hover:bg-purple-900/40 rounded-xl transition-all"
                    >
                      <Briefcase className="h-4 w-4 text-purple-400" />
                      <span>{isRTL ? 'إضافة عمل / مشروع جديد' : 'New Work / Project'}</span>
                    </button>

                    <div className="my-1 border-t border-purple-900/40" />

                    {/* Export Excel (.xlsx) */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsBannerMenuOpen(false);
                        exportService.exportFullWorkbookToExcel(state, isRTL);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-green-300 hover:bg-green-950/40 rounded-xl transition-all"
                    >
                      <FileSpreadsheet className="h-4 w-4 text-green-400" />
                      <span>{isRTL ? 'تصدير شامل إكسل (XLSX)' : 'Export Full Excel'}</span>
                    </button>

                    {/* Export PDF */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsBannerMenuOpen(false);
                        const items = state.transactions.slice(0, 15).map((t) => ({
                          title: t.desc || t.category,
                          subtitle: new Date(t.date).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US'),
                          amount: (t.type === 'income' ? '+' : '-') + formatCurrency(t.amount, cur),
                        }));
                        exportService.exportSectionReportPDF(
                          isRTL ? 'تقرير لوحة التحكم والملخص المالي' : 'Dashboard Financial Summary',
                          state,
                          items,
                          [
                            { label: isRTL ? 'إجمالي الرصيد' : 'Total Balance', value: formatCurrency(totalBalance, cur) },
                            { label: isRTL ? 'دخل الشهر' : 'Month Income', value: formatCurrency(monthIncome, cur) },
                            { label: isRTL ? 'مصروف الشهر' : 'Month Expense', value: formatCurrency(monthExpense, cur) },
                            { label: isRTL ? 'صافي ديون الناس' : 'Net Debts', value: formatCurrency(receivablesOwedToYou - debtsYouOwe, cur) },
                          ],
                          isRTL
                        );
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-purple-200 hover:bg-purple-900/40 rounded-xl transition-all"
                    >
                      <FileText className="h-4 w-4 text-purple-400" />
                      <span>{isRTL ? 'تصدير ملخص مالي (PDF)' : 'Export Summary (PDF)'}</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {/* Monthly Income */}
        <div className="rounded-2xl border border-emerald-500/20 bg-[#15152b] p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
            <span>{isRTL ? 'دخل الشهر' : 'Month Income'}</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10">
              <ArrowDownLeft className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-lg font-black text-emerald-400">
            {formatCurrency(monthIncome, cur)}
          </div>
          <div className="mt-1 text-[10px] text-purple-300/60">
            {isRTL ? 'جميع المداخيل المسجلة' : 'All recorded incomes'}
          </div>
        </div>

        {/* Monthly Expense */}
        <div className="rounded-2xl border border-red-500/20 bg-[#15152b] p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-red-400">
            <span>{isRTL ? 'مصروف الشهر' : 'Month Expenses'}</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/10">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-lg font-black text-red-400">
            {formatCurrency(monthExpense, cur)}
          </div>
          <div className="mt-1 text-[10px] text-purple-300/60">
            {isRTL ? 'إجمالي نفقاتك هذا الشهر' : 'Monthly outgoings'}
          </div>
        </div>

        {/* Debts You Owe */}
        <div className="rounded-2xl border border-amber-500/20 bg-[#15152b] p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-amber-400">
            <span>{isRTL ? 'ديون عليك' : 'Debts Owed'}</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-lg font-black text-amber-400">
            {formatCurrency(debtsYouOwe, cur)}
          </div>
          <div className="mt-1 text-[10px] text-purple-300/60">
            {isRTL ? 'مطلوب منك سدادها' : 'Pending payment by you'}
          </div>
        </div>

        {/* Receivables */}
        <div className="rounded-2xl border border-cyan-500/20 bg-[#15152b] p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-cyan-400">
            <span>{isRTL ? 'مستحقات لك' : 'Receivables'}</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/10">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-lg font-black text-cyan-400">
            {formatCurrency(receivablesOwedToYou, cur)}
          </div>
          <div className="mt-1 text-[10px] text-purple-300/60">
            {isRTL ? 'تنتظر تحصيلها من الآخرين' : 'Owed to you by others'}
          </div>
        </div>
      </div>

      {/* Smart Circle Section (Donut Chart) */}
      <div className="rounded-3xl border border-purple-500/30 bg-[#14142d] p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-600/20 text-purple-400">
              <Zap className="h-4 w-4" />
            </div>
            <h3 className="text-base font-extrabold text-white">
              {isRTL ? 'النظرة الشاملة الذكية' : 'Smart Distribution'}
            </h3>
          </div>
          <span className="text-xs font-bold text-purple-300/70">
            {isRTL ? 'توزيع الأصول والالتزامات' : 'Asset & Debt Breakdown'}
          </span>
        </div>

        <div className="flex flex-col items-center justify-around gap-6 md:flex-row">
          {/* SVG Donut */}
          <div className="relative flex h-52 w-52 items-center justify-center">
            <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90">
              <circle
                cx="100"
                cy="100"
                r={radius}
                className="fill-none stroke-purple-950/60"
                strokeWidth="18"
              />
              {circleTotal > 0 &&
                segments.map((seg, idx) => {
                  const dashLength = (seg.value / circleTotal) * circumference;
                  const strokeOffset = accumulatedOffset;
                  accumulatedOffset += dashLength;
                  const isHovered = activeSegmentIndex === idx;

                  return (
                    <circle
                      key={idx}
                      cx="100"
                      cy="100"
                      r={radius}
                      fill="none"
                      stroke={seg.color}
                      strokeWidth={isHovered ? 24 : 18}
                      strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                      strokeDashoffset={-strokeOffset}
                      className="cursor-pointer transition-all duration-300"
                      onMouseEnter={() => setActiveSegmentIndex(idx)}
                      onMouseLeave={() => setActiveSegmentIndex(null)}
                      onClick={() => setActiveSegmentIndex(activeSegmentIndex === idx ? null : idx)}
                    />
                  );
                })}
            </svg>

            {/* Center Summary */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-[11px] font-bold text-purple-300/70">
                {activeSegmentIndex !== null
                  ? segments[activeSegmentIndex]?.name
                  : isRTL
                  ? 'إجمالي القيمة'
                  : 'Total Volume'}
              </span>
              <span className="text-xl font-black text-white">
                {activeSegmentIndex !== null
                  ? formatCurrency(segments[activeSegmentIndex]?.value || 0, cur)
                  : formatCurrency(circleTotal, cur)}
              </span>
              <span className="text-[10px] font-bold text-purple-400">
                {activeSegmentIndex !== null
                  ? `${(((segments[activeSegmentIndex]?.value || 0) / (circleTotal || 1)) * 100).toFixed(1)}%`
                  : `${segments.length} ${isRTL ? 'عناصر' : 'segments'}`}
              </span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-1 flex-col gap-2.5 w-full max-w-sm">
            {segments.map((seg, idx) => {
              const pct = circleTotal > 0 ? ((seg.value / circleTotal) * 100).toFixed(1) : '0';
              const isSelected = activeSegmentIndex === idx;
              return (
                <div
                  key={idx}
                  onMouseEnter={() => setActiveSegmentIndex(idx)}
                  onMouseLeave={() => setActiveSegmentIndex(null)}
                  onClick={() => setActiveSegmentIndex(isSelected ? null : idx)}
                  className={`flex items-center justify-between rounded-xl border p-2.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-purple-400 bg-purple-900/40 shadow-md scale-[1.02]'
                      : 'border-purple-900/30 bg-[#191938] hover:border-purple-700/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3.5 w-3.5 rounded-full shadow-sm"
                      style={{ backgroundColor: seg.color }}
                    />
                    <span className="text-xs font-bold text-purple-100">{seg.name}</span>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <span className="text-xs font-extrabold text-white">
                      {formatCurrency(seg.value, cur)}
                    </span>
                    <span className="rounded-md bg-purple-950/60 px-1.5 py-0.5 text-[10px] font-extrabold text-purple-300">
                      {pct}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Smart Insights */}
      <div className="rounded-3xl border border-purple-500/20 bg-[#14142d] p-5 shadow-lg">
        <div className="mb-3 flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-amber-400" />
          <h3 className="text-sm font-extrabold text-white">
            {isRTL ? 'رؤى وتحليلات ذكية' : 'Smart Financial Insights'}
          </h3>
        </div>

        <div className="space-y-2.5">
          {monthIncome > monthExpense && monthIncome > 0 ? (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-3 text-xs text-emerald-200">
              <span className="font-bold">✨ أداء مالي ممتاز:</span> دخلك الشهري يفوق مصروفاتك بفارق{' '}
              <span className="font-black underline">{formatCurrency(monthIncome - monthExpense, cur)}</span>.
              يمكنك تحويل جزء منه إلى أهدافك الادخارية!
            </div>
          ) : monthExpense > monthIncome && monthExpense > 0 ? (
            <div className="rounded-xl border border-red-500/20 bg-red-950/20 p-3 text-xs text-red-200">
              <span className="font-bold">⚠️ تنبيه إنفاق:</span> مصروفات الشهر تفوق الدخل بمقدار{' '}
              <span className="font-black underline">{formatCurrency(monthExpense - monthIncome, cur)}</span>.
              راجع فئات الإنفاق عبر تبويب الميزانية.
            </div>
          ) : null}

          {debtsYouOwe > 0 && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-950/20 p-3 text-xs text-amber-200">
              <span className="font-bold">🤝 متابعة الديون:</span> لديك التزامات ديون مستحقة بقيمة{' '}
              <span className="font-black">{formatCurrency(debtsYouOwe, cur)}</span> يمكنك جدولتها وسدادها بسهولة من تبويب "حساباتي".
            </div>
          )}

          {workNetRemaining > 0 && (
            <div className="rounded-xl border border-purple-500/20 bg-purple-950/20 p-3 text-xs text-purple-200">
              <span className="font-bold">💼 مستحقات أعمال معلقة:</span> لديك أتعاب عمل متبقية غير مقبوضة بقيمة{' '}
              <span className="font-black">{formatCurrency(workNetRemaining, cur)}</span>.
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-3xl border border-purple-500/20 bg-[#14142d] p-5 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-purple-400" />
            <h3 className="text-sm font-extrabold text-white">
              {isRTL ? 'آخر المعاملات المالية' : 'Recent Transactions'}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('wallet')}
            className="flex items-center gap-1 text-xs font-bold text-purple-400 hover:text-purple-300"
          >
            <span>{isRTL ? 'عرض الكل' : 'View all'}</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="rounded-2xl border border-purple-900/30 bg-[#181836] p-8 text-center text-xs text-purple-300/60">
            {isRTL ? 'لا توجد معاملات مسجلة حتى الآن' : 'No transactions recorded yet'}
          </div>
        ) : (
          <div className="space-y-2">
            {recentTransactions.map((tx) => {
              const cat = state.categories.find((c) => c.id === tx.category);
              const isIncome = tx.type === 'income';
              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between rounded-xl border border-purple-900/30 bg-[#191938] p-3 transition-all hover:border-purple-700/50"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                        isIncome ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {isIncome ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-white">
                        {tx.desc || cat?.name || (isRTL ? 'معاملة' : 'Transaction')}
                      </h4>
                      <p className="text-[10px] text-purple-300/60">
                        {new Date(tx.date).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')} • {cat?.name}
                      </p>
                    </div>
                  </div>
                  <div className={`text-xs font-black ${isIncome ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isIncome ? '+' : '-'}
                    {formatCurrency(tx.amount, cur)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
