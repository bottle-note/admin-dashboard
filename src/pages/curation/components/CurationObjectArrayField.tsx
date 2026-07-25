import { useFieldArray, useFormContext, useWatch, type FieldValues } from 'react-hook-form';
import { Plus } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { createDefaultCurationFieldValue } from '../curation-form-schema';
import {
  prefixCurationFieldModelKey,
  type CurationFieldModel,
  type CurationObjectArrayFieldModel,
} from '../curation-form-model';
import { CurationFormFieldRenderer } from './CurationFormFieldRenderer';
import { CurationSectionCard } from './CurationSectionCard';

interface CurationObjectArrayFieldProps {
  fieldModel: CurationObjectArrayFieldModel;
  onImageUploadingChange?: (isUploading: boolean) => void;
  sectionHeader?: {
    stepNumber?: number;
    description?: string;
  };
}

export function CurationObjectArrayField({
  fieldModel,
  onImageUploadingChange,
  sectionHeader,
}: CurationObjectArrayFieldProps) {
  const form = useFormContext<FieldValues>();
  const fieldArray = useFieldArray({
    control: form.control,
    name: fieldModel.key,
  });
  const watchedItems = useWatch({
    control: form.control,
    name: fieldModel.key,
  });
  const items = Array.isArray(watchedItems) ? watchedItems : [];
  const isMaxReached =
    typeof fieldModel.maxItems === 'number' && items.length >= fieldModel.maxItems;
  const fieldError = form.getFieldState(fieldModel.key, form.formState).error;
  const limitDescription =
    typeof fieldModel.maxItems === 'number'
      ? `${fieldModel.minItems}-${fieldModel.maxItems}개까지 등록할 수 있습니다.`
      : `${fieldModel.minItems}개 이상 등록할 수 있습니다.`;

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
        <>
          {sectionHeader?.description && <span>{sectionHeader.description}</span>}
          <span className="mt-1 block">{limitDescription}</span>
        </>
      }
      titleSuffix={items.length > 0 ? <Badge variant="secondary">{items.length}</Badge> : null}
      contentClassName="space-y-4"
    >
      {fieldError?.message && <p className="text-sm text-destructive">{fieldError.message}</p>}

      {fieldArray.fields.length === 0 ? (
        <div className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
          {fieldModel.label}을 추가해주세요.
        </div>
      ) : (
        <div className="space-y-4">
          {fieldArray.fields.map((arrayField, index) => (
            <div
              key={arrayField.id}
              role="group"
              aria-label={`${fieldModel.label} ${index + 1}`}
              className="rounded-lg border bg-muted/20 p-4 sm:p-5"
            >
              <div className="mb-5 flex items-center justify-between gap-4">
                <h3 className="text-base font-semibold">
                  {fieldModel.label} {index + 1}
                </h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => fieldArray.remove(index)}
                >
                  삭제
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {fieldModel.itemFields.map((itemField) => {
                  const nestedField = createNestedFieldModel(fieldModel, itemField, index);

                  return (
                    <CurationFormFieldRenderer
                      key={itemField.key}
                      field={nestedField}
                      className={
                        itemField.kind === 'textarea' ||
                        itemField.kind === 'multi-select' ||
                        itemField.kind === 'alcohol-card-list' ||
                        itemField.kind === 'object-array'
                          ? 'md:col-span-2'
                          : undefined
                      }
                      onImageUploadingChange={onImageUploadingChange}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={isMaxReached}
        onClick={() =>
          fieldArray.append(
            Object.fromEntries(
              fieldModel.itemFields.map((field) => [
                field.key,
                createDefaultCurationFieldValue(field),
              ])
            ),
            { shouldFocus: false }
          )
        }
      >
        <Plus className="mr-2 h-4 w-4" />
        {fieldModel.label} 추가
      </Button>
    </CurationSectionCard>
  );
}

function createNestedFieldModel(
  parent: CurationObjectArrayFieldModel,
  field: CurationFieldModel,
  index: number
): CurationFieldModel {
  const nestedField = prefixCurationFieldModelKey(field, `${parent.key}.${index}`);

  return {
    ...nestedField,
    ariaLabel: `${index + 1}번 ${parent.label} ${field.label}`,
  };
}
