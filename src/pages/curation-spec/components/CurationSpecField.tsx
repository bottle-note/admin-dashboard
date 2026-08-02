import { useFormContext, useWatch, type FieldValues } from 'react-hook-form';

import { FormField } from '@/components/common/FormField';
import { PlaceSearchInput } from '@/components/common/PlaceSearchInput';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { JsonSchemaNode } from '@/types/api';

import type { WhiskyTastingEventAlcoholListSchema } from '../curation-spec.schema';
import { CurationSpecAlcoholCardListField } from './CurationSpecAlcoholCardListField';

export function CurationSpecField({
  name,
  schema,
  required,
  className,
  disabledBy,
}: {
  name: string;
  schema: JsonSchemaNode;
  required: boolean;
  className?: string;
  disabledBy?: string;
}) {
  const form = useFormContext<FieldValues>();
  const watchedValue = useWatch({ control: form.control, name: disabledBy ?? name });
  const disabled = disabledBy ? watchedValue === true : false;
  const fieldStyle = schema['x-field-style'];
  const label = schema['x-display-name'] as string;

  if (fieldStyle === 'hidden') {
    return <input type="hidden" {...form.register(name)} />;
  }

  // alcohol card 인 경우 별도 레이아웃으로 처리
  if (fieldStyle === 'alcohol-card-list') {
    return (
      <CurationSpecAlcoholCardListField
        name={name}
        schema={schema as WhiskyTastingEventAlcoholListSchema}
        required={required}
      />
    );
  }

  const error = form.getFieldState(name, form.formState).error?.message;

  if (fieldStyle === 'address-search') {
    const targets = schema['x-place-search-targets'] as Record<
      string,
      'placeName' | 'id' | 'address'
    >;

    return (
      <FormField label={label} required={required} error={error} className={className}>
        <PlaceSearchInput
          aria-label={label}
          maxLength={schema.maxLength}
          placeholder={schema.example as string}
          disabled={disabled}
          registration={form.register(name)}
          onPlaceSelect={(place) => {
            const values = {
              placeName: place.placeName,
              id: place.id,
              address: place.address,
            };

            Object.entries(targets).forEach(([targetName, source]) => {
              form.setValue(targetName, values[source], {
                shouldDirty: true,
                shouldValidate: true,
              });
            });
          }}
        />
      </FormField>
    );
  }

  if (fieldStyle === 'long-text') {
    return (
      <FormField label={label} required={required} error={error} className={className}>
        <Textarea
          aria-label={label}
          rows={5}
          maxLength={schema.maxLength}
          placeholder={schema.example as string}
          disabled={disabled}
          {...form.register(name)}
        />
      </FormField>
    );
  }

  if (schema.type === 'boolean') {
    return (
      <div className={className}>
        <div className="flex items-center gap-2">
          <Checkbox
            id={name}
            checked={watchedValue === true}
            disabled={disabled}
            onCheckedChange={(checked) =>
              form.setValue(name, checked === true, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          />
          <Label htmlFor={name} className="cursor-pointer font-normal">
            {label}
            {required && <span className="ml-1 text-destructive">*</span>}
          </Label>
        </div>
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      </div>
    );
  }

  if (schema.type === 'integer' || schema.type === 'number') {
    return (
      <FormField label={label} required={required} error={error} className={className}>
        <Input
          aria-label={label}
          type="number"
          min={schema.minimum}
          max={schema.maximum}
          placeholder={schema.example as string}
          disabled={disabled}
          {...form.register(name, { valueAsNumber: true })}
        />
      </FormField>
    );
  }

  return (
    <FormField label={label} required={required} error={error} className={className}>
      <Input
        aria-label={label}
        type={fieldStyle === 'time' ? 'time' : schema.format === 'date' ? 'date' : 'text'}
        maxLength={schema.maxLength}
        readOnly={schema['x-read-only'] as boolean}
        placeholder={schema.example as string}
        disabled={disabled}
        {...form.register(name)}
      />
    </FormField>
  );
}
