import { useState, type DragEvent, type ReactNode } from 'react';
import { useFormContext, useWatch, type FieldValues } from 'react-hook-form';
import { ArrowDown, ArrowUp, GripVertical, X } from 'lucide-react';

import { FormField } from '@/components/common/FormField';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

import type { AlcoholSectionConfig, CurationSpecSections } from '../curation-sections.type';
import type {
  WhiskyCurationPairingListSchema,
  WhiskyTastingEventAlcoholItemSchema,
} from '../curation-spec.schema';
import { PairingFields } from '../whisky-pairing/PairingFields';
import { CurationTastingTagCombobox } from './CurationTastingTagCombobox';

export function CurationSpecAlcoholCard({
  name,
  index,
  schema,
  config,
  pairingSchema,
  pairingConfig,
  required,
  imageUrl,
  imageAlt,
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
  children,
}: {
  name: string;
  index: number;
  schema: WhiskyTastingEventAlcoholItemSchema;
  config: AlcoholSectionConfig;
  pairingSchema?: WhiskyCurationPairingListSchema;
  pairingConfig?: NonNullable<CurationSpecSections[string]['fields'][string]['pairing']>;
  required: boolean;
  imageUrl: string;
  imageAlt: string;
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
  children: ReactNode;
}) {
  const form = useFormContext<FieldValues>();
  const [tagInput, setTagInput] = useState('');
  const itemFields = schema.properties;
  const alcoholSchema = itemFields.alcohol;
  const selectedTagsSchema = alcoholSchema.properties.selectedTags;
  const commentSchema = itemFields.comment;
  const selectedTagsLabel =
    config.fields.selectedTags?.label ?? (selectedTagsSchema['x-display-name'] as string);
  const commentLabel = config.fields.comment?.label ?? (commentSchema['x-display-name'] as string);
  const selectedTagsPath = `${name}.alcohol.selectedTags`;
  const selectedTags = useWatch({
    control: form.control,
    name: selectedTagsPath,
  }) as string[];
  const selectedTagsError = form.getFieldState(selectedTagsPath, form.formState).error?.message;

  const handleAddTag = (value: string) => {
    const tag = value.trim();
    if (!tag || selectedTags.includes(tag) || selectedTags.length >= selectedTagsSchema.maxItems) {
      return false;
    }

    form.setValue(selectedTagsPath, [...selectedTags, tag], {
      shouldDirty: true,
      shouldValidate: true,
    });
    setTagInput('');
    return true;
  };

  return (
    <div
      draggable
      className={cn(
        'cursor-grab rounded-[10px] border bg-card p-5 transition-colors active:cursor-grabbing',
        isDragOver ? 'border-primary bg-primary/5' : 'border-border'
      )}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center text-muted-foreground">
            <GripVertical className="h-4 w-4" />
          </span>
          <h3 className="text-base font-semibold text-foreground">
            {config.itemLabel} {index + 1}
            {required && <span className="ml-1 text-destructive">*</span>}
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`${index + 1}번 ${config.itemLabel} 위로 이동`}
            onClick={onMoveUp}
            disabled={!canMoveUp}
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`${index + 1}번 ${config.itemLabel} 아래로 이동`}
            onClick={onMoveDown}
            disabled={!canMoveDown}
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 rounded-md bg-destructive/20 px-2 text-xs font-medium text-destructive hover:bg-destructive/30 hover:text-destructive"
            onClick={onRemove}
          >
            삭제
          </Button>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-[7rem_minmax(0,1fr)]">
        <div className="flex h-40 items-center justify-center overflow-hidden rounded-md bg-background">
          {imageUrl ? (
            <img src={imageUrl} alt={imageAlt} className="h-full max-h-40 w-full object-contain" />
          ) : (
            <div className="flex h-24 w-20 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
              No
            </div>
          )}
        </div>

        <div className="min-w-0 space-y-3">
          {children}

          <div className="space-y-2">
            <div className="flex max-w-md items-center justify-between gap-3">
              <p className="text-sm font-medium text-foreground">{selectedTagsLabel}</p>
              <span className="text-xs font-medium text-muted-foreground">
                {selectedTags.length}/{selectedTagsSchema.maxItems}
              </span>
            </div>
            <CurationTastingTagCombobox
              value={tagInput}
              onValueChange={setTagInput}
              onSelect={(tag) => handleAddTag(tag.korName)}
              onCreate={handleAddTag}
              selectedTagNames={selectedTags}
              placeholder="테이스팅 태그검색 후 추가"
              disabled={selectedTags.length >= selectedTagsSchema.maxItems}
              className="max-w-md"
            />
            <div className="flex flex-wrap gap-1.5">
              {selectedTags.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="h-7 gap-1 rounded-md border-border bg-background px-2 text-xs font-normal text-foreground"
                >
                  {tag}
                  <button
                    type="button"
                    className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-foreground text-background hover:bg-foreground/80"
                    aria-label={`${tag} 삭제`}
                    onClick={() =>
                      form.setValue(
                        selectedTagsPath,
                        selectedTags.filter((selectedTag) => selectedTag !== tag),
                        { shouldDirty: true, shouldValidate: true }
                      )
                    }
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            {selectedTagsError && <p className="text-sm text-destructive">{selectedTagsError}</p>}
          </div>
        </div>
      </div>

      {!pairingSchema && (
        <FormField
          label={commentLabel}
          required={schema.required.includes('comment')}
          error={form.getFieldState(`${name}.comment`, form.formState).error?.message}
          className="mt-4"
        >
          <Textarea
            rows={5}
            maxLength={commentSchema.maxLength}
            placeholder={commentSchema.example as string}
            {...form.register(`${name}.comment`)}
          />
        </FormField>
      )}

      {pairingSchema && pairingConfig && (
        <PairingFields
          name={`${name}.pairings`}
          schema={pairingSchema}
          config={pairingConfig}
        />
      )}
    </div>
  );
}
