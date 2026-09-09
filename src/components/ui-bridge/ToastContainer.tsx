import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export interface ToastItem {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'error';
}

export const ToastContainer: React.FC<{ toasts: ToastItem[]; onDismiss: (id: string) => void }> = ({
  toasts,
  onDismiss
}) => {
  return (
    <div className="fixed top-12 right-4 flex flex-col gap-2 z-50 pointer-events-none max-w-sm w-full">
      {toasts.map((t) => {
        const isError = t.type === 'error';
        const isWarning = t.type === 'warning';

        return (
          <div
            key={t.id}
            className={`pointer-events-auto p-3 rounded-xl border shadow-xl flex items-start gap-2.5 text-xs transition-all animate-in slide-in-from-top-2 duration-150 ${
              isError
                ? 'bg-red-950/90 border-red-500/40 text-red-200'
                : isWarning
                  ? 'bg-amber-950/90 border-amber-500/40 text-amber-200'
                  : 'bg-dark-900/90 border-dark-700 text-dark-200'
            }`}
          >
            {isError && <AlertCircle size={15} className="text-red-400 mt-0.5 flex-shrink-0" />}
            {isWarning && <AlertCircle size={15} className="text-amber-400 mt-0.5 flex-shrink-0" />}
            {!isError && !isWarning && <Info size={15} className="text-blue-400 mt-0.5 flex-shrink-0" />}

            <div className="flex-1 whitespace-pre-wrap">{t.message}</div>

            <button
              onClick={() => onDismiss(t.id)}
              className="text-dark-400 hover:text-white transition"
            >
              <X size={13} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
