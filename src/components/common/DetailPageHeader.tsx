/**
 * 상세 페이지 헤더 컴포넌트
 * - 뒤로가기 버튼
 * - 제목 및 부제목
 * - 액션 버튼 영역
 */

import type { ReactNode } from 'react';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

type DetailPageHeaderAction =
  | {
      mode: 'create';
      onCreate: () => void;
      isPending?: boolean;
      disabled?: boolean;
    }
  | {
      mode: 'edit';
      onUpdate: () => void;
      onDelete?: () => void;
      isPending?: boolean;
      disabled?: boolean;
    }
  | {
      mode: 'readonly';
    };

/**
 * DetailPageHeader 컴포넌트의 props
 * @param title - 페이지 제목
 * @param subtitle - 부제목 (선택)
 * @param onBack - 뒤로가기 클릭 시 호출되는 콜백
 * @param actions - 액션 버튼들 (저장, 삭제 등)
 */
export interface DetailPageHeaderProps {
  title: string;
  subtitle?: string;
  onBack: () => void;
  action?: DetailPageHeaderAction;
  actions?: ReactNode;
}

export function DetailPageHeader({
  title,
  subtitle,
  onBack,
  action,
  actions,
}: DetailPageHeaderProps) {
  const hasActions = Boolean(actions) || (action && action.mode !== 'readonly');

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-4">
        <Button type="button" variant="ghost" size="icon" onClick={onBack} aria-label="뒤로가기">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">{title}</h1>
          {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {hasActions && (
        <div className="flex flex-wrap gap-2 sm:justify-end">
          {actions}
          {action && <DetailPageHeaderActionButtons action={action} />}
        </div>
      )}
    </div>
  );
}

function DetailPageHeaderActionButtons({ action }: { action: DetailPageHeaderAction }) {
  if (action.mode === 'readonly') return null;

  const isDisabled = action.disabled || action.isPending;

  if (action.mode === 'create') {
    return (
      <Button type="button" onClick={action.onCreate} disabled={isDisabled}>
        <Save className="mr-2 h-4 w-4" />
        {action.isPending ? '등록 중...' : '등록'}
      </Button>
    );
  }

  return (
    <>
      {action.onDelete && (
        <Button
          type="button"
          variant="destructive"
          onClick={action.onDelete}
          disabled={isDisabled}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          삭제
        </Button>
      )}
      <Button type="button" onClick={action.onUpdate} disabled={isDisabled}>
        <Save className="mr-2 h-4 w-4" />
        {action.isPending ? '수정 중...' : '수정'}
      </Button>
    </>
  );
}
