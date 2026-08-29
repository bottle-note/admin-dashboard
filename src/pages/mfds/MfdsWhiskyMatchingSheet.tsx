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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  flattenAdminAlcoholLookupPages,
  useAdminAlcoholDetail,
  useAdminAlcoholLookupInfinite,
} from '@/hooks/useAdminAlcohols';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useMfdsMatchingActions, useMfdsMatchingCandidates } from '@/hooks/useMfdsDeclarations';
import type { AlcoholLookupItem, MfdsAlcoholCandidateItem } from '@/types/api';

interface MfdsWhiskyMatchingSheetProps {
  declarationId: number;
  declarationName: string;
  rcno: string;
  selectedAlcoholId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PendingWhisky {
  alcoholId: number;
  korName: string;
  engName: string;
  imageUrl: string | null;
}

function toCandidateWhisky(candidate: MfdsAlcoholCandidateItem): PendingWhisky {
  return {
    alcoholId: candidate.alcoholId,
    korName: candidate.korName ?? candidate.engName ?? `ID ${candidate.alcoholId}`,
    engName: candidate.engName ?? '',
    imageUrl: candidate.imageUrl,
  };
}

function toManualWhisky(whisky: AlcoholLookupItem): PendingWhisky {
  return {
    alcoholId: whisky.alcoholId,
    korName: whisky.korName,
    engName: whisky.engName,
    imageUrl: whisky.imageUrl,
  };
}

function WhiskySelectionCard({
  label,
  whisky,
  action,
  detailHref,
  footerAction,
}: {
  label: string;
  whisky: PendingWhisky;
  action?: ReactNode;
  detailHref?: string;
  footerAction?: ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-background">
      <div className="flex items-center gap-3 p-3">
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
          {whisky.imageUrl ? (
            <img src={whisky.imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
              No image
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-0.5 truncate font-semibold">{whisky.korName}</p>
          {whisky.engName && (
            <p className="truncate text-sm text-muted-foreground">{whisky.engName}</p>
          )}
        </div>
        {action}
      </div>
      {(detailHref || footerAction) && (
        <div className="flex items-center justify-between gap-3 border-t px-3 py-2">
          {detailHref ? (
            <Link
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              to={detailHref}
              target="_blank"
              rel="noreferrer"
            >
              상세 보기
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <span />
          )}
          {footerAction}
        </div>
      )}
    </div>
  );
}

function WhiskyLookupDialog({
  open,
  disabled,
  onOpenChange,
  onSelect,
}: {
  open: boolean;
  disabled: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (whisky: PendingWhisky) => void;
}) {
  const [keyword, setKeyword] = useState('');
  const debouncedKeyword = useDebouncedValue(keyword.trim(), 300);
  const lookupQuery = useAdminAlcoholLookupInfinite(
    { keyword: debouncedKeyword || undefined, size: 20 },
    { enabled: open }
  );
  const whiskies = flattenAdminAlcoholLookupPages(lookupQuery.data);

  const handleSelect = (whisky: AlcoholLookupItem) => {
    onSelect(toManualWhisky(whisky));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[80vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="border-b px-6 py-5 pr-12">
          <DialogTitle>연결할 보틀노트 위스키 찾기</DialogTitle>
          <DialogDescription>선택 후 드로어에서 연결을 확정합니다.</DialogDescription>
        </DialogHeader>

        <div className="border-b px-6 py-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="위스키 이름, 카테고리, 증류소로 검색"
              aria-label="위스키 검색"
              className="pl-9"
              disabled={disabled}
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          <p className="mb-3 text-sm font-medium">위스키 목록</p>

          {lookupQuery.isLoading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              위스키 목록을 불러오는 중입니다.
            </div>
          ) : lookupQuery.isError ? (
            <div className="space-y-3 py-6 text-center">
              <p className="text-sm text-muted-foreground">위스키 목록을 불러오지 못했습니다.</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => lookupQuery.refetch()}
              >
                다시 시도
              </Button>
            </div>
          ) : whiskies.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">검색 결과가 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {whiskies.map((whisky) => (
                <button
                  key={whisky.alcoholId}
                  type="button"
                  onClick={() => handleSelect(whisky)}
                  disabled={disabled}
                  className="flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <div className="h-11 w-11 shrink-0 overflow-hidden rounded-md bg-muted">
                    {whisky.imageUrl ? (
                      <img src={whisky.imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{whisky.korName}</p>
                    <p className="truncate text-sm text-muted-foreground">{whisky.engName}</p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {[whisky.korCategoryName, whisky.korDistillery ?? whisky.korRegion]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
          {lookupQuery.hasNextPage && (
            <div className="mt-4 flex justify-center">
              <Button
                type="button"
                variant="outline"
                onClick={() => lookupQuery.fetchNextPage()}
                disabled={lookupQuery.isFetchingNextPage || disabled}
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
      </DialogContent>
    </Dialog>
  );
}

export function MfdsWhiskyMatchingSheet({
  declarationId,
  declarationName,
  rcno,
  selectedAlcoholId,
  open,
  onOpenChange,
}: MfdsWhiskyMatchingSheetProps) {
  const [selectedWhisky, setSelectedWhisky] = useState<PendingWhisky | null>(null);
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  const [isReleaseDialogOpen, setIsReleaseDialogOpen] = useState(false);
  const candidatesQuery = useMfdsMatchingCandidates(declarationId);
  const currentWhiskyQuery = useAdminAlcoholDetail(
    open && selectedAlcoholId ? selectedAlcoholId : undefined
  );
  const { runMatching, confirmMatching, releaseMatching } = useMfdsMatchingActions(declarationId);
  const candidates = candidatesQuery.data?.alcoholCandidates ?? [];
  const isPending =
    runMatching.isPending || confirmMatching.isPending || releaseMatching.isPending;

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setSelectedWhisky(null);
      setIsSearchDialogOpen(false);
      setIsReleaseDialogOpen(false);
    }
    onOpenChange(nextOpen);
  };

  const handleConfirm = () => {
    if (!selectedWhisky) return;

    confirmMatching.mutate(
      { alcoholId: selectedWhisky.alcoholId },
      { onSuccess: () => handleOpenChange(false) }
    );
  };

  const handleRelease = () => {
    releaseMatching.mutate(undefined, {
      onSuccess: () => {
        setSelectedWhisky(null);
        setIsReleaseDialogOpen(false);
      },
    });
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="flex w-full flex-col p-0 sm:max-w-xl">
        <SheetHeader className="border-b px-6 py-5 pr-12">
          <SheetTitle>{declarationName} · 보틀노트 위스키 연결</SheetTitle>
          <SheetDescription>RCNO {rcno}</SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 space-y-8 overflow-y-auto px-6 py-5">
          <section className="space-y-3">
            <h3 className="font-semibold">현재 연결</h3>
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
                <WhiskySelectionCard
                  label="현재 연결된 위스키"
                  whisky={{
                    alcoholId: currentWhiskyQuery.data.alcoholId,
                    korName: currentWhiskyQuery.data.korName,
                    engName: currentWhiskyQuery.data.engName,
                    imageUrl: currentWhiskyQuery.data.imageUrl,
                  }}
                  detailHref={`/whisky/${currentWhiskyQuery.data.alcoholId}`}
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
              <h3 className="font-semibold">연결 후보</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedWhisky(null);
                  runMatching.mutate();
                }}
                disabled={isPending}
              >
                <RotateCw className="mr-2 h-4 w-4" />
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
                        isSelected ? 'border-primary ring-2 ring-primary/30' : ''
                      }`}
                    >
                      <button
                        type="button"
                        aria-pressed={isSelected}
                        aria-label={`${name} ${isSelected ? '선택 해제' : '선택'}`}
                        onClick={() => setSelectedWhisky(isSelected ? null : candidateWhisky)}
                        disabled={isPending}
                        className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
                          {candidateWhisky.imageUrl ? (
                            <img
                              src={candidateWhisky.imageUrl}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                              No image
                            </div>
                          )}
                        </div>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">{name}</span>
                          <span className="mt-1 block text-sm text-muted-foreground">
                            점수 {candidate.score.toFixed(3)}
                          </span>
                        </span>
                        <CheckCircle2
                          className={
                            isSelected
                              ? 'h-5 w-5 shrink-0 text-primary'
                              : 'h-5 w-5 shrink-0 text-muted-foreground'
                          }
                          aria-hidden="true"
                        />
                      </button>
                      <div className="border-t px-4 py-2">
                        <Link
                          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
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

            <Button
              type="button"
              variant="outline"
              onClick={() => setIsSearchDialogOpen(true)}
              disabled={isPending}
            >
              위스키 직접 찾기
            </Button>
          </section>
        </div>

        <SheetFooter className="flex-col gap-3 border-t px-6 py-5 sm:flex-col">
          {selectedWhisky ? (
            <WhiskySelectionCard
              label="연결할 위스키"
              whisky={selectedWhisky}
              action={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedWhisky(null)}
                  disabled={isPending}
                >
                  <X className="mr-1.5 h-4 w-4" />
                  선택 해제
                </Button>
              }
            />
          ) : (
            <p className="text-sm text-muted-foreground">확정할 위스키를 선택하세요.</p>
          )}
          <Button type="button" onClick={handleConfirm} disabled={!selectedWhisky || isPending}>
            {confirmMatching.isPending ? '확정 중...' : '선택한 연결 확정'}
          </Button>
        </SheetFooter>

        <AlertDialog open={isReleaseDialogOpen} onOpenChange={setIsReleaseDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>연결을 해제할까요?</AlertDialogTitle>
              <AlertDialogDescription>
                확정된 위스키·증류소·지역 연결이 함께 해제됩니다. 저장된 후보와 매칭
                이력은 유지됩니다.
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
      </SheetContent>

      <WhiskyLookupDialog
        open={isSearchDialogOpen}
        disabled={isPending}
        onOpenChange={setIsSearchDialogOpen}
        onSelect={setSelectedWhisky}
      />
    </Sheet>
  );
}
