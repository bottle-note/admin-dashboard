/**
 * Toast 알림 시스템
 * Context 기반 Toast 상태 관리
 */

import { createContext, useContext, useCallback, useState } from 'react';

// ============================================
// Types
// ============================================

/**
 * Toast 타입
 */
export type ToastType = 'success' | 'error' | 'info' | 'warning';

/**
 * Toast 데이터
 */
export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

/**
 * Toast 생성 옵션
 */
export interface ToastOptions {
  type: ToastType;
  message: string;
  /** 자동 dismiss 시간 (ms). 0이면 자동 dismiss 안함. 기본값: 5000 */
  duration?: number;
}

/**
 * Toast Context 값
 */
export interface ToastContextValue {
  toasts: Toast[];
  showToast: (options: ToastOptions) => void;
  dismissToast: (id: string) => void;
  clearAllToasts: () => void;
}

// ============================================
// Context
// ============================================

export const ToastContext = createContext<ToastContextValue | null>(null);

// ============================================
// Hook
// ============================================

/**
 * Toast 사용을 위한 훅
 * ToastProvider 내부에서 사용해야 함
 */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  return context;
}

// ============================================
// State Hook (Provider 내부용)
// ============================================

let toastIdCounter = 0;

/**
 * Toast 상태 관리 훅 (ToastProvider에서 사용)
 */
export function useToastState(): ToastContextValue {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((options: ToastOptions) => {
    const id = `toast-${++toastIdCounter}`;
    const duration = options.duration ?? 5000;

    setToasts((prev) => [...prev, { ...options, id }]);

    // 자동 dismiss
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return {
    toasts,
    showToast,
    dismissToast,
    clearAllToasts,
  };
}
