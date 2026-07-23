/**
 * 지역 목록 페이지
 * - URL 쿼리파라미터로 검색/페이지네이션 상태 관리
 * - 순서 변경 모드: 전체 로드 후 드래그 재배열, 저장 시 bulk reorder API 호출
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { ArrowUpDown, GripVertical, Plus, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
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
import { Pagination } from '@/components/common/Pagination';
import { useRegionList, useRegionBulkReorder } from '@/hooks/useRegions';
import { isNonComposingEnterKey } from '@/lib/keyboard';
import type { RegionListItem, RegionSearchParams } from '@/types/api';

/** 순서 변경 모드에서 전체 항목을 한 번에 로드하기 위한 페이지 크기 */
const REORDER_FETCH_SIZE = 1000;

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('ko-KR');
}

export function RegionListPage() {
  const navigate = useNavigate();
  const [urlParams, setUrlParams] = useSearchParams();

  const keyword = urlParams.get('keyword') ?? '';
  const page = Number(urlParams.get('page')) || 0;
  const size = Number(urlParams.get('size')) || 100;
  const sortOrder = (urlParams.get('sortOrder') as 'ASC' | 'DESC') ?? 'ASC';

  const [keywordInput, setKeywordInput] = useState(keyword);
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [pendingReorderMode, setPendingReorderMode] = useState(false);
  const [localItems, setLocalItems] = useState<RegionListItem[]>([]);
  const [originalItems, setOriginalItems] = useState<RegionListItem[]>([]);
  const [draggedItem, setDraggedItem] = useState<RegionListItem | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);

  useEffect(() => {
    setKeywordInput(keyword);
  }, [keyword]);

  const searchParams: RegionSearchParams = {
    keyword: keyword || undefined,
    page,
    size,
    sortOrder,
  };

  const { data, isLoading, refetch } = useRegionList(searchParams);
  const bulkReorderMutation = useRegionBulkReorder();

  const hasUnsavedOrder =
    isReorderMode &&
    (localItems.length !== originalItems.length ||
      localItems.some((item, idx) => item.id !== originalItems[idx]?.id));
  const isListControlDisabled = isReorderMode || hasUnsavedOrder || pendingReorderMode;
  const displayedItems = isReorderMode ? localItems : (data?.items ?? []);
  const isFullReorderListLoaded =
    page === 0 && size >= REORDER_FETCH_SIZE && sortOrder === 'ASC' && !keyword;

  const getParentDisplayName = (parentId: number | null) => {
    if (parentId == null) return '-';

    const parent = (data?.items ?? localItems).find((item) => item.id === parentId);
    if (!parent) return '-';

    return parent.korName;
  };

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
    if (newParams.get('size') === '100') newParams.delete('size');
    if (newParams.get('sortOrder') === 'ASC') newParams.delete('sortOrder');

    setUrlParams(newParams);
  };

  const startReorderMode = (items: RegionListItem[]) => {
    setOriginalItems(items);
    setLocalItems(items);
    setDraggedItem(null);
    setDragOverId(null);
    setIsReorderMode(true);
  };

  useEffect(() => {
    if (!pendingReorderMode || isLoading || !data) return;
    setPendingReorderMode(false);
    startReorderMode(data.items);
  }, [data, isLoading, pendingReorderMode]);

  const handleSearch = () => {
    if (isListControlDisabled) return;
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

  const handleSortOrderChange = (value: string) => {
    if (isListControlDisabled) return;
    updateUrlParams({
      sortOrder: value === 'ASC' ? undefined : value,
      page: '0',
    });
  };

  const handlePageChange = (newPage: number) => {
    if (isListControlDisabled) return;
    updateUrlParams({ page: String(newPage) });
  };

  const handlePageSizeChange = (newSize: number) => {
    if (isListControlDisabled) return;
    updateUrlParams({ size: String(newSize), page: '0' });
  };

  const handleEnterReorderMode = () => {
    if (isFullReorderListLoaded && data) {
      startReorderMode(data.items);
      return;
    }
    setPendingReorderMode(true);
    setKeywordInput('');
    updateUrlParams({
      keyword: undefined,
      sortOrder: undefined,
      page: '0',
      size: String(REORDER_FETCH_SIZE),
    });
  };

  const handleCancelReorder = () => {
    setLocalItems(originalItems);
    setDraggedItem(null);
    setDragOverId(null);
    setIsReorderMode(false);
    updateUrlParams({ size: undefined, page: undefined });
  };

  const handleSaveReorder = async () => {
    if (!hasUnsavedOrder) {
      setIsReorderMode(false);
      updateUrlParams({ size: undefined, page: undefined });
      return;
    }

    setIsSavingOrder(true);
    try {
      await bulkReorderMutation.mutateAsync({ ids: localItems.map((item) => item.id) });
      setIsReorderMode(false);
      updateUrlParams({ size: undefined, page: undefined });
    } catch {
      setLocalItems(originalItems);
      await refetch();
    } finally {
      setIsSavingOrder(false);
      setDraggedItem(null);
      setDragOverId(null);
    }
  };

  const handleRowClick = (id: number) => {
    if (!isReorderMode) {
      navigate(`/regions/${id}`);
    }
  };

  const getDragHandlers = (targetItem: RegionListItem) => ({
    draggable: isReorderMode,
    onDragStart: (e: React.DragEvent) => {
      if (!isReorderMode || isSavingOrder) return;
      setDraggedItem(targetItem);
      e.dataTransfer.effectAllowed = 'move';
    },
    onDragOver: (e: React.DragEvent) => {
      if (!isReorderMode || isSavingOrder) return;
      e.preventDefault();
      setDragOverId(targetItem.id);
    },
    onDragLeave: () => {
      if (!isReorderMode || isSavingOrder) return;
      setDragOverId(null);
    },
    onDrop: (e: React.DragEvent) => {
      if (!isReorderMode || isSavingOrder) return;
      e.preventDefault();
      setDragOverId(null);

      if (!draggedItem || draggedItem.id === targetItem.id) {
        setDraggedItem(null);
        return;
      }

      setLocalItems((prev) => {
        const next = [...prev];
        const draggedIndex = next.findIndex((item) => item.id === draggedItem.id);
        const targetIndex = next.findIndex((item) => item.id === targetItem.id);

        if (draggedIndex === -1 || targetIndex === -1) return prev;

        next.splice(draggedIndex, 1);
        next.splice(targetIndex, 0, draggedItem);

        return next;
      });
      setDraggedItem(null);
    },
    onDragEnd: () => {
      setDraggedItem(null);
      setDragOverId(null);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">지역 목록</h1>
          <p className="text-muted-foreground">위스키 원산지로 사용되는 지역을 관리합니다.</p>
        </div>
        <div className="flex gap-2">
          {isReorderMode ? (
            <>
              <Button variant="outline" onClick={handleCancelReorder} disabled={isSavingOrder}>
                취소
              </Button>
              <Button onClick={handleSaveReorder} disabled={isSavingOrder}>
                <ArrowUpDown className="mr-2 h-4 w-4" />
                {isSavingOrder ? '순서 저장 중...' : '순서 변경 완료'}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleEnterReorderMode}
                disabled={pendingReorderMode}
              >
                <ArrowUpDown className="mr-2 h-4 w-4" />
                {pendingReorderMode ? '불러오는 중...' : '순서 변경'}
              </Button>
              <Button onClick={() => navigate('/regions/new')}>
                <Plus className="mr-2 h-4 w-4" />
                지역 추가
              </Button>
            </>
          )}
        </div>
      </div>

      {isReorderMode && (
        <div className="rounded-lg border border-primary/50 bg-primary/5 p-4">
          <p className="text-sm text-primary">
            <strong>순서 변경 모드</strong> - 우측의 핸들을 드래그하여 지역 순서를 변경할 수
            있습니다.
            {hasUnsavedOrder && (
              <span className="ml-2 text-muted-foreground">
                (저장되지 않은 순서 변경이 있습니다.)
              </span>
            )}
            {isSavingOrder && <span className="ml-2 text-muted-foreground">(순서 저장 중...)</span>}
          </p>
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="지역 이름으로 검색..."
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-9"
            disabled={isListControlDisabled}
          />
        </div>
        <Select
          value={sortOrder}
          onValueChange={handleSortOrderChange}
          disabled={isListControlDisabled}
        >
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="정렬" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ASC">순서 낮은순</SelectItem>
            <SelectItem value="DESC">순서 높은순</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleSearch} disabled={isListControlDisabled}>
          검색
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table className="[&_td]:px-4 [&_th]:px-4">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">순서</TableHead>
              <TableHead className="w-[72px]">이미지</TableHead>
              <TableHead>한글명</TableHead>
              <TableHead>영문명</TableHead>
              <TableHead className="w-[120px]">대륙</TableHead>
              <TableHead className="w-[180px] whitespace-nowrap">상위 지역</TableHead>
              <TableHead className="w-[120px] whitespace-nowrap">수정일</TableHead>
              {isReorderMode && <TableHead className="w-[50px]" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={isReorderMode ? 8 : 7} className="py-8 text-center">
                  <span className="text-muted-foreground">로딩 중...</span>
                </TableCell>
              </TableRow>
            ) : displayedItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isReorderMode ? 8 : 7} className="py-8 text-center">
                  <span className="text-muted-foreground">
                    {keyword ? '검색 결과가 없습니다.' : '등록된 지역이 없습니다.'}
                  </span>
                </TableCell>
              </TableRow>
            ) : (
              displayedItems.map((item, index) => (
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
                  <TableCell className="text-center font-mono text-sm">
                    {isReorderMode ? index + 1 : item.sortOrder + 1}
                  </TableCell>
                  <TableCell>
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={`${item.korName} 대표 이미지`}
                        className="h-10 w-10 rounded object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded bg-muted text-xs text-muted-foreground">
                        -
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{item.korName}</TableCell>
                  <TableCell className="text-muted-foreground">{item.engName}</TableCell>
                  <TableCell>{item.continent || '-'}</TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {getParentDisplayName(item.parentId)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {formatDate(item.modifiedAt)}
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
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data && data.items.length > 0 && !isReorderMode && (
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
