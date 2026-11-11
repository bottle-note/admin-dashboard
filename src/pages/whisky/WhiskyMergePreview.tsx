import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { AlcoholMergeCount, AlcoholMergePreview } from '@/types/api';
import { AlcoholMergeCounts } from './AlcoholMergeCounts';

export function WhiskyMergePreview({ preview }: { preview: AlcoholMergePreview }) {
  const [scope, setScope] = useState('all');
  const selected = preview.duplicates.find((item) => String(item.alcohol.alcoholId) === scope);
  const totals = new Map<string, AlcoholMergeCount>();
  for (const item of preview.duplicates) {
    for (const count of item.counts) {
      const total = totals.get(count.name);
      totals.set(count.name, {
        name: count.name,
        moved: (total?.moved ?? 0) + count.moved,
        deleted: (total?.deleted ?? 0) + count.deleted,
      });
    }
  }
  const counts = selected?.counts ?? [...totals.values()];
  const changed = counts.filter((count) => count.moved !== 0 || count.deleted !== 0);
  const unchanged = counts.filter((count) => count.moved === 0 && count.deleted === 0);
  const caption = selected
    ? `${selected.alcohol.korName} (#${selected.alcohol.alcoholId}) 병합 기록`
    : '전체 병합 기록 합계';

  return (
    <div className="min-w-0 space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="shrink-0 text-sm">
          <span className="mr-2 text-muted-foreground">병합 대상</span>
          <strong className="font-medium">중복 {preview.duplicates.length}개 전체</strong>
        </p>
        <Select value={selected ? scope : 'all'} onValueChange={setScope}>
          <SelectTrigger aria-label="미리보기 범위" className="min-w-0 sm:w-80">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-72 w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-2rem)]">
            <SelectItem value="all">전체 합계 ({preview.duplicates.length}개)</SelectItem>
            {preview.duplicates.map(({ alcohol }) => (
              <SelectItem key={alcohol.alcoholId} value={String(alcohol.alcoholId)}>
                <span className="block whitespace-normal break-words [overflow-wrap:anywhere]">
                  {alcohol.korName} (#{alcohol.alcoholId})
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {selected && (
        <p className="text-xs text-muted-foreground">
          조회 범위를 바꿔도 병합 대상은 바뀌지 않습니다.
        </p>
      )}
      {changed.length ? (
        <AlcoholMergeCounts counts={changed} caption={caption} />
      ) : (
        <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          연결된 기록의 변경은 없습니다. 선택한 중복 위스키는 병합 시 삭제됩니다.
        </p>
      )}
      {unchanged.length > 0 && (
        <details key={selected?.alcohol.alcoholId ?? 'all'} className="text-sm">
          <summary className="cursor-pointer rounded-sm text-xs text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            변경 없는 항목 {unchanged.length}개
          </summary>
          <div className="mt-3">
            <AlcoholMergeCounts counts={unchanged} caption="변경 없는 기록" />
          </div>
        </details>
      )}
    </div>
  );
}
