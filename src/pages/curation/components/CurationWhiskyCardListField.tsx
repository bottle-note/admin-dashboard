import { useRef, useState, type DragEvent, type PointerEvent } from 'react';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { GripVertical, Loader2, Plus, X } from 'lucide-react';

import { FormField } from '@/components/common/FormField';
import { TastingTagSearchSelect } from '@/components/common/TastingTagSearchSelect';
import { WhiskySearchSelect, type SelectedWhisky } from '@/components/common/WhiskySearchSelect';
import { useAdminAlcoholDetailLookup } from '@/hooks/useAdminAlcohols';
import { useToast } from '@/hooks/useToast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

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
} from '../curation-whisky-card-list.types';
import { CurationSectionCard } from './CurationSectionCard';

const WHISKY_DRAG_HANDLE_SELECTOR = '[data-whisky-drag-handle="true"]';

interface CurationWhiskyCardListFieldProps {
  fieldModel: CurationWhiskyCardListFieldModel;
  sectionHeader?: {
    stepNumber?: number;
    description?: string;
  };
}

export function CurationWhiskyCardListField({
  fieldModel,
  sectionHeader,
}: CurationWhiskyCardListFieldProps) {
  const form = useFormContext<CurationWhiskyCardListFormValues>();
  const fetchAlcoholDetail = useAdminAlcoholDetailLookup();
  const { showToast } = useToast();
  const [tagInputs, setTagInputs] = useState<Record<string, string>>({});
  const [manualInputFieldIds, setManualInputFieldIds] = useState<Set<string>>(() => new Set());
  const [pendingAlcoholId, setPendingAlcoholId] = useState<number | null>(null);
  const [draggedAlcoholIndex, setDraggedAlcoholIndex] = useState<number | null>(null);
  const [dragOverAlcoholIndex, setDragOverAlcoholIndex] = useState<number | null>(null);
  const activeWhiskyDragHandleIndexRef = useRef<number | null>(null);
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
  const limitDescription = `${fieldModel.minItems}-${fieldModel.maxItems}개까지 등록할 수 있습니다. 검색 추가와 직접 입력을 지원하며, 테이스팅 태그 순서가 앱 노출 순서입니다.`;

  const handleAddEmptyWhisky = () => {
    if (isAddDisabled) return;
    form.clearErrors('alcohols');
    alcoholFieldArray.append(createManualCurationWhiskyItem(), { shouldFocus: false });
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
      form.setValue(`alcohols.${index}` as const, curationWhiskyItem, {
        shouldDirty: true,
        shouldValidate: true,
      });
    } catch {
      form.setValue(`alcohols.${index}` as const, createBottleNoteCurationWhiskyItem(whisky), {
        shouldDirty: true,
        shouldValidate: true,
      });
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
      form.setValue(`alcohols.${index}` as const, createManualCurationWhiskyItem(), {
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
          시음 위스키를 추가해주세요.
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
            const whiskyRating = getWhiskyRating(item?.stats);
            const whiskyImageUrl = normalizeImageUrl(item?.alcohol.imageUrl);
            const tagError = itemError?.alcohol?.selectedTags?.message;
            const commentError = itemError?.comment?.message;

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
                  <h3 className="text-base font-semibold text-foreground">
                    위스키 {index + 1}
                    {fieldModel.required && <span className="ml-1 text-destructive">*</span>}
                  </h3>
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
                  <div className="mt-5 grid gap-4 md:grid-cols-[minmax(0,1fr)_2.5rem]">
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
                    <button
                      type="button"
                      data-whisky-drag-handle="true"
                      aria-label={`${itemName} 순서 변경`}
                      className="flex h-10 w-10 cursor-grab items-center justify-center justify-self-end text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:cursor-grabbing"
                      onPointerDown={(event) => handleWhiskyDragHandlePointerDown(index, event)}
                      onPointerUp={handleWhiskyDragHandlePointerEnd}
                      onPointerCancel={handleWhiskyDragHandlePointerEnd}
                    >
                      <GripVertical className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="mt-5 grid gap-4 md:grid-cols-[7rem_minmax(0,1fr)_2.5rem]">
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
                          {whiskyRating && (
                            <p className="text-sm text-foreground">{whiskyRating}</p>
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
                            <FormField label="이미지 URL" className="md:col-span-2">
                              <Input
                                aria-label={`${manualFieldPrefix} 이미지 URL`}
                                {...form.register(`alcohols.${index}.alcohol.imageUrl` as const)}
                                placeholder="https://img.example.com/alcohols/1.png"
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
                          <TastingTagSearchSelect
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

                      <button
                        type="button"
                        data-whisky-drag-handle="true"
                        aria-label={`${itemName} 순서 변경`}
                        className="flex h-10 w-10 cursor-grab items-center justify-center justify-self-end text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:cursor-grabbing md:h-40 md:items-start md:pt-8"
                        onPointerDown={(event) => handleWhiskyDragHandlePointerDown(index, event)}
                        onPointerUp={handleWhiskyDragHandlePointerEnd}
                        onPointerCancel={handleWhiskyDragHandlePointerEnd}
                      >
                        <GripVertical className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-4 space-y-2">
                      <Textarea
                        aria-label={`${itemName} 기대평`}
                        rows={4}
                        maxLength={fieldModel.comment.maxLength}
                        {...form.register(`alcohols.${index}.comment` as const)}
                        placeholder="위스키에 대한 설명을 작성해주세요."
                        className="min-h-24 resize-none rounded-[10px] border-border"
                      />
                      {commentError && <p className="text-sm text-destructive">{commentError}</p>}
                    </div>
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
        aria-label="시음 위스키 추가"
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
    normalizeText(alcohol.imageUrl)
  );
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

function getWhiskyRating(stats: CurationWhiskyCardValue['stats']): string {
  if (!stats) return '';

  if (stats.rating == null && stats.totalRatingsCount == null) return '';

  return `평균별점 ${formatRating(stats.rating)} (유저평가 ${formatCount(stats.totalRatingsCount)})`;
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
