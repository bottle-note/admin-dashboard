import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

import type { ProgramItemRequestSpec } from '../curation-spec.schema';
import { CurationSpecAlcoholCardListField } from '../components/CurationSpecAlcoholCardListField';
import { CurationSpecField } from '../components/CurationSpecField';
import type { ProgramSectionConfig } from './program-sections';

export function ProgramCard({
  name,
  index,
  schema,
  config,
  onRemove,
  onMoveUp,
  onMoveDown,
  canRemove,
  canMoveUp,
  canMoveDown,
}: {
  name: string;
  index: number;
  schema: ProgramItemRequestSpec;
  config: ProgramSectionConfig;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canRemove: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const fields = schema.properties;
  const required = schema.required;

  return (
    <div className="min-w-0 overflow-hidden rounded-[10px] border border-border bg-card">
      <div className="flex items-center justify-between gap-4 border-b bg-muted/40 px-5 py-4">
        <h3 className="min-w-0 truncate font-semibold">
          {config.itemLabel} {index + 1}
        </h3>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label={`${config.itemLabel} ${index + 1} 위로 이동`}
            onClick={onMoveUp}
            disabled={!canMoveUp}
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label={`${config.itemLabel} ${index + 1} 아래로 이동`}
            onClick={onMoveDown}
            disabled={!canMoveDown}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
            aria-label={`${config.itemLabel} ${index + 1} 삭제`}
            onClick={onRemove}
            disabled={!canRemove}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid min-w-0 gap-4 p-5 md:grid-cols-2">
        <CurationSpecField
          name={`${name}.name`}
          schema={fields.name}
          required={required.includes('name')}
          className="min-w-0"
        />
        <CurationSpecField
          name={`${name}.type`}
          schema={fields.type}
          required={required.includes('type')}
          className="min-w-0"
          optionLabels={config.fields.type.optionLabels}
        />
        <CurationSpecField
          name={`${name}.programDate`}
          schema={fields.programDate}
          required={required.includes('programDate')}
          className="min-w-0"
        />
        <div className="grid min-w-0 gap-4 xl:grid-cols-2">
          <CurationSpecField
            name={`${name}.startTime`}
            schema={fields.startTime}
            required={required.includes('startTime')}
            className="min-w-0"
          />
          <CurationSpecField
            name={`${name}.endTime`}
            schema={fields.endTime}
            required={required.includes('endTime')}
            className="min-w-0"
          />
        </div>
        <CurationSpecField
          name={`${name}.venue`}
          schema={fields.venue}
          required={required.includes('venue')}
          className="min-w-0"
        />
        <CurationSpecField
          name={`${name}.host`}
          schema={fields.host}
          required={required.includes('host')}
          className="min-w-0"
        />
        <CurationSpecField
          name={`${name}.description`}
          schema={fields.description}
          required={required.includes('description')}
          className={config.fields.description.className}
        />
        <CurationSpecField
          name={`${name}.applicationUrl`}
          schema={fields.applicationUrl}
          required={required.includes('applicationUrl')}
          className={config.fields.applicationUrl.className}
        />

        <div className="min-w-0 space-y-3 border-t pt-5 md:col-span-2">
          <div>
            <h4 className="text-sm font-semibold">{config.fields.whiskies.title}</h4>
            <p className="mt-1 text-sm text-muted-foreground">{config.fields.whiskies.subtitle}</p>
          </div>
          <CurationSpecAlcoholCardListField
            name={`${name}.whiskies`}
            schema={fields.whiskies}
            required={required.includes('whiskies')}
            config={config.fields.whiskies.alcohol}
          />
        </div>
      </div>
    </div>
  );
}
