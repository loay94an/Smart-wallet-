import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { AppState } from '../types';

function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[char] as string));
}
import { formatCurrency } from './i18n';
import { saveExportBlob } from './fileExport';

/**
 * Universal export service for Excel and PDF across all sections.
 */
export const exportService = {
  /**
   * Export transactions (Wallet) to Excel (.xlsx)
   */
  exportWalletToExcel: (state: AppState, isRTL: boolean = true) => {
    const cur = state.settings.currency || 'ر.س';
    const catMap = new Map(state.categories.map((c) => [c.id, c.name]));

    const rows = state.transactions.map((tx, idx) => ({
      [isRTL ? 'الرقم' : 'ID']: idx + 1,
      [isRTL ? 'التاريخ' : 'Date']: tx.date,
      [isRTL ? 'النوع' : 'Type']:
        tx.type === 'income' ? (isRTL ? 'دخل (+)' : 'Income') : (isRTL ? 'مصروف (-)' : 'Expense'),
      [isRTL ? 'التصنيف' : 'Category']: catMap.get(tx.category) || tx.category || (isRTL ? 'عام' : 'General'),
      [isRTL ? `المبلغ (${cur})` : `Amount (${cur})`]: Number(tx.amount),
      [isRTL ? 'البيان / الوصف' : 'Description']: tx.desc || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [{ [isRTL ? 'ملاحظة' : 'Note']: isRTL ? 'لا توجد معاملات مسجلة' : 'No transactions recorded' }]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, isRTL ? 'المعاملات المالية' : 'Transactions');
    void saveExportBlob(new Blob([XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `wallet-transactions-${new Date().toISOString().slice(0, 10)}.xlsx`);
  },

  /**
   * Export People & Debts to Excel (.xlsx)
   */
  exportPeopleToExcel: (state: AppState, isRTL: boolean = true) => {
    const cur = state.settings.currency || 'ر.س';
    const peopleMap = new Map(state.people.map((p) => [p.id, p]));

    // Sheet 1: People Summary
    const peopleSummaryRows = state.people.map((p, idx) => {
      const pDebts = state.debts.filter((d) => d.personId === p.id);
      const totalDebt = pDebts.filter((d) => d.type === 'debt').reduce((s, d) => s + Number(d.amount), 0);
      const totalReceivable = pDebts.filter((d) => d.type === 'receivable').reduce((s, d) => s + Number(d.amount), 0);

      const paidDebt = state.payments
        .filter((pm) => pDebts.some((d) => d.id === pm.debtId && d.type === 'debt'))
        .reduce((s, pm) => s + Number(pm.amount), 0);
      const collectedReceivable = state.payments
        .filter((pm) => pDebts.some((d) => d.id === pm.debtId && d.type === 'receivable'))
        .reduce((s, pm) => s + Number(pm.amount), 0);

      const remDebt = Math.max(0, totalDebt - paidDebt);
      const remReceivable = Math.max(0, totalReceivable - collectedReceivable);
      const net = remReceivable - remDebt;

      return {
        [isRTL ? 'م' : 'No']: idx + 1,
        [isRTL ? 'الاسم' : 'Name']: p.name,
        [isRTL ? 'رقم الهاتف' : 'Phone']: p.phone || '',
        [isRTL ? 'البريد الإلكتروني' : 'Email']: p.email || '',
        [isRTL ? `المستحق لك (${cur})` : `Owed to you (${cur})`]: remReceivable,
        [isRTL ? `الدين عليك (${cur})` : `You owe (${cur})`]: remDebt,
        [isRTL ? `الصافي (${cur})` : `Net Balance (${cur})`]: net,
        [isRTL ? 'الحالة' : 'Status']:
          net > 0
            ? isRTL ? 'لك مستحقات' : 'Owes you'
            : net < 0
            ? isRTL ? 'عليك دين' : 'You owe'
            : isRTL ? 'خالص' : 'Settled',
        [isRTL ? 'ملاحظات' : 'Notes']: p.notes || '',
      };
    });

    // Sheet 2: All Debts Log
    const debtDetailsRows = state.debts.map((d, idx) => {
      const p = peopleMap.get(d.personId);
      const paid = state.payments
        .filter((pm) => pm.debtId === d.id)
        .reduce((s, pm) => s + Number(pm.amount), 0);
      const rem = Math.max(0, Number(d.amount) - paid);

      return {
        [isRTL ? 'م' : 'No']: idx + 1,
        [isRTL ? 'الشخص' : 'Person']: p?.name || (isRTL ? 'غير معروف' : 'Unknown'),
        [isRTL ? 'النوع' : 'Type']:
          d.type === 'debt' ? (isRTL ? 'دين عليك' : 'Debt you owe') : (isRTL ? 'مستحق لك' : 'Receivable'),
        [isRTL ? `المبلغ الأصلي (${cur})` : `Original Amount (${cur})`]: Number(d.amount),
        [isRTL ? `المدفوع (${cur})` : `Paid (${cur})`]: paid,
        [isRTL ? `المتبقي (${cur})` : `Remaining (${cur})`]: rem,
        [isRTL ? 'الوصف' : 'Description']: d.desc,
        [isRTL ? 'التاريخ' : 'Date']: d.date ? d.date.slice(0, 10) : '',
      };
    });

    const workbook = XLSX.utils.book_new();
    const ws1 = XLSX.utils.json_to_sheet(
      peopleSummaryRows.length > 0
        ? peopleSummaryRows
        : [{ [isRTL ? 'ملاحظة' : 'Note']: isRTL ? 'لا يوجد أشخاص مسجلين' : 'No people recorded' }]
    );
    const ws2 = XLSX.utils.json_to_sheet(
      debtDetailsRows.length > 0
        ? debtDetailsRows
        : [{ [isRTL ? 'ملاحظة' : 'Note']: isRTL ? 'لا توجد سجلات ديون' : 'No debts recorded' }]
    );

    XLSX.utils.book_append_sheet(workbook, ws1, isRTL ? 'كشف الأشخاص' : 'People Summary');
    XLSX.utils.book_append_sheet(workbook, ws2, isRTL ? 'سجلات الديون والمستحقات' : 'Debts Log');
    void saveExportBlob(new Blob([XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `debts-people-report-${new Date().toISOString().slice(0, 10)}.xlsx`);
  },

  /**
   * Export Work & Projects to Excel (.xlsx)
   */
  exportWorkToExcel: (state: AppState, isRTL: boolean = true) => {
    const cur = state.settings.currency || 'ر.س';
    const workMap = new Map(state.works.map((w) => [w.id, w]));

    // Sheet 1: Projects Overview
    const projectRows = state.works.map((w, idx) => {
      const logs = state.workLogs.filter((l) => l.workId === w.id);
      const payments = state.workPayments.filter((p) => p.workId === w.id);
      const isPiece = w.calculationType === 'piece';

      const totalUnits = logs.reduce((s, l) => s + (isPiece ? Number(l.quantity || 0) : Number(l.hours || 0)), 0);
      const gross = totalUnits * Number(w.rate);
      const received = payments.reduce((s, p) => s + Number(p.amount), 0);
      const remaining = gross - received;

      return {
        [isRTL ? 'م' : 'No']: idx + 1,
        [isRTL ? 'اسم المشروع / العمل' : 'Project Name']: w.name,
        [isRTL ? 'العميل / الجهة' : 'Client']: w.client || '',
        [isRTL ? 'طريقة الحساب' : 'Type']:
          w.calculationType === 'piece' ? (isRTL ? 'بالقطعة' : 'Per Piece') : (isRTL ? 'بالساعة' : 'Hourly'),
        [isRTL ? `سعر الوحدة (${cur})` : `Rate (${cur})`]: Number(w.rate),
        [isRTL ? 'الوحدة' : 'Unit']: w.unitName,
        [isRTL ? 'إجمالي المنجز' : 'Total Units']: totalUnits,
        [isRTL ? `إجمالي المستحق (${cur})` : `Gross Earned (${cur})`]: gross,
        [isRTL ? `المقبوض (${cur})` : `Received (${cur})`]: received,
        [isRTL ? `المتبقي بذمة العميل (${cur})` : `Due Balance (${cur})`]: remaining,
        [isRTL ? 'الحالة' : 'Status']: w.status,
      };
    });

    // Sheet 2: Work Logs
    const logRows = state.workLogs.map((l, idx) => {
      const w = workMap.get(l.workId);
      const isPiece = w?.calculationType === 'piece';
      const earned = (isPiece ? Number(l.quantity || 0) : Number(l.hours || 0)) * (w ? Number(w.rate) : 0);

      return {
        [isRTL ? 'م' : 'No']: idx + 1,
        [isRTL ? 'المشروع' : 'Project']: w?.name || (isRTL ? 'غير معروف' : 'Unknown'),
        [isRTL ? 'التاريخ' : 'Date']: l.date,
        [isRTL ? 'الساعات' : 'Hours']: Number(l.hours || 0),
        [isRTL ? 'الكمية المنجزة' : 'Quantity']: Number(l.quantity || 0),
        [isRTL ? `المبلغ المستحق (${cur})` : `Earned (${cur})`]: earned,
        [isRTL ? 'الوصف' : 'Description']: l.desc || '',
      };
    });

    // Sheet 3: Work Payments
    const paymentRows = state.workPayments.map((p, idx) => {
      const w = workMap.get(p.workId);
      return {
        [isRTL ? 'م' : 'No']: idx + 1,
        [isRTL ? 'المشروع' : 'Project']: w?.name || '',
        [isRTL ? 'التاريخ' : 'Date']: p.date ? p.date.slice(0, 10) : '',
        [isRTL ? `المبلغ (${cur})` : `Amount (${cur})`]: Number(p.amount),
        [isRTL ? 'النوع' : 'Type']:
          p.type === 'salary' ? (isRTL ? 'راتب' : 'Salary') : p.type === 'bonus' ? (isRTL ? 'مكافأة' : 'Bonus') : (isRTL ? 'دفعة' : 'Payment'),
        [isRTL ? 'طريقة الدفع' : 'Method']: p.method,
        [isRTL ? 'البيان' : 'Description']: p.desc || '',
      };
    });

    const workbook = XLSX.utils.book_new();
    const ws1 = XLSX.utils.json_to_sheet(projectRows.length > 0 ? projectRows : [{ [isRTL ? 'ملاحظة' : 'Note']: isRTL ? 'لا توجد مشاريع' : 'No projects' }]);
    const ws2 = XLSX.utils.json_to_sheet(logRows.length > 0 ? logRows : [{ [isRTL ? 'ملاحظة' : 'Note']: isRTL ? 'لا توجد سجلات إنجاز' : 'No logs' }]);
    const ws3 = XLSX.utils.json_to_sheet(paymentRows.length > 0 ? paymentRows : [{ [isRTL ? 'ملاحظة' : 'Note']: isRTL ? 'لا توجد دفعات مقبوضة' : 'No payments' }]);

    XLSX.utils.book_append_sheet(workbook, ws1, isRTL ? 'المشاريع والأعمال' : 'Projects');
    XLSX.utils.book_append_sheet(workbook, ws2, isRTL ? 'سجلات الإنجاز' : 'Work Logs');
    XLSX.utils.book_append_sheet(workbook, ws3, isRTL ? 'الدفعات المقبوضة' : 'Work Payments');

    void saveExportBlob(new Blob([XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `work-freelance-report-${new Date().toISOString().slice(0, 10)}.xlsx`);
  },

  /**
   * Export Budgets & Savings Goals to Excel (.xlsx)
   */
  exportBudgetsToExcel: (state: AppState, isRTL: boolean = true) => {
    const cur = state.settings.currency || 'ر.س';

    const budgetRows = state.budgets.map((b, idx) => ({
      [isRTL ? 'م' : 'No']: idx + 1,
      [isRTL ? 'التصنيف' : 'Category']: b.categoryName,
      [isRTL ? `الميزانية المحددة (${cur})` : `Allocated Budget (${cur})`]: Number(b.amount),
    }));

    const goalRows = state.financialGoals.map((g, idx) => {
      const remaining = Math.max(0, Number(g.target) - Number(g.savedAmount || 0));
      const pct = g.target > 0 ? Math.min(100, Math.round(((g.savedAmount || 0) / g.target) * 100)) : 0;
      return {
        [isRTL ? 'م' : 'No']: idx + 1,
        [isRTL ? 'اسم الهدف' : 'Goal Name']: g.name,
        [isRTL ? `الهدف المالي (${cur})` : `Target (${cur})`]: Number(g.target),
        [isRTL ? `المدخر حتى الآن (${cur})` : `Saved So Far (${cur})`]: Number(g.savedAmount || 0),
        [isRTL ? `المتبقي للوصول (${cur})` : `Remaining (${cur})`]: remaining,
        [isRTL ? 'نسبة الإنجاز %' : 'Completion %']: `${pct}%`,
        [isRTL ? 'الموعد المستهدف' : 'Target Date']: g.deadline || '',
      };
    });

    const workbook = XLSX.utils.book_new();
    const ws1 = XLSX.utils.json_to_sheet(budgetRows.length > 0 ? budgetRows : [{ [isRTL ? 'ملاحظة' : 'Note']: isRTL ? 'لا توجد ميزانيات' : 'No budgets' }]);
    const ws2 = XLSX.utils.json_to_sheet(goalRows.length > 0 ? goalRows : [{ [isRTL ? 'ملاحظة' : 'Note']: isRTL ? 'لا توجد أهداف ادخار' : 'No goals' }]);

    XLSX.utils.book_append_sheet(workbook, ws1, isRTL ? 'الميزانيات الشهرية' : 'Budgets');
    XLSX.utils.book_append_sheet(workbook, ws2, isRTL ? 'أهداف الادخار' : 'Savings Goals');

    void saveExportBlob(new Blob([XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `budgets-goals-${new Date().toISOString().slice(0, 10)}.xlsx`);
  },

  /**
   * Export every top-level data collection plus app settings to one workbook.
   * Nested objects are serialized as JSON so no fields are silently discarded.
   */
  exportFullWorkbookToExcel: (state: AppState, isRTL: boolean = true) => {
    const workbook = XLSX.utils.book_new();
    const usedNames = new Set<string>();
    const label = (key: string) => isRTL ? key : key;
    const addSheet = (rawName: string, rows: Record<string, unknown>[]) => {
      let name = rawName.replace(/[\\\\/?*:[\\]]/g, ' ').trim().slice(0, 31) || 'Data';
      const base = name;
      let suffix = 2;
      while (usedNames.has(name)) {
        const tail = ` ${suffix++}`;
        name = base.slice(0, 31 - tail.length) + tail;
      }
      usedNames.add(name);
      const normalized = rows.length ? rows.map((row) => Object.fromEntries(
        Object.entries(row).map(([key, value]) => [
          key,
          value !== null && typeof value === 'object' ? JSON.stringify(value) : value,
        ])
      )) : [{ [isRTL ? 'ملاحظة' : 'Note']: isRTL ? 'لا توجد بيانات' : 'No data' }];
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(normalized), name);
    };

    const source = state as unknown as Record<string, unknown>;
    for (const [key, value] of Object.entries(source)) {
      // Never export local authentication secrets or cloud bearer credentials.
      if (key === 'security') continue;
      if (key === 'settings' && value && typeof value === 'object') {
        const { syncKey: _syncKey, ...safeSettings } = value as Record<string, unknown>;
        addSheet(label(key), Object.entries(safeSettings).map(([field, fieldValue]) => ({
          [isRTL ? 'الحقل' : 'Field']: field,
          [isRTL ? 'القيمة' : 'Value']: fieldValue,
        })));
      } else if (Array.isArray(value)) {
        addSheet(label(key), value.map((item, index) => ({
          [isRTL ? 'الرقم' : 'No']: index + 1,
          ...((item && typeof item === 'object') ? item as Record<string, unknown> : { value: item }),
        })));
      } else if (value && typeof value === 'object') {
        addSheet(label(key), Object.entries(value as Record<string, unknown>).map(([field, fieldValue]) => ({
          [isRTL ? 'الحقل' : 'Field']: field,
          [isRTL ? 'القيمة' : 'Value']: fieldValue,
        })));
      }
    }

    // Work timers are persisted separately from AppState; include them when available.
    try {
      const timers = typeof localStorage !== 'undefined'
        ? localStorage.getItem('smart_work_timers_state')
        : null;
      if (timers) {
        const parsed = JSON.parse(timers);
        addSheet(isRTL ? 'مؤقتات العمل' : 'Work Timers',
          Object.entries(parsed as Record<string, unknown>).map(([workId, timer]) => ({
            [isRTL ? 'معرف العمل' : 'Work ID']: workId,
            [isRTL ? 'بيانات المؤقت' : 'Timer Data']: timer,
          })));
      }
    } catch (error) {
      console.warn('Could not include work timers in export:', error);
    }

    void saveExportBlob(new Blob([XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `full-wallet-export-${new Date().toISOString().slice(0, 10)}.xlsx`);
  },

  /**
   * Export all application sections and records into one comprehensive PDF.
   * Sensitive authentication and cloud credentials are intentionally excluded.
   */
  exportFullReportToPDF: async (state: AppState, isRTL: boolean = true) => {
    const source = state as unknown as Record<string, unknown>;
    const sections: Array<{ name: string; rows: Array<Record<string, unknown>> }> = [];
    const label = (key: string) => key;
    for (const [key, value] of Object.entries(source)) {
      if (key === 'security') continue;
      if (key === 'settings' && value && typeof value === 'object') {
        const { syncKey: _syncKey, ...safeSettings } = value as Record<string, unknown>;
        sections.push({ name: label(key), rows: Object.entries(safeSettings).map(([field, item]) => ({ field, value: item })) });
      } else if (Array.isArray(value)) {
        sections.push({ name: label(key), rows: value.map((item, index) => ({
          number: index + 1,
          ...((item && typeof item === 'object') ? item as Record<string, unknown> : { value: item }),
        })) });
      } else if (value && typeof value === 'object') {
        sections.push({ name: label(key), rows: Object.entries(value as Record<string, unknown>).map(([field, item]) => ({ field, value: item })) });
      }
    }
    try {
      const timerData = typeof localStorage !== 'undefined' ? localStorage.getItem('smart_work_timers_state') : null;
      if (timerData) {
        const parsed = JSON.parse(timerData) as Record<string, unknown>;
        sections.push({ name: isRTL ? 'مؤقتات العمل' : 'Work Timers', rows: Object.entries(parsed).map(([workId, timer]) => ({ workId, timer })) });
      }
    } catch (error) {
      console.warn('Could not include work timers in PDF export:', error);
    }

    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-100000px';
    container.style.top = '0';
    container.style.width = '1100px';
    container.style.padding = '28px';
    container.style.background = '#ffffff';
    container.style.color = '#172033';
    container.style.fontFamily = 'Arial, sans-serif';
    container.dir = isRTL ? 'rtl' : 'ltr';
    const safe = (value: unknown) => escapeHtml(
      value !== null && typeof value === 'object' ? JSON.stringify(value) : String(value ?? '')
    );
    const sectionsHtml = sections.map((section) => {
      const keys = Array.from(new Set(section.rows.flatMap((row) => Object.keys(row))));
      const header = keys.map((key) => '<th>' + safe(key) + '</th>').join('');
      const rows = section.rows.length
        ? section.rows.map((row) => '<tr>' + keys.map((key) => '<td>' + safe(row[key]) + '</td>').join('') + '</tr>').join('')
        : '<tr><td>' + (isRTL ? 'لا توجد بيانات' : 'No data') + '</td></tr>';
      return '<section style="margin:0 0 28px;break-inside:avoid"><h2 style="font-size:18px;color:#3346a8;border-bottom:2px solid #dbe2ff;padding:0 0 8px">' + safe(section.name) + '</h2><table style="width:100%;border-collapse:collapse;font-size:10px;table-layout:auto"><thead><tr style="background:#e9edff">' + header + '</tr></thead><tbody>' + rows + '</tbody></table></section>';
    }).join('');
    container.innerHTML = '<header style="margin-bottom:28px;border-bottom:3px solid #4657bd;padding-bottom:14px"><h1 style="font-size:26px;margin:0 0 8px;color:#26358b">' + (isRTL ? 'تقرير المحفظة المالية الشامل' : 'Complete Financial Wallet Report') + '</h1><div style="font-size:12px;color:#64748b">' + safe(new Date().toLocaleString(isRTL ? 'ar' : 'en')) + '</div></header>' + sectionsHtml;
    document.body.appendChild(container);
    try {
      const success = await exportService.exportElementToPDF(container, isRTL ? 'تقرير-المحفظة-الشامل' : 'complete-wallet-report');
      return success;
    } finally {
      document.body.removeChild(container);
    }
  },

  /**
   * Export an HTML element or Section directly to PDF
   */
  exportElementToPDF: async (element: HTMLElement, filename: string) => {
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#0a0a1a',
        logging: false,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      // Handle multi-page if height exceeds A4 height (297mm)
      const pageHeight = pdf.internal.pageSize.getHeight();
      if (pdfHeight <= pageHeight) {
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      } else {
        let heightLeft = pdfHeight;
        let position = 0;
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
        while (heightLeft > 0) {
          position = position - pageHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
          heightLeft -= pageHeight;
        }
      }

      await saveExportBlob(pdf.output('blob'), `${filename}-${new Date().toISOString().slice(0, 10)}.pdf`);
      return true;
    } catch (e) {
      console.error('PDF export error:', e);
      return false;
    }
  },

  /**
   * Generate and export structured section PDF report directly
   */
  exportSectionReportPDF: async (
    title: string,
    state: AppState,
    items: Array<{ title: string; subtitle?: string; amount?: string; extra?: string }>,
    summaryStats: Array<{ label: string; value: string }>,
    isRTL: boolean = true
  ) => {
    // Create temporary styled container
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '-9999px';
    container.style.left = '-9999px';
    container.style.width = '800px';
    container.style.padding = '32px';
    container.style.backgroundColor = '#0f0f26';
    container.style.color = '#ffffff';
    container.style.fontFamily = 'Cairo, system-ui, sans-serif';
    container.dir = isRTL ? 'rtl' : 'ltr';

    const dateStr = new Date().toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    let statsHtml = '';
    if (summaryStats.length > 0) {
      statsHtml = `
        <div style="display: flex; gap: 12px; margin-bottom: 24px;">
          ${summaryStats
            .map(
              (s) => `
            <div style="flex: 1; background: #1a1a3a; border: 1px solid #3b3b6d; border-radius: 12px; padding: 14px; text-align: center;">
              <div style="font-size: 11px; color: #a5b4fc; margin-bottom: 4px;">${escapeHtml(s.label)}</div>
              <div style="font-size: 16px; font-weight: 800; color: #38bdf8;">${escapeHtml(s.value)}</div>
            </div>
          `
            )
            .join('')}
        </div>
      `;
    }

    let itemsHtml = '';
    if (items.length > 0) {
      itemsHtml = `
        <div style="background: #141430; border: 1px solid #2a2a50; border-radius: 16px; overflow: hidden;">
          <table style="width: 100%; border-collapse: collapse; text-align: ${isRTL ? 'right' : 'left'}; font-size: 12px;">
            <thead>
              <tr style="background: #1e1e48; color: #c7d2fe; border-bottom: 1px solid #37376b;">
                <th style="padding: 10px 14px;">#</th>
                <th style="padding: 10px 14px;">${isRTL ? 'البيان / العنصر' : 'Item / Description'}</th>
                <th style="padding: 10px 14px;">${isRTL ? 'التفاصيل' : 'Details'}</th>
                <th style="padding: 10px 14px; text-align: ${isRTL ? 'left' : 'right'};">${isRTL ? 'المبلغ' : 'Amount'}</th>
              </tr>
            </thead>
            <tbody>
              ${items
                .map(
                  (item, i) => `
                <tr style="border-bottom: 1px solid #1e1e40; color: #e2e8f0;">
                  <td style="padding: 9px 14px; color: #818cf8;">${i + 1}</td>
                  <td style="padding: 9px 14px; font-weight: 700;">${escapeHtml(item.title)}</td>
                  <td style="padding: 9px 14px; color: #94a3b8; font-size: 11px;">${escapeHtml(item.subtitle || item.extra || '-')}</td>
                  <td style="padding: 9px 14px; text-align: ${isRTL ? 'left' : 'right'}; font-weight: 800; color: #34d399;">${escapeHtml(item.amount || '-')}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </div>
      `;
    } else {
      itemsHtml = `<div style="text-align: center; padding: 30px; color: #818cf8; font-size: 13px;">${isRTL ? 'لا توجد بيانات مسجلة في هذا القسم' : 'No records found'}</div>`;
    }

    container.innerHTML = `
      <div style="border-bottom: 2px solid #6366f1; padding-bottom: 16px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h1 style="font-size: 22px; font-weight: 900; margin: 0; color: #c084fc;">${escapeHtml(title)}</h1>
          <p style="font-size: 12px; color: #a5b4fc; margin: 4px 0 0 0;">${isRTL ? 'المحفظة المالية الذكية • تقرير رسمي موثق' : 'Smart Financial Wallet • Official Report'}</p>
        </div>
        <div style="text-align: ${isRTL ? 'left' : 'right'}; font-size: 11px; color: #94a3b8;">
          <div>${escapeHtml(dateStr)}</div>
          <div style="color: #10b981; font-weight: 700; margin-top: 2px;">IndexedDB Verified</div>
        </div>
      </div>
      ${statsHtml}
      ${itemsHtml}
      <div style="margin-top: 24px; text-align: center; font-size: 10px; color: #64748b; border-top: 1px solid #1e1e40; padding-top: 12px;">
        ${isRTL ? 'تم إنشاء هذا التقرير تلقائياً بواسطة نظام المحفظة المالية الذكية' : 'Generated automatically by Smart Financial Wallet'}
      </div>
    `;

    document.body.appendChild(container);
    const success = await exportService.exportElementToPDF(container, title.replace(/\s+/g, '-'));
    document.body.removeChild(container);
    return success;
  },
};
