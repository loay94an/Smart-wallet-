import React, { useState } from 'react';
import { formatCurrency } from '../../services/i18n';
import {
  Landmark,
  CreditCard,
  TrendingUp,
  Receipt,
  Coffee,
  Scale,
  Plus,
  Trash2,
  Printer,
  Check,
  Copy,
  ChevronDown,
} from 'lucide-react';

interface ToolProps {
  currency: string;
  isRTL: boolean;
}

// 1. 🏦 حاسبة الفائدة (Interest Calculator)
export const InterestCalculatorTool: React.FC<ToolProps> = ({ currency, isRTL }) => {
  const [principal, setPrincipal] = useState<number>(10000);
  const [rate, setRate] = useState<number>(5);
  const [years, setYears] = useState<number>(5);
  const [compoundFreq, setCompoundFreq] = useState<number>(1); // 1 = yearly, 4 = quarterly, 12 = monthly
  const [interestType, setInterestType] = useState<'both' | 'simple' | 'compound'>('both');

  // Simple interest: I = P * r * t
  const simpleInterest = principal * (rate / 100) * years;
  const simpleTotal = principal + simpleInterest;

  // Compound interest: A = P * (1 + r/n)^(n*t)
  const compoundTotal = principal * Math.pow(1 + (rate / 100) / compoundFreq, compoundFreq * years);
  const compoundInterest = compoundTotal - principal;

  // Timeline projection (sample points)
  const timelinePoints = Array.from({ length: Math.min(years + 1, 11) }, (_, i) => {
    const yr = Math.round((i / Math.min(years, 10)) * years);
    const simp = principal + principal * (rate / 100) * yr;
    const comp = principal * Math.pow(1 + (rate / 100) / compoundFreq, compoundFreq * yr);
    return { year: yr, simple: simp, compound: comp };
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-bold text-purple-300 block mb-1">
            {isRTL ? 'المبلغ الأساسي (رأس المال)' : 'Principal Amount'}
          </label>
          <input
            type="number"
            min="0"
            value={principal}
            onChange={(e) => setPrincipal(Math.max(0, parseFloat(e.target.value) || 0))}
            className="w-full rounded-xl border border-purple-900/50 bg-[#1c1c3c] p-2.5 text-sm font-bold text-white outline-none focus:border-purple-500"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-purple-300 block mb-1">
            {isRTL ? 'معدل الفائدة السنوي (%)' : 'Annual Interest Rate (%)'}
          </label>
          <input
            type="number"
            step="0.1"
            min="0"
            value={rate}
            onChange={(e) => setRate(Math.max(0, parseFloat(e.target.value) || 0))}
            className="w-full rounded-xl border border-purple-900/50 bg-[#1c1c3c] p-2.5 text-sm font-bold text-white outline-none focus:border-purple-500"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-purple-300 block mb-1">
            {isRTL ? 'المدة الزمنية (بالسنوات)' : 'Term (Years)'}
          </label>
          <input
            type="number"
            min="1"
            max="50"
            value={years}
            onChange={(e) => setYears(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full rounded-xl border border-purple-900/50 bg-[#1c1c3c] p-2.5 text-sm font-bold text-white outline-none focus:border-purple-500"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-bold text-purple-300 block mb-1">
          {isRTL ? 'دورية تكرار الفائدة المركبة' : 'Compounding Frequency'}
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { val: 1, label: isRTL ? 'سنوياً (مرة/سنة)' : 'Annually' },
            { val: 4, label: isRTL ? 'ربع سنوي (4 مرات)' : 'Quarterly' },
            { val: 12, label: isRTL ? 'شهرياً (12 مرة)' : 'Monthly' },
          ].map((item) => (
            <button
              key={item.val}
              type="button"
              onClick={() => setCompoundFreq(item.val)}
              className={`py-2 rounded-xl text-xs font-bold transition-all ${
                compoundFreq === item.val
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-[#181838] text-purple-300 border border-purple-900/40 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
        {/* Simple Interest */}
        <div className="rounded-2xl border border-blue-500/30 bg-blue-950/20 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-blue-400">
              📊 {isRTL ? 'الفائدة البسيطة (Simple Interest)' : 'Simple Interest'}
            </span>
          </div>
          <div className="text-2xl font-black text-white">
            {formatCurrency(simpleTotal, currency)}
          </div>
          <div className="text-xs text-blue-300/80 space-y-1 pt-1 border-t border-blue-900/40">
            <div className="flex justify-between">
              <span>{isRTL ? 'مبلغ الفائدة:' : 'Interest Earned:'}</span>
              <strong className="text-blue-300">+{formatCurrency(simpleInterest, currency)}</strong>
            </div>
            <div className="flex justify-between">
              <span>{isRTL ? 'رأس المال الأصلي:' : 'Principal:'}</span>
              <span>{formatCurrency(principal, currency)}</span>
            </div>
          </div>
        </div>

        {/* Compound Interest */}
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-emerald-400">
              📈 {isRTL ? 'الفائدة المركبة (Compound Interest)' : 'Compound Interest'}
            </span>
            <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-black text-emerald-300">
              +{formatCurrency(compoundInterest - simpleInterest, currency)} {isRTL ? 'إضافي' : 'more'}
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-400">
            {formatCurrency(compoundTotal, currency)}
          </div>
          <div className="text-xs text-emerald-300/80 space-y-1 pt-1 border-t border-emerald-900/40">
            <div className="flex justify-between">
              <span>{isRTL ? 'مبلغ الفائدة المركبة:' : 'Compound Interest:'}</span>
              <strong className="text-emerald-300">+{formatCurrency(compoundInterest, currency)}</strong>
            </div>
            <div className="flex justify-between">
              <span>{isRTL ? 'الزيادة عن البسيطة:' : 'Advantage over simple:'}</span>
              <span>{(((compoundTotal / simpleTotal) - 1) * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 2. 💳 حاسبة القروض (Loan Calculator)
export const LoanCalculatorTool: React.FC<ToolProps> = ({ currency, isRTL }) => {
  const [loanAmount, setLoanAmount] = useState<number>(100000);
  const [annualRate, setAnnualRate] = useState<number>(6);
  const [loanYears, setLoanYears] = useState<number>(5);
  const [showSchedule, setShowSchedule] = useState<boolean>(false);

  // Monthly payment calculation
  const totalMonths = loanYears * 12;
  const monthlyRate = annualRate > 0 ? (annualRate / 100) / 12 : 0;
  
  let monthlyPayment = 0;
  if (monthlyRate === 0) {
    monthlyPayment = loanAmount / totalMonths;
  } else {
    monthlyPayment = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
      (Math.pow(1 + monthlyRate, totalMonths) - 1);
  }

  const totalPaid = monthlyPayment * totalMonths;
  const totalInterest = Math.max(0, totalPaid - loanAmount);

  // Annual amortization breakdown
  const annualSchedule: Array<{ year: number; principalPaid: number; interestPaid: number; balance: number }> = [];
  let remaining = loanAmount;

  for (let yr = 1; yr <= loanYears; yr++) {
    let yearInterest = 0;
    let yearPrincipal = 0;
    for (let m = 0; m < 12; m++) {
      const int = remaining * monthlyRate;
      const prin = monthlyPayment - int;
      yearInterest += int;
      yearPrincipal += prin;
      remaining = Math.max(0, remaining - prin);
    }
    annualSchedule.push({
      year: yr,
      principalPaid: yearPrincipal,
      interestPaid: yearInterest,
      balance: remaining,
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-bold text-purple-300 block mb-1">
            {isRTL ? 'مبلغ القرض / التمويل' : 'Loan Amount'}
          </label>
          <input
            type="number"
            min="0"
            value={loanAmount}
            onChange={(e) => setLoanAmount(Math.max(0, parseFloat(e.target.value) || 0))}
            className="w-full rounded-xl border border-purple-900/50 bg-[#1c1c3c] p-2.5 text-sm font-bold text-white outline-none focus:border-purple-500"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-purple-300 block mb-1">
            {isRTL ? 'نسبة الفائدة / المرابحة السنوية (%)' : 'Annual Interest Rate (%)'}
          </label>
          <input
            type="number"
            step="0.1"
            min="0"
            value={annualRate}
            onChange={(e) => setAnnualRate(Math.max(0, parseFloat(e.target.value) || 0))}
            className="w-full rounded-xl border border-purple-900/50 bg-[#1c1c3c] p-2.5 text-sm font-bold text-white outline-none focus:border-purple-500"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-purple-300 block mb-1">
            {isRTL ? 'مدة السداد (سنوات)' : 'Loan Term (Years)'}
          </label>
          <input
            type="number"
            min="1"
            max="30"
            value={loanYears}
            onChange={(e) => setLoanYears(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full rounded-xl border border-purple-900/50 bg-[#1c1c3c] p-2.5 text-sm font-bold text-white outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* Main Results */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/25 p-4 text-center">
          <span className="text-[11px] font-bold text-emerald-300 block">
            {isRTL ? 'القسط الشهري' : 'Monthly Payment'}
          </span>
          <div className="text-2xl font-black text-emerald-400 mt-1">
            {formatCurrency(monthlyPayment, currency)}
          </div>
          <span className="text-[10px] text-purple-300/70 block mt-1">
            {totalMonths} {isRTL ? 'شهر سداد' : 'months'}
          </span>
        </div>

        <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4 text-center">
          <span className="text-[11px] font-bold text-amber-300 block">
            {isRTL ? 'إجمالي الفوائد / الأرباح' : 'Total Interest'}
          </span>
          <div className="text-2xl font-black text-amber-400 mt-1">
            {formatCurrency(totalInterest, currency)}
          </div>
          <span className="text-[10px] text-purple-300/70 block mt-1">
            {loanAmount > 0 ? ((totalInterest / loanAmount) * 100).toFixed(1) : 0}% {isRTL ? 'فوق المبلغ' : 'of principal'}
          </span>
        </div>

        <div className="rounded-2xl border border-purple-500/30 bg-purple-950/25 p-4 text-center">
          <span className="text-[11px] font-bold text-purple-300 block">
            {isRTL ? 'إجمالي ما ستدفعه' : 'Total Paid'}
          </span>
          <div className="text-2xl font-black text-white mt-1">
            {formatCurrency(totalPaid, currency)}
          </div>
          <span className="text-[10px] text-purple-300/70 block mt-1">
            {isRTL ? 'أصل القرض + الفوائد' : 'Principal + Interest'}
          </span>
        </div>
      </div>

      {/* Toggle Schedule */}
      <div>
        <button
          type="button"
          onClick={() => setShowSchedule(!showSchedule)}
          className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1"
        >
          <span>{showSchedule ? (isRTL ? 'إخفاء جدول السداد السنوي' : 'Hide Amortization') : (isRTL ? 'عرض جدول السداد السنوي التفصيلي' : 'View Annual Schedule')}</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${showSchedule ? 'rotate-180' : ''}`} />
        </button>

        {showSchedule && (
          <div className="mt-3 overflow-x-auto rounded-xl border border-purple-900/40 bg-[#161633]">
            <table className="w-full text-xs text-right">
              <thead>
                <tr className="border-b border-purple-900/50 bg-purple-950/40 text-purple-300">
                  <th className="p-2.5">{isRTL ? 'السنة' : 'Year'}</th>
                  <th className="p-2.5">{isRTL ? 'سداد الأصل' : 'Principal'}</th>
                  <th className="p-2.5">{isRTL ? 'الفوائد' : 'Interest'}</th>
                  <th className="p-2.5">{isRTL ? 'الرصيد المتبقي' : 'Remaining'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-900/30">
                {annualSchedule.map((row) => (
                  <tr key={row.year} className="hover:bg-purple-900/20">
                    <td className="p-2.5 font-bold text-white">{row.year}</td>
                    <td className="p-2.5 text-emerald-400">{formatCurrency(row.principalPaid, currency)}</td>
                    <td className="p-2.5 text-amber-400">{formatCurrency(row.interestPaid, currency)}</td>
                    <td className="p-2.5 font-mono text-purple-200">{formatCurrency(row.balance, currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// 3. 📈 حاسبة الاستثمار والنمو المركب (Investment Calculator)
export const InvestmentCalculatorTool: React.FC<ToolProps> = ({ currency, isRTL }) => {
  const [initialAmount, setInitialAmount] = useState<number>(10000);
  const [monthlyDeposit, setMonthlyDeposit] = useState<number>(1000);
  const [annualReturn, setAnnualReturn] = useState<number>(8);
  const [investYears, setInvestYears] = useState<number>(10);

  // Future value calculation with regular contributions
  // A = P*(1+r)^n + PMT * [ ((1+r)^n - 1) / r ]
  const monthlyRate = (annualReturn / 100) / 12;
  const totalMonths = investYears * 12;

  let futureValue = 0;
  if (monthlyRate === 0) {
    futureValue = initialAmount + monthlyDeposit * totalMonths;
  } else {
    futureValue = initialAmount * Math.pow(1 + monthlyRate, totalMonths) +
      monthlyDeposit * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate);
  }

  const totalContributions = initialAmount + (monthlyDeposit * totalMonths);
  const totalGains = Math.max(0, futureValue - totalContributions);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label className="text-xs font-bold text-purple-300 block mb-1">
            {isRTL ? 'رأس المال الأولي' : 'Initial Investment'}
          </label>
          <input
            type="number"
            min="0"
            value={initialAmount}
            onChange={(e) => setInitialAmount(Math.max(0, parseFloat(e.target.value) || 0))}
            className="w-full rounded-xl border border-purple-900/50 bg-[#1c1c3c] p-2.5 text-sm font-bold text-white outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-purple-300 block mb-1">
            {isRTL ? 'الإيداع الشهري المستمر' : 'Monthly Contribution'}
          </label>
          <input
            type="number"
            min="0"
            value={monthlyDeposit}
            onChange={(e) => setMonthlyDeposit(Math.max(0, parseFloat(e.target.value) || 0))}
            className="w-full rounded-xl border border-purple-900/50 bg-[#1c1c3c] p-2.5 text-sm font-bold text-white outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-purple-300 block mb-1">
            {isRTL ? 'العائد السنوي المتوقع (%)' : 'Expected Return (%)'}
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
        <div>
          <label className="text-xs font-bold text-purple-300 block mb-1">
            {isRTL ? 'المدة (سنوات)' : 'Years'}
          </label>
          <input
            type="number"
            min="1"
            max="40"
            value={investYears}
            onChange={(e) => setInvestYears(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full rounded-xl border border-purple-900/50 bg-[#1c1c3c] p-2.5 text-sm font-bold text-white outline-none"
          />
        </div>
      </div>

      {/* Main Result Card */}
      <div className="rounded-3xl border border-emerald-500/40 bg-gradient-to-r from-emerald-950/40 via-[#152a23] to-[#14142d] p-5 shadow-xl">
        <span className="text-xs font-bold text-emerald-300 block mb-1">
          {isRTL ? 'القيمة المستقبلية المتوقعة لمحفظتك الاستثمارية' : 'Projected Future Investment Value'}
        </span>
        <div className="text-3xl font-black text-emerald-400">
          {formatCurrency(futureValue, currency)}
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-emerald-900/40 text-xs">
          <div>
            <span className="text-purple-300/80 block">{isRTL ? 'إجمالي إيداعاتك:' : 'Total Invested:'}</span>
            <strong className="text-white text-base">{formatCurrency(totalContributions, currency)}</strong>
          </div>
          <div>
            <span className="text-emerald-300/80 block">{isRTL ? 'أرباح النمو المركب:' : 'Total Growth:'}</span>
            <strong className="text-emerald-400 text-base">+{formatCurrency(totalGains, currency)}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

// 4. 🧾 منشئ وحاسبة الفواتير (Invoice Calculator)
export const InvoiceCalculatorTool: React.FC<ToolProps> = ({ currency, isRTL }) => {
  interface Item {
    id: string;
    description: string;
    qty: number;
    price: number;
  }

  const [clientName, setClientName] = useState<string>('');
  const [invoiceNumber, setInvoiceNumber] = useState<string>('INV-' + Math.floor(1000 + Math.random() * 9000));
  const [taxRate, setTaxRate] = useState<number>(15);
  const [discount, setDiscount] = useState<number>(0);
  const [items, setItems] = useState<Item[]>([
    { id: '1', description: isRTL ? 'تصميم وتطوير واجهات' : 'UI/UX Design', qty: 1, price: 1200 },
    { id: '2', description: isRTL ? 'استضافة وصيانة سنوية' : 'Hosting & Maintenance', qty: 1, price: 300 },
  ]);

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { id: String(Date.now()), description: '', qty: 1, price: 0 },
    ]);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const updateItem = (id: string, field: keyof Item, val: any) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: val } : it))
    );
  };

  const subtotal = items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.price) || 0), 0);
  const discountedSubtotal = Math.max(0, subtotal - discount);
  const taxAmount = discountedSubtotal * (taxRate / 100);
  const total = discountedSubtotal + taxAmount;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Invoice Meta */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-bold text-purple-300 block mb-1">
            {isRTL ? 'اسم العميل / الجهة' : 'Client Name'}
          </label>
          <input
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder={isRTL ? 'شركة الأفق...' : 'Client name'}
            className="w-full rounded-xl border border-purple-900/50 bg-[#1c1c3c] p-2 text-xs font-bold text-white outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-purple-300 block mb-1">
            {isRTL ? 'رقم الفاتورة' : 'Invoice #'}
          </label>
          <input
            type="text"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            className="w-full rounded-xl border border-purple-900/50 bg-[#1c1c3c] p-2 text-xs font-bold text-white outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-purple-300 block mb-1">
            {isRTL ? 'نسبة الضريبة VAT (%)' : 'VAT Rate (%)'}
          </label>
          <select
            value={taxRate}
            onChange={(e) => setTaxRate(parseFloat(e.target.value))}
            className="w-full rounded-xl border border-purple-900/50 bg-[#1c1c3c] p-2 text-xs font-bold text-white outline-none"
          >
            <option value="15">15% ({isRTL ? 'السعودية' : 'KSA'})</option>
            <option value="5">5% ({isRTL ? 'الإمارات / عمان' : 'UAE/OMN'})</option>
            <option value="0">0% ({isRTL ? 'معفي' : 'Zero VAT'})</option>
          </select>
        </div>
      </div>

      {/* Items Table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-white">{isRTL ? 'بنود الفاتورة' : 'Invoice Items'}</span>
          <button
            type="button"
            onClick={addItem}
            className="flex items-center gap-1 rounded-lg bg-purple-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-purple-500"
          >
            <Plus className="h-3 w-3" />
            <span>{isRTL ? 'إضافة بند' : 'Add Item'}</span>
          </button>
        </div>

        <div className="space-y-2 max-h-56 overflow-y-auto">
          {items.map((it) => (
            <div key={it.id} className="flex items-center gap-2 rounded-xl bg-[#181838] p-2 text-xs border border-purple-900/40">
              <input
                type="text"
                placeholder={isRTL ? 'وصف البند...' : 'Item description'}
                value={it.description}
                onChange={(e) => updateItem(it.id, 'description', e.target.value)}
                className="flex-1 bg-transparent border-none text-white outline-none font-bold"
              />
              <input
                type="number"
                min="1"
                placeholder={isRTL ? 'الكمية' : 'Qty'}
                value={it.qty}
                onChange={(e) => updateItem(it.id, 'qty', Math.max(1, parseInt(e.target.value) || 1))}
                className="w-14 rounded-lg bg-[#101026] p-1.5 text-center text-white border border-purple-900/50"
              />
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder={isRTL ? 'السعر' : 'Price'}
                value={it.price}
                onChange={(e) => updateItem(it.id, 'price', Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-20 rounded-lg bg-[#101026] p-1.5 text-center text-white border border-purple-900/50"
              />
              <span className="w-20 text-center font-bold text-emerald-400">
                {formatCurrency((it.qty || 0) * (it.price || 0), currency)}
              </span>
              <button
                type="button"
                onClick={() => removeItem(it.id)}
                className="text-red-400 hover:text-red-300 p-1"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Summary calculation */}
      <div className="rounded-2xl border border-purple-900/50 bg-[#161633] p-4 text-xs font-bold space-y-2">
        <div className="flex justify-between text-purple-300">
          <span>{isRTL ? 'المجموع الفرعي:' : 'Subtotal:'}</span>
          <span>{formatCurrency(subtotal, currency)}</span>
        </div>
        <div className="flex justify-between items-center text-purple-300">
          <span>{isRTL ? 'الخصم:' : 'Discount:'}</span>
          <input
            type="number"
            min="0"
            value={discount}
            onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
            className="w-24 rounded-lg bg-[#101026] p-1 text-center text-white border border-purple-900/50"
          />
        </div>
        <div className="flex justify-between text-purple-300">
          <span>{isRTL ? `ضريبة القيمة المضافة (${taxRate}%):` : `VAT (${taxRate}%):`}</span>
          <span>+{formatCurrency(taxAmount, currency)}</span>
        </div>
        <div className="flex justify-between text-base font-black text-emerald-400 pt-2 border-t border-purple-900/40">
          <span>{isRTL ? 'الإجمالي النهائي:' : 'Grand Total:'}</span>
          <span>{formatCurrency(total, currency)}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={handlePrint}
        className="flex items-center justify-center gap-2 w-full rounded-xl bg-purple-600 py-2.5 text-xs font-bold text-white hover:bg-purple-500 shadow-md"
      >
        <Printer className="h-4 w-4" />
        <span>{isRTL ? 'طباعة / تصدير الفاتورة' : 'Print Invoice'}</span>
      </button>
    </div>
  );
};

export const InvoiceGeneratorTool = InvoiceCalculatorTool;

// 5. 💵 حاسبة الإكرامية وتقسيم الفاتورة (Tip & Split Calculator)
export const TipCalculatorTool: React.FC<ToolProps> = ({ currency, isRTL }) => {
  const [billAmount, setBillAmount] = useState<number>(250);
  const [tipPercent, setTipPercent] = useState<number>(15);
  const [numPeople, setNumPeople] = useState<number>(3);

  const tipAmount = (billAmount * tipPercent) / 100;
  const totalAmount = billAmount + tipAmount;
  const perPersonTotal = numPeople > 0 ? totalAmount / numPeople : totalAmount;
  const perPersonTip = numPeople > 0 ? tipAmount / numPeople : tipAmount;

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-bold text-purple-300 block mb-1">
          {isRTL ? 'مبلغ الفاتورة الأساسي' : 'Bill Amount'}
        </label>
        <input
          type="number"
          min="0"
          value={billAmount}
          onChange={(e) => setBillAmount(Math.max(0, parseFloat(e.target.value) || 0))}
          className="w-full rounded-xl border border-purple-900/50 bg-[#1c1c3c] p-3 text-lg font-black text-white outline-none"
        />
      </div>

      {/* Tip presets */}
      <div>
        <label className="text-xs font-bold text-purple-300 block mb-1">
          {isRTL ? 'نسبة الإكرامية (%)' : 'Tip Percentage (%)'}
        </label>
        <div className="grid grid-cols-5 gap-1.5">
          {[0, 10, 15, 20, 25].map((pct) => (
            <button
              key={pct}
              type="button"
              onClick={() => setTipPercent(pct)}
              className={`py-2 rounded-xl text-xs font-bold transition-all ${
                tipPercent === pct
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-[#181838] text-purple-300 hover:text-white'
              }`}
            >
              {pct}%
            </button>
          ))}
        </div>
      </div>

      {/* Number of people */}
      <div>
        <label className="text-xs font-bold text-purple-300 block mb-1">
          {isRTL ? 'عدد الأشخاص المشاركين' : 'Split Among (People)'}
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="1"
            max="50"
            value={numPeople}
            onChange={(e) => setNumPeople(Math.max(1, parseInt(e.target.value) || 1))}
            className="flex-1 rounded-xl border border-purple-900/50 bg-[#1c1c3c] p-2.5 text-center text-sm font-black text-white outline-none"
          />
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 text-center">
          <span className="text-[11px] font-bold text-emerald-300 block">
            {isRTL ? 'المبلغ المطلوب من كل شخص' : 'Per Person Total'}
          </span>
          <div className="text-2xl font-black text-emerald-400 mt-1">
            {formatCurrency(perPersonTotal, currency)}
          </div>
          <span className="text-[10px] text-purple-300/70 block mt-1">
            {isRTL ? 'يشمل الإكرامية' : 'includes tip'} ({formatCurrency(perPersonTip, currency)})
          </span>
        </div>

        <div className="rounded-2xl border border-purple-500/30 bg-purple-950/20 p-4 text-center">
          <span className="text-[11px] font-bold text-purple-300 block">
            {isRTL ? 'إجمالي الفاتورة مع الإكرامية' : 'Grand Total'}
          </span>
          <div className="text-2xl font-black text-white mt-1">
            {formatCurrency(totalAmount, currency)}
          </div>
          <span className="text-[10px] text-purple-300/70 block mt-1">
            +{formatCurrency(tipAmount, currency)} {isRTL ? 'إكرامية' : 'tip'}
          </span>
        </div>
      </div>
    </div>
  );
};

// 6. 🏷️ حاسبة مقارنة الأسعار وسعر الوحدة (Price Comparison Tool)
export const PriceComparisonTool: React.FC<ToolProps> = ({ currency, isRTL }) => {
  const [productA, setProductA] = useState({ name: isRTL ? 'المنتج (أ)' : 'Product A', price: 25, qty: 500 });
  const [productB, setProductB] = useState({ name: isRTL ? 'المنتج (ب)' : 'Product B', price: 18, qty: 300 });
  const [unitType, setUnitType] = useState<string>(isRTL ? 'جرام' : 'grams');

  const unitPriceA = productA.qty > 0 ? productA.price / productA.qty : 0;
  const unitPriceB = productB.qty > 0 ? productB.price / productB.qty : 0;

  const diffPercent = unitPriceA > 0 && unitPriceB > 0
    ? Math.abs(((unitPriceA - unitPriceB) / Math.max(unitPriceA, unitPriceB)) * 100)
    : 0;

  const winner = unitPriceA < unitPriceB ? 'A' : unitPriceB < unitPriceA ? 'B' : 'equal';

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {['جرام', 'مل', 'لتر', 'كيلوجرام', 'قطعة'].map((u) => (
          <button
            key={u}
            type="button"
            onClick={() => setUnitType(u)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold ${
              unitType === u ? 'bg-purple-600 text-white' : 'bg-[#181838] text-purple-300'
            }`}
          >
            {u}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Product A */}
        <div className={`rounded-2xl border p-4 space-y-2 ${
          winner === 'A' ? 'border-emerald-500 bg-emerald-950/20 shadow-lg shadow-emerald-500/20' : 'border-purple-900/40 bg-[#161633]'
        }`}>
          <div className="flex justify-between items-center">
            <span className="text-xs font-black text-white">{productA.name}</span>
            {winner === 'A' && (
              <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-black text-emerald-300">
                🏆 {isRTL ? 'الأوفر والأرخص!' : 'Best Value!'}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-purple-300 block mb-0.5">{isRTL ? 'السعر' : 'Price'}</label>
              <input
                type="number"
                min="0"
                value={productA.price}
                onChange={(e) => setProductA({ ...productA, price: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-lg bg-[#101026] p-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[10px] text-purple-300 block mb-0.5">{isRTL ? 'الكمية' : 'Quantity'}</label>
              <input
                type="number"
                min="1"
                value={productA.qty}
                onChange={(e) => setProductA({ ...productA, qty: parseFloat(e.target.value) || 1 })}
                className="w-full rounded-lg bg-[#101026] p-2 text-xs text-white"
              />
            </div>
          </div>
          <div className="pt-2 border-t border-purple-900/30 text-xs">
            <span className="text-purple-300/70">{isRTL ? 'سعر الوحدة:' : 'Unit price:'} </span>
            <strong className="text-white">{unitPriceA.toFixed(4)} {currency}/{unitType}</strong>
          </div>
        </div>

        {/* Product B */}
        <div className={`rounded-2xl border p-4 space-y-2 ${
          winner === 'B' ? 'border-emerald-500 bg-emerald-950/20 shadow-lg shadow-emerald-500/20' : 'border-purple-900/40 bg-[#161633]'
        }`}>
          <div className="flex justify-between items-center">
            <span className="text-xs font-black text-white">{productB.name}</span>
            {winner === 'B' && (
              <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-black text-emerald-300">
                🏆 {isRTL ? 'الأوفر والأرخص!' : 'Best Value!'}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-purple-300 block mb-0.5">{isRTL ? 'السعر' : 'Price'}</label>
              <input
                type="number"
                min="0"
                value={productB.price}
                onChange={(e) => setProductB({ ...productB, price: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-lg bg-[#101026] p-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[10px] text-purple-300 block mb-0.5">{isRTL ? 'الكمية' : 'Quantity'}</label>
              <input
                type="number"
                min="1"
                value={productB.qty}
                onChange={(e) => setProductB({ ...productB, qty: parseFloat(e.target.value) || 1 })}
                className="w-full rounded-lg bg-[#101026] p-2 text-xs text-white"
              />
            </div>
          </div>
          <div className="pt-2 border-t border-purple-900/30 text-xs">
            <span className="text-purple-300/70">{isRTL ? 'سعر الوحدة:' : 'Unit price:'} </span>
            <strong className="text-white">{unitPriceB.toFixed(4)} {currency}/{unitType}</strong>
          </div>
        </div>
      </div>

      {winner !== 'equal' && diffPercent > 0 && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3 text-center text-xs font-bold text-emerald-300">
          💡 {isRTL ? `المنتج (${winner}) أوفر بنسبة ${diffPercent.toFixed(1)}% بالنسبة لسعر الوحدة!` : `Product ${winner} is ${diffPercent.toFixed(1)}% cheaper per unit!`}
        </div>
      )}
    </div>
  );
};
