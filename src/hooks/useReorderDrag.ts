/**
 * 드래그 앤 드롭 순서 변경 훅 (bulk reorder)
 * - 순서 변경 모드 상태 관리
 * - 로컬 배열에서 드래그 재배열 (낙관적 표시)
 * - 저장 시 재배열된 전체 ID 배열을 bulk 콜백으로 1회 전달
 * - 취소/실패 시 원래 순서로 복원
 *
 * 페이지네이션된 목록은 reorder 모드 진입 전에 전체 항목을 로드한 뒤
 * `enterReorderMode(allItems)`로 전달해야 한다. (bulk API가 ids에 없는
 * 항목을 뒤로 밀어내므로 항상 전체 순서를 보내야 함)
 *
 * @example
 * const reorder = useReorderDrag<BannerListItem>({
 *   onReorder: (ids) => bulkReorderMutation.mutateAsync({ ids }),
 *   onAfterReorder: refetch,
 * });
 * // 전체 항목 로드 완료 후:
 * reorder.enterReorderMode(allItems);
 */

import { useCallback, useState } from 'react';

interface ReorderItem {
  id: number;
}

interface UseReorderDragOptions {
  /** 순서 저장 시 호출. 재배열된 전체 ID 배열(정렬 순서)을 전달 */
  onReorder: (orderedIds: number[]) => Promise<unknown>;
  /** 순서 저장/롤백 후 호출 (주로 refetch) */
  onAfterReorder: () => Promise<unknown>;
}

interface DragHandlers {
  draggable: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
}

export function useReorderDrag<TItem extends ReorderItem>({
  onReorder,
  onAfterReorder,
}: UseReorderDragOptions) {
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [draggedItem, setDraggedItem] = useState<TItem | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);
  const [localItems, setLocalItems] = useState<TItem[]>([]);
  const [originalItems, setOriginalItems] = useState<TItem[]>([]);

  /** 전체 항목을 받아 순서 변경 모드 진입 */
  const enterReorderMode = useCallback((items: TItem[]) => {
    setLocalItems(items);
    setOriginalItems(items);
    setDraggedItem(null);
    setDragOverId(null);
    setIsReorderMode(true);
  }, []);

  /** 변경 취소: 원래 순서로 복원하고 모드 종료 */
  const cancelReorder = () => {
    setLocalItems(originalItems);
    setDraggedItem(null);
    setDragOverId(null);
    setIsReorderMode(false);
  };

  /** 현재 로컬 순서를 저장 (bulk 1회 호출). 성공 시 true 반환 */
  const saveReorder = async (): Promise<boolean> => {
    if (isReordering) return false;

    setIsReordering(true);
    try {
      await onReorder(localItems.map((item) => item.id));
      await onAfterReorder();
      setIsReorderMode(false);
      return true;
    } catch {
      // 실패 시 원래 순서로 롤백 (모드는 유지)
      setLocalItems(originalItems);
      await onAfterReorder();
      return false;
    } finally {
      setIsReordering(false);
      setDraggedItem(null);
      setDragOverId(null);
    }
  };

  const getDragHandlers = (targetItem: TItem): DragHandlers => ({
    draggable: isReorderMode,
    onDragStart: (e) => {
      if (!isReorderMode || isReordering) return;
      setDraggedItem(targetItem);
      e.dataTransfer.effectAllowed = 'move';
    },
    onDragOver: (e) => {
      if (!isReorderMode || isReordering) return;
      e.preventDefault();
      setDragOverId(targetItem.id);
    },
    onDragLeave: () => {
      if (!isReorderMode || isReordering) return;
      setDragOverId(null);
    },
    onDrop: (e) => {
      if (!isReorderMode || isReordering) return;
      e.preventDefault();
      setDragOverId(null);

      if (!draggedItem || draggedItem.id === targetItem.id) {
        setDraggedItem(null);
        return;
      }

      setLocalItems((prev) => {
        const next = [...prev];
        const draggedIndex = next.findIndex((item) => item.id === draggedItem.id);
        const targetIndex = next.findIndex((item) => item.id === targetItem.id);

        if (draggedIndex === -1 || targetIndex === -1) return prev;

        next.splice(draggedIndex, 1);
        next.splice(targetIndex, 0, draggedItem);
        return next;
      });
      setDraggedItem(null);
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
    localItems,
    enterReorderMode,
    cancelReorder,
    saveReorder,
    getDragHandlers,
  };
}
