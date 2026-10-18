import React, { useState, useEffect } from 'react';
import { AppState } from '../../types';
import { formatCurrency } from '../../services/i18n';
import {
  Compass,
  Bot,
  Calendar,
  KeyRound,
  FileText,
  Copy,
  Check,
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  ArrowRightLeft,
  Search,
} from 'lucide-react';

interface ToolProps {
  currency: string;
  isRTL: boolean;
  state?: AppState;
}

// 16. 📐 محول الوحدات الشامل (Unit Converter)
export const UnitConverterTool: React.FC<ToolProps> = ({ isRTL }) => {
  type Category = 'length' | 'weight' | 'area' | 'temp' | 'data';

  const [category, setCategory] = useState<Category>('length');
  const [val, setVal] = useState<number>(1);
  const [fromUnit, setFromUnit] = useState<string>('m');
  const [toUnit, setToUnit] = useState<string>('ft');

  // Conversion rates to base unit
  const conversions: Record<Category, { base: string; units: Record<string, { name: string; rate: number }> }> = {
    length: {
      base: 'm',
      units: {
        m: { name: isRTL ? 'متر (m)' : 'Meters', rate: 1 },
        km: { name: isRTL ? 'كيلومتر (km)' : 'Kilometers', rate: 1000 },
        cm: { name: isRTL ? 'سنتيمتر (cm)' : 'Centimeters', rate: 0.01 },
        mm: { name: isRTL ? 'مليمتر (mm)' : 'Millimeters', rate: 0.001 },
        ft: { name: isRTL ? 'قدم (ft)' : 'Feet', rate: 0.3048 },
        in: { name: isRTL ? 'بوصة (in)' : 'Inches', rate: 0.0254 },
        mi: { name: isRTL ? 'ميل (mi)' : 'Miles', rate: 1609.34 },
      },
    },
    weight: {
      base: 'kg',
      units: {
        kg: { name: isRTL ? 'كيلوجرام (kg)' : 'Kilograms', rate: 1 },
        g: { name: isRTL ? 'جرام (g)' : 'Grams', rate: 0.001 },
        mg: { name: isRTL ? 'مليجرام (mg)' : 'Milligrams', rate: 0.000001 },
        lb: { name: isRTL ? 'رطل / باوند (lb)' : 'Pounds', rate: 0.453592 },
        oz: { name: isRTL ? 'أونصة (oz)' : 'Ounces', rate: 0.0283495 },
        ton: { name: isRTL ? 'طن متري (t)' : 'Metric Tons', rate: 1000 },
      },
    },
    area: {
      base: 'm2',
      units: {
        m2: { name: isRTL ? 'متر مربع (m²)' : 'Square Meters', rate: 1 },
        km2: { name: isRTL ? 'كيلومتر مربع (km²)' : 'Square Kilometers', rate: 1000000 },
        sqft: { name: isRTL ? 'قدم مربع (sq ft)' : 'Square Feet', rate: 0.092903 },
        acre: { name: isRTL ? 'فدان / أكر' : 'Acres', rate: 4046.86 },
        hectare: { name: isRTL ? 'هكتار (ha)' : 'Hectares', rate: 10000 },
      },
    },
    temp: {
      base: 'c',
      units: {
        c: { name: isRTL ? 'درجة مئوية (°C)' : 'Celsius', rate: 1 },
        f: { name: isRTL ? 'فهرنهايت (°F)' : 'Fahrenheit', rate: 1 },
        k: { name: isRTL ? 'كلفن (K)' : 'Kelvin', rate: 1 },
      },
    },
    data: {
      base: 'mb',
      units: {
        b: { name: 'Bytes (B)', rate: 0.000001 },
        kb: { name: 'Kilobytes (KB)', rate: 0.001 },
        mb: { name: 'Megabytes (MB)', rate: 1 },
        gb: { name: 'Gigabytes (GB)', rate: 1000 },
        tb: { name: 'Terabytes (TB)', rate: 1000000 },
      },
    },
  };

  const handleCategoryChange = (cat: Category) => {
    setCategory(cat);
    const u = Object.keys(conversions[cat].units);
    setFromUnit(u[0]);
    setToUnit(u[1] || u[0]);
  };

  // Convert calculation
  const calculateResult = (): number => {
    if (category === 'temp') {
      if (fromUnit === toUnit) return val;
      // Convert from -> Celsius
      let celsius = val;
      if (fromUnit === 'f') celsius = (val - 32) * (5 / 9);
      if (fromUnit === 'k') celsius = val - 273.15;

      // Celsius -> to
      if (toUnit === 'c') return celsius;
      if (toUnit === 'f') return celsius * (9 / 5) + 32;
      if (toUnit === 'k') return celsius + 273.15;
      return celsius;
    }

    const curCat = conversions[category];
    const fromRate = curCat.units[fromUnit]?.rate || 1;
    const toRate = curCat.units[toUnit]?.rate || 1;
    const baseValue = val * fromRate;
    return baseValue / toRate;
  };

  const result = calculateResult();

  return (
    <div className="space-y-4">
      {/* Category Pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {[
          { id: 'length', label: isRTL ? '📏 الطول' : 'Length' },
          { id: 'weight', label: isRTL ? '⚖️ الوزن' : 'Weight' },
          { id: 'area', label: isRTL ? '📐 المساحة' : 'Area' },
          { id: 'temp', label: isRTL ? '🌡️ الحرارة' : 'Temperature' },
          { id: 'data', label: isRTL ? '💾 البيانات' : 'Data' },
        ].map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => handleCategoryChange(c.id as Category)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              category === c.id ? 'bg-purple-600 text-white shadow-md' : 'bg-[#181838] text-purple-300'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div>
        <label className="text-xs font-bold text-purple-300 block mb-1">
          {isRTL ? 'القيمة المراد تحويلها' : 'Value'}
        </label>
        <input
          type="number"
          value={val}
          onChange={(e) => setVal(parseFloat(e.target.value) || 0)}
          className="w-full rounded-xl border border-purple-900/50 bg-[#1c1c3c] p-2.5 text-base font-black text-white outline-none"
        />
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1">
          <label className="text-[10px] text-purple-300 block mb-1">{isRTL ? 'من وحدة' : 'From'}</label>
          <select
            value={fromUnit}
            onChange={(e) => setFromUnit(e.target.value)}
            className="w-full rounded-xl border border-purple-900/50 bg-[#1c1c3c] p-2 text-xs font-bold text-white outline-none"
          >
            {Object.entries(conversions[category].units).map(([uKey, uData]) => (
              <option key={uKey} value={uKey}>
                {uData.name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => {
            const temp = fromUnit;
            setFromUnit(toUnit);
            setToUnit(temp);
          }}
          className="mt-4 flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600 text-white shadow-md hover:bg-purple-500"
        >
          <ArrowRightLeft className="h-4 w-4" />
        </button>

        <div className="flex-1">
          <label className="text-[10px] text-purple-300 block mb-1">{isRTL ? 'إلى وحدة' : 'To'}</label>
          <select
            value={toUnit}
            onChange={(e) => setToUnit(e.target.value)}
            className="w-full rounded-xl border border-purple-900/50 bg-[#1c1c3c] p-2 text-xs font-bold text-white outline-none"
          >
            {Object.entries(conversions[category].units).map(([uKey, uData]) => (
              <option key={uKey} value={uKey}>
                {uData.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Result Display */}
      <div className="rounded-2xl border border-cyan-500/40 bg-cyan-950/20 p-5 text-center shadow-lg">
        <span className="text-xs font-bold text-cyan-300 block mb-1">
          {isRTL ? 'النتيجة بعد التحويل:' : 'Converted Result:'}
        </span>
        <div className="text-3xl font-black text-cyan-400">
          {Number.isInteger(result) ? result : result.toFixed(4)}{' '}
          <span className="text-base font-bold text-white">
            {conversions[category].units[toUnit]?.name}
          </span>
        </div>
      </div>
    </div>
  );
};

// 17. 🤖 المستشار المالي الذكي (AI Financial Advisor)
export const AiAdvisorTool: React.FC<ToolProps> = ({ currency, isRTL, state }) => {
  if (!state) return null;

  // Real data analysis
  const totalIncome = state.transactions
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = state.transactions
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + Number(t.amount), 0);
  const balance = totalIncome - totalExpense;

  const totalDebts = state.debts
    .filter((d) => d.type === 'debt')
    .reduce((s, d) => s + Number(d.amount), 0);
  const totalReceivables = state.debts
    .filter((d) => d.type === 'receivable')
    .reduce((s, d) => s + Number(d.amount), 0);

  const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100) : 0;

  // Category insights
  const catExpenses: Record<string, number> = {};
  state.transactions.filter((t) => t.type === 'expense').forEach((t) => {
    const cat = state.categories.find((c) => c.id === t.category);
    const name = cat?.name || 'عام';
    catExpenses[name] = (catExpenses[name] || 0) + Number(t.amount);
  });
  const topExpenseCategory = Object.entries(catExpenses).sort((a, b) => b[1] - a[1])[0];

  // Generate smart recommendations
  const tips: Array<{ icon: string; title: string; desc: string; type: 'success' | 'warning' | 'info' }> = [];

  if (savingsRate >= 20) {
    tips.push({
      icon: '🌟',
      title: isRTL ? 'معدل ادخار ممتاز (+20%)' : 'Excellent Savings Rate',
      desc: isRTL
        ? `أنت تدخر ${savingsRate.toFixed(1)}% من دخلك! ننصحك بتوجيه الفائض نحو الاستثمار أو صندوق الطوارئ.`
        : `You are saving ${savingsRate.toFixed(1)}% of your income. Great work!`,
      type: 'success',
    });
  } else if (savingsRate > 0) {
    tips.push({
      icon: '💡',
      title: isRTL ? 'فرصة لزيادة الادخار' : 'Savings Improvement',
      desc: isRTL
        ? `معدل ادخارك الحالي ${savingsRate.toFixed(1)}%. حاول اتباع قاعدة 50/30/20 لرفع الادخار إلى 20%.`
        : `Your savings rate is ${savingsRate.toFixed(1)}%. Try aiming for 20%.`,
      type: 'info',
    });
  } else {
    tips.push({
      icon: '⚠️',
      title: isRTL ? 'تنبيه عجز مالي' : 'Deficit Alert',
      desc: isRTL
        ? `مصروفاتك تتجاوز دخلك بـ ${formatCurrency(Math.abs(balance), currency)}. راجع فئات النفقات فوراً.`
        : `Expenses exceed income by ${formatCurrency(Math.abs(balance), currency)}.`,
      type: 'warning',
    });
  }

  if (topExpenseCategory && totalExpense > 0) {
    const pct = ((topExpenseCategory[1] / totalExpense) * 100).toFixed(0);
    tips.push({
      icon: '📊',
      title: isRTL ? `أعلى استهلاك: ${topExpenseCategory[0]}` : `Top Expense: ${topExpenseCategory[0]}`,
      desc: isRTL
        ? `تمثل فئة "${topExpenseCategory[0]}" نسبة ${pct}% من مجموع مصروفاتك (${formatCurrency(topExpenseCategory[1], currency)}).`
        : `Category "${topExpenseCategory[0]}" represents ${pct}% of your outgoings.`,
      type: 'info',
    });
  }

  if (totalDebts > 0) {
    tips.push({
      icon: '💳',
      title: isRTL ? 'استراتيجية تسديد الديون' : 'Debt Elimination Advice',
      desc: isRTL
        ? `لديك التزامات ديون بقيمة ${formatCurrency(totalDebts, currency)}. استخدم أداة "مخطط سداد الديون" بطريقة كرة الثلج لسدادها بأسرع وقت.`
        : `You have ${formatCurrency(totalDebts, currency)} in debt. Plan your payoff.`,
      type: 'warning',
    });
  }

  if (state.financialGoals.length === 0) {
    tips.push({
      icon: '🎯',
      title: isRTL ? 'حدد أهدافك المالية' : 'Set Financial Goals',
      desc: isRTL
        ? 'لم تسجل أهدافاً ادخارية بعد! جرب إضافة هدف لصندوق الطوارئ أو شراء أصل في تبويب المعلومات.'
        : 'Set savings goals to stay motivated.',
      type: 'info',
    });
  }

  return (
    <div className="space-y-4">
      {/* Overview Banner */}
      <div className="rounded-3xl border border-purple-500/30 bg-gradient-to-r from-purple-950/40 via-[#181135] to-[#121228] p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 shadow-md text-white">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <h4 className="text-sm font-black text-white">
              {isRTL ? 'تحليل بيانات محفظتك وتوصيات المستشار' : 'Portfolio AI Audit & Recommendations'}
            </h4>
            <p className="text-[11px] text-purple-300/80">
              {isRTL ? `تحليل مباشر مبني على ${state.transactions.length} معاملة مسجلة في IndexedDB` : 'Live analysis of your local financial data'}
            </p>
          </div>
        </div>
      </div>

      {/* Generated Tips */}
      <div className="space-y-2.5">
        {tips.map((tip, idx) => (
          <div
            key={idx}
            className={`rounded-2xl border p-4 space-y-1 ${
              tip.type === 'success'
                ? 'border-emerald-500/40 bg-emerald-950/20'
                : tip.type === 'warning'
                ? 'border-amber-500/40 bg-amber-950/20'
                : 'border-purple-800/40 bg-purple-950/20'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{tip.icon}</span>
              <h5 className="text-xs font-black text-white">{tip.title}</h5>
            </div>
            <p className="text-xs text-purple-200/80 leading-relaxed pr-6">{tip.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// 18. 📅 محول التاريخ وحساب العمر (Date & Hijri Converter)
export const DateConverterTool: React.FC<ToolProps> = ({ isRTL }) => {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [birthDate, setBirthDate] = useState<string>('1995-05-15');

  // Hijri conversion using Intl.DateTimeFormat with islamic-umalqura calendar
  const getHijriDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const formatter = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      return formatter.format(d);
    } catch {
      return '--';
    }
  };

  // Age calculation
  const calculateAge = (bDateStr: string) => {
    try {
      const birth = new Date(bDateStr);
      const now = new Date();
      let years = now.getFullYear() - birth.getFullYear();
      let months = now.getMonth() - birth.getMonth();
      let days = now.getDate() - birth.getDate();

      if (days < 0) {
        months -= 1;
        days += new Date(now.getFullYear(), now.getMonth(), 0).getDate();
      }
      if (months < 0) {
        years -= 1;
        months += 12;
      }

      const totalDays = Math.floor((now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24));
      return { years, months, days, totalDays };
    } catch {
      return { years: 0, months: 0, days: 0, totalDays: 0 };
    }
  };

  const age = calculateAge(birthDate);

  return (
    <div className="space-y-4">
      {/* 1. Date to Hijri */}
      <div className="rounded-2xl border border-purple-900/40 bg-[#161633] p-4 space-y-3">
        <label className="text-xs font-bold text-purple-300 block">
          📅 {isRTL ? 'تحويل التاريخ الميلادي إلى التاريخ الهجري' : 'Gregorian to Hijri Converter'}
        </label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-full rounded-xl border border-purple-900/50 bg-[#101026] p-2.5 text-xs text-white"
        />

        <div className="rounded-xl bg-purple-950/40 p-3 text-center border border-purple-800/40">
          <span className="text-[10px] text-purple-300 block mb-0.5">{isRTL ? 'التاريخ الهجري المقابل:' : 'Hijri Date:'}</span>
          <span className="text-base font-black text-emerald-400">
            {getHijriDate(selectedDate)}
          </span>
        </div>
      </div>

      {/* 2. Age Calculator */}
      <div className="rounded-2xl border border-purple-900/40 bg-[#161633] p-4 space-y-3">
        <label className="text-xs font-bold text-purple-300 block">
          🎂 {isRTL ? 'حاسبة العمر الدقيق' : 'Exact Age Calculator'}
        </label>
        <input
          type="date"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
          className="w-full rounded-xl border border-purple-900/50 bg-[#101026] p-2.5 text-xs text-white"
        />

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-[#101026] p-2.5 border border-purple-900/40">
            <span className="text-lg font-black text-white">{age.years}</span>
            <span className="text-[10px] text-purple-300 block">{isRTL ? 'سنة' : 'Years'}</span>
          </div>
          <div className="rounded-xl bg-[#101026] p-2.5 border border-purple-900/40">
            <span className="text-lg font-black text-white">{age.months}</span>
            <span className="text-[10px] text-purple-300 block">{isRTL ? 'شهر' : 'Months'}</span>
          </div>
          <div className="rounded-xl bg-[#101026] p-2.5 border border-purple-900/40">
            <span className="text-lg font-black text-white">{age.days}</span>
            <span className="text-[10px] text-purple-300 block">{isRTL ? 'يوم' : 'Days'}</span>
          </div>
        </div>

        <div className="text-center text-[11px] text-purple-300/70 pt-1">
          {isRTL ? `عشت ما يقارب ${age.totalDays.toLocaleString()} يوماً بحمد الله.` : `You have lived approx ${age.totalDays.toLocaleString()} days.`}
        </div>
      </div>
    </div>
  );
};

// 19. 🔐 مولد كلمات المرور (Password Generator)
export const PasswordGeneratorTool: React.FC<ToolProps> = ({ isRTL }) => {
  const [length, setLength] = useState<number>(14);
  const [includeUppercase, setIncludeUppercase] = useState<boolean>(true);
  const [includeNumbers, setIncludeNumbers] = useState<boolean>(true);
  const [includeSymbols, setIncludeSymbols] = useState<boolean>(true);
  const [password, setPassword] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const generate = () => {
    let chars = 'abcdefghijklmnopqrstuvwxyz';
    if (includeUppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeNumbers) chars += '0123456789';
    if (includeSymbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    let result = '';
    const array = new Uint32Array(length);
    window.crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
      result += chars[array[i] % chars.length];
    }
    setPassword(result);
  };

  useEffect(() => {
    generate();
  }, [length, includeUppercase, includeNumbers, includeSymbols]);

  const copyPassword = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Password display */}
      <div className="relative rounded-2xl border border-purple-700/50 bg-[#101026] p-4 flex items-center justify-between">
        <span className="font-mono text-base font-black tracking-wider text-emerald-400 break-all select-all">
          {password}
        </span>
        <button
          type="button"
          onClick={copyPassword}
          className="ml-2 flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600 text-white shadow-md hover:bg-purple-500 shrink-0"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>

      {/* Length slider */}
      <div>
        <div className="flex justify-between text-xs font-bold text-purple-300 mb-1">
          <span>{isRTL ? 'طول كلمة المرور:' : 'Password Length:'}</span>
          <span className="text-white font-mono">{length}</span>
        </div>
        <input
          type="range"
          min="8"
          max="32"
          value={length}
          onChange={(e) => setLength(parseInt(e.target.value))}
          className="w-full accent-purple-600 cursor-pointer"
        />
      </div>

      {/* Checkbox controls */}
      <div className="grid grid-cols-3 gap-2">
        <label className="flex items-center gap-2 rounded-xl bg-[#181838] p-2.5 text-xs text-purple-200 cursor-pointer">
          <input
            type="checkbox"
            checked={includeUppercase}
            onChange={(e) => setIncludeUppercase(e.target.checked)}
            className="accent-purple-600"
          />
          <span>A-Z</span>
        </label>
        <label className="flex items-center gap-2 rounded-xl bg-[#181838] p-2.5 text-xs text-purple-200 cursor-pointer">
          <input
            type="checkbox"
            checked={includeNumbers}
            onChange={(e) => setIncludeNumbers(e.target.checked)}
            className="accent-purple-600"
          />
          <span>0-9</span>
        </label>
        <label className="flex items-center gap-2 rounded-xl bg-[#181838] p-2.5 text-xs text-purple-200 cursor-pointer">
          <input
            type="checkbox"
            checked={includeSymbols}
            onChange={(e) => setIncludeSymbols(e.target.checked)}
            className="accent-purple-600"
          />
          <span>!@#$</span>
        </label>
      </div>

      <button
        type="button"
        onClick={generate}
        className="w-full rounded-xl bg-purple-600 py-2.5 text-xs font-bold text-white hover:bg-purple-500 shadow-md"
      >
        🔄 {isRTL ? 'توليد كلمة مرور جديدة' : 'Regenerate Password'}
      </button>
    </div>
  );
};

// 20. 📝 مفكرة مالية سريعة (Quick Financial Notes)
export const QuickNotesTool: React.FC<ToolProps> = ({ isRTL }) => {
  interface Note {
    id: string;
    text: string;
    tag: string;
    date: string;
  }

  const [notes, setNotes] = useState<Note[]>(() => {
    try {
      const stored = localStorage.getItem('wallet_quick_notes');
      return stored ? JSON.parse(stored) : [
        { id: '1', text: 'شراء أسهم استثمارية عند نزول المؤشر', tag: 'استثمار', date: new Date().toLocaleDateString('ar-SA') },
        { id: '2', text: 'سداد فاتورة الإنترنت قبل تاريخ 25', tag: 'فواتير', date: new Date().toLocaleDateString('ar-SA') }
      ];
    } catch {
      return [];
    }
  });

  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [inputText, setInputText] = useState<string>('');
  const [inputTag, setInputTag] = useState<string>('عام');

  useEffect(() => {
    try {
      localStorage.setItem('wallet_quick_notes', JSON.stringify(notes));
    } catch {}
  }, [notes]);

  const saveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    if (editingNoteId) {
      setNotes((prev) =>
        prev.map((n) =>
          n.id === editingNoteId
            ? { ...n, text: inputText.trim(), tag: inputTag.trim() || 'عام' }
            : n
        )
      );
      setEditingNoteId(null);
    } else {
      const newN: Note = {
        id: String(Date.now()),
        text: inputText.trim(),
        tag: inputTag.trim() || 'عام',
        date: new Date().toLocaleDateString(isRTL ? 'ar-SA' : 'en-US'),
      };
      setNotes([newN, ...notes]);
    }

    setInputText('');
  };

  const startEditNote = (n: Note) => {
    setEditingNoteId(n.id);
    setInputText(n.text);
    setInputTag(n.tag);
  };

  const cancelEdit = () => {
    setEditingNoteId(null);
    setInputText('');
  };

  const deleteNote = (id: string) => {
    if (editingNoteId === id) {
      setEditingNoteId(null);
      setInputText('');
    }
    setNotes(notes.filter((n) => n.id !== id));
  };

  return (
    <div className="space-y-4">
      {/* Input Form */}
      <form onSubmit={saveNote} className="space-y-2">
        <textarea
          rows={2}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={isRTL ? 'اكتب ملاحظتك المالية السريعة أو فكرة استثمار...' : 'Write your financial note...'}
          className="w-full rounded-xl border border-purple-900/50 bg-[#1c1c3c] p-2.5 text-xs text-white outline-none focus:border-purple-500"
        />

        <div className="flex gap-2">
          <select
            value={inputTag}
            onChange={(e) => setInputTag(e.target.value)}
            className="rounded-xl border border-purple-900/50 bg-[#1c1c3c] px-3 py-1.5 text-xs text-white outline-none"
          >
            <option value="عام">{isRTL ? '🏷️ عام' : 'General'}</option>
            <option value="استثمار">{isRTL ? '📈 استثمار' : 'Investment'}</option>
            <option value="فواتير">{isRTL ? '🧾 فواتير' : 'Bills'}</option>
            <option value="عمل">{isRTL ? '💼 عمل' : 'Work'}</option>
            <option value="فكرة">{isRTL ? '💡 فكرة' : 'Idea'}</option>
          </select>

          <button
            type="submit"
            className="flex-1 rounded-xl bg-purple-600 py-1.5 text-xs font-bold text-white hover:bg-purple-500 shadow-md"
          >
            {editingNoteId ? (isRTL ? 'حفظ التعديل' : 'Update Note') : (isRTL ? '+ حفظ الملاحظة' : '+ Save Note')}
          </button>
          {editingNoteId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded-xl border border-purple-900/50 bg-[#1c1c3c] px-3 py-1.5 text-xs font-bold text-purple-300"
            >
              {isRTL ? 'إلغاء' : 'Cancel'}
            </button>
          )}
        </div>
      </form>

      {/* Notes list */}
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {notes.length === 0 ? (
          <p className="text-center text-xs text-purple-300/50 py-4">{isRTL ? 'لا توجد ملاحظات محفوظة' : 'No notes saved'}</p>
        ) : (
          notes.map((n) => (
            <div key={n.id} className="rounded-xl border border-purple-900/40 bg-[#161633] p-3 text-xs space-y-1">
              <div className="flex justify-between items-center">
                <span className="rounded bg-purple-900/50 px-2 py-0.5 text-[10px] font-bold text-purple-300">
                  {n.tag}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-purple-300/60">{n.date}</span>
                  <button
                    type="button"
                    onClick={() => startEditNote(n)}
                    className="text-purple-300 hover:text-white"
                    title={isRTL ? 'تعديل' : 'Edit'}
                  >
                    <Edit2 className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteNote(n.id)}
                    className="text-red-400 hover:text-red-300"
                    title={isRTL ? 'حذف' : 'Delete'}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <p className="text-white font-medium whitespace-pre-wrap">{n.text}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
