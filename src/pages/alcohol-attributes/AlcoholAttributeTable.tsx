/**
 * 속성 목록 표: 속성이 붙은 위스키 한 줄에 키워드와 주요 항목을 피벗해 보여준다.
 * - 열은 집계(keys)에서 위스키 수가 많은 항목 순으로 고른다
 * - 이름을 누르면 그 위스키의 속성 시트가 열리고, 체크로 여러 개를 골라 일괄 편집한다
 */

import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type {
  AlcoholAttributeKeyStat,
  AlcoholAttributeRow,
  AlcoholAttributeType,
  AttributedAlcoholItem,
} from '@/types/api';
import { formatDateTime, formatValue } from './alcohol-attribute.schema';

function latestModified(rows: AlcoholAttributeRow[]) {
  return rows.reduce<string | null>(
    (latest, row) =>
      row.lastModifyAt && (!latest || row.lastModifyAt > latest) ? row.lastModifyAt : latest,
    null
  );
}

interface AlcoholAttributeTableProps {
  items: AttributedAlcoholItem[];
  isLoading: boolean;
  pivotKeys: AlcoholAttributeKeyStat[];
  typeLabels: Partial<Record<AlcoholAttributeType, string>>;
  selectedIds: number[];
  onToggle: (item: AttributedAlcoholItem, checked: boolean) => void;
  onToggleAll: (items: AttributedAlcoholItem[], checked: boolean) => void;
  onOpen: (item: AttributedAlcoholItem) => void;
}

export function AlcoholAttributeTable({
  items,
  isLoading,
  pivotKeys,
  typeLabels,
  selectedIds,
  onToggle,
  onToggleAll,
  onOpen,
}: AlcoholAttributeTableProps) {
  const allChecked =
    items.length > 0 && items.every((item) => selectedIds.includes(item.alcoholId));
  const columnCount = 5 + pivotKeys.length;

  return (
    <div className="min-h-0 flex-1 overflow-auto rounded-md border">
      <Table aria-label="속성 위스키 목록" className="text-xs">
        <TableHeader className="sticky top-0 z-10 bg-background">
          <TableRow>
            <TableHead className="w-8">
              <Checkbox
                aria-label="보이는 위스키 전체 선택"
                checked={allChecked}
                onCheckedChange={(next) => onToggleAll(items, next === true)}
                disabled={items.length === 0}
              />
            </TableHead>
            <TableHead className="min-w-[180px]">위스키</TableHead>
            <TableHead className="min-w-[160px]">키워드</TableHead>
            {pivotKeys.map((stat) => (
              <TableHead key={stat.key} className="whitespace-nowrap">
                <span className="font-mono text-[11px]">{stat.key}</span>
                <span className="ml-1 font-normal text-muted-foreground">
                  {typeLabels[stat.type] ?? stat.type}
                </span>
              </TableHead>
            ))}
            <TableHead className="text-right">속성</TableHead>
            <TableHead className="whitespace-nowrap">최근 수정</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading &&
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={`skeleton-${index}`}>
                <TableCell colSpan={columnCount}>
                  <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
                </TableCell>
              </TableRow>
            ))}
          {!isLoading && items.length === 0 && (
            <TableRow>
              <TableCell colSpan={columnCount} className="py-10 text-center text-muted-foreground">
                조건에 맞는 위스키가 없습니다.
              </TableCell>
            </TableRow>
          )}
          {items.map((item) => {
            const keywords = item.attributes.filter((row) => row.type === 'KEYWORD');
            const checked = selectedIds.includes(item.alcoholId);
            return (
              <TableRow key={item.alcoholId} data-state={checked ? 'selected' : undefined}>
                <TableCell>
                  <Checkbox
                    aria-label={`${item.korName} 선택`}
                    checked={checked}
                    onCheckedChange={(next) => onToggle(item, next === true)}
                  />
                </TableCell>
                <TableCell>
                  <button
                    type="button"
                    className="block max-w-[240px] text-left hover:underline"
                    aria-label={`${item.korName} 속성 보기`}
                    onClick={() => onOpen(item)}
                  >
                    <span className="block truncate text-[13px] font-medium">{item.korName}</span>
                    <span className="block truncate text-[11px] text-muted-foreground">
                      {item.engName}
                      {item.korCategory && <span> · {item.korCategory}</span>}
                    </span>
                  </button>
                </TableCell>
                <TableCell>
                  {keywords.length === 0 ? (
                    <span className="text-muted-foreground">-</span>
                  ) : (
                    <span className="flex flex-wrap gap-1">
                      {keywords.map((row) => (
                        <Badge key={row.id} variant="outline" className="h-5 px-1.5 font-normal">
                          {row.value}
                        </Badge>
                      ))}
                    </span>
                  )}
                </TableCell>
                {pivotKeys.map((stat) => {
                  const rows = item.attributes.filter((row) => row.key === stat.key);
                  return (
                    <TableCell key={stat.key} className="whitespace-nowrap tabular-nums">
                      {rows.length === 0 ? (
                        <span className="text-muted-foreground">-</span>
                      ) : (
                        rows.map((row) => formatValue(row.datatype, row.value)).join(', ')
                      )}
                    </TableCell>
                  );
                })}
                <TableCell className="text-right tabular-nums">{item.attributes.length}</TableCell>
                <TableCell className="whitespace-nowrap tabular-nums text-muted-foreground">
                  {formatDateTime(latestModified(item.attributes))}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
