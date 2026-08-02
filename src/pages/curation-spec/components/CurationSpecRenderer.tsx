import type { JsonSchemaNode } from '@/types/api';

import {
  createAlcoholCardListFieldModel,
  createCurationBasicFieldModel,
  getSchemaDisplayLabel,
  type CurationFieldModel,
} from '../../curation/curation-form-model';
import { CurationFormFieldRenderer } from '../../curation/components/CurationFormFieldRenderer';
import { CurationSectionCard } from '../../curation/components/CurationSectionCard';

export function CurationSpecRenderer({
  requestSpec,
  sections,
}: {
  requestSpec: JsonSchemaNode;
  sections: Record<
    string,
    {
      subtitle: string;
      fields: Record<string, JsonSchemaNode>;
    }
  >;
}) {
  return (
    <>
      {Object.entries(sections).map(([title, section], index) => {
        const fieldModels = Object.keys(section.fields).map((key) =>
          createFieldModel(requestSpec, key)
        );
        const firstField = fieldModels[0]!;

        if (fieldModels.length === 1 && firstField.kind === 'alcohol-card-list') {
          return (
            <CurationFormFieldRenderer
              key={title}
              field={firstField}
              sectionHeader={{
                stepNumber: index + 2,
                description: section.subtitle,
              }}
            />
          );
        }

        return (
          <CurationSectionCard
            key={title}
            stepNumber={index + 2}
            title={title}
            description={section.subtitle}
            contentClassName="grid gap-4 md:grid-cols-2"
          >
            {fieldModels.map((field) => (
              <CurationFormFieldRenderer
                key={field.key}
                field={field}
                className={
                  field.kind === 'textarea' || field.kind === 'address'
                    ? 'md:col-span-2'
                    : undefined
                }
              />
            ))}
          </CurationSectionCard>
        );
      })}
    </>
  );
}

function createFieldModel(requestSpec: JsonSchemaNode, key: string): CurationFieldModel {
  const fieldSchema = requestSpec.properties![key]!;
  const required = requestSpec.required!.includes(key);

  if (fieldSchema['x-field-style'] === 'none') {
    return {
      key,
      kind: 'hidden',
      label: getSchemaDisplayLabel(fieldSchema),
      required,
    };
  }

  if (fieldSchema['x-field-style'] === 'alcohol-card-list') {
    return createAlcoholCardListFieldModel({
      key,
      label: getSchemaDisplayLabel(fieldSchema),
      required,
      minItems: fieldSchema.minItems!,
      maxItems: fieldSchema.maxItems,
      itemSchema: fieldSchema.items!,
    });
  }

  return createCurationBasicFieldModel(requestSpec, key);
}
