/**
 * 위스키 한 병의 속성 시트: 속성 행을 보고 수정·삭제·추가한다.
 */

import { Pencil, Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ChipButton } from '@/components/common/ChipButton';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type {
  AlcoholAttributeKeywordCount,
  AlcoholAttributeRow,
  AlcoholAttributeType,
} from '@/types/api';
import { formatDateTime, formatValue } from './alcohol-attribute.schema';
import type { SelectedWhisky } from './AlcoholAttributeList';

interface AlcoholAttributeAlcoholSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  whisky: SelectedWhisky | null;
  rows: AlcoholAttributeRow[];
  isLoading: boolean;
  typeLabels: Partial<Record<AlcoholAttributeType, string>>;
  /** 이 위스키에 아직 없는 키워드 */
  keywordChips: AlcoholAttributeKeywordCount[];
  isMutating: boolean;
  onCreate: () => void;
  onEdit: (row: AlcoholAttributeRow) => void;
  onDelete: (row: AlcoholAttributeRow) => void;
  onAddKeyword: (value: string) => void;
}

export function AlcoholAttributeAlcoholSheet({
  open,
  onOpenChange,
  whisky,
  rows,
  isLoading,
  typeLabels,
  keywordChips,
  isMutating,
  onCreate,
  onEdit,
  onDelete,
  onAddKeyword,
}: AlcoholAttributeAlcoholSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl">
        <SheetHeader className="border-b px-5 py-4 text-left">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <SheetTitle className="truncate text-base">{whisky?.korName ?? '위스키'}</SheetTitle>
              <SheetDescription className="truncate">
                {whisky?.engName}
                {whisky?.engName ? ' · ' : ''}속성 {rows.length}개
              </SheetDescription>
            </div>
            <Button size="sm" className="h-8 shrink-0" onClick={onCreate} disabled={!whisky}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              속성 추가
            </Button>
          </div>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-auto">
          {isLoading && (
            <div className="space-y-2 p-5" aria-busy="true">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-8 animate-pulse rounded bg-muted" />
              ))}
            </div>
          )}
          {!isLoading && rows.length === 0 && (
            <p className="p-6 text-center text-xs text-muted-foreground">
              등록된 속성이 없습니다. 위의 속성 추가나 아래 키워드 칩으로 시작하세요.
            </p>
          )}
          <ul aria-label="위스키 속성 행">
            {rows.map((row) => (
              <li
                key={row.id}
                className="group flex items-center gap-3 border-b px-5 py-2 text-xs last:border-b-0"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="shrink-0 rounded bg-muted px-1 text-[10px] text-muted-foreground">
                      {typeLabels[row.type] ?? row.type}
                    </span>
                    <span className="font-mono text-[11px] text-muted-foreground">{row.key}</span>
                    <span className="truncate font-medium">
                      {formatValue(row.datatype, row.value)}
                    </span>
                  </div>
                  <div className="mt-0.5 flex flex-wrap gap-x-3 text-[11px] text-muted-foreground">
                    {row.description && <span className="truncate">{row.description}</span>}
                    {row.basedAt && <span>기준 {formatDateTime(row.basedAt)}</span>}
                    <span>수정 {formatDateTime(row.lastModifyAt)}</span>
                  </div>
                </div>
                <span className="flex shrink-0 gap-0.5 opacity-60 group-focus-within:opacity-100 group-hover:opacity-100">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    aria-label={`${row.key} · ${row.value} 수정`}
                    disabled={isMutating}
                    onClick={() => onEdit(row)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive"
                    aria-label={`${row.key} · ${row.value} 삭제`}
                    disabled={isMutating}
                    onClick={() => onDelete(row)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        </div>

        {keywordChips.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto border-t px-5 py-2.5">
            <span className="shrink-0 text-[11px] text-muted-foreground">키워드 바로 추가</span>
            {keywordChips.map((chip) => (
              <ChipButton
                key={chip.value}
                count={chip.alcoholCount}
                aria-label={`${chip.value} 키워드 추가`}
                disabled={isMutating || !whisky}
                onClick={() => onAddKeyword(chip.value)}
              >
                {chip.value}
              </ChipButton>
            ))}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
