/**
 * 위스키 목록 페이지
 * - URL 쿼리파라미터로 검색/필터/페이지네이션 상태 관리
 * - 새로고침/뒤로가기 시 상태 유지
 * - 삭제된 데이터 포함 필터 지원
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Search, ImageOff, X } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/common/Pagination';
import { LookupSearchSelect } from '@/components/common/LookupSearchSelect';
import { useAdminAlcoholList } from '@/hooks/useAdminAlcohols';
import { useRegionDetail, useRegionListInfinite } from '@/hooks/useRegions';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { isNonComposingEnterKey } from '@/lib/keyboard';
import type { AlcoholSearchParams, AlcoholCategory } from '@/types/api';
import { ALCOHOL_CATEGORIES, CATEGORY_GROUP_LABELS } from '@/types/api';

const CATEGORY_OPTIONS: { value: AlcoholCategory | 'ALL'; label: string }[] = [
  { value: 'ALL', label: '전체' },
  ...ALCOHOL_CATEGORIES.map((value) => ({
    value,
    label: CATEGORY_GROUP_LABELS[value],
  })),
];

const SORT_OPTIONS = [
  { value: 'DEFAULT', label: '기본 정렬' },
  { value: 'KOR_NAME', label: '한글명' },
  { value: 'ENG_NAME', label: '영문명' },
  { value: 'KOR_CATEGORY', label: '한글 카테고리' },
  { value: 'ENG_CATEGORY', label: '영문 카테고리' },
  { value: 'CREATED_AT', label: '생성일' },
  { value: 'UPDATED_AT', label: '수정일' },
] as const;

export function WhiskyListPage() {
  const navigate = useNavigate();
  const [urlParams, setUrlParams] = useSearchParams();

  // URL에서 검색 파라미터 읽기
  const keyword = urlParams.get('keyword') ?? '';
  const category = urlParams.get('category') as AlcoholCategory | null;
  const page = Number(urlParams.get('page')) || 0;
  const size = Number(urlParams.get('size')) || 20;
  const includeDeleted = urlParams.get('includeDeleted') === 'true';
  const rawRegionId = Number(urlParams.get('regionId'));
  const regionId = Number.isSafeInteger(rawRegionId) && rawRegionId > 0 ? rawRegionId : undefined;
  const sortType = SORT_OPTIONS.find((option) => option.value === urlParams.get('sortType'))?.value;
  const sortOrder = urlParams.get('sortOrder') === 'DESC' ? 'DESC' : 'ASC';

  // 검색 입력 필드용 로컬 상태 (Enter/버튼 클릭 시에만 URL 반영)
  const [keywordInput, setKeywordInput] = useState(keyword);
  const [regionSearch, setRegionSearch] = useState('');
  const [regionOpen, setRegionOpen] = useState(false);
  const debouncedRegionSearch = useDebouncedValue(regionSearch.trim(), 300);
  const regions = useRegionListInfinite(debouncedRegionSearch, regionOpen);
  const selectedRegion = useRegionDetail(regionId);

  // URL의 keyword가 변경되면 입력 필드도 동기화
  useEffect(() => {
    setKeywordInput(keyword);
  }, [keyword]);

  // API 요청용 파라미터
  const searchParams: AlcoholSearchParams = {
    keyword: keyword || undefined,
    category: category || undefined,
    page,
    size,
    includeDeleted: includeDeleted || undefined,
    regionId,
    sortType: sortType && sortType !== 'DEFAULT' ? sortType : undefined,
    sortOrder: sortType && sortType !== 'DEFAULT' ? sortOrder : undefined,
  };

  const { data, isLoading } = useAdminAlcoholList(searchParams);

  // 테이블 컬럼 수 계산
  const columnCount = includeDeleted ? 7 : 6;

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

    // 기본값은 URL에서 제거 (깔끔한 URL 유지)
    if (newParams.get('page') === '0') newParams.delete('page');
    if (newParams.get('size') === '20') newParams.delete('size');

    setUrlParams(newParams);
  };

  const handleSearch = () => {
    updateUrlParams({
      keyword: keywordInput || undefined,
      page: '0', // 검색 시 첫 페이지로
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isNonComposingEnterKey(e)) {
      handleSearch();
    }
  };

  const handleCategoryChange = (value: string) => {
    updateUrlParams({
      category: value === 'ALL' ? undefined : value,
      page: '0', // 카테고리 변경 시 첫 페이지로
    });
  };

  const handleIncludeDeletedChange = (checked: boolean | 'indeterminate') => {
    updateUrlParams({
      includeDeleted: checked === true ? 'true' : undefined,
      page: '0', // 필터 변경 시 첫 페이지로
    });
  };

  const handleRegionChange = (id?: number) => {
    setRegionSearch('');
    updateUrlParams({ regionId: id ? String(id) : undefined, page: '0' });
  };

  const handleSortTypeChange = (value: string) => {
    updateUrlParams({
      sortType: value === 'DEFAULT' ? undefined : value,
      sortOrder: value === 'DEFAULT' ? undefined : 'ASC',
      page: '0',
    });
  };

  const handleSortOrderChange = (value: string) => {
    updateUrlParams({ sortOrder: value, page: '0' });
  };

  const handlePageChange = (newPage: number) => {
    updateUrlParams({
      page: String(newPage),
    });
  };

  const handlePageSizeChange = (newSize: number) => {
    updateUrlParams({
      size: String(newSize),
      page: '0', // 페이지 크기 변경 시 첫 페이지로
    });
  };

  const handleRowClick = (alcoholId: number) => {
    navigate(`/whisky/${alcoholId}`);
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold">위스키 목록</h1>
        <p className="text-muted-foreground">등록된 위스키를 관리합니다.</p>
      </div>

      {/* 검색과 주요 필터 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative w-full sm:w-[280px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="위스키 이름으로 검색..."
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-9"
          />
        </div>
        <div className="flex w-full min-w-0 items-center gap-2 sm:w-[360px]">
          <LookupSearchSelect
            value={regionSearch}
            onValueChange={setRegionSearch}
            open={regionOpen}
            onOpenChange={setRegionOpen}
            items={
              regionSearch.trim() === debouncedRegionSearch
                ? (regions.data?.pages.flatMap((result) => result.items) ?? [])
                : []
            }
            getItemKey={(region) => region.id}
            getItemAriaLabel={(region) => `${region.korName} 지역 선택`}
            renderItem={(region) => <span className="truncate">{region.korName}</span>}
            onSelect={(region) => handleRegionChange(region.id)}
            placeholder="지역 검색..."
            ariaLabel="지역 검색"
            showOnFocus
            isLoading={regions.isLoading || regionSearch.trim() !== debouncedRegionSearch}
            isError={regions.isError}
            onRetry={() => regions.refetch()}
            hasNextPage={regions.hasNextPage}
            isFetchingNextPage={regions.isFetchingNextPage}
            onLoadMore={() => regions.fetchNextPage()}
            className="min-w-0 flex-1"
          />
          {regionId && (
            <Button
              variant="outline"
              aria-label="지역 필터 해제"
              onClick={() => handleRegionChange()}
              className="max-w-[150px] shrink-0 gap-1"
            >
              <span className="truncate">{selectedRegion.data?.korName ?? `#${regionId}`}</span>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <Select value={category ?? 'ALL'} onValueChange={handleCategoryChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="카테고리" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORY_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={handleSearch}>검색</Button>
      </div>

      {/* 정렬과 추가 필터 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Select value={sortType ?? 'DEFAULT'} onValueChange={handleSortTypeChange}>
          <SelectTrigger aria-label="정렬 기준" className="w-full sm:w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={sortOrder}
          onValueChange={handleSortOrderChange}
          disabled={!sortType || sortType === 'DEFAULT'}
        >
          <SelectTrigger aria-label="정렬 방향" className="w-full sm:w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ASC">오름차순</SelectItem>
            <SelectItem value="DESC">내림차순</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Checkbox
            id="includeDeleted"
            checked={includeDeleted}
            onCheckedChange={handleIncludeDeletedChange}
          />
          <Label htmlFor="includeDeleted" className="cursor-pointer text-sm">
            삭제된 데이터 포함
          </Label>
        </div>
      </div>

      {/* 테이블 */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">ID</TableHead>
              <TableHead className="w-[60px]">이미지</TableHead>
              <TableHead>한글명</TableHead>
              <TableHead>영문명</TableHead>
              <TableHead className="w-[100px]">카테고리</TableHead>
              <TableHead className="w-[100px]">수정일</TableHead>
              {includeDeleted && <TableHead className="w-[80px]">상태</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columnCount} className="py-8 text-center">
                  <span className="text-muted-foreground">로딩 중...</span>
                </TableCell>
              </TableRow>
            ) : data?.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columnCount} className="py-8 text-center">
                  <span className="text-muted-foreground">검색 결과가 없습니다.</span>
                </TableCell>
              </TableRow>
            ) : (
              data?.items.map((item) => {
                const isDeleted = item.deletedAt != null;
                return (
                  <TableRow
                    key={item.alcoholId}
                    className={`cursor-pointer hover:bg-muted/50 ${isDeleted ? 'opacity-50' : ''}`}
                    onClick={() => handleRowClick(item.alcoholId)}
                  >
                    <TableCell className="font-mono text-sm">{item.alcoholId}</TableCell>
                    <TableCell>
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.korName}
                          className="h-10 w-10 rounded object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                          <ImageOff className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{item.korName}</TableCell>
                    <TableCell className="text-muted-foreground">{item.engName}</TableCell>
                    <TableCell>{item.korCategoryName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(item.modifiedAt).toLocaleDateString('ko-KR')}
                    </TableCell>
                    {includeDeleted && (
                      <TableCell>
                        {isDeleted && <Badge variant="destructive">삭제됨</Badge>}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
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
