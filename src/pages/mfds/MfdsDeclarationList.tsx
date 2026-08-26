import { useState } from 'react';
import { Search } from 'lucide-react';
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
import { useMfdsDeclarationList } from '@/hooks/useMfdsDeclarations';
import { isNonComposingEnterKey } from '@/lib/keyboard';
import type { MfdsDeclarationSearchParams } from '@/types/api';
import {
  MFDS_NORMALIZATION_STATUS_MAP,
  MFDS_NORMALIZATION_STATUS_OPTIONS,
} from './mfds-normalization-status';
import { MFDS_ALCOHOL_MATCH_STATUS_MAP } from './mfds-alcohol-match-status';
import { ImporterSearchSelect } from './ImporterSearchSelect';

const MATCH_DECISION_LABELS: Record<string, string> = {
  CANDIDATE: '후보 선택',
  MANUAL: '직접 선택',
  AUTO: '자동 연결',
  AUTO_SELECTED: '자동 선정',
  NO_MATCH: '후보 없음',
  REVIEW: '검토 필요',
  AMBIGUOUS: '후보 모호',
  CONFLICT_REVIEW: '충돌 검토',
};

const ALL = 'ALL';

function getPositiveNumber(value: string | null, fallback?: number) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : fallback;
}

function getNormalizationStatus(value: string) {
  return MFDS_NORMALIZATION_STATUS_OPTIONS.find((status) => status.value === value)?.value;
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

function formatSpecification(volumeMl: number | null, abvPercent: number | null) {
  const volume = volumeMl === null ? '' : `${volumeMl.toLocaleString()} ml`;
  const abv = abvPercent === null ? '' : `(${abvPercent}%)`;
  return [volume, abv].filter(Boolean).join(' ') || '-';
}

export function MfdsDeclarationListPage() {
  const navigate = useNavigate();
  const [urlParams, setUrlParams] = useSearchParams();

  const keyword = urlParams.get('keyword') ?? '';
  const importerId = urlParams.get('importerId') ?? '';
  const normalizationStatus = urlParams.get('normalizationStatus') ?? '';
  const alcoholMatched = urlParams.get('alcoholMatched') ?? '';
  const alcoholMatchDecision = urlParams.get('alcoholMatchDecision') ?? '';
  const cursor = getPositiveNumber(urlParams.get('cursor'));
  const pageSize = getPositiveNumber(urlParams.get('pageSize'), 20) ?? 20;
  const selectedImporterId = getPositiveNumber(importerId);

  const [keywordDraft, setKeywordDraft] = useState<string | null>(null);
  const [cursorHistory, setCursorHistory] = useState<Array<number | undefined>>([]);
  const keywordInput = keywordDraft ?? keyword;

  const searchParams: MfdsDeclarationSearchParams = {
    keyword: keyword || undefined,
    importerId: selectedImporterId,
    normalizationStatus: getNormalizationStatus(normalizationStatus),
    alcoholMatched:
      alcoholMatched === 'true' ? true : alcoholMatched === 'false' ? false : undefined,
    alcoholMatchDecision: alcoholMatchDecision || undefined,
    cursor,
    pageSize,
  };

  const { data, isLoading, isFetching, isError, refetch } = useMfdsDeclarationList(searchParams);

  const hasFilters = Boolean(
    keyword || importerId || normalizationStatus || alcoholMatched || alcoholMatchDecision || cursor
  );

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
    updateUrlParams(
      {
        keyword: keywordInput.trim() || undefined,
      },
      { resetCursor: true }
    );
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
      <div>
        <h1 className="text-2xl font-bold">수입 신고 데이터 검토</h1>
        <p className="text-muted-foreground">
          식약처에서 수집한 신고 데이터의 정규화 상태와 보틀노트 연결 결과를 검토합니다.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_280px_auto]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="제품명 또는 수입신고번호 검색"
            placeholder="제품명 또는 RCNO 검색"
            value={keywordInput}
            onChange={(event) => setKeywordDraft(event.target.value)}
            onKeyDown={(event) => isNonComposingEnterKey(event) && handleSearch()}
            className="pl-9"
          />
        </div>
        <ImporterSearchSelect
          selectedImporterId={selectedImporterId}
          onSelect={(selectedImporter) =>
            updateUrlParams({ importerId: String(selectedImporter.id) }, { resetCursor: true })
          }
          onClear={() => updateUrlParams({ importerId: undefined }, { resetCursor: true })}
        />
        <Button onClick={handleSearch}>검색</Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Select
          value={normalizationStatus || ALL}
          onValueChange={(value) =>
            updateUrlParams(
              { normalizationStatus: value === ALL ? undefined : value },
              { resetCursor: true }
            )
          }
        >
          <SelectTrigger aria-label="정규화 상태" className="w-full sm:w-[180px]">
            <SelectValue placeholder="정규화 상태" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>정규화 전체</SelectItem>
            {MFDS_NORMALIZATION_STATUS_OPTIONS.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={alcoholMatched || ALL}
          onValueChange={(value) =>
            updateUrlParams(
              { alcoholMatched: value === ALL ? undefined : value },
              { resetCursor: true }
            )
          }
        >
          <SelectTrigger aria-label="보틀노트 연결 여부" className="w-full sm:w-[180px]">
            <SelectValue placeholder="보틀노트 연결 여부" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>연결 여부 전체</SelectItem>
            <SelectItem value="true">연결됨</SelectItem>
            <SelectItem value="false">연결 안 됨</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={alcoholMatchDecision || ALL}
          onValueChange={(value) =>
            updateUrlParams(
              { alcoholMatchDecision: value === ALL ? undefined : value },
              { resetCursor: true }
            )
          }
        >
          <SelectTrigger aria-label="연결 판정" className="w-full sm:w-[180px]">
            <SelectValue placeholder="연결 판정" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>연결 판정 전체</SelectItem>
            {Object.entries(MATCH_DECISION_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isFetching && !isLoading && (
          <span className="text-sm text-muted-foreground">목록 갱신 중...</span>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">데이터 ID</TableHead>
              <TableHead>RCNO</TableHead>
              <TableHead>제품명</TableHead>
              <TableHead>규격</TableHead>
              <TableHead>수입사</TableHead>
              <TableHead>정규화</TableHead>
              <TableHead>보틀노트 연결</TableHead>
              <TableHead>적재 시각</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-40 text-center text-muted-foreground">
                  수입 신고 데이터를 불러오는 중입니다.
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={8} className="h-40 text-center">
                  <p className="mb-3 text-muted-foreground">
                    수입 신고 데이터를 불러오지 못했습니다.
                  </p>
                  <Button variant="outline" size="sm" onClick={() => refetch()}>
                    다시 시도
                  </Button>
                </TableCell>
              </TableRow>
            ) : data?.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-40 text-center text-muted-foreground">
                  {hasFilters
                    ? '조건에 맞는 신고 데이터가 없습니다.'
                    : '수집된 신고 데이터가 없습니다.'}
                </TableCell>
              </TableRow>
            ) : (
              data?.items.map((item) => (
                <TableRow
                  key={item.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/mfds/declarations/${item.id}`)}
                >
                  <TableCell className="font-mono text-sm">{item.id}</TableCell>
                  <TableCell className="whitespace-nowrap font-mono text-sm">{item.rcno}</TableCell>
                  <TableCell className="min-w-[220px]">
                    <p className="font-medium">{item.baseProductNameKo ?? '제품명 정보 없음'}</p>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm">
                    {formatSpecification(item.volumeMl, item.abvPercent)}
                  </TableCell>
                  <TableCell>
                    <p>{item.importerBaseName ?? '연결된 수입사 없음'}</p>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        MFDS_NORMALIZATION_STATUS_MAP[item.normalizationStatus].badgeClassName
                      }
                    >
                      {MFDS_NORMALIZATION_STATUS_MAP[item.normalizationStatus].label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        MFDS_ALCOHOL_MATCH_STATUS_MAP[
                          item.selectedAlcoholId !== null ? 'CONNECTED' : 'UNCONNECTED'
                        ].badgeClassName
                      }
                    >
                      {
                        MFDS_ALCOHOL_MATCH_STATUS_MAP[
                          item.selectedAlcoholId !== null ? 'CONNECTED' : 'UNCONNECTED'
                        ].label
                      }
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {formatDateTime(item.createdAt)}
                  </TableCell>
                </TableRow>
              ))
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
