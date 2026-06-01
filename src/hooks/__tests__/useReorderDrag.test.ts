import { describe, it, expect, vi } from 'vitest';
import { act } from '@testing-library/react';
import { renderHook } from '@/test/test-utils';
import { useReorderDrag } from '../useReorderDrag';

// 최소 DragEvent 모의 객체
const makeDragEvent = () =>
  ({
    dataTransfer: { effectAllowed: '' },
    preventDefault: vi.fn(),
  }) as unknown as React.DragEvent;

interface TestItem {
  id: number;
}

const ITEMS: TestItem[] = [{ id: 1 }, { id: 2 }, { id: 3 }];

function makeDefaultHook(
  overrides: {
    onReorder?: ReturnType<typeof vi.fn>;
    onReorderFailure?: ReturnType<typeof vi.fn>;
  } = {}
) {
  const onReorder = overrides.onReorder ?? vi.fn().mockResolvedValue(undefined);
  const onReorderFailure = overrides.onReorderFailure ?? vi.fn().mockResolvedValue(undefined);

  const hook = renderHook(() =>
    useReorderDrag<TestItem>({
      onReorder: onReorder as (orderedIds: number[]) => Promise<unknown>,
      onReorderFailure: onReorderFailure as () => Promise<unknown>,
    })
  );

  return { ...hook, onReorder, onReorderFailure };
}

describe('useReorderDrag', () => {
  // ==========================================
  // 초기 상태
  // ==========================================
  describe('초기 상태', () => {
    it('isReorderMode가 false로 시작한다', () => {
      const { result } = makeDefaultHook();
      expect(result.current.isReorderMode).toBe(false);
    });

    it('isReordering이 false로 시작한다', () => {
      const { result } = makeDefaultHook();
      expect(result.current.isReordering).toBe(false);
    });

    it('dragOverId가 null로 시작한다', () => {
      const { result } = makeDefaultHook();
      expect(result.current.dragOverId).toBeNull();
    });

    it('localItems가 빈 배열로 시작한다', () => {
      const { result } = makeDefaultHook();
      expect(result.current.localItems).toEqual([]);
    });
  });

  // ==========================================
  // enterReorderMode / cancelReorder
  // ==========================================
  describe('enterReorderMode', () => {
    it('순서 변경 모드를 활성화하고 localItems를 설정한다', () => {
      const { result } = makeDefaultHook();

      act(() => result.current.enterReorderMode(ITEMS));

      expect(result.current.isReorderMode).toBe(true);
      expect(result.current.localItems.map((i) => i.id)).toEqual([1, 2, 3]);
    });
  });

  describe('cancelReorder', () => {
    it('원래 순서로 복원하고 모드를 종료한다', () => {
      const { result, onReorder } = makeDefaultHook();

      act(() => result.current.enterReorderMode(ITEMS));
      // 드래그로 순서 변경 (id=1 → id=3 위치)
      act(() => result.current.getDragHandlers(ITEMS[0]!).onDragStart(makeDragEvent()));
      act(() => result.current.getDragHandlers(ITEMS[2]!).onDrop(makeDragEvent()));
      expect(result.current.localItems.map((i) => i.id)).toEqual([2, 3, 1]);

      act(() => result.current.cancelReorder());

      expect(result.current.isReorderMode).toBe(false);
      expect(result.current.localItems.map((i) => i.id)).toEqual([1, 2, 3]);
      expect(onReorder).not.toHaveBeenCalled();
    });
  });

  // ==========================================
  // getDragHandlers
  // ==========================================
  describe('getDragHandlers', () => {
    it('isReorderMode가 false면 draggable이 false다', () => {
      const { result } = makeDefaultHook();
      expect(result.current.getDragHandlers(ITEMS[0]!).draggable).toBe(false);
    });

    it('isReorderMode가 true면 draggable이 true다', () => {
      const { result } = makeDefaultHook();
      act(() => result.current.enterReorderMode(ITEMS));
      expect(result.current.getDragHandlers(ITEMS[0]!).draggable).toBe(true);
    });

    it('onDragOver 호출 시 dragOverId가 해당 아이템 id로 설정된다', () => {
      const { result } = makeDefaultHook();
      act(() => result.current.enterReorderMode(ITEMS));

      act(() => result.current.getDragHandlers(ITEMS[1]!).onDragOver(makeDragEvent()));

      expect(result.current.dragOverId).toBe(ITEMS[1]!.id);
    });

    it('onDragLeave 호출 시 dragOverId가 초기화된다', () => {
      const { result } = makeDefaultHook();
      act(() => result.current.enterReorderMode(ITEMS));
      act(() => result.current.getDragHandlers(ITEMS[0]!).onDragOver(makeDragEvent()));

      act(() => result.current.getDragHandlers(ITEMS[0]!).onDragLeave());

      expect(result.current.dragOverId).toBeNull();
    });

    it('onDragEnd 호출 시 dragOverId가 초기화된다', () => {
      const { result } = makeDefaultHook();
      act(() => result.current.enterReorderMode(ITEMS));
      act(() => result.current.getDragHandlers(ITEMS[0]!).onDragOver(makeDragEvent()));

      act(() => result.current.getDragHandlers(ITEMS[0]!).onDragEnd());

      expect(result.current.dragOverId).toBeNull();
    });
  });

  // ==========================================
  // 드롭 (로컬 재배열만, API 호출 없음)
  // ==========================================
  describe('드롭 (로컬 재배열)', () => {
    it('드롭 시 localItems가 재배열되지만 onReorder는 호출하지 않는다', () => {
      const { result, onReorder } = makeDefaultHook();
      act(() => result.current.enterReorderMode(ITEMS));

      // id=1을 id=3 위치로 드래그
      act(() => result.current.getDragHandlers(ITEMS[0]!).onDragStart(makeDragEvent()));
      act(() => result.current.getDragHandlers(ITEMS[2]!).onDrop(makeDragEvent()));

      expect(result.current.localItems.map((i) => i.id)).toEqual([2, 3, 1]);
      expect(onReorder).not.toHaveBeenCalled();
    });

    it('같은 아이템에 드롭하면 순서가 변하지 않는다', () => {
      const { result } = makeDefaultHook();
      act(() => result.current.enterReorderMode(ITEMS));

      act(() => result.current.getDragHandlers(ITEMS[0]!).onDragStart(makeDragEvent()));
      act(() => result.current.getDragHandlers(ITEMS[0]!).onDrop(makeDragEvent()));

      expect(result.current.localItems.map((i) => i.id)).toEqual([1, 2, 3]);
    });

    it('isReorderMode가 false일 때 onDragOver를 호출해도 dragOverId가 변하지 않는다', () => {
      const { result } = makeDefaultHook();

      act(() => result.current.getDragHandlers(ITEMS[0]!).onDragOver(makeDragEvent()));

      expect(result.current.dragOverId).toBeNull();
    });
  });

  // ==========================================
  // saveReorder 성공
  // ==========================================
  describe('saveReorder 성공', () => {
    it('재배열된 전체 ID 배열로 onReorder를 1회 호출한다', async () => {
      const { result, onReorder } = makeDefaultHook();
      act(() => result.current.enterReorderMode(ITEMS));
      act(() => result.current.getDragHandlers(ITEMS[0]!).onDragStart(makeDragEvent()));
      act(() => result.current.getDragHandlers(ITEMS[2]!).onDrop(makeDragEvent()));

      await act(async () => {
        await result.current.saveReorder();
      });

      expect(onReorder).toHaveBeenCalledTimes(1);
      expect(onReorder).toHaveBeenCalledWith([2, 3, 1]);
    });

    it('저장 성공 후 실패 복구 콜백 없이 모드를 종료한다', async () => {
      const { result, onReorderFailure } = makeDefaultHook();
      act(() => result.current.enterReorderMode(ITEMS));

      await act(async () => {
        await result.current.saveReorder();
      });

      expect(onReorderFailure).not.toHaveBeenCalled();
      expect(result.current.isReorderMode).toBe(false);
      expect(result.current.isReordering).toBe(false);
    });
  });

  // ==========================================
  // saveReorder 실패 → 롤백
  // ==========================================
  describe('saveReorder 실패 시 롤백', () => {
    it('onReorder 실패 시 원래 순서로 롤백하고 onReorderFailure를 호출한다', async () => {
      const onReorder = vi.fn().mockRejectedValue(new Error('API 실패'));
      const { result, onReorderFailure } = makeDefaultHook({ onReorder });

      act(() => result.current.enterReorderMode(ITEMS));
      act(() => result.current.getDragHandlers(ITEMS[0]!).onDragStart(makeDragEvent()));
      act(() => result.current.getDragHandlers(ITEMS[2]!).onDrop(makeDragEvent()));
      expect(result.current.localItems.map((i) => i.id)).toEqual([2, 3, 1]);

      await act(async () => {
        await result.current.saveReorder();
      });

      expect(result.current.localItems.map((i) => i.id)).toEqual([1, 2, 3]);
      expect(onReorderFailure).toHaveBeenCalledTimes(1);
      expect(result.current.isReordering).toBe(false);
    });
  });
});
