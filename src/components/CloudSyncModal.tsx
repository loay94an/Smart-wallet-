import React, { useState, useEffect } from 'react';
import { AppState } from '../types';
import { cloudSyncService, CloudSyncResult } from '../services/cloudSync';
import { ConfirmModal } from './ConfirmModal';
import {
  Cloud,
  UploadCloud,
  DownloadCloud,
  KeyRound,
  Check,
  Copy,
  RefreshCw,
  AlertCircle,
  X,
  Smartphone,
  ShieldCheck,
} from 'lucide-react';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: AppState;
  onApplyCloudState: (cloudState: AppState) => void;
  onUpdateSyncKey: (newKey: string) => void;
  language: 'ar' | 'en';
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  state,
  onApplyCloudState,
  onUpdateSyncKey,
  language,
}) => {
  const isRTL = language === 'ar';
  const [syncKeyInput, setSyncKeyInput] = useState<string>(state.settings.syncKey || '');
  const [isPushing, setIsPushing] = useState<boolean>(false);
  const [isPulling, setIsPulling] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [cloudInfo, setCloudInfo] = useState<{ exists: boolean; updatedAt?: string; version?: number; deviceName?: string } | null>(null);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  useEffect(() => {
    if (isOpen && state.settings.syncKey) {
      setSyncKeyInput(state.settings.syncKey);
      checkCloudStatus(state.settings.syncKey);
    }
  }, [isOpen, state.settings.syncKey]);

  const checkCloudStatus = async (key: string) => {
    if (!key.trim()) return;
    const res = await cloudSyncService.checkCloudStatus(key);
    setCloudInfo(res);
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(syncKeyInput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateNewKey = () => {
    const newKey = 'WALLET-' + Math.random().toString(36).substring(2, 8).toUpperCase() + '-' + new Date().getFullYear();
    setSyncKeyInput(newKey);
    onUpdateSyncKey(newKey);
    setStatusMessage({
      text: isRTL ? 'تم إنشاء رمز مزامنة جديد!' : 'New sync key generated!',
      type: 'info',
    });
    checkCloudStatus(newKey);
  };

  const handlePush = async () => {
    if (!syncKeyInput.trim()) {
      setStatusMessage({ text: isRTL ? 'يرجى إدخال رمز المزامنة' : 'Please enter sync key', type: 'error' });
      return;
    }

    setIsPushing(true);
    setStatusMessage(null);

    const res: CloudSyncResult = await cloudSyncService.pushToCloud(syncKeyInput, state);
    setIsPushing(false);

    if (res.success) {
      onUpdateSyncKey(syncKeyInput);
      setStatusMessage({
        text: isRTL
          ? `✅ تم رفع بياناتك إلى السحابة بنجاح! (النسخة #${res.version})`
          : `✅ Cloud push successful! (Version #${res.version})`,
        type: 'success',
      });
      checkCloudStatus(syncKeyInput);
    } else {
      setStatusMessage({
        text: res.message || (isRTL ? 'فشل الرفع إلى السحابة' : 'Push failed'),
        type: 'error',
      });
    }
  };

  const executePull = async () => {
    setIsPulling(true);
    setStatusMessage(null);

    const res: CloudSyncResult = await cloudSyncService.pullFromCloud(syncKeyInput);
    setIsPulling(false);

    if (res.success && res.data) {
      onApplyCloudState(res.data);
      onUpdateSyncKey(syncKeyInput);
      setStatusMessage({
        text: isRTL
          ? `✅ تم سحب البيانات السحابية وتطبيقها بنجاح! من: ${res.deviceName || 'جهاز آخر'}`
          : `✅ Cloud data successfully pulled! From: ${res.deviceName || 'Other device'}`,
        type: 'success',
      });
      checkCloudStatus(syncKeyInput);
    } else {
      setStatusMessage({
        text: res.message || (isRTL ? 'فشل سحب البيانات من السحابة' : 'Pull failed'),
        type: 'error',
      });
    }
  };

  const handlePull = () => {
    if (!syncKeyInput.trim()) {
      setStatusMessage({ text: isRTL ? 'يرجى إدخال رمز المزامنة' : 'Please enter sync key', type: 'error' });
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: isRTL ? 'سحب واستبدال البيانات' : 'Pull & Replace Data',
      message: isRTL
        ? 'تنبيه: سيؤدي سحب البيانات من السحابة إلى استبدال البيانات المحلية بالنسخة السحابية. هل تريد المتابعة؟'
        : 'Warning: Pulling from cloud will replace local data with cloud data. Continue?',
      confirmText: isRTL ? 'نعم، سحب البيانات' : 'Yes, Pull',
      onConfirm: executePull,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-3xl border border-cyan-500/30 bg-[#14142d] p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-purple-900/40 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/30">
              <Cloud className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">{isRTL ? 'المزامنة السحابية' : 'Cloud Sync'}</h3>
              <p className="text-[11px] text-purple-300/70">
                {isRTL ? 'مزامنة بياناتك المالية بين الهاتف والكمبيوتر' : 'Sync your financial data across all devices'}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-purple-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Sync Key Input & Controls */}
        <div className="space-y-2 rounded-2xl border border-purple-900/40 bg-[#181838] p-4">
          <label className="text-xs font-bold text-purple-200 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <KeyRound className="h-3.5 w-3.5 text-cyan-400" />
              <span>{isRTL ? 'رمز المزامنة السحابية (Sync Key)' : 'Cloud Sync Key'}</span>
            </span>
            <button
              type="button"
              onClick={handleGenerateNewKey}
              className="text-[11px] font-bold text-purple-400 hover:text-white"
            >
              🔄 {isRTL ? 'توليد رمز جديد' : 'Generate New'}
            </button>
          </label>

          <div className="flex gap-2">
            <input
              type="text"
              value={syncKeyInput}
              onChange={(e) => {
                setSyncKeyInput(e.target.value.toUpperCase());
                checkCloudStatus(e.target.value.toUpperCase());
              }}
              placeholder="WALLET-XXXX-2026"
              className="flex-1 rounded-xl border border-purple-900/60 bg-[#101026] p-2.5 font-mono text-xs font-black tracking-wider text-cyan-300 uppercase outline-none focus:border-cyan-400"
            />
            <button
              type="button"
              onClick={handleCopyKey}
              className="flex items-center gap-1 rounded-xl border border-purple-800/50 bg-purple-950/40 px-3 py-2 text-xs font-bold text-purple-300 hover:text-white"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              <span>{copied ? (isRTL ? 'تم النسخ' : 'Copied') : (isRTL ? 'نسخ' : 'Copy')}</span>
            </button>
          </div>
          <p className="text-[10px] text-purple-300/60">
            {isRTL
              ? 'احفظ هذا الرمز وضعه في أي جهاز آخر لسحب أو رفع بياناتك المالية المشتركة.'
              : 'Save this key and use it on any other device to sync your data.'}
          </p>
        </div>

        {/* Cloud Status Card */}
        {cloudInfo && (
          <div className="rounded-2xl border border-purple-900/30 bg-[#161633] p-3 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  cloudInfo.exists ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <span className="font-bold text-white">
                {cloudInfo.exists
                  ? isRTL ? 'توجد نسخة محفوظة على السحابة' : 'Cloud backup exists'
                  : isRTL ? 'لا توجد نسخة سحابية سابقة بهذا الرمز' : 'No cloud backup yet'}
              </span>
            </div>
            {cloudInfo.updatedAt && (
              <span className="text-[10px] text-purple-300/70">
                {new Date(cloudInfo.updatedAt).toLocaleString(isRTL ? 'ar-SA' : 'en-US')}
              </span>
            )}
          </div>
        )}

        {/* Status Message */}
        {statusMessage && (
          <div
            className={`rounded-xl border p-3 text-xs font-bold ${
              statusMessage.type === 'success'
                ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300'
                : statusMessage.type === 'error'
                ? 'border-red-500/40 bg-red-950/20 text-red-300'
                : 'border-cyan-500/40 bg-cyan-950/20 text-cyan-300'
            }`}
          >
            {statusMessage.text}
          </div>
        )}

        {/* Sync Actions Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Push to Cloud */}
          <button
            type="button"
            onClick={handlePush}
            disabled={isPushing}
            className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-cyan-500/40 bg-gradient-to-tr from-cyan-950/50 to-blue-900/30 p-4 text-center transition-all hover:border-cyan-400 active:scale-95 disabled:opacity-50 shadow-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-600/30 text-cyan-300">
              <UploadCloud className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-black text-white block">
                {isPushing ? (isRTL ? 'جاري الرفع...' : 'Pushing...') : (isRTL ? 'رفع إلى السحابة' : 'Push to Cloud')}
              </span>
              <span className="text-[10px] text-purple-300/70 block mt-0.5">
                {isRTL ? 'حفظ البيانات المحلية بالسحابة' : 'Save local data online'}
              </span>
            </div>
          </button>

          {/* Pull from Cloud */}
          <button
            type="button"
            onClick={handlePull}
            disabled={isPulling}
            className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-purple-500/40 bg-gradient-to-tr from-purple-950/50 to-pink-900/30 p-4 text-center transition-all hover:border-purple-400 active:scale-95 disabled:opacity-50 shadow-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600/30 text-purple-300">
              <DownloadCloud className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-black text-white block">
                {isPulling ? (isRTL ? 'جاري السحب...' : 'Pulling...') : (isRTL ? 'سحب من السحابة' : 'Pull from Cloud')}
              </span>
              <span className="text-[10px] text-purple-300/70 block mt-0.5">
                {isRTL ? 'تحديث هذا الجهاز من السحابة' : 'Update device from online'}
              </span>
            </div>
          </button>
        </div>

        {/* Security notice */}
        <div className="flex items-center gap-2 text-[11px] text-purple-300/60 border-t border-purple-900/30 pt-3">
          <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>
            {isRTL
              ? 'البيانات مشفرة ومحفوظة بمفتاح المزامنة الخاص بك فقط.'
              : 'Data is protected and scoped to your unique sync key.'}
          </span>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        language={language}
      />
    </div>
  );
};
