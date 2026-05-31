import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Plus, Search } from 'lucide-react';

import { Pagination } from '@/components/common/Pagination';
import { Badge } from '@/components/ui/badge';
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
import { useCurationList } from '@/hooks/useCurations';
import type { CurationV2SearchParams } from '@/types/api';

import { formatCurationDateTime, formatCurationSpecCode } from './curation-display-utils';

const IS_ACTIVE_OPTIONS = [
  { value: 'ALL', label: '전체' },
  { value: 'true', label: '활성' },
  { value: 'false', label: '비활성' },
];

export function CurationListPage() {
  const navigate = useNavigate();
  const [urlParams, setUrlParams] = useSearchParams();

  const keyword = urlParams.get('keyword') ?? '';
  const isActiveParam = urlParams.get('isActive');
  const page = Number(urlParams.get('page')) || 0;
  const size = Number(urlParams.get('size')) || 20;
  const [keywordInput, setKeywordInput] = useState(keyword);

  useEffect(() => {
    setKeywordInput(keyword);
  }, [keyword]);

  const searchParams: CurationV2SearchParams = {
    keyword: keyword || undefined,
    isActive: isActiveParam === 'true' ? true : isActiveParam === 'false' ? false : undefined,
    page,
    size,
  };

  const { data, isLoading } = useCurationList(searchParams);

  const updateUrlParams = (updates: Record<string, string | undefined>) => {
    const nextParams = new URLSearchParams(urlParams);

    Object.entries(updates).forEach(([key, value]) => {
      if (!value) {
        nextParams.delete(key);
      } else {
        nextParams.set(key, value);
      }
    });

    if (nextParams.get('page') === '0') nextParams.delete('page');
    if (nextParams.get('size') === '20') nextParams.delete('size');

    setUrlParams(nextParams);
  };

  const handleSearch = () => {
    updateUrlParams({
      keyword: keywordInput || undefined,
      page: '0',
    });
  };

  const handleIsActiveChange = (value: string) => {
    updateUrlParams({
      isActive: value === 'ALL' ? undefined : value,
      page: '0',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">큐레이션 관리</h1>
          <p className="text-muted-foreground">스펙 기반으로 생성된 큐레이션을 조회합니다.</p>
        </div>
        <Button onClick={() => navigate('/dashboard/curations/new')}>
          <Plus className="mr-2 h-4 w-4" />
          큐레이션 작성
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="큐레이션명으로 검색..."
            value={keywordInput}
            onChange={(event) => setKeywordInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                handleSearch();
              }
            }}
            className="pl-9"
          />
        </div>
        <Select value={isActiveParam ?? 'ALL'} onValueChange={handleIsActiveChange}>
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

      <div className="rounded-lg border">
        <Table className="[&_td]:px-4 [&_th]:px-4">
          <TableHeader>
            <TableRow>
              <TableHead>큐레이션명</TableHead>
              <TableHead className="w-[180px]">스펙</TableHead>
              <TableHead className="w-[90px]">순서</TableHead>
              <TableHead className="w-[100px]">상태</TableHead>
              <TableHead className="w-[180px]">생성일</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  로딩 중...
                </TableCell>
              </TableRow>
            ) : data?.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  검색 결과가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              data?.items.map((item) => (
                <TableRow
                  key={item.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/dashboard/curations/${item.id}`)}
                >
                  <TableCell>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-muted-foreground">ID: {item.id}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{formatCurationSpecCode(item.specCode)}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{item.displayOrder}</TableCell>
                  <TableCell>
                    <Badge variant={item.isActive ? 'default' : 'secondary'}>
                      {item.isActive ? '활성' : '비활성'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatCurationDateTime(item.createdAt)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data && data.items.length > 0 && (
        <Pagination
          currentPage={data.meta.page}
          totalPages={data.meta.totalPages}
          totalElements={data.meta.totalElements}
          pageSize={size}
          currentItemCount={data.items.length}
          hasNext={data.meta.hasNext}
          onPageChange={(nextPage) => updateUrlParams({ page: String(nextPage) })}
          onPageSizeChange={(nextSize) => updateUrlParams({ size: String(nextSize), page: '0' })}
        />
      )}
    </div>
  );
}
