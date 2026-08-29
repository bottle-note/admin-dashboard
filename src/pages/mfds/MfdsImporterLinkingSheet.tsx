import { useState, type ReactNode } from 'react';
import { Loader2, Search, X } from 'lucide-react';

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
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useMfdsImporterLinkActions } from '@/hooks/useMfdsDeclarations';
import {
  flattenMfdsImporterPages,
  useMfdsImporterLookupInfinite,
} from '@/hooks/useMfdsImporters';
import type { MfdsImporterItem } from '@/types/api';

interface MfdsImporterLinkingSheetProps {
  declarationId: number;
  declarationName: string;
  rcno: string;
  importer: MfdsImporterItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function ImporterCard({
  label,
  importer,
  action,
  footerAction,
}: {
  label?: string;
  importer: MfdsImporterItem;
  action?: ReactNode;
  footerAction?: ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-background">
      <div className="flex items-center gap-3 p-3">
        <div className="min-w-0 flex-1">
          {label && <p className="text-xs font-medium text-muted-foreground">{label}</p>}
          <p className={label ? 'mt-0.5 truncate font-semibold' : 'truncate font-semibold'}>
            {importer.businessName}
          </p>
          <p className="mt-1 truncate text-sm text-muted-foreground">
            인허가 {importer.licenseNo} · 업소 코드 {importer.officialBusinessCode}
          </p>
        </div>
        {action}
      </div>
      {footerAction && (
        <div className="flex justify-end border-t px-3 py-2">{footerAction}</div>
      )}
    </div>
  );
}

function ImporterLookupDialog({
  open,
  disabled,
  onOpenChange,
  onSelect,
}: {
  open: boolean;
  disabled: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (importer: MfdsImporterItem) => void;
}) {
  const [keyword, setKeyword] = useState('');
  const debouncedKeyword = useDebouncedValue(keyword.trim(), 300);
  const importerQuery = useMfdsImporterLookupInfinite(
    { keyword: debouncedKeyword || undefined, pageSize: 20 },
    { enabled: open }
  );
  const importers = flattenMfdsImporterPages(importerQuery.data);

  const handleSelect = (importer: MfdsImporterItem) => {
    onSelect(importer);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[80vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="border-b px-6 py-5 pr-12">
          <DialogTitle>연결할 수입사 찾기</DialogTitle>
          <DialogDescription>선택 후 드로어에서 연결을 확정합니다.</DialogDescription>
        </DialogHeader>

        <div className="border-b px-6 py-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="수입사명, 인허가 번호, 업소 코드로 검색"
              aria-label="수입사 검색"
              className="pl-9"
              disabled={disabled}
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          <p className="mb-3 text-sm font-medium">수입사 목록</p>

          {importerQuery.isLoading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              수입사 목록을 불러오는 중입니다.
            </div>
          ) : importerQuery.isError ? (
            <div className="space-y-3 py-6 text-center">
              <p className="text-sm text-muted-foreground">수입사 목록을 불러오지 못했습니다.</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => importerQuery.refetch()}
              >
                다시 시도
              </Button>
            </div>
          ) : importers.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">검색 결과가 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {importers.map((importer) => (
                <button
                  key={importer.id}
                  type="button"
                  onClick={() => handleSelect(importer)}
                  disabled={disabled}
                  className="w-full rounded-lg border p-3 text-left transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <p className="truncate font-medium">{importer.businessName}</p>
                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    인허가 {importer.licenseNo} · 업소 코드 {importer.officialBusinessCode}
                  </p>
                </button>
              ))}
            </div>
          )}

          {importerQuery.hasNextPage && (
            <div className="mt-4 flex justify-center">
              <Button
                type="button"
                variant="outline"
                onClick={() => importerQuery.fetchNextPage()}
                disabled={importerQuery.isFetchingNextPage || disabled}
              >
                {importerQuery.isFetchingNextPage ? (
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

export function MfdsImporterLinkingSheet({
  declarationId,
  declarationName,
  rcno,
  importer,
  open,
  onOpenChange,
}: MfdsImporterLinkingSheetProps) {
  const [selectedImporter, setSelectedImporter] = useState<MfdsImporterItem | null>(null);
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  const [isUnlinkDialogOpen, setIsUnlinkDialogOpen] = useState(false);
  const { linkImporter, unlinkImporter } = useMfdsImporterLinkActions(declarationId);
  const isPending = linkImporter.isPending || unlinkImporter.isPending;

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setSelectedImporter(null);
      setIsSearchDialogOpen(false);
      setIsUnlinkDialogOpen(false);
    }
    onOpenChange(nextOpen);
  };

  const handleConfirm = () => {
    if (!selectedImporter) return;

    linkImporter.mutate(
      { importerId: selectedImporter.id },
      { onSuccess: () => handleOpenChange(false) }
    );
  };

  const handleUnlink = () => {
    unlinkImporter.mutate(undefined, {
      onSuccess: () => {
        setSelectedImporter(null);
        setIsUnlinkDialogOpen(false);
      },
    });
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="flex w-full flex-col p-0 sm:max-w-xl">
        <SheetHeader className="border-b px-6 py-5 pr-12">
          <SheetTitle>{declarationName} · 수입사 연결</SheetTitle>
          <SheetDescription>RCNO {rcno}</SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 space-y-8 overflow-y-auto px-6 py-5">
          <section className="space-y-3">
            <h3 className="font-semibold">현재 연결</h3>
            {importer ? (
              <>
                <ImporterCard
                  importer={importer}
                  footerAction={
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setIsUnlinkDialogOpen(true)}
                      disabled={isPending}
                    >
                      <X className="mr-1.5 h-4 w-4" />
                      연결 해제
                    </Button>
                  }
                />
                <p className="text-sm text-muted-foreground">
                  다른 수입사를 연결하려면 현재 연결을 먼저 해제하세요.
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">연결된 수입사 없음</p>
            )}
          </section>

          {!importer && (
            <section className="space-y-3">
              <h3 className="font-semibold">수입사 선택</h3>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsSearchDialogOpen(true)}
                disabled={isPending}
              >
                수입사 찾기
              </Button>
            </section>
          )}
        </div>

        {!importer && (
          <SheetFooter className="flex-col gap-3 border-t px-6 py-5 sm:flex-col">
            {selectedImporter ? (
              <ImporterCard
                label="연결할 수입사"
                importer={selectedImporter}
                action={
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedImporter(null)}
                    disabled={isPending}
                  >
                    <X className="mr-1.5 h-4 w-4" />
                    선택 해제
                  </Button>
                }
              />
            ) : (
              <p className="text-sm text-muted-foreground">연결할 수입사를 선택하세요.</p>
            )}
            <Button type="button" onClick={handleConfirm} disabled={!selectedImporter || isPending}>
              {linkImporter.isPending ? '연결 중...' : '선택한 수입사 연결'}
            </Button>
          </SheetFooter>
        )}

        <AlertDialog open={isUnlinkDialogOpen} onOpenChange={setIsUnlinkDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>수입사 연결을 해제할까요?</AlertDialogTitle>
              <AlertDialogDescription>
                이 신고의 수입사 연결만 해제됩니다. 수입신고번호(RCNO) 원장은 유지됩니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={unlinkImporter.isPending}>취소</AlertDialogCancel>
              <Button
                type="button"
                variant="destructive"
                onClick={handleUnlink}
                disabled={unlinkImporter.isPending}
              >
                {unlinkImporter.isPending ? '해제 중...' : '연결 해제'}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SheetContent>

      <ImporterLookupDialog
        open={isSearchDialogOpen}
        disabled={isPending}
        onOpenChange={setIsSearchDialogOpen}
        onSelect={setSelectedImporter}
      />
    </Sheet>
  );
}
