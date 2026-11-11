/**
 * 삭제 확인 다이얼로그 컴포넌트
 * - 삭제 전 확인을 위한 AlertDialog
 * - 경고 메시지 표시 옵션
 */

import { AlertTriangle } from 'lucide-react';
import {
  useLayoutEffect,
  useRef,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
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
 * @param isPending - 삭제 진행 중 상태 (버튼 비활성화)
 */
export interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  description?: ReactNode;
  warningMessage?: string;
  confirmText?: string;
  cancelText?: string;
  isPending?: boolean;
  trigger?: ReactElement;
  pendingText?: string;
  closeOnConfirm?: boolean;
  onCloseAutoFocus?: ComponentProps<typeof AlertDialogContent>['onCloseAutoFocus'];
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
  isPending = false,
  trigger,
  pendingText = `${confirmText} 중...`,
  closeOnConfirm = true,
  onCloseAutoFocus,
}: DeleteConfirmDialogProps) {
  const opener = useRef<HTMLElement | null>(null);
  const content = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (open && isPending) body.current?.focus();
  }, [open, isPending]);
  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!isPending) onOpenChange(next);
      }}
    >
      {trigger && <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>}
      <AlertDialogContent
        ref={content}
        className="flex max-h-[calc(100dvh-32px)] w-[calc(100%-32px)] min-w-0 flex-col overflow-y-auto p-5 sm:max-w-lg"
        onOpenAutoFocus={(event) => {
          if (!trigger)
            opener.current =
              document.activeElement instanceof HTMLElement ? document.activeElement : null;
          if (content.current && content.current.scrollHeight > content.current.clientHeight) {
            // 큰 글자에서 동작 버튼이 아래로 밀리면 먼저 검토 내용을 읽을 위치를 잡는다.
            event.preventDefault();
            body.current?.focus();
          }
        }}
        onCloseAutoFocus={(event) => {
          onCloseAutoFocus?.(event);
          if (
            !event.defaultPrevented &&
            !trigger &&
            opener.current?.isConnected &&
            !opener.current.matches(':disabled')
          ) {
            event.preventDefault();
            opener.current.focus();
          }
        }}
        onEscapeKeyDown={(event) => {
          if (isPending) event.preventDefault();
        }}
      >
        <AlertDialogHeader className="shrink-0">
          <AlertDialogTitle className="break-words [overflow-wrap:anywhere]">
            {title}
          </AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogDescription asChild>
          <div
            ref={body}
            tabIndex={0}
            className="min-h-[min(6rem,25dvh)] min-w-0 flex-1 space-y-4 overflow-y-auto overscroll-contain rounded-sm [overflow-wrap:anywhere] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {warningMessage && (
              <div className="flex items-start gap-2 rounded-md bg-amber-50 p-3 text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="min-w-0">{warningMessage}</span>
              </div>
            )}
            <div className="whitespace-pre-line">{description}</div>
            {isPending && <p role="status">처리 중입니다. 완료될 때까지 기다려 주세요.</p>}
          </div>
        </AlertDialogDescription>
        <AlertDialogFooter className="grid shrink-0 grid-cols-2 gap-2 sm:space-x-0">
          <AlertDialogCancel
            className="mt-0 h-auto min-h-9 min-w-0 whitespace-normal [overflow-wrap:anywhere]"
            disabled={isPending}
          >
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            className="h-auto min-h-9 min-w-0 whitespace-normal [overflow-wrap:anywhere]"
            onClick={(event) => {
              if (!closeOnConfirm) event.preventDefault();
              onConfirm();
            }}
            disabled={isPending}
          >
            {isPending ? pendingText : confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
