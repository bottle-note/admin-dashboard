import { useFormContext, useWatch, type FieldValues } from 'react-hook-form';

import { FormField } from '@/components/common/FormField';
import { PlaceSearchInput } from '@/components/common/PlaceSearchInput';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { JsonSchemaNode } from '@/types/api';

import type { AlcoholSectionConfig } from '../curation-sections.type';
import type { WhiskyTastingEventAlcoholListSchema } from '../curation-spec.schema';
import { CurationSpecAlcoholCardListField } from './CurationSpecAlcoholCardListField';

export function CurationSpecField({
  name,
  schema,
  required,
  label,
  className,
  disabledWhen,
  requiredWhen,
  setValueWhenChecked,
  optionLabels,
  alcoholConfig,
}: {
  name: string;
  schema: JsonSchemaNode;
  required: boolean;
  label?: string;
  className?: string;
  disabledWhen?: {
    field: string;
    equals: unknown;
  };
  requiredWhen?: {
    field: string;
    equals: unknown;
  };
  setValueWhenChecked?: {
    field: string;
    value: unknown;
  };
  optionLabels?: Record<string, string>;
  alcoholConfig?: AlcoholSectionConfig;
}) {
  const form = useFormContext<FieldValues>();
  const fieldValue = useWatch({ control: form.control, name });
  const disabledConditionValue = useWatch({
    control: form.control,
    name: disabledWhen?.field ?? name,
  });
  const requiredConditionValue = useWatch({
    control: form.control,
    name: requiredWhen?.field ?? name,
  });
  const disabled = disabledWhen ? Object.is(disabledConditionValue, disabledWhen.equals) : false;
  const isRequired =
    required || (requiredWhen ? Object.is(requiredConditionValue, requiredWhen.equals) : false);
  const fieldStyle = schema['x-field-style'];
  const fieldLabel = label ?? (schema['x-display-name'] as string);
  const requiredMessage = isRequired ? `${fieldLabel}은(는) 필수입니다.` : false;

  if (fieldStyle === 'hidden') {
    return <input type="hidden" {...form.register(name)} />;
  }

  // alcohol card 인 경우 별도 레이아웃으로 처리
  if (fieldStyle === 'alcohol-card-list') {
    return (
      <CurationSpecAlcoholCardListField
        name={name}
        schema={schema as WhiskyTastingEventAlcoholListSchema}
        required={isRequired}
        config={alcoholConfig}
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
      <FormField label={fieldLabel} required={isRequired} error={error} className={className}>
        <PlaceSearchInput
          aria-label={fieldLabel}
          maxLength={schema.maxLength}
          placeholder={schema.example as string}
          disabled={disabled}
          registration={form.register(name, { required: requiredMessage })}
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
      <FormField label={fieldLabel} required={isRequired} error={error} className={className}>
        <Textarea
          aria-label={fieldLabel}
          rows={5}
          maxLength={schema.maxLength}
          placeholder={schema.example as string}
          disabled={disabled}
          {...form.register(name, { required: requiredMessage })}
        />
      </FormField>
    );
  }

  if (schema.type === 'string' && schema.enum) {
    const options = schema.enum as string[];
    const labels = optionLabels as Record<string, string>;

    return (
      <FormField label={fieldLabel} required={isRequired} error={error} className={className}>
        <Select
          value={fieldValue as string}
          disabled={disabled}
          onValueChange={(value) =>
            form.setValue(name, value, {
              shouldDirty: true,
              shouldValidate: true,
            })
          }
        >
          <SelectTrigger aria-label={fieldLabel}>
            <SelectValue placeholder={`${fieldLabel} 선택`} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option} value={option}>
                {labels[option]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
    );
  }

  if (schema.type === 'array' && schema.items?.enum) {
    const options = schema.items.enum as string[];
    const labels = optionLabels as Record<string, string>;
    const selectedValues = fieldValue as string[];
    const isMaxReached = selectedValues.length >= (schema.maxItems as number);

    return (
      <FormField label={fieldLabel} required={isRequired} error={error} className={className}>
        <div className="flex flex-wrap gap-2">
          {options.map((option) => {
            const checked = selectedValues.includes(option);
            const id = `${name}-${option}`;

            return (
              <div key={option} className="relative">
                <Checkbox
                  id={id}
                  className="peer sr-only"
                  checked={checked}
                  disabled={disabled || (!checked && isMaxReached)}
                  onCheckedChange={(nextChecked) =>
                    form.setValue(
                      name,
                      nextChecked === true
                        ? [...selectedValues, option]
                        : selectedValues.filter((value) => value !== option),
                      {
                        shouldDirty: true,
                        shouldValidate: true,
                      }
                    )
                  }
                />
                <Label
                  htmlFor={id}
                  className="inline-flex h-9 cursor-pointer items-center rounded-full border px-4 text-sm font-normal peer-disabled:cursor-not-allowed peer-disabled:opacity-50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground"
                >
                  {labels[option]}
                </Label>
              </div>
            );
          })}
        </div>
      </FormField>
    );
  }

  if (schema.type === 'boolean') {
    return (
      <div className={className}>
        <div className="flex items-center gap-2">
          <Checkbox
            id={name}
            checked={fieldValue === true}
            disabled={disabled}
            onCheckedChange={(checked) => {
              const isChecked = checked === true;

              form.setValue(name, isChecked, {
                shouldDirty: true,
                shouldValidate: true,
              });

              if (isChecked && setValueWhenChecked) {
                form.setValue(setValueWhenChecked.field, setValueWhenChecked.value, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              }
            }}
          />
          <Label htmlFor={name} className="cursor-pointer font-normal">
            {fieldLabel}
            {isRequired && <span className="ml-1 text-destructive">*</span>}
          </Label>
        </div>
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      </div>
    );
  }

  if (schema.type === 'integer' || schema.type === 'number') {
    return (
      <FormField label={fieldLabel} required={isRequired} error={error} className={className}>
        <Input
          aria-label={fieldLabel}
          type="number"
          min={schema.minimum}
          max={schema.maximum}
          placeholder={schema.example as string}
          disabled={disabled}
          {...form.register(name, { required: requiredMessage, valueAsNumber: true })}
        />
      </FormField>
    );
  }

  return (
    <FormField label={fieldLabel} required={isRequired} error={error} className={className}>
      <Input
        aria-label={fieldLabel}
        type={
          fieldStyle === 'time' || schema.format === 'time'
            ? 'time'
            : schema.format === 'date'
              ? 'date'
              : 'text'
        }
        maxLength={schema.maxLength}
        readOnly={schema['x-read-only'] as boolean}
        placeholder={schema.example as string}
        disabled={disabled}
        {...form.register(name, { required: requiredMessage })}
      />
    </FormField>
  );
}
