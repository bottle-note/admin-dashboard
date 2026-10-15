/**
 * 전체 현황: 전체 위스키 기준 항목별 집계와 키워드 값 목록
 */

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type {
  AlcoholAttributeDatatype,
  AlcoholAttributeKeyStat,
  AlcoholAttributeKeywordCount,
  AlcoholAttributeType,
} from '@/types/api';
import { formatNumber } from '@/lib/format';

interface AlcoholAttributeOverviewProps {
  keyStats: AlcoholAttributeKeyStat[];
  keywords: AlcoholAttributeKeywordCount[];
  isLoading: boolean;
  typeLabels: Partial<Record<AlcoholAttributeType, string>>;
  datatypeLabels: Partial<Record<AlcoholAttributeDatatype, string>>;
}

export function AlcoholAttributeOverview({
  keyStats,
  keywords,
  isLoading,
  typeLabels,
  datatypeLabels,
}: AlcoholAttributeOverviewProps) {
  const [keywordFilter, setKeywordFilter] = useState('');
  const visibleKeywords = useMemo(() => {
    const keyword = keywordFilter.trim();
    return keyword ? keywords.filter((item) => item.value.includes(keyword)) : keywords;
  }, [keywords, keywordFilter]);

  return (
    <div className="grid min-h-0 gap-3 lg:grid-cols-[minmax(0,3fr)_minmax(280px,2fr)]">
      <section className="flex min-h-0 flex-col rounded-md border">
        <h3 className="border-b px-3 py-2 text-xs font-medium">
          항목별 집계
          <span className="ml-2 font-normal text-muted-foreground">전체 위스키 기준</span>
        </h3>
        <div className="min-h-0 flex-1 overflow-auto">
          <Table aria-label="항목별 집계" className="text-xs">
            <TableHeader className="sticky top-0 bg-background">
              <TableRow>
                <TableHead>항목</TableHead>
                <TableHead>분류</TableHead>
                <TableHead>형식</TableHead>
                <TableHead className="text-right">행 수</TableHead>
                <TableHead className="text-right">위스키 수</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={5}>
                    <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && keyStats.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    등록된 속성이 없습니다.
                  </TableCell>
                </TableRow>
              )}
              {keyStats.map((stat) => (
                <TableRow key={`${stat.key}:${stat.type}:${stat.datatype}`}>
                  <TableCell className="font-mono text-[11px]">{stat.key}</TableCell>
                  <TableCell>{typeLabels[stat.type] ?? stat.type}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {datatypeLabels[stat.datatype] ?? stat.datatype}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(stat.count)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(stat.alcoholCount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <section
        role="region"
        aria-label="키워드 값"
        className="flex min-h-0 flex-col rounded-md border"
      >
        <h3 className="flex items-center justify-between gap-2 border-b px-3 py-2 text-xs font-medium">
          <span>
            키워드 값 {keywords.length}
            <span className="ml-2 font-normal text-muted-foreground">사용 위스키 많은 순</span>
          </span>
          <span className="relative">
            <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={keywordFilter}
              onChange={(e) => setKeywordFilter(e.target.value)}
              placeholder="검색"
              aria-label="키워드 값 검색"
              className="h-6 w-28 pl-6 text-[11px]"
            />
          </span>
        </h3>
        <div className="flex min-h-0 flex-1 flex-wrap content-start gap-1.5 overflow-auto p-3">
          {!isLoading && visibleKeywords.length === 0 && (
            <span className="text-xs text-muted-foreground">
              {keywords.length === 0 ? '키워드가 없습니다.' : '검색 결과가 없습니다.'}
            </span>
          )}
          {visibleKeywords.map((item) => (
            <Badge key={item.value} variant="outline" className="h-6 font-medium">
              {item.value}
              <span className="ml-1 font-normal tabular-nums text-muted-foreground">
                {formatNumber(item.alcoholCount)}
              </span>
            </Badge>
          ))}
        </div>
      </section>
    </div>
  );
}
