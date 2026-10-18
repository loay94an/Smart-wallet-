import React, { useState, useRef } from 'react';
import { AppState } from '../types';
import { sharingService } from '../services/sharing';
import { parseAndInspectBackup, BackupInspection, mergeAppState } from '../services/backupParser';
import confetti from 'canvas-confetti';
import {
  Database,
  Download,
  Upload,
  Copy,
  Check,
  X,
  FileJson,
  Mail,
  Send,
  MessageCircle,
  FileText,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  Layers,
  ArrowRight,
  Eye,
  EyeOff,
} from 'lucide-react';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: AppState;
  onApplyBackup: (newState: AppState, isMerged: boolean) => void;
  language: 'ar' | 'en';
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  state,
  onApplyBackup,
  language,
}) => {
  const isRTL = language === 'ar';

  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  
  // Export states
  const [recipientEmail, setRecipientEmail] = useState<string>(
    state.settings?.userEmail || 'loay94an@gmail.com'
  );
  const [whatsappPhone, setWhatsappPhone] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);
  const [showRawJSON, setShowRawJSON] = useState<boolean>(false);

  // Import states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pastedText, setPastedText] = useState<string>('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [inspection, setInspection] = useState<BackupInspection | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('replace');
  const [isConfirming, setIsConfirming] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const jsonString = JSON.stringify(state, null, 2);
  const summaryText = sharingService.formatSummaryMessage(state);

  // --- Export Actions ---
  const handleDownloadFile = () => {
    try {
      sharingService.downloadJSONBackup(state);
      showToast(isRTL ? '✅ تم تنزيل ملف النسخة الاحتياطية بنجاح' : '✅ Backup file downloaded');
    } catch (e: any) {
      showToast(isRTL ? 'حدث خطأ أثناء التنزيل: ' + e.message : 'Download failed');
    }
  };

  const handleCopyJSON = () => {
    try {
      navigator.clipboard.writeText(jsonString);
      setCopiedCode(true);
      showToast(isRTL ? '📋 تم نسخ كود النسخة الاحتياطية كاملاً' : '📋 Full JSON backup copied to clipboard');
      setTimeout(() => setCopiedCode(false), 2500);
    } catch {
      showToast(isRTL ? 'يرجى تحديد النص ونسخه يدوياً' : 'Please copy text manually');
    }
  };

  const handleCopySummary = () => {
    try {
      navigator.clipboard.writeText(summaryText);
      setCopiedSummary(true);
      showToast(isRTL ? '📋 تم نسخ الملخص المالي' : '📋 Summary copied');
      setTimeout(() => setCopiedSummary(false), 2000);
    } catch {
      showToast(isRTL ? 'فشل النسخ' : 'Copy failed');
    }
  };

  const handleEmailExport = () => {
    sharingService.sendBackupToEmail(state, recipientEmail);
    showToast(isRTL ? 'جاري فتح برنامج البريد الإلكتروني...' : 'Opening email client...');
  };

  const handleWhatsAppExport = () => {
    sharingService.shareToWhatsApp(summaryText, whatsappPhone);
    showToast(isRTL ? 'جاري فتح واتساب...' : 'Opening WhatsApp...');
  };

  const handleTelegramExport = () => {
    sharingService.shareToTelegram(summaryText);
    showToast(isRTL ? 'جاري فتح تلجرام...' : 'Opening Telegram...');
  };

  // --- Import Actions ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setParseError(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      setPastedText(content);
      runInspection(content);
    };
    reader.onerror = () => {
      setParseError(isRTL ? 'تعذر قراءة الملف المحدد.' : 'Could not read selected file.');
    };
    reader.readAsText(file);
  };

  const runInspection = (contentToTest?: string) => {
    const text = contentToTest !== undefined ? contentToTest : pastedText;
    if (!text.trim()) {
      setParseError(isRTL ? 'يرجى إدخال نص أو اختيار ملف أولاً.' : 'Please enter text or select a file first.');
      setInspection(null);
      return;
    }

    const result = parseAndInspectBackup(text);
    if (result.success && result.inspection) {
      setInspection(result.inspection);
      setParseError(null);
      showToast(
        isRTL
          ? `🔍 تم التحقق! عُثر على ${result.inspection.transactionsCount} معاملة`
          : `🔍 Verified! Found ${result.inspection.transactionsCount} transactions`
      );
    } else {
      setInspection(null);
      setParseError(result.error || (isRTL ? 'الملف غير صالح أو تالف.' : 'Invalid backup format.'));
    }
  };

  const handleExecuteImport = () => {
    if (!inspection) return;

    try {
      let finalStateToApply = inspection.state;
      const isMerged = importMode === 'merge';

      if (isMerged) {
        finalStateToApply = mergeAppState(state, inspection.state);
      }

      onApplyBackup(finalStateToApply, isMerged);

      // Trigger Confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'],
        });
      } catch {}

      setIsConfirming(false);
      onClose();
    } catch (e: any) {
      setParseError(isRTL ? 'خطأ أثناء تطبيق البيانات: ' + e.message : 'Error applying data: ' + e.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 animate-fadeIn">
      <div className="flex flex-col w-full max-w-2xl max-h-[92vh] rounded-3xl border border-purple-500/30 bg-[#121229] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-purple-900/40 bg-[#161633] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600 to-cyan-500 shadow-md shadow-purple-600/30">
              <Database className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-black text-white sm:text-lg">
                {isRTL ? 'مركز النسخ الاحتياطي والاستيراد' : 'Backup & Restore Center'}
              </h2>
              <p className="text-[11px] text-purple-300/70">
                {isRTL
                  ? 'حفظ وتصدير بياناتك، أو استيراد ودمج النسخ الاحتياطية'
                  : 'Export & download backups, or import and merge previous datasets'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-purple-400 hover:bg-purple-900/40 hover:text-white transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab switchers */}
        <div className="flex border-b border-purple-900/30 bg-[#101026] px-6 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('export')}
            className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-black transition-all ${
              activeTab === 'export'
                ? 'border-purple-500 text-white'
                : 'border-transparent text-purple-400/60 hover:text-purple-300'
            }`}
          >
            <Download className="h-4 w-4" />
            <span>{isRTL ? '📤 تصدير وحفظ نسخة (Export)' : '📤 Export Backup'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('import')}
            className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-black transition-all ${
              activeTab === 'import'
                ? 'border-cyan-500 text-white'
                : 'border-transparent text-purple-400/60 hover:text-purple-300'
            }`}
          >
            <Upload className="h-4 w-4" />
            <span>{isRTL ? '📥 استيراد واسترجاع بيانات (Import)' : '📥 Import & Restore'}</span>
          </button>
        </div>

        {/* Notification Toast */}
        {toastMessage && (
          <div className="mx-6 mt-3 rounded-2xl border border-purple-500/40 bg-purple-950/60 p-2.5 text-center text-xs font-bold text-purple-200 animate-fadeIn">
            {toastMessage}
          </div>
        )}

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* =========================================
              TAB 1: EXPORT BACKUP
             ========================================= */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              {/* Quick Summary Card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 rounded-2xl border border-purple-900/40 bg-[#171738] p-4 text-center">
                <div className="p-2">
                  <span className="text-[10px] text-purple-300/70 block">{isRTL ? 'المعاملات' : 'Transactions'}</span>
                  <span className="text-lg font-black text-purple-200">{state.transactions.length}</span>
                </div>
                <div className="p-2">
                  <span className="text-[10px] text-purple-300/70 block">{isRTL ? 'الأشخاص والديون' : 'Debts & People'}</span>
                  <span className="text-lg font-black text-pink-400">{state.debts.length}</span>
                </div>
                <div className="p-2">
                  <span className="text-[10px] text-purple-300/70 block">{isRTL ? 'المشاريع والأعمال' : 'Works'}</span>
                  <span className="text-lg font-black text-cyan-400">{state.works.length}</span>
                </div>
                <div className="p-2">
                  <span className="text-[10px] text-purple-300/70 block">{isRTL ? 'العملة' : 'Currency'}</span>
                  <span className="text-lg font-black text-emerald-400">{state.settings?.currency || 'ر.س'}</span>
                </div>
              </div>

              {/* Primary 2 Download & Copy Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Download JSON File */}
                <button
                  type="button"
                  onClick={handleDownloadFile}
                  className="flex items-center justify-center gap-2.5 rounded-2xl border border-emerald-500/40 bg-gradient-to-r from-emerald-600/30 to-teal-600/20 p-4 text-left font-bold text-white shadow-lg transition-all hover:border-emerald-400 hover:from-emerald-600/40 active:scale-95"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <Download className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-sm font-black text-emerald-200 block">
                      {isRTL ? 'تحميل ملف النسخة (JSON)' : 'Download JSON File'}
                    </span>
                    <span className="text-[10px] text-emerald-300/70">
                      {isRTL ? 'حفظ ملف مضغوط في جهازك' : 'Saves file directly to your device'}
                    </span>
                  </div>
                </button>

                {/* 2. Copy Full JSON Backup */}
                <button
                  type="button"
                  onClick={handleCopyJSON}
                  className="flex items-center justify-center gap-2.5 rounded-2xl border border-cyan-500/40 bg-gradient-to-r from-cyan-600/30 to-blue-600/20 p-4 text-left font-bold text-white shadow-lg transition-all hover:border-cyan-400 hover:from-cyan-600/40 active:scale-95"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                    {copiedCode ? <Check className="h-5 w-5 text-emerald-400" /> : <Copy className="h-5 w-5" />}
                  </div>
                  <div>
                    <span className="text-sm font-black text-cyan-200 block">
                      {copiedCode
                        ? (isRTL ? 'تم النسخ للحافظة!' : 'Copied to Clipboard!')
                        : (isRTL ? 'نسخ كود النسخة بالكامل' : 'Copy Full JSON Backup')}
                    </span>
                    <span className="text-[10px] text-cyan-300/70">
                      {isRTL ? 'لصقها في أي مكان أو تطبيق' : 'Ready to paste anywhere'}
                    </span>
                  </div>
                </button>
              </div>

              {/* Email Backup Dispatch */}
              <div className="rounded-2xl border border-purple-800/40 bg-[#161635] p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs font-black text-purple-200">
                    <Mail className="h-4 w-4 text-purple-400" />
                    <span>{isRTL ? 'إرسال النسخة الاحتياطية إلى البريد الإلكتروني' : 'Dispatch Backup to Email'}</span>
                  </span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="example@mail.com"
                    className="flex-1 rounded-xl border border-purple-800/50 bg-[#0f0f24] px-3 py-2 text-xs text-white placeholder-purple-400/40 outline-none focus:border-purple-400"
                  />
                  <button
                    type="button"
                    onClick={handleEmailExport}
                    className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-purple-500 active:scale-95"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>{isRTL ? 'إرسال' : 'Send'}</span>
                  </button>
                </div>
              </div>

              {/* Social Summary Sharing (WhatsApp / Telegram) */}
              <div className="rounded-2xl border border-purple-800/40 bg-[#161635] p-4 space-y-3">
                <span className="flex items-center gap-2 text-xs font-black text-purple-200">
                  <MessageCircle className="h-4 w-4 text-emerald-400" />
                  <span>{isRTL ? 'مشاركة التقرير المالي عبر واتساب وتلجرام' : 'Share Financial Statement'}</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={handleWhatsAppExport}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-600/40 bg-emerald-950/30 py-2.5 text-xs font-bold text-emerald-300 hover:bg-emerald-900/40 active:scale-95"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>{isRTL ? 'إرسال لواتساب' : 'WhatsApp'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleTelegramExport}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-cyan-600/40 bg-cyan-950/30 py-2.5 text-xs font-bold text-cyan-300 hover:bg-cyan-900/40 active:scale-95"
                  >
                    <Send className="h-4 w-4" />
                    <span>{isRTL ? 'إرسال لتلجرام' : 'Telegram'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopySummary}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-purple-700/40 bg-purple-950/30 py-2.5 text-xs font-bold text-purple-200 hover:bg-purple-900/40 active:scale-95"
                  >
                    {copiedSummary ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                    <span>{isRTL ? 'نسخ الملخص' : 'Copy Text'}</span>
                  </button>
                </div>
              </div>

              {/* Collapsible Raw JSON Viewer */}
              <div className="rounded-2xl border border-purple-900/40 bg-[#121226] p-3 text-xs">
                <button
                  type="button"
                  onClick={() => setShowRawJSON(!showRawJSON)}
                  className="flex w-full items-center justify-between text-purple-300 hover:text-white"
                >
                  <span className="flex items-center gap-1.5 font-bold">
                    <FileJson className="h-4 w-4 text-yellow-400" />
                    <span>{isRTL ? 'معاينة كود النسخة الخام (JSON Code)' : 'View Raw JSON Code'}</span>
                  </span>
                  {showRawJSON ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                {showRawJSON && (
                  <div className="mt-3 space-y-2">
                    <textarea
                      readOnly
                      rows={6}
                      value={jsonString}
                      className="w-full rounded-xl border border-purple-900/50 bg-[#0a0a16] p-2.5 font-mono text-[10px] text-purple-300 outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleCopyJSON}
                      className="flex items-center gap-1 rounded-lg bg-purple-700 px-3 py-1 text-[11px] font-bold text-white hover:bg-purple-600"
                    >
                      <Copy className="h-3 w-3" />
                      <span>{isRTL ? 'نسخ كل الكود' : 'Copy All'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =========================================
              TAB 2: IMPORT BACKUP
             ========================================= */}
          {activeTab === 'import' && (
            <div className="space-y-4">
              {/* Instruction banner */}
              <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/20 p-3.5 text-xs text-cyan-200">
                <div className="flex items-center gap-2 font-black mb-1">
                  <Sparkles className="h-4 w-4 text-cyan-400" />
                  <span>{isRTL ? 'توافق ذكي فائق مع كافة ملفات النسخ' : 'Universal Backup Compatibility'}</span>
                </div>
                <p className="text-[11px] text-cyan-300/80 leading-relaxed">
                  {isRTL
                    ? 'يدعم التطبيق استيراد النسخ الاحتياطية الرسمية، والملفات المحفوظة من نسخ سابقة، ومصفوفات العمليات، والنصوص المنسوخة من واتساب أو البريد مباشرة.'
                    : 'Supports full backups, legacy schemas, array lists, and raw JSON text copied from messages.'}
                </p>
              </div>

              {/* 1. File Upload Selector */}
              <div className="rounded-2xl border-2 border-dashed border-purple-700/50 bg-[#161633] p-5 text-center transition-all hover:border-cyan-500/70">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.txt"
                  onChange={handleFileChange}
                  className="hidden"
                  id="backup-file-upload"
                />
                <label
                  htmlFor="backup-file-upload"
                  className="cursor-pointer flex flex-col items-center justify-center gap-2"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                    <Upload className="h-6 w-6" />
                  </div>
                  <span className="text-sm font-black text-white">
                    {fileName
                      ? (isRTL ? `الملف المختار: ${fileName}` : `File: ${fileName}`)
                      : (isRTL ? 'انقر لاختيار ملف نسخة احتياطية (.json / .txt)' : 'Click to choose backup file (.json / .txt)')}
                  </span>
                  <span className="text-[10px] text-purple-300/60">
                    {isRTL ? 'أو يمكنك لصق كود النسخة أدناه مباشرة' : 'Or paste the backup text directly below'}
                  </span>
                </label>
              </div>

              {/* 2. Direct Text Paste Area */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-purple-200 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-purple-400" />
                    <span>{isRTL ? 'أو الصق نص النسخة الاحتياطية (JSON) هنا:' : 'Or paste backup JSON code here:'}</span>
                  </span>
                  {pastedText && (
                    <button
                      type="button"
                      onClick={() => {
                        setPastedText('');
                        setInspection(null);
                        setParseError(null);
                        setFileName(null);
                      }}
                      className="text-[10px] text-red-400 hover:underline"
                    >
                      {isRTL ? 'مسح النص' : 'Clear text'}
                    </button>
                  )}
                </label>
                <textarea
                  rows={4}
                  value={pastedText}
                  onChange={(e) => {
                    setPastedText(e.target.value);
                    setParseError(null);
                  }}
                  placeholder={
                    isRTL
                      ? 'الصق كود JSON للنسخة الاحتياطية هنا (مثل: {"transactions": [...], ...})'
                      : 'Paste raw JSON backup code here...'
                  }
                  className="w-full rounded-2xl border border-purple-900/50 bg-[#0f0f24] p-3 font-mono text-xs text-purple-100 placeholder-purple-400/40 outline-none focus:border-cyan-400"
                />
              </div>

              {/* Inspect / Validate Button */}
              <button
                type="button"
                onClick={() => runInspection()}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-cyan-500/50 bg-cyan-600/30 py-2.5 text-xs font-black text-cyan-200 hover:bg-cyan-600/50 active:scale-95 transition-all"
              >
                <Sparkles className="h-4 w-4 text-cyan-400" />
                <span>{isRTL ? 'فحص وتحليل النسخة الاحتياطية' : 'Analyze & Inspect Backup'}</span>
              </button>

              {/* Parsing Error Box */}
              {parseError && (
                <div className="flex items-center gap-2 rounded-2xl border border-red-500/40 bg-red-950/30 p-3 text-xs text-red-300">
                  <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
                  <span>{parseError}</span>
                </div>
              )}

              {/* Inspection Card (Detected Content) */}
              {inspection && (
                <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/20 p-4 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-emerald-800/40 pb-2">
                    <span className="flex items-center gap-2 text-xs font-black text-emerald-300">
                      <Check className="h-4 w-4 text-emerald-400" />
                      <span>{isRTL ? 'نتيجة الفحص: تم التعرف على البيانات بنجاح!' : 'Verification: Valid Dataset Found!'}</span>
                    </span>
                    <span className="text-[10px] rounded-full bg-emerald-500/20 px-2 py-0.5 text-emerald-300">
                      {inspection.sourceFormat}
                    </span>
                  </div>

                  {/* Summary grid */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="rounded-xl bg-[#121226]/80 p-2 border border-emerald-900/40">
                      <span className="text-[10px] text-purple-300/70 block">{isRTL ? 'المعاملات' : 'Transactions'}</span>
                      <span className="text-base font-black text-white">{inspection.transactionsCount}</span>
                    </div>
                    <div className="rounded-xl bg-[#121226]/80 p-2 border border-emerald-900/40">
                      <span className="text-[10px] text-purple-300/70 block">{isRTL ? 'الديون' : 'Debts'}</span>
                      <span className="text-base font-black text-white">{inspection.debtsCount}</span>
                    </div>
                    <div className="rounded-xl bg-[#121226]/80 p-2 border border-emerald-900/40">
                      <span className="text-[10px] text-purple-300/70 block">{isRTL ? 'المشاريع' : 'Works'}</span>
                      <span className="text-base font-black text-white">{inspection.worksCount}</span>
                    </div>
                  </div>

                  {/* Preview Transactions */}
                  {inspection.previewTransactions.length > 0 && (
                    <div className="space-y-1 text-[11px]">
                      <span className="text-[10px] font-bold text-emerald-400/80 block">
                        {isRTL ? 'عينة من المعاملات المكتشفة:' : 'Sample Transactions:'}
                      </span>
                      {inspection.previewTransactions.map((tx, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between rounded-lg bg-[#0d0d1f] px-2.5 py-1 text-purple-200"
                        >
                          <span className="truncate max-w-[200px]">{tx.desc}</span>
                          <span className={tx.type === 'income' ? 'text-emerald-400 font-bold' : 'text-pink-400 font-bold'}>
                            {tx.type === 'income' ? '+' : '-'}{tx.amount} {inspection.currency}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Import Mode: Replace vs Merge */}
                  <div className="space-y-2 border-t border-emerald-800/40 pt-3">
                    <label className="text-xs font-bold text-purple-200 block">
                      {isRTL ? 'طريقة الاستيراد:' : 'Import Strategy:'}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setImportMode('replace')}
                        className={`flex items-center justify-center gap-1.5 rounded-xl p-2.5 text-xs font-bold transition-all border ${
                          importMode === 'replace'
                            ? 'border-purple-400 bg-purple-600 text-white shadow-md'
                            : 'border-purple-900/40 bg-[#14142d] text-purple-300'
                        }`}
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        <span>{isRTL ? 'استبدال كامل للبيانات' : 'Full Replace'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setImportMode('merge')}
                        className={`flex items-center justify-center gap-1.5 rounded-xl p-2.5 text-xs font-bold transition-all border ${
                          importMode === 'merge'
                            ? 'border-cyan-400 bg-cyan-600 text-white shadow-md'
                            : 'border-purple-900/40 bg-[#14142d] text-purple-300'
                        }`}
                      >
                        <Layers className="h-3.5 w-3.5" />
                        <span>{isRTL ? 'دمج مع البيانات الحالية' : 'Merge with Current'}</span>
                      </button>
                    </div>
                    <p className="text-[10px] text-purple-300/60">
                      {importMode === 'replace'
                        ? (isRTL
                            ? '⚠️ سيتم حذف البيانات الحالية واستبدالها بالنسخة الاحتياطية.'
                            : '⚠️ Will replace existing database state with the backup.')
                        : (isRTL
                            ? '✨ سيتم الاحتفاظ ببياناتك الحالية وإضافة المعاملات والمشاريع الجديدة دون تكرار.'
                            : '✨ Preserves existing records and appends new records seamlessly.')}
                    </p>
                  </div>

                  {/* Confirm & Execute Button */}
                  {!isConfirming ? (
                    <button
                      type="button"
                      onClick={() => setIsConfirming(true)}
                      className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 py-3 text-xs font-black text-black shadow-lg shadow-emerald-500/20 hover:opacity-95 active:scale-95 transition-all"
                    >
                      <ArrowRight className="h-4 w-4" />
                      <span>
                        {importMode === 'replace'
                          ? (isRTL ? 'تأكيد واستيراد النسخة الآن (استبدال)' : 'Apply Backup (Replace)')
                          : (isRTL ? 'تأكيد ودمج البيانات الآن (دمج)' : 'Apply Backup (Merge)')}
                      </span>
                    </button>
                  ) : (
                    <div className="rounded-2xl border border-yellow-500/50 bg-yellow-950/30 p-3 space-y-2 text-center animate-fadeIn">
                      <span className="text-xs font-black text-yellow-300 block">
                        {isRTL
                          ? `هل أنت متأكد من ${importMode === 'replace' ? 'استبدال كافة البيانات' : 'دمج البيانات'}؟`
                          : `Confirm ${importMode === 'replace' ? 'full replacement' : 'data merge'}?`}
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setIsConfirming(false)}
                          className="flex-1 rounded-xl border border-purple-800 bg-[#14142d] py-2 text-xs font-bold text-purple-300"
                        >
                          {isRTL ? 'تراجع' : 'Cancel'}
                        </button>
                        <button
                          type="button"
                          onClick={handleExecuteImport}
                          className="flex-1 rounded-xl bg-emerald-500 py-2 text-xs font-black text-black hover:bg-emerald-400"
                        >
                          {isRTL ? 'نعم، استيراد الآن ✓' : 'Yes, Import Now ✓'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
