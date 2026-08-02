import { useRef, type ChangeEvent, type DragEvent } from 'react';
import { useFormContext, useWatch, type FieldValues } from 'react-hook-form';
import { Loader2, Upload } from 'lucide-react';

import { FormField } from '@/components/common/FormField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { S3UploadPath, useImageUpload } from '@/hooks/useImageUpload';
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
        <AlcoholImageField
          name={`${name}.alcohol.imageUrl`}
          schema={alcoholFields.imageUrl}
          required={alcoholSchema.required.includes('imageUrl')}
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

function AlcoholImageField({
  name,
  schema,
  required,
}: {
  name: string;
  schema: JsonSchemaNode;
  required: boolean;
}) {
  const form = useFormContext<FieldValues>();
  const inputRef = useRef<HTMLInputElement>(null);
  const { upload, isUploading, error } = useImageUpload({
    rootPath: S3UploadPath.CURATION,
  });

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const imageUrl = await upload(file);
    if (!imageUrl) return;

    form.setValue(name, imageUrl, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  return (
    <FormField
      label={schema.description as string}
      required={required}
      error={form.getFieldState(name, form.formState).error?.message ?? error?.message}
      className="md:col-span-2"
    >
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(event) => void handleImageUpload(event)}
          disabled={isUploading}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {isUploading ? '업로드 중' : '이미지 업로드'}
        </Button>
        <span className="text-xs text-muted-foreground">PNG, JPG, WEBP 지원</span>
      </div>
    </FormField>
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
