import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { AppState } from '../types';
import { formatCurrency } from './i18n';

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
    XLSX.writeFile(workbook, `wallet-transactions-${new Date().toISOString().slice(0, 10)}.xlsx`);
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
    XLSX.writeFile(workbook, `debts-people-report-${new Date().toISOString().slice(0, 10)}.xlsx`);
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

    XLSX.writeFile(workbook, `work-freelance-report-${new Date().toISOString().slice(0, 10)}.xlsx`);
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

    XLSX.writeFile(workbook, `budgets-goals-${new Date().toISOString().slice(0, 10)}.xlsx`);
  },

  /**
   * Export Complete All-in-One Workbook to Excel
   */
  exportFullWorkbookToExcel: (state: AppState, isRTL: boolean = true) => {
    const cur = state.settings.currency || 'ر.س';
    const catMap = new Map(state.categories.map((c) => [c.id, c.name]));
    const workbook = XLSX.utils.book_new();

    // 1. Transactions
    const txRows = state.transactions.map((tx, idx) => ({
      [isRTL ? 'الرقم' : 'ID']: idx + 1,
      [isRTL ? 'التاريخ' : 'Date']: tx.date,
      [isRTL ? 'النوع' : 'Type']:
        tx.type === 'income' ? (isRTL ? 'دخل (+)' : 'Income') : (isRTL ? 'مصروف (-)' : 'Expense'),
      [isRTL ? 'التصنيف' : 'Category']: catMap.get(tx.category) || tx.category,
      [isRTL ? `المبلغ (${cur})` : `Amount (${cur})`]: Number(tx.amount),
      [isRTL ? 'الوصف' : 'Desc']: tx.desc || '',
    }));
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(txRows.length > 0 ? txRows : [{ [isRTL ? 'ملاحظة' : 'Note']: 'No data' }]),
      isRTL ? 'المعاملات' : 'Transactions'
    );

    // 2. People & Debts
    const debtRows = state.debts.map((d, idx) => {
      const p = state.people.find((x) => x.id === d.personId);
      return {
        [isRTL ? 'م' : 'No']: idx + 1,
        [isRTL ? 'الشخص' : 'Person']: p?.name || '',
        [isRTL ? 'النوع' : 'Type']: d.type === 'debt' ? (isRTL ? 'دين عليك' : 'Debt') : (isRTL ? 'مستحق لك' : 'Receivable'),
        [isRTL ? `المبلغ (${cur})` : `Amount (${cur})`]: Number(d.amount),
        [isRTL ? 'الوصف' : 'Desc']: d.desc,
      };
    });
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(debtRows.length > 0 ? debtRows : [{ [isRTL ? 'ملاحظة' : 'Note']: 'No data' }]),
      isRTL ? 'الديون والمستحقات' : 'Debts'
    );

    // 3. Work
    const workRows = state.works.map((w, idx) => ({
      [isRTL ? 'م' : 'No']: idx + 1,
      [isRTL ? 'المشروع' : 'Project']: w.name,
      [isRTL ? 'العميل' : 'Client']: w.client || '',
      [isRTL ? `السعر (${cur})` : `Rate (${cur})`]: Number(w.rate),
      [isRTL ? 'الوحدة' : 'Unit']: w.unitName,
      [isRTL ? 'الحالة' : 'Status']: w.status,
    }));
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(workRows.length > 0 ? workRows : [{ [isRTL ? 'ملاحظة' : 'Note']: 'No data' }]),
      isRTL ? 'الأعمال والمشاريع' : 'Work Projects'
    );

    XLSX.writeFile(workbook, `full-financial-backup-${new Date().toISOString().slice(0, 10)}.xlsx`);
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

      pdf.save(`${filename}-${new Date().toISOString().slice(0, 10)}.pdf`);
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
              <div style="font-size: 11px; color: #a5b4fc; margin-bottom: 4px;">${s.label}</div>
              <div style="font-size: 16px; font-weight: 800; color: #38bdf8;">${s.value}</div>
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
                  <td style="padding: 9px 14px; font-weight: 700;">${item.title}</td>
                  <td style="padding: 9px 14px; color: #94a3b8; font-size: 11px;">${item.subtitle || item.extra || '-'}</td>
                  <td style="padding: 9px 14px; text-align: ${isRTL ? 'left' : 'right'}; font-weight: 800; color: #34d399;">${item.amount || '-'}</td>
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
          <h1 style="font-size: 22px; font-weight: 900; margin: 0; color: #c084fc;">${title}</h1>
          <p style="font-size: 12px; color: #a5b4fc; margin: 4px 0 0 0;">${isRTL ? 'المحفظة المالية الذكية • تقرير رسمي موثق' : 'Smart Financial Wallet • Official Report'}</p>
        </div>
        <div style="text-align: ${isRTL ? 'left' : 'right'}; font-size: 11px; color: #94a3b8;">
          <div>${dateStr}</div>
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
