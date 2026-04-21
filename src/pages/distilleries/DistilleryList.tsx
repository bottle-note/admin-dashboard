/**
 * 증류소 목록 페이지
 * - URL 쿼리파라미터로 검색/페이지네이션 상태 관리
 * - 테이블 형태 목록 (ID, 로고, 한글명, 영문명, 수정일)
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Search, Plus, ImageOff } from 'lucide-react';
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
import { Pagination } from '@/components/common/Pagination';
import { useDistilleryList } from '@/hooks/useDistilleries';
import type { DistillerySearchParams } from '@/types/api';

export function DistilleryListPage() {
  const navigate = useNavigate();
  const [urlParams, setUrlParams] = useSearchParams();

  // URL에서 검색 파라미터 읽기
  const keyword = urlParams.get('keyword') ?? '';
  const page = Number(urlParams.get('page')) || 0;
  const size = Number(urlParams.get('size')) || 20;
  const sortOrder = (urlParams.get('sortOrder') as 'ASC' | 'DESC') ?? 'ASC';

  // 검색 입력 필드용 로컬 상태
  const [keywordInput, setKeywordInput] = useState(keyword);

  useEffect(() => {
    setKeywordInput(keyword);
  }, [keyword]);

  // API 요청용 파라미터
  const searchParams: DistillerySearchParams = {
    keyword: keyword || undefined,
    page,
    size,
    sortOrder,
  };

  const { data, isLoading } = useDistilleryList(searchParams);

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

    if (newParams.get('page') === '0') newParams.delete('page');
    if (newParams.get('size') === '20') newParams.delete('size');
    if (newParams.get('sortOrder') === 'ASC') newParams.delete('sortOrder');

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

  const handleSortOrderChange = (value: string) => {
    updateUrlParams({
      sortOrder: value === 'ASC' ? undefined : value,
      page: '0',
    });
  };

  const handlePageChange = (newPage: number) => {
    updateUrlParams({ page: String(newPage) });
  };

  const handlePageSizeChange = (newSize: number) => {
    updateUrlParams({ size: String(newSize), page: '0' });
  };

  const handleRowClick = (id: number) => {
    navigate(`/distilleries/${id}`);
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">증류소 목록</h1>
          <p className="text-muted-foreground">등록된 증류소를 관리합니다.</p>
        </div>
        <Button onClick={() => navigate('/distilleries/new')}>
          <Plus className="mr-2 h-4 w-4" />
          증류소 추가
        </Button>
      </div>

      {/* 필터 */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="증류소 이름으로 검색..."
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-9"
          />
        </div>
        <Select value={sortOrder} onValueChange={handleSortOrderChange}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="정렬" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ASC">이름순 (A-Z)</SelectItem>
            <SelectItem value="DESC">이름순 (Z-A)</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleSearch}>검색</Button>
      </div>

      {/* 테이블 */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">ID</TableHead>
              <TableHead className="w-[60px]">로고</TableHead>
              <TableHead>한글명</TableHead>
              <TableHead>영문명</TableHead>
              <TableHead className="w-[100px]">수정일</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center">
                  <span className="text-muted-foreground">로딩 중...</span>
                </TableCell>
              </TableRow>
            ) : data?.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center">
                  <span className="text-muted-foreground">
                    {keyword ? '검색 결과가 없습니다.' : '등록된 증류소가 없습니다.'}
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
                  <TableCell className="font-mono text-sm">{item.id}</TableCell>
                  <TableCell>
                    {item.logoImgUrl ? (
                      <img
                        src={item.logoImgUrl}
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
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(item.modifiedAt).toLocaleDateString('ko-KR')}
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
