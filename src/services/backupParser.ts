import { AppState, Transaction, Category, Person, Debt, Payment, Work, WorkLog, WorkPayment, WorkGoal, Budget, FinancialGoal } from '../types';
import { INITIAL_STATE, DEFAULT_RATES } from './db';

export interface BackupInspection {
  isValid: boolean;
  transactionsCount: number;
  peopleCount: number;
  debtsCount: number;
  worksCount: number;
  workLogsCount: number;
  budgetsCount: number;
  goalsCount: number;
  currency: string;
  theme: string;
  lastUpdated?: string;
  sourceFormat: string;
  previewTransactions: { desc: string; amount: number; type: string; date: string }[];
  state: AppState;
}

// Convert any Arabic/persian digits to standard latin digits
function normalizeDigits(str: string): string {
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  let res = str;
  for (let i = 0; i < 10; i++) {
    res = res.replace(new RegExp(arabicDigits[i], 'g'), i.toString());
    res = res.replace(new RegExp(persianDigits[i], 'g'), i.toString());
  }
  return res;
}

// Parse number safely from strings like "1,500.50 SAR" or numbers
function parseAmount(val: any): number {
  if (typeof val === 'number') {
    return isNaN(val) ? 0 : val;
  }
  if (!val) return 0;
  let str = normalizeDigits(String(val)).trim();
  // Remove currency signs, letters, spaces except minus and dots
  str = str.replace(/[^\d.-]/g, '');
  const num = parseFloat(str);
  return isNaN(num) ? 0 : Math.abs(num);
}

// Detect transaction type
function detectTxType(val: any, amount?: number): 'income' | 'expense' {
  if (!val && typeof amount === 'number') {
    return amount < 0 ? 'expense' : 'income';
  }
  const s = String(val || '').toLowerCase().trim();
  if (
    s === 'income' ||
    s === 'in' ||
    s === '+' ||
    s.includes('دخل') ||
    s.includes('إيراد') ||
    s.includes('ايراد') ||
    s.includes('قبض') ||
    s.includes('وارد') ||
    s.includes('راتب')
  ) {
    return 'income';
  }
  return 'expense';
}

// Clean text that might be wrapped in markdown or have extra preamble
export function cleanJSONString(rawText: string): string {
  let cleaned = rawText.trim();
  
  // Remove markdown codeblock fences ```json ... ``` or ``` ... ```
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  }

  // If there is preamble text before the JSON, find the first { or [
  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');
  
  let startIndex = -1;
  if (firstBrace !== -1 && firstBracket !== -1) {
    startIndex = Math.min(firstBrace, firstBracket);
  } else if (firstBrace !== -1) {
    startIndex = firstBrace;
  } else if (firstBracket !== -1) {
    startIndex = firstBracket;
  }

  if (startIndex > 0) {
    cleaned = cleaned.slice(startIndex);
  }

  // Find last } or ]
  const lastBrace = cleaned.lastIndexOf('}');
  const lastBracket = cleaned.lastIndexOf(']');
  const endIndex = Math.max(lastBrace, lastBracket);
  if (endIndex !== -1 && endIndex < cleaned.length - 1) {
    cleaned = cleaned.slice(0, endIndex + 1);
  }

  return cleaned;
}

export function parseAndInspectBackup(input: string | object): {
  success: boolean;
  inspection?: BackupInspection;
  error?: string;
} {
  try {
    let rawObj: any;

    if (typeof input === 'string') {
      const sanitizedText = cleanJSONString(input);
      try {
        rawObj = JSON.parse(sanitizedText);
      } catch (err: any) {
        // Try fallback regex for unescaped newlines or simple JSON errors
        try {
          // Replace single quotes with double quotes if not valid JSON
          const relaxed = sanitizedText.replace(/'/g, '"');
          rawObj = JSON.parse(relaxed);
        } catch {
          return {
            success: false,
            error: 'تعذر قراءة النص كـ JSON صالح. يرجى التأكد من صحة النص أو الملف المرفق.',
          };
        }
      }
    } else if (typeof input === 'object' && input !== null) {
      rawObj = input;
    } else {
      return { success: false, error: 'البيانات المدخلة فارغة أو غير صالحة.' };
    }

    // Unwrap nested objects if needed
    let root = rawObj;
    let sourceFormat = 'Smart Wallet (Direct)';

    // Check wrapper properties
    if (root.data && typeof root.data === 'object' && !Array.isArray(root.data)) {
      root = root.data;
      sourceFormat = 'Smart Wallet (data wrapper)';
    } else if (root.value && typeof root.value === 'object' && !Array.isArray(root.value)) {
      root = root.value;
      sourceFormat = 'Smart Wallet (value wrapper)';
    } else if (root.state && typeof root.state === 'object' && !Array.isArray(root.state)) {
      root = root.state;
      sourceFormat = 'Smart Wallet (state wrapper)';
    } else if (root.backup && typeof root.backup === 'object' && !Array.isArray(root.backup)) {
      root = root.backup;
      sourceFormat = 'External Backup wrapper';
    } else if (root.wallet && typeof root.wallet === 'object' && !Array.isArray(root.wallet)) {
      root = root.wallet;
      sourceFormat = 'Wallet wrapper';
    }

    // Check if root itself is an array of transactions
    const isArrayFormat = Array.isArray(root);
    if (isArrayFormat) {
      sourceFormat = 'Transactions List (Array)';
    } else {
      if (!root || typeof root !== 'object') return { success: false, error: 'بنية النسخة الاحتياطية غير صالحة.' };
      const arrayAliases = [
        ['transactions', 'txs', 'operations', 'records', 'المعاملات', 'العمليات', 'حركات_الحساب', 'entries', 'items'],
        ['categories', 'cats', 'الأقسام', 'التصنيفات', 'الفئات'],
        ['people', 'persons', 'clients', 'الأشخاص', 'العملاء', 'جهات_الاتصال'],
        ['debts', 'loans', 'الديون', 'السلف', 'المستحقات'],
        ['payments', 'debtPayments', 'الدفعات', 'السداد'],
        ['works', 'projects', 'الأعمال', 'المشاريع'],
        ['workLogs', 'logs', 'سجلات_العمل'],
        ['workPayments', 'دفعات_العمل'],
        ['workGoals'], ['budgets', 'الميزانية', 'الميزانيات'],
        ['financialGoals', 'goals', 'الأهداف'], ['notebooks'], ['standardNotes'], ['mindMaps'],
      ];
      let recognized = false;
      for (const aliases of arrayAliases) {
        for (const key of aliases) {
          if (Object.prototype.hasOwnProperty.call(root, key)) {
            recognized = true;
            if (!Array.isArray(root[key])) return { success: false, error: `الحقل "${key}" يجب أن يكون قائمة.` };
          }
        }
      }
      if (root.settings !== undefined && (!root.settings || typeof root.settings !== 'object' || Array.isArray(root.settings))) {
        return { success: false, error: 'إعدادات النسخة الاحتياطية غير صالحة.' };
      }
      if (root.security !== undefined && (!root.security || typeof root.security !== 'object' || Array.isArray(root.security))) {
        return { success: false, error: 'بيانات الحماية في النسخة الاحتياطية غير صالحة.' };
      }
      if (!recognized && !root.settings && !root.security && !root.exchangeRates) {
        return { success: false, error: 'لم يتم العثور على أقسام محفظة معروفة في الملف.' };
      }
    }

    // Extract categories
    const rawCategories = !isArrayFormat
      ? root.categories || root.cats || root.الأقسام || root.التصنيفات || root.الفئات || []
      : [];
    const categories: Category[] = Array.isArray(rawCategories) && rawCategories.length > 0
      ? rawCategories.map((c: any, idx: number) => ({
          id: c.id ? String(c.id) : `cat_${idx}_${Date.now().toString(36)}`,
          name: c.name || c.title || c.الاسم || `تصنيف ${idx + 1}`,
          type: (c.type === 'income' || c.النوع === 'دخل' || c.النوع === 'إيراد') ? 'income' : 'expense',
          color: c.color || '#7c3aed',
          icon: c.icon || '🏷️',
        }))
      : [...INITIAL_STATE.categories];

    // Extract people
    const rawPeople = !isArrayFormat
      ? root.people || root.persons || root.clients || root.الأشخاص || root.العملاء || root.جهات_الاتصال || []
      : [];
    const people: Person[] = Array.isArray(rawPeople)
      ? rawPeople.map((p: any, idx: number) => ({
          id: p.id ? String(p.id) : `p_${idx}_${Date.now().toString(36)}`,
          name: p.name || p.الاسم || p.client || `شخص ${idx + 1}`,
          phone: p.phone || p.هاتف || p.جوال || '',
          email: p.email || p.بريد || '',
          notes: p.notes || p.ملاحظات || '',
        }))
      : [];

    const peopleMap = new Map<string, string>();
    people.forEach((p) => peopleMap.set(p.name.trim(), p.id));

    // Extract debts
    const rawDebts = !isArrayFormat
      ? root.debts || root.loans || root.الديون || root.السلف || root.المستحقات || []
      : [];
    const debts: Debt[] = Array.isArray(rawDebts)
      ? rawDebts.map((d: any, idx: number) => {
          let personId = d.personId ? String(d.personId) : '';
          const personName = d.personName || d.person || d.الشخص || d.الاسم;
          if (!personId && personName) {
            const trimmedName = String(personName).trim();
            if (peopleMap.has(trimmedName)) {
              personId = peopleMap.get(trimmedName)!;
            } else {
              // Create new person automatically
              const newPersonId = `p_auto_${idx}_${Date.now().toString(36)}`;
              people.push({
                id: newPersonId,
                name: trimmedName,
              });
              peopleMap.set(trimmedName, newPersonId);
              personId = newPersonId;
            }
          }
          if (!personId && people.length > 0) {
            personId = people[0].id;
          }

          const rawDebtType = d.type || d.النوع;
          const isReceivable =
            rawDebtType === 'receivable' ||
            rawDebtType === 'مستحق' ||
            rawDebtType === 'لي' ||
            rawDebtType === 'لك';

          return {
            id: d.id ? String(d.id) : `d_${idx}_${Date.now().toString(36)}`,
            personId: personId || 'p_unknown',
            type: isReceivable ? 'receivable' : 'debt',
            amount: parseAmount(d.amount || d.المبلغ || d.value),
            desc: d.desc || d.description || d.البيان || d.الوصف || '',
            date: d.date || d.التاريخ || new Date().toISOString(),
          };
        })
      : [];

    // Extract transactions
    const rawTxList = isArrayFormat
      ? root
      : root.transactions ||
        root.txs ||
        root.operations ||
        root.records ||
        root.المعاملات ||
        root.العمليات ||
        root.حركات_الحساب ||
        root.entries ||
        root.items ||
        [];

    const transactions: Transaction[] = Array.isArray(rawTxList)
      ? rawTxList.map((t: any, idx: number) => {
          const rawAmount = t.amount || t.المبلغ || t.value || t.val || t.price || t.cost || t.total;
          const amount = parseAmount(rawAmount);
          const type = detectTxType(t.type || t.النوع, rawAmount);
          
          let cat = t.category || t.cat || t.التصنيف || t.القسم || t.الفئة;
          // If category is a name not an id, find or add to categories
          if (cat) {
            const foundCat = categories.find((c) => c.id === cat || c.name === cat);
            if (foundCat) {
              cat = foundCat.id;
            } else {
              const newCatId = `cat_auto_${idx}_${Date.now().toString(36)}`;
              categories.push({
                id: newCatId,
                name: String(cat),
                type,
              });
              cat = newCatId;
            }
          } else {
            const fallbackCat = categories.find((c) => c.type === type) || categories[0];
            cat = fallbackCat ? fallbackCat.id : 'cat_general';
          }

          let dateStr = t.date || t.التاريخ || t.time || t.created_at || t.createdAt;
          if (!dateStr || isNaN(new Date(dateStr).getTime())) {
            dateStr = new Date().toISOString();
          } else {
            dateStr = new Date(dateStr).toISOString();
          }

          return {
            id: t.id ? String(t.id) : `tx_imp_${idx}_${Date.now().toString(36)}`,
            date: dateStr,
            type,
            category: cat,
            amount,
            desc: t.desc || t.description || t.البيان || t.الوصف || t.note || t.notes || t.title || '',
          };
        })
      : [];

    // Extract payments
    const rawPayments = !isArrayFormat
      ? root.payments || root.debtPayments || root.الدفعات || root.السداد || []
      : [];
    const payments: Payment[] = Array.isArray(rawPayments)
      ? rawPayments.map((p: any, idx: number) => ({
          id: p.id ? String(p.id) : `pmt_${idx}_${Date.now().toString(36)}`,
          debtId: p.debtId ? String(p.debtId) : debts[0]?.id || '',
          amount: parseAmount(p.amount || p.المبلغ),
          date: p.date || p.التاريخ || new Date().toISOString(),
          method: p.method || 'cash',
          notes: p.notes || p.ملاحظات || '',
        }))
      : [];

    // Extract works
    const rawWorks = !isArrayFormat
      ? root.works || root.projects || root.الأعمال || root.المشاريع || []
      : [];
    const works: Work[] = Array.isArray(rawWorks)
      ? rawWorks.map((w: any, idx: number) => ({
          id: w.id ? String(w.id) : `w_${idx}_${Date.now().toString(36)}`,
          name: w.name || w.title || w.الاسم || w.المشروع || `مشروع ${idx + 1}`,
          client: w.client || w.العميل || '',
          calculationType: (w.calculationType === 'piece' || w.النوع === 'بالقطعة') ? 'piece' : 'hourly',
          rate: parseAmount(w.rate || w.السعر || w.الأجر),
          unitName: w.unitName || (w.calculationType === 'piece' ? 'قطعة' : 'ساعة'),
          status: w.status || 'active',
          startDate: w.startDate || null,
          endDate: w.endDate || null,
          desc: w.desc || w.description || w.الوصف || '',
        }))
      : [];

    // Extract work logs
    const rawWorkLogs = !isArrayFormat
      ? root.workLogs || root.logs || root.سجلات_العمل || []
      : [];
    const workLogs: WorkLog[] = Array.isArray(rawWorkLogs)
      ? rawWorkLogs.map((l: any, idx: number) => ({
          id: l.id ? String(l.id) : `wl_${idx}_${Date.now().toString(36)}`,
          workId: l.workId ? String(l.workId) : works[0]?.id || '',
          date: l.date || new Date().toISOString().slice(0, 10),
          start: l.start || '09:00',
          end: l.end || '17:00',
          hours: parseAmount(l.hours || l.الساعات),
          quantity: parseAmount(l.quantity || l.الكمية),
          desc: l.desc || l.الوصف || '',
        }))
      : [];

    // Extract work payments
    const rawWorkPayments = !isArrayFormat
      ? root.workPayments || root.دفعات_العمل || []
      : [];
    const workPayments: WorkPayment[] = Array.isArray(rawWorkPayments)
      ? rawWorkPayments.map((wp: any, idx: number) => ({
          id: wp.id ? String(wp.id) : `wp_${idx}_${Date.now().toString(36)}`,
          workId: wp.workId ? String(wp.workId) : works[0]?.id || '',
          type: wp.type || 'payment',
          amount: parseAmount(wp.amount || wp.المبلغ),
          date: wp.date || new Date().toISOString(),
          method: wp.method || 'cash',
          desc: wp.desc || '',
        }))
      : [];

    // Extract work goals
    const rawWorkGoals = !isArrayFormat ? root.workGoals || [] : [];
    const workGoals: WorkGoal[] = Array.isArray(rawWorkGoals) ? rawWorkGoals : [];

    // Extract budgets
    const rawBudgets = !isArrayFormat
      ? root.budgets || root.الميزانية || root.الميزانيات || []
      : [];
    const budgets: Budget[] = Array.isArray(rawBudgets)
      ? rawBudgets.map((b: any, idx: number) => ({
          id: b.id ? String(b.id) : `b_${idx}_${Date.now().toString(36)}`,
          categoryId: b.categoryId ? String(b.categoryId) : categories[0]?.id || '',
          categoryName: b.categoryName || b.اسم_القسم || '',
          amount: parseAmount(b.amount || b.المبلغ),
        }))
      : [];

    // Extract financial goals
    const rawFinancialGoals = !isArrayFormat
      ? root.financialGoals || root.goals || root.الأهداف || []
      : [];
    const financialGoals: FinancialGoal[] = Array.isArray(rawFinancialGoals)
      ? rawFinancialGoals.map((g: any, idx: number) => ({
          id: g.id ? String(g.id) : `fg_${idx}_${Date.now().toString(36)}`,
          name: g.name || g.الهدف || `هدف ${idx + 1}`,
          target: parseAmount(g.target || g.المستهدف),
          savedAmount: parseAmount(g.savedAmount || g.المحقق),
          deadline: g.deadline,
          icon: g.icon || '🎯',
        }))
      : [];

    // Settings
    const rawSettings = !isArrayFormat ? root.settings || root.الإعدادات || {} : {};
    const settings = {
      currency: rawSettings.currency || root.currency || root.العملة || 'ر.س',
      language: (rawSettings.language === 'en' || root.language === 'en') ? 'en' as const : 'ar' as const,
      theme: rawSettings.theme || 'purple',
      autoCloudSync: Boolean(rawSettings.autoCloudSync),
      syncKey: rawSettings.syncKey || root.syncKey || INITIAL_STATE.settings.syncKey,
      syncServerUrl: typeof rawSettings.syncServerUrl === 'string' ? rawSettings.syncServerUrl : '',
      userEmail: (() => { const email = rawSettings.userEmail || root.email || ''; return email === 'loay94an@gmail.com' ? '' : String(email); })(),
    };

    // Security
    const rawSecurity = !isArrayFormat ? root.security || {} : {};
    const security = {
      enabled: Boolean(rawSecurity.enabled),
      type: (rawSecurity.type === 'pin' ? 'pin' : 'off') as 'off' | 'pin' | 'pattern',
      pin: rawSecurity.pin ? String(rawSecurity.pin) : '',
      pinSalt: rawSecurity.pinSalt ? String(rawSecurity.pinSalt) : '',
      pinHash: rawSecurity.pinHash ? String(rawSecurity.pinHash) : '',
      pinLength: Number(rawSecurity.pinLength) || (rawSecurity.pin ? String(rawSecurity.pin).length : 4),
      pattern: Array.isArray(rawSecurity.pattern) ? rawSecurity.pattern : [],
    };

    const finalState: AppState = {
      transactions,
      categories,
      people,
      debts,
      payments,
      works,
      workLogs,
      workPayments,
      workGoals,
      budgets,
      financialGoals,
      notebooks: root.notebooks || INITIAL_STATE.notebooks,
      standardNotes: root.standardNotes || INITIAL_STATE.standardNotes,
      mindMaps: root.mindMaps || INITIAL_STATE.mindMaps,
      exchangeRates: root.exchangeRates ? { ...DEFAULT_RATES, ...root.exchangeRates } : { ...DEFAULT_RATES },
      settings,
      security,
      lastUpdated: root.lastUpdated || new Date().toISOString(),
    };

    const inspection: BackupInspection = {
      isValid: true,
      transactionsCount: transactions.length,
      peopleCount: people.length,
      debtsCount: debts.length,
      worksCount: works.length,
      workLogsCount: workLogs.length,
      budgetsCount: budgets.length,
      goalsCount: financialGoals.length,
      currency: settings.currency,
      theme: settings.theme,
      lastUpdated: finalState.lastUpdated,
      sourceFormat,
      previewTransactions: transactions.slice(0, 5).map((t) => ({
        desc: t.desc || 'معاملة مالية',
        amount: t.amount,
        type: t.type,
        date: t.date.slice(0, 10),
      })),
      state: finalState,
    };

    return {
      success: true,
      inspection,
    };
  } catch (err: any) {
    return {
      success: false,
      error: 'خطأ غير متوقع أثناء معالجة البيانات: ' + (err?.message || 'تنسيق غير مدعوم'),
    };
  }
}

// Merge imported state into current state without duplicates.
function mergeById<T extends { id: string }>(current: T[], incoming: T[]): T[] {
  const ids = new Set(current.map((item) => item.id));
  return [...current, ...incoming.filter((item) => !ids.has(item.id))];
}

export function mergeAppState(current: AppState, incoming: AppState): AppState {
  // Merge categories by name
  const categoryNames = new Set(current.categories.map((c) => c.name.trim()));
  const mergedCategories = [...current.categories];
  const catIdMap = new Map<string, string>();

  incoming.categories.forEach((c) => {
    const existing = current.categories.find((ex) => ex.name.trim() === c.name.trim());
    if (existing) {
      catIdMap.set(c.id, existing.id);
    } else {
      mergedCategories.push(c);
      categoryNames.add(c.name.trim());
    }
  });

  // Merge transactions (check date + amount + desc to prevent exact duplicates)
  const txSignature = new Set(
    current.transactions.map((t) => `${t.date.slice(0, 10)}_${t.amount}_${t.type}_${t.desc || ''}`)
  );
  const newTransactions = incoming.transactions
    .filter((t) => !txSignature.has(`${t.date.slice(0, 10)}_${t.amount}_${t.type}_${t.desc || ''}`))
    .map((t) => ({
      ...t,
      category: catIdMap.get(t.category) || t.category,
    }));
  const mergedTransactions = [...newTransactions, ...current.transactions];

  // Merge people
  const peopleNames = new Set(current.people.map((p) => p.name.trim()));
  const mergedPeople = [...current.people];
  const personIdMap = new Map<string, string>();

  incoming.people.forEach((p) => {
    const existing = current.people.find((ex) => ex.name.trim() === p.name.trim());
    if (existing) {
      personIdMap.set(p.id, existing.id);
    } else {
      mergedPeople.push(p);
      peopleNames.add(p.name.trim());
    }
  });

  // Merge debts
  const debtSignature = new Set(
    current.debts.map((d) => `${d.personId}_${d.amount}_${d.type}_${d.date.slice(0, 10)}`)
  );
  const newDebts = incoming.debts
    .filter((d) => {
      const mappedPersonId = personIdMap.get(d.personId) || d.personId;
      return !debtSignature.has(`${mappedPersonId}_${d.amount}_${d.type}_${d.date.slice(0, 10)}`);
    })
    .map((d) => ({
      ...d,
      personId: personIdMap.get(d.personId) || d.personId,
    }));
  const mergedDebts = [...current.debts, ...newDebts];

  // Merge works
  const workNames = new Set(current.works.map((w) => w.name.trim()));
  const mergedWorks = [...current.works];
  incoming.works.forEach((w) => {
    if (!workNames.has(w.name.trim())) {
      mergedWorks.push(w);
      workNames.add(w.name.trim());
    }
  });

  // Merge work logs & payments
  const mergedWorkLogs = [...current.workLogs, ...incoming.workLogs];
  const mergedWorkPayments = [...current.workPayments, ...incoming.workPayments];

  // Merge budgets
  const budgetCatIds = new Set(current.budgets.map((b) => b.categoryId));
  const mergedBudgets = [...current.budgets];
  incoming.budgets.forEach((b) => {
    const mappedCatId = catIdMap.get(b.categoryId) || b.categoryId;
    if (!budgetCatIds.has(mappedCatId)) {
      mergedBudgets.push({ ...b, categoryId: mappedCatId });
      budgetCatIds.add(mappedCatId);
    }
  });

  // Merge financial goals
  const goalNames = new Set(current.financialGoals.map((g) => g.name.trim()));
  const mergedGoals = [...current.financialGoals];
  incoming.financialGoals.forEach((g) => {
    if (!goalNames.has(g.name.trim())) {
      mergedGoals.push(g);
      goalNames.add(g.name.trim());
    }
  });

  return {
    ...current,
    transactions: mergedTransactions,
    categories: mergedCategories,
    people: mergedPeople,
    debts: mergedDebts,
    payments: mergeById(current.payments, incoming.payments),
    works: mergedWorks,
    workLogs: mergeById(current.workLogs, incoming.workLogs),
    workPayments: mergeById(current.workPayments, incoming.workPayments),
    workGoals: mergeById(current.workGoals, incoming.workGoals),
    budgets: mergedBudgets,
    financialGoals: mergedGoals,
    notebooks: mergeById(current.notebooks, incoming.notebooks),
    standardNotes: mergeById(current.standardNotes, incoming.standardNotes),
    mindMaps: mergeById(current.mindMaps, incoming.mindMaps),
    exchangeRates: { ...current.exchangeRates, ...incoming.exchangeRates },
    lastUpdated: new Date().toISOString(),
  };
}
