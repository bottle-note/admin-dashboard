import { inputFormatLabel } from './string-input-rules';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { AttributeValueInput } from './AttributeValueInput';
import { getErrorMessage } from '@/lib/api-error';
import { displayValue, mappingValueError, type Attribute, type Mapping } from './attribute-model';

export function MappingValueEditor({
  attribute,
  mapping,
  onSave,
}: {
  attribute: Attribute;
  mapping: Mapping;
  onSave: (value: string) => Promise<unknown>;
}) {
  const [error, setError] = useState<string>();
  const schema = z.object({
    value: z
      .string()
      .trim()
      .superRefine((value, context) => {
        const message = mappingValueError(attribute, value);
        if (message) context.addIssue({ code: 'custom', message });
      }),
  });
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { value: mapping.value ?? '' },
  });
  return (
    <form
      aria-label={`${attribute.displayName} · ${mapping.value} 값 편집`}
      className="min-w-0 flex-1 space-y-2"
      onSubmit={handleSubmit(async ({ value }) => {
        setError(undefined);
        try {
          await onSave(value);
        } catch (cause) {
          setError(getErrorMessage(cause));
        }
      })}
    >
      <label className="block text-xs font-medium">
        {attribute.displayName} 값
        <AttributeValueInput
          allowedValues={attribute.datatype === 'STRING' ? attribute.allowedValues : null}
          {...register('value')}
          aria-label={`${attribute.displayName} 값`}
          className="mt-1.5 h-8 bg-slate-50 font-mono"
          disabled={isSubmitting}
        />
      </label>
      {attribute.pattern && (
        <p className="break-all text-xs text-slate-500">
          입력 형식: {inputFormatLabel(attribute.pattern)}
        </p>
      )}
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="min-w-0 break-all text-slate-500">
          현재: {displayValue(attribute, mapping.value)}
        </span>
        <Button
          size="sm"
          type="submit"
          className="h-7 shrink-0 bg-teal-800 hover:bg-teal-900"
          disabled={isSubmitting || !isDirty}
        >
          값 저장
        </Button>
      </div>
      {(errors.value?.message || error) && (
        <p role="alert" className="text-xs text-red-700">
          {errors.value?.message || error}
        </p>
      )}
    </form>
  );
}
