/**
 * 큐레이션 목록 페이지
 * - URL 쿼리파라미터로 검색/필터/페이지네이션 상태 관리
 * - 인라인 Switch로 활성화 상태 토글
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Search, ImageOff, Plus, Check, X } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';
import { Pagination } from '@/components/common/Pagination';
import { useCurationList, useCurationToggleStatus } from '@/hooks/useCurations';
import type { CurationSearchParams } from '@/types/api';

const IS_ACTIVE_OPTIONS = [
  { value: 'ALL', label: '전체' },
  { value: 'true', label: '활성' },
  { value: 'false', label: '비활성' },
];

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

  const { data, isLoading } = useCurationList(searchParams);
  const toggleStatusMutation = useCurationToggleStatus();

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

  const handleIsActiveChange = (value: string) => {
    updateUrlParams({
      isActive: value === 'ALL' ? undefined : value,
      page: '0', // 필터 변경 시 첫 페이지로
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

  const handleRowClick = (curationId: number) => {
    navigate(`/curations/${curationId}`);
  };

  const handleStatusToggle = (curationId: number, currentStatus: boolean) => {
    toggleStatusMutation.mutate({
      curationId,
      data: { isActive: !currentStatus },
    });
  };

  // 설명 텍스트 truncate
  const truncateDescription = (description: string | null, maxLength: number = 50) => {
    if (!description) return '-';
    if (description.length <= maxLength) return description;
    return `${description.slice(0, maxLength)}...`;
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">큐레이션 관리</h1>
          <p className="text-muted-foreground">위스키 큐레이션을 관리합니다.</p>
        </div>
        <Button onClick={() => navigate('/curations/new')}>
          <Plus className="mr-2 h-4 w-4" />
          큐레이션 등록
        </Button>
      </div>

      {/* 필터 */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="큐레이션명으로 검색..."
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-9"
          />
        </div>
        <Select
          value={isActiveParam ?? 'ALL'}
          onValueChange={handleIsActiveChange}
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
        <Button onClick={handleSearch}>검색</Button>
      </div>

      {/* 테이블 */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">이미지</TableHead>
              <TableHead>큐레이션명</TableHead>
              <TableHead className="w-[200px]">설명</TableHead>
              <TableHead className="w-[100px]">위스키 수</TableHead>
              <TableHead className="w-[60px]">순서</TableHead>
              <TableHead className="w-[100px]">상태</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <span className="text-muted-foreground">로딩 중...</span>
                </TableCell>
              </TableRow>
            ) : data?.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <span className="text-muted-foreground">
                    검색 결과가 없습니다.
                  </span>
                </TableCell>
              </TableRow>
            ) : (
              data?.items.map((item) => (
                <TableRow
                  key={item.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleRowClick(item.id)}
                >
                  <TableCell>
                    {item.coverImageUrl ? (
                      <img
                        src={item.coverImageUrl}
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
                  <TableCell className="text-sm text-muted-foreground">
                    {truncateDescription(item.description)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {item.alcoholCount}개
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center font-mono text-sm">
                    {item.displayOrder}
                  </TableCell>
                  <TableCell>
                    <div
                      className="flex items-center gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Switch
                        checked={item.isActive}
                        onCheckedChange={() => handleStatusToggle(item.id, item.isActive)}
                        disabled={toggleStatusMutation.isPending}
                      />
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
                    </div>
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
