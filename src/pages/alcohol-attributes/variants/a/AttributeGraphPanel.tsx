import { AttributeConditionTokens } from './AttributeConditionTokens';
import { GraphFilterPopover } from './GraphFilterPopover';
import { GraphConditionForm } from './GraphConditionForm';
import { useAttributeGroups } from '@/hooks/useAlcoholAttributes';
import { AttributeRefinementCandidates } from './AttributeRefinementCandidates';
import type { AttributeSearchCondition } from '@/types/api/alcohol-attribute.api';
import { useAttributeDefinitions } from '@/hooks/useAlcoholAttributes';
import { AttributeGroupFilter } from './AttributeGroupFilter';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useAttributeGraph } from '@/hooks/useAlcoholAttributes';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { getErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import { AttributeRelationshipGraph } from './AttributeRelationshipGraph';
import { AttributeSearchBuilder } from './AttributeSearchBuilder';
import { readAttributeSearch, readGroupIds, type AttributeSearch } from './attribute-search';

export function AttributeGraphPanel() {
  const [params, setParams] = useSearchParams();
  const groupIds = readGroupIds(params, 'graph');
  const compound = readAttributeSearch(params, 'graph');
  const definitions = useAttributeDefinitions();
  const groups = useAttributeGroups();
  const [history, setHistory] = useState<
    { before: AttributeSearch; after: string; scope: string }[]
  >([]);
  const scope = JSON.stringify([readGroupIds(params, 'graph'), params.get('graphKeyword') ?? '']);
  const last = history[history.length - 1];
  const canUndo = last?.scope === scope && last.after === JSON.stringify(compound.value);
  const advanced = !!compound.error || compound.value.conditions.length > 0;
  const input = params.get('graphKeyword') ?? '';
  const keyword = useDebouncedValue(input, 200);
  const query = useAttributeGraph(
    { keyword: keyword || undefined, groupIds, ...compound.value },
    !compound.error
  );
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
  const showResults = !compound.error && !query.error && !query.isFetching;
  const { alcohols, attributes, mappings } = useMemo(() => {
    const alcohols = ((showResults ? query.data?.items : []) ?? []).map((item) => ({
      id: item.alcoholId,
      name: item.korName,
      english: item.engName ?? '',
      category: item.korCategory ?? '',
      region: '',
      imageUrl: item.imageUrl,
    }));
    const entries = ((showResults ? query.data?.items : []) ?? []).flatMap((item) =>
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
  }, [query.data, showResults]);
  return (
    <div className="space-y-2">
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
        searchActions={
          <div className="contents">
            <GraphFilterPopover
              compact
              label={
                groupIds.length
                  ? `그룹 · ${groupIds.map((id) => groups.data?.find((g) => g.id === id)?.name ?? id).join(', ')}`
                  : '모든 그룹'
              }
            >
              <AttributeGroupFilter prefix="graph" />
            </GraphFilterPopover>
            <GraphFilterPopover label="상세 조건">
              <AttributeSearchBuilder
                key={JSON.stringify(compound.value)}
                value={compound.value}
                onApply={applySearch}
                error={compound.error}
                label="그래프 속성 조건"
              />
            </GraphFilterPopover>
            <div className="order-last ml-auto flex items-center gap-1">
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
              {advanced && (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={query.isFetching}
                  onClick={() => applySearch({ match: 'AND', conditions: [] })}
                >
                  {compound.error ? '조건 초기화' : '조건 모두 해제'}
                </Button>
              )}
            </div>
          </div>
        }
        filterControls={
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <GraphFilterPopover label="+ 조건" compact>
              {(close) => (
                <GraphConditionForm
                  attributes={definitions.data ?? []}
                  onAdd={(conditions) => {
                    addConditions(conditions);
                    close();
                  }}
                  conditionCount={compound.value.conditions.length}
                  disabled={!!compound.error || query.isFetching || compound.value.match !== 'AND'}
                />
              )}
            </GraphFilterPopover>
            {definitions.error && (
              <p role="alert" className="text-xs text-red-700">
                속성 목록을 불러오지 못했습니다.{' '}
                <button onClick={() => void definitions.refetch()}>속성 다시 조회</button>
              </p>
            )}
            {compound.error && (
              <p role="alert" className="text-xs text-red-700">
                {compound.error}
              </p>
            )}
            <div
              aria-label="그래프 탐색 조건"
              className="order-first flex flex-wrap items-center gap-2"
            >
              <AttributeConditionTokens
                search={compound.value}
                onChange={applySearch}
                disabled={query.isFetching}
              />
              {(compound.value.match === 'OR' || compound.value.conditions.length >= 20) && (
                <p className="text-xs text-slate-500">
                  {compound.value.match === 'OR'
                    ? '하나씩 좁히려면 상세 조건에서 모두 충족(AND)으로 변경하세요.'
                    : '조건은 최대 20개입니다. 기존 조건을 제거하면 더 추가할 수 있습니다.'}
                </p>
              )}
            </div>
          </div>
        }
        serverFilter={{
          keyword: input,
          key: '',
          value: '',
          total: query.data?.total,
          loading: query.isFetching,
          error: !!query.error || !!compound.error,
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
    </div>
  );
}
