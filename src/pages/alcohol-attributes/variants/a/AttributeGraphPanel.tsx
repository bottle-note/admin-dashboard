import { useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { useAttributedAlcohols, useCompoundAlcoholSearch } from '@/hooks/useAlcoholAttributes';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { getErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import { AttributeRelationshipGraph } from './AttributeRelationshipGraph';
import { AttributeSearchBuilder } from './AttributeSearchBuilder';
import { readAttributeSearch, type AttributeSearch } from './attribute-search';

export function AttributeGraphPanel() {
  const [params, setParams] = useSearchParams();
  const compound = readAttributeSearch(params, 'graph');
  const advanced = !!compound.error || compound.value.conditions.length > 0;
  const requestedSize = Number(params.get('graphSize'));
  const size = [25, 50, 100].includes(requestedSize) ? requestedSize : 25;
  const input = params.get('graphKeyword') ?? '';
  const keyword = useDebouncedValue(input, 200);
  const rawPage = Number(params.get('graphPage'));
  const page = Number.isSafeInteger(rawPage) && rawPage >= 0 ? rawPage : 0;
  const legacyQuery = useAttributedAlcohols(
    { keyword: keyword || undefined, page, size },
    !advanced
  );
  const compoundQuery = useCompoundAlcoholSearch(
    { keyword: keyword || undefined, ...compound.value, page, size },
    advanced && !compound.error
  );
  const query = advanced ? compoundQuery : legacyQuery;
  const setPage = (next: number) =>
    setParams((previous) => {
      const result = new URLSearchParams(previous);
      result.set('graphPage', String(next));
      return result;
    });
  const applySearch = (search: AttributeSearch) =>
    setParams((previous) => {
      const next = new URLSearchParams(previous);
      if (search.conditions.length) {
        next.set('graphconditions', JSON.stringify(search.conditions));
        next.set('graphmatch', search.match);
      } else {
        next.delete('graphconditions');
        next.delete('graphmatch');
      }
      next.delete('graphPage');
      return next;
    });
  const { alcohols, attributes, mappings } = useMemo(() => {
    const alcohols = (query.data?.items ?? []).map((item) => ({
      id: item.alcoholId,
      name: item.korName,
      english: item.engName ?? '',
      category: item.korCategory ?? '',
      region: '',
      imageUrl: item.imageUrl,
    }));
    const entries = (query.data?.items ?? []).flatMap((item) =>
      item.attributes.map((entry) => ({ ...entry, alcoholId: item.alcoholId }))
    );
    const attributes = [
      ...new Map(
        entries.map((entry) => [
          entry.attribute.id,
          {
            ...entry.attribute,
            unit: entry.attribute.unit ?? '',
            description: entry.attribute.description ?? '',
          },
        ])
      ).values(),
    ];
    const mappings = entries.map((entry) => ({
      id: entry.mappingId,
      alcoholId: entry.alcoholId,
      attributeId: entry.attribute.id,
      value: entry.value,
    }));
    return { alcohols, attributes, mappings };
  }, [query.data]);
  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-500">
        {advanced
          ? '조건에 맞는 위스키와 모든 연결을 표시합니다.'
          : '속성이 연결된 위스키를 표시합니다. 조건 초기화 시 이 범위로 돌아옵니다.'}
      </p>
      {query.error && (
        <div role="alert">
          {getErrorMessage(query.error)}{' '}
          <Button variant="outline" onClick={() => void query.refetch()}>
            그래프 다시 조회
          </Button>
        </div>
      )}
      <AttributeRelationshipGraph
        attributes={attributes}
        alcohols={alcohols}
        mappings={mappings}
        filterControls={
          <AttributeSearchBuilder
            key={JSON.stringify(compound.value)}
            value={compound.value}
            onApply={applySearch}
            error={compound.error}
            label="그래프 속성 조건"
          />
        }
        serverFilter={{
          keyword: input,
          key: '',
          value: '',
          total: query.data?.meta.totalElements,
          loading: query.isFetching,
          onChange: (next) =>
            setParams(
              (previous) => {
                const result = new URLSearchParams(previous);
                if (next.keyword) result.set('graphKeyword', next.keyword);
                else result.delete('graphKeyword');
                result.delete('graphPage');
                return result;
              },
              { replace: true }
            ),
        }}
      />
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <Button
          size="sm"
          variant="outline"
          disabled={page === 0 || query.isFetching}
          onClick={() => setPage(page - 1)}
        >
          그래프 이전
        </Button>
        <span>{page + 1}페이지</span>
        <label className="flex items-center gap-2">
          페이지당 위스키
          <select
            aria-label="그래프 표시 개수"
            className="h-8 rounded border bg-white px-2"
            value={size}
            onChange={(event) =>
              setParams((previous) => {
                const next = new URLSearchParams(previous);
                next.set('graphSize', event.target.value);
                next.delete('graphPage');
                return next;
              })
            }
          >
            {[25, 50, 100].map((count) => (
              <option key={count} value={count}>
                {count}개
              </option>
            ))}
          </select>
        </label>
        <Button
          size="sm"
          variant="outline"
          disabled={!query.data?.meta.hasNext || query.isFetching}
          onClick={() => setPage(page + 1)}
        >
          그래프 다음
        </Button>
      </div>
    </div>
  );
}
