import { AttributeRefinementCandidates } from './AttributeRefinementCandidates';
import { displayValue } from './attribute-model';
import { searchOperators } from './attribute-search';
import type { AttributeSearchCondition } from '@/types/api/alcohol-attribute.api';
import { useAttributeDefinitions } from '@/hooks/useAlcoholAttributes';
import { AttributeGroupFilter } from './AttributeGroupFilter';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useAttributedAlcohols, useCompoundAlcoholSearch } from '@/hooks/useAlcoholAttributes';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { getErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import { AttributeRelationshipGraph } from './AttributeRelationshipGraph';
import { AttributeSearchBuilder } from './AttributeSearchBuilder';
import { readAttributeSearch, readGroupIds, type AttributeSearch } from './attribute-search';

export function AttributeGraphPanel() {
  const [params, setParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const groupIds = readGroupIds(params, 'graph');
  const compound = readAttributeSearch(params, 'graph');
  const definitions = useAttributeDefinitions();
  const [history, setHistory] = useState<
    { before: AttributeSearch; after: string; scope: string }[]
  >([]);
  const scope = JSON.stringify([readGroupIds(params, 'graph'), params.get('graphKeyword') ?? '']);
  const last = history[history.length - 1];
  const canUndo = last?.scope === scope && last.after === JSON.stringify(compound.value);
  const advanced = !!compound.error || compound.value.conditions.length > 0;
  const requestedSize = Number(params.get('graphSize'));
  const size = [25, 50, 100].includes(requestedSize) ? requestedSize : 25;
  const input = params.get('graphKeyword') ?? '';
  const keyword = useDebouncedValue(input, 200);
  const rawPage = Number(params.get('graphPage'));
  const page = Number.isSafeInteger(rawPage) && rawPage >= 0 ? rawPage : 0;
  const legacyQuery = useAttributedAlcohols(
    { keyword: keyword || undefined, groupIds: groupIds.length ? groupIds : undefined, page, size },
    !advanced
  );
  const compoundQuery = useCompoundAlcoholSearch(
    {
      keyword: keyword || undefined,
      groupIds: groupIds.length ? groupIds : undefined,
      ...compound.value,
      linkedOnly: true,
      page,
      size,
    },
    advanced && !compound.error
  );
  const query = advanced ? compoundQuery : legacyQuery;
  const setPage = (next: number) =>
    setParams((previous) => {
      const result = new URLSearchParams(previous);
      result.set('graphPage', String(next));
      return result;
    });
  const writeSearch = (search: AttributeSearch) =>
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
  const applySearch = (search: AttributeSearch) => {
    if (!compound.error && JSON.stringify(search) === JSON.stringify(compound.value)) return;
    setHistory((previous) => [
      ...(canUndo ? previous : []),
      { before: compound.value, after: JSON.stringify(search), scope },
    ]);
    writeSearch(search);
  };
  const addConditions = (conditions: AttributeSearchCondition[]) => {
    if (compound.error || compound.value.match !== 'AND' || query.isFetching) return;
    const additions = conditions.filter(
      (c) =>
        !compound.value.conditions.some(
          (existing) => JSON.stringify(existing) === JSON.stringify(c)
        )
    );
    if (compound.value.conditions.length + additions.length > 20) return;
    applySearch({ match: 'AND', conditions: [...compound.value.conditions, ...additions] });
  };
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
        onNarrow={(attribute, value) =>
          addConditions([{ key: attribute.key, operator: 'EQ', value }])
        }
        narrowDisabled={
          !!compound.error ||
          compound.value.match !== 'AND' ||
          compound.value.conditions.length >= 20 ||
          query.isFetching
        }
        isNarrowed={(key, value) =>
          compound.value.conditions.some(
            (c) => c.key === key && c.operator === 'EQ' && c.value === value
          )
        }
        refinementControls={
          advanced && !compound.error && compound.value.match === 'AND' ? (
            <AttributeRefinementCandidates
              key={JSON.stringify([compound.value, keyword, groupIds])}
              search={{
                ...compound.value,
                keyword: keyword || undefined,
                groupIds,
                linkedOnly: true,
              }}
              onAdd={addConditions}
              disabled={query.isFetching || compound.value.conditions.length >= 20}
            />
          ) : undefined
        }
        filterControls={
          <div className="space-y-2">
            <div
              className="space-y-2 rounded-md bg-teal-50/50 px-2 py-1"
              aria-label="그래프 탐색 조건"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold text-teal-900">
                  {compound.value.match === 'AND'
                    ? '모두 만족하는 위스키'
                    : '하나라도 만족하는 위스키'}{' '}
                  · {query.isFetching ? '조회 중' : `${query.data?.meta.totalElements ?? 0}개`}
                </p>
                <div className="ml-auto flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    aria-expanded={filtersOpen || !!compound.error}
                    aria-controls="graph-filter-editor"
                    onClick={() => setFiltersOpen(!filtersOpen)}
                  >
                    {filtersOpen ? '필터 접기' : '필터 편집'} · 그룹 {groupIds.length || '전체'} ·
                    조건 {compound.value.conditions.length}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={!canUndo || query.isFetching}
                    onClick={() => {
                      if (canUndo && last) {
                        writeSearch(last.before);
                        setHistory((previous) => previous.slice(0, -1));
                      }
                    }}
                  >
                    한 단계 되돌리기
                  </Button>
                </div>
              </div>
              <div className="flex max-h-16 flex-wrap gap-1 overflow-y-auto">
                {compound.value.conditions.map((condition, index) => {
                  const attribute = definitions.data?.find((a) => a.key === condition.key);
                  const label = `${attribute?.displayName ?? condition.key} ${condition.operator === 'EQ' ? '=' : searchOperators[condition.operator]}${condition.value === undefined ? '' : ` ${attribute ? displayValue({ ...attribute, unit: attribute.unit ?? '', description: attribute.description ?? '' }, condition.value) : condition.value}`}`;
                  return (
                    <button
                      key={`${index}-${condition.key}`}
                      aria-label={`${label} 조건 제거`}
                      disabled={query.isFetching}
                      className="max-w-full break-words rounded-full border border-teal-200 bg-white px-3 py-1 text-left text-xs text-teal-900 hover:bg-teal-100 disabled:opacity-50"
                      onClick={() =>
                        applySearch({
                          ...compound.value,
                          conditions: compound.value.conditions.filter((_, i) => i !== index),
                        })
                      }
                    >
                      {label} <span aria-hidden="true">×</span>
                    </button>
                  );
                })}
              </div>
              {(compound.value.match === 'OR' || compound.value.conditions.length >= 20) && (
                <p className="text-xs text-slate-500">
                  {compound.value.match === 'OR'
                    ? '하나씩 좁히려면 아래 조건 조합을 모두 만족으로 변경하세요.'
                    : '조건은 최대 20개입니다. 기존 조건을 제거하면 더 추가할 수 있습니다.'}
                </p>
              )}
            </div>
            <div
              id="graph-filter-editor"
              hidden={!filtersOpen && !compound.error}
              className="max-h-64 space-y-2 overflow-y-auto rounded-md border p-2"
            >
              <AttributeGroupFilter prefix="graph" />
              <AttributeSearchBuilder
                key={JSON.stringify(compound.value)}
                value={compound.value}
                onApply={applySearch}
                error={compound.error}
                label="그래프 속성 조건"
              />
            </div>
          </div>
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
