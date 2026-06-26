import type { KeyboardEvent as ReactKeyboardEvent } from 'react';

type ReactKeyboardEventLike = Pick<
  ReactKeyboardEvent<Element>,
  'key' | 'keyCode' | 'nativeEvent'
>;

export function isKeyboardEventComposing(event: ReactKeyboardEventLike) {
  return event.nativeEvent.isComposing || event.keyCode === 229;
}

export function isNonComposingEnterKey(event: ReactKeyboardEventLike) {
  return event.key === 'Enter' && !isKeyboardEventComposing(event);
}
