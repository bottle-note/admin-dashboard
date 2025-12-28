/**
 * Toast UI 컴포넌트
 * 알림 메시지 표시를 위한 컴포넌트
 */

import { useToast, type Toast, type ToastType } from '@/hooks/useToast';
import { cn } from '@/lib/utils';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

// ============================================
// Icon Map
// ============================================

const ICONS: Record<ToastType, typeof CheckCircle> = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

// ============================================
// Style Map
// ============================================

const CONTAINER_STYLES: Record<ToastType, string> = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
};

const ICON_STYLES: Record<ToastType, string> = {
  success: 'text-green-500',
  error: 'text-red-500',
  info: 'text-blue-500',
  warning: 'text-yellow-500',
};

// ============================================
// Toast Item Component
// ============================================

interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const Icon = ICONS[toast.type];

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border p-4 shadow-lg',
        'animate-in slide-in-from-right-full fade-in duration-300',
        CONTAINER_STYLES[toast.type]
      )}
      role="alert"
      aria-live="polite"
    >
      <Icon className={cn('h-5 w-5 flex-shrink-0 mt-0.5', ICON_STYLES[toast.type])} />
      <p className="flex-1 text-sm font-medium leading-relaxed">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className={cn(
          'flex-shrink-0 rounded-md p-1 transition-colors',
          'hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-offset-2',
          toast.type === 'success' && 'focus:ring-green-500',
          toast.type === 'error' && 'focus:ring-red-500',
          toast.type === 'info' && 'focus:ring-blue-500',
          toast.type === 'warning' && 'focus:ring-yellow-500'
        )}
        aria-label="닫기"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

// ============================================
// Toast Container
// ============================================

/**
 * Toast 컨테이너
 * 화면 우측 상단에 Toast 목록 표시
 */
export function ToastContainer() {
  const { toasts, dismissToast } = useToast();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div
      className="fixed right-4 top-4 z-50 flex w-full max-w-sm flex-col gap-2"
      aria-label="알림 목록"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
      ))}
    </div>
  );
}
