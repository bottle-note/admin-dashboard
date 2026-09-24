import type { MfdsBulkMatchingPreviewItem, MfdsBulkMatchingPreviewResponse } from '@/types/api';

export type MfdsBulkChange = 'FILL' | 'OVERWRITE' | 'SAME';

export const MFDS_BULK_CHANGE: Record<MfdsBulkChange, { label: string; className: string }> = {
  FILL: { label: '새로 연결', className: 'border-emerald-300 bg-emerald-50 text-emerald-800' },
  OVERWRITE: { label: '덮어쓰기', className: 'border-red-300 bg-red-50 text-red-800' },
  SAME: { label: '변경 없음', className: 'text-muted-foreground' },
};

export const MFDS_BULK_CHANGE_ORDER: MfdsBulkChange[] = ['FILL', 'OVERWRITE', 'SAME'];

// 증류소·지역은 위스키에 등록된 값을 따라가므로 위스키 연결만 비교한다.
export function mfdsBulkChangeOf(
  item: MfdsBulkMatchingPreviewItem,
  alcoholId: number
): MfdsBulkChange {
  if (item.currentAlcoholId == null) return 'FILL';
  return item.currentAlcoholId === alcoholId ? 'SAME' : 'OVERWRITE';
}

export function mfdsBulkRows(preview: MfdsBulkMatchingPreviewResponse, alcoholId: number) {
  return preview.items
    .map((item) => ({ item, change: mfdsBulkChangeOf(item, alcoholId) }))
    .sort(
      (a, b) => MFDS_BULK_CHANGE_ORDER.indexOf(a.change) - MFDS_BULK_CHANGE_ORDER.indexOf(b.change)
    );
}
