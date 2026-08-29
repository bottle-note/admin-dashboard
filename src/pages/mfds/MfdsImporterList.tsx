import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router';

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
import { useMfdsImporterList } from '@/hooks/useMfdsImporters';
import { isNonComposingEnterKey } from '@/lib/keyboard';
import type { MfdsImporterAdminStatus, MfdsImporterSearchParams } from '@/types/api';

const ALL = 'ALL';

const ADMIN_STATUS_CONFIG: Record<
  MfdsImporterAdminStatus,
  { label: string; badgeClassName: string }
> = {
  ACTIVE: {
    label: '활성',
    badgeClassName:
      'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300',
  },
  INACTIVE: {
    label: '비활성',
    badgeClassName:
      'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300',
  },
};

function getPositiveNumber(value: string | null, fallback?: number) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : fallback;
}

function getAdminStatus(value: string): MfdsImporterAdminStatus | undefined {
  return value === 'ACTIVE' || value === 'INACTIVE' ? value : undefined;
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function MfdsImporterListPage() {
  const navigate = useNavigate();
  const [urlParams, setUrlParams] = useSearchParams();
  const keyword = urlParams.get('keyword') ?? '';
  const adminStatus = urlParams.get('adminStatus') ?? '';
  const cursor = getPositiveNumber(urlParams.get('cursor'));
  const pageSize = getPositiveNumber(urlParams.get('pageSize'), 20) ?? 20;
  const [keywordDraft, setKeywordDraft] = useState<string | null>(null);
  const [cursorHistory, setCursorHistory] = useState<Array<number | undefined>>([]);
  const keywordInput = keywordDraft ?? keyword;

  const searchParams: MfdsImporterSearchParams = {
    keyword: keyword || undefined,
    adminStatus: getAdminStatus(adminStatus),
    cursor,
    pageSize,
  };
  const { data, isLoading, isFetching, isError, refetch } = useMfdsImporterList(searchParams);
  const hasFilters = Boolean(keyword || adminStatus || cursor);

  const updateUrlParams = (
    updates: Record<string, string | undefined>,
    options?: { resetCursor?: boolean }
  ) => {
    const nextParams = new URLSearchParams(urlParams);

    Object.entries(updates).forEach(([key, value]) => {
      if (!value) nextParams.delete(key);
      else nextParams.set(key, value);
    });

    if (options?.resetCursor) {
      nextParams.delete('cursor');
      setCursorHistory([]);
    }
    if (nextParams.get('pageSize') === '20') nextParams.delete('pageSize');

    setUrlParams(nextParams);
  };

  const handleSearch = () => {
    updateUrlParams({ keyword: keywordInput.trim() || undefined }, { resetCursor: true });
    setKeywordDraft(null);
  };

  const handleNextPage = () => {
    const nextCursor = data?.meta.nextCursor;
    if (nextCursor === null || nextCursor === undefined) return;

    setCursorHistory((history) => [...history, cursor]);
    updateUrlParams({ cursor: String(nextCursor) });
  };

  const handlePreviousPage = () => {
    const previousCursor = cursorHistory[cursorHistory.length - 1];
    setCursorHistory((history) => history.slice(0, -1));
    updateUrlParams({ cursor: previousCursor ? String(previousCursor) : undefined });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">수입사 관리</h1>
          <p className="text-muted-foreground">
            수입사의 식약처 공식 정보와 내부 관리 상태를 확인합니다.
          </p>
        </div>
        <Button onClick={() => navigate('/mfds/importers/new')}>
          <Plus className="mr-2 h-4 w-4" />
          수입사 등록
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_auto]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="수입사 검색"
            placeholder="수입사명, 인허가 번호, 업소 코드 검색"
            value={keywordInput}
            onChange={(event) => setKeywordDraft(event.target.value)}
            onKeyDown={(event) => isNonComposingEnterKey(event) && handleSearch()}
            className="pl-9"
          />
        </div>
        <Select
          value={adminStatus || ALL}
          onValueChange={(value) =>
            updateUrlParams(
              { adminStatus: value === ALL ? undefined : value },
              { resetCursor: true }
            )
          }
        >
          <SelectTrigger aria-label="관리 상태" className="w-full">
            <SelectValue placeholder="관리 상태" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>관리 상태 전체</SelectItem>
            <SelectItem value="ACTIVE">활성</SelectItem>
            <SelectItem value="INACTIVE">비활성</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleSearch}>검색</Button>
      </div>

      {isFetching && !isLoading && <p className="text-sm text-muted-foreground">목록 갱신 중...</p>}

      <div className="overflow-x-auto rounded-lg border">
        <Table className="[&_td]:px-4 [&_th]:whitespace-nowrap [&_th]:px-4">
          <TableHeader>
            <TableRow>
              <TableHead>업체명</TableHead>
              <TableHead>인허가 번호</TableHead>
              <TableHead>공식 업소 코드</TableHead>
              <TableHead>대표자</TableHead>
              <TableHead>영업 상태</TableHead>
              <TableHead>관리 상태</TableHead>
              <TableHead>수정 시각</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-40 text-center text-muted-foreground">
                  수입사 목록을 불러오는 중입니다.
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={7} className="h-40 text-center">
                  <p className="mb-3 text-muted-foreground">수입사 목록을 불러오지 못했습니다.</p>
                  <Button variant="outline" size="sm" onClick={() => refetch()}>
                    다시 시도
                  </Button>
                </TableCell>
              </TableRow>
            ) : data?.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-40 text-center text-muted-foreground">
                  {hasFilters ? '조건에 맞는 수입사가 없습니다.' : '수집된 수입사가 없습니다.'}
                </TableCell>
              </TableRow>
            ) : (
              data?.items.map((importer) => {
                const status = ADMIN_STATUS_CONFIG[importer.adminStatus];

                return (
                  <TableRow
                    key={importer.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/mfds/importers/${importer.id}`)}
                  >
                    <TableCell className="min-w-[220px] font-medium">{importer.businessName}</TableCell>
                    <TableCell className="font-mono text-sm">{importer.licenseNo}</TableCell>
                    <TableCell className="font-mono text-sm">{importer.officialBusinessCode}</TableCell>
                    <TableCell>{importer.representativeName ?? '-'}</TableCell>
                    <TableCell>{importer.operatingStatus || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={status.badgeClassName}>
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {formatDateTime(importer.updatedAt)}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {data && (data.items.length > 0 || cursorHistory.length > 0) && (
        <Pagination
          pageSize={pageSize}
          currentItemCount={data.items.length}
          totalElements={data.meta.totalElements}
          hasNext={data.meta.hasNext}
          hasPrevious={cursorHistory.length > 0}
          onNextPage={handleNextPage}
          onPreviousPage={handlePreviousPage}
          onPageSizeChange={(size) =>
            updateUrlParams({ pageSize: String(size) }, { resetCursor: true })
          }
        />
      )}
    </div>
  );
}
