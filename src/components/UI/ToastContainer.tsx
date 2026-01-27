/**
 * ToastContainer - Renders toast notifications
 * 
 * Fixed position container that displays toast notifications
 * with animations and auto-dismiss functionality.
 */

import { useToastStore, Toast, ToastType } from './toastStore';

// Icon components for each toast type
const ToastIcon = ({ type }: { type: ToastType }) => {
  switch (type) {
    case 'success':
      return (
        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
    case 'error':
      return (
        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      );
    case 'warning':
      return (
        <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      );
    case 'info':
      return (
        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
};

// Background colors for each toast type
const bgColors: Record<ToastType, string> = {
  success: 'bg-green-50 border-green-200',
  error: 'bg-red-50 border-red-200',
  warning: 'bg-yellow-50 border-yellow-200',
  info: 'bg-blue-50 border-blue-200',
};

// Text colors for each toast type
const textColors: Record<ToastType, string> = {
  success: 'text-green-800',
  error: 'text-red-800',
  warning: 'text-yellow-800',
  info: 'text-blue-800',
};

// Individual toast component
const ToastItem = ({ toast }: { toast: Toast }) => {
  const removeToast = useToastStore((state) => state.removeToast);

  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-lg border shadow-lg
        animate-slide-in-right
        ${bgColors[toast.type]}
      `}
      role="alert"
    >
      <div className="flex-shrink-0">
        <ToastIcon type={toast.type} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${textColors[toast.type]}`}>
          {toast.message}
        </p>
        {toast.description && (
          <p className={`mt-1 text-sm opacity-80 ${textColors[toast.type]}`}>
            {toast.description}
          </p>
        )}
      </div>
      <button
        onClick={() => removeToast(toast.id)}
        className={`flex-shrink-0 p-1 rounded-full hover:bg-black/5 transition-colors ${textColors[toast.type]}`}
        aria-label="Dismiss"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

export function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts);

  if (toasts.length === 0) return null;

  return (
    <div 
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
