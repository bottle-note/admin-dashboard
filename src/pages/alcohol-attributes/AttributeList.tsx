/**
 * 속성 목록 페이지
 * - 검색어·그룹·분류·페이지를 URL로 관리한다
 * - 행 클릭으로 속성 상세에 들어간다
 */

import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Plus, Search } from 'lucide-react';

import { PageHeader } from '@/components/common/PageHeader';
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
import {
  useAlcoholAttributes,
  useAttributeEnums,
  useAttributeGroups,
} from '@/hooks/useAlcoholAttributes';
import { isNonComposingEnterKey } from '@/lib/keyboard';
import type { AttributeType } from '@/types/api/alcohol-attribute.api';

const ALL = 'all';

export function AttributeListPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const keyword = params.get('q') ?? '';
  const groupId = params.get('groupId') ?? '';
  const typeParam = params.get('type') ?? '';
  const enums = useAttributeEnums();
  const types = enums.data?.types ?? [];
  const type = types.some((item) => item.code === typeParam)
    ? (typeParam as AttributeType)
    : undefined;
  const page = Number(params.get('page')) || 0;
  const size = Number(params.get('size')) || 20;

  const groups = useAttributeGroups();
  const { data, isLoading } = useAlcoholAttributes({
    keyword: keyword || undefined,
    groupIds: groupId ? [Number(groupId)] : undefined,
    type,
    page,
    size,
  });

  const update = (updates: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params);
    Object.entries(updates).forEach(([key, value]) =>
      value ? next.set(key, value) : next.delete(key)
    );
    if (next.get('page') === '0') next.delete('page');
    if (next.get('size') === '20') next.delete('size');
    setParams(next);
  };

  const groupName = (id: number | null) =>
    id == null ? '미분류' : (groups.data?.find((group) => group.id === id)?.name ?? '-');
  const isFiltered = Boolean(keyword || groupId || type);

  return (
    <div className="space-y-6">
      <PageHeader
        title="속성 목록"
        actions={
          <Button onClick={() => navigate('/attributes/new')}>
            <Plus className="mr-2 h-4 w-4" />
            속성 추가
          </Button>
        }
      />

      <div className="flex flex-col gap-4 sm:flex-row">
        <KeywordSearch
          key={keyword}
          initialValue={keyword}
          onSearch={(value) => update({ q: value, page: undefined })}
        />
        <Select
          value={groupId || ALL}
          onValueChange={(value) =>
            update({ groupId: value === ALL ? undefined : value, page: undefined })
          }
        >
          <SelectTrigger aria-label="그룹" className="w-full sm:w-[220px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>전체 그룹</SelectItem>
            {groups.data?.map((group) => (
              <SelectItem key={group.id} value={String(group.id)}>
                {group.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={type ?? ALL}
          onValueChange={(value) =>
            update({ type: value === ALL ? undefined : value, page: undefined })
          }
        >
          <SelectTrigger aria-label="분류" className="w-full sm:w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>전체 분류</SelectItem>
            {types.map((item) => (
              <SelectItem key={item.code} value={item.code}>
                {item.korName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table className="[&_td]:px-4 [&_th]:px-4">
          <TableHeader>
            <TableRow>
              <TableHead>이름</TableHead>
              <TableHead>키</TableHead>
              <TableHead>그룹</TableHead>
              <TableHead>분류</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                  로딩 중...
                </TableCell>
              </TableRow>
            ) : !data?.items.length ? (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                  {isFiltered ? '검색 결과가 없습니다.' : '등록된 속성이 없습니다.'}
                </TableCell>
              </TableRow>
            ) : (
              data.items.map((item) => (
                <TableRow
                  key={item.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/attributes/${item.id}`)}
                >
                  <TableCell className="font-medium">{item.displayName}</TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {item.key}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{groupName(item.groupId)}</Badge>
                  </TableCell>
                  <TableCell>
                    {types.find((option) => option.code === item.type)?.korName ?? item.type}
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
          onPageChange={(next) => update({ page: String(next) })}
          onPageSizeChange={(next) => update({ size: String(next), page: undefined })}
        />
      )}
    </div>
  );
}

function KeywordSearch({
  initialValue,
  onSearch,
}: {
  initialValue: string;
  onSearch: (value: string) => void;
}) {
  const [value, setValue] = useState(initialValue);
  return (
    <>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          aria-label="속성 검색"
          placeholder="속성 이름 또는 키로 검색..."
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (isNonComposingEnterKey(event)) onSearch(value.trim());
          }}
          className="pl-9"
        />
      </div>
      <Button className="sm:order-last" onClick={() => onSearch(value.trim())}>
        검색
      </Button>
    </>
  );
}
