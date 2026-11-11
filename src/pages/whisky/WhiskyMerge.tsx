import { useLayoutEffect, useRef, useState } from 'react';
import { ArrowLeft, Check, CheckCircle2, Loader2 } from 'lucide-react';
import { Link } from 'react-router';
import { PageHeader } from '@/components/common/PageHeader';
import { TabBar } from '@/components/common/TabBar';
import { Button } from '@/components/ui/button';
import { useUrlParams } from '@/hooks/useUrlParams';
import type { AlcoholMergeWhisky } from '@/types/api';
import { WhiskyMergeHistory } from './WhiskyMergeHistory';
import { WhiskyMergeSelectionPanel } from './WhiskyMergeSelection';
import { WhiskyMergeReview } from './WhiskyMergeReview';
import { useWhiskyMerge, type WhiskyMergeSelection } from './useWhiskyMerge';

const TABS = [
  { value: 'merge', label: '병합하기' },
  { value: 'history', label: '병합 이력' },
] as const;

export function WhiskyMergePage() {
  const { params, update } = useUrlParams();
  const tab = params.get('tab') === 'history' ? 'history' : 'merge';
  const [selection, setSelection] = useState<WhiskyMergeSelection>({ base: null, duplicates: [] });
  const [mergedIds, setMergedIds] = useState<number[]>([]);
  const [completed, setCompleted] = useState<{
    base: AlcoholMergeWhisky;
    duplicateCount: number;
  } | null>(null);
  const selectionHeading = useRef<HTMLHeadingElement>(null);
  const reviewHeading = useRef<HTMLHeadingElement>(null);
  const completionPanel = useRef<HTMLDivElement>(null);
  const failurePanel = useRef<HTMLDivElement>(null);
  const activePanel = useRef<HTMLDivElement>(null);
  const focusCompletion = useRef(false);
  const focusSelection = useRef(false);
  const previous = useRef({ reviewing: false });
  const viewHistory = (baseId?: number) =>
    update({
      tab: 'history',
      baseAlcoholId: baseId ? String(baseId) : null,
      duplicateAlcoholId: null,
      page: null,
    });
  const workflow = useWhiskyMerge(
    selection,
    setSelection,
    (request, base) => {
      setSelection({ base, duplicates: [] });
      setMergedIds((current) => [...current, ...request.duplicateAlcoholIds]);
      setCompleted({ base, duplicateCount: request.duplicateAlcoholIds.length });
      focusCompletion.current = true;
      viewHistory(request.baseAlcoholId);
    },
    tab === 'merge',
    () => setCompleted(null)
  );
  const reviewing = tab === 'merge' && workflow.isReviewOpen;

  useLayoutEffect(() => {
    if (tab === 'history' && focusCompletion.current && completionPanel.current) {
      focusCompletion.current = false;
      completionPanel.current.focus();
    } else if (tab === 'merge' && focusSelection.current) {
      focusSelection.current = false;
      selectionHeading.current?.focus();
    } else if (tab === 'merge' && previous.current.reviewing !== reviewing) {
      (reviewing ? reviewHeading : selectionHeading).current?.focus();
    }
    previous.current = { reviewing };
  }, [tab, reviewing, workflow.isMergePending, completed]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="위스키 병합"
        description="남길 위스키를 정하고 중복 데이터와 연결된 기록을 한곳으로 모읍니다."
      />
      <TabBar
        tabs={TABS}
        value={tab}
        ariaLabel="위스키 병합"
        onChange={(value) => {
          if (workflow.isMergePending) return;
          workflow.invalidatePreview();
          update({ tab: value === 'merge' ? null : value });
        }}
      />
      {workflow.failedMerge && (
        <div
          ref={failurePanel}
          tabIndex={-1}
          role="alert"
          className="space-y-3 rounded-lg border border-destructive/30 p-4 text-sm outline-none [overflow-wrap:anywhere]"
        >
          <p className="font-medium text-destructive">병합 결과를 확인해야 합니다.</p>
          <p>{workflow.failedMerge.message}</p>
          <p>
            중복 {workflow.failedMerge.request.duplicateAlcoholIds.length}개 →{' '}
            {workflow.failedMerge.base.korName} (#{workflow.failedMerge.request.baseAlcoholId})
          </p>
          <p className="text-xs text-muted-foreground">
            요청한 중복 ID:{' '}
            {workflow.failedMerge.request.duplicateAlcoholIds.map((id) => `#${id}`).join(', ')}
          </p>
          <p>병합 이력에서 처리 결과를 확인한 뒤 다시 미리보기를 조회하세요.</p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => viewHistory(workflow.failedMerge!.request.baseAlcoholId)}
            >
              병합 이력 확인
            </Button>
            {tab === 'history' && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  workflow.clearMergeFailure();
                  activePanel.current?.focus();
                }}
              >
                결과 확인 완료
              </Button>
            )}
          </div>
        </div>
      )}
      {workflow.isMergePending && !reviewing && (
        <p role="status" className="flex items-center gap-2 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          병합을 처리하고 있습니다. 완료 후 이력에서 결과를 확인합니다.
        </p>
      )}
      <div
        ref={activePanel}
        id={`panel-${tab}`}
        role="tabpanel"
        aria-labelledby={`tab-${tab}`}
        tabIndex={0}
        className="space-y-5"
      >
        {tab === 'merge' ? (
          <>
            <ol aria-label="병합 진행" className="flex flex-wrap items-center gap-5 text-sm">
              <li
                aria-current={!reviewing ? 'step' : undefined}
                className="flex items-center gap-2"
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs ${!reviewing ? 'border-primary bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
                >
                  {reviewing ? <Check className="h-3 w-3" aria-hidden="true" /> : '1'}
                </span>
                <span className={!reviewing ? 'font-medium' : 'text-muted-foreground'}>
                  대상 선택
                </span>
              </li>
              <li aria-current={reviewing ? 'step' : undefined} className="flex items-center gap-2">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs ${reviewing ? 'border-primary bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
                >
                  2
                </span>
                <span className={reviewing ? 'font-medium' : 'text-muted-foreground'}>
                  변경 내역 검토
                </span>
              </li>
            </ol>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                {reviewing ? (
                  <h2
                    ref={reviewHeading}
                    tabIndex={-1}
                    className="text-lg font-semibold outline-none"
                  >
                    병합 내용 검토
                  </h2>
                ) : (
                  <h2
                    ref={selectionHeading}
                    tabIndex={-1}
                    className="text-lg font-semibold outline-none"
                  >
                    대상 선택
                  </h2>
                )}
                <p className="text-sm text-muted-foreground">
                  {reviewing
                    ? '남길 위스키와 삭제할 대상, 옮기거나 삭제할 기록을 확인하세요.'
                    : '한 번에 중복 위스키 10개까지 선택할 수 있습니다.'}
                </p>
              </div>
              {reviewing && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={workflow.isBusy}
                  onClick={workflow.invalidatePreview}
                >
                  <ArrowLeft aria-hidden="true" />
                  대상 다시 선택
                </Button>
              )}
            </div>
            {reviewing ? (
              <WhiskyMergeReview
                selection={selection}
                workflow={workflow}
                onExecutionDialogClosed={() => {
                  if (failurePanel.current) (reviewHeading.current ?? failurePanel.current).focus();
                }}
              />
            ) : (
              <WhiskyMergeSelectionPanel
                selection={selection}
                workflow={workflow}
                mergedIds={mergedIds}
              />
            )}
          </>
        ) : (
          <>
            {completed && (
              <div
                ref={completionPanel}
                tabIndex={-1}
                role="region"
                aria-label="병합 완료"
                className="space-y-3 rounded-lg border border-emerald-200 bg-emerald-50/40 p-4 outline-none dark:border-emerald-900 dark:bg-emerald-950/20"
              >
                <p className="flex items-center gap-2 font-medium">
                  <CheckCircle2
                    className="h-4 w-4 text-emerald-700 dark:text-emerald-300"
                    aria-hidden="true"
                  />
                  병합을 완료했습니다.
                </p>
                <p className="text-sm [overflow-wrap:anywhere]">
                  중복 위스키 {completed.duplicateCount}개를 {completed.base.korName} (#
                  {completed.base.alcoholId})로 합쳤습니다.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link
                    to={`/whisky/${completed.base.alcoholId}`}
                    className="text-sm underline underline-offset-4"
                  >
                    남긴 위스키 상세 보기
                  </Link>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      focusSelection.current = true;
                      setCompleted(null);
                      workflow.invalidatePreview();
                      update({ tab: null });
                    }}
                  >
                    다른 중복 병합
                  </Button>
                </div>
              </div>
            )}
            <WhiskyMergeHistory />
          </>
        )}
      </div>
    </div>
  );
}
