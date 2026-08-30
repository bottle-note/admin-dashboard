import { useState } from 'react';
import { CircleHelp, Download, Search } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router';

import { Pagination } from '@/components/common/Pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useMfdsDeclarationList } from '@/hooks/useMfdsDeclarations';
import { useAlcoholExcelTemplateDownload } from '@/hooks/useAdminAlcohols';
import { useToast } from '@/hooks/useToast';
import { getErrorMessage } from '@/lib/api-error';
import { isNonComposingEnterKey } from '@/lib/keyboard';
import type { MfdsDeclarationSearchParams } from '@/types/api';
import {
  MFDS_NORMALIZATION_STATUS_MAP,
  MFDS_NORMALIZATION_STATUS_OPTIONS,
} from './mfds-normalization-status';
import { MFDS_ALCOHOL_MATCH_STATUS_MAP } from './mfds-alcohol-match-status';
import { createAlcoholRegistrationDraft } from './create-alcohol-registration-draft';
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

interface PreparedRegistrationDraft {
  blob: Blob;
  declarationCount: number;
  totalCount: number;
}

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
  const { showToast } = useToast();

  const keyword = urlParams.get('keyword') ?? '';
  const importerId = urlParams.get('importerId') ?? '';
  const normalizationStatus = urlParams.get('normalizationStatus') ?? '';
  const alcoholMatched = urlParams.get('alcoholMatched') ?? '';
  const alcoholMatchDecision = urlParams.get('alcoholMatchDecision') ?? '';
  const cursor = getPositiveNumber(urlParams.get('cursor'));
  const pageSize = getPositiveNumber(urlParams.get('pageSize'), 100) ?? 100;
  const selectedImporterId = getPositiveNumber(importerId);

  const [keywordDraft, setKeywordDraft] = useState<string | null>(null);
  const [cursorHistory, setCursorHistory] = useState<Array<number | undefined>>([]);
  const [preparedRegistrationDraft, setPreparedRegistrationDraft] =
    useState<PreparedRegistrationDraft | null>(null);
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
  const downloadExcelTemplate = useAlcoholExcelTemplateDownload();

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
    if (nextParams.get('pageSize') === '100') nextParams.delete('pageSize');

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

  const handleDownloadRegistrationDraft = async () => {
    if (!data?.items.length) return;

    try {
      const template = await downloadExcelTemplate.mutateAsync();
      const { blob, declarationCount } = await createAlcoholRegistrationDraft(template, data.items);

      setPreparedRegistrationDraft({
        blob,
        declarationCount,
        totalCount: data.items.length,
      });
    } catch (error) {
      showToast({ type: 'error', message: getErrorMessage(error) });
    }
  };

  const handleDownloadPreparedRegistrationDraft = () => {
    if (!preparedRegistrationDraft) return;

    const { blob, declarationCount } = preparedRegistrationDraft;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `alcohol-registration-draft-${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    showToast({
      type: 'success',
      message: `등록 초안에 제품명 ${declarationCount.toLocaleString()}건을 담았습니다.`,
    });
    setPreparedRegistrationDraft(null);
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

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">정규화 상태</Label>
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
              <SelectItem value={ALL}>전체</SelectItem>
              {MFDS_NORMALIZATION_STATUS_OPTIONS.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">위스키 연결</Label>
          <Select
            value={alcoholMatched || ALL}
            onValueChange={(value) =>
              updateUrlParams(
                { alcoholMatched: value === ALL ? undefined : value },
                { resetCursor: true }
              )
            }
          >
            <SelectTrigger aria-label="위스키 연결" className="w-full sm:w-[180px]">
              <SelectValue placeholder="위스키 연결" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>전체</SelectItem>
              <SelectItem value="true">연결됨</SelectItem>
              <SelectItem value="false">연결 안 됨</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">매칭 판정</Label>
          <Select
            value={alcoholMatchDecision || ALL}
            onValueChange={(value) =>
              updateUrlParams(
                { alcoholMatchDecision: value === ALL ? undefined : value },
                { resetCursor: true }
              )
            }
          >
            <SelectTrigger aria-label="매칭 판정" className="w-full sm:w-[180px]">
              <SelectValue placeholder="매칭 판정" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>전체</SelectItem>
              {Object.entries(MATCH_DECISION_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {isFetching && !isLoading && (
          <span className="text-sm text-muted-foreground">목록 갱신 중...</span>
        )}
        <div className="flex items-center gap-2 sm:ml-auto">
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Excel 등록 초안 안내">
                  <CircleHelp className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs leading-relaxed">
                현재 조회 중인 수입원장의 위스키 이름에서 중복을 제외해, 벌크 등록용 Excel 파일로
                다운로드합니다.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {data?.items.length ? (
            <span className="text-sm text-muted-foreground">
              현재 {data.items.length}개 데이터 기준
            </span>
          ) : null}
          <Button
            onClick={handleDownloadRegistrationDraft}
            disabled={
              isLoading || isError || !data?.items.length || downloadExcelTemplate.isPending
            }
          >
            <Download className="h-4 w-4" />
            {downloadExcelTemplate.isPending ? '초안 생성 중...' : 'Excel 등록 초안 다운로드'}
          </Button>
        </div>
      </div>

      <Dialog
        open={preparedRegistrationDraft !== null}
        onOpenChange={(open) => !open && setPreparedRegistrationDraft(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Excel 등록 초안이 준비되었습니다</DialogTitle>
            <DialogDescription>
              전체 {preparedRegistrationDraft?.totalCount.toLocaleString()}개 신고 데이터 중 중복된
              이름을 제거해 {preparedRegistrationDraft?.declarationCount.toLocaleString()}개 이름을
              담았습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreparedRegistrationDraft(null)}>
              취소
            </Button>
            <Button onClick={handleDownloadPreparedRegistrationDraft}>다운로드</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="overflow-x-auto rounded-lg border">
        <Table className="[&_td]:px-4 [&_th]:whitespace-nowrap [&_th]:px-4">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[104px]">데이터 ID</TableHead>
              <TableHead>RCNO</TableHead>
              <TableHead>제품명</TableHead>
              <TableHead>규격</TableHead>
              <TableHead>수입사</TableHead>
              <TableHead>정규화</TableHead>
              <TableHead>위스키 연결</TableHead>
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
                      className={`${MFDS_NORMALIZATION_STATUS_MAP[item.normalizationStatus].badgeClassName} whitespace-nowrap`}
                    >
                      {MFDS_NORMALIZATION_STATUS_MAP[item.normalizationStatus].label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`${
                        MFDS_ALCOHOL_MATCH_STATUS_MAP[
                          item.selectedAlcoholId !== null ? 'CONNECTED' : 'UNCONNECTED'
                        ].badgeClassName
                      } whitespace-nowrap`}
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
