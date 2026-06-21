/**
 * 리뷰 관리 페이지 (ROOT_ADMIN 전용)
 * - URL 쿼리파라미터로 검색/필터/정렬/페이지네이션 상태 관리
 * - 읽기 전용 목록 (현재 API는 목록 조회만 지원)
 */

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { Search, MessageSquare, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/common/Pagination';
import { useReviewList } from '@/hooks/useReviews';
import { isNonComposingEnterKey } from '@/lib/keyboard';
import type {
  ReviewSearchParams,
  ReviewActiveStatus,
  ReviewDisplayStatus,
  ReviewSortType,
  ReviewSortOrder,
} from '@/types/api';

const ACTIVE_STATUS_OPTIONS = [
  { value: 'ALL', label: '활성 상태 전체' },
  { value: 'ACTIVE', label: '활성' },
  { value: 'DELETED', label: '삭제' },
  { value: 'DISABLED', label: '비활성' },
];

const DISPLAY_STATUS_OPTIONS = [
  { value: 'ALL', label: '노출 상태 전체' },
  { value: 'PUBLIC', label: '공개' },
  { value: 'PRIVATE', label: '비공개' },
];

const SORT_OPTIONS = [
  { value: 'CREATED_AT', label: '작성일' },
  { value: 'UPDATED_AT', label: '수정일' },
  { value: 'REPLY_COUNT', label: '댓글 수' },
];

const ACTIVE_STATUS_LABELS: Record<ReviewActiveStatus, string> = {
  ACTIVE: '활성',
  DELETED: '삭제',
  DISABLED: '비활성',
};

const ACTIVE_STATUS_VARIANTS: Record<
  ReviewActiveStatus,
  'outline' | 'destructive' | 'secondary'
> = {
  ACTIVE: 'outline',
  DELETED: 'destructive',
  DISABLED: 'secondary',
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
}

export function ReviewListPage() {
  const [urlParams, setUrlParams] = useSearchParams();

  // URL에서 검색 파라미터 읽기
  const keyword = urlParams.get('keyword') ?? '';
  const activeStatusParam = urlParams.get('activeStatus');
  const displayStatusParam = urlParams.get('displayStatus');
  const createdFrom = urlParams.get('createdFrom') ?? '';
  const createdTo = urlParams.get('createdTo') ?? '';
  const sortType = (urlParams.get('sortType') ?? 'CREATED_AT') as ReviewSortType;
  const sortOrder = (urlParams.get('sortOrder') ?? 'DESC') as ReviewSortOrder;
  const page = Number(urlParams.get('page')) || 0;
  const size = Number(urlParams.get('size')) || 20;

  // 검색 입력 필드용 로컬 상태
  const [keywordInput, setKeywordInput] = useState(keyword);

  useEffect(() => {
    setKeywordInput(keyword);
  }, [keyword]);

  // API 요청용 파라미터
  const searchParams: ReviewSearchParams = {
    keyword: keyword || undefined,
    activeStatus:
      activeStatusParam && activeStatusParam !== 'ALL'
        ? (activeStatusParam as ReviewActiveStatus)
        : undefined,
    displayStatus:
      displayStatusParam && displayStatusParam !== 'ALL'
        ? (displayStatusParam as ReviewDisplayStatus)
        : undefined,
    createdFrom: createdFrom || undefined,
    createdTo: createdTo || undefined,
    sortType,
    sortOrder,
    page,
    size,
  };

  const { data, isLoading } = useReviewList(searchParams);

  // URL 파라미터 업데이트 헬퍼
  const updateUrlParams = (updates: Record<string, string | undefined>) => {
    const newParams = new URLSearchParams(urlParams);

    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === '') {
        newParams.delete(key);
      } else {
        newParams.set(key, value);
      }
    });

    // 기본값은 URL에서 제거
    if (newParams.get('page') === '0') newParams.delete('page');
    if (newParams.get('size') === '20') newParams.delete('size');
    if (newParams.get('sortType') === 'CREATED_AT') newParams.delete('sortType');
    if (newParams.get('sortOrder') === 'DESC') newParams.delete('sortOrder');

    setUrlParams(newParams);
  };

  const handleSearch = () => {
    updateUrlParams({
      keyword: keywordInput || undefined,
      page: '0',
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isNonComposingEnterKey(e)) {
      handleSearch();
    }
  };

  const handleActiveStatusChange = (value: string) => {
    updateUrlParams({
      activeStatus: value === 'ALL' ? undefined : value,
      page: '0',
    });
  };

  const handleDisplayStatusChange = (value: string) => {
    updateUrlParams({
      displayStatus: value === 'ALL' ? undefined : value,
      page: '0',
    });
  };

  const handleCreatedFromChange = (value: string) => {
    updateUrlParams({ createdFrom: value || undefined, page: '0' });
  };

  const handleCreatedToChange = (value: string) => {
    updateUrlParams({ createdTo: value || undefined, page: '0' });
  };

  const handleSortTypeChange = (value: string) => {
    updateUrlParams({
      sortType: value === 'CREATED_AT' ? undefined : value,
      page: '0',
    });
  };

  const handleSortOrderToggle = () => {
    updateUrlParams({
      sortOrder: sortOrder === 'DESC' ? 'ASC' : undefined,
    });
  };

  const handlePageChange = (newPage: number) => {
    updateUrlParams({ page: String(newPage) });
  };

  const handlePageSizeChange = (newSize: number) => {
    updateUrlParams({ size: String(newSize), page: '0' });
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold">리뷰 관리</h1>
        <p className="text-muted-foreground">
          사용자가 작성한 리뷰를 조회합니다.
        </p>
      </div>

      {/* 필터 */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="리뷰 내용, 닉네임, 술 이름으로 검색..."
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-9"
            />
          </div>
          <Select
            value={activeStatusParam ?? 'ALL'}
            onValueChange={handleActiveStatusChange}
          >
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="활성 상태" />
            </SelectTrigger>
            <SelectContent>
              {ACTIVE_STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={displayStatusParam ?? 'ALL'}
            onValueChange={handleDisplayStatusChange}
          >
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="노출 상태" />
            </SelectTrigger>
            <SelectContent>
              {DISPLAY_STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground whitespace-nowrap">
              작성일
            </label>
            <Input
              type="date"
              value={createdFrom}
              onChange={(e) => handleCreatedFromChange(e.target.value)}
              className="w-full sm:w-[160px]"
            />
            <span className="text-muted-foreground">~</span>
            <Input
              type="date"
              value={createdTo}
              onChange={(e) => handleCreatedToChange(e.target.value)}
              className="w-full sm:w-[160px]"
            />
          </div>
          <div className="flex items-center gap-2 sm:ml-auto">
            <Select value={sortType} onValueChange={handleSortTypeChange}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="정렬" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={handleSortOrderToggle}
              title={sortOrder === 'DESC' ? '내림차순' : '오름차순'}
            >
              {sortOrder === 'DESC' ? '↓' : '↑'}
            </Button>
            <Button onClick={handleSearch}>검색</Button>
          </div>
        </div>
      </div>

      {/* 테이블 */}
      <div className="rounded-lg border">
        <Table className="[&_th]:px-4 [&_td]:px-4 [&_th]:whitespace-nowrap">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[70px]">리뷰 ID</TableHead>
              <TableHead className="w-[160px]">술</TableHead>
              <TableHead className="w-[120px]">작성자</TableHead>
              <TableHead>내용</TableHead>
              <TableHead className="w-[80px] text-right">평점</TableHead>
              <TableHead className="w-[80px]">활성</TableHead>
              <TableHead className="w-[80px]">노출</TableHead>
              <TableHead className="w-[70px] text-right">댓글</TableHead>
              <TableHead className="w-[100px]">작성일</TableHead>
              <TableHead className="w-[100px]">수정일</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8">
                  <span className="text-muted-foreground">로딩 중...</span>
                </TableCell>
              </TableRow>
            ) : data?.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <MessageSquare className="h-8 w-8 text-muted-foreground/50" />
                    <span className="text-muted-foreground">
                      {keyword ? '검색 결과가 없습니다.' : '등록된 리뷰가 없습니다.'}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data?.items.map((review) => (
                <TableRow key={review.reviewId}>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {review.reviewId}
                  </TableCell>
                  <TableCell className="font-medium">{review.alcoholName}</TableCell>
                  <TableCell>{review.userNickname}</TableCell>
                  <TableCell className="max-w-[320px]">
                    <span className="line-clamp-2 text-sm text-muted-foreground">
                      {review.content}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="inline-flex items-center gap-1 font-mono text-sm">
                      <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                      {review.reviewRating.toFixed(1)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={ACTIVE_STATUS_VARIANTS[review.activeStatus]}>
                      {ACTIVE_STATUS_LABELS[review.activeStatus]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        review.displayStatus === 'PUBLIC' ? 'outline' : 'secondary'
                      }
                    >
                      {review.displayStatus === 'PUBLIC' ? '공개' : '비공개'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {review.replyCount.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(review.createAt)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(review.lastModifyAt)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 페이지네이션 */}
      {data && data.items.length > 0 && (
        <Pagination
          currentPage={data.meta.page}
          totalPages={data.meta.totalPages}
          totalElements={data.meta.totalElements}
          pageSize={size}
          currentItemCount={data.items.length}
          hasNext={data.meta.hasNext}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      )}
    </div>
  );
}
