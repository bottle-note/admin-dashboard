import { useCallback, useEffect, useRef, useState } from 'react';
import { useAlcoholMerge, useAlcoholMergePreview } from '@/hooks/useAlcoholMerges';
import { getErrorMessage } from '@/lib/api-error';
import type { AlcoholMergePreview, AlcoholMergeRequest, AlcoholMergeWhisky } from '@/types/api';

export interface WhiskyMergeSelection {
  base: AlcoholMergeWhisky | null;
  duplicates: AlcoholMergeWhisky[];
}

interface PreviewSnapshot {
  request: AlcoholMergeRequest;
  result: AlcoholMergePreview;
  revision: number;
}

interface MergeFailure {
  request: AlcoholMergeRequest;
  base: AlcoholMergeWhisky;
  message: string;
}

function matchesRequest(request: AlcoholMergeRequest, result: AlcoholMergePreview) {
  return (
    request.baseAlcoholId === result.base.alcoholId &&
    request.duplicateAlcoholIds.length === result.duplicates.length &&
    request.duplicateAlcoholIds.every((id, i) => result.duplicates[i]?.alcohol.alcoholId === id)
  );
}

export function useWhiskyMerge(
  selection: WhiskyMergeSelection,
  onChange: (selection: WhiskyMergeSelection) => void,
  onMerged: (request: AlcoholMergeRequest, base: AlcoholMergeWhisky) => void,
  active = true,
  onMergeStarted?: () => void
) {
  const [preview, setPreview] = useState<PreviewSnapshot | null>(null);
  const [confirmation, setConfirmation] = useState<PreviewSnapshot | null>(null);
  const [previewMismatch, setPreviewMismatch] = useState<string | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [executingPreview, setExecutingPreview] = useState<AlcoholMergePreview | null>(null);
  const [failedMerge, setFailedMerge] = useState<MergeFailure | null>(null);
  const [previousActive, setPreviousActive] = useState(active);
  const revision = useRef(0);
  const mounted = useRef(true);
  const submitting = useRef(false);
  const previewMutation = useAlcoholMergePreview();
  const mergeMutation = useAlcoholMerge();
  const isBusy = previewMutation.isPending || mergeMutation.isPending;
  const ids = [selection.base?.alcoholId, ...selection.duplicates.map((item) => item.alcoholId)];
  const canPreview = Boolean(
    selection.base &&
    selection.duplicates.length >= 1 &&
    selection.duplicates.length <= 10 &&
    ids.every((id) => Number.isSafeInteger(id) && Number(id) > 0) &&
    new Set(ids).size === ids.length
  );

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      revision.current += 1;
    };
  }, []);

  const resetPreview = previewMutation.reset;
  const clearApproval = useCallback(
    (closeReview: boolean) => {
      revision.current += 1;
      setPreview(null);
      setConfirmation(null);
      setPreviewMismatch(null);
      if (closeReview) setIsReviewOpen(false);
      resetPreview();
    },
    [resetPreview]
  );
  const invalidatePreview = useCallback(() => clearApproval(true), [clearApproval]);

  if (previousActive !== active) {
    setPreviousActive(active);
    setPreview(null);
    setConfirmation(null);
    setPreviewMismatch(null);
    setIsReviewOpen(false);
  }

  useEffect(
    () => () => {
      revision.current += 1;
    },
    [active]
  );

  const changeSelection = (next: WhiskyMergeSelection) => {
    if (isBusy || submitting.current) return;
    invalidatePreview();
    mergeMutation.reset();
    onChange(next);
  };

  const selectBase = (base: AlcoholMergeWhisky) => {
    if (selection.duplicates.some((item) => item.alcoholId === base.alcoholId)) return;
    changeSelection({ ...selection, base });
  };

  const addDuplicate = (whisky: AlcoholMergeWhisky) => {
    if (
      selection.duplicates.length >= 10 ||
      whisky.alcoholId === selection.base?.alcoholId ||
      selection.duplicates.some((item) => item.alcoholId === whisky.alcoholId)
    )
      return;
    changeSelection({ ...selection, duplicates: [...selection.duplicates, whisky] });
  };

  const requestPreview = () => {
    if (!canPreview || !selection.base || isBusy || submitting.current) return;
    clearApproval(false);
    mergeMutation.reset();
    const request: AlcoholMergeRequest = {
      baseAlcoholId: selection.base.alcoholId,
      duplicateAlcoholIds: selection.duplicates.map((item) => item.alcoholId),
    };
    const requestRevision = revision.current;
    previewMutation.mutate(request, {
      onSuccess: (result) => {
        if (!mounted.current || requestRevision !== revision.current) return;
        if (!matchesRequest(request, result)) {
          setPreviewMismatch('미리보기 대상이 선택한 위스키와 다릅니다. 다시 확인하세요.');
          return;
        }
        setPreview({ request, result, revision: requestRevision });
        setIsReviewOpen(true);
      },
    });
  };

  const confirmMerge = () => {
    const approved = confirmation;
    if (
      !approved ||
      approved !== preview ||
      approved.revision !== revision.current ||
      isBusy ||
      submitting.current
    )
      return;
    if (
      approved.request.baseAlcoholId !== selection.base?.alcoholId ||
      approved.request.duplicateAlcoholIds.length !== selection.duplicates.length ||
      !approved.request.duplicateAlcoholIds.every(
        (id, i) => selection.duplicates[i]?.alcoholId === id
      )
    ) {
      invalidatePreview();
      return;
    }
    submitting.current = true;
    onMergeStarted?.();
    setFailedMerge(null);
    setExecutingPreview(approved.result);
    clearApproval(false);
    mergeMutation.mutate(
      {
        baseAlcoholId: approved.request.baseAlcoholId,
        duplicateAlcoholIds: [...approved.request.duplicateAlcoholIds],
      },
      {
        onSuccess: (_, request) => {
          if (mounted.current) onMerged(request, approved.result.base);
        },
        onError: (error, request) => {
          if (mounted.current) {
            setFailedMerge({
              request: { ...request, duplicateAlcoholIds: [...request.duplicateAlcoholIds] },
              base: approved.result.base,
              message: getErrorMessage(error),
            });
          }
        },
        onSettled: () => {
          submitting.current = false;
          if (mounted.current) setExecutingPreview(null);
        },
      }
    );
  };

  return {
    preview: preview?.result ?? null,
    confirmation: confirmation?.result ?? null,
    canPreview,
    isReviewOpen,
    executingPreview,
    invalidatePreview,
    isBusy,
    isPreviewPending: previewMutation.isPending,
    isMergePending: mergeMutation.isPending,
    previewError:
      previewMismatch ?? (previewMutation.isError ? getErrorMessage(previewMutation.error) : null),
    failedMerge,
    clearMergeFailure: () => setFailedMerge(null),
    selectBase,
    clearBase: () => changeSelection({ ...selection, base: null }),
    addDuplicate,
    clearDuplicates: () => changeSelection({ ...selection, duplicates: [] }),
    removeDuplicate: (id: number) =>
      changeSelection({
        ...selection,
        duplicates: selection.duplicates.filter((item) => item.alcoholId !== id),
      }),
    requestPreview,
    openConfirmation: () => {
      if (preview && !isBusy) setConfirmation(preview);
    },
    closeConfirmation: () => setConfirmation(null),
    confirmMerge,
  };
}
