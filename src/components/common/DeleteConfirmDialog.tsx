/**
 * 삭제 확인 다이얼로그 컴포넌트
 * - 삭제 전 확인을 위한 AlertDialog
 * - 경고 메시지 표시 옵션
 */

import { AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

/**
 * DeleteConfirmDialog 컴포넌트의 props
 * @param open - 다이얼로그 열림 상태
 * @param onOpenChange - 열림 상태 변경 콜백
 * @param onConfirm - 삭제 확인 콜백
 * @param title - 다이얼로그 제목
 * @param description - 설명 텍스트
 * @param warningMessage - 경고 메시지 (선택)
 * @param confirmText - 확인 버튼 텍스트
 * @param cancelText - 취소 버튼 텍스트
 */
export interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  warningMessage?: string;
  confirmText?: string;
  cancelText?: string;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description = '이 작업은 되돌릴 수 없습니다.',
  warningMessage,
  confirmText = '삭제',
  cancelText = '취소',
}: DeleteConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              {warningMessage && (
                <div className="flex items-center gap-2 rounded-md bg-amber-50 p-3 text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{warningMessage}</span>
                </div>
              )}
              <p>{description}</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelText}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>{confirmText}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
