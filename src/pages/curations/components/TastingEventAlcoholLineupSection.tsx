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

import type { TastingEventAlcoholsContract } from '../curation-v2-tasting-event.contract';
import { createTastingEventAlcoholItem } from '../curation-v2-tasting-event.mapper';
import type { CurationV2TastingEventFormValues } from '../curation-v2-tasting-event.schema';

interface TastingEventAlcoholLineupSectionProps {
  contract: TastingEventAlcoholsContract;
}

export function TastingEventAlcoholLineupSection({
  contract,
}: TastingEventAlcoholLineupSectionProps) {
  const form = useFormContext<CurationV2TastingEventFormValues>();
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

  const handleAddWhisky = (whisky: SelectedWhisky) => {
    if (watchedAlcohols.length >= contract.maxItems) return;
    alcoholFieldArray.append(createTastingEventAlcoholItem(whisky), { shouldFocus: false });
  };

  const handleTagInputChange = (fieldId: string, value: string) => {
    setTagInputs((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleAddTag = (index: number, fieldId: string) => {
    const value = tagInputs[fieldId]?.trim();
    if (!value) return;

    const path = `alcohols.${index}.alcohol.selectedTags` as const;
    const currentTags = form.getValues(path);
    if (currentTags.includes(value) || currentTags.length >= contract.selectedTags.maxItems) {
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
          {contract.label}
          {contract.required && <span className="ml-1 text-destructive">*</span>}
          {watchedAlcohols.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {watchedAlcohols.length}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {contract.minItems}-{contract.maxItems}개까지 등록할 수 있습니다. 검색으로 보틀노트
          위스키를 추가한 뒤 테이스팅 태그를 입력하세요.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <WhiskySearchSelect
          onSelect={handleAddWhisky}
          excludeIds={selectedAlcoholIds}
          placeholder="위스키 검색하여 추가..."
          disabled={watchedAlcohols.length >= contract.maxItems}
        />
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

              return (
                <div key={field.id} className="rounded-lg border p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
                      {item?.alcohol.imageUrl ? (
                        <img
                          src={item.alcohol.imageUrl}
                          alt={item.alcohol.korName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                          No
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-medium">{item?.alcohol.korName}</h3>
                      <p className="truncate text-sm text-muted-foreground">
                        {item?.alcohol.engName}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`${item?.alcohol.korName ?? '시음 위스키'} 삭제`}
                      onClick={() => alcoholFieldArray.remove(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="mt-4 space-y-4">
                    <FormField
                      label={contract.selectedTags.label}
                      required={contract.selectedTags.required}
                      error={itemError?.alcohol?.selectedTags?.message}
                    >
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            aria-label={`${item?.alcohol.korName ?? '위스키'} 테이스팅 태그`}
                            value={tagInput}
                            onChange={(event) => handleTagInputChange(field.id, event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') {
                                event.preventDefault();
                                handleAddTag(index, field.id);
                              }
                            }}
                            placeholder="태그 입력 후 Enter"
                            disabled={tags.length >= contract.selectedTags.maxItems}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleAddTag(index, field.id)}
                            disabled={
                              !tagInput.trim() || tags.length >= contract.selectedTags.maxItems
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
                      label={contract.comment.label}
                      required={contract.comment.required}
                      error={itemError?.comment?.message}
                    >
                      <Textarea
                        aria-label={`${item?.alcohol.korName ?? '위스키'} 기대평`}
                        rows={3}
                        maxLength={contract.comment.maxLength}
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
