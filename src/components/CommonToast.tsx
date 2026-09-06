/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { ToastMessage } from '../types';

interface CommonToastProps {
  toast: ToastMessage | null;
  onClose: () => void;
}

export const CommonToast: React.FC<CommonToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast, onClose]);

  if (!toast) return null;

  const bgClass =
    toast.type === 'success'
      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
      : toast.type === 'error'
      ? 'bg-rose-50 border-rose-200 text-rose-800'
      : 'bg-amber-50 border-amber-200 text-amber-800';

  const Icon =
    toast.type === 'success'
      ? CheckCircle
      : toast.type === 'error'
      ? AlertCircle
      : Info;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-bounce-short">
      <div className={`p-4 rounded-xl border shadow-lg flex items-start gap-3 ${bgClass}`}>
        <Icon className="w-5 h-5 shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-semibold text-sm leading-tight">{toast.title}</h4>
          {toast.description && (
            <p className="text-xs mt-1 opacity-90 leading-relaxed">{toast.description}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
