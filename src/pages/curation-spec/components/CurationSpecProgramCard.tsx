import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

import type {
  ProgramItemRequestSpec,
  WhiskyTastingEventAlcoholListSchema,
} from '../curation-spec.schema';
import { CurationSpecAlcoholCardListField } from './CurationSpecAlcoholCardListField';
import { CurationSpecField } from './CurationSpecField';

const PROGRAM_TYPE_LABELS = {
  MASTER_CLASS: '마스터 클래스',
  TASTING: '테이스팅',
  SEMINAR: '세미나',
  BOOTH_EVENT: '부스 이벤트',
  OTHER: '기타',
};

export function CurationSpecProgramCard({
  name,
  index,
  schema,
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
    <div className="overflow-hidden rounded-[10px] border border-border bg-card">
      <div className="flex items-center justify-between gap-4 border-b bg-muted/40 px-5 py-4">
        <h3 className="font-semibold">프로그램 {index + 1}</h3>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label={`프로그램 ${index + 1} 위로 이동`}
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
            aria-label={`프로그램 ${index + 1} 아래로 이동`}
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
            aria-label={`프로그램 ${index + 1} 삭제`}
            onClick={onRemove}
            disabled={!canRemove}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 p-5 md:grid-cols-2">
        <CurationSpecField
          name={`${name}.name`}
          schema={fields.name}
          required={required.includes('name')}
        />
        <CurationSpecField
          name={`${name}.type`}
          schema={fields.type}
          required={required.includes('type')}
          optionLabels={PROGRAM_TYPE_LABELS}
        />
        <CurationSpecField
          name={`${name}.programDate`}
          schema={fields.programDate}
          required={required.includes('programDate')}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <CurationSpecField
            name={`${name}.startTime`}
            schema={fields.startTime}
            required={required.includes('startTime')}
          />
          <CurationSpecField
            name={`${name}.endTime`}
            schema={fields.endTime}
            required={required.includes('endTime')}
          />
        </div>
        <CurationSpecField
          name={`${name}.venue`}
          schema={fields.venue}
          required={required.includes('venue')}
        />
        <CurationSpecField
          name={`${name}.host`}
          schema={fields.host}
          required={required.includes('host')}
        />
        <CurationSpecField
          name={`${name}.description`}
          schema={fields.description}
          required={required.includes('description')}
          className="md:col-span-2"
        />
        <CurationSpecField
          name={`${name}.applicationUrl`}
          schema={fields.applicationUrl}
          required={required.includes('applicationUrl')}
          className="md:col-span-2"
        />

        <div className="space-y-3 border-t pt-5 md:col-span-2">
          <div>
            <h4 className="text-sm font-semibold">시음 라인업</h4>
            <p className="mt-1 text-sm text-muted-foreground">
              프로그램에서 소개할 위스키를 등록해주세요.
            </p>
          </div>
          <CurationSpecAlcoholCardListField
            name={`${name}.whiskies`}
            schema={fields.whiskies as WhiskyTastingEventAlcoholListSchema}
            required={required.includes('whiskies')}
          />
        </div>
      </div>
    </div>
  );
}
