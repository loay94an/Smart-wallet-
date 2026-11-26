import React, { useState, useEffect } from 'react';
import { AppState, SecurityConfig } from '../types';
import { createPinCredential } from '../services/security';
import {
  Settings,
  Palette,
  Globe,
  DollarSign,
  Shield,
  Trash2,
  X,
  Check,
  Sun,
  Moon,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: AppState;
  onUpdateSettings: (newSettings: Partial<AppState['settings']>) => void;
  onUpdateSecurity: (newSecurity: SecurityConfig) => void;
  language: 'ar' | 'en';
}

const normalizeTheme = (value?: string): string => ({ purple: 'mono', blue: 'ocean', green: 'emerald', red: 'rose', orange: 'amber', pink: 'rose' } as Record<string, string>)[value || ''] || value || 'mono';

const THEME_OPTIONS = [
  { id: 'navy-emerald', nameAr: 'كحلي وزمردي', nameEn: 'Navy & Emerald', color: '#0F172A', secondary: '#10B981' },
  { id: 'mono', nameAr: 'أحادي', nameEn: 'Monochrome', color: '#27272a', secondary: '#a1a1aa' },
  { id: 'ocean', nameAr: 'أزرق محيطي', nameEn: 'Ocean Blue', color: '#087eaa', secondary: '#38bdf8' },
  { id: 'emerald', nameAr: 'أخضر زمردي', nameEn: 'Emerald', color: '#07845b', secondary: '#34d399' },
  { id: 'violet', nameAr: 'بنفسجي', nameEn: 'Violet', color: '#7651c8', secondary: '#a78bfa' },
  { id: 'amber', nameAr: 'كهرماني', nameEn: 'Amber', color: '#b7791f', secondary: '#fbbf24' },
  { id: 'rose', nameAr: 'وردي', nameEn: 'Rose', color: '#c04470', secondary: '#fb7185' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  state,
  onUpdateSettings,
  onUpdateSecurity,
  language,
}) => {
  const isRTL = language === 'ar';

  // All hooks called unconditionally at top level

  const [activeTheme, setActiveTheme] = useState<string>(normalizeTheme(state.settings?.theme));
  const [appearance, setAppearance] = useState<'light' | 'dark'>(state.settings?.appearance || 'light');
  const [currency, setCurrency] = useState<string>(state.settings?.currency || 'ر.س');

  const [securityType, setSecurityType] = useState<'off' | 'pin' | 'pattern'>(state.security?.type || 'off');
  const [newPin, setNewPin] = useState<string>(state.security?.pin || '');

  const [statusMsg, setStatusMsg] = useState<{ text: string; isError?: boolean } | null>(null);
  const [confirmingReset, setConfirmingReset] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTheme(state.settings?.theme === 'purple' ? 'mono' : (state.settings?.theme || 'navy-emerald'));
      setAppearance(state.settings?.appearance || 'light');
      setCurrency(state.settings?.currency || 'ر.س');
      setSecurityType(state.security?.type || 'off');
      setNewPin(state.security?.pin || '');
      setConfirmingReset(false);
      setStatusMsg(null);

    }
  }, [isOpen, state]);

  if (!isOpen) return null;

  const showStatus = (text: string, isError = false) => {
    setStatusMsg({ text, isError });
    setTimeout(() => setStatusMsg(null), 3500);
  };

  const handleSaveSettings = async () => {
    try {
      onUpdateSettings({
      theme: activeTheme,
      appearance,
      currency: currency.trim() || 'ر.س',
    });

    if (securityType === 'pin') {
      if (newPin) {
        const credential = await createPinCredential(newPin);
        onUpdateSecurity({
          enabled: true,
          type: 'pin',
          ...credential,
          pattern: [],
        });
      } else if (state.security.pinHash) {
        onUpdateSecurity({ ...state.security, enabled: true, type: 'pin', pin: '' });
      } else {
        showStatus(isRTL ? 'يرجى إدخال رمز PIN من 4 إلى 6 أرقام' : 'Enter a 4-6 digit PIN', true);
        return;
      }
    } else {
      onUpdateSecurity({
        enabled: securityType === 'pattern',
        type: securityType,
        pin: '',
        pinSalt: '',
        pinHash: '',
        pattern: securityType === 'pattern' ? state.security.pattern : [],
      });
    }

      onClose();
    } catch (error: any) {
      showStatus(isRTL ? 'تعذر حفظ إعدادات الحماية: ' + (error?.message || 'خطأ غير معروف') : 'Could not save security settings', true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-2xl border border-[var(--border-neutral)] bg-[var(--surface)] p-4 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-purple-900/40 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">{isRTL ? 'إعدادات التطبيق' : 'Settings'}</h3>
              <p className="text-[11px] text-purple-300/70">
                {isRTL ? 'الألوان، اللغة، العملة، وقفل التطبيق' : 'Colors, language, currency & app lock'}
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

        {/* 1. Color palette and appearance */}
        <div className="space-y-3 rounded-2xl border border-purple-900/40 bg-[#171736] p-4">
          <label className="text-xs font-bold text-purple-200 flex items-center gap-1.5">
            <Palette className="h-4 w-4 text-purple-400" />
            <span>{isRTL ? 'ألوان التطبيق' : 'Color palette'}</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {THEME_OPTIONS.map((th) => (
              <button
                key={th.id}
                type="button"
                aria-pressed={activeTheme === th.id}
                onClick={() => setActiveTheme(th.id)}
                className={`flex items-center gap-2 rounded-xl p-2.5 text-xs font-bold transition-all border ${
                  activeTheme === th.id
                    ? 'border-purple-400 bg-purple-900/20 text-white shadow-md ring-1 ring-purple-400/30'
                    : 'border-purple-900/30 bg-[#121226] text-purple-300 hover:border-purple-700'
                }`}
              >
                <span className="flex h-7 w-7 shrink-0 overflow-hidden rounded-full border border-black/10">
                  <span className="h-full w-1/2" style={{ backgroundColor: th.color }} />
                  <span className="h-full w-1/2" style={{ backgroundColor: th.secondary }} />
                </span>
                <span className="text-[11px]">{isRTL ? th.nameAr : th.nameEn}</span>
                {activeTheme === th.id && <Check className="ms-auto h-3.5 w-3.5" />}
              </button>
            ))}
          </div>
          <div className="border-t border-purple-900/30 pt-3 space-y-2">
            <label className="text-xs font-bold text-purple-200">{isRTL ? 'نمط العرض' : 'Appearance'}</label>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setAppearance('light')} aria-pressed={appearance === 'light'} className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-bold ${appearance === 'light' ? 'border-purple-400 bg-purple-900/30 text-white' : 'border-purple-900/30 bg-[#121226] text-purple-300'}`}>
                <Sun className="h-4 w-4" /> {isRTL ? 'نهاري' : 'Light'}
              </button>
              <button type="button" onClick={() => setAppearance('dark')} aria-pressed={appearance === 'dark'} className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-bold ${appearance === 'dark' ? 'border-purple-400 bg-purple-900/30 text-white' : 'border-purple-900/30 bg-[#121226] text-purple-300'}`}>
                <Moon className="h-4 w-4" /> {isRTL ? 'ليلي' : 'Dark'}
              </button>
            </div>
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

        {/* App lock */}
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
