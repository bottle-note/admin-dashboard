/**
 * Toast Provider
 * 앱 전체에서 Toast 사용을 위한 Context Provider
 */

import type { ReactNode } from 'react';
import { ToastContext, useToastState } from '@/hooks/useToast';
import { ToastContainer } from '@/components/ui/Toast';

interface ToastProviderProps {
  children: ReactNode;
}

/**
 * Toast Provider 컴포넌트
 * App.tsx에서 최상위에 배치
 */
export function ToastProvider({ children }: ToastProviderProps) {
  const toastState = useToastState();

  return (
    <ToastContext.Provider value={toastState}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}
