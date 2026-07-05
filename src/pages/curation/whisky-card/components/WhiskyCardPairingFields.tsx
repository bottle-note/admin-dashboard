import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type PointerEvent,
} from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { GripVertical, Loader2, Plus, Upload } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useImageUpload } from '@/hooks/useImageUpload';
import { cn } from '@/lib/utils';

import {
  createEmptyPairingFood,
  type PairingFoodValue,
  type WhiskyCardCurationFormModel,
  type WhiskyCardCurationFormState,
} from '../whisky-card-curation.schema';

const PAIRING_DRAG_HANDLE_SELECTOR = '[data-pairing-drag-handle="true"]';
const PAIRING_IMAGE_ACCEPT = 'image/png,image/jpeg,image/webp';
const SUPPORTED_PAIRING_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

interface WhiskyCardPairingFieldsProps {
  index: number;
  formModel: WhiskyCardCurationFormModel;
  onUploadingChange?: (isUploading: boolean) => void;
}

export function WhiskyCardPairingFields({
  index,
  formModel,
  onUploadingChange,
}: WhiskyCardPairingFieldsProps) {
  const pairingModel = formModel.pairings;
  const form = useFormContext<WhiskyCardCurationFormState>();
  const pairings =
    useWatch({ control: form.control, name: `alcohols.${index}.pairings` as const }) ?? [];
  const itemErrors = form.formState.errors.alcohols?.[index]?.pairings;
  const { upload: uploadPairingImage } = useImageUpload({
    rootPath: pairingModel?.itemImageUploadPath ?? 'admin/curation',
  });
  const [uploadingPairingKeys, setUploadingPairingKeys] = useState<Set<string>>(() => new Set());
  const [draggedPairingIndex, setDraggedPairingIndex] = useState<number | null>(null);
  const [dragOverPairingIndex, setDragOverPairingIndex] = useState<number | null>(null);
  const activePairingDragHandleIndexRef = useRef<number | null>(null);
  const localPairingImageUrlsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    onUploadingChange?.(uploadingPairingKeys.size > 0);
  }, [onUploadingChange, uploadingPairingKeys.size]);

  useEffect(() => {
    const localPairingImageUrls = localPairingImageUrlsRef.current;

    return () => {
      localPairingImageUrls.forEach((url) => URL.revokeObjectURL(url));
      localPairingImageUrls.clear();
    };
  }, []);

  if (!pairingModel) return null;

  const updatePairings = (
    nextOrUpdater: PairingFoodValue[] | ((current: PairingFoodValue[]) => PairingFoodValue[])
  ) => {
    const currentPairings = form.getValues(`alcohols.${index}.pairings` as const) ?? [];
    const nextPairings =
      typeof nextOrUpdater === 'function' ? nextOrUpdater(currentPairings) : nextOrUpdater;

    form.setValue(`alcohols.${index}.pairings` as const, nextPairings, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };
  const canAddPairing = pairings.length < pairingModel.maxItems;
  const canRemovePairing = pairings.length > pairingModel.minItems;

  const setPairingImageUploading = (pairingKey: string, isUploading: boolean) => {
    setUploadingPairingKeys((prev) => {
      const next = new Set(prev);
      if (isUploading) {
        next.add(pairingKey);
      } else {
        next.delete(pairingKey);
      }
      return next;
    });
  };

  const revokeLocalPairingImageUrl = (url: string) => {
    if (!localPairingImageUrlsRef.current.has(url)) return;

    URL.revokeObjectURL(url);
    localPairingImageUrlsRef.current.delete(url);
  };

  const handlePairingImageChange = async (
    pairingIndex: number,
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !pairingModel.hasItemImageUrl) return;

    if (!SUPPORTED_PAIRING_IMAGE_TYPES.has(file.type)) {
      form.setError(`alcohols.${index}.pairings.${pairingIndex}.itemImageUrl` as const, {
        type: 'validate',
        message: 'PNG, JPG, WEBP 이미지만 업로드할 수 있습니다.',
      });
      return;
    }

    const pairingKey = getPairingKey(index, pairingIndex);
    const path = `alcohols.${index}.pairings.${pairingIndex}.itemImageUrl` as const;
    const previewUrl = URL.createObjectURL(file);
    localPairingImageUrlsRef.current.add(previewUrl);
    form.clearErrors(path);
    form.setValue(path, previewUrl, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setPairingImageUploading(pairingKey, true);

    try {
      const uploadedUrl = await uploadPairingImage(file);
      if (!uploadedUrl) {
        if (form.getValues(path) === previewUrl) {
          form.setValue(path, '', { shouldDirty: true, shouldValidate: true });
        }
        return;
      }

      form.setValue(path, uploadedUrl, {
        shouldDirty: true,
        shouldValidate: true,
      });
    } finally {
      revokeLocalPairingImageUrl(previewUrl);
      setPairingImageUploading(pairingKey, false);
    }
  };

  const handleRemovePairingImage = (pairingIndex: number) => {
    const path = `alcohols.${index}.pairings.${pairingIndex}.itemImageUrl` as const;
    const currentImageUrl = form.getValues(path);
    if (currentImageUrl) {
      revokeLocalPairingImageUrl(currentImageUrl);
    }
    form.setValue(path, '', {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const resetPairingDragState = () => {
    activePairingDragHandleIndexRef.current = null;
    setDraggedPairingIndex(null);
    setDragOverPairingIndex(null);
  };

  const isPairingDragHandleTarget = (target: EventTarget | null) =>
    target instanceof Element && target.closest(PAIRING_DRAG_HANDLE_SELECTOR) !== null;

  const handlePairingDragHandlePointerDown = (
    pairingIndex: number,
    event: PointerEvent<HTMLButtonElement>
  ) => {
    activePairingDragHandleIndexRef.current = pairingIndex;
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handlePairingDragHandlePointerEnd = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    activePairingDragHandleIndexRef.current = null;
  };

  const handlePairingDragStart = (pairingIndex: number, event: DragEvent<HTMLDivElement>) => {
    const isHandleDrag =
      isPairingDragHandleTarget(event.target) ||
      activePairingDragHandleIndexRef.current === pairingIndex;

    if (!isHandleDrag) {
      event.preventDefault();
      resetPairingDragState();
      return;
    }

    setDraggedPairingIndex(pairingIndex);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(pairingIndex));
  };

  const handlePairingDragOver = (pairingIndex: number, event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDragOverPairingIndex(pairingIndex);
  };

  const handlePairingDrop = (targetIndex: number, event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();

    const transferredIndex = event.dataTransfer.getData('text/plain');
    const sourceIndex =
      draggedPairingIndex ?? (transferredIndex === '' ? Number.NaN : Number(transferredIndex));

    if (
      Number.isInteger(sourceIndex) &&
      sourceIndex >= 0 &&
      sourceIndex < pairings.length &&
      sourceIndex !== targetIndex
    ) {
      updatePairings((currentPairings) => {
        if (sourceIndex >= currentPairings.length || targetIndex >= currentPairings.length) {
          return currentPairings;
        }

        const nextPairings = [...currentPairings];
        const [movedPairing] = nextPairings.splice(sourceIndex, 1);
        if (movedPairing) {
          nextPairings.splice(targetIndex, 0, movedPairing);
        }
        return nextPairings;
      });
      void form.trigger(`alcohols.${index}.pairings` as const);
    }

    resetPairingDragState();
  };

  return (
    <div className="mt-4 space-y-3 rounded-md border bg-muted/20 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="text-sm font-semibold">
            {pairingModel.label}
            {pairingModel.minItems > 0 && <span className="ml-1 text-destructive">*</span>}
          </h4>
          <p className="mt-1 text-xs text-muted-foreground">
            {pairingModel.minItems}-{pairingModel.maxItems}개까지 등록할 수 있습니다.
          </p>
        </div>
      </div>

      {typeof itemErrors?.message === 'string' && (
        <p className="text-sm text-destructive">{itemErrors.message}</p>
      )}

      <div className="space-y-3">
        {pairings.map((pairing, pairingIndex) => {
          const pairingError = Array.isArray(itemErrors) ? itemErrors[pairingIndex] : undefined;
          const pairingLabel = `${pairingModel.label} ${pairingIndex + 1}`;
          const pairingKey = getPairingKey(index, pairingIndex);
          const isImageUploading = uploadingPairingKeys.has(pairingKey);
          const imageInputId = `whisky-${index}-pairing-${pairingIndex}-image`;

          return (
            <div
              key={pairingIndex}
              draggable
              aria-label={`${index + 1}번 위스키 ${pairingIndex + 1}번 페어링 음식 순서 변경`}
              className={cn(
                'rounded-[10px] border bg-background p-4 transition-colors',
                dragOverPairingIndex === pairingIndex && draggedPairingIndex !== pairingIndex
                  ? 'border-primary bg-primary/5'
                  : 'border-border'
              )}
              onDragStart={(event) => handlePairingDragStart(pairingIndex, event)}
              onDragOver={(event) => handlePairingDragOver(pairingIndex, event)}
              onDrop={(event) => handlePairingDrop(pairingIndex, event)}
              onDragLeave={() => setDragOverPairingIndex(null)}
              onDragEnd={resetPairingDragState}
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <button
                    type="button"
                    data-pairing-drag-handle="true"
                    aria-label={`${pairingLabel} 순서 변경`}
                    className="flex h-8 w-8 shrink-0 cursor-grab items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:cursor-grabbing"
                    onPointerDown={(event) =>
                      handlePairingDragHandlePointerDown(pairingIndex, event)
                    }
                    onPointerUp={handlePairingDragHandlePointerEnd}
                    onPointerCancel={handlePairingDragHandlePointerEnd}
                  >
                    <GripVertical className="h-4 w-4" />
                  </button>
                  <h5 className="truncate text-sm font-semibold">
                    {pairingLabel}
                    {pairingModel.minItems > 0 && <span className="ml-1 text-destructive">*</span>}
                  </h5>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 rounded-md bg-destructive/20 px-2 text-xs font-medium text-destructive hover:bg-destructive/30 hover:text-destructive"
                  aria-label={`${index + 1}번 위스키 ${pairingIndex + 1}번 페어링 음식 삭제`}
                  onClick={() =>
                    updatePairings((currentPairings) =>
                      currentPairings.filter((_, itemIndex) => itemIndex !== pairingIndex)
                    )
                  }
                  disabled={!canRemovePairing || isImageUploading}
                >
                  삭제
                </Button>
              </div>

              <div className="space-y-3 pl-10">
                <div className="grid gap-2 md:grid-cols-[9rem_minmax(0,1fr)] md:items-center">
                  <label
                    htmlFor={`${getPairingKey(index, pairingIndex)}-name`}
                    className="text-sm font-semibold text-foreground"
                  >
                    {pairingModel.itemNameLabel}
                    <span className="ml-1 text-destructive">*</span>
                  </label>
                  <div className="space-y-1">
                    <Input
                      id={`${getPairingKey(index, pairingIndex)}-name`}
                      aria-label={`${index + 1}번 위스키 ${pairingIndex + 1}번 페어링 음식명`}
                      maxLength={pairingModel.itemNameMaxLength}
                      {...form.register(
                        `alcohols.${index}.pairings.${pairingIndex}.itemName` as const
                      )}
                      placeholder="예: 바닐라 아이스크림"
                    />
                    {pairingError?.itemName?.message && (
                      <p className="text-sm text-destructive">{pairingError.itemName.message}</p>
                    )}
                  </div>
                </div>

                {pairingModel.hasItemImageUrl && (
                  <div className="grid gap-2 md:grid-cols-[9rem_minmax(0,1fr)] md:items-start">
                    <span className="text-sm font-semibold text-foreground">
                      {pairingModel.itemImageUrlLabel}
                    </span>
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-dashed bg-muted/20">
                          {pairing.itemImageUrl ? (
                            <img
                              src={pairing.itemImageUrl}
                              alt={`${index + 1}번 위스키 ${pairingIndex + 1}번 페어링 음식 이미지`}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex flex-col items-center gap-1 text-xs text-muted-foreground">
                              <Upload className="h-5 w-5" aria-hidden="true" />
                              음식 이미지
                            </div>
                          )}
                        </div>
                        <input
                          id={imageInputId}
                          type="file"
                          accept={PAIRING_IMAGE_ACCEPT}
                          className="sr-only"
                          aria-label={`${index + 1}번 위스키 ${pairingIndex + 1}번 페어링 음식 이미지 파일 선택`}
                          onChange={(event) => void handlePairingImageChange(pairingIndex, event)}
                          disabled={isImageUploading}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById(imageInputId)?.click()}
                          disabled={isImageUploading}
                        >
                          {isImageUploading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Upload className="h-4 w-4" />
                          )}
                          {isImageUploading ? '업로드 중' : '이미지 업로드'}
                        </Button>
                        {pairing.itemImageUrl && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemovePairingImage(pairingIndex)}
                            disabled={isImageUploading}
                          >
                            이미지 삭제
                          </Button>
                        )}
                      </div>
                      {pairingError?.itemImageUrl?.message && (
                        <p className="text-sm text-destructive">
                          {pairingError.itemImageUrl.message}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="grid gap-2 md:grid-cols-[9rem_minmax(0,1fr)] md:items-start">
                  <label
                    htmlFor={`${getPairingKey(index, pairingIndex)}-note`}
                    className="text-sm font-semibold text-foreground"
                  >
                    {pairingModel.pairingNoteLabel}
                    <span className="ml-1 text-destructive">*</span>
                  </label>
                  <div className="space-y-1">
                    <Textarea
                      id={`${getPairingKey(index, pairingIndex)}-note`}
                      aria-label={`${index + 1}번 위스키 ${pairingIndex + 1}번 페어링 설명`}
                      rows={3}
                      maxLength={pairingModel.pairingNoteMaxLength}
                      {...form.register(
                        `alcohols.${index}.pairings.${pairingIndex}.pairingNote` as const
                      )}
                      placeholder="위스키의 풍미와 잘 어울리는 이유를 입력하세요."
                    />
                    {pairingError?.pairingNote?.message && (
                      <p className="text-sm text-destructive">{pairingError.pairingNote.message}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Button
        type="button"
        variant="secondary"
        className="h-12 w-full rounded-[10px] font-semibold"
        onClick={() =>
          updatePairings((currentPairings) => [...currentPairings, createEmptyPairingFood()])
        }
        disabled={!canAddPairing}
      >
        <Plus className="h-4 w-4" />
        페어링 음식 추가
      </Button>
    </div>
  );
}

function getPairingKey(whiskyIndex: number, pairingIndex: number): string {
  return `${whiskyIndex}-${pairingIndex}`;
}
