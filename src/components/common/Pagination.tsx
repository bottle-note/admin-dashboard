/**
 * 공용 페이지네이션 컴포넌트
 * 페이지 기반 / 커서 기반 페이지네이션 모두 지원
 */

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const PAGE_SIZE_OPTIONS = [
  { value: '20', label: '20개' },
  { value: '50', label: '50개' },
  { value: '100', label: '100개' },
];

interface PaginationProps {
  /** 현재 페이지 (0-based, 페이지 기반일 때) */
  currentPage?: number;
  /** 전체 페이지 수 */
  totalPages?: number;
  /** 전체 아이템 수 */
  totalElements?: number;
  /** 현재 페이지 크기 */
  pageSize: number;
  /** 현재 페이지에 표시된 아이템 수 */
  currentItemCount: number;
  /** 다음 페이지 존재 여부 */
  hasNext: boolean;
  /** 이전 페이지 존재 여부 (커서 기반에서는 false) */
  hasPrevious?: boolean;
  /** 페이지 변경 핸들러 (페이지 기반) */
  onPageChange?: (page: number) => void;
  /** 다음 페이지 핸들러 (커서 기반) */
  onNextPage?: () => void;
  /** 이전 페이지 핸들러 (커서 기반) */
  onPreviousPage?: () => void;
  /** 페이지 크기 변경 핸들러 */
  onPageSizeChange: (size: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  totalElements,
  pageSize,
  currentItemCount,
  hasNext,
  hasPrevious,
  onPageChange,
  onNextPage,
  onPreviousPage,
  onPageSizeChange,
}: PaginationProps) {
  const isPageBased = currentPage !== undefined && totalPages !== undefined;

  // 현재 표시 범위 계산
  const startItem = isPageBased
    ? currentPage * pageSize + 1
    : 1;
  const endItem = isPageBased
    ? Math.min((currentPage + 1) * pageSize, totalElements ?? 0)
    : currentItemCount;

  const handlePrevious = () => {
    if (isPageBased && onPageChange && currentPage > 0) {
      onPageChange(currentPage - 1);
    } else if (onPreviousPage) {
      onPreviousPage();
    }
  };

  const handleNext = () => {
    if (isPageBased && onPageChange) {
      onPageChange(currentPage + 1);
    } else if (onNextPage) {
      onNextPage();
    }
  };

  const canGoPrevious = isPageBased ? currentPage > 0 : (hasPrevious ?? false);

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <p className="text-sm text-muted-foreground">
          {totalElements !== undefined ? (
            <>
              총 {totalElements.toLocaleString()}개 중{' '}
              {startItem.toLocaleString()}-{endItem.toLocaleString()}개 표시
            </>
          ) : (
            <>{currentItemCount}개 표시</>
          )}
        </p>
        <Select
          value={String(pageSize)}
          onValueChange={(v) => onPageSizeChange(Number(v))}
        >
          <SelectTrigger className="w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        {isPageBased && (
          <span className="text-sm text-muted-foreground">
            {currentPage + 1} / {totalPages} 페이지
          </span>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevious}
          disabled={!canGoPrevious}
        >
          <ChevronLeft className="h-4 w-4" />
          이전
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNext}
          disabled={!hasNext}
        >
          다음
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
