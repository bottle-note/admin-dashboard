/**
 * URL 쿼리를 화면 상태로 쓰는 페이지용 훅.
 * update에 null이나 빈 문자열을 주면 그 키를 지운다.
 */

import { useCallback } from 'react';
import { useSearchParams } from 'react-router';

export function useUrlParams() {
  const [params, setParams] = useSearchParams();

  const update = useCallback(
    (updates: Record<string, string | null | undefined>) => {
      const next = new URLSearchParams(params);
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === undefined || value === '') next.delete(key);
        else next.set(key, value);
      });
      setParams(next);
    },
    [params, setParams]
  );

  return { params, update };
}
