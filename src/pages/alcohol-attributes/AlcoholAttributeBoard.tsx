/**
 * 속성 보드: 선택 위스키의 속성 묶음(summary)을 분류별 섹션으로 보여준다.
 * - 묶음 행: 항목, 값(숫자는 범위), 등록 비율, "나머지에 적용", 삭제
 * - 키워드 섹션에는 전체 키워드 칩을 두어 바로 추가한다
 */

import { useMemo } from 'react';
import { CopyPlus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ChipButton } from '@/components/common/ChipButton';
import type {
  AlcoholAttributeKeywordCount,
  AlcoholAttributeSummaryItem,
  AlcoholAttributeType,
} from '@/types/api';
import { applicableValue, formatSummaryValue, summaryGroupName } from './alcohol-attribute.schema';

interface AlcoholAttributeBoardProps {
  items: AlcoholAttributeSummaryItem[];
  isLoading: boolean;
  selectedCount: number;
  /** 분류 표시 순서 (enums 응답 순서) */
  typeOrder: AlcoholAttributeType[];
  typeLabels: Partial<Record<AlcoholAttributeType, string>>;
  /** 키워드 빠른 추가 칩 후보 (이미 전체에 있는 값은 제외돼 있다) */
  keywordChips: AlcoholAttributeKeywordCount[];
  isMutating: boolean;
  onApplyToRest: (item: AlcoholAttributeSummaryItem, value: string) => void;
  onDeleteGroup: (item: AlcoholAttributeSummaryItem) => void;
  onAddKeyword: (value: string) => void;
  onOpenCreate: () => void;
}

export function AlcoholAttributeBoard({
  items,
  isLoading,
  selectedCount,
  typeOrder,
  typeLabels,
  keywordChips,
  isMutating,
  onApplyToRest,
  onDeleteGroup,
  onAddKeyword,
  onOpenCreate,
}: AlcoholAttributeBoardProps) {
  const sections = useMemo(
    () =>
      typeOrder
        .map((type) => ({
          type,
          items: items.filter((item) => item.type === type),
        }))
        .filter((section) => section.type === 'KEYWORD' || section.items.length > 0),
    [items, typeOrder]
  );

  if (isLoading) {
    return (
      <div className="space-y-2" aria-busy="true">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-10 animate-pulse rounded-md bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid content-start gap-3">
      {sections.map(({ type, items: sectionItems }) => (
        <section
          key={type}
          role="region"
          aria-label={typeLabels[type] ?? type}
          className="flex min-h-0 flex-col rounded-md border"
        >
          <h3 className="flex items-center justify-between border-b px-3 py-2 text-xs font-medium">
            <span>
              {typeLabels[type] ?? type} {sectionItems.length}
            </span>
          </h3>
          <ul>
            {sectionItems.length === 0 && (
              <li className="px-3 py-4 text-center text-xs text-muted-foreground">
                {type === 'KEYWORD'
                  ? '키워드가 없습니다. 아래 칩을 눌러 바로 추가하세요.'
                  : '등록된 값이 없습니다.'}
              </li>
            )}
            {sectionItems.map((item) => {
              const isPartial = item.registeredCount < item.selectedCount;
              const value = applicableValue(item);
              return (
                <li
                  key={`${item.key}:${item.value ?? ''}`}
                  role="group"
                  aria-label={summaryGroupName(item)}
                  className="group flex items-center gap-3 border-b px-3 py-2 text-xs last:border-b-0"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="truncate font-mono text-[11px] text-muted-foreground">
                        {item.key}
                      </span>
                      <span className="truncate font-medium">{formatSummaryValue(item)}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <span
                        className="h-1 w-20 overflow-hidden rounded bg-muted"
                        aria-hidden="true"
                      >
                        <span
                          className={`block h-full ${isPartial ? 'bg-amber-500' : 'bg-primary'}`}
                          style={{
                            width: `${(item.registeredCount / Math.max(item.selectedCount, 1)) * 100}%`,
                          }}
                        />
                      </span>
                      <span
                        className={`tabular-nums ${isPartial ? 'text-amber-600' : 'text-muted-foreground'}`}
                      >
                        {item.registeredCount}/{item.selectedCount}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5 opacity-70 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
                    {isPartial && value != null && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-1.5 text-[11px]"
                        title={`값이 없는 ${item.selectedCount - item.registeredCount}개에 같은 값을 추가`}
                        disabled={isMutating}
                        onClick={() => onApplyToRest(item, value)}
                      >
                        <CopyPlus className="mr-1 h-3 w-3" />
                        나머지에 적용
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-1.5 text-[11px] text-destructive"
                      title="묶음의 속성 행을 모두 삭제"
                      disabled={isMutating}
                      onClick={() => onDeleteGroup(item)}
                    >
                      <Trash2 className="mr-1 h-3 w-3" />
                      삭제
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
          {type === 'KEYWORD' && keywordChips.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto border-t px-3 py-2">
              <span className="shrink-0 text-[11px] text-muted-foreground">바로 추가</span>
              {keywordChips.map((chip) => (
                <ChipButton
                  key={chip.value}
                  count={chip.alcoholCount}
                  aria-label={`${chip.value} 키워드 추가`}
                  title={`선택한 위스키 ${selectedCount}개에 키워드 추가`}
                  disabled={isMutating}
                  onClick={() => onAddKeyword(chip.value)}
                >
                  {chip.value}
                </ChipButton>
              ))}
            </div>
          )}
        </section>
      ))}
      {items.length === 0 && (
        <div className="rounded-md border border-dashed p-6 text-center text-xs text-muted-foreground">
          선택한 위스키에 등록된 속성이 없습니다.{' '}
          <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={onOpenCreate}>
            속성 추가
          </Button>
        </div>
      )}
    </div>
  );
}
