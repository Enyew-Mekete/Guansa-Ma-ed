import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import { AdminModal } from './AdminModal';

type ToastKind = 'success' | 'error';
interface Confirmation {
  title: string;
  message: string;
  confirmLabel: string;
  resolve: (confirmed: boolean) => void;
}
interface ToastMessage {
  id: number;
  kind: ToastKind;
  message: string;
}
interface AdminFeedbackValue {
  confirm: (title: string, message: string, confirmLabel?: string) => Promise<boolean>;
  notify: (kind: ToastKind, message: string) => void;
}

const AdminFeedbackContext = createContext<AdminFeedbackValue | undefined>(undefined);

export const AdminFeedbackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const nextToastId = useRef(0);

  const confirm = useCallback((title: string, message: string, confirmLabel = 'Delete') => (
    new Promise<boolean>((resolve) => setConfirmation({ title, message, confirmLabel, resolve }))
  ), []);

  const notify = useCallback((kind: ToastKind, message: string) => {
    const id = ++nextToastId.current;
    setToasts((current) => [...current, { id, kind, message }]);
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 4000);
  }, []);

  const resolveConfirmation = (confirmed: boolean) => {
    confirmation?.resolve(confirmed);
    setConfirmation(null);
  };

  useEffect(() => () => {
    confirmation?.resolve(false);
  }, [confirmation]);

  return (
    <AdminFeedbackContext.Provider value={{ confirm, notify }}>
      {children}
      <AdminModal
        isOpen={Boolean(confirmation)}
        title={confirmation?.title ?? ''}
        onClose={() => resolveConfirmation(false)}
        maxWidthClass="max-w-md"
      >
        {confirmation && (
          <div className="space-y-5">
            <p className="text-sm leading-relaxed text-[#344BC2]/80">{confirmation.message}</p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => resolveConfirmation(false)} className="rounded-lg border border-[#159E37] px-4 py-2 text-sm font-semibold">Cancel</button>
              <button type="button" onClick={() => resolveConfirmation(true)} className="rounded-lg bg-red-700 px-4 py-2 text-sm font-bold text-white">{confirmation.confirmLabel}</button>
            </div>
          </div>
        )}
      </AdminModal>
      <div className="fixed right-4 top-4 z-[110] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2" aria-live="polite" aria-atomic="false">
        {toasts.map((toast) => (
          <div key={toast.id} role={toast.kind === 'error' ? 'alert' : 'status'} className={`flex items-start gap-2 rounded-xl border p-3 text-sm shadow-lg ${toast.kind === 'success' ? 'border-[#159E37] bg-[#159E37]/10 text-[#0b5c22]' : 'border-red-300 bg-red-50 text-red-900'}`}>
            {toast.kind === 'success' ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}
            <span className="flex-1">{toast.message}</span>
            <button type="button" onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))} aria-label="Dismiss notification"><X className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
    </AdminFeedbackContext.Provider>
  );
};

export const useAdminFeedback = (): AdminFeedbackValue => {
  const context = useContext(AdminFeedbackContext);
  if (!context) throw new Error('useAdminFeedback must be used within AdminFeedbackProvider.');
  return context;
};
