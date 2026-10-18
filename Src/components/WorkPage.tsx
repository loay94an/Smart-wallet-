import React, { useState, useEffect, useRef } from 'react';
import {
  AppState,
  Work,
  WorkLog,
  WorkPayment,
  WorkGoal,
  WorkStatus,
} from '../types';
import { formatCurrency } from '../services/i18n';
import { ConfirmModal } from './ConfirmModal';
import { exportService } from '../services/exportService';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  Briefcase,
  Play,
  Pause,
  Square,
  Plus,
  Clock,
  Package,
  DollarSign,
  TrendingUp,
  FileText,
  FileSpreadsheet,
  Trash2,
  Edit2,
  Calendar,
  X,
  Eye,
  EyeOff,
  Image,
  Award,
  Zap,
  ChevronDown,
  MoreVertical,
  Download,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface WorkPageProps {
  state: AppState;
  onSaveWork: (work: Work) => void;
  onDeleteWork: (id: string) => void;
  onSaveWorkLog: (log: WorkLog) => void;
  onDeleteWorkLog: (id: string) => void;
  onSaveWorkPayment: (payment: WorkPayment) => void;
  onDeleteWorkPayment: (id: string) => void;
  onSaveWorkGoal: (goal: WorkGoal) => void;
  onDeleteWorkGoal: (id: string) => void;
  language: 'ar' | 'en';
}

export const WorkPage: React.FC<WorkPageProps> = ({
  state,
  onSaveWork,
  onDeleteWork,
  onSaveWorkLog,
  onDeleteWorkLog,
  onSaveWorkPayment,
  onDeleteWorkPayment,
  onSaveWorkGoal,
  onDeleteWorkGoal,
  language,
}) => {
  const isRTL = language === 'ar';
  const cur = state.settings.currency || 'ر.س';

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

  // Selected active work
  const [selectedWorkId, setSelectedWorkId] = useState<string>(
    state.works[0]?.id || ''
  );

  useEffect(() => {
    if (!selectedWorkId && state.works.length > 0) {
      setSelectedWorkId(state.works[0].id);
    }
  }, [state.works, selectedWorkId]);

  const activeWork = state.works.find((w) => w.id === selectedWorkId);

  // Toggle details view
  const [showDetails, setShowDetails] = useState<boolean>(true);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState<boolean>(false);
  const [isProjectMenuOpen, setIsProjectMenuOpen] = useState<boolean>(false);

  // Smart Timers State (per workId) - allows simultaneous running timers with localStorage persistence
  const [workTimers, setWorkTimers] = useState<
    Record<string, { seconds: number; isRunning: boolean; pieces: number; startTime: Date | null }>
  >(() => {
    try {
      const saved = localStorage.getItem('smart_work_timers_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        const result: Record<string, { seconds: number; isRunning: boolean; pieces: number; startTime: Date | null }> = {};
        for (const [k, v] of Object.entries(parsed)) {
          const val = v as any;
          result[k] = {
            seconds: Number(val.seconds) || 0,
            isRunning: Boolean(val.isRunning),
            pieces: Number(val.pieces) || 0,
            startTime: val.startTime ? new Date(val.startTime) : null,
          };
        }
        return result;
      }
    } catch (e) {
      console.error('Failed to restore work timers:', e);
    }
    return {};
  });

  // Custom pieces input state
  const [customPiecesInput, setCustomPiecesInput] = useState<string>('');

  // Persist workTimers to localStorage on changes
  useEffect(() => {
    try {
      const serialized: Record<string, any> = {};
      for (const [k, v] of Object.entries(workTimers)) {
        serialized[k] = {
          ...v,
          startTime: v.startTime ? (v.startTime instanceof Date ? v.startTime.toISOString() : v.startTime) : null,
        };
      }
      localStorage.setItem('smart_work_timers_state', JSON.stringify(serialized));
    } catch (e) {
      console.error('Failed to save timers to storage:', e);
    }
  }, [workTimers]);

  useEffect(() => {
    const interval = setInterval(() => {
      setWorkTimers((prev) => {
        let hasRunning = false;
        const updated = { ...prev };
        for (const workId of Object.keys(updated)) {
          if (updated[workId]?.isRunning) {
            hasRunning = true;
            updated[workId] = {
              ...updated[workId],
              seconds: updated[workId].seconds + 1,
            };
          }
        }
        return hasRunning ? updated : prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const getTimerFor = (workId: string) =>
    workTimers[workId] || { seconds: 0, isRunning: false, pieces: 0, startTime: null };

  const currentTimer = activeWork ? getTimerFor(activeWork.id) : { seconds: 0, isRunning: false, pieces: 0, startTime: null };

  const startTimer = (workId: string) => {
    setWorkTimers((prev) => {
      const current = prev[workId] || { seconds: 0, isRunning: false, pieces: 0, startTime: null };
      return {
        ...prev,
        [workId]: {
          ...current,
          isRunning: true,
          startTime: current.startTime || new Date(),
        },
      };
    });
  };

  const pauseTimer = (workId: string) => {
    setWorkTimers((prev) => {
      const current = prev[workId];
      if (!current) return prev;
      return {
        ...prev,
        [workId]: {
          ...current,
          isRunning: false,
        },
      };
    });
  };

  const addPieces = (workId: string, amount: number) => {
    if (isNaN(amount) || amount <= 0) return;
    setWorkTimers((prev) => {
      const current = prev[workId] || { seconds: 0, isRunning: false, pieces: 0, startTime: null };
      return {
        ...prev,
        [workId]: {
          ...current,
          pieces: Math.max(0, current.pieces + amount),
        },
      };
    });
  };

  const incrementPieces = (workId: string) => {
    addPieces(workId, 1);
  };

  const resetPieces = (workId: string, workName: string) => {
    setConfirmModal({
      isOpen: true,
      title: isRTL ? 'تصفير عداد القطع' : 'Reset Pieces Counter',
      message: isRTL
        ? `هل أنت متأكد من رغبتك في تصفير عداد القطع لمشروع "${workName}" لهذه الجلسة؟`
        : `Are you sure you want to reset the pieces counter for "${workName}" in this session?`,
      confirmText: isRTL ? 'تصفير العداد' : 'Reset Counter',
      isDanger: true,
      onConfirm: () => {
        setWorkTimers((prev) => {
          const current = prev[workId] || { seconds: 0, isRunning: false, pieces: 0, startTime: null };
          return {
            ...prev,
            [workId]: {
              ...current,
              pieces: 0,
            },
          };
        });
      },
    });
  };

  const handleCustomPiecesSubmit = () => {
    if (!activeWork) return;
    const num = parseFloat(customPiecesInput);
    if (!isNaN(num) && num > 0) {
      addPieces(activeWork.id, num);
      setCustomPiecesInput('');
    }
  };

  const stopAndSaveTimer = (workId: string, work: Work) => {
    const current = workTimers[workId];
    if (!current) return;

    const hours = (current.seconds / 3600).toFixed(2);
    const hoursNum = parseFloat(hours);

    const log: WorkLog = {
      id: 'wl_' + Date.now().toString(36),
      workId: workId,
      date: new Date().toISOString().slice(0, 10),
      start: current.startTime ? current.startTime.toTimeString().slice(0, 5) : '',
      end: new Date().toTimeString().slice(0, 5),
      hours: hoursNum,
      quantity: current.pieces,
      desc:
        work.calculationType === 'piece'
          ? isRTL
            ? `إنجاز ${current.pieces} ${work.unitName} خلال ${hours} ساعة`
            : `Completed ${current.pieces} ${work.unitName} in ${hours} hrs`
          : isRTL
          ? `جلسة عمل مؤقت ذكي (${hours} ساعة)`
          : `Timer session (${hours} hrs)`,
    };

    onSaveWorkLog(log);

    // Reset this work's timer
    setWorkTimers((prev) => ({
      ...prev,
      [workId]: { seconds: 0, isRunning: false, pieces: 0, startTime: null },
    }));
  };

  // Modals & Editing States
  const [isWorkModalOpen, setIsWorkModalOpen] = useState<boolean>(false);
  const [editingWork, setEditingWork] = useState<Work | null>(null);
  const [workName, setWorkName] = useState<string>('');
  const [workClient, setWorkClient] = useState<string>('');
  const [workCalcType, setWorkCalcType] = useState<'hourly' | 'piece'>('hourly');
  const [workRate, setWorkRate] = useState<string>('');
  const [workUnitName, setWorkUnitName] = useState<string>('ساعة');
  const [workStatus, setWorkStatus] = useState<WorkStatus>('active');

  const openNewWorkModal = () => {
    setEditingWork(null);
    setWorkName('');
    setWorkClient('');
    setWorkCalcType('hourly');
    setWorkRate('');
    setWorkUnitName('ساعة');
    setWorkStatus('active');
    setIsWorkModalOpen(true);
  };

  const openEditWorkModal = (w: Work) => {
    setEditingWork(w);
    setWorkName(w.name);
    setWorkClient(w.client || '');
    setWorkCalcType(w.calculationType);
    setWorkRate(w.rate.toString());
    setWorkUnitName(w.unitName || (w.calculationType === 'piece' ? 'قطعة' : 'ساعة'));
    setWorkStatus(w.status);
    setIsWorkModalOpen(true);
  };

  const [isLogModalOpen, setIsLogModalOpen] = useState<boolean>(false);
  const [editingLog, setEditingLog] = useState<WorkLog | null>(null);
  const [logHours, setLogHours] = useState<string>('');
  const [logQuantity, setLogQuantity] = useState<string>('');
  const [logDesc, setLogDesc] = useState<string>('');
  const [logDate, setLogDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [logStart, setLogStart] = useState<string>('');
  const [logEnd, setLogEnd] = useState<string>('');

  const openNewLogModal = () => {
    setEditingLog(null);
    setLogHours('');
    setLogQuantity('');
    setLogDesc('');
    setLogDate(new Date().toISOString().slice(0, 10));
    setLogStart('');
    setLogEnd('');
    setIsLogModalOpen(true);
  };

  const openEditLogModal = (log: WorkLog) => {
    setEditingLog(log);
    setLogHours(log.hours != null ? log.hours.toString() : '');
    setLogQuantity(log.quantity != null ? log.quantity.toString() : '');
    setLogDesc(log.desc || '');
    setLogDate(log.date || new Date().toISOString().slice(0, 10));
    setLogStart(log.start || '');
    setLogEnd(log.end || '');
    setIsLogModalOpen(true);
  };

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [editingPayment, setEditingPayment] = useState<WorkPayment | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentType, setPaymentType] = useState<'salary' | 'payment' | 'bonus'>('payment');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank' | 'card'>('bank');
  const [paymentDesc, setPaymentDesc] = useState<string>('');

  const openNewPaymentModal = () => {
    setEditingPayment(null);
    setPaymentAmount('');
    setPaymentType('payment');
    setPaymentMethod('bank');
    setPaymentDesc('');
    setIsPaymentModalOpen(true);
  };

  const openEditPaymentModal = (pmt: WorkPayment) => {
    setEditingPayment(pmt);
    setPaymentAmount(pmt.amount.toString());
    setPaymentType(pmt.type);
    setPaymentMethod(pmt.method);
    setPaymentDesc(pmt.desc || '');
    setIsPaymentModalOpen(true);
  };

  const [isGoalModalOpen, setIsGoalModalOpen] = useState<boolean>(false);
  const [editingGoal, setEditingGoal] = useState<WorkGoal | null>(null);
  const [goalTarget, setGoalTarget] = useState<string>('');
  const [goalType, setGoalType] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [historyTab, setHistoryTab] = useState<'logs' | 'payments'>('logs');

  const openNewGoalModal = () => {
    setEditingGoal(null);
    setGoalTarget('');
    setGoalType('weekly');
    setIsGoalModalOpen(true);
  };

  const openEditGoalModal = (g: WorkGoal) => {
    setEditingGoal(g);
    setGoalTarget(g.target.toString());
    setGoalType(g.type);
    setIsGoalModalOpen(true);
  };

  // Calculations for active work
  const activeLogs = activeWork
    ? state.workLogs.filter((l) => l.workId === activeWork.id)
    : [];
  const activePayments = activeWork
    ? state.workPayments.filter((p) => p.workId === activeWork.id)
    : [];
  const activeGoals = activeWork
    ? state.workGoals.filter((g) => g.workId === activeWork.id)
    : [];

  const isPiece = activeWork?.calculationType === 'piece';
  const unitLabel = activeWork?.unitName || (isPiece ? (isRTL ? 'قطعة' : 'piece') : (isRTL ? 'ساعة' : 'hr'));

  const totalQuantityOrHours = activeLogs.reduce(
    (s, l) => s + (isPiece ? Number(l.quantity || 0) : Number(l.hours || 0)),
    0
  );
  const totalHoursWorked = activeLogs.reduce((s, l) => s + Number(l.hours || 0), 0);
  const totalGrossEarned = totalQuantityOrHours * (activeWork ? Number(activeWork.rate) : 0);
  const totalReceived = activePayments.reduce((s, p) => s + Number(p.amount), 0);
  const netDueRemaining = totalGrossEarned - totalReceived;
  const remainingWorkUnits = activeWork && activeWork.rate > 0 ? netDueRemaining / activeWork.rate : 0;

  // Productivity metrics
  const avgPiecesPerHour = totalHoursWorked > 0 && isPiece ? totalQuantityOrHours / totalHoursWorked : 0;
  const actualHourlyRate = totalHoursWorked > 0 ? totalGrossEarned / totalHoursWorked : 0;

  const handleSaveWorkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rateNum = parseFloat(workRate);
    if (isNaN(rateNum) || rateNum <= 0) return;

    const workData: Work = {
      id: editingWork ? editingWork.id : 'w_' + Date.now().toString(36),
      name: workName.trim(),
      client: workClient.trim(),
      calculationType: workCalcType,
      rate: rateNum,
      unitName: workCalcType === 'piece' ? workUnitName.trim() || 'قطعة' : 'ساعة',
      status: workStatus,
      startDate: editingWork?.startDate || new Date().toISOString().slice(0, 10),
    };

    onSaveWork(workData);
    setSelectedWorkId(workData.id);
    setIsWorkModalOpen(false);
  };

  const handleSaveLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWork) return;

    const hoursNum = parseFloat(logHours) || 0;
    const qtyNum = parseInt(logQuantity, 10) || 0;

    const log: WorkLog = {
      id: editingLog ? editingLog.id : 'wl_' + Date.now().toString(36),
      workId: editingLog ? editingLog.workId : activeWork.id,
      date: logDate,
      start: logStart || undefined,
      end: logEnd || undefined,
      hours: hoursNum,
      quantity: qtyNum,
      desc: logDesc.trim() || (isRTL ? 'إنجاز عمل' : 'Work record'),
    };

    onSaveWorkLog(log);
    setLogHours('');
    setLogQuantity('');
    setLogDesc('');
    setLogStart('');
    setLogEnd('');
    setIsLogModalOpen(false);
  };

  const handleSavePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWork) return;
    const amtNum = parseFloat(paymentAmount);
    if (isNaN(amtNum) || amtNum <= 0) return;

    const pmt: WorkPayment = {
      id: editingPayment ? editingPayment.id : 'wp_' + Date.now().toString(36),
      workId: editingPayment ? editingPayment.workId : activeWork.id,
      type: paymentType,
      amount: amtNum,
      date: editingPayment?.date || new Date().toISOString(),
      method: paymentMethod,
      desc: paymentDesc.trim() || (isRTL ? `دفعة عمل - ${activeWork.name}` : `Payment - ${activeWork.name}`),
    };

    onSaveWorkPayment(pmt);
    setPaymentAmount('');
    setPaymentDesc('');
    setIsPaymentModalOpen(false);
  };

  const handleSaveGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWork) return;
    const targetNum = parseInt(goalTarget, 10);
    if (isNaN(targetNum) || targetNum <= 0) return;

    const g: WorkGoal = {
      id: editingGoal ? editingGoal.id : 'wg_' + Date.now().toString(36),
      workId: editingGoal ? editingGoal.workId : activeWork.id,
      type: goalType,
      target: targetNum,
    };

    onSaveWorkGoal(g);
    setGoalTarget('');
    setIsGoalModalOpen(false);
  };

  // Export report to PDF
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExportingPDF, setIsExportingPDF] = useState<boolean>(false);

  const exportPDF = async () => {
    if (!activeWork || !reportRef.current) return;
    setIsExportingPDF(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#0f0f23',
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`work-report-${activeWork.name}-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (e) {
      console.error('PDF export error:', e);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const exportPNG = async () => {
    if (!activeWork || !reportRef.current) return;
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#0f0f23',
      });
      const link = document.createElement('a');
      link.download = `work-summary-${activeWork.name}.png`;
      link.href = canvas.toDataURL('image/png');
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error('PNG export error:', e);
    }
  };

  const formatTimer = (totalSec: number) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-5 pb-20 pt-2">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-purple-400" />
            <span>{isRTL ? 'إدارة الأعمال والمشاريع' : 'Work & Projects'}</span>
          </h2>
          <p className="text-xs text-purple-300/70">
            {isRTL ? 'حساب بالساعة أو بالقطعة، مؤقت ذكي، وسجل الدفعات' : 'Hourly/piece rates, timer and salary logs'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* New Project (Primary Action) */}
          <button
            type="button"
            onClick={openNewWorkModal}
            className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-purple-600/30 hover:bg-purple-500 active:scale-95 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>{isRTL ? 'مشروع جديد' : 'New Project'}</span>
          </button>

          {/* Options & Export Dropdown Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsExportMenuOpen((prev) => !prev)}
              className="flex items-center justify-center p-2 rounded-xl border border-purple-800/40 bg-[#161633] text-purple-200 hover:bg-purple-800/40 hover:text-white transition-all shadow-sm active:scale-95"
              title={isRTL ? 'خيارات وتصدير' : 'Options & Exports'}
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {isExportMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsExportMenuOpen(false)}
                />
                <div
                  className={`absolute ${isRTL ? 'left-0' : 'right-0'} mt-1.5 w-52 rounded-2xl border border-purple-800/50 bg-[#15152f] p-1.5 shadow-2xl z-50 animate-fadeIn`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      exportService.exportWorkToExcel(state, isRTL);
                      setIsExportMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-green-300 hover:bg-green-950/40 rounded-xl transition-all"
                  >
                    <FileSpreadsheet className="h-4 w-4 text-green-400" />
                    <span>{isRTL ? 'تصدير كشف Excel' : 'Export Excel (.xlsx)'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      exportPDF();
                      setIsExportMenuOpen(false);
                    }}
                    disabled={isExportingPDF}
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

      {/* Active Multi-Timers Summary Bar (shows when any timers are running concurrently) */}
      {(() => {
        const running = state.works.filter((w) => workTimers[w.id]?.isRunning);
        if (running.length === 0) return null;
        return (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-3 shadow-lg animate-fadeIn">
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-2 text-xs font-black text-emerald-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>
                  {isRTL
                    ? `المؤقتات النشطة المتزامنة (${running.length} ${running.length > 1 ? 'مشاريع تعمل معاً' : 'مشروع يعمل'})`
                    : `Simultaneous Active Timers (${running.length} running)`}
                </span>
              </span>
              <span className="text-[10px] text-emerald-300/70 font-bold">
                {isRTL ? 'تعمل في الخلفية معاً' : 'Running concurrently'}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {running.map((w) => {
                const t = workTimers[w.id];
                const isCurrent = w.id === selectedWorkId;
                return (
                  <div
                    key={w.id}
                    onClick={() => setSelectedWorkId(w.id)}
                    className={`flex items-center gap-2 rounded-xl px-2.5 py-1 text-xs font-bold transition-all cursor-pointer border ${
                      isCurrent
                        ? 'border-emerald-400 bg-emerald-600/30 text-white shadow-sm'
                        : 'border-emerald-800/40 bg-[#161f30] text-emerald-300 hover:border-emerald-600'
                    }`}
                  >
                    <span>{w.name}:</span>
                    <span className="font-mono font-black text-emerald-400">{formatTimer(t?.seconds || 0)}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        pauseTimer(w.id);
                      }}
                      title={isRTL ? 'إيقاف مؤقت' : 'Pause'}
                      className="p-1 text-amber-300 hover:text-white rounded hover:bg-amber-500/20"
                    >
                      <Pause className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        stopAndSaveTimer(w.id, w);
                      }}
                      title={isRTL ? 'إنهاء وحفظ' : 'Stop & Save'}
                      className="p-1 text-red-400 hover:text-white rounded hover:bg-red-500/20"
                    >
                      <Square className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Work Tabs */}
      {state.works.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {state.works.map((w) => {
            const isSelected = w.id === selectedWorkId;
            const wTimer = workTimers[w.id];
            const isThisRunning = wTimer?.isRunning;
            return (
              <div
                key={w.id}
                className={`flex items-center gap-2 rounded-2xl border px-3.5 py-2 transition-all cursor-pointer whitespace-nowrap text-xs font-bold ${
                  isSelected
                    ? 'border-purple-500 bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                    : 'border-purple-900/40 bg-[#161633] text-purple-300 hover:border-purple-700/60'
                }`}
                onClick={() => setSelectedWorkId(w.id)}
              >
                <span>{w.calculationType === 'piece' ? '📦' : '⏱️'}</span>
                <span>{w.name}</span>

                {/* Running timer indicator badge */}
                {isThisRunning && (
                  <span className="flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.5 rounded-full text-[10px] animate-pulse">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                    <span>{formatTimer(wTimer.seconds)}</span>
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Active Work Panel */}
      {activeWork ? (
        <div className="space-y-5" ref={reportRef}>
          {/* Smart Timer Component */}
          {(() => {
            const hourlyLiveEarnings = (currentTimer.seconds / 3600) * Number(activeWork.rate);
            const pieceLiveEarnings = currentTimer.pieces * Number(activeWork.rate);

            return (
              <div className="rounded-3xl border border-purple-500/30 bg-gradient-to-br from-purple-950/70 via-[#181135] to-[#121228] p-5 shadow-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-purple-400" />
                    <span className="text-xs font-black text-white">
                      {isRTL ? 'المؤقت الذكي وجلسات الإنجاز (مستقل لكل مشروع)' : 'Smart Timer & Session (Independent)'}
                    </span>
                  </div>
                  <span className="rounded-full bg-purple-900/40 px-2 py-0.5 text-[10px] font-bold text-purple-300 border border-purple-700/30">
                    {activeWork.name}
                  </span>
                </div>

                <div className="text-center my-3">
                  <div className="font-mono text-4xl sm:text-5xl font-black tracking-widest text-white drop-shadow-md">
                    {formatTimer(currentTimer.seconds)}
                  </div>
                  <div className="mt-1 text-[11px] text-purple-300/70">
                    {new Date().toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                </div>

                {/* Piece counter section if piece rate */}
                {isPiece && (
                  <div className="my-3 space-y-3 rounded-2xl border border-purple-800/40 bg-[#16122e]/90 p-3.5 sm:p-4 shadow-inner">
                    {/* 1. Custom input & Smart Add Button (+) */}
                    <div>
                      <label className="block text-[11px] font-bold text-purple-200 mb-1.5">
                        {isRTL
                          ? `تسجيل كمية منجزة دفعة واحدة (${activeWork.unitName}):`
                          : `Log completed batch quantity (${activeWork.unitName}):`}
                      </label>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleCustomPiecesSubmit();
                        }}
                        className="flex items-center gap-2"
                      >
                        <div className="relative flex-1">
                          <input
                            type="number"
                            min="1"
                            step="any"
                            value={customPiecesInput}
                            onChange={(e) => setCustomPiecesInput(e.target.value)}
                            placeholder={isRTL ? `اكتب الكمية (مثلاً: 15)...` : `Enter quantity (e.g. 15)...`}
                            className="w-full rounded-xl border border-purple-800/60 bg-[#0f0e24] px-3.5 py-2 text-xs text-white placeholder-purple-400/50 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={!customPiecesInput.trim() || parseFloat(customPiecesInput) <= 0}
                          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-xs font-black text-white shadow-md shadow-purple-600/30 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
                        >
                          <Plus className="h-4 w-4" />
                          <span>{isRTL ? 'إضافة' : 'Add'}</span>
                        </button>
                      </form>
                    </div>

                    {/* 2. Quick Addition Pills & Reset Button (🔄) */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-purple-900/40">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold text-purple-300/70 me-1">
                          {isRTL ? 'إضافة سريعة:' : 'Quick Add:'}
                        </span>
                        {[1, 5, 10, 25].map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => addPieces(activeWork.id, amt)}
                            className="rounded-xl border border-purple-700/50 bg-[#1e1b3d] px-2.5 py-1 text-xs font-black text-purple-200 hover:bg-purple-600 hover:text-white active:scale-95 transition-all shadow-sm"
                          >
                            +{amt}
                          </button>
                        ))}
                      </div>

                      {/* Reset Pieces Button (🔄) */}
                      <button
                        type="button"
                        onClick={() => resetPieces(activeWork.id, activeWork.name)}
                        disabled={currentTimer.pieces === 0}
                        className="flex items-center gap-1 rounded-xl border border-red-900/50 bg-red-950/40 px-2.5 py-1 text-xs font-bold text-red-300 hover:bg-red-900/60 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
                        title={isRTL ? 'تصفير عداد القطع للجلسة' : 'Reset session pieces'}
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>{isRTL ? 'تصفير' : 'Reset'}</span>
                      </button>
                    </div>

                    {/* 3. Dual Info Panel (المجموع + الأرباح) */}
                    <div className="grid grid-cols-2 gap-2.5 pt-1">
                      {/* Total Pieces Panel */}
                      <div className="rounded-2xl border border-purple-800/40 bg-[#120f29] p-3 text-center shadow-inner">
                        <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-purple-300">
                          <span>📊</span>
                          <span>{isRTL ? 'المجموع' : 'Total'}</span>
                        </div>
                        <div className="mt-1 font-mono text-2xl font-black text-white">
                          {currentTimer.pieces}
                        </div>
                        <div className="text-[10px] text-purple-400/80">
                          {activeWork.unitName}
                        </div>
                      </div>

                      {/* Live Earnings Panel */}
                      <div className="rounded-2xl border border-emerald-500/50 bg-gradient-to-br from-emerald-950/70 to-[#0e2319] p-3 text-center shadow-md animate-earnings-glow">
                        <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-emerald-300">
                          <span>💰</span>
                          <span>{isRTL ? 'الأرباح' : 'Earnings'}</span>
                        </div>
                        <div className="mt-1 font-mono text-2xl font-black text-emerald-400 drop-shadow-sm">
                          +{formatCurrency(pieceLiveEarnings, cur)}
                        </div>
                        <div className="text-[10px] text-emerald-300/70">
                          {currentTimer.pieces} × {formatCurrency(activeWork.rate, cur)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Timer Controls (Start / Pause / Stop & Save) */}
                <div className="flex items-center justify-center gap-2 pt-2">
                  {!currentTimer.isRunning ? (
                    <button
                      type="button"
                      onClick={() => startTimer(activeWork.id)}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 active:scale-95"
                    >
                      <Play className="h-4 w-4 fill-white" />
                      <span>{isRTL ? 'بدء المؤقت' : 'Start Timer'}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => pauseTimer(activeWork.id)}
                      className="flex items-center gap-1.5 rounded-xl bg-amber-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-amber-600/30 hover:bg-amber-500 active:scale-95"
                    >
                      <Pause className="h-4 w-4 fill-white" />
                      <span>{isRTL ? 'إيقاف مؤقت' : 'Pause'}</span>
                    </button>
                  )}

                  {(currentTimer.seconds > 0 || currentTimer.pieces > 0) && (
                    <button
                      type="button"
                      onClick={() => stopAndSaveTimer(activeWork.id, activeWork)}
                      className="flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-red-600/30 hover:bg-red-500 active:scale-95"
                    >
                      <Square className="h-4 w-4 fill-white" />
                      <span>{isRTL ? 'إنهاء وحفظ' : 'Stop & Save'}</span>
                    </button>
                  )}
                </div>

                {/* Live Hourly Earnings Section (أسفل أزرار التحكم) for Hourly Work */}
                {!isPiece && (
                  <div className="mt-4 overflow-hidden rounded-2xl border border-emerald-500/40 bg-gradient-to-r from-emerald-950/70 via-[#0d281e] to-emerald-950/70 p-3.5 sm:p-4 shadow-lg animate-earnings-glow">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 shadow-sm">
                          <Sparkles className="h-4 w-4 text-emerald-400" />
                        </div>
                        <div>
                          <span className="text-xs font-black text-white">
                            {isRTL ? 'الأرباح المباشرة المتراكمة (Live Earnings)' : 'Live Accumulated Earnings'}
                          </span>
                          <span className="hidden sm:inline-block text-[11px] text-emerald-300/70 ms-2">
                            ({formatCurrency(activeWork.rate, cur)}/{isRTL ? 'ساعة' : 'hr'})
                          </span>
                        </div>
                      </div>
                      {currentTimer.isRunning && (
                        <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-black text-emerald-300 border border-emerald-500/30 animate-pulse">
                          <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                          <span>{isRTL ? 'تحديث حي' : 'Live Ticking'}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 pt-1.5 border-t border-emerald-900/40">
                      <div className="font-mono text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight drop-shadow-md">
                        +{formatCurrency(hourlyLiveEarnings, cur)}
                      </div>
                      <div className="text-[11px] text-emerald-200/70">
                        {isRTL
                          ? `${(currentTimer.seconds / 3600).toFixed(2)} ساعة منجزة في هذه الجلسة`
                          : `${(currentTimer.seconds / 3600).toFixed(2)} hrs elapsed this session`}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Toggle details and Simplified Net Summary Card */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-1.5 rounded-xl border border-purple-800/40 bg-[#161633] px-3 py-1.5 text-xs font-bold text-purple-300 hover:text-white"
            >
              {showDetails ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              <span>
                {showDetails
                  ? isRTL ? 'إخفاء التفاصيل' : 'Hide Details'
                  : isRTL ? 'إظهار التفاصيل' : 'Show Details'}
              </span>
            </button>

            {/* Project Options Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsProjectMenuOpen((prev) => !prev)}
                className="flex items-center gap-1.5 rounded-xl border border-purple-800/40 bg-[#161633] px-3 py-1.5 text-xs font-bold text-purple-200 hover:bg-purple-800/40 hover:text-white transition-all shadow-sm active:scale-95"
              >
                <MoreVertical className="h-3.5 w-3.5 text-purple-400" />
                <span>{isRTL ? 'خيارات المشروع' : 'Project Options'}</span>
                <ChevronDown className={`h-3 w-3 text-purple-400 transition-transform ${isProjectMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isProjectMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsProjectMenuOpen(false)}
                  />
                  <div
                    className={`absolute ${isRTL ? 'left-0' : 'right-0'} mt-1.5 w-52 rounded-2xl border border-purple-800/50 bg-[#15152f] p-1.5 shadow-2xl z-50 animate-fadeIn`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        openEditWorkModal(activeWork);
                        setIsProjectMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-purple-200 hover:bg-purple-900/40 rounded-xl transition-all"
                    >
                      <Edit2 className="h-3.5 w-3.5 text-purple-300" />
                      <span>{isRTL ? 'تعديل بيانات المشروع' : 'Edit Project Details'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        exportService.exportWorkToExcel(state, isRTL);
                        setIsProjectMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-green-300 hover:bg-green-950/40 rounded-xl transition-all"
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5 text-green-400" />
                      <span>{isRTL ? 'تصدير إكسل (XLSX)' : 'Export Excel (.xlsx)'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        exportPDF();
                        setIsProjectMenuOpen(false);
                      }}
                      disabled={isExportingPDF}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-purple-200 hover:bg-purple-900/40 rounded-xl transition-all"
                    >
                      <FileText className="h-3.5 w-3.5 text-emerald-400" />
                      <span>{isRTL ? 'تصدير تقرير PDF' : 'Export PDF Report'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        exportPNG();
                        setIsProjectMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-pink-300 hover:bg-pink-950/40 rounded-xl transition-all"
                    >
                      <Image className="h-3.5 w-3.5 text-pink-400" />
                      <span>{isRTL ? 'حفظ ملخص كصورة (PNG)' : 'Export Summary (PNG)'}</span>
                    </button>
                    <div className="my-1 border-t border-purple-900/40" />
                    <button
                      type="button"
                      onClick={() => {
                        setIsProjectMenuOpen(false);
                        setConfirmModal({
                          isOpen: true,
                          title: isRTL ? 'حذف المشروع والعمل' : 'Delete Project',
                          message: isRTL
                            ? `هل أنت متأكد من حذف مشروع "${activeWork.name}" بالكامل مع كل سجلاته ودفعاته؟`
                            : `Are you sure you want to delete project "${activeWork.name}" and all logs?`,
                          onConfirm: () => {
                            onDeleteWork(activeWork.id);
                            const remaining = state.works.filter((w) => w.id !== activeWork.id);
                            setSelectedWorkId(remaining[0]?.id || '');
                          },
                        });
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-950/40 rounded-xl transition-all"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-400" />
                      <span>{isRTL ? 'حذف المشروع نهائياً' : 'Delete Project'}</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Simplified Net Summary Card */}
          <div className="rounded-2xl border-2 border-purple-500/40 bg-gradient-to-r from-purple-950/40 to-pink-950/30 p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider block">
                  {isRTL ? '💰 الصافي المتبقي من المستحقات' : 'Net Remaining Balance'}
                </span>
                <div className="text-2xl font-black text-emerald-400 mt-0.5">
                  {formatCurrency(netDueRemaining, cur)}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-purple-300 block">
                  {isPiece ? (isRTL ? 'القطع المتبقية' : 'Pieces Left') : (isRTL ? 'الساعات المتبقية' : 'Hours Left')}
                </span>
                <div className="text-base font-extrabold text-white">
                  {Math.max(0, remainingWorkUnits).toFixed(1)} {unitLabel}
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Stats Accordion */}
          {showDetails && (
            <div className="space-y-4 animate-fadeIn">
              {/* Detailed Summary Cards */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div className="rounded-2xl border border-purple-900/40 bg-[#15152f] p-3 text-center">
                  <span className="text-[10px] text-purple-300 block">
                    {isPiece ? (isRTL ? 'إجمالي القطع' : 'Total Pieces') : (isRTL ? 'إجمالي الساعات' : 'Total Hours')}
                  </span>
                  <span className="text-base font-black text-white mt-1 block">
                    {totalQuantityOrHours} {unitLabel}
                  </span>
                </div>
                <div className="rounded-2xl border border-purple-900/40 bg-[#15152f] p-3 text-center">
                  <span className="text-[10px] text-purple-300 block">
                    {isRTL ? 'سعر الوحدة' : 'Unit Rate'}
                  </span>
                  <span className="text-base font-black text-purple-300 mt-1 block">
                    {formatCurrency(activeWork.rate, cur)}
                  </span>
                </div>
                <div className="rounded-2xl border border-purple-900/40 bg-[#15152f] p-3 text-center">
                  <span className="text-[10px] text-purple-300 block">
                    {isRTL ? 'إجمالي المستحق' : 'Gross Earned'}
                  </span>
                  <span className="text-base font-black text-emerald-400 mt-1 block">
                    {formatCurrency(totalGrossEarned, cur)}
                  </span>
                </div>
                <div className="rounded-2xl border border-purple-900/40 bg-[#15152f] p-3 text-center">
                  <span className="text-[10px] text-purple-300 block">
                    {isRTL ? 'إجمالي المقبوض' : 'Total Paid'}
                  </span>
                  <span className="text-base font-black text-amber-400 mt-1 block">
                    {formatCurrency(totalReceived, cur)}
                  </span>
                </div>
              </div>

              {/* Productivity Analytics */}
              {isPiece && totalHoursWorked > 0 && (
                <div className="rounded-2xl border border-purple-900/40 bg-[#14142d] p-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
                    <Zap className="h-4 w-4 text-amber-400" />
                    <span>{isRTL ? 'تحليل معدل الإنتاجية' : 'Productivity Metrics'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="rounded-xl bg-[#191938] p-2.5">
                      <span className="text-[10px] text-purple-300/70 block">
                        {isRTL ? 'متوسط الإنجاز بالساعة' : 'Avg Pieces/Hour'}
                      </span>
                      <span className="text-sm font-black text-white">
                        {avgPiecesPerHour.toFixed(1)} {unitLabel}/hr
                      </span>
                    </div>
                    <div className="rounded-xl bg-[#191938] p-2.5">
                      <span className="text-[10px] text-purple-300/70 block">
                        {isRTL ? 'الأجر الفعلي بالساعة' : 'Actual Hourly Wage'}
                      </span>
                      <span className="text-sm font-black text-emerald-400">
                        {formatCurrency(actualHourlyRate, cur)}/hr
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Goals Section */}
              <div className="rounded-2xl border border-purple-900/40 bg-[#14142d] p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-amber-400" />
                    <span className="text-xs font-bold text-white">{isRTL ? 'أهداف العمل' : 'Work Goals'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={openNewGoalModal}
                    className="flex items-center gap-1 text-[11px] font-bold text-purple-400 hover:text-white"
                  >
                    <Plus className="h-3 w-3" />
                    <span>{isRTL ? 'إضافة هدف' : 'Add Goal'}</span>
                  </button>
                </div>

                {activeGoals.length === 0 ? (
                  <p className="text-center text-[11px] text-purple-300/50 py-2">
                    {isRTL ? 'لم يتم تحديد أهداف بعد' : 'No goals set'}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {activeGoals.map((g) => {
                      const pct = Math.min(100, (totalQuantityOrHours / g.target) * 100);
                      return (
                        <div key={g.id} className="rounded-xl bg-[#181836] p-2.5 text-xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-white">
                              {g.type === 'daily'
                                ? isRTL ? 'هدف يومي' : 'Daily'
                                : g.type === 'weekly'
                                ? isRTL ? 'هدف أسبوعي' : 'Weekly'
                                : isRTL ? 'هدف شهري' : 'Monthly'}
                              : {g.target} {unitLabel}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-emerald-400">{pct.toFixed(0)}%</span>
                              {/* Edit goal button */}
                              <button
                                type="button"
                                onClick={() => openEditGoalModal(g)}
                                className="p-1 text-purple-300 hover:text-white hover:bg-purple-900/40 rounded transition-colors"
                                title={isRTL ? 'تعديل الهدف' : 'Edit goal'}
                              >
                                <Edit2 className="h-3 w-3" />
                              </button>
                              {/* Delete goal button */}
                              <button
                                type="button"
                                onClick={() => {
                                  setConfirmModal({
                                    isOpen: true,
                                    title: isRTL ? 'حذف الهدف' : 'Delete Goal',
                                    message: isRTL ? 'هل أنت متأكد من حذف هذا الهدف؟' : 'Delete this goal?',
                                    onConfirm: () => onDeleteWorkGoal(g.id),
                                  });
                                }}
                                className="p-1 text-red-400 hover:text-white hover:bg-red-900/40 rounded transition-colors"
                                title={isRTL ? 'حذف الهدف' : 'Delete goal'}
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                          <div className="h-2 w-full rounded-full bg-purple-950 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-purple-500 to-emerald-400 transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick Actions Row */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={openNewLogModal}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-purple-600/30 border border-purple-500/40 py-2.5 text-xs font-bold text-purple-200 hover:bg-purple-600/50"
            >
              <Plus className="h-4 w-4 text-purple-300" />
              <span>{isRTL ? 'تسجيل إنجاز يدوي' : 'Log Entry'}</span>
            </button>
            <button
              type="button"
              onClick={openNewPaymentModal}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600/30 border border-emerald-500/40 py-2.5 text-xs font-bold text-emerald-200 hover:bg-emerald-600/50"
            >
              <DollarSign className="h-4 w-4 text-emerald-400" />
              <span>{isRTL ? 'قبض دفعة / راتب' : 'Receive Payment'}</span>
            </button>
          </div>

          {/* Logs & Payments Tabs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-purple-400" />
                <span>{isRTL ? 'سجل الإنجازات والدفعات' : 'Logs & Payments History'}</span>
              </h4>
            </div>

            {/* Sub-tabs for Logs vs Payments */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setHistoryTab('logs')}
                className={`flex-1 rounded-xl py-2 text-xs font-bold transition-all ${
                  historyTab === 'logs'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-[#181836] text-purple-300 hover:text-white'
                }`}
              >
                {isRTL ? `سجل الإنجازات (${activeLogs.length})` : `Work Logs (${activeLogs.length})`}
              </button>
              <button
                type="button"
                onClick={() => setHistoryTab('payments')}
                className={`flex-1 rounded-xl py-2 text-xs font-bold transition-all ${
                  historyTab === 'payments'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-[#181836] text-emerald-400 hover:bg-emerald-950/40'
                }`}
              >
                {isRTL ? `الدفعات المقبوضة (${activePayments.length})` : `Payments (${activePayments.length})`}
              </button>
            </div>

            {historyTab === 'logs' ? (
              activeLogs.length === 0 ? (
                <div className="rounded-2xl border border-purple-900/30 bg-[#14142d] p-8 text-center text-xs text-purple-300/60">
                  {isRTL ? 'لا توجد سجلات مسجلة لهذا العمل' : 'No logs recorded'}
                </div>
              ) : (
                <div className="space-y-2">
                  {activeLogs.map((log) => {
                    const earn =
                      (isPiece ? Number(log.quantity || 0) : Number(log.hours || 0)) *
                      Number(activeWork.rate);
                    return (
                      <div
                        key={log.id}
                        className="flex items-center justify-between rounded-2xl border border-purple-900/30 bg-[#14142d] p-3 transition-all hover:border-purple-700/50"
                      >
                        <div>
                          <h5 className="text-xs font-extrabold text-white">{log.desc}</h5>
                          <div className="mt-1 flex items-center gap-2 text-[11px] text-purple-300/70">
                            <span>{log.date}</span>
                            <span>•</span>
                            <span>
                              {isPiece
                                ? `${log.quantity} ${activeWork.unitName}`
                                : `${log.hours} ${isRTL ? 'ساعة' : 'hrs'}`}
                            </span>
                            {log.start && log.end && <span>({log.start} - {log.end})</span>}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-emerald-400">
                            +{formatCurrency(earn, cur)}
                          </span>
                          {/* Edit log button */}
                          <button
                            type="button"
                            onClick={() => openEditLogModal(log)}
                            className="p-1.5 text-purple-300 hover:text-white hover:bg-purple-900/40 rounded transition-colors"
                            title={isRTL ? 'تعديل السجل' : 'Edit log'}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          {/* Delete log button */}
                          <button
                            type="button"
                            onClick={() => {
                              setConfirmModal({
                                isOpen: true,
                                title: isRTL ? 'حذف سجل الإنجاز' : 'Delete Work Log',
                                message: isRTL ? 'هل تريد حذف هذا السجل نهائياً؟' : 'Delete this log permanently?',
                                onConfirm: () => onDeleteWorkLog(log.id),
                              });
                            }}
                            className="p-1.5 text-red-400 hover:text-white hover:bg-red-900/40 rounded transition-colors"
                            title={isRTL ? 'حذف السجل' : 'Delete log'}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              activePayments.length === 0 ? (
                <div className="rounded-2xl border border-purple-900/30 bg-[#14142d] p-8 text-center text-xs text-purple-300/60">
                  {isRTL ? 'لا توجد دفعات مقبوضة مسجلة' : 'No payments recorded'}
                </div>
              ) : (
                <div className="space-y-2">
                  {activePayments.map((pmt) => (
                    <div
                      key={pmt.id}
                      className="flex items-center justify-between rounded-2xl border border-emerald-900/30 bg-[#14142d] p-3 transition-all hover:border-emerald-700/50"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">
                            {pmt.type === 'salary'
                              ? isRTL ? 'راتب' : 'Salary'
                              : pmt.type === 'bonus'
                              ? isRTL ? 'مكافأة' : 'Bonus'
                              : isRTL ? 'دفعة' : 'Payment'}
                          </span>
                          <h5 className="text-xs font-extrabold text-white">
                            {pmt.desc || (isRTL ? 'دفعة عمل' : 'Payment')}
                          </h5>
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-[11px] text-purple-300/70">
                          <span>{pmt.date ? pmt.date.slice(0, 10) : ''}</span>
                          <span>•</span>
                          <span>{pmt.method === 'cash' ? (isRTL ? 'نقداً' : 'Cash') : (isRTL ? 'تحويل' : 'Transfer')}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-emerald-400">
                          {formatCurrency(pmt.amount, cur)}
                        </span>
                        {/* Edit payment button */}
                        <button
                          type="button"
                          onClick={() => openEditPaymentModal(pmt)}
                          className="p-1.5 text-purple-300 hover:text-white hover:bg-purple-900/40 rounded transition-colors"
                          title={isRTL ? 'تعديل الدفعة' : 'Edit payment'}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        {/* Delete payment button */}
                        <button
                          type="button"
                          onClick={() => {
                            setConfirmModal({
                              isOpen: true,
                              title: isRTL ? 'حذف الدفعة' : 'Delete Payment',
                              message: isRTL
                                ? `هل أنت متأكد من حذف هذه الدفعة بقيمة ${formatCurrency(pmt.amount, cur)}؟`
                                : `Are you sure you want to delete this payment (${formatCurrency(pmt.amount, cur)})?`,
                              onConfirm: () => onDeleteWorkPayment(pmt.id),
                            });
                          }}
                          className="p-1.5 text-red-400 hover:text-white hover:bg-red-900/40 rounded transition-colors"
                          title={isRTL ? 'حذف الدفعة' : 'Delete payment'}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-purple-900/30 bg-[#14142d] p-12 text-center text-xs text-purple-300/60">
          <Briefcase className="mx-auto h-10 w-10 text-purple-500/40 mb-2" />
          <p>{isRTL ? 'لا توجد مشاريع مضافة حتى الآن' : 'No projects added yet'}</p>
        </div>
      )}

      {/* Add / Edit Project Modal */}
      {isWorkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-purple-500/30 bg-[#15152f] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-purple-900/40 pb-3 mb-4">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-purple-400" />
                <span>
                  {editingWork
                    ? isRTL ? 'تعديل بيانات العمل / المشروع' : 'Edit Project'
                    : isRTL ? 'إضافة مشروع أو عمل جديد' : 'New Project'}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setIsWorkModalOpen(false)}
                className="text-purple-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveWorkSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-purple-300 block mb-1">{isRTL ? 'اسم العمل *' : 'Work Name *'}</label>
                <input
                  type="text"
                  required
                  value={workName}
                  onChange={(e) => setWorkName(e.target.value)}
                  placeholder={isRTL ? 'مثال: تطوير متجر إلكتروني' : 'Project name'}
                  className="w-full rounded-xl border border-purple-900/50 bg-[#1c1c3c] p-2.5 text-xs text-white outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-purple-300 block mb-1">{isRTL ? 'العميل أو الجهة' : 'Client'}</label>
                <input
                  type="text"
                  value={workClient}
                  onChange={(e) => setWorkClient(e.target.value)}
                  placeholder={isRTL ? 'اسم العميل...' : 'Client name'}
                  className="w-full rounded-xl border border-purple-900/50 bg-[#1c1c3c] p-2.5 text-xs text-white outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-purple-300 block mb-1.5">{isRTL ? 'نظام الحساب' : 'Calculation Mode'}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setWorkCalcType('hourly')}
                    className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 ${
                      workCalcType === 'hourly'
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-[#1c1c3c] text-purple-300'
                    }`}
                  >
                    <Clock className="h-4 w-4" />
                    <span>{isRTL ? 'حساب ساعي' : 'Hourly'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setWorkCalcType('piece')}
                    className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 ${
                      workCalcType === 'piece'
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-[#1c1c3c] text-purple-300'
                    }`}
                  >
                    <Package className="h-4 w-4" />
                    <span>{isRTL ? 'حساب بالقطعة' : 'Per Piece'}</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-purple-300 block mb-1">
                    {workCalcType === 'piece' ? (isRTL ? 'سعر القطعة *' : 'Piece Rate *') : (isRTL ? 'سعر الساعة *' : 'Hourly Rate *')}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={workRate}
                    onChange={(e) => setWorkRate(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-xl border border-purple-900/50 bg-[#1c1c3c] p-2.5 text-xs text-white outline-none focus:border-purple-500"
                  />
                </div>

                {workCalcType === 'piece' && (
                  <div>
                    <label className="text-xs font-bold text-purple-300 block mb-1">{isRTL ? 'اسم الوحدة' : 'Unit Label'}</label>
                    <input
                      type="text"
                      value={workUnitName}
                      onChange={(e) => setWorkUnitName(e.target.value)}
                      placeholder={isRTL ? 'قطعة / تصميم / متر' : 'piece'}
                      className="w-full rounded-xl border border-purple-900/50 bg-[#1c1c3c] p-2.5 text-xs text-white outline-none focus:border-purple-500"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-purple-600 py-2.5 text-xs font-bold text-white shadow-md hover:bg-purple-500"
                >
                  {editingWork ? (isRTL ? 'حفظ التعديلات' : 'Update Project') : (isRTL ? 'حفظ العمل' : 'Save Project')}
                </button>
                <button
                  type="button"
                  onClick={() => setIsWorkModalOpen(false)}
                  className="rounded-xl border border-purple-900/50 bg-[#1c1c3c] px-4 py-2.5 text-xs font-bold text-purple-300"
                >
                  {isRTL ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Log Entry Modal */}
      {isLogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-purple-500/30 bg-[#15152f] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-purple-900/40 pb-3 mb-4">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Clock className="h-5 w-5 text-purple-400" />
                <span>
                  {editingLog
                    ? isRTL ? 'تعديل سجل الإنجاز' : 'Edit Work Entry'
                    : isRTL ? 'تسجيل إنجاز يدوي' : 'Log Work Entry'}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setIsLogModalOpen(false)}
                className="text-purple-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLogSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-purple-300 block mb-1">{isRTL ? 'التاريخ' : 'Date'}</label>
                <input
                  type="date"
                  required
                  value={logDate}
                  onChange={(e) => setLogDate(e.target.value)}
                  className="w-full rounded-xl border border-purple-900/50 bg-[#1c1c3c] p-2.5 text-xs text-white outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-purple-300 block mb-1">{isRTL ? 'وقت الدخول (البداية)' : 'Start Time'}</label>
                  <input
                    type="time"
                    value={logStart}
                    onChange={(e) => setLogStart(e.target.value)}
                    className="w-full rounded-xl border border-purple-900/50 bg-[#1c1c3c] p-2.5 text-xs text-white outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-purple-300 block mb-1">{isRTL ? 'وقت الخروج (النهاية)' : 'End Time'}</label>
                  <input
                    type="time"
                    value={logEnd}
                    onChange={(e) => setLogEnd(e.target.value)}
                    className="w-full rounded-xl border border-purple-900/50 bg-[#1c1c3c] p-2.5 text-xs text-white outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {isPiece ? (
                <div>
                  <label className="text-xs font-bold text-purple-300 block mb-1">
                    {isRTL ? `عدد ${activeWork?.unitName || 'القطع'} المنجزة *` : `Pieces completed *`}
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={logQuantity}
                    onChange={(e) => setLogQuantity(e.target.value)}
                    placeholder="10"
                    className="w-full rounded-xl border border-purple-900/50 bg-[#1c1c3c] p-2.5 text-xs text-white outline-none focus:border-purple-500"
                  />
                </div>
              ) : (
                <div>
                  <label className="text-xs font-bold text-purple-300 block mb-1">{isRTL ? 'ساعات العمل *' : 'Hours worked *'}</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={logHours}
                    onChange={(e) => setLogHours(e.target.value)}
                    placeholder="4.5"
                    className="w-full rounded-xl border border-purple-900/50 bg-[#1c1c3c] p-2.5 text-xs text-white outline-none focus:border-purple-500"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-purple-300 block mb-1">{isRTL ? 'الوصف أو الملاحظات' : 'Description'}</label>
                <input
                  type="text"
                  value={logDesc}
                  onChange={(e) => setLogDesc(e.target.value)}
                  placeholder={isRTL ? 'ما الذي أنجزته؟...' : 'What did you achieve?...'}
                  className="w-full rounded-xl border border-purple-900/50 bg-[#1c1c3c] p-2.5 text-xs text-white outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-purple-600 py-2.5 text-xs font-bold text-white shadow-md hover:bg-purple-500"
                >
                  {editingLog ? (isRTL ? 'حفظ التعديلات' : 'Update Entry') : (isRTL ? 'حفظ السجل' : 'Save Entry')}
                </button>
                <button
                  type="button"
                  onClick={() => setIsLogModalOpen(false)}
                  className="rounded-xl border border-purple-900/50 bg-[#1c1c3c] px-4 py-2.5 text-xs font-bold text-purple-300"
                >
                  {isRTL ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Work Payment / Salary Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-purple-500/30 bg-[#15152f] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-purple-900/40 pb-3 mb-4">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-400" />
                <span>
                  {editingPayment
                    ? isRTL ? 'تعديل الدفعة المستلمة' : 'Edit Received Payment'
                    : isRTL ? 'قبض دفعة أو راتب عمل' : 'Record Salary / Payment'}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-purple-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSavePaymentSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-purple-300 block mb-1">{isRTL ? 'نوع المقبوض' : 'Type'}</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentType('salary')}
                    className={`py-1.5 rounded-lg text-xs font-bold ${
                      paymentType === 'salary' ? 'bg-purple-600 text-white' : 'bg-[#1c1c3c] text-purple-300'
                    }`}
                  >
                    {isRTL ? 'راتب' : 'Salary'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentType('payment')}
                    className={`py-1.5 rounded-lg text-xs font-bold ${
                      paymentType === 'payment' ? 'bg-purple-600 text-white' : 'bg-[#1c1c3c] text-purple-300'
                    }`}
                  >
                    {isRTL ? 'دفعة' : 'Payment'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentType('bonus')}
                    className={`py-1.5 rounded-lg text-xs font-bold ${
                      paymentType === 'bonus' ? 'bg-purple-600 text-white' : 'bg-[#1c1c3c] text-purple-300'
                    }`}
                  >
                    {isRTL ? 'مكافأة' : 'Bonus'}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-purple-300 block mb-1">{isRTL ? 'المبلغ المستلم *' : 'Amount *'}</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-xl border border-purple-900/50 bg-[#1c1c3c] p-2.5 text-xs font-bold text-white outline-none focus:border-purple-500"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-purple-400">
                    {cur}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-purple-300 block mb-1">{isRTL ? 'طريقة الاستلام' : 'Method'}</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full rounded-xl border border-purple-900/50 bg-[#1c1c3c] p-2.5 text-xs text-white outline-none focus:border-purple-500"
                >
                  <option value="bank">🏦 {isRTL ? 'تحويل بنكي' : 'Bank Transfer'}</option>
                  <option value="cash">💵 {isRTL ? 'نقداً (كاش)' : 'Cash'}</option>
                  <option value="card">💳 {isRTL ? 'بطاقة' : 'Card'}</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-purple-300 block mb-1">{isRTL ? 'البيان' : 'Description'}</label>
                <input
                  type="text"
                  value={paymentDesc}
                  onChange={(e) => setPaymentDesc(e.target.value)}
                  placeholder={isRTL ? 'دفعة عن شهر كذا...' : 'Notes...'}
                  className="w-full rounded-xl border border-purple-900/50 bg-[#1c1c3c] p-2.5 text-xs text-white outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-500"
                >
                  {editingPayment ? (isRTL ? 'حفظ التعديلات' : 'Update Payment') : (isRTL ? 'تسجيل الدفعة' : 'Save Payment')}
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

      {/* Goal Modal */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-purple-500/30 bg-[#15152f] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-purple-900/40 pb-3 mb-4">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-400" />
                <span>
                  {editingGoal
                    ? isRTL ? 'تعديل هدف العمل' : 'Edit Work Goal'
                    : isRTL ? 'تحديد هدف إنتاجي' : 'Set Work Goal'}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setIsGoalModalOpen(false)}
                className="text-purple-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGoalSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-purple-300 block mb-1">{isRTL ? 'فترة الهدف' : 'Frequency'}</label>
                <select
                  value={goalType}
                  onChange={(e) => setGoalType(e.target.value as any)}
                  className="w-full rounded-xl border border-purple-900/50 bg-[#1c1c3c] p-2.5 text-xs text-white outline-none focus:border-purple-500"
                >
                  <option value="daily">{isRTL ? 'يومي' : 'Daily'}</option>
                  <option value="weekly">{isRTL ? 'أسبوعي' : 'Weekly'}</option>
                  <option value="monthly">{isRTL ? 'شهري' : 'Monthly'}</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-purple-300 block mb-1">
                  {isRTL ? `الكمية المستهدفة (${unitLabel}) *` : `Target (${unitLabel}) *`}
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={goalTarget}
                  onChange={(e) => setGoalTarget(e.target.value)}
                  placeholder="30"
                  className="w-full rounded-xl border border-purple-900/50 bg-[#1c1c3c] p-2.5 text-xs text-white outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-purple-600 py-2.5 text-xs font-bold text-white shadow-md hover:bg-purple-500"
                >
                  {editingGoal ? (isRTL ? 'حفظ التعديلات' : 'Update Goal') : (isRTL ? 'حفظ الهدف' : 'Save Goal')}
                </button>
                <button
                  type="button"
                  onClick={() => setIsGoalModalOpen(false)}
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
