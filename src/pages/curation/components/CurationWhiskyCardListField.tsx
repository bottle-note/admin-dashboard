import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { GripVertical, Loader2, Plus, Upload, X } from 'lucide-react';

import { FormField } from '@/components/common/FormField';
import { SearchableSelect, type SelectOption } from '@/components/common/SearchableSelect';
import { WhiskySearchSelect, type SelectedWhisky } from '@/components/common/WhiskySearchSelect';
import { useAdminAlcoholDetailLookup, useCategoryReferences } from '@/hooks/useAdminAlcohols';
import { S3UploadPath, useImageUpload } from '@/hooks/useImageUpload';
import { useRegionList } from '@/hooks/useRegions';
import { useToast } from '@/hooks/useToast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  CATEGORY_GROUP_LABELS,
  EMPTY_CATEGORY_REFERENCE_MAP,
  type CategoryReferenceMap,
} from '@/types/api';

import {
  createBottleNoteCurationWhiskyItem,
  createBottleNoteCurationWhiskyItemFromDetail,
  createManualCurationWhiskyItem,
} from '../curation-whisky-card-list.mapper';
import type {
  CurationWhiskyCardListFieldModel,
  CurationWhiskyCardListFormValues,
  CurationWhiskyCardValue,
  CurationWhiskyMirror,
  CurationWhiskyStats,
} from '../curation-whisky-card-list.types';
import { CurationTastingTagCombobox } from './CurationTastingTagCombobox';
import { CurationSectionCard } from './CurationSectionCard';

const WHISKY_DRAG_HANDLE_SELECTOR = '[data-whisky-drag-handle="true"]';
const MANUAL_WHISKY_IMAGE_ACCEPT = 'image/png,image/jpeg,image/webp';
const SUPPORTED_MANUAL_WHISKY_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
type RemovableWhiskyStatsKey = Extract<keyof CurationWhiskyStats, 'rating' | 'totalRatingsCount'>;

export interface CurationWhiskyCardListFieldOptions {
  createEmptyItem?: () => CurationWhiskyCardValue;
  transformItem?: (item: CurationWhiskyCardValue) => CurationWhiskyCardValue;
  renderItemExtra?: (params: {
    fieldId: string;
    index: number;
    item: CurationWhiskyCardValue | undefined;
  }) => ReactNode;
}

interface CurationWhiskyCardListFieldProps extends CurationWhiskyCardListFieldOptions {
  fieldModel: CurationWhiskyCardListFieldModel;
  onImageUploadingChange?: (isUploading: boolean) => void;
  sectionHeader?: {
    stepNumber?: number;
    description?: string;
  };
}

export function CurationWhiskyCardListField({
  fieldModel,
  onImageUploadingChange,
  sectionHeader,
  createEmptyItem = createManualCurationWhiskyItem,
  transformItem = (item) => item,
  renderItemExtra,
}: CurationWhiskyCardListFieldProps) {
  const form = useFormContext<CurationWhiskyCardListFormValues>();
  const fetchAlcoholDetail = useAdminAlcoholDetailLookup();
  const { data: categoryReferenceData } = useCategoryReferences();
  const { data: regionData } = useRegionList({ size: 200, sortOrder: 'ASC' });
  const { upload: uploadManualWhiskyImage } = useImageUpload({
    rootPath: S3UploadPath.CURATION,
  });
  const { showToast } = useToast();
  const [tagInputs, setTagInputs] = useState<Record<string, string>>({});
  const [manualInputFieldIds, setManualInputFieldIds] = useState<Set<string>>(() => new Set());
  const [uploadingManualImageFieldIds, setUploadingManualImageFieldIds] = useState<Set<string>>(
    () => new Set()
  );
  const [pendingAlcoholId, setPendingAlcoholId] = useState<number | null>(null);
  const [draggedAlcoholIndex, setDraggedAlcoholIndex] = useState<number | null>(null);
  const [dragOverAlcoholIndex, setDragOverAlcoholIndex] = useState<number | null>(null);
  const activeWhiskyDragHandleIndexRef = useRef<number | null>(null);
  const localManualImageUrlsRef = useRef<Set<string>>(new Set());
  const alcoholFieldArray = useFieldArray({
    control: form.control,
    name: 'alcohols',
  });
  const watchedAlcohols =
    useWatch({
      control: form.control,
      name: 'alcohols',
    }) ?? [];
  const selectedAlcoholIds = watchedAlcohols
    .map((item) => item.alcohol.alcoholId)
    .filter((id): id is number => typeof id === 'number');

  const isMaxReached = watchedAlcohols.length >= fieldModel.maxItems;
  const isAddingBottleNoteWhisky = pendingAlcoholId !== null;
  const isAddDisabled = isMaxReached || isAddingBottleNoteWhisky;
  const limitDescription = `${fieldModel.minItems}-${fieldModel.maxItems}개까지 등록할 수 있습니다.`;
  const manualCategoryOptions = getCategoryOptions(
    categoryReferenceData ?? EMPTY_CATEGORY_REFERENCE_MAP
  );
  const manualRegionOptions =
    regionData?.items.map((region) => ({ value: region.korName, label: region.korName })) ?? [];

  useEffect(() => {
    onImageUploadingChange?.(uploadingManualImageFieldIds.size > 0);
  }, [onImageUploadingChange, uploadingManualImageFieldIds.size]);

  useEffect(() => {
    const localManualImageUrls = localManualImageUrlsRef.current;

    return () => {
      localManualImageUrls.forEach((url) => URL.revokeObjectURL(url));
      localManualImageUrls.clear();
    };
  }, []);

  const handleAddEmptyWhisky = () => {
    if (isAddDisabled) return;
    form.clearErrors('alcohols');
    alcoholFieldArray.append(createEmptyItem(), { shouldFocus: false });
  };

  const handleSelectBottleNoteWhisky = async (index: number, whisky: SelectedWhisky) => {
    if (pendingAlcoholId !== null) return;

    setPendingAlcoholId(whisky.alcoholId);

    try {
      const detail = await fetchAlcoholDetail(whisky.alcoholId);
      const curationWhiskyItem = createBottleNoteCurationWhiskyItemFromDetail(detail);
      curationWhiskyItem.alcohol.selectedTags = curationWhiskyItem.alcohol.selectedTags.slice(
        0,
        fieldModel.selectedTags.maxItems
      );
      form.setValue(`alcohols.${index}` as const, transformItem(curationWhiskyItem), {
        shouldDirty: true,
        shouldValidate: true,
      });
    } catch {
      form.setValue(
        `alcohols.${index}` as const,
        transformItem(createBottleNoteCurationWhiskyItem(whisky)),
        {
          shouldDirty: true,
          shouldValidate: true,
        }
      );
      showToast({
        type: 'error',
        message: '위스키 상세 정보를 불러오지 못해 기본 정보만 추가했습니다.',
      });
    } finally {
      setPendingAlcoholId(null);
    }
  };

  const handleUseManualInput = (fieldId: string, index: number) => {
    const currentItem = form.getValues(`alcohols.${index}` as const);

    if (!currentItem || currentItem.source !== 'MANUAL') {
      form.setValue(`alcohols.${index}` as const, createEmptyItem(), {
        shouldDirty: true,
        shouldValidate: true,
      });
    }

    setManualInputFieldIds((prev) => {
      const next = new Set(prev);
      next.add(fieldId);
      return next;
    });
  };

  const handleTagInputChange = (fieldId: string, value: string) => {
    setTagInputs((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleAddTagValue = (index: number, value: string) => {
    const trimmedValue = value.trim();
    if (!trimmedValue) return false;

    const path = `alcohols.${index}.alcohol.selectedTags` as const;
    const currentTags = form.getValues(path) ?? [];
    if (
      currentTags.includes(trimmedValue) ||
      currentTags.length >= fieldModel.selectedTags.maxItems
    ) {
      return false;
    }

    form.setValue(path, [...currentTags, trimmedValue], {
      shouldDirty: true,
      shouldValidate: true,
    });

    return true;
  };

  const handleRemoveTag = (index: number, tag: string) => {
    const path = `alcohols.${index}.alcohol.selectedTags` as const;
    const currentTags = form.getValues(path);
    form.setValue(
      path,
      currentTags.filter((item) => item !== tag),
      {
        shouldDirty: true,
        shouldValidate: true,
      }
    );
  };

  const handleHideWhiskyStatsItem = (index: number, key: RemovableWhiskyStatsKey) => {
    const currentStats = form.getValues(`alcohols.${index}.stats` as const);
    if (!currentStats) return;

    form.setValue(
      `alcohols.${index}.stats` as const,
      {
        ...currentStats,
        [key]: null,
      },
      {
        shouldDirty: true,
        shouldValidate: true,
      }
    );
  };

  const setManualImageUploading = (fieldId: string, isUploading: boolean) => {
    setUploadingManualImageFieldIds((prev) => {
      const next = new Set(prev);
      if (isUploading) {
        next.add(fieldId);
      } else {
        next.delete(fieldId);
      }
      return next;
    });
  };

  const revokeLocalManualImageUrl = (url: string) => {
    if (!localManualImageUrlsRef.current.has(url)) return;

    URL.revokeObjectURL(url);
    localManualImageUrlsRef.current.delete(url);
  };

  const handleManualWhiskyImageChange = async (
    fieldId: string,
    index: number,
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!SUPPORTED_MANUAL_WHISKY_IMAGE_TYPES.has(file.type)) {
      showToast({
        type: 'warning',
        message: 'PNG, JPG, WEBP 이미지만 업로드할 수 있습니다.',
      });
      return;
    }

    const path = `alcohols.${index}.alcohol.imageUrl` as const;
    const previewUrl = URL.createObjectURL(file);
    localManualImageUrlsRef.current.add(previewUrl);
    form.setValue(path, previewUrl, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setManualImageUploading(fieldId, true);

    try {
      const uploadedUrl = await uploadManualWhiskyImage(file);
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
      revokeLocalManualImageUrl(previewUrl);
      setManualImageUploading(fieldId, false);
    }
  };

  const handleRemoveManualWhiskyImage = (index: number) => {
    const path = `alcohols.${index}.alcohol.imageUrl` as const;
    const currentImageUrl = form.getValues(path);
    if (currentImageUrl) {
      revokeLocalManualImageUrl(currentImageUrl);
    }
    form.setValue(path, '', {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const handleRemoveWhisky = (fieldId: string, index: number) => {
    form.clearErrors('alcohols');
    alcoholFieldArray.remove(index);
    resetWhiskyDragState();
    setManualInputFieldIds((prev) => {
      const next = new Set(prev);
      next.delete(fieldId);
      return next;
    });
    setTagInputs((prev) => {
      const next = { ...prev };
      delete next[fieldId];
      return next;
    });
  };

  const resetWhiskyDragState = () => {
    activeWhiskyDragHandleIndexRef.current = null;
    setDraggedAlcoholIndex(null);
    setDragOverAlcoholIndex(null);
  };

  const isWhiskyDragHandleTarget = (target: EventTarget | null) =>
    target instanceof Element && target.closest(WHISKY_DRAG_HANDLE_SELECTOR) !== null;

  const handleWhiskyDragHandlePointerDown = (
    index: number,
    event: PointerEvent<HTMLButtonElement>
  ) => {
    activeWhiskyDragHandleIndexRef.current = index;
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handleWhiskyDragHandlePointerEnd = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    activeWhiskyDragHandleIndexRef.current = null;
  };

  const handleWhiskyDragStart = (index: number, event: DragEvent<HTMLDivElement>) => {
    const isHandleDrag =
      isWhiskyDragHandleTarget(event.target) || activeWhiskyDragHandleIndexRef.current === index;

    if (!isHandleDrag) {
      event.preventDefault();
      resetWhiskyDragState();
      return;
    }

    setDraggedAlcoholIndex(index);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(index));
  };

  const handleWhiskyDragOver = (index: number, event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDragOverAlcoholIndex(index);
  };

  const handleWhiskyDrop = (targetIndex: number, event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();

    const transferredIndex = event.dataTransfer.getData('text/plain');
    const sourceIndex =
      draggedAlcoholIndex ?? (transferredIndex === '' ? Number.NaN : Number(transferredIndex));

    if (
      Number.isInteger(sourceIndex) &&
      sourceIndex >= 0 &&
      sourceIndex < alcoholFieldArray.fields.length &&
      sourceIndex !== targetIndex
    ) {
      alcoholFieldArray.move(sourceIndex, targetIndex);
      void form.trigger('alcohols');
    }

    resetWhiskyDragState();
  };

  return (
    <CurationSectionCard
      stepNumber={sectionHeader?.stepNumber}
      title={
        <>
          {fieldModel.label}
          {fieldModel.required && <span className="text-destructive">*</span>}
        </>
      }
      description={
        sectionHeader?.description ? (
          <>
            {sectionHeader.description}
            <span className="mt-1 block">{limitDescription}</span>
          </>
        ) : (
          limitDescription
        )
      }
      titleSuffix={
        watchedAlcohols.length > 0 ? (
          <Badge variant="secondary">{watchedAlcohols.length}</Badge>
        ) : null
      }
      contentClassName="space-y-4"
    >
      {isAddingBottleNoteWhisky && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          DB 위스키 정보를 불러오는 중입니다.
        </p>
      )}

      {form.formState.errors.alcohols?.message && (
        <p className="text-sm text-destructive">{form.formState.errors.alcohols.message}</p>
      )}

      {watchedAlcohols.length === 0 ? (
        <div className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
          {fieldModel.label}를 추가해주세요.
        </div>
      ) : (
        <div className="space-y-3">
          {alcoholFieldArray.fields.map((field, index) => {
            const item = watchedAlcohols[index];
            const itemError = form.formState.errors.alcohols?.[index];
            const tags = item?.alcohol.selectedTags ?? [];
            const tagInput = tagInputs[field.id] ?? '';
            const itemName =
              item?.alcohol.korName ||
              (item?.source === 'MANUAL' ? '직접 입력 위스키' : '시음 위스키');
            const manualFieldPrefix = `${index + 1}번 수동 위스키`;
            const hasWhiskyValidationError = Boolean(
              itemError?.alcohol?.korName || itemError?.alcohol?.selectedTags
            );
            const isManualInput =
              item?.source === 'MANUAL' &&
              (manualInputFieldIds.has(field.id) ||
                hasManualWhiskyValue(item.alcohol) ||
                hasWhiskyValidationError);
            const isEmptyWhiskyCard = item?.source === 'MANUAL' && !isManualInput;
            const whiskyProfile = getWhiskyProfile(item?.alcohol);
            const whiskyStatsItems = getWhiskyStatsItems(item?.stats);
            const whiskyImageUrl = normalizeImageUrl(item?.alcohol.imageUrl);
            const tagError = itemError?.alcohol?.selectedTags?.message;
            const commentError = itemError?.comment?.message;
            const manualRegionValue = normalizeText(item?.alcohol.regionName);
            const manualCategoryValue = normalizeText(item?.alcohol.korCategory);
            const manualRegionOptionsForValue = ensureCurrentOption(
              manualRegionOptions,
              manualRegionValue
            );
            const manualCategoryOptionsForValue = ensureCurrentOption(
              manualCategoryOptions,
              manualCategoryValue
            );

            return (
              <div
                key={field.id}
                draggable
                className={cn(
                  'rounded-[10px] border bg-card p-5 transition-colors',
                  dragOverAlcoholIndex === index && draggedAlcoholIndex !== index
                    ? 'border-primary bg-primary/5'
                    : 'border-border'
                )}
                onDragStart={(event) => handleWhiskyDragStart(index, event)}
                onDragOver={(event) => handleWhiskyDragOver(index, event)}
                onDrop={(event) => handleWhiskyDrop(index, event)}
                onDragLeave={() => setDragOverAlcoholIndex(null)}
                onDragEnd={resetWhiskyDragState}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-2">
                    <button
                      type="button"
                      data-whisky-drag-handle="true"
                      aria-label={`${itemName} 순서 변경`}
                      className="flex h-8 w-8 shrink-0 cursor-grab items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:cursor-grabbing"
                      onPointerDown={(event) => handleWhiskyDragHandlePointerDown(index, event)}
                      onPointerUp={handleWhiskyDragHandlePointerEnd}
                      onPointerCancel={handleWhiskyDragHandlePointerEnd}
                    >
                      <GripVertical className="h-4 w-4" />
                    </button>
                    <h3 className="text-base font-semibold text-foreground">
                      위스키 {index + 1}
                      {fieldModel.required && <span className="ml-1 text-destructive">*</span>}
                    </h3>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 rounded-md bg-destructive/20 px-2 text-xs font-medium text-destructive hover:bg-destructive/30 hover:text-destructive"
                    onClick={() => handleRemoveWhisky(field.id, index)}
                  >
                    삭제
                  </Button>
                </div>

                {isEmptyWhiskyCard ? (
                  <div className="mt-5">
                    <div className="min-w-0">
                      <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_auto]">
                        <WhiskySearchSelect
                          onSelect={(whisky) => handleSelectBottleNoteWhisky(index, whisky)}
                          excludeIds={selectedAlcoholIds}
                          placeholder="위스키 검색 ..."
                          disabled={pendingAlcoholId !== null}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleUseManualInput(field.id, index)}
                          disabled={pendingAlcoholId !== null}
                        >
                          직접 입력
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mt-5 grid gap-4 md:grid-cols-[7rem_minmax(0,1fr)]">
                      <div className="flex h-40 items-center justify-center overflow-hidden rounded-md bg-background">
                        {whiskyImageUrl ? (
                          <img
                            key={whiskyImageUrl}
                            src={whiskyImageUrl}
                            alt={itemName}
                            className="h-full max-h-40 w-full object-contain"
                          />
                        ) : (
                          <div className="flex h-24 w-20 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
                            No
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 space-y-3">
                        <div className="space-y-1">
                          <p className="truncate text-base font-semibold text-foreground">
                            {itemName}
                          </p>
                          {item?.alcohol.engName && (
                            <p className="truncate text-sm text-foreground">
                              {item.alcohol.engName}
                            </p>
                          )}
                          {whiskyProfile && (
                            <p className="text-sm text-foreground">{whiskyProfile}</p>
                          )}
                          {whiskyStatsItems.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {whiskyStatsItems.map((statsItem) => (
                                <Badge
                                  key={statsItem.label}
                                  variant="secondary"
                                  className="gap-1 rounded-md px-2 py-0.5 text-xs font-medium"
                                >
                                  {statsItem.label} {statsItem.value}
                                  <button
                                    type="button"
                                    className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-foreground text-background hover:bg-foreground/80"
                                    aria-label={`${itemName} ${statsItem.label} 숨기기`}
                                    onClick={() => handleHideWhiskyStatsItem(index, statsItem.key)}
                                  >
                                    <X className="h-3 w-3" aria-hidden="true" />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        {isManualInput && (
                          <div className="grid gap-4 md:grid-cols-2">
                            <FormField
                              label="위스키 한글명"
                              required
                              error={itemError?.alcohol?.korName?.message}
                            >
                              <Input
                                aria-label={`${manualFieldPrefix} 한글명`}
                                {...form.register(`alcohols.${index}.alcohol.korName` as const)}
                                placeholder="예: 글렌드로낙 오리지널 12년"
                              />
                            </FormField>
                            <FormField label="위스키 영문명">
                              <Input
                                aria-label={`${manualFieldPrefix} 영문명`}
                                {...form.register(`alcohols.${index}.alcohol.engName` as const)}
                                placeholder="예: GLENDRONACH ORIGINAL 12Y"
                              />
                            </FormField>
                            <FormField label="이미지" className="md:col-span-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <input
                                  id={`${field.id}-manual-whisky-image`}
                                  type="file"
                                  accept={MANUAL_WHISKY_IMAGE_ACCEPT}
                                  className="sr-only"
                                  aria-label={`${manualFieldPrefix} 이미지 파일 선택`}
                                  onChange={(event) =>
                                    void handleManualWhiskyImageChange(field.id, index, event)
                                  }
                                  disabled={uploadingManualImageFieldIds.has(field.id)}
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    document
                                      .getElementById(`${field.id}-manual-whisky-image`)
                                      ?.click()
                                  }
                                  disabled={uploadingManualImageFieldIds.has(field.id)}
                                >
                                  {uploadingManualImageFieldIds.has(field.id) ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Upload className="h-4 w-4" />
                                  )}
                                  {uploadingManualImageFieldIds.has(field.id)
                                    ? '업로드 중'
                                    : '이미지 업로드'}
                                </Button>
                                {whiskyImageUrl && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveManualWhiskyImage(index)}
                                    disabled={uploadingManualImageFieldIds.has(field.id)}
                                  >
                                    이미지 삭제
                                  </Button>
                                )}
                                <span className="text-xs text-muted-foreground">
                                  PNG, JPG, WEBP 지원
                                </span>
                              </div>
                            </FormField>
                            <FormField label="도수">
                              <Input
                                aria-label={`${manualFieldPrefix} 도수`}
                                {...form.register(`alcohols.${index}.alcohol.abv` as const)}
                                placeholder="예: 43"
                              />
                            </FormField>
                            <FormField label="용량">
                              <Input
                                aria-label={`${manualFieldPrefix} 용량`}
                                {...form.register(`alcohols.${index}.alcohol.volume` as const)}
                                placeholder="예: 700ml"
                              />
                            </FormField>
                            <FormField label="캐스크">
                              <Input
                                aria-label={`${manualFieldPrefix} 캐스크`}
                                {...form.register(`alcohols.${index}.alcohol.cask` as const)}
                                placeholder="예: 셰리 캐스크"
                              />
                            </FormField>
                            <FormField label="지역">
                              <SearchableSelect
                                ariaLabel={`${manualFieldPrefix} 지역`}
                                value={manualRegionValue}
                                onChange={(value) =>
                                  form.setValue(
                                    `alcohols.${index}.alcohol.regionName` as const,
                                    value,
                                    {
                                      shouldDirty: true,
                                      shouldValidate: true,
                                    }
                                  )
                                }
                                options={manualRegionOptionsForValue}
                                placeholder="지역 선택"
                                searchPlaceholder="지역 검색..."
                                emptyMessage="지역을 찾을 수 없습니다."
                              />
                            </FormField>
                            <FormField label="카테고리" className="md:col-span-2">
                              <SearchableSelect
                                ariaLabel={`${manualFieldPrefix} 카테고리`}
                                value={manualCategoryValue}
                                onChange={(value) =>
                                  form.setValue(
                                    `alcohols.${index}.alcohol.korCategory` as const,
                                    value,
                                    {
                                      shouldDirty: true,
                                      shouldValidate: true,
                                    }
                                  )
                                }
                                options={manualCategoryOptionsForValue}
                                placeholder="카테고리 선택"
                                searchPlaceholder="카테고리 검색..."
                                emptyMessage="카테고리를 찾을 수 없습니다."
                              />
                            </FormField>
                          </div>
                        )}

                        <div className="space-y-2">
                          <div className="flex max-w-md items-center justify-between gap-3">
                            <p className="text-sm font-medium text-foreground">
                              {fieldModel.selectedTags.label}
                              {fieldModel.selectedTags.required && (
                                <span className="ml-1 text-destructive">*</span>
                              )}
                            </p>
                            <span
                              className={cn(
                                'text-xs font-medium text-muted-foreground',
                                tags.length >= fieldModel.selectedTags.maxItems &&
                                  'text-destructive'
                              )}
                            >
                              {tags.length}/{fieldModel.selectedTags.maxItems}
                            </span>
                          </div>
                          <CurationTastingTagCombobox
                            ariaLabel={`${itemName} 테이스팅 태그`}
                            value={tagInput}
                            onValueChange={(value) => handleTagInputChange(field.id, value)}
                            onSelect={(tag) => {
                              handleAddTagValue(index, tag.korName);
                            }}
                            onCreate={(value) => handleAddTagValue(index, value)}
                            selectedTagNames={tags}
                            placeholder="테이스팅 태그검색 후 추가"
                            disabled={tags.length >= fieldModel.selectedTags.maxItems}
                            className="max-w-md"
                          />
                          {tagError && <p className="text-sm text-destructive">{tagError}</p>}
                          {tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {tags.map((tag) => (
                                <Badge
                                  key={tag}
                                  variant="outline"
                                  className="h-7 gap-1 rounded-md border-border bg-background px-2 text-xs font-normal text-foreground hover:bg-background"
                                >
                                  {tag}
                                  <button
                                    type="button"
                                    className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-foreground text-background hover:bg-foreground/80"
                                    onClick={() => handleRemoveTag(index, tag)}
                                    aria-label={`${tag} 태그 삭제`}
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <Textarea
                        aria-label={`${itemName} 기대평`}
                        rows={5}
                        maxLength={fieldModel.comment.maxLength}
                        {...form.register(`alcohols.${index}.comment` as const)}
                        placeholder="위스키 기대평을 작성해주세요."
                        className="min-h-40 resize-none rounded-[10px] border-border"
                      />
                      {commentError && <p className="text-sm text-destructive">{commentError}</p>}
                    </div>
                    {renderItemExtra?.({ fieldId: field.id, index, item })}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
      <Button
        type="button"
        variant="secondary"
        className="h-14 w-full rounded-[10px] text-base font-semibold"
        onClick={handleAddEmptyWhisky}
        disabled={isAddDisabled}
        aria-label={`${fieldModel.label} 추가`}
      >
        <Plus className="h-5 w-5" />
        추가
      </Button>
    </CurationSectionCard>
  );
}

function hasManualWhiskyValue(alcohol: CurationWhiskyMirror | undefined): boolean {
  if (!alcohol) return false;

  return Boolean(
    normalizeText(alcohol.korName) ||
    normalizeText(alcohol.engName) ||
    normalizeText(alcohol.imageUrl) ||
    normalizeText(alcohol.abv) ||
    normalizeText(alcohol.volume) ||
    normalizeText(alcohol.cask) ||
    normalizeText(alcohol.regionName) ||
    normalizeText(alcohol.korCategory)
  );
}

function getCategoryOptions(categoryReferencesByGroup: CategoryReferenceMap): SelectOption[] {
  return Object.entries(categoryReferencesByGroup).flatMap(([group, categories]) =>
    categories.map((category) => ({
      value: category.korCategory,
      label: `${category.korCategory} (${category.engCategory}) · ${CATEGORY_GROUP_LABELS[group as keyof typeof CATEGORY_GROUP_LABELS]}`,
    }))
  );
}

function ensureCurrentOption(options: SelectOption[], currentValue: string): SelectOption[] {
  if (!currentValue || options.some((option) => option.value === currentValue)) {
    return options;
  }

  return [{ value: currentValue, label: `${currentValue} (현재 값)` }, ...options];
}

function normalizeImageUrl(value: string | null | undefined): string {
  const normalizedValue = normalizeText(value);
  if (!normalizedValue) return '';

  if (/^(https?:|blob:|data:image\/)/i.test(normalizedValue)) {
    return normalizedValue;
  }

  if (normalizedValue.startsWith('//')) {
    return `https:${normalizedValue}`;
  }

  return `https://${normalizedValue}`;
}

function getWhiskyProfile(alcohol: CurationWhiskyMirror | undefined): string {
  if (!alcohol) return '';

  return [formatAbv(alcohol.abv), normalizeText(alcohol.korCategory)].filter(Boolean).join(' · ');
}

function getWhiskyStatsItems(stats: CurationWhiskyCardValue['stats']) {
  if (!stats) return [];

  return [
    {
      key: 'rating' as const,
      label: '평균별점',
      value: formatRating(stats.rating),
      hidden: stats.rating == null,
    },
    {
      key: 'totalRatingsCount' as const,
      label: '유저평가',
      value: formatCount(stats.totalRatingsCount),
      hidden: stats.totalRatingsCount == null,
    },
  ].filter((item) => !item.hidden);
}

function formatRating(value: number | null | undefined): string {
  return typeof value === 'number' && Number.isFinite(value) ? value.toFixed(1) : '-';
}

function formatCount(value: number | null | undefined): string {
  return typeof value === 'number' && Number.isFinite(value) ? value.toLocaleString('ko-KR') : '-';
}

function formatAbv(value: string | undefined): string {
  const normalizedValue = normalizeText(value);
  if (!normalizedValue) return '';

  return `도수 ${normalizedValue.includes('%') ? normalizedValue : `${normalizedValue}%`}`;
}

function normalizeText(value: string | null | undefined): string {
  return typeof value === 'string' ? value.trim() : '';
}
