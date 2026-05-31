import { useState } from 'react';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { Plus, X } from 'lucide-react';

import { FormField } from '@/components/common/FormField';
import { WhiskySearchSelect, type SelectedWhisky } from '@/components/common/WhiskySearchSelect';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import {
  createBottleNoteCurationWhiskyItem,
  createManualCurationWhiskyItem,
} from '../curation-whisky-card-list.mapper';
import type {
  CurationWhiskyCardListFieldModel,
  CurationWhiskyCardListFormValues,
} from '../curation-whisky-card-list.types';

interface CurationWhiskyCardListFieldProps {
  fieldModel: CurationWhiskyCardListFieldModel;
}

export function CurationWhiskyCardListField({ fieldModel }: CurationWhiskyCardListFieldProps) {
  const form = useFormContext<CurationWhiskyCardListFormValues>();
  const [tagInputs, setTagInputs] = useState<Record<string, string>>({});
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

  const handleAddBottleNoteWhisky = (whisky: SelectedWhisky) => {
    if (isMaxReached) return;
    alcoholFieldArray.append(createBottleNoteCurationWhiskyItem(whisky), { shouldFocus: false });
  };

  const handleAddManualWhisky = () => {
    if (isMaxReached) return;
    alcoholFieldArray.append(createManualCurationWhiskyItem(), { shouldFocus: false });
  };

  const handleTagInputChange = (fieldId: string, value: string) => {
    setTagInputs((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleAddTag = (index: number, fieldId: string) => {
    const value = tagInputs[fieldId]?.trim();
    if (!value) return;

    const path = `alcohols.${index}.alcohol.selectedTags` as const;
    const currentTags = form.getValues(path);
    if (currentTags.includes(value) || currentTags.length >= fieldModel.selectedTags.maxItems) {
      setTagInputs((prev) => ({ ...prev, [fieldId]: '' }));
      return;
    }

    form.setValue(path, [...currentTags, value], {
      shouldDirty: true,
      shouldValidate: true,
    });
    setTagInputs((prev) => ({ ...prev, [fieldId]: '' }));
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
    <Card>
      <CardHeader>
        <CardTitle>
          {fieldModel.label}
          {fieldModel.required && <span className="ml-1 text-destructive">*</span>}
          {watchedAlcohols.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {watchedAlcohols.length}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {fieldModel.minItems}-{fieldModel.maxItems}개까지 등록할 수 있습니다. 검색 추가와 직접 입력을
          지원하며, 테이스팅 태그 순서가 앱 노출 순서입니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_auto]">
          <WhiskySearchSelect
            onSelect={handleAddBottleNoteWhisky}
            excludeIds={selectedAlcoholIds}
            placeholder="위스키 검색하여 추가..."
            disabled={isMaxReached}
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleAddManualWhisky}
            disabled={isMaxReached}
          >
            <Plus className="h-4 w-4" />
            직접 입력
          </Button>
        </div>

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
                item?.alcohol.korName || (item?.source === 'MANUAL' ? '직접 입력 위스키' : '시음 위스키');
              const manualFieldPrefix = `${index + 1}번 수동 위스키`;

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
      </CardContent>
    </Card>
  );
}
