import React, { useState } from 'react';
import { formatCurrency } from '../../services/i18n';
import {
  Target,
  ShieldAlert,
  Flame,
  Clock,
  Plus,
  Trash2,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';

interface ToolProps {
  currency: string;
  isRTL: boolean;
}

// 7. 🎯 مخطط الادخار (Savings Planner)
export const SavingsPlannerTool: React.FC<ToolProps> = ({ currency, isRTL }) => {
  const [targetAmount, setTargetAmount] = useState<number>(50000);
  const [currentSavings, setCurrentSavings] = useState<number>(5000);
  const [targetMonths, setTargetMonths] = useState<number>(12);
  const [annualReturn, setAnnualReturn] = useState<number>(4);

  const neededAmount = Math.max(0, targetAmount - currentSavings);
  // Monthly interest
  const monthlyRate = (annualReturn / 100) / 12;

  let monthlySaving = 0;
  if (monthlyRate === 0) {
    monthlySaving = neededAmount / targetMonths;
  } else {
    // PMT = (FV - PV*(1+r)^n) * (r / ((1+r)^n - 1))
    const futureValueOfCurrent = currentSavings * Math.pow(1 + monthlyRate, targetMonths);
    const remainingFV = Math.max(0, targetAmount - futureValueOfCurrent);
    monthlySaving = remainingFV * (monthlyRate / (Math.pow(1 + monthlyRate, targetMonths) - 1));
  }

  const progressPct = Math.min(100, (currentSavings / targetAmount) * 100);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-bold text-purple-300 block mb-1">
            {isRTL ? 'المبلغ المستهدف ادخاره' : 'Savings Target Goal'}
          </label>
          <input
            type="number"
            min="0"
            value={targetAmount}
            onChange={(e) => setTargetAmount(Math.max(0, parseFloat(e.target.value) || 0))}
            className="w-full rounded-xl border border-purple-900/50 bg-[#1c1c3c] p-2.5 text-sm font-bold text-white outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-purple-300 block mb-1">
            {isRTL ? 'المبلغ المتوفر حالياً' : 'Current Savings on Hand'}
          </label>
          <input
            type="number"
            min="0"
            value={currentSavings}
            onChange={(e) => setCurrentSavings(Math.max(0, parseFloat(e.target.value) || 0))}
            className="w-full rounded-xl border border-purple-900/50 bg-[#1c1c3c] p-2.5 text-sm font-bold text-white outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-purple-300 block mb-1">
            {isRTL ? 'المدة المطلوبة للتحقيق (أشهر)' : 'Timeline (Months)'}
          </label>
          <input
            type="number"
            min="1"
            max="120"
            value={targetMonths}
            onChange={(e) => setTargetMonths(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full rounded-xl border border-purple-900/50 bg-[#1c1c3c] p-2.5 text-sm font-bold text-white outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-purple-300 block mb-1">
            {isRTL ? 'معدل العائد الاستثماري التقديري (%)' : 'Est. Annual Return (%)'}
          </label>
          <input
            type="number"
            step="0.5"
            min="0"
            value={annualReturn}
            onChange={(e) => setAnnualReturn(Math.max(0, parseFloat(e.target.value) || 0))}
            className="w-full rounded-xl border border-purple-900/50 bg-[#1c1c3c] p-2.5 text-sm font-bold text-white outline-none"
          />
        </div>
      </div>

      {/* Progress Bar */}
      <div>
        <div className="flex justify-between text-xs text-purple-300 mb-1">
          <span>{isRTL ? 'نسبة الإنجاز المحققة:' : 'Current Progress:'}</span>
          <strong className="text-emerald-400">{progressPct.toFixed(1)}%</strong>
        </div>
        <div className="h-2.5 w-full rounded-full bg-purple-950 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-emerald-400"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Result Card */}
      <div className="rounded-3xl border border-emerald-500/40 bg-gradient-to-r from-emerald-950/40 via-[#152a23] to-[#14142d] p-5 shadow-xl">
        <span className="text-xs font-bold text-emerald-300 block mb-1">
          {isRTL ? 'المبلغ المطلوب ادخاره شهرياً لتحقيق الهدف:' : 'Required Monthly Savings:'}
        </span>
        <div className="text-3xl font-black text-emerald-400">
          {formatCurrency(monthlySaving, currency)} / {isRTL ? 'شهر' : 'mo'}
        </div>
        <p className="mt-2 text-xs text-purple-200/80">
          {isRTL
            ? `بتوفير هذا المبلغ بانتظام خلال ${targetMonths} شهراً، ستصل إلى هدفك بقيمة ${formatCurrency(targetAmount, currency)}.`
            : `By saving this amount steadily for ${targetMonths} months, you will hit your goal of ${formatCurrency(targetAmount, currency)}.`}
        </p>
      </div>
    </div>
  );
};

// 8. 🏖️ حاسبة التقاعد والاستقلال المالي (Retirement Calculator)
export const RetirementCalculatorTool: React.FC<ToolProps> = ({ currency, isRTL }) => {
  const [currentAge, setCurrentAge] = useState<number>(30);
  const [retirementAge, setRetirementAge] = useState<number>(60);
  const [monthlyExpenseInRetirement, setMonthlyExpenseInRetirement] = useState<number>(8000);
  const [currentNestEgg, setCurrentNestEgg] = useState<number>(50000);
  const [safeWithdrawalRate, setSafeWithdrawalRate] = useState<number>(4); // 4% rule

  const yearsToRetire = Math.max(1, retirementAge - currentAge);
  const annualExpense = monthlyExpenseInRetirement * 12;
  // Capital needed based on safe withdrawal rate (e.g. 4% = 25x annual expenses)
  const requiredRetirementCapital = annualExpense / (safeWithdrawalRate / 100);
  const shortfall = Math.max(0, requiredRetirementCapital - currentNestEgg);

  // Assuming modest 6% net return pre-retirement
  const monthlyR = 0.06 / 12;
  const nMonths = yearsToRetire * 12;
  const futureValueOfNestEgg = currentNestEgg * Math.pow(1 + monthlyR, nMonths);
  const remainingNeeded = Math.max(0, requiredRetirementCapital - futureValueOfNestEgg);
  const monthlySavingsNeeded = remainingNeeded * (monthlyR / (Math.pow(1 + monthlyR, nMonths) - 1));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-bold text-purple-300 block mb-1">
            {isRTL ? 'عمرك الحالي' : 'Current Age'}
          </label>
          <input
            type="number"
            min="18"
            max="80"
            value={currentAge}
            onChange={(e) => setCurrentAge(parseInt(e.target.value) || 30)}
            className="w-full rounded-xl border border-purple-900/50 bg-[#1c1c3c] p-2.5 text-sm font-bold text-white outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-purple-300 block mb-1">
            {isRTL ? 'سن التقاعد المستهدف' : 'Target Retirement Age'}
          </label>
          <input
            type="number"
            min={currentAge + 1}
            max="90"
            value={retirementAge}
            onChange={(e) => setRetirementAge(parseInt(e.target.value) || 60)}
            className="w-full rounded-xl border border-purple-900/50 bg-[#1c1c3c] p-2.5 text-sm font-bold text-white outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-purple-300 block mb-1">
            {isRTL ? 'المصروف الشهري المطلوب بعد التقاعد' : 'Desired Monthly Retirement Spend'}
          </label>
          <input
            type="number"
            min="1000"
            value={monthlyExpenseInRetirement}
            onChange={(e) => setMonthlyExpenseInRetirement(parseFloat(e.target.value) || 8000)}
            className="w-full rounded-xl border border-purple-900/50 bg-[#1c1c3c] p-2.5 text-sm font-bold text-white outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-2xl border border-purple-500/30 bg-purple-950/20 p-4 text-center">
          <span className="text-[11px] font-bold text-purple-300 block">
            {isRTL ? 'رأس المال المطلوب للاستقلال المالي والتقاعد' : 'Total Nest Egg Required'}
          </span>
          <div className="text-2xl font-black text-white mt-1">
            {formatCurrency(requiredRetirementCapital, currency)}
          </div>
          <span className="text-[10px] text-purple-300/70 block mt-1">
            {isRTL ? 'بناءً على قاعدة السحب الآمن 4% سنوياً' : 'Based on 4% safe withdrawal rate'}
          </span>
        </div>

        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 text-center">
          <span className="text-[11px] font-bold text-emerald-300 block">
            {isRTL ? 'الادخار الشهري الموصى به حتى التقاعد' : 'Recommended Monthly Investment'}
          </span>
          <div className="text-2xl font-black text-emerald-400 mt-1">
            {formatCurrency(monthlySavingsNeeded, currency)}
          </div>
          <span className="text-[10px] text-purple-300/70 block mt-1">
            {isRTL ? `خلال ${yearsToRetire} سنة متبقية` : `over ${yearsToRetire} years`}
          </span>
        </div>
      </div>
    </div>
  );
};

// 9. 🚨 حاسبة صندوق الطوارئ (Emergency Fund Calculator)
export const EmergencyFundTool: React.FC<ToolProps> = ({ currency, isRTL }) => {
  const [rentAndHousing, setRentAndHousing] = useState<number>(2500);
  const [foodAndGroceries, setFoodAndGroceries] = useState<number>(1500);
  const [billsAndUtilities, setBillsAndUtilities] = useState<number>(600);
  const [transportAndHealth, setTransportAndHealth] = useState<number>(700);
  const [currentFund, setCurrentFund] = useState<number>(5000);
  const [monthsCoverage, setMonthsCoverage] = useState<number>(6);

  const monthlyEssentialTotal = rentAndHousing + foodAndGroceries + billsAndUtilities + transportAndHealth;
  const targetEmergencyFund = monthlyEssentialTotal * monthsCoverage;
  const remainingNeeded = Math.max(0, targetEmergencyFund - currentFund);
  const coveragePercent = Math.min(100, (currentFund / targetEmergencyFund) * 100);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div>
          <label className="text-[11px] text-purple-300 block mb-0.5">{isRTL ? 'السكن والإيجار' : 'Housing/Rent'}</label>
          <input
            type="number"
            value={rentAndHousing}
            onChange={(e) => setRentAndHousing(parseFloat(e.target.value) || 0)}
            className="w-full rounded-lg bg-[#181838] p-2 text-xs text-white"
          />
        </div>
        <div>
          <label className="text-[11px] text-purple-300 block mb-0.5">{isRTL ? 'الغذاء والتموين' : 'Groceries'}</label>
          <input
            type="number"
            value={foodAndGroceries}
            onChange={(e) => setFoodAndGroceries(parseFloat(e.target.value) || 0)}
            className="w-full rounded-lg bg-[#181838] p-2 text-xs text-white"
          />
        </div>
        <div>
          <label className="text-[11px] text-purple-300 block mb-0.5">{isRTL ? 'الفواتير والكهرباء' : 'Utilities'}</label>
          <input
            type="number"
            value={billsAndUtilities}
            onChange={(e) => setBillsAndUtilities(parseFloat(e.target.value) || 0)}
            className="w-full rounded-lg bg-[#181838] p-2 text-xs text-white"
          />
        </div>
        <div>
          <label className="text-[11px] text-purple-300 block mb-0.5">{isRTL ? 'النقل والصحة' : 'Transport/Health'}</label>
          <input
            type="number"
            value={transportAndHealth}
            onChange={(e) => setTransportAndHealth(parseFloat(e.target.value) || 0)}
            className="w-full rounded-lg bg-[#181838] p-2 text-xs text-white"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-bold text-purple-300 block mb-1">
          {isRTL ? 'فترة التغطية المطلوبة' : 'Coverage Duration'}
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { m: 3, label: isRTL ? '3 أشهر (حد أدنى)' : '3 Months' },
            { m: 6, label: isRTL ? '6 أشهر (موصى به)' : '6 Months' },
            { m: 12, label: isRTL ? '12 شهراً (أمان كامل)' : '12 Months' },
          ].map((item) => (
            <button
              key={item.m}
              type="button"
              onClick={() => setMonthsCoverage(item.m)}
              className={`py-2 rounded-xl text-xs font-bold ${
                monthsCoverage === item.m ? 'bg-purple-600 text-white shadow-md' : 'bg-[#181838] text-purple-300'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Target Result */}
      <div className="rounded-3xl border border-amber-500/40 bg-amber-950/20 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-amber-300">
            {isRTL ? `المبلغ المستهدف لصندوق الطوارئ (${monthsCoverage} أشهر):` : `Target Emergency Fund (${monthsCoverage} mo):`}
          </span>
          <span className="text-xs font-bold text-white">
            {coveragePercent.toFixed(0)}% {isRTL ? 'مكتمل' : 'covered'}
          </span>
        </div>

        <div className="text-3xl font-black text-amber-400">
          {formatCurrency(targetEmergencyFund, currency)}
        </div>

        <div className="h-2 w-full rounded-full bg-purple-950 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-400"
            style={{ width: `${coveragePercent}%` }}
          />
        </div>

        <div className="flex justify-between text-xs text-purple-300/80 pt-1">
          <span>{isRTL ? 'المصروف الشهري الأساسي:' : 'Monthly Essentials:'} {formatCurrency(monthlyEssentialTotal, currency)}</span>
          <span>{isRTL ? 'المتبقي لتحقيق الصندوق:' : 'Remaining Needed:'} <strong className="text-amber-300">{formatCurrency(remainingNeeded, currency)}</strong></span>
        </div>
      </div>
    </div>
  );
};

// 10. 💳 مخطط سداد الديون: كرة الثلج والأفالانش (Debt Payoff Strategy Planner)
export const DebtPayoffPlannerTool: React.FC<ToolProps> = ({ currency, isRTL }) => {
  interface DebtItem {
    id: string;
    name: string;
    balance: number;
    interestRate: number;
    minPayment: number;
  }

  const [debts, setDebts] = useState<DebtItem[]>([
    { id: '1', name: isRTL ? 'بطاقة ائتمانية (أ)' : 'Credit Card A', balance: 5000, interestRate: 18, minPayment: 250 },
    { id: '2', name: isRTL ? 'قرض سيارة' : 'Auto Loan', balance: 25000, interestRate: 7, minPayment: 600 },
    { id: '3', name: isRTL ? 'دين شخصي' : 'Personal Loan', balance: 12000, interestRate: 12, minPayment: 400 },
  ]);

  const [strategy, setStrategy] = useState<'snowball' | 'avalanche'>('snowball');
  const [extraPayment, setExtraPayment] = useState<number>(300);

  const addDebt = () => {
    setDebts((prev) => [
      ...prev,
      { id: String(Date.now()), name: isRTL ? 'دين جديد' : 'New Debt', balance: 3000, interestRate: 10, minPayment: 150 },
    ]);
  };

  const removeDebt = (id: string) => {
    setDebts((prev) => prev.filter((d) => d.id !== id));
  };

  const updateDebt = (id: string, field: keyof DebtItem, val: any) => {
    setDebts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, [field]: val } : d))
    );
  };

  // Sort according to strategy:
  // Snowball: lowest balance first (psychological momentum)
  // Avalanche: highest interest rate first (saves most interest)
  const sortedDebts = [...debts].sort((a, b) => {
    if (strategy === 'snowball') return a.balance - b.balance;
    return b.interestRate - a.interestRate;
  });

  const totalDebtBalance = debts.reduce((s, d) => s + (Number(d.balance) || 0), 0);
  const totalMinPayment = debts.reduce((s, d) => s + (Number(d.minPayment) || 0), 0);

  return (
    <div className="space-y-4">
      {/* Strategy Toggle */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setStrategy('snowball')}
          className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            strategy === 'snowball'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-[#181838] text-purple-300'
          }`}
        >
          <Flame className="h-4 w-4 text-cyan-400" />
          <span>{isRTL ? 'كرة الثلج (Snowball - الأقل رصيداً)' : 'Snowball (Lowest Balance)'}</span>
        </button>
        <button
          type="button"
          onClick={() => setStrategy('avalanche')}
          className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            strategy === 'avalanche'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-[#181838] text-purple-300'
          }`}
        >
          <TrendingUp className="h-4 w-4 text-emerald-400" />
          <span>{isRTL ? 'الأفالانش (Avalanche - الأعلى فائدة)' : 'Avalanche (Highest Rate)'}</span>
        </button>
      </div>

      <div className="rounded-xl bg-purple-950/20 p-3 text-xs text-purple-200 border border-purple-900/30">
        💡 {strategy === 'snowball'
          ? (isRTL ? 'طريقة كرة الثلج: تسديد الديون الأصغر أولاً لمنحك حافزاً نفسياً وسرعة إغلاق الحسابات.' : 'Snowball: Pay off smallest debts first for quick psychological wins.')
          : (isRTL ? 'طريقة الأفالانش: تسديد الديون ذات الفائدة الأعلى أولاً لتوفير أكبر قدر ممكن من الفوائد والتكاليف.' : 'Avalanche: Pay highest interest debts first to save the most money.')}
      </div>

      {/* Debts List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-white">{isRTL ? 'قائمة ديونك الحالية' : 'Debts List'}</span>
          <button
            type="button"
            onClick={addDebt}
            className="flex items-center gap-1 rounded-lg bg-purple-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-purple-500"
          >
            <Plus className="h-3 w-3" />
            <span>{isRTL ? 'إضافة دين' : 'Add Debt'}</span>
          </button>
        </div>

        <div className="space-y-2">
          {sortedDebts.map((d, index) => (
            <div
              key={d.id}
              className={`rounded-2xl border p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                index === 0 ? 'border-emerald-500/50 bg-emerald-950/15' : 'border-purple-900/30 bg-[#161633]'
              }`}
            >
              <div className="flex items-center gap-2 flex-1">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-900/50 text-[10px] font-black text-purple-300">
                  #{index + 1}
                </span>
                <input
                  type="text"
                  value={d.name}
                  onChange={(e) => updateDebt(d.id, 'name', e.target.value)}
                  className="bg-transparent border-none text-xs font-bold text-white outline-none"
                />
                {index === 0 && (
                  <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-black text-emerald-400">
                    🎯 {isRTL ? 'التركيز أولاً' : 'Target First'}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <div className="text-right">
                  <span className="text-[10px] text-purple-300/60 block">{isRTL ? 'الرصيد' : 'Balance'}</span>
                  <input
                    type="number"
                    value={d.balance}
                    onChange={(e) => updateDebt(d.id, 'balance', parseFloat(e.target.value) || 0)}
                    className="w-20 rounded bg-[#101026] p-1 text-center text-xs text-white border border-purple-900/50"
                  />
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-purple-300/60 block">{isRTL ? 'الفائدة' : 'Rate %'}</span>
                  <input
                    type="number"
                    step="0.5"
                    value={d.interestRate}
                    onChange={(e) => updateDebt(d.id, 'interestRate', parseFloat(e.target.value) || 0)}
                    className="w-14 rounded bg-[#101026] p-1 text-center text-xs text-white border border-purple-900/50"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeDebt(d.id)}
                  className="p-1 text-red-400 hover:text-red-300"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="rounded-2xl border border-purple-900/40 bg-[#14142d] p-4 text-xs font-bold space-y-2">
        <div className="flex justify-between text-purple-200">
          <span>{isRTL ? 'إجمالي رصيد الديون:' : 'Total Debt Balance:'}</span>
          <span className="text-base text-red-400 font-black">{formatCurrency(totalDebtBalance, currency)}</span>
        </div>
        <div className="flex justify-between text-purple-200">
          <span>{isRTL ? 'إجمالي الأقساط الشهرية الدنيا:' : 'Total Minimum Monthly:'}</span>
          <span className="text-white">{formatCurrency(totalMinPayment, currency)}</span>
        </div>
      </div>
    </div>
  );
};
