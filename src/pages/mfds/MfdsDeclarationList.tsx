import { useEffect, useState } from 'react';
import { Check, CircleHelp, Download, Search } from 'lucide-react';
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

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function displayText(value: string | null) {
  return value?.trim() || '-';
}

function ConnectionIndicator({ connected, label }: { connected: boolean; label: string }) {
  if (!connected) {
    return (
      <span aria-label={`${label} 연결 안 됨`} className="text-muted-foreground">
        -
      </span>
    );
  }

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            role="img"
            tabIndex={0}
            aria-label={`${label} 연결됨`}
            className="inline-flex text-emerald-600"
          >
            <Check className="h-4 w-4" aria-hidden="true" />
          </span>
        </TooltipTrigger>
        <TooltipContent>{label} 연결됨</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function getMatchDecisionBadgeClass(decision: string | null) {
  if (decision === 'AUTO' || decision === 'AUTO_SELECTED') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  }
  if (decision === 'NO_MATCH') {
    return 'border-muted-foreground/20 bg-muted text-muted-foreground';
  }
  if (decision === 'CANDIDATE' || decision === 'MANUAL') {
    return 'border-blue-200 bg-blue-50 text-blue-700';
  }
  return 'border-amber-200 bg-amber-50 text-amber-800';
}

export function MfdsDeclarationListPage() {
  const navigate = useNavigate();
  const [urlParams, setUrlParams] = useSearchParams();
  const { showToast } = useToast();

  const keyword = urlParams.get('keyword') ?? '';
  const importerId = urlParams.get('importerId') ?? '';
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

  useEffect(() => {
    if (!urlParams.has('normalizationStatus')) return;

    const nextParams = new URLSearchParams(urlParams);
    nextParams.delete('normalizationStatus');
    setUrlParams(nextParams, { replace: true });
  }, [setUrlParams, urlParams]);

  const searchParams: MfdsDeclarationSearchParams = {
    keyword: keyword || undefined,
    importerId: selectedImporterId,
    alcoholMatched:
      alcoholMatched === 'true' ? true : alcoholMatched === 'false' ? false : undefined,
    alcoholMatchDecision: alcoholMatchDecision || undefined,
    cursor,
    pageSize,
  };

  const { data, isLoading, isFetching, isError, refetch } = useMfdsDeclarationList(searchParams);
  const downloadExcelTemplate = useAlcoholExcelTemplateDownload();

  const hasFilters = Boolean(
    keyword || importerId || alcoholMatched || alcoholMatchDecision || cursor
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
      message: `등록 초안에 제품 ${declarationCount.toLocaleString()}건을 담았습니다.`,
    });
    setPreparedRegistrationDraft(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">수입 신고 데이터 검토</h1>
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
          <Label className="text-xs text-muted-foreground">위스키 매칭 판정</Label>
          <Select
            value={alcoholMatchDecision || ALL}
            onValueChange={(value) =>
              updateUrlParams(
                { alcoholMatchDecision: value === ALL ? undefined : value },
                { resetCursor: true }
              )
            }
          >
            <SelectTrigger aria-label="위스키 매칭 판정" className="w-full sm:w-[180px]">
              <SelectValue placeholder="위스키 매칭 판정" />
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
                현재 조회 결과로 등록 초안을 만듭니다.
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
              전체 {preparedRegistrationDraft?.totalCount.toLocaleString()}개 신고 데이터 중 이름,
              도수, 용량이 같은 항목을 합쳐{' '}
              {preparedRegistrationDraft?.declarationCount.toLocaleString()}개 제품을 담았습니다.
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

      <div
        role="region"
        aria-label="수입 신고 목록"
        tabIndex={0}
        className="overflow-x-auto rounded-lg border"
      >
        <Table className="min-w-[1600px] [&_td]:px-4 [&_th]:whitespace-nowrap [&_th]:px-4">
          <TableHeader>
            <TableRow>
              <TableHead>원장</TableHead>
              <TableHead>원장 영문명</TableHead>
              <TableHead>정제 제품 한글명</TableHead>
              <TableHead>정제 제품 영문명</TableHead>
              <TableHead>도수</TableHead>
              <TableHead>용량</TableHead>
              <TableHead>숙성연도</TableHead>
              <TableHead>수입사</TableHead>
              <TableHead className="w-[72px] text-center">위스키</TableHead>
              <TableHead className="w-[72px] text-center">증류소</TableHead>
              <TableHead className="w-[72px] text-center">지역</TableHead>
              <TableHead>위스키 매칭 판정</TableHead>
              <TableHead>적재 시각</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={13} className="h-40 text-center text-muted-foreground">
                  수입 신고 데이터를 불러오는 중입니다.
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={13} className="h-40 text-center">
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
                <TableCell colSpan={13} className="h-40 text-center text-muted-foreground">
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
                  <TableCell className="min-w-[220px]">
                    <p className="font-medium">{displayText(item.skuDisplayNameKo)}</p>
                  </TableCell>
                  <TableCell className="min-w-[220px]">
                    <p>{displayText(item.skuDisplayNameEn)}</p>
                  </TableCell>
                  <TableCell className="min-w-[220px]">
                    <p>{displayText(item.baseProductNameKo)}</p>
                  </TableCell>
                  <TableCell className="min-w-[220px]">
                    <p>{displayText(item.baseProductNameEn)}</p>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm">
                    {item.abvPercent === null ? '-' : `${item.abvPercent}%`}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm">
                    {item.volumeMl === null ? '-' : `${item.volumeMl.toLocaleString()} ml`}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm">
                    {item.ageYears === null ? '-' : `${item.ageYears}년`}
                  </TableCell>
                  <TableCell>
                    <p>{item.importerBaseName ?? '연결된 수입사 없음'}</p>
                  </TableCell>
                  <TableCell className="text-center">
                    <ConnectionIndicator
                      connected={item.selectedAlcoholId !== null}
                      label="위스키"
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <ConnectionIndicator connected={item.distilleryLinked} label="증류소" />
                  </TableCell>
                  <TableCell className="text-center">
                    <ConnectionIndicator connected={item.regionLinked} label="지역" />
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`whitespace-nowrap ${getMatchDecisionBadgeClass(item.alcoholMatchDecision)}`}
                    >
                      {item.alcoholMatchDecision
                        ? (MATCH_DECISION_LABELS[item.alcoholMatchDecision] ??
                          item.alcoholMatchDecision)
                        : '판정 없음'}
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
