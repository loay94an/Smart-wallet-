import React, { useEffect, useState } from 'react';
import { AppState, SecurityConfig } from '../types';
import { createPinCredential } from '../services/security';
import { Settings, Palette, Globe, DollarSign, Shield, X, Check, Sun, Moon, Lock, Fingerprint } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: AppState;
  onUpdateSettings: (newSettings: Partial<AppState['settings']>) => void;
  onUpdateSecurity: (newSecurity: SecurityConfig) => void;
  language: 'ar' | 'en';
}

const THEME_OPTIONS = [
  { id: 'navy-emerald', nameAr: 'كحلي وزمردي', nameEn: 'Navy & Emerald', color: '#0F172A', secondary: '#10B981' },
  { id: 'mono', nameAr: 'أحادي', nameEn: 'Monochrome', color: '#27272a', secondary: '#a1a1aa' },
  { id: 'ocean', nameAr: 'أزرق محيطي', nameEn: 'Ocean Blue', color: '#087eaa', secondary: '#38bdf8' },
  { id: 'emerald', nameAr: 'أخضر زمردي', nameEn: 'Emerald', color: '#07845b', secondary: '#34d399' },
  { id: 'violet', nameAr: 'بنفسجي', nameEn: 'Violet', color: '#7651c8', secondary: '#a78bfa' },
  { id: 'amber', nameAr: 'كهرماني', nameEn: 'Amber', color: '#b7791f', secondary: '#fbbf24' },
  { id: 'rose', nameAr: 'وردي', nameEn: 'Rose', color: '#c04470', secondary: '#fb7185' },
];

const fieldClass = 'w-full rounded-xl border border-[var(--border-neutral)] bg-[var(--surface-muted)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]';
const sectionClass = 'space-y-3 rounded-xl border border-[var(--border-neutral)] bg-[var(--surface)] p-3';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen, onClose, state, onUpdateSettings, onUpdateSecurity, language,
}) => {
  const [activeTheme, setActiveTheme] = useState('navy-emerald');
  const [appearance, setAppearance] = useState<'light' | 'dark'>('light');
  const [currency, setCurrency] = useState('ر.س');
  const [selectedLanguage, setSelectedLanguage] = useState<'ar' | 'en'>(language);
  const [securityType, setSecurityType] = useState<'off' | 'pin' | 'pattern'>('off');
  const [newPin, setNewPin] = useState('');
  const [pattern, setPattern] = useState<number[]>([]);
  const [confirmPattern, setConfirmPattern] = useState<number[]>([]);
  const [patternStep, setPatternStep] = useState<'create' | 'confirm'>('create');
  const [statusMsg, setStatusMsg] = useState<{ text: string; isError?: boolean } | null>(null);
  const isRTL = selectedLanguage === 'ar';

  // Initialize drafts only when the dialog opens. Changes elsewhere in AppState
  // must not overwrite edits that the user has not saved yet.
  useEffect(() => {
    if (!isOpen) return;
    const themeAliases: Record<string, string> = { purple: 'mono', blue: 'ocean', green: 'emerald', red: 'rose', orange: 'amber', pink: 'rose' };
    const theme = state.settings?.theme || 'navy-emerald';
    setActiveTheme(themeAliases[theme] || theme);
    setAppearance(state.settings?.appearance || 'light');
    setCurrency(state.settings?.currency || 'ر.س');
    setSelectedLanguage(state.settings?.language || language);
    setSecurityType(state.security?.type || 'off');
    setNewPin('');
    setPattern([]);
    setConfirmPattern([]);
    setPatternStep('create');
    setStatusMsg(null);
  }, [isOpen]);

  if (!isOpen) return null;

  const showError = (text: string) => setStatusMsg({ text, isError: true });
  const addPatternDot = (dot: number) => {
    if (patternStep === 'create') {
      setPattern((prev) => prev.includes(dot) ? prev : [...prev, dot]);
    } else {
      setConfirmPattern((prev) => prev.includes(dot) ? prev : [...prev, dot]);
    }
  };
  const resetPattern = () => {
    if (patternStep === 'create') setPattern([]);
    else setConfirmPattern([]);
  };

  const handleSave = async () => {
    try {
      let nextSecurity: SecurityConfig = state.security || { enabled: false, type: 'off', pin: '', pattern: [] };

      if (securityType === 'off') {
        nextSecurity = { enabled: false, type: 'off', pin: '', pinSalt: '', pinHash: '', pattern: [] };
      } else if (securityType === 'pin') {
        if (newPin) {
          if (!/^\d{4,6}$/.test(newPin)) {
            showError(isRTL ? 'رمز PIN يجب أن يتكون من 4 إلى 6 أرقام' : 'PIN must contain 4 to 6 digits');
            return;
          }
          const credential = await createPinCredential(newPin);
          nextSecurity = { enabled: true, type: 'pin', ...credential, pattern: [] };
        } else if (state.security?.type === 'pin' && state.security.pinHash) {
          nextSecurity = { ...state.security, enabled: true, type: 'pin' };
        } else {
          showError(isRTL ? 'أدخل رمز PIN جديدًا من 4 إلى 6 أرقام' : 'Enter a new 4-6 digit PIN');
          return;
        }
      } else {
        if (patternStep !== 'confirm' || pattern.length < 4 || confirmPattern.length < 4) {
          showError(isRTL ? 'أنشئ نمطًا من 4 نقاط على الأقل ثم أكّده' : 'Create and confirm a pattern with at least 4 dots');
          return;
        }
        if (pattern.join(',') !== confirmPattern.join(',')) {
          showError(isRTL ? 'النمط التأكيدي غير مطابق. أعد المحاولة' : 'Pattern confirmation does not match');
          setConfirmPattern([]);
          setPatternStep('confirm');
          return;
        }
        nextSecurity = { enabled: true, type: 'pattern', pin: '', pinSalt: '', pinHash: '', pattern };
      }

      // Apply settings only after all security validation has passed.
      onUpdateSettings({
        theme: activeTheme,
        appearance,
        currency: currency.trim() || 'ر.س',
        language: selectedLanguage,
      });
      onUpdateSecurity(nextSecurity);
      onClose();
    } catch (error: any) {
      showError(isRTL ? 'تعذر حفظ الإعدادات: ' + (error?.message || 'خطأ غير معروف') : 'Could not save settings: ' + (error?.message || 'Unknown error'));
    }
  };

  const cardTitle = 'text-xs font-extrabold text-[var(--text-primary)] flex items-center gap-2';
  const muted = 'text-[11px] text-[var(--text-secondary)]';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-2xl border border-[var(--border-neutral)] bg-[var(--canvas)] p-3 sm:p-4 shadow-2xl space-y-3">
        <header className="flex items-center justify-between border-b border-[var(--border-neutral)] pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]"><Settings className="h-5 w-5" /></div>
            <div>
              <h3 className="text-base font-black text-[var(--text-primary)]">{isRTL ? 'إعدادات التطبيق' : 'App Settings'}</h3>
              <p className={muted}>{isRTL ? 'المظهر واللغة والعملة والحماية' : 'Appearance, language, currency and security'}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label={isRTL ? 'إغلاق' : 'Close'} className="rounded-xl p-2 text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"><X className="h-5 w-5" /></button>
        </header>

        {statusMsg && <div role="alert" className={`rounded-xl border p-3 text-xs font-bold ${statusMsg.isError ? 'border-red-500/40 bg-red-500/10 text-red-600' : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600'}`}>{statusMsg.text}</div>}

        <section className={sectionClass}>
          <div className={cardTitle}><Palette className="h-4 w-4 text-[var(--accent)]" />{isRTL ? 'المظهر والألوان' : 'Appearance & Colors'}</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {THEME_OPTIONS.map((theme) => (
              <button key={theme.id} type="button" aria-pressed={activeTheme === theme.id} onClick={() => setActiveTheme(theme.id)}
                className={`flex items-center gap-2 rounded-lg border p-2 text-start transition-colors ${activeTheme === theme.id ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'border-[var(--border-neutral)] bg-[var(--surface-muted)]'}`}>
                <span className="flex h-7 w-7 shrink-0 overflow-hidden rounded-full border border-black/10"><span className="h-full w-1/2" style={{ backgroundColor: theme.color }} /><span className="h-full w-1/2" style={{ backgroundColor: theme.secondary }} /></span>
                <span className="min-w-0 flex-1 text-[11px] font-bold text-[var(--text-primary)]">{isRTL ? theme.nameAr : theme.nameEn}</span>
                {activeTheme === theme.id && <Check className="h-3.5 w-3.5 text-[var(--accent)]" />}
              </button>
            ))}
          </div>
          <div className="border-t border-[var(--border-neutral)] pt-3 space-y-2">
            <label className={cardTitle}>{isRTL ? 'وضع العرض' : 'Display Mode'}</label>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" aria-pressed={appearance === 'light'} onClick={() => setAppearance('light')} className={`flex items-center justify-center gap-2 rounded-lg border p-2 text-xs font-bold ${appearance === 'light' ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]' : 'border-[var(--border-neutral)] bg-[var(--surface-muted)] text-[var(--text-secondary)]'}`}><Sun className="h-4 w-4" />{isRTL ? 'نهاري' : 'Light'}</button>
              <button type="button" aria-pressed={appearance === 'dark'} onClick={() => setAppearance('dark')} className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-bold ${appearance === 'dark' ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]' : 'border-[var(--border-neutral)] bg-[var(--surface-muted)] text-[var(--text-secondary)]'}`}><Moon className="h-4 w-4" />{isRTL ? 'ليلي' : 'Dark'}</button>
            </div>
          </div>
        </section>

        <section className={sectionClass}>
          <div className={cardTitle}><Globe className="h-4 w-4 text-[var(--accent)]" />{isRTL ? 'اللغة والعملة' : 'Language & Currency'}</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="space-y-1.5"><span className={muted}>{isRTL ? 'لغة التطبيق' : 'App language'}</span>
              <select value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value as 'ar' | 'en')} className={fieldClass}><option value="ar">العربية</option><option value="en">English</option></select>
            </label>
            <label className="space-y-1.5"><span className={muted}>{isRTL ? 'رمز العملة' : 'Currency symbol'}</span>
              <input value={currency} onChange={(e) => setCurrency(e.target.value)} maxLength={8} placeholder="د.أ" className={fieldClass} />
            </label>
          </div>
        </section>

        <section className={sectionClass}>
          <div className={cardTitle}><Shield className="h-4 w-4 text-[var(--accent)]" />{isRTL ? 'حماية التطبيق' : 'App Security'}</div>
          <p className={muted}>{isRTL ? 'اختر طريقة القفل. لا يتم تغيير الحماية إلا بعد حفظ الإعدادات.' : 'Choose a lock method. Security changes are applied only after saving.'}</p>
          <div className="grid grid-cols-3 gap-2">
            <button type="button" aria-pressed={securityType === 'off'} onClick={() => setSecurityType('off')} className={`rounded-xl border p-2.5 text-xs font-bold ${securityType === 'off' ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]' : 'border-[var(--border-neutral)] bg-[var(--surface-muted)] text-[var(--text-secondary)]'}`}>{isRTL ? 'بدون قفل' : 'Off'}</button>
            <button type="button" aria-pressed={securityType === 'pin'} onClick={() => setSecurityType('pin')} className={`rounded-xl border p-2.5 text-xs font-bold ${securityType === 'pin' ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]' : 'border-[var(--border-neutral)] bg-[var(--surface-muted)] text-[var(--text-secondary)]'}`}><Lock className="inline h-3.5 w-3.5 me-1" />PIN</button>
            <button type="button" aria-pressed={securityType === 'pattern'} onClick={() => { setSecurityType('pattern'); setPattern([]); setConfirmPattern([]); setPatternStep('create'); }} className={`rounded-xl border p-2.5 text-xs font-bold ${securityType === 'pattern' ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]' : 'border-[var(--border-neutral)] bg-[var(--surface-muted)] text-[var(--text-secondary)]'}`}><Fingerprint className="inline h-3.5 w-3.5 me-1" />{isRTL ? 'نمط' : 'Pattern'}</button>
          </div>
          {securityType === 'pin' && <label className="block space-y-1.5"><span className={muted}>{state.security?.type === 'pin' ? (isRTL ? 'اتركه فارغًا للإبقاء على الرمز الحالي، أو أدخل رمزًا جديدًا' : 'Leave blank to keep the current PIN, or enter a new one') : (isRTL ? 'رمز PIN جديد (4–6 أرقام)' : 'New PIN (4–6 digits)')}</span><input type="password" inputMode="numeric" autoComplete="new-password" maxLength={6} value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="••••" className={`${fieldClass} text-center tracking-[0.5em]`} /></label>}
          {securityType === 'pattern' && <div className="space-y-3">
            <div className="flex items-center justify-between gap-2"><p className={muted}>{patternStep === 'create' ? (isRTL ? 'ارسم النمط: اختر 4 نقاط على الأقل بالترتيب' : 'Create: select at least 4 dots in order') : (isRTL ? 'أعد اختيار النقاط بالترتيب نفسه للتأكيد' : 'Confirm by selecting the same dots in order')}</p><button type="button" onClick={resetPattern} className="text-[11px] font-bold text-[var(--accent)]">{isRTL ? 'مسح' : 'Clear'}</button></div>
            <div className="mx-auto grid max-w-[210px] grid-cols-3 gap-2.5 rounded-xl border border-[var(--border-neutral)] bg-[var(--surface-muted)] p-3">
              {Array.from({ length: 9 }, (_, index) => {
                const active = (patternStep === 'create' ? pattern : confirmPattern).includes(index);
                const order = (patternStep === 'create' ? pattern : confirmPattern).indexOf(index);
                return <button key={index} type="button" aria-label={`${isRTL ? 'نقطة' : 'Dot'} ${index + 1}`} aria-pressed={active} onClick={() => addPatternDot(index)} className={`aspect-square rounded-full border-2 text-xs font-black transition-colors ${active ? 'border-[var(--accent)] bg-[var(--accent)] text-white' : 'border-[var(--border-neutral)] bg-[var(--surface)] text-[var(--text-secondary)]'}`}>{active ? order + 1 : ''}</button>;
              })}
            </div>
            <p className={muted}>{isRTL ? 'النقاط المختارة: ' : 'Selected dots: '}{(patternStep === 'create' ? pattern : confirmPattern).length}</p>
            {patternStep === 'create' && pattern.length >= 4 && <button type="button" onClick={() => setPatternStep('confirm')} className="w-full rounded-xl bg-[var(--accent)] px-3 py-2.5 text-xs font-bold text-white">{isRTL ? 'متابعة لتأكيد النمط' : 'Continue to confirm pattern'}</button>}
            {patternStep === 'confirm' && confirmPattern.length >= 4 && <button type="button" onClick={() => { if (pattern.join(',') === confirmPattern.join(',')) setStatusMsg({ text: isRTL ? 'تم تأكيد النمط. اضغط حفظ لتفعيله.' : 'Pattern confirmed. Save to enable it.' }); else { setConfirmPattern([]); showError(isRTL ? 'النمط غير مطابق. أعد التأكيد.' : 'Pattern does not match. Try again.'); } }} className="w-full rounded-xl bg-[var(--accent)] px-3 py-2.5 text-xs font-bold text-white">{isRTL ? 'التحقق من النمط' : 'Verify pattern'}</button>}
          </div>}
        </section>

        <footer className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-[var(--border-neutral)] bg-[var(--surface)] py-2.5 text-xs font-bold text-[var(--text-secondary)]">{isRTL ? 'إلغاء' : 'Cancel'}</button>
          <button type="button" onClick={handleSave} className="flex-1 rounded-lg bg-[var(--accent)] py-2.5 text-xs font-black text-white shadow-md active:scale-[0.99]">{isRTL ? 'حفظ الإعدادات' : 'Save Settings'}</button>
        </footer>
      </div>
    </div>
  );
};
