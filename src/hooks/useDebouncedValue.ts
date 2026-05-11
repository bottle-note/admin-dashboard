import { useEffect, useState } from 'react';

/**
 * 입력값을 일정 시간 동안 유지된 뒤에만 반영하는 디바운스 훅.
 *
 * 검색 입력 같이 매 키스트로크마다 API를 호출하면 안 되는 곳에서 사용한다.
 *
 * @example
 * ```tsx
 * const [keyword, setKeyword] = useState('');
 * const debouncedKeyword = useDebouncedValue(keyword, 300);
 * useEffect(() => { fetch(debouncedKeyword); }, [debouncedKeyword]);
 * ```
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
