import { useState, type DragEvent } from 'react';
import { useFieldArray, useFormContext, useWatch, type FieldValues } from 'react-hook-form';
import { Loader2, Plus } from 'lucide-react';

import { WhiskySearchSelect, type SelectedWhisky } from '@/components/common/WhiskySearchSelect';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAdminAlcoholDetailLookup } from '@/hooks/useAdminAlcohols';
import { useToast } from '@/hooks/useToast';

import type {
  WhiskyTastingEventAlcoholListSchema,
  WhiskyTastingEventPayload,
} from '../curation-spec.schema';
import { CurationSpecDatabaseAlcoholCard } from './CurationSpecDatabaseAlcoholCard';
import { CurationSpecManualAlcoholCard } from './CurationSpecManualAlcoholCard';

const AUTO_SCROLL_EDGE = 96;
const AUTO_SCROLL_DISTANCE = 24;

export function CurationSpecAlcoholCardListField({
  name,
  schema,
  required,
}: {
  name: string;
  schema: WhiskyTastingEventAlcoholListSchema;
  required: boolean;
}) {
  const form = useFormContext<FieldValues>();
  const alcohols = useWatch({
    control: form.control,
    name,
  }) as WhiskyTastingEventPayload['alcohols'];
  const alcoholFieldArray = useFieldArray({ control: form.control, name });
  const fetchAlcoholDetail = useAdminAlcoholDetailLookup();
  const { showToast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [isLoadingAlcohol, setIsLoadingAlcohol] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const itemSchema = schema.items;
  const alcoholSchema = itemSchema.properties.alcohol;
  const selectedTagsSchema = alcoholSchema.properties.selectedTags;
  const isMaxReached = alcohols.length >= schema.maxItems;
  const selectedAlcoholIds = alcohols
    .map((item) => item.alcohol.alcoholId)
    .filter((alcoholId): alcoholId is number => typeof alcoholId === 'number');
  const error = form.getFieldState(name, form.formState).error?.message;

  const handleSelectAlcohol = async (whisky: SelectedWhisky) => {
    setIsLoadingAlcohol(true);

    try {
      const detail = await fetchAlcoholDetail(whisky.alcoholId);

      alcoholFieldArray.append({
        source: 'BOTTLE_NOTE',
        alcohol: {
          alcoholId: detail.alcoholId,
          korName: detail.korName,
          engName: detail.engName,
          imageUrl: detail.imageUrl,
          abv: detail.abv ?? '',
          cask: detail.cask ?? '',
          volume: detail.volume ?? '',
          regionName: detail.korRegion ?? detail.engRegion ?? '',
          korCategory: detail.korCategory,
          selectedTags: detail.tastingTags
            .map((tag) => tag.korName)
            .slice(0, selectedTagsSchema.maxItems),
        },
      });
      setIsAdding(false);
    } catch {
      showToast({ type: 'error', message: '위스키 정보를 불러오지 못했습니다.' });
    } finally {
      setIsLoadingAlcohol(false);
    }
  };

  const handleAddManualAlcohol = () => {
    alcoholFieldArray.append({
      source: 'MANUAL',
      alcohol: {
        alcoholId: null,
        korName: '',
        engName: '',
        imageUrl: '',
        abv: '',
        cask: '',
        volume: '',
        regionName: '',
        korCategory: '',
        selectedTags: [],
      },
      comment: '',
    });
    setIsAdding(false);
  };

  const resetDrag = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragStart = (index: number, event: DragEvent<HTMLDivElement>) => {
    setDraggedIndex(index);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (index: number, event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDrop = (index: number, event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();

    if (draggedIndex !== null && draggedIndex !== index) {
      alcoholFieldArray.move(draggedIndex, index);
    }

    resetDrag();
  };

  const handleAutoScroll = (event: DragEvent<HTMLDivElement>) => {
    if (draggedIndex === null) return;

    const scrollContainer = event.currentTarget.closest('main');
    if (!scrollContainer) return;

    const { top, bottom } = scrollContainer.getBoundingClientRect();

    if (event.clientY < top + AUTO_SCROLL_EDGE) {
      scrollContainer.scrollBy({ top: -AUTO_SCROLL_DISTANCE });
    }

    if (event.clientY > bottom - AUTO_SCROLL_EDGE) {
      scrollContainer.scrollBy({ top: AUTO_SCROLL_DISTANCE });
    }
  };

  return (
    <div className="space-y-4" onDragOver={handleAutoScroll}>
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {schema.minItems}-{schema.maxItems}개까지 등록할 수 있습니다.
          {required && <span className="ml-1 text-destructive">*</span>}
        </p>
        <Badge variant="secondary">{alcohols.length}</Badge>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {alcoholFieldArray.fields.length === 0 && !isAdding ? (
        <div className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
          시음 위스키를 추가해주세요.
        </div>
      ) : (
        <div className="space-y-3">
          {alcoholFieldArray.fields.map((field, index) =>
            (field as FieldValues).source === 'MANUAL' ? (
              <CurationSpecManualAlcoholCard
                key={field.id}
                name={`${name}.${index}`}
                index={index}
                schema={itemSchema}
                required={required}
                isDragOver={dragOverIndex === index && draggedIndex !== index}
                onRemove={() => alcoholFieldArray.remove(index)}
                onMoveUp={() => alcoholFieldArray.move(index, index - 1)}
                onMoveDown={() => alcoholFieldArray.move(index, index + 1)}
                canMoveUp={index > 0}
                canMoveDown={index < alcoholFieldArray.fields.length - 1}
                onDragStart={(event) => handleDragStart(index, event)}
                onDragOver={(event) => handleDragOver(index, event)}
                onDrop={(event) => handleDrop(index, event)}
                onDragEnd={resetDrag}
              />
            ) : (
              <CurationSpecDatabaseAlcoholCard
                key={field.id}
                name={`${name}.${index}`}
                index={index}
                schema={itemSchema}
                required={required}
                isDragOver={dragOverIndex === index && draggedIndex !== index}
                onRemove={() => alcoholFieldArray.remove(index)}
                onMoveUp={() => alcoholFieldArray.move(index, index - 1)}
                onMoveDown={() => alcoholFieldArray.move(index, index + 1)}
                canMoveUp={index > 0}
                canMoveDown={index < alcoholFieldArray.fields.length - 1}
                onDragStart={(event) => handleDragStart(index, event)}
                onDragOver={(event) => handleDragOver(index, event)}
                onDrop={(event) => handleDrop(index, event)}
                onDragEnd={resetDrag}
              />
            )
          )}
        </div>
      )}

      {isAdding && (
        <div className="rounded-[10px] border border-border bg-card p-5">
          <div className="flex items-start justify-between gap-4">
            <h3 className="text-base font-semibold text-foreground">
              시음 위스키 {alcohols.length + 1}
              {required && <span className="ml-1 text-destructive">*</span>}
            </h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 rounded-md bg-destructive/20 px-2 text-xs font-medium text-destructive hover:bg-destructive/30 hover:text-destructive"
              onClick={() => setIsAdding(false)}
              disabled={isLoadingAlcohol}
            >
              삭제
            </Button>
          </div>

          {isLoadingAlcohol && (
            <p className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              DB 위스키 정보를 불러오는 중입니다.
            </p>
          )}

          <div className="mt-5 grid gap-2 md:grid-cols-[minmax(0,1fr)_auto]">
            <WhiskySearchSelect
              onSelect={(whisky) => void handleSelectAlcohol(whisky)}
              excludeIds={selectedAlcoholIds}
              placeholder="위스키 검색 ..."
              disabled={isLoadingAlcohol}
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleAddManualAlcohol}
              disabled={isLoadingAlcohol}
            >
              직접 입력
            </Button>
          </div>
        </div>
      )}

      <Button
        type="button"
        variant="secondary"
        className="h-14 w-full rounded-[10px] text-base font-semibold"
        onClick={() => setIsAdding(true)}
        disabled={isMaxReached || isAdding}
      >
        <Plus className="h-5 w-5" />
        추가
      </Button>
    </div>
  );
}
