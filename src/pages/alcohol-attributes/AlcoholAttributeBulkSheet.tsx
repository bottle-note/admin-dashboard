/**
 * 일괄 편집 시트: 목록에서 고른 위스키들의 속성 묶음(보드)을 보여주고 한 번에 추가·적용·삭제한다.
 */

import { Plus, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type {
  AlcoholAttributeKeywordCount,
  AlcoholAttributeSummaryItem,
  AlcoholAttributeType,
} from '@/types/api';
import { AlcoholAttributeBoard } from './AlcoholAttributeBoard';
import type { SelectedWhisky } from './AlcoholAttributeList';

interface AlcoholAttributeBulkSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  whiskies: SelectedWhisky[];
  onRemoveWhisky: (alcoholId: number) => void;
  summary: AlcoholAttributeSummaryItem[];
  isLoading: boolean;
  typeOrder: AlcoholAttributeType[];
  typeLabels: Partial<Record<AlcoholAttributeType, string>>;
  keywordChips: AlcoholAttributeKeywordCount[];
  isMutating: boolean;
  onCreate: () => void;
  onApplyToRest: (item: AlcoholAttributeSummaryItem, value: string) => void;
  onDeleteGroup: (item: AlcoholAttributeSummaryItem) => void;
  onAddKeyword: (value: string) => void;
}

export function AlcoholAttributeBulkSheet({
  open,
  onOpenChange,
  whiskies,
  onRemoveWhisky,
  summary,
  isLoading,
  typeOrder,
  typeLabels,
  keywordChips,
  isMutating,
  onCreate,
  onApplyToRest,
  onDeleteGroup,
  onAddKeyword,
}: AlcoholAttributeBulkSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-3xl">
        <SheetHeader className="border-b px-5 py-4 text-left">
          <div className="flex items-start justify-between gap-3">
            <div>
              <SheetTitle className="text-base">일괄 편집</SheetTitle>
              <SheetDescription>
                고른 위스키 {whiskies.length}개의 속성을 묶어 보여줍니다. 일부에만 있는 값은
                나머지에도 적용할 수 있습니다.
              </SheetDescription>
            </div>
            <Button
              size="sm"
              className="h-8 shrink-0"
              onClick={onCreate}
              disabled={whiskies.length === 0}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              속성 추가
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-2" aria-label="일괄 편집 대상">
            {whiskies.map((whisky) => (
              <span
                key={whisky.alcoholId}
                className="inline-flex h-6 items-center gap-1 rounded-full border bg-muted/40 pl-2 pr-0.5 text-[11px]"
              >
                {whisky.korName}
                <button
                  type="button"
                  className="rounded-full p-0.5 opacity-60 hover:bg-muted hover:opacity-100"
                  aria-label={`${whisky.korName} 선택 해제`}
                  onClick={() => onRemoveWhisky(whisky.alcoholId)}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-auto p-4">
          <AlcoholAttributeBoard
            items={summary}
            isLoading={isLoading}
            selectedCount={whiskies.length}
            typeOrder={typeOrder}
            typeLabels={typeLabels}
            keywordChips={keywordChips}
            isMutating={isMutating}
            onApplyToRest={onApplyToRest}
            onDeleteGroup={onDeleteGroup}
            onAddKeyword={onAddKeyword}
            onOpenCreate={onCreate}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
