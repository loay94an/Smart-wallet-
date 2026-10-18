import React, { useState } from 'react';
import { AppState } from '../types';
import { sharingService } from '../services/sharing';
import {
  Share2,
  Mail,
  Send,
  MessageCircle,
  Copy,
  Download,
  Check,
  X,
  FileJson,
  Smartphone,
} from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: AppState;
  onOpenBackupCenter?: () => void;
  language: 'ar' | 'en';
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  state,
  onOpenBackupCenter,
  language,
}) => {
  const isRTL = language === 'ar';
  const [recipientEmail, setRecipientEmail] = useState<string>(
    state.settings.userEmail || 'loay94an@gmail.com'
  );
  const [whatsappPhone, setWhatsappPhone] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const summaryText = sharingService.formatSummaryMessage(state);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const handleWhatsApp = () => {
    sharingService.shareToWhatsApp(summaryText, whatsappPhone);
    showToast(isRTL ? 'جاري فتح واتساب...' : 'Opening WhatsApp...');
  };

  const handleTelegram = () => {
    sharingService.shareToTelegram(summaryText);
    showToast(isRTL ? 'جاري فتح تلجرام...' : 'Opening Telegram...');
  };

  const handleEmail = () => {
    sharingService.sendBackupToEmail(state, recipientEmail);
    showToast(isRTL ? 'جاري فتح تطبيق البريد...' : 'Opening email client...');
  };

  const handleNativeShare = async () => {
    const file = sharingService.createBackupFile(state);
    const success = await sharingService.shareNative({
      title: isRTL ? 'تقرير ونسخة المحفظة المالية' : 'Wallet Backup',
      text: summaryText,
      file,
    });
    if (success) {
      showToast(isRTL ? 'تمت المشاركة بنجاح' : 'Shared successfully');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    showToast(isRTL ? 'تم نسخ التقرير للحافظة' : 'Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJSON = () => {
    sharingService.downloadJSONBackup(state);
    showToast(isRTL ? 'تم تنزيل النسخة الاحتياطية' : 'Backup downloaded');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-3xl border border-pink-500/30 bg-[#14142d] p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-purple-900/40 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-pink-600/20 text-pink-400 border border-pink-500/30">
              <Share2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">
                {isRTL ? 'مشاركة وإرسال النسخة الاحتياطية' : 'Share & Backup Export'}
              </h3>
              <p className="text-[11px] text-purple-300/70">
                {isRTL ? 'واتساب، تلجرام، والبريد الإلكتروني' : 'WhatsApp, Telegram and Email'}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-purple-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {toastMsg && (
          <div className="rounded-xl border border-pink-500/40 bg-pink-950/20 p-2.5 text-center text-xs font-bold text-pink-300 animate-fadeIn">
            {toastMsg}
          </div>
        )}

        {/* 1. WhatsApp Sharing Section */}
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/15 p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-black text-emerald-400">
              <MessageCircle className="h-4 w-4" />
              <span>{isRTL ? 'المشاركة عبر واتساب (WhatsApp)' : 'Share via WhatsApp'}</span>
            </span>
          </div>

          <div className="flex gap-2">
            <input
              type="tel"
              value={whatsappPhone}
              onChange={(e) => setWhatsappPhone(e.target.value)}
              placeholder={isRTL ? 'رقم الهاتف اختياري (+966...)' : 'Phone number optional'}
              className="flex-1 rounded-xl border border-emerald-800/40 bg-[#101026] p-2 text-xs text-white placeholder-emerald-400/40 outline-none focus:border-emerald-500"
            />
            <button
              type="button"
              onClick={handleWhatsApp}
              className="flex items-center gap-1 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/30 hover:bg-emerald-500 active:scale-95"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{isRTL ? 'إرسال لواتساب' : 'WhatsApp'}</span>
            </button>
          </div>
        </div>

        {/* 2. Telegram Sharing Section */}
        <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/15 p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-black text-cyan-400">
              <Send className="h-4 w-4" />
              <span>{isRTL ? 'المشاركة عبر تلجرام (Telegram)' : 'Share via Telegram'}</span>
            </span>
            <button
              type="button"
              onClick={handleTelegram}
              className="flex items-center gap-1.5 rounded-xl bg-cyan-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-cyan-600/30 hover:bg-cyan-500 active:scale-95"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{isRTL ? 'مشاركة لتلجرام' : 'Telegram'}</span>
            </button>
          </div>
        </div>

        {/* 3. Send Backup to Email Section */}
        <div className="rounded-2xl border border-purple-500/30 bg-purple-950/20 p-4 space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-purple-300">
            <Mail className="h-4 w-4 text-purple-400" />
            <span>{isRTL ? 'إرسال النسخة الاحتياطية إلى البريد الإلكتروني' : 'Email Backup Export'}</span>
          </div>

          <div className="flex gap-2">
            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="loay94an@gmail.com"
              className="flex-1 rounded-xl border border-purple-800/40 bg-[#101026] p-2 text-xs text-white placeholder-purple-400/40 outline-none focus:border-purple-500"
            />
            <button
              type="button"
              onClick={handleEmail}
              className="flex items-center gap-1 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-purple-600/30 hover:opacity-95 active:scale-95"
            >
              <Mail className="h-3.5 w-3.5" />
              <span>{isRTL ? 'إرسال للبريد' : 'Send Email'}</span>
            </button>
          </div>
          <p className="text-[10px] text-purple-300/60">
            {isRTL
              ? 'يتم إعداد رسالة بريد إلكتروني تحتوي على التقرير المالي الكامل وبيانات النسخة الاحتياطية.'
              : 'Formats full statement and embedded backup dataset ready to dispatch.'}
          </p>
        </div>

        {/* Quick Native Share & File Download Grid */}
        <div className="grid grid-cols-3 gap-2">
          {/* Native Web Share */}
          <button
            type="button"
            onClick={handleNativeShare}
            className="flex flex-col items-center justify-center gap-1 rounded-xl border border-purple-900/50 bg-[#181838] p-3 text-xs font-bold text-purple-200 hover:border-purple-500 hover:text-white"
          >
            <Smartphone className="h-5 w-5 text-pink-400" />
            <span className="text-[11px]">{isRTL ? 'مشاركة النظام' : 'Native Share'}</span>
          </button>

          {/* Copy Report */}
          <button
            type="button"
            onClick={handleCopy}
            className="flex flex-col items-center justify-center gap-1 rounded-xl border border-purple-900/50 bg-[#181838] p-3 text-xs font-bold text-purple-200 hover:border-purple-500 hover:text-white"
          >
            {copied ? <Check className="h-5 w-5 text-emerald-400" /> : <Copy className="h-5 w-5 text-cyan-400" />}
            <span className="text-[11px]">{copied ? (isRTL ? 'تم النسخ' : 'Copied') : (isRTL ? 'نسخ التقرير' : 'Copy Text')}</span>
          </button>

          {/* Download JSON */}
          <button
            type="button"
            onClick={handleDownloadJSON}
            className="flex flex-col items-center justify-center gap-1 rounded-xl border border-purple-900/50 bg-[#181838] p-3 text-xs font-bold text-purple-200 hover:border-purple-500 hover:text-white"
          >
            <FileJson className="h-5 w-5 text-emerald-400" />
            <span className="text-[11px]">{isRTL ? 'تنزيل JSON' : 'Download JSON'}</span>
          </button>
        </div>

        {onOpenBackupCenter && (
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenBackupCenter();
            }}
            className="w-full flex items-center justify-center gap-2 rounded-2xl border border-cyan-500/40 bg-cyan-950/30 py-2.5 text-xs font-black text-cyan-300 hover:bg-cyan-900/40 transition-all"
          >
            <Download className="h-4 w-4" />
            <span>{isRTL ? 'فتح مركز النسخ والاستيراد المتقدم' : 'Open Full Backup & Restore Center'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
