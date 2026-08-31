import { useState, type DragEvent } from 'react';
import { useFieldArray, useFormContext, useWatch, type FieldValues } from 'react-hook-form';
import { Plus } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import type { AlcoholSectionConfig, CurationSpecSections } from '../curation-sections.type';
import type {
  ProgramWhiskyListRequestSpec,
  WhiskyCurationRequestSpec,
  WhiskyTastingEventAlcoholListSchema,
  WhiskyTastingEventPayload,
} from '../curation-spec.schema';
import { CurationSpecDatabaseAlcoholAddCard } from './CurationSpecDatabaseAlcoholAddCard';
import { CurationSpecDatabaseAlcoholCard } from './CurationSpecDatabaseAlcoholCard';
import { CurationSpecManualAlcoholCard } from './CurationSpecManualAlcoholCard';

const AUTO_SCROLL_EDGE = 96;
const AUTO_SCROLL_DISTANCE = 24;

export function CurationSpecAlcoholCardListField({
  name,
  schema,
  required,
  config,
  pairingConfig,
}: {
  name: string;
  schema:
    | ProgramWhiskyListRequestSpec
    | WhiskyTastingEventAlcoholListSchema
    | WhiskyCurationRequestSpec;
  required: boolean;
  config?: AlcoholSectionConfig;
  pairingConfig?: NonNullable<CurationSpecSections[string]['fields'][string]['pairing']>;
}) {
  const form = useFormContext<FieldValues>();
  const alcohols = useWatch({
    control: form.control,
    name,
  }) as WhiskyTastingEventPayload['alcohols'];
  const alcoholFieldArray = useFieldArray({ control: form.control, name });
  const [isAdding, setIsAdding] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const itemSchema = schema.type === 'array' ? schema.items : schema;
  const pairingSchema = schema.type === 'object' ? schema.properties.pairings : undefined;
  const resolvedConfig: AlcoholSectionConfig = config ?? {
    itemLabel: (schema['x-display-name'] as string | undefined) ?? '라인업',
    emptyMessage: `${(schema['x-display-name'] as string | undefined) ?? '라인업'}을 추가해주세요.`,
    fields: {},
  };
  const isMaxReached = schema.maxItems !== undefined && alcohols.length >= schema.maxItems;
  const selectedAlcoholIds = alcohols
    .map((item) => item.alcohol.alcoholId)
    .filter((alcoholId): alcoholId is number => typeof alcoholId === 'number');
  const error = form.getFieldState(name, form.formState).error?.message;
  const limitText =
    schema.minItems !== undefined && schema.maxItems !== undefined
      ? `${schema.minItems}-${schema.maxItems}개까지 등록할 수 있습니다.`
      : schema.minItems !== undefined
        ? `${schema.minItems}개 이상 등록할 수 있습니다.`
        : schema.maxItems !== undefined
          ? `최대 ${schema.maxItems}개까지 등록할 수 있습니다.`
          : '필요한 만큼 등록할 수 있습니다.';

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
      ...(pairingSchema
        ? {
            pairings: Array.from({ length: pairingSchema.minItems }, () => ({
              itemName: '',
              pairingNote: '',
              itemImageUrl: '',
            })),
          }
        : {}),
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
          {limitText}
          {required && <span className="ml-1 text-destructive">*</span>}
        </p>
        <Badge variant="secondary">{alcohols.length}</Badge>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {alcoholFieldArray.fields.length === 0 && !isAdding ? (
        <div className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
          {resolvedConfig.emptyMessage}
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
                config={resolvedConfig}
                pairingSchema={pairingSchema}
                pairingConfig={pairingConfig}
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
                config={resolvedConfig}
                pairingSchema={pairingSchema}
                pairingConfig={pairingConfig}
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
        <CurationSpecDatabaseAlcoholAddCard
          index={alcohols.length}
          schema={itemSchema}
          config={resolvedConfig}
          required={required}
          excludeIds={selectedAlcoholIds}
          onAdd={(item) => {
            alcoholFieldArray.append({
              ...item,
              ...(pairingSchema
                ? {
                    pairings: Array.from({ length: pairingSchema.minItems }, () => ({
                      itemName: '',
                      pairingNote: '',
                      itemImageUrl: '',
                    })),
                  }
                : {}),
            });
            setIsAdding(false);
          }}
          onAddManual={handleAddManualAlcohol}
          onCancel={() => setIsAdding(false)}
        />
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
