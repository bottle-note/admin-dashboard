/**
 * 드래그 앤 드롭 순서 변경 훅
 * - 순서 변경 모드 상태 관리
 * - 드래그 상태 관리
 * - 영향 범위 계산, 순차 API 호출, 실패 시 롤백
 *
 * @example
 * const { isReorderMode, isReordering, dragOverId, toggleReorderMode, getDragHandlers } = useReorderDrag({
 *   items: data?.items,
 *   getOrder: (item) => item.sortOrder,
 *   onReorder: (itemId, newOrder) =>
 *     updateSortOrderMutation.mutateAsync({ bannerId: itemId, data: { sortOrder: newOrder } }),
 *   onAfterReorder: refetch,
 *   pageOffset: page * size,
 * });
 */

import { useState } from 'react';

interface ReorderItem {
  id: number;
}

interface UseReorderDragOptions<TItem extends ReorderItem> {
  /** 현재 목록 아이템 */
  items: TItem[] | undefined;
  /** 아이템에서 현재 순서 값을 추출하는 함수 (롤백용) */
  getOrder: (item: TItem) => number;
  /** 단일 아이템 순서 변경 API 호출. 실패 시 롤백에도 사용됨 */
  onReorder: (itemId: number, newOrder: number) => Promise<unknown>;
  /** 순서 변경 완료 후 호출 (주로 refetch) */
  onAfterReorder: () => Promise<unknown>;
  /** 전역 순서 계산 시 더할 페이지 오프셋 (기본값: 0) */
  pageOffset?: number;
}

interface DragHandlers {
  draggable: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => Promise<void>;
  onDragEnd: () => void;
}

export function useReorderDrag<TItem extends ReorderItem>({
  items,
  getOrder,
  onReorder,
  onAfterReorder,
  pageOffset = 0,
}: UseReorderDragOptions<TItem>) {
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [draggedItem, setDraggedItem] = useState<TItem | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);

  const toggleReorderMode = () => {
    setIsReorderMode((prev) => {
      if (prev) {
        setDraggedItem(null);
        setDragOverId(null);
      }
      return !prev;
    });
  };

  const getDragHandlers = (targetItem: TItem): DragHandlers => ({
    draggable: isReorderMode,
    onDragStart: (e) => {
      if (!isReorderMode) return;
      setDraggedItem(targetItem);
      e.dataTransfer.effectAllowed = 'move';
    },
    onDragOver: (e) => {
      if (!isReorderMode) return;
      e.preventDefault();
      setDragOverId(targetItem.id);
    },
    onDragLeave: () => {
      if (!isReorderMode) return;
      setDragOverId(null);
    },
    onDrop: async (e) => {
      if (!isReorderMode || isReordering) return;
      e.preventDefault();
      setDragOverId(null);

      if (!draggedItem || !items || draggedItem.id === targetItem.id) {
        setDraggedItem(null);
        return;
      }

      const currentItems = [...items];
      const draggedIndex = currentItems.findIndex((item) => item.id === draggedItem.id);
      const targetIndex = currentItems.findIndex((item) => item.id === targetItem.id);

      if (draggedIndex === -1 || targetIndex === -1) {
        setDraggedItem(null);
        return;
      }

      // 배열 재정렬
      currentItems.splice(draggedIndex, 1);
      currentItems.splice(targetIndex, 0, draggedItem);

      // 영향받는 범위만 업데이트
      const minIndex = Math.min(draggedIndex, targetIndex);
      const maxIndex = Math.max(draggedIndex, targetIndex);
      const affectedItems = currentItems.slice(minIndex, maxIndex + 1);

      // 롤백용 원본 순서 저장
      const originalOrders = new Map(items.map((item) => [item.id, getOrder(item)]));

      setIsReordering(true);
      try {
        for (let idx = 0; idx < affectedItems.length; idx++) {
          const item = affectedItems[idx]!;
          await onReorder(item.id, pageOffset + minIndex + idx);
        }
        await onAfterReorder();
      } catch {
        // 실패 시 원래 순서로 롤백
        for (const item of affectedItems) {
          const originalOrder = originalOrders.get(item.id);
          if (originalOrder === undefined) continue;
          try {
            await onReorder(item.id, originalOrder);
          } catch {
            // 롤백 중 에러는 무시하고 가능한 한 복구 시도
          }
        }
        await onAfterReorder();
      } finally {
        setIsReordering(false);
        setDraggedItem(null);
      }
    },
    onDragEnd: () => {
      setDraggedItem(null);
      setDragOverId(null);
    },
  });

  return {
    isReorderMode,
    isReordering,
    dragOverId,
    toggleReorderMode,
    getDragHandlers,
  };
}
