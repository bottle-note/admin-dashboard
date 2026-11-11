import { AlertTriangle, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { WhiskyMergePreview } from './WhiskyMergePreview';
import { WhiskyMergeIdentity } from './WhiskyMergeIdentity';
import { WhiskyMergeConfirmation } from './WhiskyMergeConfirmation';
import type { useWhiskyMerge, WhiskyMergeSelection } from './useWhiskyMerge';

export function WhiskyMergeReview({
  selection,
  workflow,
  onExecutionDialogClosed,
}: {
  selection: WhiskyMergeSelection;
  workflow: ReturnType<typeof useWhiskyMerge>;
  onExecutionDialogClosed: () => void;
}) {
  const snapshot = workflow.preview ?? workflow.executingPreview;
  const base = snapshot?.base ?? selection.base;
  const duplicates = snapshot?.duplicates.map((item) => item.alcohol) ?? selection.duplicates;
  return (
    <div className="space-y-5">
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <Card
          role="region"
          aria-label="검토할 병합 대상"
          className="min-w-0 shadow-sm xl:order-last"
        >
          <CardContent className="space-y-4 p-5">
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                <Check className="h-4 w-4" aria-hidden="true" />
                남길 위스키
              </h3>
              {base && <WhiskyMergeIdentity whisky={base} />}
            </div>
            <div className="space-y-3 border-t pt-4">
              <h3 className="text-sm font-semibold">삭제할 중복 위스키 {duplicates.length}개</h3>
              <ul
                aria-label="삭제할 중복 위스키 목록"
                tabIndex={0}
                className="max-h-48 divide-y overflow-y-auto overscroll-contain rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring xl:max-h-80"
              >
                {duplicates.map((whisky) => (
                  <li
                    key={whisky.alcoholId}
                    className="space-y-1 py-3 [overflow-wrap:anywhere] first:pt-0"
                  >
                    <p className="text-sm font-medium">{whisky.korName}</p>
                    <p className="text-xs text-muted-foreground">{whisky.engName}</p>
                    <p className="font-mono text-xs text-muted-foreground">#{whisky.alcoholId}</p>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
        <Card
          role="region"
          aria-labelledby="merge-preview-title"
          className="min-w-0 shadow-sm"
          aria-busy={workflow.isPreviewPending}
        >
          <CardHeader className="gap-3 p-5 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
            <div className="space-y-1">
              <h3 id="merge-preview-title" className="font-semibold">
                병합 미리보기
              </h3>
              <p className="text-sm text-muted-foreground">
                전체 합계와 위스키별 내역을 확인합니다.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0"
              disabled={!workflow.canPreview || workflow.isBusy}
              onClick={workflow.requestPreview}
            >
              {workflow.isPreviewPending && <Loader2 className="animate-spin" aria-hidden="true" />}
              {workflow.isPreviewPending ? '미리보기 갱신 중...' : '미리보기 갱신'}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4 p-5 pt-0" aria-live="polite">
            {workflow.previewError ? (
              <p
                role="alert"
                className="rounded-lg border border-destructive/30 p-4 text-sm text-destructive"
              >
                {workflow.previewError}
              </p>
            ) : workflow.isPreviewPending ? (
              <p role="status" className="p-6 text-center text-sm text-muted-foreground">
                기록을 다시 확인하고 있습니다.
              </p>
            ) : snapshot ? (
              <WhiskyMergePreview preview={snapshot} />
            ) : (
              <p className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
                실행하려면 미리보기를 다시 확인하세요.
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              선택을 바꾸면 미리보기를 다시 확인해야 합니다. 미리보기 이후 데이터가 바뀌면 실제 처리
              건수가 달라질 수 있습니다.
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="sticky bottom-0 z-10 flex flex-col gap-3 border-t bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-start gap-2 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
          <span>
            중복 위스키 {selection.duplicates.length}개는 병합 후 삭제되며 되돌릴 수 없습니다.
          </span>
        </p>
        <WhiskyMergeConfirmation
          workflow={workflow}
          count={selection.duplicates.length}
          onExecutionDialogClosed={onExecutionDialogClosed}
        />
      </div>
    </div>
  );
}
