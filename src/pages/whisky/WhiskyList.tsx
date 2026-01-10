/**
 * 위스키 목록 페이지
 */

import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Search } from 'lucide-react';
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
import { useAdminAlcoholList } from '@/hooks/useAdminAlcohols';
import type { AlcoholSearchParams, AlcoholCategory } from '@/types/api';

const CATEGORY_OPTIONS: { value: AlcoholCategory | 'ALL'; label: string }[] = [
  { value: 'ALL', label: '전체' },
  { value: 'SINGLE_MALT', label: '싱글몰트' },
  { value: 'BLEND', label: '블렌디드' },
  { value: 'BLENDED_MALT', label: '블렌디드 몰트' },
  { value: 'BOURBON', label: '버번' },
  { value: 'RYE', label: '라이' },
  { value: 'OTHER', label: '기타' },
];

export function WhiskyListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useState<AlcoholSearchParams>({
    page: 0,
    size: 20,
  });
  const [keyword, setKeyword] = useState('');

  const { data, isLoading } = useAdminAlcoholList(searchParams);

  const handleSearch = () => {
    setSearchParams((prev) => ({
      ...prev,
      keyword: keyword || undefined,
      page: 0,
    }));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleCategoryChange = (value: string) => {
    setSearchParams((prev) => ({
      ...prev,
      category: value === 'ALL' ? undefined : (value as AlcoholCategory),
      page: 0,
    }));
  };

  const handlePageChange = (newPage: number) => {
    setSearchParams((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  const handlePageSizeChange = (size: number) => {
    setSearchParams((prev) => ({
      ...prev,
      size,
      page: 0, // 페이지 크기 변경 시 첫 페이지로
    }));
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

      {/* 필터 */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="위스키 이름으로 검색..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-9"
          />
        </div>
        <Select
          value={searchParams.category ?? 'ALL'}
          onValueChange={handleCategoryChange}
        >
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

      {/* 테이블 */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">ID</TableHead>
              <TableHead>한글명</TableHead>
              <TableHead>영문명</TableHead>
              <TableHead>카테고리</TableHead>
              <TableHead className="w-[120px]">수정일</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <span className="text-muted-foreground">로딩 중...</span>
                </TableCell>
              </TableRow>
            ) : data?.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <span className="text-muted-foreground">
                    검색 결과가 없습니다.
                  </span>
                </TableCell>
              </TableRow>
            ) : (
              data?.items.map((item) => (
                <TableRow
                  key={item.alcoholId}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleRowClick(item.alcoholId)}
                >
                  <TableCell className="font-mono text-sm">
                    {item.alcoholId}
                  </TableCell>
                  <TableCell className="font-medium">{item.korName}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.engName}
                  </TableCell>
                  <TableCell>{item.korCategoryName}</TableCell>
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
          pageSize={searchParams.size ?? 20}
          currentItemCount={data.items.length}
          hasNext={data.meta.hasNext}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      )}
    </div>
  );
}
