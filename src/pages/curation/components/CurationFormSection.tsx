import { useEffect } from 'react';
import type { FieldValues } from 'react-hook-form';
import { useFormContext, useWatch } from 'react-hook-form';

import type { CurationFormSectionModel, CurationSectionFieldModel } from '../curation-form-model';
import { CurationFormFieldRenderer } from './CurationFormFieldRenderer';
import { CurationSectionCard } from './CurationSectionCard';

interface CurationFormSectionProps {
  section: CurationFormSectionModel;
}

// form renderer 레이어: section model의 필드 목록을 공통 field renderer로 렌더링합니다.
export function CurationFormSection({ section }: CurationFormSectionProps) {
  const form = useFormContext<FieldValues>();
  const watchedValues = useWatch({ control: form.control }) as FieldValues | undefined;
  const firstField = section.fields[0]?.field;
  const visibleFields = section.fields.filter((sectionField) =>
    isSectionFieldVisible(sectionField, watchedValues, form.getValues)
  );

  useEffect(() => {
    for (const sectionField of section.fields) {
      if (isSectionFieldVisible(sectionField, watchedValues, form.getValues)) continue;

      const nextValue = sectionField.visibleWhen?.hiddenValue ?? '';
      if (Object.is(form.getValues(sectionField.field.key), nextValue)) continue;

      form.setValue(sectionField.field.key, nextValue, {
        shouldDirty: true,
        shouldValidate: true,
      });
      form.clearErrors(sectionField.field.key);
    }
  }, [form, section.fields, watchedValues]);

  if (visibleFields.length === 1 && firstField?.kind === 'alcohol-card-list') {
    return (
      <CurationFormFieldRenderer
        field={firstField}
        sectionHeader={{
          stepNumber: section.stepNumber,
          description: section.description,
        }}
      />
    );
  }

  return (
    <CurationSectionCard
      stepNumber={section.stepNumber}
      title={section.title}
      description={section.description}
      contentClassName={section.contentClassName}
    >
      {visibleFields.map(({ field, className }) => (
        <CurationFormFieldRenderer key={field.key} field={field} className={className} />
      ))}
    </CurationSectionCard>
  );
}

function isSectionFieldVisible(
  sectionField: CurationSectionFieldModel,
  watchedValues: FieldValues | undefined,
  getValue: (name: string) => unknown
) {
  const condition = sectionField.visibleWhen;
  if (!condition) return true;

  const currentValue =
    watchedValues && Object.prototype.hasOwnProperty.call(watchedValues, condition.fieldKey)
      ? watchedValues[condition.fieldKey]
      : getValue(condition.fieldKey);

  return Object.is(currentValue, condition.equals);
}
