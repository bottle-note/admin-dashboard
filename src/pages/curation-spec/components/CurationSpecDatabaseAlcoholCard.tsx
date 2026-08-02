import type { DragEvent } from 'react';
import { useFormContext, useWatch, type FieldValues } from 'react-hook-form';

import type { AlcoholSectionConfig } from '../curation-sections';
import type { WhiskyTastingEventAlcoholItemSchema } from '../curation-spec.schema';
import { CurationSpecAlcoholCard } from './CurationSpecAlcoholCard';

export function CurationSpecDatabaseAlcoholCard({
  name,
  index,
  schema,
  config,
  required,
  isDragOver,
  onRemove,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: {
  name: string;
  index: number;
  schema: WhiskyTastingEventAlcoholItemSchema;
  config: AlcoholSectionConfig;
  required: boolean;
  isDragOver: boolean;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onDragStart: (event: DragEvent<HTMLDivElement>) => void;
  onDragOver: (event: DragEvent<HTMLDivElement>) => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
}) {
  const form = useFormContext<FieldValues>();
  const item = useWatch({ control: form.control, name }) as FieldValues;
  const alcohol = item.alcohol as FieldValues;

  return (
    <CurationSpecAlcoholCard
      name={name}
      index={index}
      schema={schema}
      config={config}
      required={required}
      imageUrl={alcohol.imageUrl as string}
      imageAlt={alcohol.korName as string}
      isDragOver={isDragOver}
      onRemove={onRemove}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
      canMoveUp={canMoveUp}
      canMoveDown={canMoveDown}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
    >
      <div className="space-y-1">
        <p className="truncate text-base font-semibold text-foreground">
          {alcohol.korName as string}
        </p>
        <p className="truncate text-sm text-foreground">{alcohol.engName as string}</p>
        <p className="text-sm text-foreground">
          {[alcohol.abv, alcohol.korCategory].filter(Boolean).join(' · ')}
        </p>
      </div>
    </CurationSpecAlcoholCard>
  );
}
