/**
 * 큐레이션 목록 페이지
 * - URL 쿼리파라미터로 검색/필터/페이지네이션 상태 관리
 * - 인라인 Switch로 활성화 상태 토글
 * - 순서 변경 모드: 전체 로드 후 드래그 재배열, 저장 시 bulk reorder API 호출
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Search, Plus, GripVertical, ArrowUpDown } from 'lucide-react';
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
import { StatusToggle } from '@/components/common/StatusToggle';
import { useReorderDrag } from '@/hooks/useReorderDrag';
import {
  useCurationList,
  useCurationToggleStatus,
  useCurationBulkReorder,
} from '@/hooks/useCurations';
import type { CurationSearchParams, CurationListItem } from '@/types/api';

const IS_ACTIVE_OPTIONS = [
  { value: 'ALL', label: '전체' },
  { value: 'true', label: '활성' },
  { value: 'false', label: '비활성' },
];

/** 순서 변경 모드에서 전체 항목을 한 번에 로드하기 위한 페이지 크기 */
const REORDER_FETCH_SIZE = 1000;

export function CurationListPage() {
  const navigate = useNavigate();
  const [urlParams, setUrlParams] = useSearchParams();

  // URL에서 검색 파라미터 읽기
  const keyword = urlParams.get('keyword') ?? '';
  const isActiveParam = urlParams.get('isActive');
  const page = Number(urlParams.get('page')) || 0;
  const size = Number(urlParams.get('size')) || 20;

  // 검색 입력 필드용 로컬 상태 (Enter/버튼 클릭 시에만 URL 반영)
  const [keywordInput, setKeywordInput] = useState(keyword);
  // 순서 변경 모드 진입을 위한 전체 로드 대기 플래그
  const [pendingReorder, setPendingReorder] = useState(false);

  // URL의 keyword가 변경되면 입력 필드도 동기화
  useEffect(() => {
    setKeywordInput(keyword);
  }, [keyword]);

  // API 요청용 파라미터
  const searchParams: CurationSearchParams = {
    keyword: keyword || undefined,
    isActive: isActiveParam === 'true' ? true : isActiveParam === 'false' ? false : undefined,
    page,
    size,
  };

  const { data, isLoading, refetch } = useCurationList(searchParams);
  const toggleStatusMutation = useCurationToggleStatus();
  const bulkReorderMutation = useCurationBulkReorder();

  const {
    isReorderMode,
    isReordering,
    dragOverId,
    localItems,
    enterReorderMode,
    cancelReorder,
    saveReorder,
    getDragHandlers,
  } = useReorderDrag<CurationListItem>({
    onReorder: (ids) => bulkReorderMutation.mutateAsync({ ids }),
    onReorderFailure: refetch,
  });

  const isListControlDisabled = isReorderMode || pendingReorder;
  const displayedItems = isReorderMode ? localItems : (data?.items ?? []);
  const isFullReorderListLoaded =
    page === 0 && size >= REORDER_FETCH_SIZE && !keyword && isActiveParam === null;

  // 전체 로드가 완료되면 순서 변경 모드로 진입
  useEffect(() => {
    if (!pendingReorder || isLoading || !data) return;
    setPendingReorder(false);
    enterReorderMode(data.items);
  }, [pendingReorder, isLoading, data, enterReorderMode]);

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
    if (isListControlDisabled) return;
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

  const handleIsActiveChange = (value: string) => {
    if (isListControlDisabled) return;
    updateUrlParams({
      isActive: value === 'ALL' ? undefined : value,
      page: '0',
    });
  };

  const handlePageChange = (newPage: number) => {
    updateUrlParams({ page: String(newPage) });
  };

  const handlePageSizeChange = (newSize: number) => {
    updateUrlParams({ size: String(newSize), page: '0' });
  };

  const handleEnterReorder = () => {
    // bulk reorder는 ids에 없는 항목을 뒤로 밀어내므로 전체 항목을 한 번에 로드해야 함.
    // 검색/필터를 해제하고 전체를 1페이지로 로드한 뒤(useEffect) 순서 변경 모드로 진입.
    if (isFullReorderListLoaded && data) {
      enterReorderMode(data.items);
      return;
    }
    setPendingReorder(true);
    setKeywordInput('');
    updateUrlParams({
      size: String(REORDER_FETCH_SIZE),
      page: '0',
      keyword: undefined,
      isActive: undefined,
    });
  };

  const handleSaveReorder = async () => {
    const ok = await saveReorder();
    if (ok) updateUrlParams({ size: undefined, page: undefined });
  };

  const handleCancelReorder = () => {
    cancelReorder();
    updateUrlParams({ size: undefined, page: undefined });
  };

  const handleRowClick = (curationId: number) => {
    if (!isReorderMode) {
      navigate(`/curations/${curationId}`);
    }
  };

  const handleStatusToggle = (curationId: number, currentStatus: boolean) => {
    toggleStatusMutation.mutate({ curationId, data: { isActive: !currentStatus } });
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">큐레이션 관리</h1>
          <p className="text-muted-foreground">위스키 큐레이션을 관리합니다.</p>
        </div>
        <div className="flex gap-2">
          {isReorderMode ? (
            <>
              <Button variant="outline" onClick={handleCancelReorder} disabled={isReordering}>
                취소
              </Button>
              <Button onClick={handleSaveReorder} disabled={isReordering}>
                <ArrowUpDown className="mr-2 h-4 w-4" />
                {isReordering ? '순서 저장 중...' : '순서 변경 완료'}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleEnterReorder} disabled={pendingReorder}>
                <ArrowUpDown className="mr-2 h-4 w-4" />
                {pendingReorder ? '불러오는 중...' : '순서 변경'}
              </Button>
              <Button onClick={() => navigate('/curations/new')}>
                <Plus className="mr-2 h-4 w-4" />
                큐레이션 등록
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 순서 변경 모드 안내 */}
      {isReorderMode && (
        <div className="rounded-lg border border-primary/50 bg-primary/5 p-4">
          <p className="text-sm text-primary">
            <strong>순서 변경 모드</strong> - 우측의 핸들을 드래그하여 큐레이션 순서를 변경한 뒤
            "순서 변경 완료"를 누르세요. (전체 큐레이션을 한 번에 표시합니다)
            {isReordering && <span className="ml-2 text-muted-foreground">(순서 저장 중...)</span>}
          </p>
        </div>
      )}

      {/* 필터 */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="큐레이션명으로 검색..."
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-9"
            disabled={isListControlDisabled}
          />
        </div>
        <Select
          value={isActiveParam ?? 'ALL'}
          onValueChange={handleIsActiveChange}
          disabled={isListControlDisabled}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="상태" />
          </SelectTrigger>
          <SelectContent>
            {IS_ACTIVE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={handleSearch} disabled={isListControlDisabled}>
          검색
        </Button>
      </div>

      {/* 테이블 */}
      <div className="rounded-lg border">
        <Table className="[&_td]:px-4 [&_th]:px-4">
          <TableHeader>
            <TableRow>
              {isReorderMode && <TableHead className="w-[60px]">순서</TableHead>}
              <TableHead>큐레이션명</TableHead>
              <TableHead className="w-[100px]">위스키 수</TableHead>
              {!isReorderMode && <TableHead className="w-[60px]">순서</TableHead>}
              <TableHead className="w-[180px]">상태</TableHead>
              {isReorderMode && <TableHead className="w-[50px]"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={isReorderMode ? 5 : 4} className="py-8 text-center">
                  <span className="text-muted-foreground">로딩 중...</span>
                </TableCell>
              </TableRow>
            ) : displayedItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isReorderMode ? 5 : 4} className="py-8 text-center">
                  <span className="text-muted-foreground">검색 결과가 없습니다.</span>
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
                  {isReorderMode && (
                    <TableCell className="text-center font-mono text-sm font-semibold text-primary">
                      {index + 1}
                    </TableCell>
                  )}
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.alcoholCount}개</Badge>
                  </TableCell>
                  {!isReorderMode && (
                    <TableCell className="text-center font-mono text-sm">
                      {item.displayOrder}
                    </TableCell>
                  )}
                  <TableCell>
                    <StatusToggle
                      isActive={item.isActive}
                      onToggle={() => handleStatusToggle(item.id, item.isActive)}
                      disabled={toggleStatusMutation.isPending || isReorderMode}
                    />
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

      {/* 페이지네이션 (순서 변경 모드에서는 숨김) */}
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
