import { useState, type ChangeEvent } from 'react';
import { useFieldArray, useFormContext, useWatch, type FieldValues } from 'react-hook-form';
import { ArrowDown, ArrowUp, Loader2, Plus, Upload, X } from 'lucide-react';

import { FormField } from '@/components/common/FormField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useFileUpload } from '@/hooks/useFileUpload';

import type { CurationSpecSections } from '../curation-sections.type';
import type { WhiskyCurationPairingListSchema } from '../curation-spec.schema';

type PairingSectionConfig = NonNullable<
  CurationSpecSections[string]['fields'][string]['pairing']
>;

export function PairingFields({
  name,
  schema,
  config,
}: {
  name: string;
  schema: WhiskyCurationPairingListSchema;
  config: PairingSectionConfig;
}) {
  const form = useFormContext<FieldValues>();
  const fieldArray = useFieldArray({ control: form.control, name });
  const pairings = (useWatch({ control: form.control, name }) ?? []) as Array<{
    itemName: string;
    pairingNote: string;
    itemImageUrl?: string;
  }>;
  const canAdd = pairings.length < schema.maxItems;
  const canRemove = pairings.length > schema.minItems;
  const error = form.getFieldState(name, form.formState).error?.message;

  return (
    <div className="mt-5 space-y-4 border-t pt-5">
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="space-y-3">
        {fieldArray.fields.map((field, index) => (
          <PairingItem
            key={field.id}
            name={`${name}.${index}`}
            index={index}
            value={pairings[index]}
            schema={schema}
            config={config}
            canRemove={canRemove}
            canMoveUp={index > 0}
            canMoveDown={index < fieldArray.fields.length - 1}
            onRemove={() => fieldArray.remove(index)}
            onMoveUp={() => fieldArray.move(index, index - 1)}
            onMoveDown={() => fieldArray.move(index, index + 1)}
          />
        ))}
      </div>

      <Button
        type="button"
        variant="secondary"
        className="h-12 w-full rounded-[10px] font-semibold"
        onClick={() =>
          fieldArray.append({ itemName: '', pairingNote: '', itemImageUrl: '' })
        }
        disabled={!canAdd}
      >
        <Plus className="h-4 w-4" />
        {config.addButtonLabel}
      </Button>
    </div>
  );
}

function PairingItem({
  name,
  index,
  value,
  schema,
  config,
  canRemove,
  canMoveUp,
  canMoveDown,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  name: string;
  index: number;
  value?: { itemName: string; pairingNote: string; itemImageUrl?: string };
  schema: WhiskyCurationPairingListSchema;
  config: PairingSectionConfig;
  canRemove: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const form = useFormContext<FieldValues>();
  const [isUploading, setIsUploading] = useState(false);
  const fields = schema.items.properties;
  const imageSchema = fields.itemImageUrl;
  const { upload, error: uploadError } = useFileUpload({
    rootPath: imageSchema?.['x-upload-path'] ?? 'admin/curation',
  });
  const itemNameLabel =
    config.fields.itemName?.label ?? fields.itemName['x-display-name'] ?? '음식명';
  const pairingNoteLabel =
    config.fields.pairingNote?.label ?? fields.pairingNote['x-display-name'] ?? '페어링 설명';
  const itemImageLabel =
    config.fields.itemImageUrl?.label ?? imageSchema?.['x-display-name'] ?? '음식 이미지';
  const itemNamePath = `${name}.itemName`;
  const pairingNotePath = `${name}.pairingNote`;
  const itemImagePath = `${name}.itemImageUrl`;

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setIsUploading(true);
    try {
      const imageUrl = await upload(file);
      if (imageUrl) {
        form.setValue(itemImagePath, imageUrl, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="rounded-[10px] bg-background p-4">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-base font-semibold">
          {config.itemLabel} {index + 1}
          {schema.minItems > 0 && <span className="ml-1 text-destructive">*</span>}
        </h4>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`${config.itemLabel} ${index + 1} 위로 이동`}
            onClick={onMoveUp}
            disabled={!canMoveUp}
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`${config.itemLabel} ${index + 1} 아래로 이동`}
            onClick={onMoveDown}
            disabled={!canMoveDown}
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
          {canRemove && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`${config.itemLabel} ${index + 1} 삭제`}
              onClick={onRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className={`mt-4 grid gap-4 ${imageSchema ? 'md:grid-cols-[7rem_minmax(0,1fr)]' : ''}`}>
        {imageSchema && (
          <FormField
            label={itemImageLabel}
            error={
              form.getFieldState(itemImagePath, form.formState).error?.message ??
              uploadError?.message
            }
          >
            <label className="flex h-28 w-28 cursor-pointer items-center justify-center overflow-hidden rounded-md border border-dashed bg-muted/20">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(event) => void handleImageUpload(event)}
                disabled={isUploading}
              />
              {value?.itemImageUrl ? (
                <img src={value.itemImageUrl} alt="" className="h-full w-full object-cover" />
              ) : isUploading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <Upload className="h-6 w-6 text-muted-foreground" />
              )}
            </label>
          </FormField>
        )}

        <div className="space-y-4">
          <FormField
            label={itemNameLabel}
            required={schema.items.required.includes('itemName')}
            error={form.getFieldState(itemNamePath, form.formState).error?.message}
          >
            <Input
              aria-label={itemNameLabel}
              maxLength={fields.itemName.maxLength}
              placeholder={config.fields.itemName?.placeholder ?? (fields.itemName.example as string)}
              {...form.register(itemNamePath)}
            />
          </FormField>
          <FormField
            label={pairingNoteLabel}
            required={schema.items.required.includes('pairingNote')}
            error={form.getFieldState(pairingNotePath, form.formState).error?.message}
          >
            <Textarea
              aria-label={pairingNoteLabel}
              rows={4}
              maxLength={fields.pairingNote.maxLength}
              placeholder={
                config.fields.pairingNote?.placeholder ?? (fields.pairingNote.example as string)
              }
              {...form.register(pairingNotePath)}
            />
          </FormField>
        </div>
      </div>
    </div>
  );
}
