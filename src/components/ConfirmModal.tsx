import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export interface ConfirmModalState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  onConfirm: () => void;
}

interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  language?: 'ar' | 'en';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  isDanger = true,
  onConfirm,
  onClose,
  language = 'ar',
}) => {
  if (!isOpen) return null;
  const isRTL = language === 'ar';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
      <div
        className="w-full max-w-sm rounded-3xl border border-red-500/30 bg-[#15152f] p-6 shadow-2xl transition-all scale-100"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="flex items-start justify-between mb-4">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
              isDanger
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}
          >
            {isDanger ? <Trash2 className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-purple-400 hover:text-white transition-colors p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <h3 className="text-base font-black text-white mb-2">
          {title || (isRTL ? 'تأكيد الحذف' : 'Confirm Deletion')}
        </h3>

        <p className="text-xs leading-relaxed text-purple-200/80 mb-6">
          {message}
        </p>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-purple-900/50 bg-[#1c1c3c] py-2.5 text-xs font-bold text-purple-300 hover:text-white hover:bg-purple-900/40 transition-all"
          >
            {cancelText || (isRTL ? 'إلغاء' : 'Cancel')}
          </button>

          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`rounded-xl py-2.5 text-xs font-black text-white shadow-lg transition-all active:scale-95 ${
              isDanger
                ? 'bg-red-600 hover:bg-red-500 shadow-red-600/30'
                : 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30'
            }`}
          >
            {confirmText || (isRTL ? 'نعم، حذف' : 'Yes, Delete')}
          </button>
        </div>
      </div>
    </div>
  );
};
