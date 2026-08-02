import type { DragEvent } from 'react';
import { useFormContext, useWatch, type FieldValues } from 'react-hook-form';

import { FormField } from '@/components/common/FormField';
import { Input } from '@/components/ui/input';
import type { JsonSchemaNode } from '@/types/api';

import type { WhiskyTastingEventAlcoholItemSchema } from '../curation-spec.schema';
import { CurationSpecAlcoholCard } from './CurationSpecAlcoholCard';

export function CurationSpecManualAlcoholCard({
  name,
  index,
  schema,
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
  const alcoholSchema = schema.properties.alcohol;
  const alcoholFields = alcoholSchema.properties;

  return (
    <CurationSpecAlcoholCard
      name={name}
      index={index}
      schema={schema}
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
      <div className="grid gap-4 md:grid-cols-2">
        <AlcoholTextField
          name={`${name}.alcohol.korName`}
          schema={alcoholFields.korName}
          required={alcoholSchema.required.includes('korName')}
        />
        <AlcoholTextField
          name={`${name}.alcohol.engName`}
          schema={alcoholFields.engName}
          required={alcoholSchema.required.includes('engName')}
        />
        <AlcoholTextField
          name={`${name}.alcohol.imageUrl`}
          schema={alcoholFields.imageUrl}
          required={alcoholSchema.required.includes('imageUrl')}
          className="md:col-span-2"
        />
        <AlcoholTextField
          name={`${name}.alcohol.abv`}
          schema={alcoholFields.abv}
          required={alcoholSchema.required.includes('abv')}
        />
        <AlcoholTextField
          name={`${name}.alcohol.volume`}
          schema={alcoholFields.volume}
          required={alcoholSchema.required.includes('volume')}
        />
        <AlcoholTextField
          name={`${name}.alcohol.cask`}
          schema={alcoholFields.cask}
          required={alcoholSchema.required.includes('cask')}
        />
        <AlcoholTextField
          name={`${name}.alcohol.regionName`}
          schema={alcoholFields.regionName}
          required={alcoholSchema.required.includes('regionName')}
        />
        <AlcoholTextField
          name={`${name}.alcohol.korCategory`}
          schema={alcoholFields.korCategory}
          required={alcoholSchema.required.includes('korCategory')}
          className="md:col-span-2"
        />
      </div>
    </CurationSpecAlcoholCard>
  );
}

function AlcoholTextField({
  name,
  schema,
  required,
  className,
}: {
  name: string;
  schema: JsonSchemaNode;
  required: boolean;
  className?: string;
}) {
  const form = useFormContext<FieldValues>();

  return (
    <FormField
      label={schema.description as string}
      required={required}
      error={form.getFieldState(name, form.formState).error?.message}
      className={className}
    >
      <Input
        maxLength={schema.maxLength}
        placeholder={schema.example as string}
        {...form.register(name)}
      />
    </FormField>
  );
}
