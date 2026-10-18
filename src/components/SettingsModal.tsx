import React, { useState, useEffect, useRef } from 'react';
import { AppState, SecurityConfig } from '../types';
import { dbService } from '../services/db';
import { sharingService } from '../services/sharing';
import { parseAndInspectBackup } from '../services/backupParser';
import {
  Settings,
  Palette,
  Globe,
  DollarSign,
  Shield,
  Upload,
  Download,
  Trash2,
  Database,
  X,
  Mail,
  Check,
  Sparkles,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: AppState;
  onUpdateSettings: (newSettings: Partial<AppState['settings']>) => void;
  onUpdateSecurity: (newSecurity: SecurityConfig) => void;
  onImportFullState: (newState: AppState) => void;
  onResetAllData: () => void;
  onOpenBackupCenter?: () => void;
  language: 'ar' | 'en';
}

const THEME_OPTIONS = [
  { id: 'purple', nameAr: '🟣 بنفسجي عصري', color: '#7c3aed' },
  { id: 'blue', nameAr: '🔵 أزرق محيطي', color: '#2563eb' },
  { id: 'green', nameAr: '🟢 أخضر مالي', color: '#059669' },
  { id: 'red', nameAr: '🔴 ياقوتي أنيق', color: '#dc2626' },
  { id: 'orange', nameAr: '🟠 كهرماني دافئ', color: '#ea580c' },
  { id: 'pink', nameAr: '🩷 وردي فاقع', color: '#db2777' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  state,
  onUpdateSettings,
  onUpdateSecurity,
  onImportFullState,
  onResetAllData,
  onOpenBackupCenter,
  language,
}) => {
  const isRTL = language === 'ar';

  // All hooks called unconditionally at top level
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTheme, setActiveTheme] = useState<string>(state.settings?.theme || 'purple');
  const [currency, setCurrency] = useState<string>(state.settings?.currency || 'ر.س');
  const [userEmail, setUserEmail] = useState<string>(state.settings?.userEmail || 'loay94an@gmail.com');
  const [storageInfo, setStorageInfo] = useState<{ usedBytes: number; quotaBytes: number } | null>(null);

  const [securityType, setSecurityType] = useState<'off' | 'pin' | 'pattern'>(state.security?.type || 'off');
  const [newPin, setNewPin] = useState<string>(state.security?.pin || '');

  const [statusMsg, setStatusMsg] = useState<{ text: string; isError?: boolean } | null>(null);
  const [confirmingReset, setConfirmingReset] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTheme(state.settings?.theme || 'purple');
      setCurrency(state.settings?.currency || 'ر.س');
      setUserEmail(state.settings?.userEmail || 'loay94an@gmail.com');
      setSecurityType(state.security?.type || 'off');
      setNewPin(state.security?.pin || '');
      setConfirmingReset(false);
      setStatusMsg(null);

      dbService.getStorageInfo().then((info) => {
        setStorageInfo(info);
      });
    }
  }, [isOpen, state]);

  if (!isOpen) return null;

  const showStatus = (text: string, isError = false) => {
    setStatusMsg({ text, isError });
    setTimeout(() => setStatusMsg(null), 3500);
  };

  const handleSaveSettings = () => {
    onUpdateSettings({
      theme: activeTheme,
      currency: currency.trim() || 'ر.س',
      userEmail: userEmail.trim() || 'loay94an@gmail.com',
    });

    onUpdateSecurity({
      enabled: securityType !== 'off',
      type: securityType,
      pin: securityType === 'pin' ? newPin : '',
      pattern: securityType === 'pattern' ? state.security.pattern : [],
    });

    onClose();
  };

  const handleExportBackup = () => {
    try {
      sharingService.downloadJSONBackup(state);
      showStatus(isRTL ? '✅ تم تحميل ملف النسخة الاحتياطية بنجاح' : '✅ Backup downloaded successfully');
    } catch (e: any) {
      showStatus(isRTL ? 'فشل التصدير: ' + e.message : 'Export failed: ' + e.message, true);
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const result = parseAndInspectBackup(text);
        if (result.success && result.inspection) {
          onImportFullState(result.inspection.state);
          showStatus(
            isRTL
              ? `✅ تم استيراد النسخة بنجاح (${result.inspection.transactionsCount} معاملة)!`
              : `✅ Backup imported (${result.inspection.transactionsCount} txs)!`
          );
        } else {
          showStatus(result.error || (isRTL ? 'الملف غير صالح أو تالف!' : 'Invalid backup file!'), true);
        }
      } catch (err: any) {
        showStatus(isRTL ? 'خطأ أثناء قراءة الملف: ' + err.message : 'Error reading file', true);
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl border border-purple-500/30 bg-[#14142d] p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-purple-900/40 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">{isRTL ? 'إعدادات التطبيق' : 'Settings'}</h3>
              <p className="text-[11px] text-purple-300/70">
                {isRTL ? 'المظهر، العملة، الأمان، والتخزين' : 'Theme, currency, security & storage'}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-purple-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Status Message Toast */}
        {statusMsg && (
          <div
            className={`rounded-2xl border p-3 text-center text-xs font-bold animate-fadeIn ${
              statusMsg.isError
                ? 'border-red-500/50 bg-red-950/40 text-red-300'
                : 'border-emerald-500/50 bg-emerald-950/40 text-emerald-300'
            }`}
          >
            {statusMsg.text}
          </div>
        )}

        {/* 1. Theme Selector */}
        <div className="space-y-2 rounded-2xl border border-purple-900/40 bg-[#171736] p-4">
          <label className="text-xs font-bold text-purple-200 flex items-center gap-1.5">
            <Palette className="h-4 w-4 text-purple-400" />
            <span>{isRTL ? 'مظهر التطبيق (Theme)' : 'Theme'}</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {THEME_OPTIONS.map((th) => (
              <button
                key={th.id}
                type="button"
                onClick={() => setActiveTheme(th.id)}
                className={`flex items-center gap-2 rounded-xl p-2.5 text-xs font-bold transition-all border ${
                  activeTheme === th.id
                    ? 'border-purple-400 bg-purple-900/40 text-white shadow-md'
                    : 'border-purple-900/30 bg-[#121226] text-purple-300 hover:border-purple-700'
                }`}
              >
                <span className="h-4 w-4 rounded-full" style={{ backgroundColor: th.color }} />
                <span className="text-[11px]">{th.nameAr}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 2. Language & Currency */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-purple-900/40 bg-[#171736] p-4 space-y-1.5">
            <label className="text-xs font-bold text-purple-200 flex items-center gap-1.5">
              <Globe className="h-4 w-4 text-purple-400" />
              <span>{isRTL ? 'اللغة' : 'Language'}</span>
            </label>
            <select
              value={state.settings.language}
              onChange={(e) => onUpdateSettings({ language: e.target.value as any })}
              className="w-full rounded-xl border border-purple-900/50 bg-[#101026] p-2 text-xs font-bold text-white outline-none"
            >
              <option value="ar">🇸🇦 العربية</option>
              <option value="en">🇬🇧 English</option>
            </select>
          </div>

          <div className="rounded-2xl border border-purple-900/40 bg-[#171736] p-4 space-y-1.5">
            <label className="text-xs font-bold text-purple-200 flex items-center gap-1.5">
              <DollarSign className="h-4 w-4 text-purple-400" />
              <span>{isRTL ? 'رمز العملة' : 'Currency'}</span>
            </label>
            <input
              type="text"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              placeholder="ر.س"
              className="w-full rounded-xl border border-purple-900/50 bg-[#101026] p-2 text-xs font-bold text-white outline-none"
            />
          </div>
        </div>

        {/* 3. Default Backup Email */}
        <div className="rounded-2xl border border-purple-900/40 bg-[#171736] p-4 space-y-1.5">
          <label className="text-xs font-bold text-purple-200 flex items-center gap-1.5">
            <Mail className="h-4 w-4 text-purple-400" />
            <span>{isRTL ? 'بريدك الإلكتروني للنسخ الاحتياطي' : 'Backup Email'}</span>
          </label>
          <input
            type="email"
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
            placeholder="loay94an@gmail.com"
            className="w-full rounded-xl border border-purple-900/50 bg-[#101026] p-2 text-xs font-bold text-white outline-none"
          />
        </div>

        {/* 4. Security Lock Settings */}
        <div className="rounded-2xl border border-purple-900/40 bg-[#171736] p-4 space-y-3">
          <label className="text-xs font-bold text-purple-200 flex items-center gap-1.5">
            <Shield className="h-4 w-4 text-purple-400" />
            <span>{isRTL ? 'قفل وحماية التطبيق' : 'App Security'}</span>
          </label>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSecurityType('off')}
              className={`py-2 rounded-xl text-xs font-bold ${
                securityType === 'off' ? 'bg-purple-600 text-white' : 'bg-[#101026] text-purple-300'
              }`}
            >
              🔓 {isRTL ? 'معطل' : 'Disabled'}
            </button>
            <button
              type="button"
              onClick={() => setSecurityType('pin')}
              className={`py-2 rounded-xl text-xs font-bold ${
                securityType === 'pin' ? 'bg-purple-600 text-white' : 'bg-[#101026] text-purple-300'
              }`}
            >
              🔢 PIN (رمز سري)
            </button>
          </div>

          {securityType === 'pin' && (
            <div>
              <label className="text-[11px] text-purple-300 block mb-1">
                {isRTL ? 'أدخل رمز PIN الجديد (4-6 أرقام)' : 'Enter 4-6 digit PIN'}
              </label>
              <input
                type="password"
                maxLength={6}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="1234"
                className="w-full rounded-xl border border-purple-900/50 bg-[#101026] p-2 text-center text-sm font-black tracking-widest text-white outline-none"
              />
            </div>
          )}
        </div>

        {/* 5. Storage Info */}
        <div className="rounded-2xl border border-purple-900/40 bg-[#171736] p-4 text-xs space-y-1">
          <div className="flex items-center justify-between text-purple-200 font-bold">
            <span className="flex items-center gap-1.5">
              <Database className="h-4 w-4 text-emerald-400" />
              <span>{isRTL ? 'محرك التخزين المحلي' : 'Storage Engine'}</span>
            </span>
            <span className="text-emerald-400">IndexedDB ✓</span>
          </div>
          {storageInfo && storageInfo.usedBytes > 0 && (
            <p className="text-[11px] text-purple-300/60 pt-1">
              {isRTL ? 'المساحة المستخدمة:' : 'Used storage:'}{' '}
              {(storageInfo.usedBytes / 1024).toFixed(1)} KB
            </p>
          )}
        </div>

        {/* 6. Import / Export / Backup Center Link */}
        <div className="space-y-3 border-t border-purple-900/30 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-300">
              {isRTL ? 'النسخ الاحتياطي واسترجاع البيانات' : 'Backup & Restore'}
            </span>
            {onOpenBackupCenter && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenBackupCenter();
                }}
                className="flex items-center gap-1 text-[11px] font-black text-cyan-400 hover:text-cyan-300"
              >
                <Sparkles className="h-3 w-3" />
                <span>{isRTL ? 'فتح مركز النسخ والاستيراد المتكامل' : 'Open Full Backup Center'}</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleExportBackup}
              className="flex items-center justify-center gap-2 rounded-xl border border-emerald-700/50 bg-emerald-950/30 py-2.5 text-xs font-bold text-emerald-300 hover:bg-emerald-900/40 active:scale-95"
            >
              <Download className="h-4 w-4 text-emerald-400" />
              <span>{isRTL ? 'تصدير نسخة (JSON)' : 'Export JSON'}</span>
            </button>

            <label className="flex items-center justify-center gap-2 rounded-xl border border-cyan-700/50 bg-cyan-950/30 py-2.5 text-xs font-bold text-cyan-300 hover:bg-cyan-900/40 active:scale-95 cursor-pointer">
              <Upload className="h-4 w-4 text-cyan-400" />
              <span>{isRTL ? 'استيراد ملف (JSON)' : 'Import JSON'}</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.txt"
                onChange={handleImportFile}
                className="hidden"
              />
            </label>
          </div>

          {/* Reset All Data with in-UI confirmation */}
          {!confirmingReset ? (
            <button
              type="button"
              onClick={() => setConfirmingReset(true)}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-red-900/40 bg-red-950/20 py-2 text-xs font-bold text-red-400 hover:bg-red-950/40"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>{isRTL ? 'حذف كافة البيانات وإعادة الضبط' : 'Reset All Data'}</span>
            </button>
          ) : (
            <div className="rounded-xl border border-red-600/60 bg-red-950/40 p-2.5 text-center space-y-2 animate-fadeIn">
              <span className="text-[11px] font-bold text-red-300 block">
                {isRTL ? 'هل أنت متأكد تماماً من رغبتك في حذف كافة البيانات؟' : 'Are you sure you want to delete all data?'}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmingReset(false)}
                  className="flex-1 rounded-lg bg-[#14142d] py-1.5 text-xs font-bold text-purple-300"
                >
                  {isRTL ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onResetAllData();
                    onClose();
                  }}
                  className="flex-1 rounded-lg bg-red-600 py-1.5 text-xs font-black text-white hover:bg-red-500"
                >
                  {isRTL ? 'نعم، حذف نهائي' : 'Yes, Delete'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Save button */}
        <button
          type="button"
          onClick={handleSaveSettings}
          className="w-full rounded-2xl bg-purple-600 py-3 text-xs font-black text-white shadow-lg shadow-purple-600/30 hover:bg-purple-500 active:scale-95"
        >
          {isRTL ? 'حفظ الإعدادات' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
};
