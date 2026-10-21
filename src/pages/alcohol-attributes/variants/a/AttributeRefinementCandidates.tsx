import { useState } from 'react';
import { useAttributeFacets } from '@/hooks/useAlcoholAttributes';
import { Button } from '@/components/ui/button';
import type {
  AlcoholCompoundSearchParams,
  AttributeSearchCondition,
  AttributeSearchOperator,
} from '@/types/api/alcohol-attribute.api';
import { displayValue } from './attribute-model';
import { allowedOperators, requiresSearchValue, searchOperators } from './attribute-search';

export function AttributeRefinementCandidates({
  search,
  onAdd,
  disabled,
}: {
  search: AlcoholCompoundSearchParams;
  onAdd: (conditions: AttributeSearchCondition[]) => void;
  disabled: boolean;
}) {
  const [page, setPage] = useState(0);
  const [operators, setOperators] = useState<Record<string, AttributeSearchOperator>>({});
  const facets = useAttributeFacets({ ...search, page, size: 20 });
  return (
    <section aria-label="함께 가진 속성으로 좁히기" className="mt-4 border-t pt-4">
      <h3 className="text-sm font-semibold text-slate-800">함께 가진 속성으로 좁히기</h3>
      <p className="mb-3 mt-1 text-xs leading-5 text-slate-500">
        전체 검색 결과에서 찾은 후보입니다. 연산자를 고른 뒤 값을 눌러 조건을 추가하세요.
      </p>
      {facets.isFetching && (
        <p role="status" className="text-xs text-slate-500">
          전체 결과에서 후보를 집계하고 있습니다.
        </p>
      )}
      {facets.error && (
        <div role="alert" className="space-y-2 text-xs text-amber-800">
          <p>후보 집계를 불러오지 못했습니다. 그래프 노드나 검색 조건으로 계속 좁힐 수 있습니다.</p>
          <Button size="sm" variant="outline" onClick={() => void facets.refetch()}>
            후보 다시 조회
          </Button>
        </div>
      )}
      {!facets.error && !facets.isFetching && facets.data?.items.length === 0 && (
        <p className="text-xs text-slate-500">
          추가할 속성 값이 없습니다. 조건을 제거하거나 한 단계 되돌려 보세요.
        </p>
      )}
      <div className="max-h-72 space-y-1 overflow-y-auto" aria-busy={facets.isFetching}>
        {!facets.error &&
          facets.data?.items.map((item) => {
            const attribute = {
              ...item.attribute,
              unit: item.attribute.unit ?? '',
              description: item.attribute.description ?? '',
            };
            const value = displayValue(attribute, item.value);
            const candidateId = JSON.stringify([attribute.id, item.value]);
            const operator = operators[candidateId] ?? 'EQ';
            const condition: AttributeSearchCondition = {
              key: attribute.key,
              operator,
              ...(requiresSearchValue(operator) ? { value: item.value } : {}),
            };
            const selected = search.conditions.some(
              (c) =>
                c.key === condition.key && c.operator === operator && c.value === condition.value
            );
            return (
              <div key={candidateId} className="rounded-lg border border-slate-100 bg-slate-50 p-2">
                <select
                  aria-label={`${attribute.displayName} · ${value} 연산자`}
                  value={operator}
                  disabled={disabled || facets.isFetching}
                  onChange={(event) =>
                    setOperators((previous) => ({
                      ...previous,
                      [candidateId]: event.target.value as AttributeSearchOperator,
                    }))
                  }
                  className="mb-1 h-8 w-full rounded border bg-white px-2 text-xs"
                >
                  {allowedOperators(attribute.datatype).map((option) => (
                    <option key={option} value={option}>
                      {searchOperators[option]}
                    </option>
                  ))}
                </select>
                <button
                  aria-label={
                    operator === 'EQ'
                      ? `${attribute.displayName} · ${value} · ${item.alcoholCount}개로 좁히기`
                      : `${attribute.displayName} ${searchOperators[operator]}${requiresSearchValue(operator) ? ` ${value}` : ''} 조건 추가`
                  }
                  disabled={
                    disabled ||
                    facets.isFetching ||
                    selected ||
                    (operator === 'EQ' && item.alcoholCount === 0)
                  }
                  onClick={() => onAdd([condition])}
                  className="flex w-full items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-left text-xs hover:border-teal-300 hover:bg-teal-50 disabled:opacity-45"
                >
                  <span className="min-w-0">
                    <span className="block break-words text-slate-500">
                      {attribute.displayName}
                    </span>
                    <span className="mt-1 block break-all font-medium text-slate-800">{value}</span>
                  </span>
                  <span className="shrink-0 text-teal-800">
                    {selected
                      ? '적용됨'
                      : operator === 'EQ'
                        ? `${item.alcoholCount}개`
                        : '조건 추가'}
                  </span>
                </button>
                {operator !== 'EQ' && (
                  <p className="mt-1 text-[11px] text-slate-500">
                    이 값과 같음: {item.alcoholCount}개
                  </p>
                )}
              </div>
            );
          })}
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 text-xs">
        <Button
          size="sm"
          variant="ghost"
          disabled={page === 0 || facets.isFetching}
          onClick={() => setPage((p) => p - 1)}
        >
          후보 이전
        </Button>
        <span>{page + 1}페이지</span>
        <Button
          size="sm"
          variant="ghost"
          disabled={!facets.data?.hasNext || facets.isFetching || !!facets.error}
          onClick={() => setPage((p) => p + 1)}
        >
          후보 다음
        </Button>
      </div>
    </section>
  );
}
