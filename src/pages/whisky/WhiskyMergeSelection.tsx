import { Check, Loader2, X } from 'lucide-react';
import { WhiskySearchSelect } from '@/components/common/WhiskySearchSelect';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { WhiskyMergeIdentity } from './WhiskyMergeIdentity';
import type { useWhiskyMerge, WhiskyMergeSelection } from './useWhiskyMerge';

export function WhiskyMergeSelectionPanel({
  selection,
  workflow,
  mergedIds,
}: {
  selection: WhiskyMergeSelection;
  workflow: ReturnType<typeof useWhiskyMerge>;
  mergedIds: number[];
}) {
  const excludedIds = [
    ...mergedIds,
    ...selection.duplicates.map((item) => item.alcoholId),
    ...(selection.base ? [selection.base.alcoholId] : []),
  ];
  return (
    <div className="space-y-5">
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.4fr)]">
        <Card
          role="region"
          aria-labelledby="merge-base-title"
          className="min-w-0 border-emerald-200 shadow-sm dark:border-emerald-900"
        >
          <CardHeader className="gap-2 p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 id="merge-base-title" className="font-semibold">
                남길 위스키
              </h3>
              <Badge
                variant="outline"
                className="gap-1 border-emerald-200 text-emerald-800 dark:border-emerald-900 dark:text-emerald-200"
              >
                <Check className="h-3 w-3" aria-hidden="true" /> 유지
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              병합 후 사용할 이름과 이미지가 있는 위스키 1개를 고르세요.
            </p>
          </CardHeader>
          <CardContent className="space-y-4 p-5 pt-0">
            <WhiskySearchSelect
              onSelect={workflow.selectBase}
              excludeIds={excludedIds}
              disabled={workflow.isBusy}
            />
            {selection.base ? (
              <div className="flex items-start gap-2 rounded-lg border bg-emerald-50/40 p-3 dark:bg-emerald-950/20">
                <WhiskyMergeIdentity whisky={selection.base} />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  aria-label="기준 위스키 선택 해제"
                  disabled={workflow.isBusy}
                  onClick={workflow.clearBase}
                >
                  <X aria-hidden="true" />
                </Button>
              </div>
            ) : (
              <p className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
                이름으로 검색해 남길 위스키를 선택하세요.
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              이 위스키의 이름·이미지·설명을 유지합니다.
            </p>
          </CardContent>
        </Card>

        <Card role="region" aria-labelledby="merge-duplicates-title" className="min-w-0 shadow-sm">
          <CardHeader className="gap-2 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 id="merge-duplicates-title" className="font-semibold">
                합칠 중복 위스키
              </h3>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{selection.duplicates.length} / 10개</Badge>
                {selection.duplicates.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={workflow.isBusy}
                    onClick={workflow.clearDuplicates}
                  >
                    전체 해제
                  </Button>
                )}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              기록을 남길 위스키로 옮긴 뒤 삭제할 대상을 고르세요.
            </p>
          </CardHeader>
          <CardContent className="space-y-3 p-5 pt-0">
            <WhiskySearchSelect
              onSelect={workflow.addDuplicate}
              excludeIds={excludedIds}
              disabled={workflow.isBusy || selection.duplicates.length >= 10}
            />
            {selection.duplicates.length ? (
              <ul
                aria-label="선택한 중복 위스키"
                tabIndex={0}
                className="max-h-80 divide-y overflow-y-auto overscroll-contain rounded-lg border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {selection.duplicates.map((whisky) => (
                  <li key={whisky.alcoholId} className="flex items-start gap-2 p-3">
                    <WhiskyMergeIdentity whisky={whisky} />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      aria-label={`${whisky.korName} 선택 해제`}
                      disabled={workflow.isBusy}
                      onClick={() => workflow.removeDuplicate(whisky.alcoholId)}
                    >
                      <X aria-hidden="true" />
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
                중복 위스키를 최대 10개까지 추가하세요.
              </p>
            )}
            {selection.duplicates.length === 10 && (
              <p className="text-xs text-muted-foreground">
                10개를 선택했습니다. 다른 위스키를 추가하려면 선택한 대상을 해제하세요.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
      {workflow.previewError && (
        <p
          role="alert"
          className="rounded-lg border border-destructive/30 p-4 text-sm text-destructive"
        >
          {workflow.previewError}
        </p>
      )}
      <div className="sticky bottom-0 z-10 flex flex-col gap-3 border-t bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {workflow.canPreview
            ? `중복 ${selection.duplicates.length}개의 기록을 확인할 준비가 됐습니다.`
            : '남길 위스키 1개와 중복 위스키 1~10개를 선택하세요.'}
        </p>
        <Button
          type="button"
          className="w-full sm:w-auto"
          disabled={!workflow.canPreview || workflow.isBusy}
          onClick={workflow.requestPreview}
        >
          {workflow.isPreviewPending && <Loader2 className="animate-spin" aria-hidden="true" />}
          {workflow.isPreviewPending ? '미리보기 확인 중...' : '미리보기 확인'}
        </Button>
      </div>
    </div>
  );
}
