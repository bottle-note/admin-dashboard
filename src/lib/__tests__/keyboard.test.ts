import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { describe, expect, it } from 'vitest';

import { isKeyboardEventComposing, isNonComposingEnterKey } from '../keyboard';

function createKeyboardEvent({
  key = 'Enter',
  keyCode = 13,
  isComposing = false,
}: {
  key?: string;
  keyCode?: number;
  isComposing?: boolean;
}) {
  return {
    key,
    keyCode,
    nativeEvent: { isComposing },
  } as ReactKeyboardEvent<HTMLInputElement>;
}

describe('keyboard utilities', () => {
  it('IME 조합 중인 키보드 이벤트를 판별한다', () => {
    expect(isKeyboardEventComposing(createKeyboardEvent({ isComposing: true }))).toBe(true);
    expect(isKeyboardEventComposing(createKeyboardEvent({ keyCode: 229 }))).toBe(true);
    expect(isKeyboardEventComposing(createKeyboardEvent({}))).toBe(false);
  });

  it('IME 조합 중이 아닌 Enter만 확정 Enter로 판별한다', () => {
    expect(isNonComposingEnterKey(createKeyboardEvent({}))).toBe(true);
    expect(isNonComposingEnterKey(createKeyboardEvent({ key: 'Escape' }))).toBe(false);
    expect(isNonComposingEnterKey(createKeyboardEvent({ isComposing: true }))).toBe(false);
    expect(isNonComposingEnterKey(createKeyboardEvent({ keyCode: 229 }))).toBe(false);
  });
});
