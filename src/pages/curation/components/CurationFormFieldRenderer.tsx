import { useRef, type ReactNode } from 'react';
import type { FieldValues } from 'react-hook-form';
import { useFormContext, useWatch } from 'react-hook-form';

import { FormField } from '@/components/common/FormField';
import { PlaceSearchInput, type SelectedPlace } from '@/components/common/PlaceSearchInput';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

import type {
  CurationBooleanRadioFieldModel,
  CurationBasicFieldModel,
  CurationFieldModel,
  CurationMultiSelectFieldModel,
  CurationNumberFieldModel,
  CurationSelectFieldModel,
  CurationTextFieldModel,
} from '../curation-form-model';
import { CurationObjectArrayField } from './CurationObjectArrayField';
import {
  CurationWhiskyCardListField,
  type CurationWhiskyCardListFieldOptions,
} from './CurationWhiskyCardListField';

interface CurationFormFieldRendererProps {
  field: CurationFieldModel;
  className?: string;
  onImageUploadingChange?: (isUploading: boolean) => void;
  sectionHeader?: {
    stepNumber?: number;
    description?: string;
  };
  alcoholCardListOptions?: CurationWhiskyCardListFieldOptions;
}

type StandardFieldRendererProps = {
  field: CurationBasicFieldModel;
  form: ReturnType<typeof useFormContext<FieldValues>>;
  name: string;
};

type StandardFieldRenderer = (props: StandardFieldRendererProps) => ReactNode;

const STANDARD_FIELD_RENDERER_REGISTRY: Record<
  CurationBasicFieldModel['kind'],
  StandardFieldRenderer
> = {
  text: renderTextInput,
  date: renderTextInput,
  time: renderTextInput,
  address: renderAddressInput,
  hidden: renderHiddenInput,
  textarea: renderTextAreaInput,
  number: renderNumberInput,
  'boolean-radio': renderBooleanRadioInput,
  select: renderSelectInput,
  'multi-select': renderMultiSelectInput,
};

// 4. renderer registry 레이어: field model의 kind에 맞는 입력 컴포넌트를 선택해 렌더링합니다.
export function CurationFormFieldRenderer({
  field,
  className,
  onImageUploadingChange,
  sectionHeader,
  alcoholCardListOptions,
}: CurationFormFieldRendererProps) {
  if (field.kind === 'alcohol-card-list') {
    return (
      <CurationWhiskyCardListField
        fieldModel={field}
        onImageUploadingChange={onImageUploadingChange}
        sectionHeader={sectionHeader}
        {...alcoholCardListOptions}
      />
    );
  }

  if (field.kind === 'object-array') {
    return (
      <CurationObjectArrayField
        fieldModel={field}
        sectionHeader={sectionHeader}
        onImageUploadingChange={onImageUploadingChange}
      />
    );
  }

  return <StandardCurationFormFieldRenderer field={field} className={className} />;
}

// 일반 입력 field model을 React Hook Form 입력 요소로 연결합니다.
function StandardCurationFormFieldRenderer({
  field,
  className,
}: {
  field: CurationBasicFieldModel;
  className?: string;
}) {
  const form = useFormContext<FieldValues>();
  const name = field.key;
  if (field.kind === 'hidden') {
    return renderStandardInput(field, form, name);
  }
  const error = form.getFieldState(name, form.formState).error?.message;

  return (
    <FormField label={field.label} required={field.required} error={error} className={className}>
      {renderStandardInput(field, form, name)}
    </FormField>
  );
}

function renderSelectInput({ field, form, name }: StandardFieldRendererProps) {
  if (field.kind !== 'select') return null;

  return <SelectField field={field} form={form} name={name} />;
}

function renderMultiSelectInput({ field, form, name }: StandardFieldRendererProps) {
  if (field.kind !== 'multi-select') return null;

  return <MultiSelectField field={field} form={form} name={name} />;
}

// 일반 입력 필드의 세부 kind별 실제 input 요소를 생성합니다.
function renderStandardInput(
  field: CurationBasicFieldModel,
  form: ReturnType<typeof useFormContext<FieldValues>>,
  name: string
) {
  const renderField = STANDARD_FIELD_RENDERER_REGISTRY[field.kind];
  return renderField({ field, form, name });
}

// text/date/time field model을 Input renderer로 위임합니다.
function renderTextInput({ field, form, name }: StandardFieldRendererProps) {
  if (field.kind !== 'text' && field.kind !== 'date' && field.kind !== 'time') return null;

  return <TextInputField field={field} form={form} name={name} />;
}

// address field model을 장소 검색 input renderer로 위임합니다.
function renderAddressInput({ field, form, name }: StandardFieldRendererProps) {
  if (field.kind !== 'address') return null;

  return <AddressField field={field} form={form} name={name} />;
}

function renderHiddenInput({ field, form, name }: StandardFieldRendererProps) {
  if (field.kind !== 'hidden') return null;

  return <input type="hidden" {...form.register(name)} />;
}

// textarea field model을 Textarea renderer로 위임합니다.
function renderTextAreaInput({ field, form, name }: StandardFieldRendererProps) {
  if (field.kind !== 'textarea') return null;

  return <TextAreaField field={field} form={form} name={name} />;
}

// number field model을 number Input renderer로 위임합니다.
function renderNumberInput({ field, form, name }: StandardFieldRendererProps) {
  if (field.kind !== 'number') return null;

  return <NumberField field={field} form={form} name={name} />;
}

// boolean-radio field model을 RadioGroup renderer로 위임합니다.
function renderBooleanRadioInput({ field, form, name }: StandardFieldRendererProps) {
  if (field.kind !== 'boolean-radio') return null;

  return <BooleanRadioField field={field} form={form} name={name} />;
}

// text/date/time field model을 Input 컴포넌트로 렌더링합니다.
function TextInputField({
  field,
  form,
  name,
}: {
  field: CurationTextFieldModel;
  form: ReturnType<typeof useFormContext<FieldValues>>;
  name: string;
}) {
  return (
    <Input
      aria-label={field.ariaLabel ?? field.label}
      type={field.kind === 'text' ? 'text' : field.kind}
      maxLength={field.maxLength}
      placeholder={field.placeholder}
      readOnly={field.readOnly}
      {...form.register(name)}
    />
  );
}

function SelectField({
  field,
  form,
  name,
}: {
  field: CurationSelectFieldModel;
  form: ReturnType<typeof useFormContext<FieldValues>>;
  name: string;
}) {
  const value = useWatch({ control: form.control, name });

  return (
    <Select
      value={typeof value === 'string' ? value : ''}
      onValueChange={(nextValue) =>
        form.setValue(name, nextValue, { shouldDirty: true, shouldValidate: true })
      }
    >
      <SelectTrigger aria-label={field.ariaLabel ?? field.label}>
        <SelectValue placeholder={`${field.label} 선택`} />
      </SelectTrigger>
      <SelectContent>
        {field.options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function MultiSelectField({
  field,
  form,
  name,
}: {
  field: CurationMultiSelectFieldModel;
  form: ReturnType<typeof useFormContext<FieldValues>>;
  name: string;
}) {
  const watchedValue = useWatch({ control: form.control, name });
  const values = Array.isArray(watchedValue)
    ? watchedValue.filter((value): value is string => typeof value === 'string')
    : [];
  const maxReached = typeof field.maxItems === 'number' && values.length >= field.maxItems;

  return (
    <div
      role="group"
      aria-label={field.ariaLabel ?? field.label}
      className="grid gap-3 rounded-md border p-4 sm:grid-cols-2"
    >
      {field.options.map((option) => {
        const checked = values.includes(option.value);
        const id = `${name}-${option.value}`;

        return (
          <div key={option.value} className="flex items-center gap-2">
            <Checkbox
              id={id}
              checked={checked}
              disabled={!checked && maxReached}
              onCheckedChange={(nextChecked) => {
                const nextValues =
                  nextChecked === true
                    ? [...values, option.value]
                    : values.filter((value) => value !== option.value);
                form.setValue(name, nextValues, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              }}
            />
            <Label htmlFor={id} className="cursor-pointer text-sm font-normal">
              {option.label}
            </Label>
          </div>
        );
      })}
    </div>
  );
}

// address field model을 장소 검색 입력 컴포넌트로 렌더링합니다.
function AddressField({
  field,
  form,
  name,
}: {
  field: CurationTextFieldModel;
  form: ReturnType<typeof useFormContext<FieldValues>>;
  name: string;
}) {
  return (
    <PlaceSearchInput
      aria-label={field.ariaLabel ?? field.label}
      placeholder={field.placeholder}
      maxLength={field.maxLength}
      registration={form.register(name)}
      onPlaceSelect={(place) => syncPlaceSelection(form, field.placeSearchTargets, place)}
    />
  );
}

function syncPlaceSelection(
  form: ReturnType<typeof useFormContext<FieldValues>>,
  targets: CurationTextFieldModel['placeSearchTargets'],
  place: SelectedPlace
) {
  if (!targets) return;

  const valuesBySource = {
    placeName: place.placeName,
    id: place.id,
    address: place.address,
  };

  for (const [fieldName, source] of Object.entries(targets)) {
    form.setValue(fieldName, valuesBySource[source], {
      shouldDirty: true,
      shouldValidate: true,
    });
  }
}

// textarea field model을 Textarea 컴포넌트로 렌더링합니다.
function TextAreaField({
  field,
  form,
  name,
}: {
  field: CurationTextFieldModel;
  form: ReturnType<typeof useFormContext<FieldValues>>;
  name: string;
}) {
  return (
    <Textarea
      aria-label={field.ariaLabel ?? field.label}
      rows={5}
      maxLength={field.maxLength}
      placeholder={field.placeholder}
      {...form.register(name)}
    />
  );
}

// number/integer field model을 숫자 Input 컴포넌트로 렌더링합니다.
function NumberField({
  field,
  form,
  name,
}: {
  field: CurationNumberFieldModel;
  form: ReturnType<typeof useFormContext<FieldValues>>;
  name: string;
}) {
  const value = useWatch({
    control: form.control,
    name,
  });
  const undecidedOption = field.undecidedOption;
  const lastDecidedValueRef = useRef(undecidedOption?.fallbackValue ?? 0);
  const isUndecided = undecidedOption !== undefined && value === undecidedOption.value;
  const registration = form.register(name, { valueAsNumber: true });
  const input = (
    <Input
      className={field.suffix ? 'pr-12' : undefined}
      aria-label={field.ariaLabel ?? field.label}
      type="number"
      min={field.minimum}
      max={field.maximum}
      disabled={isUndecided}
      placeholder={field.placeholder}
      {...registration}
    />
  );
  const inputWithSuffix = field.suffix ? (
    <div className="relative">
      {input}
      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm font-medium text-muted-foreground">
        {field.suffix}
      </span>
    </div>
  ) : (
    input
  );

  if (!undecidedOption) return inputWithSuffix;

  const checkboxId = `${name}-undecided`;

  const handleUndecidedCheckedChange = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      const currentValue = form.getValues(name);
      if (
        typeof currentValue === 'number' &&
        Number.isFinite(currentValue) &&
        currentValue !== undecidedOption.value
      ) {
        lastDecidedValueRef.current = currentValue;
      }

      form.setValue(name, undecidedOption.value, {
        shouldDirty: true,
        shouldValidate: true,
      });
      return;
    }

    form.setValue(name, lastDecidedValueRef.current, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  return (
    <div className="space-y-2">
      {inputWithSuffix}
      <div className="flex items-center gap-2">
        <Checkbox
          id={checkboxId}
          checked={isUndecided}
          onCheckedChange={handleUndecidedCheckedChange}
        />
        <Label htmlFor={checkboxId} className="cursor-pointer text-sm font-normal">
          {undecidedOption.label}
        </Label>
      </div>
    </div>
  );
}

// boolean-radio field model을 RadioGroup 컴포넌트로 렌더링합니다.
function BooleanRadioField({
  field,
  form,
  name,
}: {
  field: CurationBooleanRadioFieldModel;
  form: ReturnType<typeof useFormContext<FieldValues>>;
  name: string;
}) {
  const value = useWatch({
    control: form.control,
    name,
  });
  const selectedValue = value ? 'true' : 'false';

  return (
    <RadioGroup
      className="space-y-3"
      value={selectedValue}
      onValueChange={(nextValue) =>
        form.setValue(name, nextValue === 'true', {
          shouldDirty: true,
          shouldValidate: true,
        })
      }
    >
      <BooleanRadioOption
        id={`${field.key}True`}
        value="true"
        label={field.trueLabel}
        selected={selectedValue === 'true'}
      />
      <BooleanRadioOption
        id={`${field.key}False`}
        value="false"
        label={field.falseLabel}
        selected={selectedValue === 'false'}
      />
    </RadioGroup>
  );
}

// boolean radio의 단일 선택지를 label과 radio item으로 렌더링합니다.
function BooleanRadioOption({
  id,
  value,
  label,
  selected,
}: {
  id: string;
  value: string;
  label: string;
  selected: boolean;
}) {
  return (
    <Label
      htmlFor={id}
      className={`flex cursor-pointer items-center gap-3 rounded-lg p-2 transition-colors ${
        selected ? 'bg-primary/5' : 'hover:bg-muted/40'
      }`}
    >
      <RadioGroupItem id={id} value={value} className="h-7 w-7 border-2" />
      <span className="font-medium">{label}</span>
    </Label>
  );
}
