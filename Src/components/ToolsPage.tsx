import React, { useState, useEffect, useMemo } from 'react';
import { AppState, NotebookNode, StandardNote, MindMap } from '../types';
import { NotebooksPage } from './NotebooksPage';
import {
  Wrench,
  Calculator as CalcIcon,
  RefreshCw,
  Percent,
  Landmark,
  CreditCard,
  TrendingUp,
  Receipt,
  Coffee,
  Scale,
  Target,
  ShieldAlert,
  Flame,
  BarChart3,
  Layers,
  Clock,
  Compass,
  Bot,
  Calendar,
  KeyRound,
  FileText,
  Search,
  Star,
  ArrowRight,
  ArrowLeft,
  X,
  ArrowRightLeft,
  BookOpen,
} from 'lucide-react';

import {
  InterestCalculatorTool,
  LoanCalculatorTool,
  InvestmentCalculatorTool,
  InvoiceGeneratorTool,
  TipCalculatorTool,
  PriceComparisonTool,
} from './tools/FinancialTools';

import {
  SavingsPlannerTool,
  RetirementCalculatorTool,
  EmergencyFundTool,
  DebtPayoffPlannerTool,
} from './tools/PlanningTools';

import {
  BreakEvenTool,
  ProfitMarginTool,
  RoiCalculatorTool,
  MaterialsCalculatorTool,
  ProjectTimeEstimatorTool,
} from './tools/BusinessTools';

import {
  UnitConverterTool,
  AiAdvisorTool,
  DateConverterTool,
  PasswordGeneratorTool,
  QuickNotesTool,
} from './tools/SmartAndUtilityTools';

interface ToolsPageProps {
  state: AppState;
  onUpdateExchangeRates: (rates: Record<string, number>) => void;
  onSaveNotebooks: (notebooks: NotebookNode[]) => void;
  onSaveStandardNotes: (standardNotes: StandardNote[]) => void;
  onSaveMindMaps: (mindMaps: MindMap[]) => void;
  language: 'ar' | 'en';
}

type ToolCategory = 'all' | 'fav' | 'financial' | 'planning' | 'business' | 'conversion' | 'smart';

interface ToolItem {
  id: string;
  nameAr: string;
  nameEn: string;
  category: ToolCategory;
  icon: React.ReactNode;
  descAr: string;
  descEn: string;
  badgeAr?: string;
  badgeEn?: string;
}

const CURRENCY_LIST = [
  { code: 'SAR', nameAr: '🇸🇦 ريال سعودي', nameEn: 'Saudi Riyal' },
  { code: 'AED', nameAr: '🇦🇪 درهم إماراتي', nameEn: 'UAE Dirham' },
  { code: 'EGP', nameAr: '🇪🇬 جنيه مصري', nameEn: 'Egyptian Pound' },
  { code: 'USD', nameAr: '🇺🇸 دولار أمريكي', nameEn: 'US Dollar' },
  { code: 'EUR', nameAr: '🇪🇺 يورو', nameEn: 'Euro' },
  { code: 'GBP', nameAr: '🇬🇧 جنيه إسترليني', nameEn: 'British Pound' },
  { code: 'KWD', nameAr: '🇰🇼 دينار كويتي', nameEn: 'Kuwaiti Dinar' },
  { code: 'QAR', nameAr: '🇶🇦 ريال قطري', nameEn: 'Qatari Riyal' },
  { code: 'JOD', nameAr: '🇯🇴 دينار أردني', nameEn: 'Jordanian Dinar' },
  { code: 'BHD', nameAr: '🇧🇭 دينار بحريني', nameEn: 'Bahraini Dinar' },
  { code: 'OMR', nameAr: '🇴🇲 ريال عماني', nameEn: 'Omani Rial' },
  { code: 'TND', nameAr: '🇹🇳 دينار تونسي', nameEn: 'Tunisian Dinar' },
  { code: 'MAD', nameAr: '🇲🇦 درهم مغربي', nameEn: 'Moroccan Dirham' },
  { code: 'DZD', nameAr: '🇩🇿 دينار جزائري', nameEn: 'Algerian Dinar' },
];

export const ToolsPage: React.FC<ToolsPageProps> = ({
  state,
  onUpdateExchangeRates,
  onSaveNotebooks,
  onSaveStandardNotes,
  onSaveMindMaps,
  language,
}) => {
  const isRTL = language === 'ar';
  const cur = state.settings.currency || 'ر.س';

  const [activeCategory, setActiveCategory] = useState<ToolCategory>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);

  // Favorites stored in localStorage
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('wallet_favorite_tools');
      return saved ? JSON.parse(saved) : ['calc', 'currency', 'interest', 'loan', 'ai_advisor'];
    } catch {
      return ['calc', 'currency', 'interest', 'loan'];
    }
  });

  const toggleFavorite = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      try {
        localStorage.setItem('wallet_favorite_tools', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // 1. Calculator State
  const [calcDisplay, setCalcDisplay] = useState<string>('0');
  const handleCalcInput = (char: string) => {
    if (calcDisplay === '0' || calcDisplay === 'Error') {
      setCalcDisplay(char);
    } else {
      setCalcDisplay((prev) => prev + char);
    }
  };
  const handleCalcClear = () => setCalcDisplay('0');
  const handleCalcBack = () => {
    if (calcDisplay.length <= 1 || calcDisplay === 'Error') {
      setCalcDisplay('0');
    } else {
      setCalcDisplay((prev) => prev.slice(0, -1));
    }
  };
  const handleCalcEqual = () => {
    try {
      const sanitized = calcDisplay.replace(/×/g, '*').replace(/÷/g, '/');
      if (!/^[0-9+\-*/.()%\s]+$/.test(sanitized)) throw new Error('Invalid');
      const res = new Function(`return (${sanitized})`)();
      setCalcDisplay(String(Number(res).toFixed(2)).replace(/\.00$/, ''));
    } catch {
      setCalcDisplay('Error');
    }
  };

  // 2. Currency Converter State
  const [convAmount, setConvAmount] = useState<number>(100);
  const [fromCurrency, setFromCurrency] = useState<string>('USD');
  const [toCurrency, setToCurrency] = useState<string>('SAR');
  const rates = state.exchangeRates;
  const fromRate = rates[fromCurrency] || 1;
  const toRate = rates[toCurrency] || 1;
  const convertedValue = (convAmount / fromRate) * toRate;

  // 3. Quick Calc State
  const [quickAmount, setQuickAmount] = useState<number>(100);
  const [quickPercent, setQuickPercent] = useState<number>(15);
  const percentValue = (quickAmount * quickPercent) / 100;

  // Tools catalog
  const tools: ToolItem[] = useMemo(
    () => [
      // Smart / Notebooks
      {
        id: 'notebooks',
        nameAr: '📁 المفكرة الذكية المتعددة المستويات',
        nameEn: 'Multi-Level Smart Notebooks',
        category: 'smart',
        icon: <BookOpen className="h-5 w-5 text-purple-400" />,
        descAr: 'مفكرة هرمية، ملاحظات عادية، وخرائط ذهنية مشجرة متكاملة',
        descEn: 'Hierarchical notebooks, standard notes, and tree mind maps',
        badgeAr: 'مميز',
        badgeEn: 'Featured',
      },
      // Basic tools
      {
        id: 'calc',
        nameAr: '🧮 الحاسبة المتطورة',
        nameEn: 'Advanced Calculator',
        category: 'financial',
        icon: <CalcIcon className="h-5 w-5 text-purple-400" />,
        descAr: 'حسابات رياضية فورية مع عمليات حسابية وكسور ونسب مئوية',
        descEn: 'Instant arithmetic calculations with memory and percentages',
        badgeAr: 'أساسية',
        badgeEn: 'Core',
      },
      {
        id: 'currency',
        nameAr: '💱 محول العملات',
        nameEn: 'Currency Converter',
        category: 'financial',
        icon: <RefreshCw className="h-5 w-5 text-cyan-400" />,
        descAr: 'تحويل بين كافة العملات العالمية والعربية بأسعار الصرف المحدثة',
        descEn: 'Convert between world & Arab currencies with exchange rates',
        badgeAr: 'حقيقي',
        badgeEn: 'Live Rates',
      },
      {
        id: 'quick',
        nameAr: '⚡ حسابات سريعة ونسب',
        nameEn: 'Quick Percentage Calc',
        category: 'financial',
        icon: <Percent className="h-5 w-5 text-amber-400" />,
        descAr: 'حساب الضريبة والخصم والنسب المئوية والزيادة بلمسة واحدة',
        descEn: 'Calculate VAT, discount, and percentage addition/subtraction',
      },

      // Category 1: Financial & Accounting
      {
        id: 'interest',
        nameAr: '🏦 حاسبة الفائدة',
        nameEn: 'Interest Calculator',
        category: 'financial',
        icon: <Landmark className="h-5 w-5 text-blue-400" />,
        descAr: 'حساب الفائدة البسيطة والمركبة وتطور نمو رأس المال مع الزمن',
        descEn: 'Calculate simple and compound interest over custom periods',
        badgeAr: 'مهم جداً',
        badgeEn: 'Essential',
      },
      {
        id: 'loan',
        nameAr: '💳 حاسبة القروض والأقساط',
        nameEn: 'Loan & EMI Calculator',
        category: 'financial',
        icon: <CreditCard className="h-5 w-5 text-emerald-400" />,
        descAr: 'حساب القسط الشهري، إجمالي الفوائد، وجدول إطفاء السداد السنوي',
        descEn: 'Monthly payment, total interest, and amortization schedule',
        badgeAr: 'قروض',
        badgeEn: 'Loans',
      },
      {
        id: 'investment',
        nameAr: '📈 حاسبة نمو الاستثمار',
        nameEn: 'Investment Calculator',
        category: 'financial',
        icon: <TrendingUp className="h-5 w-5 text-emerald-400" />,
        descAr: 'محاكاة نمو المحفظة بالاستثمار الدوري والإيداعات الشهرية التراكمية',
        descEn: 'Simulate compound growth with periodic monthly deposits',
      },
      {
        id: 'invoice',
        nameAr: '🧾 منشئ وحاسبة الفواتير',
        nameEn: 'Invoice Generator',
        category: 'financial',
        icon: <Receipt className="h-5 w-5 text-pink-400" />,
        descAr: 'إنشاء وحساب بنود الفواتير مع الضريبة والخصم والطباعة والتصدير',
        descEn: 'Create items, calculate tax, discount and print ready invoices',
        badgeAr: 'للأعمال',
        badgeEn: 'Business',
      },
      {
        id: 'tip',
        nameAr: '💵 حاسبة الإكرامية وتقسيم الفاتورة',
        nameEn: 'Tip & Bill Splitter',
        category: 'financial',
        icon: <Coffee className="h-5 w-5 text-amber-400" />,
        descAr: 'حساب الإكرامية وتقسيم الفاتورة بالتساوي بين الأصدقاء أو الشركاء',
        descEn: 'Calculate tip and split total bill evenly among people',
      },
      {
        id: 'price_compare',
        nameAr: '🏷️ مقارنة الأسعار وسعر الوحدة',
        nameEn: 'Price & Unit Comparison',
        category: 'financial',
        icon: <Scale className="h-5 w-5 text-purple-400" />,
        descAr: 'مقارنة بين منتجين حسب الحجم/الوزن لمعرفة الخيار الأوفر مالياً',
        descEn: 'Compare two products by weight or volume to find the cheapest',
      },

      // Category 2: Planning & Savings
      {
        id: 'savings_plan',
        nameAr: '🎯 مخطط الادخار الشهري',
        nameEn: 'Savings Planner',
        category: 'planning',
        icon: <Target className="h-5 w-5 text-emerald-400" />,
        descAr: 'تخطيط المبلغ الشهري المطلوب للوصول إلى هدف مالي في موعد محدد',
        descEn: 'Calculate monthly savings needed to hit your target date',
        badgeAr: 'أهداف',
        badgeEn: 'Goals',
      },
      {
        id: 'retirement',
        nameAr: '🏖️ حاسبة التقاعد المالي',
        nameEn: 'Retirement Planner',
        category: 'planning',
        icon: <Clock className="h-5 w-5 text-cyan-400" />,
        descAr: 'حساب رأس المال المطلوب للاستقلال المالي والتقاعد المريح',
        descEn: 'Determine total capital needed for financial independence',
      },
      {
        id: 'emergency',
        nameAr: '🚨 حاسبة صندوق الطوارئ',
        nameEn: 'Emergency Fund Calculator',
        category: 'planning',
        icon: <ShieldAlert className="h-5 w-5 text-amber-400" />,
        descAr: 'تحديد ميزانية الأمان لتغطية مصاريف 3 أو 6 أو 12 شهراً',
        descEn: 'Calculate buffer fund to cover 3, 6, or 12 months of essentials',
        badgeAr: 'أمان مالي',
        badgeEn: 'Safety',
      },
      {
        id: 'debt_payoff',
        nameAr: '💳 مخطط سداد الديون',
        nameEn: 'Debt Payoff Strategy',
        category: 'planning',
        icon: <Flame className="h-5 w-5 text-red-400" />,
        descAr: 'ترتيب سداد الديون بطريقتي كرة الثلج (الأصغر) والأفالانش (الأعلى فائدة)',
        descEn: 'Compare Snowball and Avalanche strategies to clear debts fast',
      },

      // Category 3: Business & Analytics
      {
        id: 'break_even',
        nameAr: '📊 حاسبة نقطة التعادل',
        nameEn: 'Break-Even Calculator',
        category: 'business',
        icon: <BarChart3 className="h-5 w-5 text-blue-400" />,
        descAr: 'معرفة كمية المبيعات اللازمة لتغطية التكاليف وبداية جني الأرباح',
        descEn: 'Find required unit sales to cover fixed and variable costs',
      },
      {
        id: 'profit_margin',
        nameAr: '📈 حاسبة هامش الربح والمارك أب',
        nameEn: 'Profit Margin & Markup',
        category: 'business',
        icon: <Percent className="h-5 w-5 text-emerald-400" />,
        descAr: 'حساب هامش الربح الصافي ونسبة الإضافة (Markup) لتسعير منتجاتك',
        descEn: 'Calculate profit margin percentage and markup pricing',
      },
      {
        id: 'roi',
        nameAr: '💹 حاسبة العائد على الاستثمار (ROI)',
        nameEn: 'ROI Calculator',
        category: 'business',
        icon: <TrendingUp className="h-5 w-5 text-cyan-400" />,
        descAr: 'قياس نسبة العائد الإجمالي والسنوي لأي استثمار أو مشروع تجاري',
        descEn: 'Measure total and annualized return on investment rate',
      },
      {
        id: 'materials',
        nameAr: '🧱 حاسبة المواد والمساحات',
        nameEn: 'Materials Calculator',
        category: 'business',
        icon: <Layers className="h-5 w-5 text-amber-400" />,
        descAr: 'حساب المساحة وكميات البلاط والدهان والباركيه مع نسبة الهدر',
        descEn: 'Calculate area, paint liters, and tiles needed with waste factor',
      },
      {
        id: 'project_time',
        nameAr: '⏰ تقدير وقت وتكلفة المشاريع',
        nameEn: 'Project Time & Cost',
        category: 'business',
        icon: <Clock className="h-5 w-5 text-pink-400" />,
        descAr: 'تقدير ساعات المهام والمدة بالأيام وتكلفة العمالة الإجمالية',
        descEn: 'Estimate task hours, completion days and total labor costs',
      },

      // Category 4: Conversion & Utilities
      {
        id: 'unit_converter',
        nameAr: '📐 محول القياس والوحدات',
        nameEn: 'Unit Converter',
        category: 'conversion',
        icon: <Compass className="h-5 w-5 text-purple-400" />,
        descAr: 'تحويل شامل بين وحدات الطول والوزن والمساحة والحرارة والبيانات',
        descEn: 'Comprehensive converter for length, weight, area, and data',
      },

      // Category 5: Smart & AI Tools
      {
        id: 'ai_advisor',
        nameAr: '🤖 المستشار المالي الذكي',
        nameEn: 'AI Financial Advisor',
        category: 'smart',
        icon: <Bot className="h-5 w-5 text-purple-400" />,
        descAr: 'تحليل مباشر لبيانات محفظتك الحقيقية وتقديم نصائح توفير وميزانية ذكية',
        descEn: 'Live portfolio audit, spending patterns and tailored financial advice',
        badgeAr: 'ذكي',
        badgeEn: 'Smart AI',
      },
      {
        id: 'date_converter',
        nameAr: '📅 محول التاريخ وحساب العمر',
        nameEn: 'Date & Hijri Converter',
        category: 'smart',
        icon: <Calendar className="h-5 w-5 text-blue-400" />,
        descAr: 'تحويل بين الميلادي والهجري وحساب العمر الدقيق بالأيام والسنوات',
        descEn: 'Gregorian to Hijri converter and exact age breakdown in days',
      },
      {
        id: 'password_gen',
        nameAr: '🔐 مولد كلمات المرور الآمنة',
        nameEn: 'Password Generator',
        category: 'smart',
        icon: <KeyRound className="h-5 w-5 text-emerald-400" />,
        descAr: 'توليد كلمات سر قوية ومعقدة لحماية حساباتك المصرفية والتطبيقات',
        descEn: 'Generate strong cryptographically secure passwords for banking',
      },
      {
        id: 'quick_notes',
        nameAr: '📝 مفكرة الملاحظات المالية',
        nameEn: 'Quick Financial Notes',
        category: 'smart',
        icon: <FileText className="h-5 w-5 text-pink-400" />,
        descAr: 'حفظ أفكار استثمارية وملاحظات سريعة وفواتير مع وسوم وتخزين محلي',
        descEn: 'Save investment ideas and quick bills with offline storage',
      },
    ],
    []
  );

  // Filtered tools
  const filteredTools = useMemo(() => {
    return tools.filter((tool) => {
      // Category filter
      if (activeCategory === 'fav') {
        if (!favorites.includes(tool.id)) return false;
      } else if (activeCategory !== 'all') {
        if (tool.category !== activeCategory) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNameAr = tool.nameAr.toLowerCase().includes(q);
        const matchNameEn = tool.nameEn.toLowerCase().includes(q);
        const matchDescAr = tool.descAr.toLowerCase().includes(q);
        const matchDescEn = tool.descEn.toLowerCase().includes(q);
        if (!matchNameAr && !matchNameEn && !matchDescAr && !matchDescEn) return false;
      }

      return true;
    });
  }, [tools, activeCategory, favorites, searchQuery]);

  const activeSelectedTool = tools.find((t) => t.id === selectedToolId);

  return (
    <div className="space-y-5 pb-20 pt-2">
      {/* If a tool is active, show the active tool view */}
      {activeSelectedTool ? (
        <div className="space-y-4 animate-fadeIn">
          {/* Header with back button */}
          <div className="flex items-center justify-between border-b border-purple-900/40 pb-3">
            <button
              type="button"
              onClick={() => setSelectedToolId(null)}
              className="flex items-center gap-1.5 rounded-xl border border-purple-800/40 bg-purple-950/40 px-3 py-1.5 text-xs font-bold text-purple-200 hover:bg-purple-800/40 active:scale-95"
            >
              {isRTL ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
              <span>{isRTL ? 'الرجوع لجميع الأدوات' : 'Back to All Tools'}</span>
            </button>

            <button
              type="button"
              onClick={() => toggleFavorite(activeSelectedTool.id)}
              className={`flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-bold transition-all ${
                favorites.includes(activeSelectedTool.id)
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-purple-950/30 text-purple-300 border border-purple-900/40 hover:text-white'
              }`}
            >
              <Star
                className={`h-4 w-4 ${
                  favorites.includes(activeSelectedTool.id) ? 'fill-amber-400 text-amber-400' : ''
                }`}
              />
              <span className="hidden sm:inline">
                {favorites.includes(activeSelectedTool.id)
                  ? isRTL ? 'في المفضلة' : 'Favorited'
                  : isRTL ? 'أضف للمفضلة' : 'Favorite'}
              </span>
            </button>
          </div>

          {/* Active Tool Title Card */}
          <div className="rounded-2xl border border-purple-500/30 bg-[#161635] p-4 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-900/40 border border-purple-800/50 shadow-sm">
                {activeSelectedTool.icon}
              </div>
              <div>
                <h3 className="text-base font-black text-white">
                  {isRTL ? activeSelectedTool.nameAr : activeSelectedTool.nameEn}
                </h3>
                <p className="text-xs text-purple-300/70">
                  {isRTL ? activeSelectedTool.descAr : activeSelectedTool.descEn}
                </p>
              </div>
            </div>

            {activeSelectedTool.badgeAr && (
              <span className="hidden sm:inline-block rounded-full bg-purple-600/30 px-2.5 py-1 text-[10px] font-black text-purple-300 border border-purple-500/30">
                {isRTL ? activeSelectedTool.badgeAr : activeSelectedTool.badgeEn}
              </span>
            )}
          </div>

          {/* Active Tool Dynamic Content */}
          <div className="rounded-3xl border border-purple-500/20 bg-[#14142d] p-5 shadow-xl">
            {activeSelectedTool.id === 'calc' && (
              <div className="mx-auto max-w-sm">
                <div
                  className="mb-4 rounded-2xl border border-purple-900/50 bg-[#0d0d1e] p-4 text-left font-mono text-3xl font-black text-white overflow-x-auto text-right"
                  dir="ltr"
                >
                  {calcDisplay}
                </div>
                <div className="grid grid-cols-4 gap-2.5">
                  <button
                    type="button"
                    onClick={handleCalcClear}
                    className="rounded-xl bg-red-600/40 text-red-300 border border-red-500/40 p-3.5 text-base font-black hover:bg-red-600 hover:text-white"
                  >
                    C
                  </button>
                  <button
                    type="button"
                    onClick={handleCalcBack}
                    className="rounded-xl bg-amber-600/40 text-amber-300 border border-amber-500/40 p-3.5 text-base font-black hover:bg-amber-600 hover:text-white"
                  >
                    ⌫
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCalcInput('%')}
                    className="rounded-xl bg-purple-900/40 text-purple-300 border border-purple-800/40 p-3.5 text-base font-black hover:bg-purple-600 hover:text-white"
                  >
                    %
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCalcInput('÷')}
                    className="rounded-xl bg-purple-600 text-white p-3.5 text-base font-black hover:bg-purple-500"
                  >
                    ÷
                  </button>
                  {['7', '8', '9'].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => handleCalcInput(n)}
                      className="rounded-xl bg-[#1b1b3a] text-white p-3.5 text-base font-bold hover:bg-purple-900/50"
                    >
                      {n}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleCalcInput('×')}
                    className="rounded-xl bg-purple-600 text-white p-3.5 text-base font-black hover:bg-purple-500"
                  >
                    ×
                  </button>
                  {['4', '5', '6'].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => handleCalcInput(n)}
                      className="rounded-xl bg-[#1b1b3a] text-white p-3.5 text-base font-bold hover:bg-purple-900/50"
                    >
                      {n}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleCalcInput('-')}
                    className="rounded-xl bg-purple-600 text-white p-3.5 text-base font-black hover:bg-purple-500"
                  >
                    -
                  </button>
                  {['1', '2', '3'].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => handleCalcInput(n)}
                      className="rounded-xl bg-[#1b1b3a] text-white p-3.5 text-base font-bold hover:bg-purple-900/50"
                    >
                      {n}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleCalcInput('+')}
                    className="rounded-xl bg-purple-600 text-white p-3.5 text-base font-black hover:bg-purple-500"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCalcInput('0')}
                    className="rounded-xl bg-[#1b1b3a] text-white p-3.5 text-base font-bold hover:bg-purple-900/50 col-span-2"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCalcInput('.')}
                    className="rounded-xl bg-[#1b1b3a] text-white p-3.5 text-base font-bold hover:bg-purple-900/50"
                  >
                    .
                  </button>
                  <button
                    type="button"
                    onClick={handleCalcEqual}
                    className="rounded-xl bg-emerald-600 text-white p-3.5 text-base font-black hover:bg-emerald-500 shadow-md shadow-emerald-600/30"
                  >
                    =
                  </button>
                </div>
              </div>
            )}

            {activeSelectedTool.id === 'currency' && (
              <div className="mx-auto max-w-md space-y-4">
                <div>
                  <label className="text-xs font-bold text-purple-300 block mb-1">
                    {isRTL ? 'المبلغ المطلوب تحويله' : 'Amount'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={convAmount}
                    onChange={(e) => setConvAmount(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl border border-purple-900/50 bg-[#1c1c3c] p-3 text-lg font-black text-white outline-none focus:border-purple-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="text-xs font-bold text-purple-300 block mb-1">
                      {isRTL ? 'من عملة' : 'From'}
                    </label>
                    <select
                      value={fromCurrency}
                      onChange={(e) => setFromCurrency(e.target.value)}
                      className="w-full rounded-xl border border-purple-900/50 bg-[#1c1c3c] p-2.5 text-xs font-bold text-white outline-none focus:border-purple-500"
                    >
                      {CURRENCY_LIST.map((c) => (
                        <option key={c.code} value={c.code}>
                          {isRTL ? c.nameAr : `${c.nameEn} (${c.code})`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const temp = fromCurrency;
                      setFromCurrency(toCurrency);
                      setToCurrency(temp);
                    }}
                    className="mt-5 flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600 text-white shadow-md hover:bg-purple-500"
                  >
                    <ArrowRightLeft className="h-4 w-4" />
                  </button>
                  <div className="flex-1">
                    <label className="text-xs font-bold text-purple-300 block mb-1">
                      {isRTL ? 'إلى عملة' : 'To'}
                    </label>
                    <select
                      value={toCurrency}
                      onChange={(e) => setToCurrency(e.target.value)}
                      className="w-full rounded-xl border border-purple-900/50 bg-[#1c1c3c] p-2.5 text-xs font-bold text-white outline-none focus:border-purple-500"
                    >
                      {CURRENCY_LIST.map((c) => (
                        <option key={c.code} value={c.code}>
                          {isRTL ? c.nameAr : `${c.nameEn} (${c.code})`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-5 text-center shadow-lg">
                  <span className="text-xs font-bold text-emerald-300 block mb-1">
                    {isRTL ? 'النتيجة المحولة' : 'Converted Value'}
                  </span>
                  <div className="text-3xl font-black text-emerald-400">
                    {convertedValue.toFixed(2)} {toCurrency}
                  </div>
                  <p className="mt-2 text-[11px] text-purple-300/60">
                    1 {fromCurrency} = {(toRate / fromRate).toFixed(4)} {toCurrency}
                  </p>
                </div>
              </div>
            )}

            {activeSelectedTool.id === 'quick' && (
              <div className="mx-auto max-w-md space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-purple-300 block mb-1">
                      {isRTL ? 'المبلغ الأساسي' : 'Base Amount'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={quickAmount}
                      onChange={(e) => setQuickAmount(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-xl border border-purple-900/50 bg-[#1c1c3c] p-2.5 text-base font-bold text-white outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-purple-300 block mb-1">
                      {isRTL ? 'النسبة المئوية %' : 'Percent %'}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={quickPercent}
                      onChange={(e) => setQuickPercent(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-xl border border-purple-900/50 bg-[#1c1c3c] p-2.5 text-base font-bold text-white outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
                <div className="space-y-2 rounded-2xl border border-purple-900/40 bg-[#161633] p-4 text-xs font-bold">
                  <div className="flex items-center justify-between py-1.5 border-b border-purple-900/30">
                    <span className="text-purple-300">{isRTL ? 'قيمة النسبة فقط:' : 'Percent value:'}</span>
                    <span className="font-black text-white">{percentValue.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-purple-900/30">
                    <span className="text-emerald-400">
                      ➕ {isRTL ? 'المبلغ مع الزيادة (+):' : 'Amount with addition (+):'}
                    </span>
                    <span className="font-black text-emerald-400">{(quickAmount + percentValue).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-red-400">
                      ➖ {isRTL ? 'المبلغ بعد الخصم (-):' : 'Amount after deduction (-):'}
                    </span>
                    <span className="font-black text-red-400">{(quickAmount - percentValue).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Financial tools */}
            {activeSelectedTool.id === 'interest' && <InterestCalculatorTool currency={cur} isRTL={isRTL} />}
            {activeSelectedTool.id === 'loan' && <LoanCalculatorTool currency={cur} isRTL={isRTL} />}
            {activeSelectedTool.id === 'investment' && <InvestmentCalculatorTool currency={cur} isRTL={isRTL} />}
            {activeSelectedTool.id === 'invoice' && <InvoiceGeneratorTool currency={cur} isRTL={isRTL} />}
            {activeSelectedTool.id === 'tip' && <TipCalculatorTool currency={cur} isRTL={isRTL} />}
            {activeSelectedTool.id === 'price_compare' && <PriceComparisonTool currency={cur} isRTL={isRTL} />}

            {/* Planning tools */}
            {activeSelectedTool.id === 'savings_plan' && <SavingsPlannerTool currency={cur} isRTL={isRTL} />}
            {activeSelectedTool.id === 'retirement' && <RetirementCalculatorTool currency={cur} isRTL={isRTL} />}
            {activeSelectedTool.id === 'emergency' && <EmergencyFundTool currency={cur} isRTL={isRTL} />}
            {activeSelectedTool.id === 'debt_payoff' && <DebtPayoffPlannerTool currency={cur} isRTL={isRTL} />}

            {/* Business tools */}
            {activeSelectedTool.id === 'break_even' && <BreakEvenTool currency={cur} isRTL={isRTL} />}
            {activeSelectedTool.id === 'profit_margin' && <ProfitMarginTool currency={cur} isRTL={isRTL} />}
            {activeSelectedTool.id === 'roi' && <RoiCalculatorTool currency={cur} isRTL={isRTL} />}
            {activeSelectedTool.id === 'materials' && <MaterialsCalculatorTool currency={cur} isRTL={isRTL} />}
            {activeSelectedTool.id === 'project_time' && <ProjectTimeEstimatorTool currency={cur} isRTL={isRTL} />}

            {/* Conversion & Smart tools */}
            {activeSelectedTool.id === 'unit_converter' && <UnitConverterTool currency={cur} isRTL={isRTL} />}
            {activeSelectedTool.id === 'ai_advisor' && <AiAdvisorTool currency={cur} isRTL={isRTL} state={state} />}
            {activeSelectedTool.id === 'date_converter' && <DateConverterTool currency={cur} isRTL={isRTL} />}
            {activeSelectedTool.id === 'password_gen' && <PasswordGeneratorTool currency={cur} isRTL={isRTL} />}
            {activeSelectedTool.id === 'quick_notes' && <QuickNotesTool currency={cur} isRTL={isRTL} />}
            {activeSelectedTool.id === 'notebooks' && (
              <NotebooksPage
                state={state}
                onSaveNotebooks={onSaveNotebooks}
                onSaveStandardNotes={onSaveStandardNotes}
                onSaveMindMaps={onSaveMindMaps}
                language={language}
              />
            )}
          </div>
        </div>
      ) : (
        /* Tools Catalog View */
        <div className="space-y-4">
          {/* Header Banner */}
          <div className="rounded-3xl border border-purple-500/30 bg-gradient-to-r from-purple-950/60 via-[#181135] to-[#121226] p-5 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 text-white shadow-md shadow-purple-600/30">
                <Wrench className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">
                  {isRTL ? 'مركز الأدوات المالية الذكية' : 'Smart Financial Tools Hub'}
                </h2>
                <p className="text-xs text-purple-300/80">
                  {isRTL
                    ? `أكثر من 20 أداة متخصصة للمحاسبة، القروض، التخطيط، والمشاريع`
                    : `20+ specialized financial, loan, planning & project tools`}
                </p>
              </div>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isRTL ? 'ابحث في الأدوات (مثال: قرض، فائدة، تقاعد، ضريبة)...' : 'Search tools (e.g. loan, interest, VAT)...'}
              className="w-full rounded-2xl border border-purple-900/50 bg-[#161635] py-2.5 pr-10 pl-10 text-xs text-white placeholder-purple-400/50 outline-none focus:border-purple-500 shadow-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'all', label: isRTL ? '🌟 الكل' : 'All', count: tools.length },
              { id: 'fav', label: isRTL ? '⭐ المفضلة' : 'Favorites', count: favorites.length },
              { id: 'financial', label: isRTL ? '🏦 مالية ومحاسبية' : 'Financial' },
              { id: 'planning', label: isRTL ? '🎯 تخطيط وادخار' : 'Planning' },
              { id: 'business', label: isRTL ? '📊 أعمال وتحليل' : 'Business' },
              { id: 'conversion', label: isRTL ? '📐 قياس وتحويل' : 'Conversion' },
              { id: 'smart', label: isRTL ? '🤖 أدوات ذكية' : 'Smart AI' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id as ToolCategory)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 border ${
                  activeCategory === cat.id
                    ? 'border-purple-500 bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : 'border-purple-900/40 bg-[#161633] text-purple-300 hover:border-purple-700/60'
                }`}
              >
                <span>{cat.label}</span>
                {cat.count !== undefined && (
                  <span className="rounded-full bg-purple-950/60 px-1.5 py-0.2 text-[10px] font-mono">
                    {cat.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Quick Favorites Bar if any and in 'all' view */}
          {activeCategory === 'all' && favorites.length > 0 && !searchQuery && (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-950/10 p-3.5 space-y-2">
              <span className="text-[11px] font-black text-amber-300 flex items-center gap-1.5">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span>{isRTL ? 'الأدوات المفضلة للوصول السريع' : 'Quick Access Favorites'}</span>
              </span>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {favorites.map((favId) => {
                  const favTool = tools.find((t) => t.id === favId);
                  if (!favTool) return null;
                  return (
                    <button
                      key={favId}
                      type="button"
                      onClick={() => setSelectedToolId(favId)}
                      className="flex items-center gap-2 rounded-xl border border-purple-900/40 bg-[#181838] px-3 py-2 text-xs font-bold text-white hover:border-purple-500 whitespace-nowrap transition-all shadow-sm"
                    >
                      <span>{favTool.icon}</span>
                      <span>{isRTL ? favTool.nameAr : favTool.nameEn}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tools Grid */}
          {filteredTools.length === 0 ? (
            <div className="rounded-2xl border border-purple-900/30 bg-[#14142d] p-12 text-center text-xs text-purple-300/60">
              <Wrench className="mx-auto h-8 w-8 text-purple-500/40 mb-2" />
              <p>{isRTL ? 'لم يتم العثور على أي أداة مطابقة للبحث' : 'No tools matched your search'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
              {filteredTools.map((tool) => {
                const isFav = favorites.includes(tool.id);
                return (
                  <div
                    key={tool.id}
                    onClick={() => setSelectedToolId(tool.id)}
                    className="group relative rounded-2xl border border-purple-900/30 bg-[#14142d] p-3 transition-all duration-200 hover:border-purple-500 hover:bg-[#181838] hover:shadow-md hover:shadow-purple-950/50 cursor-pointer flex flex-col items-center text-center justify-between min-h-[110px]"
                  >
                    {/* Favorite Button absolute top right */}
                    <button
                      type="button"
                      onClick={(e) => toggleFavorite(tool.id, e)}
                      className="absolute top-2 right-2 p-1 text-purple-400 hover:text-amber-400 transition-colors z-10"
                    >
                      <Star
                        className={`h-3.5 w-3.5 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`}
                      />
                    </button>

                    <div className="flex flex-col items-center w-full pt-1">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-900/40 border border-purple-800/40 group-hover:scale-110 group-hover:bg-purple-800/50 transition-all mb-2">
                        {tool.icon}
                      </div>

                      <h3 className="text-xs font-black text-white group-hover:text-purple-300 transition-colors line-clamp-2 px-1">
                        {isRTL ? tool.nameAr : tool.nameEn}
                      </h3>
                    </div>

                    {tool.badgeAr && (
                      <span className="mt-2 rounded-full bg-purple-950/80 border border-purple-800/40 px-2 py-0.5 text-[9px] font-bold text-purple-300 line-clamp-1">
                        {isRTL ? tool.badgeAr : tool.badgeEn}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
