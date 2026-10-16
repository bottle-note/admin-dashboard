import { useMemo, useState } from 'react';
import { RelationshipCanvas } from './RelationshipCanvas';
import type { GraphData } from '@antv/g6';
import { Network, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { type Attribute, type Mapping, type alcohols as AlcoholList } from './mock-data';

type Selection = { kind: 'attribute' | 'alcohol'; id: number };

export function AttributeRelationshipGraph({
  attributes: dictionaryAttributes,
  alcohols: availableAlcohols,
  mappings,
}: {
  attributes: Attribute[];
  alcohols: typeof AlcoholList;
  mappings: Mapping[];
}) {
  const attributes = useMemo(
    () =>
      dictionaryAttributes.filter((item) =>
        mappings.some((mapping) => mapping.attributeId === item.id)
      ),
    [dictionaryAttributes, mappings]
  );
  const alcohols = useMemo(
    () =>
      availableAlcohols.filter((item) => mappings.some((mapping) => mapping.alcoholId === item.id)),
    [availableAlcohols, mappings]
  );
  const [selection, setSelection] = useState<Selection | null>(null);
  const [focusAlcoholId, setFocusAlcoholId] = useState<number | null>(alcohols[0]?.id ?? null);
  const [query, setQuery] = useState('');
  const [onlyRelated, setOnlyRelated] = useState(false);
  const selectedAttribute =
    selection?.kind === 'attribute'
      ? attributes.find((item) => item.id === selection.id)
      : undefined;
  const selectedAlcohol =
    selection?.kind === 'alcohol' ? alcohols.find((item) => item.id === selection.id) : undefined;
  const connections = mappings.filter((item) =>
    selection?.kind === 'attribute'
      ? item.attributeId === selection.id
      : selection?.kind === 'alcohol' && item.alcoholId === selection.id
  );
  const relatedAttributeIds = new Set(connections.map((item) => item.attributeId));
  const relatedAlcoholIds = new Set(connections.map((item) => item.alcoholId));
  const search = query.trim().toLowerCase();
  const matchesAttributes = attributes.filter((item) =>
    `${item.displayName} ${item.key}`.toLowerCase().includes(search)
  );
  const matchesAlcohols = alcohols.filter((item) =>
    `${item.name} ${item.english}`.toLowerCase().includes(search)
  );
  const matchingAttributeIds = new Set(matchesAttributes.map((item) => item.id));
  const matchingAlcoholIds = new Set(matchesAlcohols.map((item) => item.id));
  const searchConnections = mappings.filter(
    (item) => matchingAttributeIds.has(item.attributeId) || matchingAlcoholIds.has(item.alcoholId)
  );
  const visibleAttributes = attributes.filter(
    (item) =>
      (focusAlcoholId === null ||
        mappings.some(
          (mapping) => mapping.alcoholId === focusAlcoholId && mapping.attributeId === item.id
        )) &&
      (!onlyRelated ||
        !selection ||
        selectedAttribute?.id === item.id ||
        relatedAttributeIds.has(item.id)) &&
      (!search ||
        matchingAttributeIds.has(item.id) ||
        searchConnections.some((mapping) => mapping.attributeId === item.id))
  );
  const visibleAlcohols = alcohols.filter(
    (item) =>
      (focusAlcoholId === null || item.id === focusAlcoholId) &&
      (!onlyRelated ||
        !selection ||
        selectedAlcohol?.id === item.id ||
        relatedAlcoholIds.has(item.id)) &&
      (!search ||
        matchingAlcoholIds.has(item.id) ||
        searchConnections.some((mapping) => mapping.alcoholId === item.id))
  );
  const visibleMappings = mappings.filter(
    (item) =>
      visibleAttributes.some((attribute) => attribute.id === item.attributeId) &&
      visibleAlcohols.some((alcohol) => alcohol.id === item.alcoholId)
  );
  const visibleKey = `${visibleAttributes.map((item) => item.id).join(',')}/${visibleAlcohols.map((item) => item.id).join(',')}/${visibleMappings.map((item) => item.id).join(',')}`;
  const data: GraphData = useMemo(() => {
    const [attributeIds = '', alcoholIds = '', mappingIds = ''] = visibleKey.split('/');
    const includes = (ids: string, id: number) => ids.split(',').includes(String(id));
    return {
      nodes: [
        ...alcohols
          .filter((item) => includes(alcoholIds, item.id))
          .map((item) => ({
            id: `alcohol-${item.id}`,
            type: 'image',
            data: { kind: 'alcohol' },
            style: {
              src: '/images/whisky-node.svg',
              size: [64, 112] as [number, number],
              labelText: item.name,
              labelPlacement: 'bottom' as const,
              labelFontSize: 12,
              labelFill: '#79502f',
              labelFontWeight: 600,
            },
          })),
        ...attributes
          .filter((item) => includes(attributeIds, item.id))
          .map((item) => ({
            id: `attribute-${item.id}`,
            type: 'rect',
            data: { kind: 'attribute' },
            style: {
              size: [144, 44] as [number, number],
              radius: 10,
              fill: '#edf1f6',
              stroke: '#8796a9',
              labelText: item.displayName,
              labelPlacement: 'center' as const,
              labelFontSize: 12,
              labelFill: '#293341',
            },
          })),
      ],
      edges: mappings
        .filter((item) => includes(mappingIds, item.id))
        .map((item) => ({
          id: `mapping-${item.id}`,
          source: `alcohol-${item.alcoholId}`,
          target: `attribute-${item.attributeId}`,
        })),
    };
  }, [visibleKey, attributes, alcohols, mappings]);
  const choose = (next: Selection) => setSelection(next);

  return (
    <div className="grid min-w-0 items-start gap-3 lg:grid-cols-[minmax(0,7fr)_minmax(0,3fr)]">
      <div className="min-w-0 overflow-hidden rounded-lg border bg-white">
        <div className="space-y-2 border-b p-3">
          <div className="flex items-center gap-2">
            <Network className="h-4 w-4 text-teal-800" />
            <h2 className="font-semibold">속성과 위스키의 관계</h2>
            <span className="ml-auto text-xs text-slate-500">조회 전용</span>
          </div>
          <p className="text-xs text-slate-600">
            술병은 위스키, 사각형은 속성, 선은 연결입니다. 노드를 선택하면 관계를 강조합니다. 연결
            변경은 ‘속성 연결’ 탭에서 진행하세요.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-xs" htmlFor="graph-alcohol-focus">
              중심 위스키
            </label>
            <select
              id="graph-alcohol-focus"
              className="h-8 rounded border bg-white px-2 text-xs"
              value={focusAlcoholId ?? 'all'}
              onChange={(event) => {
                setFocusAlcoholId(event.target.value === 'all' ? null : Number(event.target.value));
                setSelection(null);
                setQuery('');
                setOnlyRelated(false);
              }}
            >
              <option value="all">전체 관계 보기</option>
              {alcohols.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-48 flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                aria-label="그래프 검색"
                placeholder="속성 또는 위스키 검색"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setFocusAlcoholId(null);
                  setSelection(null);
                  setOnlyRelated(false);
                }}
                className="pl-9"
              />
            </div>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={onlyRelated}
                disabled={!selection}
                onChange={(event) => setOnlyRelated(event.target.checked)}
              />
              선택한 항목과 연결만
            </label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setQuery('');
                setFocusAlcoholId(null);
                setSelection(null);
                setOnlyRelated(false);
              }}
            >
              전체 보기
            </Button>
          </div>
          <p className="text-xs text-slate-600">
            속성 {visibleAttributes.length}개 · 위스키 {visibleAlcohols.length}개 · 연결{' '}
            {visibleMappings.length}개
          </p>
        </div>
        <div className="overflow-hidden bg-slate-50/60 p-2">
          {!visibleAttributes.length && !visibleAlcohols.length ? (
            <p className="p-10 text-center text-xs text-slate-500">표시할 연결이 없습니다.</p>
          ) : (
            <RelationshipCanvas
              data={data}
              focusId={focusAlcoholId === null ? null : `alcohol-${focusAlcoholId}`}
              selectedId={selection ? `${selection.kind}-${selection.id}` : null}
              onSelect={(id) => {
                const [kind, value] = id.split('-');
                if (kind === 'alcohol' || kind === 'attribute') choose({ kind, id: Number(value) });
              }}
            />
          )}
        </div>
        <details className="border-t p-3 text-xs">
          <summary className="cursor-pointer text-slate-600">노드 목록으로 탐색</summary>
          <div className="mt-2 flex flex-wrap gap-2">
            {attributes.map((item) => (
              <button
                key={`a-${item.id}`}
                type="button"
                aria-label={`속성: ${item.displayName}`}
                className="rounded border px-2 py-1"
                onClick={() => {
                  setFocusAlcoholId(null);
                  choose({ kind: 'attribute', id: item.id });
                }}
              >
                {item.displayName}
              </button>
            ))}
            {alcohols.map((item) => (
              <button
                key={`w-${item.id}`}
                type="button"
                aria-label={`위스키: ${item.name}`}
                className="rounded border px-2 py-1"
                onClick={() => {
                  setFocusAlcoholId(item.id);
                  choose({ kind: 'alcohol', id: item.id });
                }}
              >
                {item.name}
              </button>
            ))}
          </div>
        </details>
      </div>
      <aside
        aria-label="그래프 상세"
        className="min-w-0 rounded-lg border bg-white p-3 lg:sticky lg:top-3"
      >
        {selectedAttribute || selectedAlcohol ? (
          <>
            <p className="text-xs text-teal-800">{selectedAttribute ? '공통 속성' : '위스키'}</p>
            <h3 className="mt-2 break-words text-xs font-semibold">
              {selectedAttribute?.displayName ?? selectedAlcohol?.name}
            </h3>
            {selectedAttribute && (
              <>
                <p className="mt-2 break-all font-mono text-xs text-slate-500">
                  {selectedAttribute.key}
                </p>
                <p className="mt-3 text-xs">
                  {selectedAttribute.value} {selectedAttribute.unit} ·{' '}
                  {selectedAttribute.operator === 'GTE' ? '이상 (≥)' : '같음 (=)'}
                </p>
                <p className="mt-2 whitespace-pre-wrap break-words text-xs text-slate-600">
                  {selectedAttribute.description}
                </p>
              </>
            )}
            {selectedAlcohol && (
              <p className="mt-2 text-xs text-slate-600">
                {selectedAlcohol.region} · {selectedAlcohol.category}
              </p>
            )}
            <h4 className="mb-2 mt-3 border-t pt-3 text-xs font-semibold">
              {selectedAttribute ? '연결된 위스키' : '연결된 속성'} {connections.length}개
            </h4>
            <div className="space-y-2">
              {connections.map((item) => {
                const label = selectedAttribute
                  ? alcohols.find((alcohol) => alcohol.id === item.alcoholId)?.name
                  : attributes.find((attribute) => attribute.id === item.attributeId)?.displayName;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className="block w-full rounded border px-3 py-2 text-left text-xs hover:bg-teal-50 focus-visible:ring-2 focus-visible:ring-teal-700"
                    onClick={() =>
                      choose(
                        selectedAttribute
                          ? { kind: 'alcohol', id: item.alcoholId }
                          : { kind: 'attribute', id: item.attributeId }
                      )
                    }
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            {!connections.length && (
              <p className="text-xs text-slate-500">
                {selectedAttribute ? '연결된 위스키가 없습니다.' : '연결된 속성이 없습니다.'}
              </p>
            )}
          </>
        ) : (
          <p className="text-xs leading-5 text-slate-500">
            그래프에서 속성이나 위스키를 선택하세요. 연결 목록과 공통 정의를 여기에서 확인합니다.
          </p>
        )}
      </aside>
    </div>
  );
}
