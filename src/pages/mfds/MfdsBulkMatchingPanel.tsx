import { useState } from 'react';
import { ArrowRight } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useMfdsBulkMatchingConfirm,
  useMfdsBulkMatchingPreview,
} from '@/hooks/useMfdsDeclarations';
import { getErrorMessage } from '@/lib/api-error';
import type { MfdsBulkMatchingPreviewResponse } from '@/types/api';
import { MFDS_BULK_CHANGE, mfdsBulkRows } from './mfds-bulk-matching';

function BulkMatchingTable({
  declarationId,
  alcoholId,
  preview,
  onDone,
}: {
  declarationId: number;
  alcoholId: number;
  preview: MfdsBulkMatchingPreviewResponse;
  onDone: () => void;
}) {
  const confirm = useMfdsBulkMatchingConfirm(declarationId);
  const rows = mfdsBulkRows(preview, alcoholId);
  const changeable = rows.filter((row) => row.change !== 'SAME');
  // 덮어쓰기는 기존 연결을 바꾸므로 관리자가 직접 체크하게 한다.
  const [selected, setSelected] = useState<Set<number>>(
    () => new Set(rows.filter((r) => r.change === 'FILL').map((r) => r.item.declarationId))
  );

  const selectedRows = rows.filter((row) => selected.has(row.item.declarationId));
  const fillCount = selectedRows.filter((row) => row.change === 'FILL').length;
  const overwriteCount = selectedRows.filter((row) => row.change === 'OVERWRITE').length;
  const allChecked =
    changeable.length > 0 && changeable.every((row) => selected.has(row.item.declarationId));

  const toggle = (id: number, checked: boolean) =>
    setSelected((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });

  const apply = () =>
    confirm.mutate(
      {
        alcoholId,
        declarationIds: selectedRows.map((row) => row.item.declarationId).sort((a, b) => a - b),
      },
      { onSuccess: onDone }
    );

  return (
    <>
      <div className="mx-5 my-4 min-h-0 flex-1 overflow-hidden rounded-lg border [&>div]:h-full">
        <Table className="text-xs [&_td]:whitespace-nowrap [&_td]:!py-1.5 [&_td]:px-2 [&_th]:h-8 [&_th]:whitespace-nowrap [&_th]:px-2">
          <TableHeader className="sticky top-0 z-10 bg-background shadow-[inset_0_-1px_0_hsl(var(--border))]">
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  aria-label="변경할 신고 전체 선택"
                  checked={allChecked}
                  disabled={changeable.length === 0}
                  onCheckedChange={(checked) =>
                    setSelected(
                      checked === true
                        ? new Set(changeable.map((row) => row.item.declarationId))
                        : new Set()
                    )
                  }
                />
              </TableHead>
              <TableHead className="w-24">변경</TableHead>
              <TableHead>표시명</TableHead>
              <TableHead>현재 연결</TableHead>
              <TableHead className="text-right">용량</TableHead>
              <TableHead>수입사</TableHead>
              <TableHead>통관일</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(({ item, change }) => {
              const same = change === 'SAME';
              const overwriting = change === 'OVERWRITE' && selected.has(item.declarationId);
              const alcoholChanges =
                item.currentAlcoholId != null && item.currentAlcoholId !== alcoholId;
              return (
                <TableRow
                  key={item.declarationId}
                  className={
                    same ? 'text-muted-foreground' : overwriting ? 'bg-red-50/40' : undefined
                  }
                >
                  <TableCell className="align-top">
                    <Checkbox
                      aria-label={`${item.displayName} (신고 ${item.declarationId}) 선택`}
                      checked={!same && selected.has(item.declarationId)}
                      disabled={same}
                      onCheckedChange={(checked) => toggle(item.declarationId, checked === true)}
                    />
                  </TableCell>
                  <TableCell className="align-top">
                    <Badge
                      variant="outline"
                      className={`px-1.5 py-0 text-[11px] font-medium ${MFDS_BULK_CHANGE[change].className}`}
                    >
                      {MFDS_BULK_CHANGE[change].label}
                    </Badge>
                  </TableCell>
                  <TableCell className="min-w-64 align-top [&]:whitespace-normal">
                    <div className="flex min-w-0 flex-wrap items-baseline gap-x-2">
                      <span className={same ? 'font-medium' : 'font-medium text-foreground'}>
                        {item.displayName}
                      </span>
                      {item.declarationId === declarationId && (
                        <Badge variant="secondary" className="px-1.5 py-0 text-[11px] font-medium">
                          현재 신고
                        </Badge>
                      )}
                    </div>
                    {item.reasons.length > 0 && (
                      <ul className="mt-1 space-y-0.5 whitespace-normal text-xs text-amber-800">
                        {item.reasons.map((reason) => (
                          <li key={reason.code}>· {reason.message}</li>
                        ))}
                      </ul>
                    )}
                  </TableCell>
                  <TableCell className="align-top">
                    {alcoholChanges ? (
                      <span className="inline-flex items-center gap-1">
                        <span className="text-red-700 line-through">
                          위스키 {item.currentAlcoholId}
                        </span>
                        <ArrowRight className="h-3 w-3" aria-hidden="true" />
                        <span>{alcoholId}</span>
                      </span>
                    ) : item.currentAlcoholId != null ? (
                      `위스키 ${item.currentAlcoholId}`
                    ) : (
                      <span className="text-muted-foreground">연결 없음</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right align-top">
                    {item.volumeMl != null ? `${item.volumeMl}ml` : '-'}
                  </TableCell>
                  <TableCell
                    className="max-w-40 truncate align-top"
                    title={item.importerBaseName ?? undefined}
                  >
                    {item.importerBaseName ?? '-'}
                  </TableCell>
                  <TableCell className="align-top">{item.processedDate ?? '-'}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t px-5 py-3">
        <div className="space-y-0.5 text-sm">
          <p className="text-muted-foreground">
            새로 연결 {fillCount}건
            {overwriteCount > 0 && (
              <span className="text-red-700"> · 덮어쓰기 {overwriteCount}건</span>
            )}
          </p>
          {overwriteCount > 0 && (
            <p className="text-xs text-red-700">
              이미 다른 위스키에 연결된 신고를 바꾸며, 일괄로 되돌릴 수 없습니다.
            </p>
          )}
        </div>
        <Button
          size="sm"
          variant={overwriteCount > 0 ? 'destructive' : 'default'}
          disabled={selected.size === 0 || confirm.isPending}
          onClick={apply}
        >
          {confirm.isPending
            ? '적용 중...'
            : overwriteCount > 0
              ? `덮어쓰고 ${selected.size}건 적용`
              : `선택한 ${selected.size}건 적용`}
        </Button>
      </div>
    </>
  );
}

/** 작업 창 안에서 보여 주는 같은 제품 일괄 적용 화면이다. */
export function MfdsBulkMatchingPanel({
  declarationId,
  alcoholId,
  onDone,
}: {
  declarationId: number;
  alcoholId: number;
  onDone: () => void;
}) {
  const previewQuery = useMfdsBulkMatchingPreview(declarationId, alcoholId);

  if (previewQuery.isLoading) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        같은 제품 신고를 불러오는 중입니다.
      </p>
    );
  }
  if (previewQuery.isError || !previewQuery.data) {
    return (
      <div className="space-y-2 py-10 text-center text-sm">
        <p>{getErrorMessage(previewQuery.error)}</p>
        <Button variant="outline" size="sm" onClick={() => previewQuery.refetch()}>
          다시 시도
        </Button>
      </div>
    );
  }
  return (
    <BulkMatchingTable
      key={`${alcoholId}-${previewQuery.dataUpdatedAt}`}
      declarationId={declarationId}
      alcoholId={alcoholId}
      preview={previewQuery.data}
      onDone={onDone}
    />
  );
}
