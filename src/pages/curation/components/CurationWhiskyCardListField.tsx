import { useState } from 'react';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { Loader2, Plus, X } from 'lucide-react';

import { FormField } from '@/components/common/FormField';
import { WhiskySearchSelect, type SelectedWhisky } from '@/components/common/WhiskySearchSelect';
import { useAdminAlcoholDetailLookup } from '@/hooks/useAdminAlcohols';
import { useToast } from '@/hooks/useToast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

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
  const [pendingAlcoholId, setPendingAlcoholId] = useState<number | null>(null);
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

  const handleAddBottleNoteWhisky = async (whisky: SelectedWhisky) => {
    if (isAddDisabled) return;

    setPendingAlcoholId(whisky.alcoholId);

    try {
      const detail = await fetchAlcoholDetail(whisky.alcoholId);
      const curationWhiskyItem = createBottleNoteCurationWhiskyItemFromDetail(detail);
      curationWhiskyItem.alcohol.selectedTags = curationWhiskyItem.alcohol.selectedTags.slice(
        0,
        fieldModel.selectedTags.maxItems
      );
      alcoholFieldArray.append(curationWhiskyItem, {
        shouldFocus: false,
      });
    } catch {
      alcoholFieldArray.append(createBottleNoteCurationWhiskyItem(whisky), { shouldFocus: false });
      showToast({
        type: 'error',
        message: '위스키 상세 정보를 불러오지 못해 기본 정보만 추가했습니다.',
      });
    } finally {
      setPendingAlcoholId(null);
    }
  };

  const handleAddManualWhisky = () => {
    if (isAddDisabled) return;
    alcoholFieldArray.append(createManualCurationWhiskyItem(), { shouldFocus: false });
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

  const handleAddTag = (index: number, fieldId: string) => {
    const value = tagInputs[fieldId];
    if (!value) return;

    if (handleAddTagValue(index, value)) {
      setTagInputs((prev) => ({ ...prev, [fieldId]: '' }));
    }
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
      <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_auto]">
        <WhiskySearchSelect
          onSelect={handleAddBottleNoteWhisky}
          excludeIds={selectedAlcoholIds}
          placeholder="위스키 검색하여 추가..."
          disabled={isAddDisabled}
        />
        <Button
          type="button"
          variant="outline"
          onClick={handleAddManualWhisky}
          disabled={isAddDisabled}
        >
          <Plus className="h-4 w-4" />
          직접 입력
        </Button>
      </div>
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
            const whiskyMeta = getWhiskyMeta(item?.alcohol);

            return (
              <div key={field.id} className="rounded-lg border p-4">
                <div className="flex items-start gap-3">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
                    {item?.alcohol.imageUrl ? (
                      <img
                        src={item.alcohol.imageUrl}
                        alt={itemName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                        No
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-medium">{itemName}</h3>
                    <p className="truncate text-sm text-muted-foreground">
                      {item?.alcohol.engName}
                    </p>
                    {whiskyMeta && (
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {whiskyMeta}
                      </p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`${itemName} 삭제`}
                    onClick={() => alcoholFieldArray.remove(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="mt-4 space-y-4">
                  {item?.source === 'MANUAL' && (
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
                        <Input
                          aria-label={`${manualFieldPrefix} 지역`}
                          {...form.register(`alcohols.${index}.alcohol.regionName` as const)}
                          placeholder="예: 스코틀랜드/하이랜드"
                        />
                      </FormField>
                      <FormField label="카테고리">
                        <Input
                          aria-label={`${manualFieldPrefix} 카테고리`}
                          {...form.register(`alcohols.${index}.alcohol.korCategory` as const)}
                          placeholder="예: 싱글 몰트"
                        />
                      </FormField>
                    </div>
                  )}

                  {item?.source === 'BOTTLE_NOTE' && hasWhiskyStats(item.stats) && (
                    <WhiskyStatsSummary stats={item.stats} />
                  )}

                  <FormField
                    label={fieldModel.selectedTags.label}
                    required={fieldModel.selectedTags.required}
                    error={itemError?.alcohol?.selectedTags?.message}
                  >
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          aria-label={`${itemName} 테이스팅 태그`}
                          value={tagInput}
                          onChange={(event) => handleTagInputChange(field.id, event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.preventDefault();
                              handleAddTag(index, field.id);
                            }
                          }}
                          placeholder="태그 입력 후 Enter"
                          disabled={tags.length >= fieldModel.selectedTags.maxItems}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleAddTag(index, field.id)}
                          disabled={
                            !tagInput.trim() || tags.length >= fieldModel.selectedTags.maxItems
                          }
                        >
                          <Plus className="h-4 w-4" />
                          추가
                        </Button>
                      </div>
                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                              {tag}
                              <button
                                type="button"
                                className="ml-1 rounded-full p-0.5 hover:bg-secondary-foreground/10"
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
                  </FormField>

                  <FormField
                    label={fieldModel.comment.label}
                    required={fieldModel.comment.required}
                    error={itemError?.comment?.message}
                  >
                    <Textarea
                      aria-label={`${itemName} 기대평`}
                      rows={3}
                      maxLength={fieldModel.comment.maxLength}
                      {...form.register(`alcohols.${index}.comment` as const)}
                      placeholder="첫 잔으로 가볍게 시작하는 위스키"
                    />
                  </FormField>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </CurationSectionCard>
  );
}

function getWhiskyMeta(alcohol: CurationWhiskyMirror | undefined): string {
  if (!alcohol) return '';

  return [
    formatAbv(alcohol.abv),
    normalizeText(alcohol.volume),
    normalizeText(alcohol.cask),
    normalizeText(alcohol.regionName),
    normalizeText(alcohol.korCategory),
  ]
    .filter(Boolean)
    .join(' · ');
}

function WhiskyStatsSummary({ stats }: { stats: NonNullable<CurationWhiskyCardValue['stats']> }) {
  const items = [
    { label: '평균 별점', value: formatRating(stats.rating) },
    { label: '평점 수', value: formatCount(stats.totalRatingsCount) },
    { label: '리뷰 수', value: formatCount(stats.reviewCount) },
    { label: '찜 수', value: formatCount(stats.totalPickCount) },
  ];

  return (
    <div className="grid gap-2 rounded-md border bg-muted/30 p-3 sm:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="space-y-1">
          <p className="text-xs text-muted-foreground">{item.label}</p>
          <p className="text-sm font-medium">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

function hasWhiskyStats(
  stats: CurationWhiskyCardValue['stats']
): stats is NonNullable<CurationWhiskyCardValue['stats']> {
  if (!stats) return false;

  return [stats.rating, stats.totalRatingsCount, stats.reviewCount, stats.totalPickCount].some(
    (value) => value !== null && value !== undefined
  );
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

  return normalizedValue.includes('%') ? normalizedValue : `${normalizedValue}%`;
}

function normalizeText(value: string | null | undefined): string {
  return typeof value === 'string' ? value.trim() : '';
}
