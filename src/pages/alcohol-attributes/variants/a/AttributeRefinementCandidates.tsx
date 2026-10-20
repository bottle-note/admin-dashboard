import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAttributeDefinitions, useAttributeFacets } from '@/hooks/useAlcoholAttributes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type {
  AlcoholCompoundSearchParams,
  AttributeSearchCondition,
} from '@/types/api/alcohol-attribute.api';
import { displayValue } from './attribute-model';
import { conditionError } from './attribute-search';

const rangeSchema = z.object({
  key: z.string().min(1, '속성을 선택하세요.'),
  operator: z.enum(['EQ', 'GT', 'GTE', 'LT', 'LTE', 'BETWEEN']),
  value: z.string().trim().min(1, '값을 입력하세요.'),
  upper: z.string().trim(),
});
type RangeForm = z.infer<typeof rangeSchema>;

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
  const facets = useAttributeFacets({ ...search, page, size: 20 });
  const definitions = useAttributeDefinitions();
  const form = useForm<RangeForm>({
    resolver: zodResolver(rangeSchema),
    defaultValues: { key: '', operator: 'GTE', value: '', upper: '' },
  });
  const rangeOperator = useWatch({ control: form.control, name: 'operator' });
  const [rangeError, setRangeError] = useState('');
  const numeric =
    definitions.data?.filter((a) => a.datatype === 'INT' || a.datatype === 'DOUBLE') ?? [];
  const submit = form.handleSubmit((data) => {
    const attribute = numeric.find((a) => a.key === data.key);
    const conditions: AttributeSearchCondition[] =
      data.operator === 'BETWEEN'
        ? [
            { key: data.key, operator: 'GTE', value: data.value },
            { key: data.key, operator: 'LTE', value: data.upper },
          ]
        : [{ key: data.key, operator: data.operator, value: data.value }];
    const error = conditions.map((c) => conditionError(c, attribute)).find(Boolean);
    if (error) {
      setRangeError(error);
      return;
    }
    if (data.operator === 'BETWEEN' && Number(data.value) > Number(data.upper)) {
      setRangeError('최솟값은 최댓값보다 클 수 없습니다.');
      return;
    }
    if (search.conditions.length + conditions.length > 20) {
      setRangeError('조건은 최대 20개입니다. 범위는 조건 2개를 사용합니다.');
      return;
    }
    setRangeError('');
    onAdd(conditions);
  });
  return (
    <section aria-label="함께 가진 속성으로 좁히기" className="mt-4 border-t pt-4">
      <h3 className="text-sm font-semibold text-slate-800">함께 가진 속성으로 좁히기</h3>
      <p className="mb-3 mt-1 text-xs leading-5 text-slate-500">
        현재 조건을 모두 만족하는 전체 위스키 기준입니다. 값을 누르면 조건을 추가합니다.
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
            const selected = search.conditions.some(
              (c) => c.key === attribute.key && c.operator === 'EQ' && c.value === item.value
            );
            return (
              <button
                key={JSON.stringify([attribute.id, item.value])}
                aria-label={`${attribute.displayName} · ${value} · ${item.alcoholCount}개로 좁히기`}
                disabled={disabled || facets.isFetching || selected || item.alcoholCount === 0}
                onClick={() => onAdd([{ key: attribute.key, operator: 'EQ', value: item.value }])}
                className="flex w-full items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-left text-xs hover:border-teal-300 hover:bg-teal-50 disabled:opacity-45"
              >
                <span className="min-w-0">
                  <span className="block break-words text-slate-500">{attribute.displayName}</span>
                  <span className="mt-1 block break-all font-medium text-slate-800">{value}</span>
                </span>
                <span className="shrink-0 text-teal-800">
                  {selected ? '적용됨' : `${item.alcoholCount}개`}
                </span>
              </button>
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
      {numeric.length > 0 && (
        <details className="mt-3 border-t pt-3">
          <summary className="cursor-pointer text-xs font-medium">숫자 비교·범위로 좁히기</summary>
          <form onSubmit={submit} className="mt-3 space-y-2">
            <select
              aria-label="범위 속성"
              {...form.register('key')}
              className="h-8 w-full rounded border bg-white px-2 text-xs"
            >
              <option value="">숫자 속성 선택</option>
              {numeric.map((a) => (
                <option key={a.id} value={a.key}>
                  {a.displayName}
                  {a.unit ? ` (${a.unit})` : ''}
                </option>
              ))}
            </select>
            <select
              aria-label="범위 연산자"
              {...form.register('operator')}
              className="h-8 w-full rounded border bg-white px-2 text-xs"
            >
              <option value="EQ">같음</option>
              <option value="GT">초과</option>
              <option value="GTE">이상</option>
              <option value="LT">미만</option>
              <option value="LTE">이하</option>
              <option value="BETWEEN">범위 (양 끝 포함)</option>
            </select>
            <Input
              aria-label="비교 값 또는 최솟값"
              inputMode="decimal"
              {...form.register('value')}
              placeholder="값"
            />
            {rangeOperator === 'BETWEEN' && (
              <Input
                aria-label="최댓값"
                inputMode="decimal"
                {...form.register('upper')}
                placeholder="최댓값"
              />
            )}
            {(rangeError || Object.values(form.formState.errors).length > 0) && (
              <p role="alert" className="text-xs text-red-700">
                {rangeError || Object.values(form.formState.errors)[0]?.message}
              </p>
            )}
            <Button size="sm" className="w-full" disabled={disabled} type="submit">
              숫자 조건으로 좁히기
            </Button>
          </form>
        </details>
      )}
    </section>
  );
}
