import { useFieldArray, useFormContext, useWatch, type FieldValues } from 'react-hook-form';
import { Plus } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import type { ProgramFormValues, ProgramListRequestSpec } from '../curation-spec.schema';
import { ProgramCard } from './ProgramCard';
import type { ProgramSectionConfig } from './program-sections';

export function ProgramListField({
  name,
  schema,
  required,
  config,
}: {
  name: string;
  schema: ProgramListRequestSpec;
  required: boolean;
  config: ProgramSectionConfig;
}) {
  const form = useFormContext<FieldValues>();
  const programs = useWatch({ control: form.control, name }) as ProgramFormValues['programs'];
  const programFieldArray = useFieldArray({ control: form.control, name });
  const error = form.getFieldState(name, form.formState).error?.message;
  const isMaxReached = programs.length >= schema.maxItems;

  const handleAdd = () => {
    programFieldArray.append({
      name: '',
      type: 'MASTER_CLASS',
      programDate: '',
      startTime: '',
      endTime: '',
      venue: '',
      host: '',
      description: '',
      applicationUrl: '',
      whiskies: [],
    });
  };

  return (
    <div className="min-w-0 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {schema.minItems}-{schema.maxItems}개까지 등록할 수 있습니다.
          {required && <span className="ml-1 text-destructive">*</span>}
        </p>
        <Badge variant="secondary">{programs.length}</Badge>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="min-w-0 space-y-4">
        {programFieldArray.fields.map((field, index) => (
          <ProgramCard
            key={field.id}
            name={`${name}.${index}`}
            index={index}
            schema={schema.items}
            config={config}
            onRemove={() => programFieldArray.remove(index)}
            onMoveUp={() => programFieldArray.move(index, index - 1)}
            onMoveDown={() => programFieldArray.move(index, index + 1)}
            canRemove={programs.length > schema.minItems}
            canMoveUp={index > 0}
            canMoveDown={index < programs.length - 1}
          />
        ))}
      </div>

      <Button
        type="button"
        variant="secondary"
        className="h-14 w-full rounded-[10px] text-base font-semibold"
        onClick={handleAdd}
        disabled={isMaxReached}
      >
        <Plus className="h-5 w-5" />
        {config.addButtonLabel}
      </Button>
    </div>
  );
}
