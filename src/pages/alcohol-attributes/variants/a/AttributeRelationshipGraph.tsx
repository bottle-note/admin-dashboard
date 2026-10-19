import { useMemo, useState } from 'react';
import type { GraphData } from '@antv/g6';
import { Network, Search } from 'lucide-react';
import { RelationshipCanvas } from './RelationshipCanvas';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { displayValue, type Attribute, type Mapping, type AlcoholNode } from './attribute-model';

const ALCOHOL_LIMIT = 100;
const MAPPING_LIMIT = 500;
const valueId = (mapping: Mapping) =>
  `value-${JSON.stringify([mapping.attributeId, mapping.value])}`;
// Stable, evenly spaced samples avoid changing the graph on unrelated rerenders.
function sample<T>(items: T[], limit: number): T[] {
  if (items.length <= limit) return items;
  return Array.from({ length: limit }, (_, i) => items[Math.floor((i * items.length) / limit)]!);
}

export function AttributeRelationshipGraph({
  attributes,
  alcohols,
  mappings,
}: {
  attributes: Attribute[];
  alcohols: AlcoholNode[];
  mappings: Mapping[];
}) {
  const [query, setQuery] = useState('');
  const [attributeFilter, setAttributeFilter] = useState('all');
  const [valueFilter, setValueFilter] = useState('');
  const [selection, setSelection] = useState<string | null>(null);
  const model = useMemo(() => {
    const attributeById = new Map(attributes.map((a) => [a.id, a]));
    const alcoholById = new Map(alcohols.map((a) => [a.id, a]));
    const valid = mappings.filter(
      (m) => attributeById.has(m.attributeId) && alcoholById.has(m.alcoholId) && m.value?.trim()
    );
    const search = query.trim().toLowerCase();
    const valueSearch = valueFilter.trim().toLowerCase();
    const filtered = valid.filter((m) => {
      const a = attributeById.get(m.attributeId)!;
      const alcohol = alcoholById.get(m.alcoholId)!;
      return (
        (attributeFilter === 'all' || m.attributeId === Number(attributeFilter)) &&
        (!search ||
          `${alcohol.name} ${alcohol.english} ${a.displayName} ${a.key}`
            .toLowerCase()
            .includes(search)) &&
        (!valueSearch ||
          m.value.toLowerCase().includes(valueSearch) ||
          displayValue(a, m.value).toLowerCase().includes(valueSearch))
      );
    });
    const allIds = new Set(valid.map((m) => m.alcoholId));
    const filteredIds = [...new Set(filtered.map((m) => m.alcoholId))].sort((a, b) => a - b);
    const sampledIds = new Set(sample(filteredIds, ALCOHOL_LIMIT));
    const candidates = filtered
      .filter((m) => sampledIds.has(m.alcoholId))
      .sort((a, b) => a.id - b.id);
    // Give each sampled whisky at least one edge before sampling the remaining edges.
    const firstByAlcohol = new Map<number, Mapping>();
    for (const m of candidates)
      if (!firstByAlcohol.has(m.alcoholId)) firstByAlcohol.set(m.alcoholId, m);
    const first = [...firstByAlcohol.values()];
    const firstIds = new Set(first.map((m) => m.id));
    const visible =
      candidates.length <= MAPPING_LIMIT
        ? candidates
        : [
            ...first,
            ...sample(
              candidates.filter((m) => !firstIds.has(m.id)),
              MAPPING_LIMIT - first.length
            ),
          ].sort((a, b) => a.id - b.id);
    const visibleAlcoholIds = new Set(visible.map((m) => m.alcoholId));
    const groups = new Map<string, { id: string; attribute: Attribute; value: string }>();
    for (const m of visible)
      groups.set(valueId(m), {
        id: valueId(m),
        attribute: attributeById.get(m.attributeId)!,
        value: m.value,
      });
    const visibleAlcohols = [...visibleAlcoholIds].map((id) => alcoholById.get(id)!);
    const data: GraphData = {
      nodes: [
        ...visibleAlcohols.map((a) => ({
          id: `alcohol-${a.id}`,
          type: 'image',
          style: {
            src: a.imageUrl || '/images/whisky-node.svg',
            size: [48, 80] as [number, number],
            labelText: a.name,
            labelPlacement: 'bottom' as const,
            labelFontSize: 13,
            labelFill: '#79502f',
          },
        })),
        ...[...groups.values()].map((g) => ({
          id: g.id,
          type: 'rect',
          style: {
            size: [164, 52] as [number, number],
            radius: 8,
            fill: '#edf5f3',
            stroke: '#89aaa1',
            labelText: `${displayValue(g.attribute, g.value)}\n${g.attribute.displayName}`,
            labelPlacement: 'center' as const,
            labelFontSize: 13,
            labelFill: '#25473f',
          },
        })),
      ],
      edges: visible.map((m) => ({
        id: `mapping-${m.id}`,
        source: `alcohol-${m.alcoholId}`,
        target: valueId(m),
      })),
    };
    return {
      attributeById,
      alcoholById,
      valid,
      filtered,
      allIds,
      filteredIds,
      visible,
      visibleAlcohols,
      groups,
      data,
    };
  }, [attributes, alcohols, mappings, query, attributeFilter, valueFilter]);
  const selectedGroup = selection ? model.groups.get(selection) : undefined;
  const selectedAlcohol = selection?.startsWith('alcohol-')
    ? model.visibleAlcohols.find((a) => `alcohol-${a.id}` === selection)
    : undefined;
  const connections = model.filtered.filter((m) =>
    selectedGroup
      ? valueId(m) === selectedGroup.id
      : selectedAlcohol && m.alcoholId === selectedAlcohol.id
  );
  const sampled = model.visible.length < model.filtered.length;
  const changeFilter = (set: (value: string) => void, value: string) => {
    set(value);
    setSelection(null);
  };
  return (
    <div className="grid min-w-0 items-start gap-3 lg:grid-cols-[minmax(0,7fr)_minmax(0,3fr)]">
      <div className="min-w-0 overflow-hidden rounded-lg border bg-white">
        <div className="space-y-2 border-b p-3">
          <div className="flex items-center gap-2">
            <Network className="h-4 w-4 text-teal-800" />
            <h2 className="font-semibold">속성과 위스키의 관계</h2>
            <span className="ml-auto text-xs text-slate-500">조회 전용</span>
          </div>

          <div
            role="group"
            aria-label="관계 그래프 필터"
            className="grid gap-2 rounded-md bg-slate-50 p-2 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto]"
          >
            <label className="min-w-0 space-y-1 text-[11px] text-slate-600">
              위스키 · 속성 검색
              <div className="relative">
                <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  aria-label="그래프 검색"
                  value={query}
                  onChange={(e) => changeFilter(setQuery, e.target.value)}
                  placeholder="전체 데이터에서 검색"
                  className="h-8 bg-white pl-7 text-xs"
                />
              </div>
            </label>
            <label className="min-w-0 space-y-1 text-[11px] text-slate-600">
              속성
              <select
                aria-label="그래프 속성 필터"
                value={attributeFilter}
                onChange={(e) => changeFilter(setAttributeFilter, e.target.value)}
                className="h-8 w-full rounded border bg-white px-2 text-xs"
              >
                <option value="all">모든 속성</option>
                {attributes.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.displayName}
                  </option>
                ))}
              </select>
            </label>
            <label className="min-w-0 space-y-1 text-[11px] text-slate-600">
              값
              <Input
                aria-label="속성 값 필터"
                value={valueFilter}
                onChange={(e) => changeFilter(setValueFilter, e.target.value)}
                placeholder="예: 33,000"
                className="h-8 bg-white text-xs"
              />
            </label>
            <Button
              variant="outline"
              size="sm"
              className="self-end"
              onClick={() => {
                setQuery('');
                setAttributeFilter('all');
                setValueFilter('');
                setSelection(null);
              }}
            >
              전체 보기
            </Button>
          </div>
          <p className="text-xs text-slate-600">
            전체 위스키 {model.allIds.size}개 · 연결 {model.valid.length}개 / 필터 결과 위스키{' '}
            {model.filteredIds.length}개 · 연결 {model.filtered.length}개
          </p>
          <p role="status" className={`text-xs ${sampled ? 'text-amber-800' : 'text-slate-500'}`}>
            표시: 위스키 {model.visibleAlcohols.length}개 · 속성 값 {model.groups.size}개 · 연결{' '}
            {model.visible.length}개
            {sampled &&
              ' · 샘플 표시 중 (최대 위스키 100개·연결 500개). 필터는 전체 데이터에 적용됩니다.'}
          </p>
        </div>
        <div className="overflow-hidden bg-slate-50/60 p-2">
          {!model.visible.length ? (
            <p className="p-10 text-center text-xs text-slate-500">표시할 연결이 없습니다.</p>
          ) : (
            <RelationshipCanvas
              data={model.data}
              focusId={null}
              selectedId={selectedGroup || selectedAlcohol ? selection : null}
              onSelect={setSelection}
            />
          )}
        </div>
        <p className="sr-only" role="status">
          {selectedGroup
            ? `${selectedGroup.attribute.displayName} ${displayValue(selectedGroup.attribute, selectedGroup.value)}`
            : (selectedAlcohol?.name ?? '선택 없음')}{' '}
          · 연결 {connections.length}개
        </p>
        <details className="border-t p-3 text-xs">
          <summary className="cursor-pointer text-slate-600">노드 목록으로 탐색</summary>
          <div className="mt-2 flex max-h-48 flex-wrap gap-2 overflow-auto">
            {[...model.groups.values()].map((g) => (
              <button
                key={g.id}
                aria-pressed={selection === g.id}
                aria-label={`속성: ${g.attribute.displayName} · ${displayValue(g.attribute, g.value)}`}
                className="rounded border px-2 py-1 text-left focus-visible:ring-2 focus-visible:ring-teal-700 aria-pressed:border-teal-700 aria-pressed:bg-teal-50 aria-pressed:text-teal-900"
                onClick={() => setSelection(g.id)}
              >
                {g.attribute.displayName} · {displayValue(g.attribute, g.value)}
              </button>
            ))}
            {model.visibleAlcohols.map((a) => (
              <button
                key={a.id}
                aria-pressed={selection === `alcohol-${a.id}`}
                aria-label={`위스키: ${a.name}`}
                className="rounded border px-2 py-1 focus-visible:ring-2 focus-visible:ring-teal-700 aria-pressed:border-teal-700 aria-pressed:bg-teal-50 aria-pressed:text-teal-900"
                onClick={() => setSelection(`alcohol-${a.id}`)}
              >
                {a.name}
              </button>
            ))}
          </div>
        </details>
      </div>
      <aside
        aria-label="그래프 상세"
        className="min-w-0 rounded-lg border bg-white p-3 lg:sticky lg:top-3"
      >
        {selectedGroup || selectedAlcohol ? (
          <>
            <p className="text-xs text-teal-800">{selectedGroup ? '속성 값' : '위스키'}</p>
            <h3 className="mt-2 break-words text-sm font-semibold">
              {selectedGroup?.attribute.displayName ?? selectedAlcohol?.name}
            </h3>
            {selectedGroup && (
              <>
                <p className="mt-2 break-all font-mono text-lg font-semibold text-teal-900">
                  {displayValue(selectedGroup.attribute, selectedGroup.value)}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-xs text-slate-500">
                  {selectedGroup.attribute.description}
                </p>
              </>
            )}
            <h4 className="mb-2 mt-3 border-t pt-3 text-xs font-semibold">
              {selectedGroup ? '이 값에 연결된 위스키' : '연결된 속성 값'} {connections.length}개
            </h4>
            <p className="mb-2 text-[11px] text-slate-500">현재 필터 결과 기준 · 최대 100건 표시</p>
            <div className="max-h-[45vh] space-y-2 overflow-y-auto">
              {connections.slice(0, 100).map((m) => {
                const a = model.attributeById.get(m.attributeId)!;
                const label = selectedGroup
                  ? model.alcoholById.get(m.alcoholId)!.name
                  : a.displayName;
                const target = selectedGroup ? `alcohol-${m.alcoholId}` : valueId(m);
                const visible = model.data.nodes!.some((n) => n.id === target);
                return (
                  <button
                    key={m.id}
                    aria-label={label}
                    disabled={!visible}
                    className="block w-full rounded border px-3 py-2 text-left text-xs hover:bg-teal-50 disabled:opacity-60"
                    onClick={() => setSelection(target)}
                  >
                    <span>{label}</span>
                    <span className="ml-2 text-slate-500">
                      {displayValue(a, m.value)}
                      {!visible && ' · 샘플 밖'}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <p className="text-xs leading-5 text-slate-500">
            술병이나 속성 값을 선택하세요. 필터를 바꾸기 전까지 전체 표시 범위는 유지됩니다.
          </p>
        )}
      </aside>
    </div>
  );
}
