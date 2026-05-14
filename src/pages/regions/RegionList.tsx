/**
 * 지역(Region) 목록 페이지
 * - URL 쿼리파라미터로 검색/페이지네이션 상태 관리
 * - 순서 변경 모드에서 드래그 앤 드롭으로 sortOrder 변경
 * - parentId 기반 부모/자식 관계 시각화 (자식은 들여쓰기)
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Search, Plus, GripVertical, ArrowUpDown, CornerDownRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
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
import { useReorderDrag } from '@/hooks/useReorderDrag';
import { useRegionList, useRegionSortOrderUpdate } from '@/hooks/useRegions';
import type { RegionSearchParams } from '@/types/api';

export function RegionListPage() {
  const navigate = useNavigate();
  const [urlParams, setUrlParams] = useSearchParams();

  const keyword = urlParams.get('keyword') ?? '';
  const page = Number(urlParams.get('page')) || 0;
  const size = Number(urlParams.get('size')) || 50;

  const [keywordInput, setKeywordInput] = useState(keyword);

  useEffect(() => {
    setKeywordInput(keyword);
  }, [keyword]);

  const searchParams: RegionSearchParams = {
    keyword: keyword || undefined,
    page,
    size,
    sortOrder: 'ASC',
  };

  const { data, isLoading, refetch } = useRegionList(searchParams);
  const updateSortOrderMutation = useRegionSortOrderUpdate();

  const { isReorderMode, isReordering, dragOverId, toggleReorderMode, getDragHandlers } =
    useReorderDrag({
      items: data?.items,
      getOrder: (item) => item.sortOrder,
      onReorder: (itemId, newOrder) =>
        updateSortOrderMutation.mutateAsync({ id: itemId, data: { sortOrder: newOrder } }),
      onAfterReorder: refetch,
      pageOffset: page * size,
    });

  // 같은 페이지 내 region을 id로 빠르게 찾기 위한 맵 (부모 이름 표시용)
  const regionMap = useMemo(() => {
    const map = new Map<number, string>();
    data?.items.forEach((item) => map.set(item.id, item.korName));
    return map;
  }, [data]);

  const updateUrlParams = (updates: Record<string, string | undefined>) => {
    const newParams = new URLSearchParams(urlParams);

    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === '') {
        newParams.delete(key);
      } else {
        newParams.set(key, value);
      }
    });

    if (newParams.get('page') === '0') newParams.delete('page');
    if (newParams.get('size') === '50') newParams.delete('size');

    setUrlParams(newParams);
  };

  const handleSearch = () => {
    updateUrlParams({
      keyword: keywordInput || undefined,
      page: '0',
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handlePageChange = (newPage: number) => {
    updateUrlParams({ page: String(newPage) });
  };

  const handlePageSizeChange = (newSize: number) => {
    updateUrlParams({ size: String(newSize), page: '0' });
  };

  const handleRowClick = (id: number) => {
    if (!isReorderMode) {
      navigate(`/regions/${id}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">지역 목록</h1>
          <p className="text-muted-foreground">
            위스키 생산 지역(국가/세부 지역)을 관리합니다.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant={isReorderMode ? 'default' : 'outline'} onClick={toggleReorderMode}>
            <ArrowUpDown className="mr-2 h-4 w-4" />
            {isReorderMode ? '순서 변경 완료' : '순서 변경'}
          </Button>
          <Button onClick={() => navigate('/regions/new')}>
            <Plus className="mr-2 h-4 w-4" />
            지역 추가
          </Button>
        </div>
      </div>

      {/* 순서 변경 모드 안내 */}
      {isReorderMode && (
        <div className="rounded-lg border border-primary/50 bg-primary/5 p-4">
          <p className="text-sm text-primary">
            <strong>순서 변경 모드</strong> — 우측의 핸들을 드래그하여 지역 순서를 변경할 수 있습니다.
            {isReordering && (
              <span className="ml-2 text-muted-foreground">(순서 변경 중...)</span>
            )}
          </p>
        </div>
      )}

      {/* 필터 */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="한글명/영문명으로 검색..."
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-9"
          />
        </div>
        <Button onClick={handleSearch}>검색</Button>
      </div>

      {/* 테이블 */}
      <div className="rounded-lg border">
        <Table className="[&_th]:px-4 [&_td]:px-4">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">ID</TableHead>
              <TableHead>한글명</TableHead>
              <TableHead>영문명</TableHead>
              <TableHead className="w-[140px]">상위 지역</TableHead>
              <TableHead className="w-[80px] text-center">정렬</TableHead>
              {isReorderMode && <TableHead className="w-[50px]"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={isReorderMode ? 6 : 5} className="py-8 text-center">
                  <span className="text-muted-foreground">로딩 중...</span>
                </TableCell>
              </TableRow>
            ) : data?.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isReorderMode ? 6 : 5} className="py-8 text-center">
                  <span className="text-muted-foreground">
                    {keyword ? '검색 결과가 없습니다.' : '등록된 지역이 없습니다.'}
                  </span>
                </TableCell>
              </TableRow>
            ) : (
              data?.items.map((item) => {
                const isChild = item.parentId !== null;
                const parentName = isChild ? regionMap.get(item.parentId!) : undefined;
                return (
                  <TableRow
                    key={item.id}
                    {...getDragHandlers(item)}
                    className={
                      isReorderMode
                        ? dragOverId === item.id
                          ? 'bg-primary/10'
                          : ''
                        : 'cursor-pointer hover:bg-muted/50'
                    }
                    onClick={() => handleRowClick(item.id)}
                  >
                    <TableCell className="font-mono text-sm">{item.id}</TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        {isChild && (
                          <CornerDownRight className="mr-1 h-3 w-3 text-muted-foreground" />
                        )}
                        <span className={isChild ? 'pl-2' : ''}>{item.korName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{item.engName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {isChild ? (
                        parentName ? (
                          <Badge variant="outline" className="font-normal">
                            {parentName}
                          </Badge>
                        ) : (
                          <span className="font-mono">#{item.parentId}</span>
                        )
                      ) : (
                        <span className="text-xs">최상위</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center font-mono text-sm">
                      {item.sortOrder === 9999 ? '—' : item.sortOrder}
                    </TableCell>
                    {isReorderMode && (
                      <TableCell
                        className="cursor-grab active:cursor-grabbing"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
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
