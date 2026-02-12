/**
 * 배너 목록 페이지
 * - URL 쿼리파라미터로 검색/필터/페이지네이션 상태 관리
 * - 순서 변경 모드에서 드래그 앤 드롭으로 순서 변경
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Search, ImageOff, Plus, GripVertical, Check, X, ArrowUpDown } from 'lucide-react';
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
import { useBannerList, useBannerUpdateSortOrder } from '@/hooks/useBanners';
import {
  type BannerSearchParams,
  type BannerType,
  type BannerListItem,
  BANNER_TYPE_LABELS,
} from '@/types/api';

const BANNER_TYPE_OPTIONS: { value: BannerType | 'ALL'; label: string }[] = [
  { value: 'ALL', label: '전체' },
  { value: 'SURVEY', label: '설문조사' },
  { value: 'CURATION', label: '큐레이션' },
  { value: 'AD', label: '광고' },
  { value: 'PARTNERSHIP', label: '제휴' },
  { value: 'ETC', label: '기타' },
];

export function BannerListPage() {
  const navigate = useNavigate();
  const [urlParams, setUrlParams] = useSearchParams();

  // URL에서 검색 파라미터 읽기
  const keyword = urlParams.get('keyword') ?? '';
  const bannerType = urlParams.get('bannerType') as BannerType | null;
  const page = Number(urlParams.get('page')) || 0;
  const size = Number(urlParams.get('size')) || 20;

  // 검색 입력 필드용 로컬 상태 (Enter/버튼 클릭 시에만 URL 반영)
  const [keywordInput, setKeywordInput] = useState(keyword);

  // 순서 변경 모드 상태
  const [isReorderMode, setIsReorderMode] = useState(false);

  // 드래그 상태 (순서 변경 모드에서만 사용)
  const [draggedItem, setDraggedItem] = useState<BannerListItem | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);

  // URL의 keyword가 변경되면 입력 필드도 동기화
  useEffect(() => {
    setKeywordInput(keyword);
  }, [keyword]);

  // API 요청용 파라미터
  const searchParams: BannerSearchParams = {
    keyword: keyword || undefined,
    bannerType: bannerType || undefined,
    page,
    size,
  };

  const { data, isLoading } = useBannerList(searchParams);
  const updateSortOrderMutation = useBannerUpdateSortOrder();

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
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleBannerTypeChange = (value: string) => {
    updateUrlParams({
      bannerType: value === 'ALL' ? undefined : value,
      page: '0', // 타입 변경 시 첫 페이지로
    });
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

  const handleRowClick = (bannerId: number) => {
    // 순서 변경 모드에서는 클릭으로 상세 페이지 이동하지 않음
    if (!isReorderMode) {
      navigate(`/banners/${bannerId}`);
    }
  };

  // 순서 변경 모드 토글
  const toggleReorderMode = () => {
    setIsReorderMode(!isReorderMode);
    // 모드 종료 시 드래그 상태 초기화
    if (isReorderMode) {
      setDraggedItem(null);
      setDragOverId(null);
    }
  };

  // 드래그 앤 드롭 핸들러 (순서 변경 모드에서만 동작)
  const handleDragStart = (e: React.DragEvent, item: BannerListItem) => {
    if (!isReorderMode) return;
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, itemId: number) => {
    if (!isReorderMode) return;
    e.preventDefault();
    setDragOverId(itemId);
  };

  const handleDragLeave = () => {
    if (!isReorderMode) return;
    setDragOverId(null);
  };

  const handleDrop = (e: React.DragEvent, targetItem: BannerListItem) => {
    if (!isReorderMode) return;
    e.preventDefault();
    setDragOverId(null);

    if (!draggedItem || !data?.items || draggedItem.id === targetItem.id) {
      setDraggedItem(null);
      return;
    }

    // 새로운 순서 계산
    const items = [...data.items];
    const draggedIndex = items.findIndex((item) => item.id === draggedItem.id);
    const targetIndex = items.findIndex((item) => item.id === targetItem.id);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedItem(null);
      return;
    }

    // 순서 변경
    items.splice(draggedIndex, 1);
    items.splice(targetIndex, 0, draggedItem);

    // 변경된 순서로 개별 API 호출
    items.forEach((item, index) => {
      if (item.sortOrder !== index) {
        updateSortOrderMutation.mutate({ bannerId: item.id, data: { sortOrder: index } });
      }
    });

    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverId(null);
  };

  // 노출 기간 포맷팅
  const formatExposurePeriod = (startDate: string | null, endDate: string | null) => {
    if (!startDate && !endDate) {
      return '상시 노출';
    }

    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    };

    const start = startDate ? formatDate(startDate) : '';
    const end = endDate ? formatDate(endDate) : '';

    return `${start} ~ ${end}`;
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">배너 관리</h1>
          <p className="text-muted-foreground">홈 화면에 표시되는 배너를 관리합니다.</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={isReorderMode ? 'default' : 'outline'}
            onClick={toggleReorderMode}
          >
            <ArrowUpDown className="mr-2 h-4 w-4" />
            {isReorderMode ? '순서 변경 완료' : '순서 변경'}
          </Button>
          <Button onClick={() => navigate('/banners/new')}>
            <Plus className="mr-2 h-4 w-4" />
            배너 등록
          </Button>
        </div>
      </div>

      {/* 순서 변경 모드 안내 */}
      {isReorderMode && (
        <div className="rounded-lg border border-primary/50 bg-primary/5 p-4">
          <p className="text-sm text-primary">
            <strong>순서 변경 모드</strong> - 우측의 핸들을 드래그하여 배너 순서를 변경할 수 있습니다.
          </p>
        </div>
      )}

      {/* 필터 */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="배너명으로 검색..."
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-9"
          />
        </div>
        <Select
          value={bannerType ?? 'ALL'}
          onValueChange={handleBannerTypeChange}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="배너 타입" />
          </SelectTrigger>
          <SelectContent>
            {BANNER_TYPE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={handleSearch}>검색</Button>
      </div>

      {/* 테이블 */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              {isReorderMode && <TableHead className="w-[60px]">순서</TableHead>}
              <TableHead className="w-[80px]">이미지</TableHead>
              <TableHead>배너명</TableHead>
              <TableHead className="w-[100px]">타입</TableHead>
              <TableHead className="w-[120px]">노출기간</TableHead>
              <TableHead className="w-[80px]">상태</TableHead>
              {!isReorderMode && <TableHead className="w-[60px]">순서</TableHead>}
              {isReorderMode && <TableHead className="w-[50px]"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={isReorderMode ? 7 : 7} className="text-center py-8">
                  <span className="text-muted-foreground">로딩 중...</span>
                </TableCell>
              </TableRow>
            ) : data?.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isReorderMode ? 7 : 7} className="text-center py-8">
                  <span className="text-muted-foreground">
                    검색 결과가 없습니다.
                  </span>
                </TableCell>
              </TableRow>
            ) : (
              data?.items.map((item) => (
                <TableRow
                  key={item.id}
                  className={`${
                    isReorderMode
                      ? dragOverId === item.id
                        ? 'bg-primary/10'
                        : ''
                      : 'cursor-pointer hover:bg-muted/50'
                  }`}
                  draggable={isReorderMode}
                  onDragStart={(e) => handleDragStart(e, item)}
                  onDragOver={(e) => handleDragOver(e, item.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, item)}
                  onDragEnd={handleDragEnd}
                  onClick={() => handleRowClick(item.id)}
                >
                  {/* 순서 변경 모드: 좌측에 순서 번호 */}
                  {isReorderMode && (
                    <TableCell className="text-center font-mono text-sm font-semibold text-primary">
                      {item.sortOrder + 1}
                    </TableCell>
                  )}
                  <TableCell>
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="h-10 w-16 rounded object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-16 items-center justify-center rounded bg-muted">
                        <ImageOff className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {BANNER_TYPE_LABELS[item.bannerType]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatExposurePeriod(item.startDate, item.endDate)}
                  </TableCell>
                  <TableCell>
                    {item.isActive ? (
                      <Badge variant="default" className="whitespace-nowrap bg-green-500">
                        <Check className="mr-1 h-3 w-3" />
                        활성
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="whitespace-nowrap">
                        <X className="mr-1 h-3 w-3" />
                        비활성
                      </Badge>
                    )}
                  </TableCell>
                  {/* 일반 모드: 우측에 순서 번호 */}
                  {!isReorderMode && (
                    <TableCell className="text-center font-mono text-sm">
                      {item.sortOrder + 1}
                    </TableCell>
                  )}
                  {/* 순서 변경 모드: 우측에 드래그 핸들 */}
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
