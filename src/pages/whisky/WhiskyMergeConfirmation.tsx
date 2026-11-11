import { useRef } from 'react';
import { Merge } from 'lucide-react';
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog';
import { Button } from '@/components/ui/button';
import type { AlcoholMergePreview } from '@/types/api';
import { WhiskyMergeIdentity } from './WhiskyMergeIdentity';
import type { useWhiskyMerge } from './useWhiskyMerge';

export function WhiskyMergeConfirmation({
  workflow,
  count,
  onExecutionDialogClosed,
}: {
  workflow: ReturnType<typeof useWhiskyMerge>;
  count: number;
  onExecutionDialogClosed: () => void;
}) {
  const submitted = useRef(false);
  const summary: AlcoholMergePreview | null =
    workflow.confirmation ?? workflow.executingPreview ?? workflow.preview;
  return (
    <DeleteConfirmDialog
      open={Boolean(workflow.confirmation) || workflow.isMergePending}
      onOpenChange={(open) => {
        if (open) {
          submitted.current = false;
          workflow.openConfirmation();
        } else workflow.closeConfirmation();
      }}
      trigger={
        <Button
          type="button"
          variant="destructive"
          className="w-full sm:w-auto"
          disabled={!workflow.preview || workflow.isBusy}
        >
          <Merge aria-hidden="true" />
          중복 위스키 {count}개 병합
        </Button>
      }
      title="위스키 병합 확인"
      description={
        summary ? (
          <div className="space-y-4">
            <p>중복 위스키 {summary.duplicates.length}개를 아래 위스키로 합칩니다.</p>
            <div className="min-w-0 rounded-lg border bg-muted/30 p-3 text-foreground">
              <p className="mb-2 text-xs text-muted-foreground">남길 위스키</p>
              <WhiskyMergeIdentity whisky={summary.base} />
            </div>
          </div>
        ) : undefined
      }
      warningMessage="병합한 중복 위스키는 삭제되며 되돌릴 수 없습니다."
      confirmText="병합 실행"
      pendingText="병합 중..."
      closeOnConfirm={false}
      isPending={workflow.isMergePending}
      onConfirm={() => {
        submitted.current = true;
        workflow.confirmMerge();
      }}
      onCloseAutoFocus={(event) => {
        // 처리 결과로 이동한 뒤 닫히는 창이 이전 버튼으로 초점을 되돌리지 않게 한다.
        if (submitted.current) {
          event.preventDefault();
          onExecutionDialogClosed();
        }
      }}
    />
  );
}
