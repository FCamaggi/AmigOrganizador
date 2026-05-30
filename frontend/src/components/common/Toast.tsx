import { useCallback, useMemo, useState } from 'react';
import { cn } from '../../styles/design-system';
import IconButton from './IconButton';
import { ToastContext, type ToastMessage } from './toastContext';

const variantClasses = {
  success: 'border-success-200 bg-success-50 text-success-900',
  error: 'border-danger-200 bg-danger-50 text-danger-900',
  warning: 'border-warning-200 bg-warning-50 text-warning-900',
  info: 'border-primary-200 bg-primary-50 text-primary-900',
};

const variantDots = {
  success: 'bg-success-500',
  error: 'bg-danger-500',
  warning: 'bg-warning-500',
  info: 'bg-primary-500',
};

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(current => current.filter(toast => toast.id !== id));
  }, []);

  const showToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = crypto.randomUUID();
    setToasts(current => [...current, { ...toast, id }]);
    window.setTimeout(() => removeToast(id), 4500);
  }, [removeToast]);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="fixed right-3 top-3 z-[1070] flex w-[calc(100vw-1.5rem)] max-w-sm flex-col gap-3 sm:right-5 sm:top-5"
        aria-live="polite"
        aria-relevant="additions removals"
      >
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={cn(
              'flex items-start gap-3 rounded-xl border p-4 shadow-luxury backdrop-blur-md',
              variantClasses[toast.variant]
            )}
            role="status"
          >
            <span className={cn('mt-1 h-2.5 w-2.5 shrink-0 rounded-full', variantDots[toast.variant])} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">{toast.title}</p>
              {toast.description && (
                <p className="mt-1 text-sm opacity-80">{toast.description}</p>
              )}
            </div>
            <IconButton
              label="Cerrar notificacion"
              size="sm"
              variant="ghost"
              onClick={() => removeToast(toast.id)}
              icon={
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              }
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
