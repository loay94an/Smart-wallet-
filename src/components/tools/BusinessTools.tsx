import React, { useState } from 'react';
import { formatCurrency } from '../../services/i18n';
import {
  BarChart3,
  Percent,
  TrendingUp,
  Layers,
  Clock,
  Plus,
  Trash2,
  DollarSign,
} from 'lucide-react';

interface ToolProps {
  currency: string;
  isRTL: boolean;
}

// 11. 📊 حاسبة نقطة التعادل (Break-Even Calculator)
export const BreakEvenTool: React.FC<ToolProps> = ({ currency, isRTL }) => {
  const [fixedCosts, setFixedCosts] = useState<number>(15000); // e.g. Rent, salaries, licenses
  const [sellingPricePerUnit, setSellingPricePerUnit] = useState<number>(120);
  const [variableCostPerUnit, setVariableCostPerUnit] = useState<number>(45);

  const contributionMargin = Math.max(0, sellingPricePerUnit - variableCostPerUnit);
  const contributionMarginRatio = sellingPricePerUnit > 0 ? (contributionMargin / sellingPricePerUnit) * 100 : 0;

  const breakEvenUnits = contributionMargin > 0 ? Math.ceil(fixedCosts / contributionMargin) : 0;
  const breakEvenRevenue = breakEvenUnits * sellingPricePerUnit;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-bold text-purple-300 block mb-1">
            {isRTL ? 'إجمالي التكاليف الثابتة (إيجار، رواتب...)' : 'Fixed Costs (Rent, Salaries)'}
          </label>
          <input
            type="number"
            min="0"
            value={fixedCosts}
            onChange={(e) => setFixedCosts(Math.max(0, parseFloat(e.target.value) || 0))}
            className="w-full rounded-xl border border-purple-900/50 bg-[#1c1c3c] p-2.5 text-sm font-bold text-white outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-purple-300 block mb-1">
            {isRTL ? 'سعر بيع الوحدة للعميل' : 'Sale Price Per Unit'}
          </label>
          <input
            type="number"
            min="0"
            value={sellingPricePerUnit}
            onChange={(e) => setSellingPricePerUnit(Math.max(0, parseFloat(e.target.value) || 0))}
            className="w-full rounded-xl border border-purple-900/50 bg-[#1c1c3c] p-2.5 text-sm font-bold text-white outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-purple-300 block mb-1">
            {isRTL ? 'التكلفة المتغيرة للوحدة (مواد، تصنيع)' : 'Variable Cost Per Unit'}
          </label>
          <input
            type="number"
            min="0"
            value={variableCostPerUnit}
            onChange={(e) => setVariableCostPerUnit(Math.max(0, parseFloat(e.target.value) || 0))}
            className="w-full rounded-xl border border-purple-900/50 bg-[#1c1c3c] p-2.5 text-sm font-bold text-white outline-none"
          />
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        <div className="rounded-2xl border border-cyan-500/40 bg-cyan-950/20 p-4 text-center">
          <span className="text-xs font-bold text-cyan-300 block">
            {isRTL ? 'الوحدات المطلوبة لتحقيق نقطة التعادل' : 'Break-Even Units Needed'}
          </span>
          <div className="text-3xl font-black text-cyan-400 mt-1">
            {breakEvenUnits} {isRTL ? 'وحدة / قطعة' : 'units'}
          </div>
          <span className="text-[11px] text-purple-300/70 block mt-1">
            {isRTL ? `هامش المساهمة: ${formatCurrency(contributionMargin, currency)} لكل وحدة (${contributionMarginRatio.toFixed(1)}%)` : `Contribution margin: ${formatCurrency(contributionMargin, currency)}`}
          </span>
        </div>

        <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/20 p-4 text-center">
          <span className="text-xs font-bold text-emerald-300 block">
            {isRTL ? 'حجم المبيعات المطلوب بالمال' : 'Break-Even Revenue'}
          </span>
          <div className="text-3xl font-black text-emerald-400 mt-1">
            {formatCurrency(breakEvenRevenue, currency)}
          </div>
          <span className="text-[11px] text-purple-300/70 block mt-1">
            {isRTL ? 'عند هذا المبلغ لا توجد خسارة وتبدأ الأرباح بعدها' : 'Zero loss point, profits begin after this'}
          </span>
        </div>
      </div>
    </div>
  );
};

// 12. 📈 حاسبة هامش الربح والمارك أب (Profit Margin & Markup)
export const ProfitMarginTool: React.FC<ToolProps> = ({ currency, isRTL }) => {
  const [costPrice, setCostPrice] = useState<number>(80);
  const [sellingPrice, setSellingPrice] = useState<number>(120);

  const grossProfit = sellingPrice - costPrice;
  const profitMarginPercent = sellingPrice > 0 ? (grossProfit / sellingPrice) * 100 : 0;
  const markupPercent = costPrice > 0 ? (grossProfit / costPrice) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-bold text-purple-300 block mb-1">
            {isRTL ? 'سعر التكلفة (Cost)' : 'Cost Price'}
          </label>
          <input
            type="number"
            min="0"
            value={costPrice}
            onChange={(e) => setCostPrice(Math.max(0, parseFloat(e.target.value) || 0))}
            className="w-full rounded-xl border border-purple-900/50 bg-[#1c1c3c] p-2.5 text-base font-bold text-white outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-purple-300 block mb-1">
            {isRTL ? 'سعر البيع (Selling Price)' : 'Selling Price'}
          </label>
          <input
            type="number"
            min="0"
            value={sellingPrice}
            onChange={(e) => setSellingPrice(Math.max(0, parseFloat(e.target.value) || 0))}
            className="w-full rounded-xl border border-purple-900/50 bg-[#1c1c3c] p-2.5 text-base font-bold text-white outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 pt-2">
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-3 text-center">
          <span className="text-[10px] font-bold text-emerald-300 block">
            {isRTL ? 'الربح الصافي للوحدة' : 'Gross Profit'}
          </span>
          <div className="text-xl font-black text-emerald-400 mt-1">
            {formatCurrency(grossProfit, currency)}
          </div>
        </div>

        <div className="rounded-2xl border border-purple-500/30 bg-purple-950/20 p-3 text-center">
          <span className="text-[10px] font-bold text-purple-300 block">
            {isRTL ? 'هامش الربح (Margin)' : 'Profit Margin'}
          </span>
          <div className="text-xl font-black text-white mt-1">
            {profitMarginPercent.toFixed(1)}%
          </div>
        </div>

        <div className="rounded-2xl border border-blue-500/30 bg-blue-950/20 p-3 text-center">
          <span className="text-[10px] font-bold text-blue-300 block">
            {isRTL ? 'نسبة الإضافة (Markup)' : 'Markup %'}
          </span>
          <div className="text-xl font-black text-blue-400 mt-1">
            {markupPercent.toFixed(1)}%
          </div>
        </div>
      </div>
    </div>
  );
};

// 13. 💹 حاسبة ROI (Return on Investment)
export const RoiCalculatorTool: React.FC<ToolProps> = ({ currency, isRTL }) => {
  const [initialInvestment, setInitialInvestment] = useState<number>(20000);
  const [finalValue, setFinalValue] = useState<number>(27500);
  const [holdingYears, setHoldingYears] = useState<number>(2);

  const netGain = finalValue - initialInvestment;
  const totalRoi = initialInvestment > 0 ? (netGain / initialInvestment) * 100 : 0;
  // Annualized ROI: ( (FV/PV)^(1/years) - 1 ) * 100
  const annualizedRoi = (initialInvestment > 0 && finalValue > 0 && holdingYears > 0)
    ? (Math.pow(finalValue / initialInvestment, 1 / holdingYears) - 1) * 100
    : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-bold text-purple-300 block mb-1">
            {isRTL ? 'المبلغ المستثمر الأولي' : 'Initial Investment'}
          </label>
          <input
            type="number"
            min="0"
            value={initialInvestment}
            onChange={(e) => setInitialInvestment(Math.max(0, parseFloat(e.target.value) || 0))}
            className="w-full rounded-xl border border-purple-900/50 bg-[#1c1c3c] p-2.5 text-sm font-bold text-white outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-purple-300 block mb-1">
            {isRTL ? 'القيمة المحققة أو الحالية' : 'Ending / Final Value'}
          </label>
          <input
            type="number"
            min="0"
            value={finalValue}
            onChange={(e) => setFinalValue(Math.max(0, parseFloat(e.target.value) || 0))}
            className="w-full rounded-xl border border-purple-900/50 bg-[#1c1c3c] p-2.5 text-sm font-bold text-white outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-purple-300 block mb-1">
            {isRTL ? 'المدة الزمنية (سنوات)' : 'Holding Term (Years)'}
          </label>
          <input
            type="number"
            min="0.1"
            step="0.5"
            value={holdingYears}
            onChange={(e) => setHoldingYears(Math.max(0.1, parseFloat(e.target.value) || 1))}
            className="w-full rounded-xl border border-purple-900/50 bg-[#1c1c3c] p-2.5 text-sm font-bold text-white outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 text-center">
          <span className="text-xs font-bold text-emerald-300 block">
            {isRTL ? 'صافي الربح / العائد' : 'Net Profit'}
          </span>
          <div className="text-2xl font-black text-emerald-400 mt-1">
            {netGain >= 0 ? '+' : ''}{formatCurrency(netGain, currency)}
          </div>
        </div>

        <div className="rounded-2xl border border-purple-500/30 bg-purple-950/20 p-4 text-center">
          <span className="text-xs font-bold text-purple-300 block">
            {isRTL ? 'نسبة العائد الإجمالي (ROI)' : 'Total ROI'}
          </span>
          <div className="text-2xl font-black text-white mt-1">
            {totalRoi >= 0 ? '+' : ''}{totalRoi.toFixed(1)}%
          </div>
        </div>

        <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/20 p-4 text-center">
          <span className="text-xs font-bold text-cyan-300 block">
            {isRTL ? 'معدل العائد السنوي المجمع' : 'Annualized ROI'}
          </span>
          <div className="text-2xl font-black text-cyan-400 mt-1">
            {annualizedRoi.toFixed(1)}% / {isRTL ? 'سنة' : 'yr'}
          </div>
        </div>
      </div>
    </div>
  );
};

// 14. 🧱 حاسبة المواد والمساحات (Materials & Area Calculator)
export const MaterialsCalculatorTool: React.FC<ToolProps> = ({ currency, isRTL }) => {
  const [materialType, setMaterialType] = useState<'tiles' | 'paint' | 'flooring'>('tiles');
  const [length, setLength] = useState<number>(5);
  const [width, setWidth] = useState<number>(4);
  const [unitCost, setUnitCost] = useState<number>(45);
  const [wasteFactor, setWasteFactor] = useState<number>(10); // 10% extra for cuts/waste

  const area = length * width; // m²
  const areaWithWaste = area * (1 + wasteFactor / 100);

  // Material-specific estimations:
  // Tiles: box typically covers 1.44 m²
  const tileBoxCoverage = 1.44;
  const boxesNeeded = Math.ceil(areaWithWaste / tileBoxCoverage);

  // Paint: 1 Liter typically covers 10 m² (for 2 coats = 5 m²/L)
  const paintLiters = Math.ceil(areaWithWaste / 5);

  const estimatedCost = areaWithWaste * unitCost;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {[
          { id: 'tiles', label: isRTL ? '🧱 سيراميك وبلاط' : 'Tiles' },
          { id: 'paint', label: isRTL ? '🎨 دهان وبويات' : 'Paint' },
          { id: 'flooring', label: isRTL ? '🪵 أرضيات وباركيه' : 'Flooring' },
        ].map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMaterialType(m.id as any)}
            className={`py-2 rounded-xl text-xs font-bold transition-all ${
              materialType === m.id
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-[#181838] text-purple-300'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div>
          <label className="text-[11px] text-purple-300 block mb-0.5">{isRTL ? 'الطول (متر)' : 'Length (m)'}</label>
          <input
            type="number"
            min="0"
            step="0.1"
            value={length}
            onChange={(e) => setLength(parseFloat(e.target.value) || 0)}
            className="w-full rounded-lg bg-[#181838] p-2 text-xs text-white"
          />
        </div>
        <div>
          <label className="text-[11px] text-purple-300 block mb-0.5">{isRTL ? 'العرض (متر)' : 'Width (m)'}</label>
          <input
            type="number"
            min="0"
            step="0.1"
            value={width}
            onChange={(e) => setWidth(parseFloat(e.target.value) || 0)}
            className="w-full rounded-lg bg-[#181838] p-2 text-xs text-white"
          />
        </div>
        <div>
          <label className="text-[11px] text-purple-300 block mb-0.5">{isRTL ? 'الهدر الاحتياطي (%)' : 'Waste %'}</label>
          <input
            type="number"
            min="0"
            max="30"
            value={wasteFactor}
            onChange={(e) => setWasteFactor(parseFloat(e.target.value) || 0)}
            className="w-full rounded-lg bg-[#181838] p-2 text-xs text-white"
          />
        </div>
        <div>
          <label className="text-[11px] text-purple-300 block mb-0.5">{isRTL ? 'سعر المتر المربع' : 'Price/m²'}</label>
          <input
            type="number"
            min="0"
            value={unitCost}
            onChange={(e) => setUnitCost(parseFloat(e.target.value) || 0)}
            className="w-full rounded-lg bg-[#181838] p-2 text-xs text-white"
          />
        </div>
      </div>

      {/* Results */}
      <div className="rounded-2xl border border-purple-500/30 bg-[#161633] p-4 text-xs space-y-2">
        <div className="flex justify-between text-purple-200">
          <span>{isRTL ? 'المساحة الصافية للمكان:' : 'Net Area:'}</span>
          <strong>{area.toFixed(2)} م²</strong>
        </div>
        <div className="flex justify-between text-purple-200">
          <span>{isRTL ? 'المساحة المطلوبة مع الهدر:' : 'Area with Waste:'}</span>
          <strong className="text-white">{areaWithWaste.toFixed(2)} م²</strong>
        </div>
        {materialType === 'tiles' && (
          <div className="flex justify-between text-purple-200">
            <span>{isRTL ? 'عدد كراتين البلاط التقديري:' : 'Estimated Tile Boxes:'}</span>
            <strong className="text-emerald-400 font-black">{boxesNeeded} {isRTL ? 'كرتون' : 'boxes'}</strong>
          </div>
        )}
        {materialType === 'paint' && (
          <div className="flex justify-between text-purple-200">
            <span>{isRTL ? 'كمية الدهان المقدرة (وجهين):' : 'Estimated Paint (2 coats):'}</span>
            <strong className="text-emerald-400 font-black">{paintLiters} {isRTL ? 'لتر' : 'liters'}</strong>
          </div>
        )}
        <div className="flex justify-between text-base font-black text-emerald-400 pt-2 border-t border-purple-900/40">
          <span>{isRTL ? 'التكلفة الإجمالية التقديرية:' : 'Estimated Cost:'}</span>
          <span>{formatCurrency(estimatedCost, currency)}</span>
        </div>
      </div>
    </div>
  );
};

// 15. ⏰ حاسبة وقت وتكلفة مهام المشروع (Project Time & Labor Estimator)
export const ProjectTimeEstimatorTool: React.FC<ToolProps> = ({ currency, isRTL }) => {
  interface Task {
    id: string;
    title: string;
    hours: number;
  }

  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', title: isRTL ? 'تأسيس الهيكل وقاعدة البيانات' : 'Backend & DB Setup', hours: 16 },
    { id: '2', title: isRTL ? 'تصميم واجهة المستخدم' : 'Frontend UI', hours: 24 },
    { id: '3', title: isRTL ? 'الاختبار والمراجعة النهائية' : 'Testing & QA', hours: 8 },
  ]);

  const [workersCount, setWorkersCount] = useState<number>(2);
  const [dailyHoursPerWorker, setDailyHoursPerWorker] = useState<number>(6);
  const [hourlyWage, setHourlyWage] = useState<number>(40);

  const addTask = () => {
    setTasks((prev) => [
      ...prev,
      { id: String(Date.now()), title: isRTL ? 'مهمة جديدة' : 'New Task', hours: 8 },
    ]);
  };

  const removeTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const updateTask = (id: string, field: keyof Task, val: any) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, [field]: val } : t)));
  };

  const totalProjectHours = tasks.reduce((s, t) => s + (Number(t.hours) || 0), 0);
  const dailyTeamOutput = workersCount * dailyHoursPerWorker;
  const daysNeeded = dailyTeamOutput > 0 ? Math.ceil(totalProjectHours / dailyTeamOutput) : 0;
  const totalLaborCost = totalProjectHours * hourlyWage;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-[10px] text-purple-300 block mb-0.5">{isRTL ? 'عدد العمال/المنفذين' : 'Workers Count'}</label>
          <input
            type="number"
            min="1"
            value={workersCount}
            onChange={(e) => setWorkersCount(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full rounded-lg bg-[#181838] p-2 text-xs text-white"
          />
        </div>
        <div>
          <label className="text-[10px] text-purple-300 block mb-0.5">{isRTL ? 'ساعات العمل/يوم' : 'Hours/Day'}</label>
          <input
            type="number"
            min="1"
            max="16"
            value={dailyHoursPerWorker}
            onChange={(e) => setDailyHoursPerWorker(Math.max(1, parseFloat(e.target.value) || 1))}
            className="w-full rounded-lg bg-[#181838] p-2 text-xs text-white"
          />
        </div>
        <div>
          <label className="text-[10px] text-purple-300 block mb-0.5">{isRTL ? 'أجر الساعة للعامل' : 'Hourly Wage'}</label>
          <input
            type="number"
            min="0"
            value={hourlyWage}
            onChange={(e) => setHourlyWage(parseFloat(e.target.value) || 0)}
            className="w-full rounded-lg bg-[#181838] p-2 text-xs text-white"
          />
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs font-black text-white">{isRTL ? 'مهام المشروع' : 'Tasks'}</span>
          <button
            type="button"
            onClick={addTask}
            className="flex items-center gap-1 rounded-lg bg-purple-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-purple-500"
          >
            <Plus className="h-3 w-3" />
            <span>{isRTL ? 'إضافة مهمة' : 'Add Task'}</span>
          </button>
        </div>

        <div className="space-y-2 max-h-48 overflow-y-auto">
          {tasks.map((t) => (
            <div key={t.id} className="flex items-center gap-2 rounded-xl bg-[#181838] p-2 text-xs border border-purple-900/40">
              <input
                type="text"
                value={t.title}
                onChange={(e) => updateTask(t.id, 'title', e.target.value)}
                className="flex-1 bg-transparent border-none text-white outline-none font-bold"
              />
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={t.hours}
                onChange={(e) => updateTask(t.id, 'hours', parseFloat(e.target.value) || 0)}
                className="w-16 rounded-lg bg-[#101026] p-1.5 text-center text-white border border-purple-900/50"
              />
              <span className="text-[11px] text-purple-300/70">{isRTL ? 'ساعة' : 'hrs'}</span>
              <button
                type="button"
                onClick={() => removeTask(t.id)}
                className="text-red-400 hover:text-red-300 p-1"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/20 p-4 text-center">
          <span className="text-xs font-bold text-cyan-300 block">{isRTL ? 'المدة التقديرية للإنجاز' : 'Estimated Time'}</span>
          <div className="text-2xl font-black text-cyan-400 mt-1">
            {daysNeeded} {isRTL ? 'يوم عمل' : 'days'}
          </div>
          <span className="text-[10px] text-purple-300/70 block mt-1">
            {totalProjectHours} {isRTL ? 'إجمالي الساعات' : 'total hours'}
          </span>
        </div>

        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 text-center">
          <span className="text-xs font-bold text-emerald-300 block">{isRTL ? 'تكلفة العمالة الإجمالية' : 'Total Labor Cost'}</span>
          <div className="text-2xl font-black text-emerald-400 mt-1">
            {formatCurrency(totalLaborCost, currency)}
          </div>
        </div>
      </div>
    </div>
  );
};
