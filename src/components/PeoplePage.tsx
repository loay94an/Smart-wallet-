import React, { useState } from 'react';
import { AppState, Person, Debt, Payment } from '../types';
import { formatCurrency } from '../services/i18n';
import { ConfirmModal } from './ConfirmModal';
import { exportService } from '../services/exportService';
import {
  Users,
  UserPlus,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  DollarSign,
  Phone,
  Mail,
  Trash2,
  Edit,
  Edit2,
  X,
  CreditCard,
  PlusCircle,
  FileText,
  FileSpreadsheet,
  ChevronDown,
  ChevronUp,
  MoreVertical,
} from 'lucide-react';

interface PeoplePageProps {
  state: AppState;
  onSavePerson: (person: Person) => void;
  onDeletePerson: (id: string) => void;
  onSaveDebt: (debt: Debt) => void;
  onDeleteDebt: (id: string) => void;
  onSavePayment: (payment: Payment) => void;
  onDeletePayment: (id: string) => void;
  language: 'ar' | 'en';
}

export const PeoplePage: React.FC<PeoplePageProps> = ({
  state,
  onSavePerson,
  onDeletePerson,
  onSaveDebt,
  onDeleteDebt,
  onSavePayment,
  onDeletePayment,
  language,
}) => {
  const isRTL = language === 'ar';
  const cur = state.settings.currency || 'ر.س';

  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [isPersonOptionsOpen, setIsPersonOptionsOpen] = useState<boolean>(false);
  const [isOverallOptionsOpen, setIsOverallOptionsOpen] = useState<boolean>(false);

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDanger?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Track expanded payments list per debt
  const [expandedDebts, setExpandedDebts] = useState<Record<string, boolean>>({});

  const toggleDebtPayments = (debtId: string) => {
    setExpandedDebts((prev) => ({ ...prev, [debtId]: !prev[debtId] }));
  };

  // Modals
  const [isPersonModalOpen, setIsPersonModalOpen] = useState<boolean>(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [personName, setPersonName] = useState<string>('');
  const [personPhone, setPersonPhone] = useState<string>('');
  const [personEmail, setPersonEmail] = useState<string>('');
  const [personNotes, setPersonNotes] = useState<string>('');

  const [isDebtModalOpen, setIsDebtModalOpen] = useState<boolean>(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [debtType, setDebtType] = useState<'debt' | 'receivable'>('receivable');
  const [debtAmount, setDebtAmount] = useState<string>('');
  const [debtDesc, setDebtDesc] = useState<string>('');

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [paymentDebtId, setPaymentDebtId] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank' | 'card'>('cash');
  const [paymentNotes, setPaymentNotes] = useState<string>('');

  // Calculations for a person
  const getPersonReport = (personId: string) => {
    const personDebts = state.debts.filter((d) => d.personId === personId);
    const totalDebt = personDebts
      .filter((d) => d.type === 'debt')
      .reduce((s, d) => s + Number(d.amount), 0);
    const totalReceivable = personDebts
      .filter((d) => d.type === 'receivable')
      .reduce((s, d) => s + Number(d.amount), 0);

    const paidMyDebts = state.payments
      .filter((p) => personDebts.some((d) => d.id === p.debtId && d.type === 'debt'))
      .reduce((s, p) => s + Number(p.amount), 0);
    const collectedTheirReceivables = state.payments
      .filter((p) => personDebts.some((d) => d.id === p.debtId && d.type === 'receivable'))
      .reduce((s, p) => s + Number(p.amount), 0);

    const remainingDebt = Math.max(0, totalDebt - paidMyDebts);
    const remainingReceivable = Math.max(0, totalReceivable - collectedTheirReceivables);
    const net = remainingReceivable - remainingDebt;

    let statusText = isRTL ? '✅ الحساب خالص ومغلق' : 'Cleared';
    let statusColor = 'text-purple-300';
    if (net > 0.01) {
      statusText = isRTL ? `🟢 مدين لك بـ ${formatCurrency(net, cur)}` : `Owes you ${formatCurrency(net, cur)}`;
      statusColor = 'text-emerald-400';
    } else if (net < -0.01) {
      statusText = isRTL ? `🔴 أنت مدين له بـ ${formatCurrency(Math.abs(net), cur)}` : `You owe ${formatCurrency(Math.abs(net), cur)}`;
      statusColor = 'text-red-400';
    }

    return {
      totalDebt,
      totalReceivable,
      remainingDebt,
      remainingReceivable,
      net,
      statusText,
      statusColor,
      personDebts,
    };
  };

  // Overall People summary
  const overallSummary = () => {
    let allDebts = 0;
    let allReceivables = 0;
    state.people.forEach((p) => {
      const rep = getPersonReport(p.id);
      allDebts += rep.remainingDebt;
      allReceivables += rep.remainingReceivable;
    });
    return {
      allDebts,
      allReceivables,
      net: allReceivables - allDebts,
    };
  };

  const summary = overallSummary();

  const openNewPersonModal = () => {
    setEditingPerson(null);
    setPersonName('');
    setPersonPhone('');
    setPersonEmail('');
    setPersonNotes('');
    setIsPersonModalOpen(true);
  };

  const openEditPersonModal = (person: Person) => {
    setEditingPerson(person);
    setPersonName(person.name);
    setPersonPhone(person.phone || '');
    setPersonEmail(person.email || '');
    setPersonNotes(person.notes || '');
    setIsPersonModalOpen(true);
  };

  const handleSavePersonSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!personName.trim()) return;

    const person: Person = {
      id: editingPerson ? editingPerson.id : 'p_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name: personName.trim(),
      phone: personPhone.trim(),
      email: personEmail.trim(),
      notes: personNotes.trim(),
    };

    onSavePerson(person);
    setIsPersonModalOpen(false);
  };

  const openAddDebtFor = (type: 'debt' | 'receivable') => {
    setEditingDebt(null);
    setDebtType(type);
    setDebtAmount('');
    setDebtDesc('');
    setIsDebtModalOpen(true);
  };

  const openEditDebtModal = (debt: Debt) => {
    setEditingDebt(debt);
    setDebtType(debt.type);
    setDebtAmount(debt.amount.toString());
    setDebtDesc(debt.desc || '');
    setIsDebtModalOpen(true);
  };

  const handleSaveDebtSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const personId = editingDebt ? editingDebt.personId : selectedPersonId;
    if (!personId) return;
    const amountNum = parseFloat(debtAmount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    const debtData: Debt = {
      id: editingDebt ? editingDebt.id : 'debt_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      personId: personId,
      type: debtType,
      amount: amountNum,
      desc: debtDesc.trim() || (debtType === 'debt' ? (isRTL ? 'دين' : 'Debt') : (isRTL ? 'مستحق' : 'Receivable')),
      date: editingDebt?.date || new Date().toISOString(),
    };

    onSaveDebt(debtData);
    setIsDebtModalOpen(false);
  };

  const openPaymentForDebt = (debt: Debt) => {
    setEditingPayment(null);
    const paidSoFar = state.payments
      .filter((p) => p.debtId === debt.id)
      .reduce((s, p) => s + Number(p.amount), 0);
    const rem = Math.max(0, Number(debt.amount) - paidSoFar);

    setPaymentDebtId(debt.id);
    setPaymentAmount(rem.toFixed(2));
    setPaymentMethod('cash');
    setPaymentNotes('');
    setIsPaymentModalOpen(true);
  };

  const openEditPaymentModal = (pmt: Payment) => {
    setEditingPayment(pmt);
    setPaymentDebtId(pmt.debtId);
    setPaymentAmount(pmt.amount.toString());
    setPaymentMethod(pmt.method);
    setPaymentNotes(pmt.notes || '');
    setIsPaymentModalOpen(true);
  };

  const settleDebtInFull = (debt: Debt) => {
    const paidSoFar = state.payments
      .filter((p) => p.debtId === debt.id)
      .reduce((s, p) => s + Number(p.amount), 0);
    const rem = Math.max(0, Number(debt.amount) - paidSoFar);
    if (rem <= 0.01) return;

    setConfirmModal({
      isOpen: true,
      title: isRTL ? 'سداد كامل المبلغ' : 'Settle Full Balance',
      message: isRTL
        ? `هل تريد تسجيل سداد كامل للمبلغ المتبقي (${formatCurrency(rem, cur)})؟`
        : `Record full settlement for remaining balance (${formatCurrency(rem, cur)})?`,
      confirmText: isRTL ? 'تأكيد السداد' : 'Confirm Settle',
      isDanger: false,
      onConfirm: () => {
        const pmt: Payment = {
          id: 'pmt_' + Date.now().toString(36),
          debtId: debt.id,
          amount: rem,
          date: new Date().toISOString(),
          method: 'cash',
          notes: isRTL ? '[سداد كامل نهائي]' : '[Full settlement]',
        };
        onSavePayment(pmt);
      },
    });
  };

  const handleSavePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetDebtId = editingPayment ? editingPayment.debtId : paymentDebtId;
    const amountNum = parseFloat(paymentAmount);
    if (isNaN(amountNum) || amountNum <= 0 || !targetDebtId) return;

    const pmt: Payment = {
      id: editingPayment ? editingPayment.id : 'pmt_' + Date.now().toString(36),
      debtId: targetDebtId,
      amount: amountNum,
      date: editingPayment?.date || new Date().toISOString(),
      method: paymentMethod,
      notes: paymentNotes.trim(),
    };

    onSavePayment(pmt);
    setIsPaymentModalOpen(false);
  };

  const selectedPerson = state.people.find((p) => p.id === selectedPersonId);
  const selectedPersonRep = selectedPerson ? getPersonReport(selectedPerson.id) : null;

  return (
    <div className="space-y-5 pb-20 pt-2">
      {/* If person selected, render individual person view */}
      {selectedPerson && selectedPersonRep ? (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setSelectedPersonId(null)}
            className="flex items-center gap-1.5 rounded-xl border border-purple-800/40 bg-purple-950/30 px-3 py-1.5 text-xs font-bold text-purple-200 hover:bg-purple-800/40"
          >
            {isRTL ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
            <span>{isRTL ? 'الرجوع لقائمة الأشخاص' : 'Back to People List'}</span>
          </button>

          {/* Person Header Profile */}
          <div className="rounded-3xl border border-purple-500/30 bg-gradient-to-r from-purple-950/60 to-[#161633] p-5 shadow-xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-600/30 text-purple-300 border border-purple-500/40">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">{selectedPerson.name}</h3>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-purple-300/70">
                    {selectedPerson.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-emerald-400" />
                        <span dir="ltr">{selectedPerson.phone}</span>
                      </span>
                    )}
                    {selectedPerson.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3 text-cyan-400" />
                        <span>{selectedPerson.email}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Member Options & Exports Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsPersonOptionsOpen((prev) => !prev)}
                  className="flex items-center justify-center p-2 rounded-xl border border-purple-800/40 bg-[#161633] text-purple-200 hover:bg-purple-800/40 hover:text-white transition-all shadow-sm active:scale-95"
                  title={isRTL ? 'خيارات العضو وتصدير' : 'Member Options & Export'}
                >
                  <MoreVertical className="h-4 w-4" />
                </button>

                {isPersonOptionsOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsPersonOptionsOpen(false)}
                    />
                    <div
                      className={`absolute ${isRTL ? 'left-0' : 'right-0'} mt-1.5 w-56 rounded-2xl border border-purple-800/50 bg-[#15152f] p-1.5 shadow-2xl z-50 animate-fadeIn`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setIsPersonOptionsOpen(false);
                          openEditPersonModal(selectedPerson);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-purple-200 hover:bg-purple-900/40 rounded-xl transition-all"
                      >
                        <Edit className="h-4 w-4 text-purple-400" />
                        <span>{isRTL ? 'تعديل بيانات الحساب' : 'Edit Member Details'}</span>
                      </button>

                      <div className="my-1 border-t border-purple-900/40" />

                      <button
                        type="button"
                        onClick={() => {
                          setIsPersonOptionsOpen(false);
                          exportService.exportPeopleToExcel(state, isRTL);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-green-300 hover:bg-green-950/40 rounded-xl transition-all"
                      >
                        <FileSpreadsheet className="h-4 w-4 text-green-400" />
                        <span>{isRTL ? 'تصدير كشف حساب إكسل' : 'Export Excel Statement'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsPersonOptionsOpen(false);
                          const personDebts = state.debts.filter((d) => d.personId === selectedPerson.id);
                          const items = personDebts.map((d) => {
                            const pmtSum = state.payments.filter((p) => p.debtId === d.id).reduce((s, p) => s + Number(p.amount), 0);
                            const rem = Math.max(0, Number(d.amount) - pmtSum);
                            return {
                              title: d.desc,
                              subtitle: `${d.type === 'debt' ? (isRTL ? 'دين عليك' : 'Debt') : (isRTL ? 'مستحق لك' : 'Receivable')} • ${new Date(d.date).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}`,
                              amount: `${isRTL ? 'المتبقي' : 'Left'}: ${formatCurrency(rem, cur)} / ${formatCurrency(d.amount, cur)}`,
                            };
                          });

                          exportService.exportSectionReportPDF(
                            `${isRTL ? 'كشف حساب:' : 'Statement for:'} ${selectedPerson.name}`,
                            state,
                            items,
                            [
                              { label: isRTL ? 'ديون عليك له' : 'You Owe', value: formatCurrency(selectedPersonRep.remainingDebt, cur) },
                              { label: isRTL ? 'مستحقات لك منه' : 'He Owes You', value: formatCurrency(selectedPersonRep.remainingReceivable, cur) },
                              { label: isRTL ? 'الصافي العام' : 'Net Balance', value: formatCurrency(selectedPersonRep.net, cur) },
                            ],
                            isRTL
                          );
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-purple-200 hover:bg-purple-900/40 rounded-xl transition-all"
                      >
                        <FileText className="h-4 w-4 text-purple-400" />
                        <span>{isRTL ? 'تصدير كشف حساب PDF' : 'Export PDF Statement'}</span>
                      </button>

                      <div className="my-1 border-t border-purple-900/40" />

                      <button
                        type="button"
                        onClick={() => {
                          setIsPersonOptionsOpen(false);
                          setConfirmModal({
                            isOpen: true,
                            title: isRTL ? 'حذف العضو والحساب' : 'Delete Member',
                            message: isRTL
                              ? `هل أنت متأكد من حذف "${selectedPerson.name}"؟ سيتم حذف جميع الديون والدفعات والسجلات المرتبطة به نهائياً.`
                              : `Are you sure you want to delete "${selectedPerson.name}"? All associated debts and payments will be permanently removed.`,
                            onConfirm: () => {
                              onDeletePerson(selectedPerson.id);
                              setSelectedPersonId(null);
                            },
                          });
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-950/40 rounded-xl transition-all"
                      >
                        <Trash2 className="h-4 w-4 text-red-400" />
                        <span>{isRTL ? 'حذف الحساب نهائياً' : 'Delete Account'}</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {selectedPerson.notes && (
              <p className="mt-3 rounded-xl bg-purple-900/20 p-2.5 text-xs text-purple-200 border border-purple-800/30">
                📝 {selectedPerson.notes}
              </p>
            )}

            {/* Net Status Card */}
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-2.5 text-center">
                <span className="text-[10px] text-red-300 block">{isRTL ? 'ديون عليك له' : 'You Owe'}</span>
                <span className="text-sm font-black text-red-400">
                  {formatCurrency(selectedPersonRep.remainingDebt, cur)}
                </span>
              </div>
              <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/20 p-2.5 text-center">
                <span className="text-[10px] text-emerald-300 block">{isRTL ? 'مستحقات لك منه' : 'He Owes You'}</span>
                <span className="text-sm font-black text-emerald-400">
                  {formatCurrency(selectedPersonRep.remainingReceivable, cur)}
                </span>
              </div>
              <div className="col-span-2 sm:col-span-1 rounded-xl border border-purple-800/40 bg-purple-900/30 p-2.5 text-center">
                <span className="text-[10px] text-purple-300 block">{isRTL ? 'الصافي' : 'Net Balance'}</span>
                <span className={`text-sm font-black ${selectedPersonRep.statusColor}`}>
                  {selectedPersonRep.net > 0 ? '+' : ''}
                  {formatCurrency(selectedPersonRep.net, cur)}
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => openAddDebtFor('receivable')}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600/30 border border-emerald-500/40 py-2.5 text-xs font-bold text-emerald-200 hover:bg-emerald-600/50"
            >
              <PlusCircle className="h-4 w-4 text-emerald-400" />
              <span>{isRTL ? '🟢 إضافة مستحق لك' : 'Add Receivable'}</span>
            </button>
            <button
              type="button"
              onClick={() => openAddDebtFor('debt')}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-red-600/30 border border-red-500/40 py-2.5 text-xs font-bold text-red-200 hover:bg-red-600/50"
            >
              <PlusCircle className="h-4 w-4 text-red-400" />
              <span>{isRTL ? '🔴 إضافة دين عليك' : 'Add Debt'}</span>
            </button>
          </div>

          {/* Debts list */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-white flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-purple-400" />
              <span>{isRTL ? 'سجل الديون والمستحقات' : 'Debts & Receivables'}</span>
            </h4>

            {selectedPersonRep.personDebts.length === 0 ? (
              <div className="rounded-2xl border border-purple-900/30 bg-[#14142d] p-8 text-center text-xs text-purple-300/60">
                {isRTL ? 'لا توجد ديون مسجلة لهذا الشخص' : 'No debts recorded'}
              </div>
            ) : (
              <div className="space-y-2">
                {selectedPersonRep.personDebts.map((d) => {
                  const paid = state.payments
                    .filter((p) => p.debtId === d.id)
                    .reduce((s, p) => s + Number(p.amount), 0);
                  const rem = Math.max(0, Number(d.amount) - paid);
                  const isCleared = rem <= 0.01;
                  const isReceivable = d.type === 'receivable';

                  return (
                    <div
                      key={d.id}
                      className={`rounded-2xl border p-3.5 transition-all ${
                        isCleared
                          ? 'border-purple-900/20 bg-[#121226]/50 opacity-60'
                          : 'border-purple-900/40 bg-[#14142d] hover:border-purple-700/60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`h-2.5 w-2.5 rounded-full ${
                                isReceivable ? 'bg-emerald-400' : 'bg-red-400'
                              }`}
                            />
                            <h5 className="text-xs font-extrabold text-white">{d.desc}</h5>
                            {isCleared && (
                              <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400">
                                {isRTL ? 'مسدد بالكامل' : 'Paid in Full'}
                              </span>
                            )}
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-[11px] text-purple-300/70">
                            <span>{new Date(d.date).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}</span>
                            <span>•</span>
                            <span>
                              {isRTL ? 'المتبقي:' : 'Left:'}{' '}
                              <strong className={isReceivable ? 'text-emerald-400' : 'text-red-400'}>
                                {formatCurrency(rem, cur)}
                              </strong>
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {!isCleared && (
                            <>
                              <button
                                type="button"
                                title={isRTL ? 'سداد كامل' : 'Settle full'}
                                onClick={() => settleDebtInFull(d)}
                                className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-emerald-500"
                              >
                                <CheckCircle2 className="h-3 w-3" />
                                <span>{isRTL ? 'سداد كامل' : 'Settle'}</span>
                              </button>
                              <button
                                type="button"
                                title={isRTL ? 'تسجيل دفعة جزئية' : 'Pay part'}
                                onClick={() => openPaymentForDebt(d)}
                                className="flex items-center gap-1 rounded-lg border border-purple-700 bg-purple-950/40 px-2 py-1 text-[10px] font-bold text-purple-300 hover:bg-purple-800"
                              >
                                <DollarSign className="h-3 w-3" />
                                <span>{isRTL ? 'دفعة' : 'Pay'}</span>
                              </button>
                            </>
                          )}
                          {/* Edit debt button */}
                          <button
                            type="button"
                            onClick={() => openEditDebtModal(d)}
                            className="p-1 text-purple-300 hover:text-white hover:bg-purple-900/40 rounded transition-colors"
                            title={isRTL ? 'تعديل السجل' : 'Edit record'}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setConfirmModal({
                                isOpen: true,
                                title: isRTL ? 'حذف سجل الدين / المستحق' : 'Delete Debt Record',
                                message: isRTL
                                  ? `هل أنت متأكد من حذف هذا السجل ("${d.desc}")؟`
                                  : `Are you sure you want to delete this record ("${d.desc}")?`,
                                onConfirm: () => onDeleteDebt(d.id),
                              });
                            }}
                            className="p-1 text-red-400 hover:text-white hover:bg-red-900/40 rounded transition-colors"
                            title={isRTL ? 'حذف السجل' : 'Delete record'}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Expandable Payments History */}
                      {(() => {
                        const debtPayments = state.payments.filter((p) => p.debtId === d.id);
                        if (debtPayments.length === 0) return null;
                        const isExpanded = !!expandedDebts[d.id];
                        return (
                          <div className="mt-3 border-t border-purple-900/30 pt-2">
                            <button
                              type="button"
                              onClick={() => toggleDebtPayments(d.id)}
                              className="flex items-center gap-1.5 text-[11px] font-bold text-purple-300 hover:text-white transition-colors"
                            >
                              {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                              <span>
                                {isRTL ? `سجل الدفعات المسددة (${debtPayments.length})` : `Payments History (${debtPayments.length})`}
                              </span>
                            </button>

                            {isExpanded && (
                              <div className="mt-2 space-y-1.5">
                                {debtPayments.map((pmt) => (
                                  <div
                                    key={pmt.id}
                                    className="flex items-center justify-between rounded-xl bg-[#1a1a3a] p-2 text-[11px] border border-purple-900/40"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="font-extrabold text-emerald-400">
                                        {formatCurrency(pmt.amount, cur)}
                                      </span>
                                      <span className="text-purple-400/50">•</span>
                                      <span className="text-purple-300/80">
                                        {new Date(pmt.date).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                                      </span>
                                      {pmt.notes && (
                                        <span className="text-purple-200/90 text-[10px] bg-purple-900/30 px-1.5 py-0.5 rounded">
                                          {pmt.notes}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      {/* Edit payment button */}
                                      <button
                                        type="button"
                                        onClick={() => openEditPaymentModal(pmt)}
                                        className="p-1 text-purple-300 hover:text-white hover:bg-purple-900/40 rounded transition-colors"
                                        title={isRTL ? 'تعديل الدفعة' : 'Edit payment'}
                                      >
                                        <Edit2 className="h-3 w-3" />
                                      </button>
                                      {/* Delete payment button */}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setConfirmModal({
                                            isOpen: true,
                                            title: isRTL ? 'حذف الدفعة' : 'Delete Payment',
                                            message: isRTL
                                              ? `هل أنت متأكد من حذف دفعة بقيمة ${formatCurrency(pmt.amount, cur)}؟`
                                              : `Are you sure you want to delete payment of ${formatCurrency(pmt.amount, cur)}?`,
                                            onConfirm: () => onDeletePayment(pmt.id),
                                          });
                                        }}
                                        className="p-1 text-red-400 hover:text-white hover:bg-red-900/40 rounded transition-colors"
                                        title={isRTL ? 'حذف الدفعة' : 'Delete payment'}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Overall People List View */
        <div className="space-y-5">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <Users className="h-6 w-6 text-purple-400" />
                <span>{isRTL ? 'حساباتي والديون والمستحقات' : 'Accounts & Debts'}</span>
              </h2>
              <p className="text-xs text-purple-300/70">
                {isRTL ? 'إدارة المعاملات المالية مع الأشخاص والجهات' : 'Manage balances with people and contacts'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Primary Action: Add Person */}
              <button
                type="button"
                onClick={openNewPersonModal}
                className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-purple-600/30 hover:bg-purple-500 active:scale-95 transition-all"
              >
                <UserPlus className="h-4 w-4" />
                <span>{isRTL ? 'إضافة شخص جديد' : 'Add Person'}</span>
              </button>

              {/* Options & Exports Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsOverallOptionsOpen((prev) => !prev)}
                  className="flex items-center justify-center p-2 rounded-xl border border-purple-800/40 bg-[#161633] text-purple-200 hover:bg-purple-800/40 hover:text-white transition-all shadow-sm active:scale-95"
                  title={isRTL ? 'خيارات وتصدير' : 'Options & Exports'}
                >
                  <MoreVertical className="h-4 w-4" />
                </button>

                {isOverallOptionsOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsOverallOptionsOpen(false)}
                    />
                    <div
                      className={`absolute ${isRTL ? 'left-0' : 'right-0'} mt-1.5 w-56 rounded-2xl border border-purple-800/50 bg-[#15152f] p-1.5 shadow-2xl z-50 animate-fadeIn`}
                    >
                      {/* Export Excel */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsOverallOptionsOpen(false);
                          exportService.exportPeopleToExcel(state, isRTL);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-green-300 hover:bg-green-950/40 rounded-xl transition-all"
                      >
                        <FileSpreadsheet className="h-4 w-4 text-green-400" />
                        <span>{isRTL ? 'تصدير كشف إكسل (XLSX)' : 'Export Excel (.xlsx)'}</span>
                      </button>

                      {/* Export PDF */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsOverallOptionsOpen(false);
                          const items = state.people.map((p) => {
                            const rep = getPersonReport(p.id);
                            return {
                              title: p.name,
                              subtitle: p.phone || p.email || (isRTL ? 'لا توجد بيانات اتصال' : 'No contact info'),
                              amount: formatCurrency(rep.net, cur),
                              extra: rep.statusText,
                            };
                          });
                          exportService.exportSectionReportPDF(
                            isRTL ? 'تقرير الحسابات والديون' : 'Debts & Accounts Report',
                            state,
                            items,
                            [
                              { label: isRTL ? 'إجمالي الديون عليك' : 'Total Debts You Owe', value: formatCurrency(summary.allDebts, cur) },
                              { label: isRTL ? 'إجمالي المستحقات لك' : 'Total Receivables', value: formatCurrency(summary.allReceivables, cur) },
                              { label: isRTL ? 'الصافي العام' : 'Net Total', value: formatCurrency(summary.net, cur) },
                            ],
                            isRTL
                          );
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-purple-200 hover:bg-purple-900/40 rounded-xl transition-all"
                      >
                        <FileText className="h-4 w-4 text-purple-400" />
                        <span>{isRTL ? 'تصدير تقرير PDF' : 'Export PDF'}</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Summary Row */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="rounded-2xl border border-red-500/20 bg-[#15152b] p-3 text-center">
              <span className="text-[10px] font-bold text-red-400 block">{isRTL ? '🔴 ديون عليك' : 'Debts You Owe'}</span>
              <span className="text-sm font-black text-red-400 mt-1 block">
                {formatCurrency(summary.allDebts, cur)}
              </span>
            </div>
            <div className="rounded-2xl border border-emerald-500/20 bg-[#15152b] p-3 text-center">
              <span className="text-[10px] font-bold text-emerald-400 block">{isRTL ? '🟢 مستحقات لك' : 'Receivables'}</span>
              <span className="text-sm font-black text-emerald-400 mt-1 block">
                {formatCurrency(summary.allReceivables, cur)}
              </span>
            </div>
            <div className="rounded-2xl border border-purple-500/20 bg-[#15152b] p-3 text-center">
              <span className="text-[10px] font-bold text-purple-300 block">{isRTL ? '📊 الصافي' : 'Net Total'}</span>
              <span
                className={`text-sm font-black mt-1 block ${
                  summary.net >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {summary.net >= 0 ? '+' : ''}
                {formatCurrency(summary.net, cur)}
              </span>
            </div>
          </div>

          {/* People cards list */}
          {state.people.length === 0 ? (
            <div className="rounded-2xl border border-purple-900/30 bg-[#14142d] p-12 text-center text-xs text-purple-300/60">
              <Users className="mx-auto h-8 w-8 text-purple-500/40 mb-2" />
              <p>{isRTL ? 'لا يوجد أشخاص مضافون بعد' : 'No people added yet'}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {state.people.map((p) => {
                const rep = getPersonReport(p.id);
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPersonId(p.id)}
                    className="flex items-center justify-between rounded-2xl border border-purple-900/30 bg-[#14142d] p-3.5 transition-all hover:border-purple-600/60 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-900/40 text-purple-300 border border-purple-800/40">
                        <Users className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-white">{p.name}</h4>
                        <p className={`text-[11px] font-bold ${rep.statusColor}`}>
                          {rep.statusText}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <div className="text-right hidden sm:block">
                        <span className="text-[10px] text-purple-300/60 block">
                          {rep.personDebts.length} {isRTL ? 'معاملات' : 'items'}
                        </span>
                      </div>
                      {/* Edit member button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditPersonModal(p);
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-xl border border-purple-800/40 bg-purple-950/30 text-purple-300 hover:text-white hover:bg-purple-800/40 transition-colors"
                        title={isRTL ? 'تعديل بيانات العضو' : 'Edit member'}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      {/* Delete member button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmModal({
                            isOpen: true,
                            title: isRTL ? 'حذف العضو والحساب' : 'Delete Member',
                            message: isRTL
                              ? `هل أنت متأكد من حذف "${p.name}"؟ سيتم حذف جميع المعاملات والديون المرتبطة به نهائياً.`
                              : `Are you sure you want to delete "${p.name}"? All associated debts will be deleted.`,
                            onConfirm: () => onDeletePerson(p.id),
                          });
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-xl border border-red-900/40 bg-red-950/30 text-red-400 hover:text-white hover:bg-red-800/40 transition-colors"
                        title={isRTL ? 'حذف العضو' : 'Delete member'}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-900/30 text-purple-300">
                        {isRTL ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Person Modal */}
      {isPersonModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-purple-500/30 bg-[#15152f] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-purple-900/40 pb-3 mb-4">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-purple-400" />
                <span>
                  {editingPerson
                    ? isRTL ? 'تعديل بيانات الشخص' : 'Edit Person'
                    : isRTL ? 'إضافة شخص جديد' : 'Add Person'}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setIsPersonModalOpen(false)}
                className="text-purple-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSavePersonSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-purple-300 block mb-1">{isRTL ? 'الاسم *' : 'Name *'}</label>
                <input
                  type="text"
                  required
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  placeholder={isRTL ? 'مثال: محمد علي' : 'e.g. John Doe'}
                  className="w-full rounded-xl border border-purple-900/50 bg-[#1c1c3c] p-2.5 text-xs font-bold text-white outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-purple-300 block mb-1">{isRTL ? 'رقم الهاتف' : 'Phone'}</label>
                <input
                  type="tel"
                  value={personPhone}
                  onChange={(e) => setPersonPhone(e.target.value)}
                  placeholder="+96650..."
                  className="w-full rounded-xl border border-purple-900/50 bg-[#1c1c3c] p-2.5 text-xs text-white outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-purple-300 block mb-1">{isRTL ? 'البريد الإلكتروني' : 'Email'}</label>
                <input
                  type="email"
                  value={personEmail}
                  onChange={(e) => setPersonEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-xl border border-purple-900/50 bg-[#1c1c3c] p-2.5 text-xs text-white outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-purple-300 block mb-1">{isRTL ? 'ملاحظات' : 'Notes'}</label>
                <textarea
                  rows={2}
                  value={personNotes}
                  onChange={(e) => setPersonNotes(e.target.value)}
                  placeholder={isRTL ? 'معلومات إضافية أو طبيعة التعامل...' : 'Notes...'}
                  className="w-full rounded-xl border border-purple-900/50 bg-[#1c1c3c] p-2.5 text-xs text-white outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex gap-2 pt-2 items-center">
                {editingPerson && (
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmModal({
                        isOpen: true,
                        title: isRTL ? 'حذف العضو والحساب' : 'Delete Member',
                        message: isRTL
                          ? `هل أنت متأكد من حذف "${editingPerson.name}"؟ سيتم حذف جميع المعاملات والديون المرتبطة به نهائياً.`
                          : `Are you sure you want to delete "${editingPerson.name}"?`,
                        onConfirm: () => {
                          onDeletePerson(editingPerson.id);
                          setIsPersonModalOpen(false);
                          setSelectedPersonId(null);
                        },
                      });
                    }}
                    className="rounded-xl border border-red-900/40 bg-red-950/30 px-3 py-2.5 text-xs font-bold text-red-400 hover:bg-red-900/40 hover:text-white transition-colors flex items-center gap-1"
                    title={isRTL ? 'حذف العضو' : 'Delete member'}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>{isRTL ? 'حذف' : 'Delete'}</span>
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-purple-600 py-2.5 text-xs font-bold text-white shadow-md hover:bg-purple-500 transition-colors"
                >
                  {isRTL ? 'حفظ الشخص' : 'Save Person'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsPersonModalOpen(false)}
                  className="rounded-xl border border-purple-900/50 bg-[#1c1c3c] px-4 py-2.5 text-xs font-bold text-purple-300 hover:text-white"
                >
                  {isRTL ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Debt Modal */}
      {isDebtModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-purple-500/30 bg-[#15152f] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-purple-900/40 pb-3 mb-4">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <PlusCircle className="h-5 w-5 text-purple-400" />
                <span>
                  {debtType === 'debt'
                    ? isRTL ? 'تسجيل دين عليك' : 'Add Debt'
                    : isRTL ? 'تسجيل مستحق لك' : 'Add Receivable'}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setIsDebtModalOpen(false)}
                className="text-purple-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDebtSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-purple-300 block mb-1">{isRTL ? 'المبلغ *' : 'Amount *'}</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={debtAmount}
                    onChange={(e) => setDebtAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-xl border border-purple-900/50 bg-[#1c1c3c] p-2.5 text-base font-bold text-white outline-none focus:border-purple-500"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-purple-400">
                    {cur}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-purple-300 block mb-1">{isRTL ? 'البيان / الوصف' : 'Description'}</label>
                <input
                  type="text"
                  value={debtDesc}
                  onChange={(e) => setDebtDesc(e.target.value)}
                  placeholder={isRTL ? 'مثال: سلفة نقدية، فاتورة...' : 'Notes...'}
                  className="w-full rounded-xl border border-purple-900/50 bg-[#1c1c3c] p-2.5 text-xs text-white outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-purple-600 py-2.5 text-xs font-bold text-white shadow-md hover:bg-purple-500"
                >
                  {isRTL ? 'حفظ' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsDebtModalOpen(false)}
                  className="rounded-xl border border-purple-900/50 bg-[#1c1c3c] px-4 py-2.5 text-xs font-bold text-purple-300"
                >
                  {isRTL ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-purple-500/30 bg-[#15152f] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-purple-900/40 pb-3 mb-4">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-purple-400" />
                <span>{isRTL ? 'تسجيل دفعة أو سداد' : 'Record Payment'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-purple-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSavePaymentSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-purple-300 block mb-1">{isRTL ? 'مبلغ الدفعة *' : 'Payment Amount *'}</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-xl border border-purple-900/50 bg-[#1c1c3c] p-2.5 text-base font-bold text-white outline-none focus:border-purple-500"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-purple-400">
                    {cur}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-purple-300 block mb-1">{isRTL ? 'طريقة الدفع' : 'Payment Method'}</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full rounded-xl border border-purple-900/50 bg-[#1c1c3c] p-2.5 text-xs font-bold text-white outline-none focus:border-purple-500"
                >
                  <option value="cash">💵 {isRTL ? 'نقداً (كاش)' : 'Cash'}</option>
                  <option value="bank">🏦 {isRTL ? 'تحويل بنكي' : 'Bank Transfer'}</option>
                  <option value="card">💳 {isRTL ? 'بطاقة بنكية' : 'Card'}</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-purple-300 block mb-1">{isRTL ? 'ملاحظات الدفعة' : 'Notes'}</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder={isRTL ? 'ملاحظات حول الدفعة...' : 'Notes...'}
                  className="w-full rounded-xl border border-purple-900/50 bg-[#1c1c3c] p-2.5 text-xs text-white outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-purple-600 py-2.5 text-xs font-bold text-white shadow-md hover:bg-purple-500"
                >
                  {isRTL ? 'تسجيل الدفعة' : 'Save Payment'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="rounded-xl border border-purple-900/50 bg-[#1c1c3c] px-4 py-2.5 text-xs font-bold text-purple-300"
                >
                  {isRTL ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        cancelText={confirmModal.cancelText}
        isDanger={confirmModal.isDanger}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        language={language}
      />
    </div>
  );
};
