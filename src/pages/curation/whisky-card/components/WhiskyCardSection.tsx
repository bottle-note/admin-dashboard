import { useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { Loader2, Plus, X } from 'lucide-react';

import { FormField } from '@/components/common/FormField';
import { WhiskySearchSelect, type SelectedWhisky } from '@/components/common/WhiskySearchSelect';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAdminAlcoholDetailLookup } from '@/hooks/useAdminAlcohols';
import { useToast } from '@/hooks/useToast';

import {
  createBottleNoteCurationWhiskyItem,
  createBottleNoteCurationWhiskyItemFromDetail,
} from '../../curation-whisky-card-list.mapper';
import type {
  CurationWhiskyCardValue,
  CurationWhiskyMirror,
} from '../../curation-whisky-card-list.types';
import {
  createEmptyWhiskyMirror,
  type WhiskyCardCurationFormModel,
  type WhiskyCardCurationFormState,
} from '../whisky-card-curation.schema';

interface WhiskyCardSectionProps {
  formModel: WhiskyCardCurationFormModel;
}

export function WhiskyCardSection({ formModel }: WhiskyCardSectionProps) {
  const form = useFormContext<WhiskyCardCurationFormState>();
  const [isManualInputOpen, setIsManualInputOpen] = useState(() => {
    const initialSource = form.getValues('source');
    const initialAlcohol = form.getValues('alcohol');

    return initialSource === 'MANUAL' && hasWhiskyInputValue(initialAlcohol);
  });
  const fetchAlcoholDetail = useAdminAlcoholDetailLookup();
  const { showToast } = useToast();
  const [tagInput, setTagInput] = useState('');
  const [pendingAlcoholId, setPendingAlcoholId] = useState<number | null>(null);
  const source = useWatch({ control: form.control, name: 'source' });
  const alcohol = useWatch({ control: form.control, name: 'alcohol' });
  const stats = useWatch({ control: form.control, name: 'stats' });
  const selectedTags = alcohol?.selectedTags ?? [];
  const selectedAlcoholIds =
    source === 'BOTTLE_NOTE' && typeof alcohol?.alcoholId === 'number' ? [alcohol.alcoholId] : [];
  const isLoadingDetail = pendingAlcoholId !== null;
  const itemName =
    alcohol?.korName || (source === 'MANUAL' ? '직접 입력 위스키' : formModel.whiskyLabel);
  const whiskyMeta = getWhiskyMeta(alcohol);
  const alcoholError = form.formState.errors.alcohol;
  const isManualInputVisible = source === 'MANUAL' && isManualInputOpen;
  const hasBottleNoteWhisky =
    source === 'BOTTLE_NOTE' && Boolean(alcohol?.alcoholId || alcohol?.korName);
  const hasVisibleWhisky = hasBottleNoteWhisky || isManualInputVisible;
  const emptyStateError = !hasVisibleWhisky
    ? alcoholError?.korName?.message || alcoholError?.selectedTags?.message
    : undefined;

  const updateWhiskyValue = (item: CurationWhiskyCardValue) => {
    form.setValue('source', item.source, { shouldDirty: true, shouldValidate: true });
    form.setValue('alcohol', item.alcohol, { shouldDirty: true, shouldValidate: true });
    form.setValue('stats', item.stats ?? null, { shouldDirty: true, shouldValidate: false });
    setIsManualInputOpen(item.source === 'MANUAL');
  };

  const handleSelectBottleNoteWhisky = async (whisky: SelectedWhisky) => {
    if (isLoadingDetail) return;

    setPendingAlcoholId(whisky.alcoholId);

    try {
      const detail = await fetchAlcoholDetail(whisky.alcoholId);
      const curationWhiskyItem = createBottleNoteCurationWhiskyItemFromDetail(detail);
      curationWhiskyItem.alcohol.selectedTags = curationWhiskyItem.alcohol.selectedTags.slice(
        0,
        formModel.selectedTags.maxItems
      );
      updateWhiskyValue(curationWhiskyItem);
      setTagInput('');
    } catch {
      updateWhiskyValue(createBottleNoteCurationWhiskyItem(whisky));
      setTagInput('');
      showToast({
        type: 'error',
        message: '위스키 상세 정보를 불러오지 못해 기본 정보만 반영했습니다.',
      });
    } finally {
      setPendingAlcoholId(null);
    }
  };

  const handleManualInput = () => {
    form.setValue('source', 'MANUAL', { shouldDirty: true, shouldValidate: true });
    form.setValue('alcohol', createEmptyWhiskyMirror(), {
      shouldDirty: true,
      shouldValidate: true,
    });
    form.setValue('stats', null, { shouldDirty: true, shouldValidate: false });
    setIsManualInputOpen(true);
    setTagInput('');
  };

  const handleAddTag = () => {
    const trimmedValue = tagInput.trim();
    if (!trimmedValue) return;

    const currentTags = form.getValues('alcohol.selectedTags') ?? [];
    if (
      currentTags.includes(trimmedValue) ||
      currentTags.length >= formModel.selectedTags.maxItems
    ) {
      return;
    }

    form.setValue('alcohol.selectedTags', [...currentTags, trimmedValue], {
      shouldDirty: true,
      shouldValidate: true,
    });
    setTagInput('');
  };

  const handleRemoveTag = (tag: string) => {
    const currentTags = form.getValues('alcohol.selectedTags') ?? [];
    form.setValue(
      'alcohol.selectedTags',
      currentTags.filter((item) => item !== tag),
      {
        shouldDirty: true,
        shouldValidate: true,
      }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {formModel.whiskyLabel}
          <span className="ml-1 text-destructive">*</span>
        </CardTitle>
        <CardDescription>
          DB 위스키를 선택하면 기본 정보와 테이스팅 태그가 기본값으로 들어가고, 이후 수정할 수
          있습니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_auto]">
          <WhiskySearchSelect
            onSelect={handleSelectBottleNoteWhisky}
            excludeIds={selectedAlcoholIds}
            placeholder="위스키 검색하여 선택..."
            disabled={isLoadingDetail}
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleManualInput}
            disabled={isLoadingDetail}
          >
            <Plus className="h-4 w-4" />
            직접 입력
          </Button>
        </div>

        {isLoadingDetail && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            DB 위스키 정보를 불러오는 중입니다.
          </p>
        )}

        {!hasVisibleWhisky ? (
          <div className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
            위스키를 검색하거나 직접 입력을 눌러 추가해주세요.
            {emptyStateError && <p className="mt-2 text-destructive">{emptyStateError}</p>}
          </div>
        ) : (
          <div className="rounded-lg border p-4">
            <div className="flex items-start gap-3">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                {alcohol?.imageUrl ? (
                  <img
                    src={alcohol.imageUrl}
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
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate font-medium">{itemName}</h3>
                  <Badge variant={source === 'BOTTLE_NOTE' ? 'default' : 'secondary'}>
                    {source === 'BOTTLE_NOTE' ? 'DB' : '직접 입력'}
                  </Badge>
                </div>
                {alcohol?.engName && (
                  <p className="truncate text-sm text-muted-foreground">{alcohol.engName}</p>
                )}
                {whiskyMeta && (
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{whiskyMeta}</p>
                )}
              </div>
            </div>

            <div className="mt-4 space-y-4">
              {isManualInputVisible && (
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField label="위스키 한글명" required error={alcoholError?.korName?.message}>
                    <Input
                      aria-label="수동 위스키 한글명"
                      {...form.register('alcohol.korName')}
                      placeholder="예: 글렌드로낙 오리지널 12년"
                    />
                  </FormField>
                  <FormField label="위스키 영문명">
                    <Input
                      aria-label="수동 위스키 영문명"
                      {...form.register('alcohol.engName')}
                      placeholder="예: GLENDRONACH ORIGINAL 12Y"
                    />
                  </FormField>
                  <FormField label="이미지 URL" className="md:col-span-2">
                    <Input
                      aria-label="수동 위스키 이미지 URL"
                      {...form.register('alcohol.imageUrl')}
                      placeholder="https://img.example.com/alcohols/1.png"
                    />
                  </FormField>
                  <FormField label="도수">
                    <Input
                      aria-label="수동 위스키 도수"
                      {...form.register('alcohol.abv')}
                      placeholder="예: 43"
                    />
                  </FormField>
                  <FormField label="용량">
                    <Input
                      aria-label="수동 위스키 용량"
                      {...form.register('alcohol.volume')}
                      placeholder="예: 700ml"
                    />
                  </FormField>
                  <FormField label="캐스크">
                    <Input
                      aria-label="수동 위스키 캐스크"
                      {...form.register('alcohol.cask')}
                      placeholder="예: 셰리 캐스크"
                    />
                  </FormField>
                  <FormField label="지역">
                    <Input
                      aria-label="수동 위스키 지역"
                      {...form.register('alcohol.regionName')}
                      placeholder="예: 스코틀랜드/하이랜드"
                    />
                  </FormField>
                  <FormField label="카테고리">
                    <Input
                      aria-label="수동 위스키 카테고리"
                      {...form.register('alcohol.korCategory')}
                      placeholder="예: 싱글 몰트"
                    />
                  </FormField>
                </div>
              )}

              {source === 'BOTTLE_NOTE' && hasWhiskyStats(stats) && (
                <WhiskyStatsSummary stats={stats} />
              )}

              <FormField
                label={formModel.selectedTags.label}
                required={formModel.selectedTags.required}
                error={alcoholError?.selectedTags?.message}
              >
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      aria-label={`${itemName} 테이스팅 태그`}
                      value={tagInput}
                      onChange={(event) => setTagInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          handleAddTag();
                        }
                      }}
                      placeholder="태그 입력 후 Enter"
                      disabled={selectedTags.length >= formModel.selectedTags.maxItems}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddTag}
                      disabled={
                        !tagInput.trim() || selectedTags.length >= formModel.selectedTags.maxItems
                      }
                    >
                      <Plus className="h-4 w-4" />
                      추가
                    </Button>
                  </div>
                  {selectedTags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedTags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                          {tag}
                          <button
                            type="button"
                            className="ml-1 rounded-full p-0.5 hover:bg-secondary-foreground/10"
                            onClick={() => handleRemoveTag(tag)}
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
                label={formModel.commentLabel}
                required={formModel.commentRequired}
                error={form.formState.errors.comment?.message}
              >
                <Textarea
                  aria-label={formModel.commentLabel}
                  rows={4}
                  maxLength={formModel.commentMaxLength}
                  {...form.register('comment')}
                  placeholder="앱에 노출될 큐레이터 코멘트를 입력하세요."
                />
              </FormField>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function hasWhiskyInputValue(alcohol: CurationWhiskyMirror | undefined): boolean {
  if (!alcohol) return false;

  return [
    alcohol.alcoholId,
    alcohol.korName,
    alcohol.engName,
    alcohol.imageUrl,
    alcohol.abv,
    alcohol.cask,
    alcohol.volume,
    alcohol.regionName,
    alcohol.korCategory,
    alcohol.selectedTags.length,
  ].some(Boolean);
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
