import React, { useState, useRef, useEffect } from 'react';
import {
  Wallet,
  Cloud,
  Share2,
  Lock,
  Settings,
  Database,
  Download,
  Menu,
  ChevronDown,
  FileSpreadsheet,
  FileText,
  Calculator,
  SlidersHorizontal,
  X,
  ExternalLink,
  BookOpen,
  MoreVertical,
} from 'lucide-react';

interface NavbarProps {
  onOpenSync: () => void;
  onOpenShare: () => void;
  onOpenSettings: () => void;
  onOpenBackup: () => void;
  onOpenTools?: () => void;
  onExportExcel?: () => void;
  onExportPDF?: () => void;
  onLockApp: () => void;
  isSecurityEnabled: boolean;
  cloudSyncStatus?: { lastSynced?: string; isSyncing?: boolean };
  isIndexedDB: boolean;
  language: 'ar' | 'en';
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSync,
  onOpenShare,
  onOpenSettings,
  onOpenBackup,
  onOpenTools,
  onExportExcel,
  onExportPDF,
  onLockApp,
  isSecurityEnabled,
  cloudSyncStatus,
  isIndexedDB,
  language,
}) => {
  const isRTL = language === 'ar';
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  return (
    <header className="sticky top-0 z-40 border-b border-purple-900/30 bg-[#121226]/95 backdrop-blur-md px-3 sm:px-4 py-2.5 shadow-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2">
        {/* Logo and title */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 shadow-md shadow-purple-600/30">
            <Wallet className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-extrabold tracking-tight text-white sm:text-base md:text-lg">
                {isRTL ? 'المحفظة المالية الذكية' : 'Smart Financial Wallet'}
              </h1>
              {/* IndexedDB badge */}
              <span
                title={isIndexedDB ? (isRTL ? 'تخزين IndexedDB محلي نشط' : 'IndexedDB active') : 'LocalStorage'}
                className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20"
              >
                <Database className="h-3 w-3" />
                <span>IndexedDB</span>
              </span>
            </div>
            <p className="text-[11px] text-purple-300/70 hidden sm:block">
              {isRTL ? 'إدارة مالية شاملة • استيراد وتصدير • مزامنة سحابية' : 'Financial Management • Backup & Export • Cloud Sync'}
            </p>
          </div>
        </div>

        {/* Action Controls & Dropdown Menu */}
        <div className="flex items-center gap-2">
          {/* Quick Lock Button if security enabled */}
          {isSecurityEnabled && (
            <button
              type="button"
              onClick={onLockApp}
              title={isRTL ? 'قفل المحفظة' : 'Lock Wallet'}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-yellow-500/30 bg-yellow-950/20 text-yellow-400 transition-all hover:bg-yellow-900/40 active:scale-95 shadow-sm"
            >
              <Lock className="h-4 w-4" />
            </button>
          )}

          {/* Quick Settings Icon */}
          <button
            type="button"
            onClick={onOpenSettings}
            title={isRTL ? 'الإعدادات' : 'Settings'}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-purple-800/40 bg-[#1a1a38] text-purple-200 transition-all hover:bg-purple-800/40 active:scale-95 shadow-sm"
          >
            <Settings className="h-4 w-4" />
          </button>

          {/* Main Dropdown Button: Three dots icon only */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-all shadow-sm active:scale-95 ${
                isDropdownOpen
                  ? 'border-purple-400 bg-purple-600 text-white shadow-purple-600/30'
                  : 'border-purple-800/40 bg-[#1a1a38] text-purple-200 hover:bg-purple-800/40'
              }`}
              title={isRTL ? 'قائمة الأدوات والخيارات' : 'Tools & Options Menu'}
              aria-expanded={isDropdownOpen}
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {/* Dropdown Menu Popup */}
            {isDropdownOpen && (
              <div
                className={`absolute ${
                  isRTL ? 'left-0' : 'right-0'
                } mt-2 w-72 sm:w-80 rounded-2xl border border-purple-700/50 bg-[#14142d] p-2 shadow-2xl backdrop-blur-xl z-50 animate-fadeIn`}
                dir={isRTL ? 'rtl' : 'ltr'}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-purple-900/40 mb-1">
                  <span className="text-xs font-black text-white flex items-center gap-1.5">
                    <SlidersHorizontal className="h-3.5 w-3.5 text-purple-400" />
                    <span>{isRTL ? 'لوحة الأدوات والخدمات' : 'Tools & Services'}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(false)}
                    className="text-purple-400 hover:text-white p-0.5 rounded transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Section 1: Backup & Cloud */}
                <div className="px-1 py-1 space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-purple-400/80 px-2 pt-1">
                    {isRTL ? 'النسخ الاحتياطي والمزامنة' : 'Backup & Sync'}
                  </div>

                  {/* Backup & Import Center */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onOpenBackup();
                    }}
                    className="w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-950/40 hover:text-white transition-all text-start"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                      <Download className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-extrabold">{isRTL ? 'مركز النسخ والاستيراد' : 'Backup & Import Center'}</div>
                      <div className="text-[10px] text-emerald-300/70 font-normal">
                        {isRTL ? 'حفظ نسخة، استيراد ملف، دمج بيانات' : 'Export & import JSON state'}
                      </div>
                    </div>
                  </button>

                  {/* Cloud Sync */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onOpenSync();
                    }}
                    className="w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-bold text-cyan-300 hover:bg-cyan-950/40 hover:text-white transition-all text-start"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400">
                      <Cloud className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-extrabold">{isRTL ? 'المزامنة السحابية' : 'Cloud Sync'}</div>
                      <div className="text-[10px] text-cyan-300/70 font-normal">
                        {isRTL ? 'مزامنة مع السحابة عبر رمز سري' : 'Sync data across devices'}
                      </div>
                    </div>
                  </button>
                </div>

                {/* Section 2: Universal Export */}
                {(onExportExcel || onExportPDF) && (
                  <div className="px-1 py-1 space-y-1 border-t border-purple-900/30">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-purple-400/80 px-2 pt-1">
                      {isRTL ? 'تصدير شامل للبيانات' : 'Export All Data'}
                    </div>

                    {onExportExcel && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsDropdownOpen(false);
                          onExportExcel();
                        }}
                        className="w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-bold text-green-300 hover:bg-green-950/40 hover:text-white transition-all text-start"
                      >
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-500/20 text-green-400">
                          <FileSpreadsheet className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <div className="text-xs font-extrabold">{isRTL ? 'تصدير دفتر كامل Excel (.xlsx)' : 'Export Full Excel Workbook'}</div>
                          <div className="text-[10px] text-green-300/70 font-normal">
                            {isRTL ? 'معاملات، ديون، مشاريع، ميزانيات' : 'All transactions, debts & work'}
                          </div>
                        </div>
                      </button>
                    )}

                    {onExportPDF && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsDropdownOpen(false);
                          onExportPDF();
                        }}
                        className="w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-bold text-pink-300 hover:bg-pink-950/40 hover:text-white transition-all text-start"
                      >
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-pink-500/20 text-pink-400">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <div className="text-xs font-extrabold">{isRTL ? 'تصدير تقرير مالي كامل PDF' : 'Export Full PDF Report'}</div>
                          <div className="text-[10px] text-pink-300/70 font-normal">
                            {isRTL ? 'تقرير رسمي منسق قابل للطباعة' : 'Printable styled financial report'}
                          </div>
                        </div>
                      </button>
                    )}
                  </div>
                )}

                {/* Section 3: Tools & Sharing */}
                <div className="px-1 py-1 space-y-1 border-t border-purple-900/30">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-purple-400/80 px-2 pt-1">
                    {isRTL ? 'الأدوات والمشاركة' : 'Tools & Share'}
                  </div>

                  {onOpenTools && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onOpenTools();
                      }}
                      className="w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-bold text-amber-300 hover:bg-amber-950/40 hover:text-white transition-all text-start"
                    >
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
                        <Calculator className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-extrabold">{isRTL ? 'الأدوات المالية والحاسبات' : 'Financial Tools & Calc'}</div>
                        <div className="text-[10px] text-amber-300/70 font-normal">
                          {isRTL ? 'حاسبة الزكاة، القروض، محول العملات' : 'Zakat, loan calculator, currency'}
                        </div>
                      </div>
                    </button>
                  )}

                  {/* Share Report */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onOpenShare();
                    }}
                    className="w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-bold text-pink-300 hover:bg-pink-950/40 hover:text-white transition-all text-start"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-pink-500/20 text-pink-400">
                      <Share2 className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-extrabold">{isRTL ? 'مشاركة التقرير السريع' : 'Quick Share Report'}</div>
                      <div className="text-[10px] text-pink-300/70 font-normal">
                        {isRTL ? 'واتساب، تلجرام، بريد إلكتروني' : 'WhatsApp, Telegram, Email'}
                      </div>
                    </div>
                  </button>
                </div>

                {/* Section 4: Settings & Security */}
                <div className="px-1 py-1 space-y-1 border-t border-purple-900/30">
                  <button
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onOpenSettings();
                    }}
                    className="w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-bold text-purple-300 hover:bg-purple-950/50 hover:text-white transition-all text-start"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/20 text-purple-300">
                      <Settings className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-extrabold">{isRTL ? 'الإعدادات والمظهر' : 'Settings & Themes'}</div>
                      <div className="text-[10px] text-purple-300/70 font-normal">
                        {isRTL ? 'العملة، السمة، الأمان PIN' : 'Currency, theme, PIN security'}
                      </div>
                    </div>
                  </button>

                  {isSecurityEnabled && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onLockApp();
                      }}
                      className="w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-bold text-yellow-300 hover:bg-yellow-950/40 hover:text-white transition-all text-start"
                    >
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-yellow-500/20 text-yellow-400">
                        <Lock className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-extrabold">{isRTL ? 'قفل التطبيق الآن' : 'Lock Application Now'}</div>
                        <div className="text-[10px] text-yellow-300/70 font-normal">
                          {isRTL ? 'حماية بياناتك برمز القفل' : 'Lock session with PIN'}
                        </div>
                      </div>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
