import { useEffect, useState } from 'react';
import { Check, CircleHelp, Download, Minus, Search } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router';

import { Pagination } from '@/components/common/Pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
  createAlcoholRegistrationDraft,
  getAlcoholRegistrationDraftRowCount,
} from './create-alcohol-registration-draft';
import { ImporterSearchSelect } from './ImporterSearchSelect';

const MATCH_DECISION_LABELS: Record<string, string> = {
  CANDIDATE: '후보 선택',
  MANUAL: '직접 선택',
  AUTO: '자동 연결',
  AUTO_SELECTED: '자동 선정',
  INHERITED: '상속 연결',
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

function displayText(value: string | null) {
  return value?.trim() || '-';
}

function ConnectionIndicator({ connected, label }: { connected: boolean; label: string }) {
  if (!connected) {
    return (
      <span
        aria-label={`${label} 연결 안 됨`}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-slate-400"
      >
        <Minus className="h-3 w-3" aria-hidden="true" />
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
            className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-emerald-300 bg-emerald-950 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.35),inset_0_0_6px_rgba(52,211,153,0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
          >
            <Check
              className="h-3 w-3 drop-shadow-[0_0_3px_rgba(110,231,183,0.9)]"
              strokeWidth={2.5}
              aria-hidden="true"
            />
          </span>
        </TooltipTrigger>
        <TooltipContent>{label} 연결됨</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function getMatchDecisionBadgeClass(decision: string | null, connected: boolean) {
  if (connected) {
    return 'border-emerald-700 bg-emerald-700 text-white';
  }
  if (!decision || decision === 'NO_MATCH') {
    return 'border-muted-foreground/20 bg-muted text-muted-foreground';
  }
  return 'border-amber-400 bg-amber-100 text-amber-950';
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
  const [includeConnected, setIncludeConnected] = useState(false);
  const [isDraftDialogOpen, setIsDraftDialogOpen] = useState(false);
  const [isPreparingDraft, setIsPreparingDraft] = useState(false);
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
  const draftItems = (data?.items ?? []).filter(
    (item) => includeConnected || item.selectedAlcoholId == null
  );
  const expectedDraftCount = getAlcoholRegistrationDraftRowCount(draftItems);
  const excludedConnectedCount = (data?.items.length ?? 0) - draftItems.length;

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
    if (!expectedDraftCount || isPreparingDraft) return;

    setIsPreparingDraft(true);
    try {
      const template = await downloadExcelTemplate.mutateAsync();
      const { blob, declarationCount } = await createAlcoholRegistrationDraft(template, draftItems);

      setPreparedRegistrationDraft({
        blob,
        declarationCount,
        totalCount: draftItems.length,
      });
    } catch (error) {
      showToast({ type: 'error', message: getErrorMessage(error) });
    } finally {
      setIsPreparingDraft(false);
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
    setIsDraftDialogOpen(false);
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
            onClick={() => {
              setPreparedRegistrationDraft(null);
              setIncludeConnected(false);
              setIsDraftDialogOpen(true);
            }}
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
        open={isDraftDialogOpen}
        onOpenChange={(open) => {
          if (isPreparingDraft) return;
          setIsDraftDialogOpen(open);
          if (!open) setPreparedRegistrationDraft(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {preparedRegistrationDraft
                ? 'Excel 등록 초안이 준비되었습니다'
                : 'Excel 등록 초안 다운로드'}
            </DialogTitle>
            <DialogDescription>
              {preparedRegistrationDraft
                ? `선택한 ${preparedRegistrationDraft.totalCount.toLocaleString()}개 신고에서 이름·도수·용량이 같은 항목을 합쳐 ${preparedRegistrationDraft.declarationCount.toLocaleString()}개 제품을 담았습니다.`
                : '다운로드 범위를 확인한 뒤 초안을 생성하세요. 전체 검색 결과가 아닌 현재 페이지의 데이터만 포함됩니다.'}
            </DialogDescription>
          </DialogHeader>
          {!preparedRegistrationDraft && (
            <div className="space-y-4">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <Checkbox
                  checked={includeConnected}
                  disabled={isPreparingDraft}
                  onCheckedChange={(checked) => setIncludeConnected(checked === true)}
                />
                이미 위스키에 연결된 데이터 포함
              </label>
              <div
                role="status"
                aria-live="polite"
                className="rounded-lg border border-primary/20 bg-primary/5 p-4"
              >
                <p className="font-semibold">
                  다운로드 예상 개수: {expectedDraftCount.toLocaleString()}개
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  연결된 데이터 {excludedConnectedCount}건 제외 · 남은 {draftItems.length}건에서
                  중복과 이름 없는 항목을 제외한 개수입니다.
                </p>
              </div>
              <dl className="space-y-3 rounded-lg border bg-muted/30 p-4 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">대상 범위</dt>
                  <dd>현재 페이지 {data?.items.length ?? 0}건</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">제품명</dt>
                  <dd>SKU 표시명 우선</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">중복 처리</dt>
                  <dd>이름·도수·용량이 같으면 합침</dd>
                </div>
              </dl>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              disabled={isPreparingDraft}
              onClick={() => {
                setIsDraftDialogOpen(false);
                setPreparedRegistrationDraft(null);
              }}
            >
              취소
            </Button>
            {preparedRegistrationDraft ? (
              <Button onClick={handleDownloadPreparedRegistrationDraft}>다운로드</Button>
            ) : (
              <Button
                disabled={isPreparingDraft || expectedDraftCount === 0}
                onClick={handleDownloadRegistrationDraft}
              >
                {isPreparingDraft ? '초안 생성 중...' : '초안 생성'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div
        role="region"
        aria-label="수입 신고 목록"
        tabIndex={0}
        className="overflow-x-auto rounded-lg border"
      >
        <Table className="min-w-[1160px] [&_td]:px-4 [&_th]:whitespace-nowrap [&_th]:px-4">
          <TableHeader>
            <TableRow>
              <TableHead>제품명</TableHead>
              <TableHead>제품명(영문)</TableHead>
              <TableHead>도수</TableHead>
              <TableHead>용량</TableHead>
              <TableHead>숙성연도</TableHead>
              <TableHead>수입사</TableHead>
              <TableHead className="w-[72px] text-center">위스키</TableHead>
              <TableHead className="w-[72px] text-center">증류소</TableHead>
              <TableHead className="w-[72px] text-center">지역</TableHead>
              <TableHead>위스키 매칭 판정</TableHead>
              <TableHead>통관일자</TableHead>
              <TableHead>수집 시각</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={12} className="h-40 text-center text-muted-foreground">
                  수입 신고 데이터를 불러오는 중입니다.
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={12} className="h-40 text-center">
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
                <TableCell colSpan={12} className="h-40 text-center text-muted-foreground">
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
                    <p className="w-[240px] truncate" title={displayText(item.baseProductNameKo)}>
                      {displayText(item.baseProductNameKo)}
                    </p>
                  </TableCell>
                  <TableCell className="min-w-[220px]">
                    <p className="w-[240px] truncate" title={displayText(item.baseProductNameEn)}>
                      {displayText(item.baseProductNameEn)}
                    </p>
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
                    <p
                      className="w-[180px] truncate"
                      title={item.importerBaseName ?? '연결된 수입사 없음'}
                    >
                      {item.importerBaseName ?? '연결된 수입사 없음'}
                    </p>
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
                      className={`gap-1.5 whitespace-nowrap rounded-md px-2 py-1 text-[11px] font-semibold ${getMatchDecisionBadgeClass(item.alcoholMatchDecision, item.selectedAlcoholId !== null)}`}
                    >
                      {item.selectedAlcoholId !== null ? (
                        <Check className="h-3 w-3" strokeWidth={2.5} aria-hidden="true" />
                      ) : (
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full bg-current"
                          aria-hidden="true"
                        />
                      )}
                      {item.alcoholMatchDecision
                        ? (MATCH_DECISION_LABELS[item.alcoholMatchDecision] ??
                          item.alcoholMatchDecision)
                        : '판정 없음'}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {displayText(item.processedDate)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    <span
                      title="현재 목록 API에서 수집 시각을 제공하지 않습니다."
                      aria-label="수집 시각 미제공"
                    >
                      -
                    </span>
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
