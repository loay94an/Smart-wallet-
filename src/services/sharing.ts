import { AppState } from '../types';
import { Capacitor } from '@capacitor/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

function createPortableBackup(state: AppState): AppState {
  return {
    ...state,
    settings: { ...state.settings, syncKey: '', autoCloudSync: false },
    security: { enabled: false, type: 'off', pin: '', pinSalt: '', pinHash: '', pinLength: 4, pattern: [] },
  };
}

export class SharingService {
  // Format human-readable financial summary
  formatSummaryMessage(state: AppState): string {
    const cur = state.settings.currency || 'ر.س';
    const totalIncome = state.transactions
      .filter((t) => t.type === 'income')
      .reduce((s, t) => s + Number(t.amount), 0);
    const totalExpense = state.transactions
      .filter((t) => t.type === 'expense')
      .reduce((s, t) => s + Number(t.amount), 0);
    const balance = totalIncome - totalExpense;

    // Debts & receivables
    const totalDebts = state.debts
      .filter((d) => d.type === 'debt')
      .reduce((s, d) => s + Number(d.amount), 0);
    const totalReceivables = state.debts
      .filter((d) => d.type === 'receivable')
      .reduce((s, d) => s + Number(d.amount), 0);

    const paidToDebts = state.payments
      .filter((p) => state.debts.some((d) => d.id === p.debtId && d.type === 'debt'))
      .reduce((s, p) => s + Number(p.amount), 0);
    const collectedFromReceivables = state.payments
      .filter((p) => state.debts.some((d) => d.id === p.debtId && d.type === 'receivable'))
      .reduce((s, p) => s + Number(p.amount), 0);

    const remainingDebts = Math.max(0, totalDebts - paidToDebts);
    const remainingReceivables = Math.max(0, totalReceivables - collectedFromReceivables);

    const dateStr = new Date().toLocaleDateString('ar-SA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return `📊 *تقرير المحفظة المالية الذكية*
📅 ${dateStr}

💰 *الرصيد الصافي:* ${balance.toFixed(2)} ${cur}
📈 *إجمالي الدخل:* ${totalIncome.toFixed(2)} ${cur}
📉 *إجمالي المصروفات:* ${totalExpense.toFixed(2)} ${cur}

👥 *الديون والمستحقات:*
🔴 ديون عليك: ${remainingDebts.toFixed(2)} ${cur}
🟢 مستحقات لك: ${remainingReceivables.toFixed(2)} ${cur}

💼 *الأعمال:* ${state.works.length} أعمال مسجلة
📝 *المعاملات:* ${state.transactions.length} معاملة


✨ تم التصدير عبر تطبيق المحفظة المالية الذكية`;
  }

  // Share to WhatsApp
  shareToWhatsApp(text: string, phone?: string): void {
    const cleanPhone = phone ? phone.replace(/[^0-9]/g, '') : '';
    const encoded = encodeURIComponent(text);
    const url = cleanPhone
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  // Share to Telegram
  shareToTelegram(text: string): void {
    const encoded = encodeURIComponent(text);
    const url = `https://t.me/share/url?url=&text=${encoded}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  // Send backup / report to Email via mailto link
  sendBackupToEmail(state: AppState, recipientEmail?: string): void {
    const targetEmail = recipientEmail || state.settings.userEmail || 'loay94an@gmail.com';
    const cur = state.settings.currency || 'ر.س';
    const dateStr = new Date().toISOString().slice(0, 10);
    const subject = encodeURIComponent(`نسخة احتياطية - المحفظة المالية الذكية (${dateStr})`);

    const summary = this.formatSummaryMessage(state);
    const jsonString = JSON.stringify(createPortableBackup(state), null, 2);

    const bodyText = `${summary}

=======================================
📦 بيانات النسخة الاحتياطية المرفقة (JSON):
يمكنك نسخ البيانات أدناه أو استيرادها في التطبيق:
=======================================
${jsonString}`;

    // Browser URL length safe fallback
    const encodedBody = encodeURIComponent(bodyText.slice(0, 15000));
    const mailtoUrl = `mailto:${targetEmail}?subject=${subject}&body=${encodedBody}`;

    // Open mail client
    window.location.href = mailtoUrl;
  }

  // Native Web Share API (WhatsApp, Telegram, Mail on Mobile)
  async shareNative(options: { title: string; text: string; file?: File }): Promise<boolean> {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        const shareData: ShareData = {
          title: options.title,
          text: options.text,
        };

        if (options.file && navigator.canShare && navigator.canShare({ files: [options.file] })) {
          shareData.files = [options.file];
        }

        await navigator.share(shareData);
        return true;
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.warn('Native share failed:', err);
        }
      }
    }
    return false;
  }

  // Download JSON backup file
  async downloadJSONBackup(state: AppState): Promise<void> {
    const dateStr = new Date().toISOString().slice(0, 10);
    const fileName = `wallet-backup-${dateStr}.json`;
    const json = JSON.stringify(createPortableBackup(state), null, 2);

    // Android WebView does not consistently honor browser Blob downloads.
    // Write the backup to the app cache and hand the real file to Android's share sheet.
    if (Capacitor.isNativePlatform()) {
      const saved = await Filesystem.writeFile({
        path: fileName,
        data: json,
        directory: Directory.Cache,
        encoding: Encoding.UTF8,
        recursive: true,
      });
      await Share.share({
        title: 'نسخة احتياطية - المحفظة المالية الذكية',
        text: 'ملف النسخة الاحتياطية بصيغة JSON',
        files: [saved.uri],
        dialogTitle: 'حفظ أو مشاركة نسخة JSON',
      });
      return;
    }

    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  // Create a File object for native sharing
  createBackupFile(state: AppState): File {
    const dateStr = new Date().toISOString().slice(0, 10);
    const blob = new Blob([JSON.stringify(createPortableBackup(state), null, 2)], { type: 'application/json' });
    return new File([blob], `wallet-backup-${dateStr}.json`, { type: 'application/json' });
  }
}

export const sharingService = new SharingService();
