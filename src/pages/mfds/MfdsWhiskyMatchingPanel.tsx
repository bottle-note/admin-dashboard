import { useState, type ReactNode } from 'react';
import { CheckCircle2, ExternalLink, Loader2, RotateCw, Search, X } from 'lucide-react';
import { Link } from 'react-router';

import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import {
  flattenAdminAlcoholLookupPages,
  useAdminAlcoholDetail,
  useAdminAlcoholLookupInfinite,
} from '@/hooks/useAdminAlcohols';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useMfdsMatchingActions, useMfdsMatchingCandidates } from '@/hooks/useMfdsDeclarations';
import { toCandidateWhisky, toSearchedWhisky, type PendingWhisky } from './mfds-pending-whisky';
import { MfdsWhiskyThumbnail } from './MfdsWhiskyThumbnail';

function CurrentWhiskyCard({
  whisky,
  footerAction,
}: {
  whisky: { alcoholId: number; korName: string; engName: string; imageUrl: string | null };
  footerAction: ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-background">
      <div className="flex items-center gap-2.5 px-3 py-2">
        <MfdsWhiskyThumbnail imageUrl={whisky.imageUrl} className="h-10 w-10" />
        <div className="min-w-0 flex-1">
          <p title={whisky.korName} className="truncate text-sm font-semibold">
            {whisky.korName}
          </p>
          {whisky.engName && (
            <p title={whisky.engName} className="truncate text-xs text-muted-foreground">
              {whisky.engName}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 border-t px-3 py-1">
        <Link
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          to={`/whisky/${whisky.alcoholId}`}
          target="_blank"
          rel="noreferrer"
        >
          상세 보기
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
        {footerAction}
      </div>
    </div>
  );
}

/** 작업 창 안에서 콘텐츠로 바뀌는 위스키 직접 검색 화면이다. */
export function MfdsWhiskyLookupPanel({ onSelect }: { onSelect: (whisky: PendingWhisky) => void }) {
  const [keyword, setKeyword] = useState('');
  const debouncedKeyword = useDebouncedValue(keyword.trim(), 300);
  const lookupQuery = useAdminAlcoholLookupInfinite({
    keyword: debouncedKeyword || undefined,
    size: 20,
  });
  const whiskies = flattenAdminAlcoholLookupPages(lookupQuery.data);

  return (
    <>
      <div className="border-b px-5 py-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="위스키 이름, 카테고리, 증류소로 검색"
            aria-label="위스키 검색"
            className="h-8 pl-9 text-sm"
            autoFocus
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-3">
        {lookupQuery.isLoading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            위스키 목록을 불러오는 중입니다.
          </div>
        ) : lookupQuery.isError ? (
          <div className="space-y-3 py-6 text-center">
            <p className="text-sm text-muted-foreground">위스키 목록을 불러오지 못했습니다.</p>
            <Button type="button" variant="outline" size="sm" onClick={() => lookupQuery.refetch()}>
              다시 시도
            </Button>
          </div>
        ) : whiskies.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">검색 결과가 없습니다.</p>
        ) : (
          <div className="divide-y rounded-lg border">
            {whiskies.map((whisky) => (
              <button
                key={whisky.alcoholId}
                type="button"
                onClick={() => onSelect(toSearchedWhisky(whisky))}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-muted"
              >
                <MfdsWhiskyThumbnail imageUrl={whisky.imageUrl} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{whisky.korName}</p>
                  <p title={whisky.engName} className="truncate text-xs text-muted-foreground">
                    {[
                      whisky.engName,
                      whisky.korCategoryName,
                      whisky.korDistillery ?? whisky.korRegion,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
        {lookupQuery.hasNextPage && (
          <div className="mt-3 flex justify-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => lookupQuery.fetchNextPage()}
              disabled={lookupQuery.isFetchingNextPage}
            >
              {lookupQuery.isFetchingNextPage ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  불러오는 중...
                </>
              ) : (
                '더 보기'
              )}
            </Button>
          </div>
        )}
      </div>
    </>
  );
}

/** 작업 창의 기본 화면이다. 고른 위스키는 화면이 바뀌어도 유지되도록 작업 창이 가진다. */
export function MfdsWhiskyMatchingPanel({
  declarationId,
  selectedAlcoholId,
  selectedWhisky,
  onSelectWhisky,
  onOpenBulk,
  onDone,
}: {
  declarationId: number;
  selectedAlcoholId: number | null;
  selectedWhisky: PendingWhisky | null;
  onSelectWhisky: (whisky: PendingWhisky | null) => void;
  onOpenBulk: () => void;
  onDone: () => void;
}) {
  const [isReleaseDialogOpen, setIsReleaseDialogOpen] = useState(false);
  const candidatesQuery = useMfdsMatchingCandidates(declarationId);
  const currentWhiskyQuery = useAdminAlcoholDetail(selectedAlcoholId ?? undefined);
  const { runMatching, confirmMatching, releaseMatching } = useMfdsMatchingActions(declarationId);
  const candidates = candidatesQuery.data?.alcoholCandidates ?? [];
  const isPending = runMatching.isPending || confirmMatching.isPending || releaseMatching.isPending;

  const handleConfirm = () => {
    if (!selectedWhisky || selectedWhisky.alcoholId === selectedAlcoholId) return;

    confirmMatching.mutate({ alcoholId: selectedWhisky.alcoholId }, { onSuccess: onDone });
  };

  const handleRelease = () => {
    releaseMatching.mutate(undefined, {
      onSuccess: () => {
        onSelectWhisky(null);
        setIsReleaseDialogOpen(false);
      },
    });
  };

  return (
    <>
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4">
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">현재 연결</h3>
          {selectedAlcoholId ? (
            currentWhiskyQuery.isLoading ? (
              <div className="flex items-center gap-2 rounded-lg border p-4 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                연결된 위스키 정보를 불러오는 중입니다.
              </div>
            ) : currentWhiskyQuery.isError || !currentWhiskyQuery.data ? (
              <div className="space-y-2 rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">
                  연결된 위스키 정보를 불러오지 못했습니다.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => currentWhiskyQuery.refetch()}
                >
                  다시 시도
                </Button>
              </div>
            ) : (
              <CurrentWhiskyCard
                whisky={{
                  alcoholId: currentWhiskyQuery.data.alcoholId,
                  korName: currentWhiskyQuery.data.korName,
                  engName: currentWhiskyQuery.data.engName,
                  imageUrl: currentWhiskyQuery.data.imageUrl,
                }}
                footerAction={
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setIsReleaseDialogOpen(true)}
                    disabled={isPending}
                  >
                    <X className="mr-1.5 h-4 w-4" />
                    연결 해제
                  </Button>
                }
              />
            )
          ) : (
            <p className="text-sm text-muted-foreground">연결된 위스키 없음</p>
          )}
        </section>

        <section className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-sm font-semibold">연결 후보</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                onSelectWhisky(null);
                runMatching.mutate();
              }}
              disabled={isPending}
            >
              <RotateCw className="mr-1.5 h-3.5 w-3.5" />
              {runMatching.isPending ? '계산 중...' : '후보 다시 계산'}
            </Button>
          </div>

          {candidatesQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">저장된 연결 후보를 불러오는 중입니다.</p>
          ) : candidatesQuery.isError ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                저장된 연결 후보를 불러오지 못했습니다.
              </p>
              <Button variant="outline" size="sm" onClick={() => candidatesQuery.refetch()}>
                다시 시도
              </Button>
            </div>
          ) : candidates.length > 0 ? (
            <div className="space-y-2">
              {candidates.map((candidate) => {
                const candidateWhisky = toCandidateWhisky(candidate);
                const isSelected = selectedWhisky?.alcoholId === candidate.alcoholId;
                const name = candidateWhisky.korName;

                return (
                  <div
                    key={candidate.alcoholId}
                    className={`rounded-lg border ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/50 shadow-[0_0_12px_rgba(59,130,246,0.12)] ring-2 ring-blue-400/30'
                        : ''
                    }`}
                  >
                    <button
                      type="button"
                      aria-pressed={isSelected}
                      aria-label={`${name} ${isSelected ? '선택 해제' : '선택'}`}
                      onClick={() => onSelectWhisky(isSelected ? null : candidateWhisky)}
                      disabled={isPending}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <MfdsWhiskyThumbnail imageUrl={candidateWhisky.imageUrl} />
                      <span className="min-w-0 flex-1">
                        <span title={name} className="block truncate text-sm font-medium">
                          {name}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          점수 {candidate.score.toFixed(3)}
                        </span>
                      </span>
                      <CheckCircle2
                        className={
                          isSelected
                            ? 'h-4 w-4 shrink-0 text-blue-600'
                            : 'h-4 w-4 shrink-0 text-muted-foreground'
                        }
                        aria-hidden="true"
                      />
                    </button>
                    <div className="border-t px-3 py-1">
                      <Link
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        to={`/whisky/${candidate.alcoholId}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        상세 보기
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">저장된 연결 후보 없음</p>
          )}
        </section>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t px-5 py-3">
        <p className="text-xs text-muted-foreground">
          {selectedWhisky
            ? `선택한 위스키: ${selectedWhisky.korName} · ID ${selectedWhisky.alcoholId}`
            : '후보, 직접 검색, 추천에서 위스키를 고르세요.'}
        </p>
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!selectedWhisky || isPending}
            onClick={onOpenBulk}
          >
            같은 제품 전체 연결
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleConfirm}
            disabled={
              !selectedWhisky || selectedWhisky.alcoholId === selectedAlcoholId || isPending
            }
          >
            {confirmMatching.isPending ? '확정 중...' : '선택한 연결 확정'}
          </Button>
        </div>
      </div>

      <AlertDialog open={isReleaseDialogOpen} onOpenChange={setIsReleaseDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>연결을 해제할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              확정된 위스키·증류소·지역 연결이 함께 해제됩니다. 저장된 후보와 매칭 이력은
              유지됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={releaseMatching.isPending}>취소</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              onClick={handleRelease}
              disabled={releaseMatching.isPending}
            >
              {releaseMatching.isPending ? '해제 중...' : '연결 해제'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
