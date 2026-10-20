import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { GraphData } from '@antv/g6';
import { Network, Search } from 'lucide-react';
import { RelationshipCanvas } from './RelationshipCanvas';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { displayValue, type Attribute, type Mapping, type AlcoholNode } from './attribute-model';

const MAPPING_LIMIT = 500;
const attributeColors = {
  PRICE: { fill: '#fff4e5', stroke: '#e7c694', text: '#87551c', marker: '₩' },
  POPULARITY: { fill: '#f1edff', stroke: '#c9bcef', text: '#65509a', marker: '★' },
  FLAG: { fill: '#e9f5ef', stroke: '#a5d2bb', text: '#2c7152', marker: '✓' },
  KEYWORD: { fill: '#eaf3fb', stroke: '#b0cee5', text: '#386887', marker: '#' },
  IDENTITY: { fill: '#edf1f5', stroke: '#c1ccd8', text: '#52657a', marker: '#' },
  NOTE: { fill: '#f9edf3', stroke: '#dfbfd0', text: '#8b526e', marker: '≡' },
};
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
  serverFilter,
  filterControls,
  refinementControls,
  onNarrow,
  narrowDisabled,
  isNarrowed,
}: {
  filterControls?: ReactNode;
  refinementControls?: ReactNode;
  onNarrow?: (attribute: Attribute, value: string) => void;
  narrowDisabled?: boolean;
  isNarrowed?: (key: string, value: string) => boolean;
  attributes: Attribute[];
  alcohols: AlcoholNode[];
  mappings: Mapping[];
  serverFilter: {
    keyword: string;
    key: string;
    value: string;
    total?: number;
    loading: boolean;
    onChange: (filters: { keyword: string; key: string; value: string }) => void;
  };
}) {
  const [selection, setSelection] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [listOpen, setListOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [fullscreenError, setFullscreenError] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const update = () => setFullscreen(document.fullscreenElement === panelRef.current);
    document.addEventListener('fullscreenchange', update);
    return () => document.removeEventListener('fullscreenchange', update);
  }, []);
  const selectNode = (id: string | null) => {
    setSelection(id);
    setDetailsOpen(true);
  };
  const toggleFullscreen = async () => {
    try {
      setFullscreenError(false);
      if (document.fullscreenElement === panelRef.current) await document.exitFullscreen();
      else await panelRef.current?.requestFullscreen();
    } catch {
      setFullscreenError(true);
    }
  };
  const model = useMemo(() => {
    const attributeById = new Map(attributes.map((a) => [a.id, a]));
    const alcoholById = new Map(alcohols.map((a) => [a.id, a]));
    const valid = mappings.filter(
      (m) => attributeById.has(m.attributeId) && alcoholById.has(m.alcoholId) && m.value?.trim()
    );
    // 복합 조건은 서버에서 술을 선별하며 그래프에는 반환된 전체 관계를 표시한다.
    const filtered = valid;
    const candidates = [...filtered].sort((a, b) => a.id - b.id);
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
    const groups = new Map<string, { id: string; attribute: Attribute; value: string }>();
    for (const m of visible)
      groups.set(valueId(m), {
        id: valueId(m),
        attribute: attributeById.get(m.attributeId)!,
        value: m.value,
      });
    const visibleAlcohols = alcohols;
    const data: GraphData = {
      nodes: [
        ...visibleAlcohols.map((a) => ({
          id: `alcohol-${a.id}`,
          type: 'image',
          style: {
            src: '/images/whisky-node.svg',
            size: [36, 64] as [number, number],
            labelText: a.name,
            labelPlacement: 'bottom' as const,
            labelFontSize: 13,
            labelFill: '#79502f',
          },
        })),
        ...[...groups.values()].map((g) => {
          const colors = attributeColors[g.attribute.type];
          const value = displayValue(g.attribute, g.value);
          const marker = g.attribute.type === 'FLAG' && g.value === 'false' ? '×' : colors.marker;
          // Only use the currency symbol for won-denominated prices.
          const prefix = g.attribute.type === 'PRICE' && g.attribute.unit !== '원' ? '' : marker;
          return {
            id: g.id,
            type: 'rect',
            data: { detailLabel: `${g.attribute.displayName}\n${value}` },
            style: {
              size: [160, 46] as [number, number],
              radius: 15,
              fill: colors.fill,
              stroke: colors.stroke,
              labelText:
                `${g.attribute.displayName.replace(/^bartender note:\s*/i, '')}\n${prefix} ${value}`.trim(),
              labelPlacement: 'center' as const,
              labelFontSize: 12,
              labelFill: colors.text,
            },
          };
        }),
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
      filtered,
      visible,
      visibleAlcohols,
      groups,
      data,
    };
  }, [attributes, alcohols, mappings]);
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
  return (
    <div
      ref={panelRef}
      className={`grid min-w-0 items-start gap-3 bg-white [&:fullscreen]:overflow-auto ${
        (selectedGroup || selectedAlcohol || refinementControls) && detailsOpen
          ? 'lg:grid-cols-[minmax(0,7fr)_minmax(0,3fr)]'
          : 'grid-cols-1'
      }`}
    >
      <div className="min-w-0 overflow-hidden rounded-lg border bg-white">
        <div className="space-y-2 border-b p-3">
          <div className="flex flex-wrap items-center gap-2">
            <Network className="h-4 w-4 text-teal-800" />
            <h2 className="font-semibold">속성과 위스키의 관계</h2>
            <span className="ml-auto text-xs text-slate-500">조회 전용</span>
            {(selectedGroup || selectedAlcohol || refinementControls) && (
              <Button
                size="sm"
                variant="outline"
                aria-expanded={detailsOpen}
                onClick={() => setDetailsOpen(!detailsOpen)}
              >
                {detailsOpen ? '상세 접기' : '상세 보기'}
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              aria-expanded={listOpen}
              onClick={() => setListOpen(!listOpen)}
            >
              {listOpen ? '목록 접기' : '목록으로 탐색'}
            </Button>
            <Button size="sm" variant="outline" onClick={() => void toggleFullscreen()}>
              {fullscreen ? '전체화면 닫기' : '전체화면'}
            </Button>
          </div>

          <div role="group" aria-label="관계 그래프 필터" className="min-w-0">
            <label className="min-w-0 space-y-1 text-[11px] text-slate-600">
              <span className="sr-only">위스키 검색</span>
              <div className="relative">
                <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  aria-label="그래프 검색"
                  value={serverFilter.keyword}
                  onChange={(e) => {
                    serverFilter.onChange({ ...serverFilter, keyword: e.target.value });
                    selectNode(null);
                  }}
                  placeholder="전체 위스키에서 검색"
                  className="h-8 bg-white pl-7 text-xs"
                />
              </div>
            </label>
          </div>
          {filterControls}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <p className="text-xs text-slate-600">
              {serverFilter.loading
                ? '서버에서 관계를 조회 중입니다.'
                : `검색 결과 위스키 ${serverFilter.total ?? 0}개 · 현재 페이지 ${alcohols.length}개`}
            </p>
            <p role="status" className={`text-xs ${sampled ? 'text-amber-800' : 'text-slate-500'}`}>
              표시: 위스키 {model.visibleAlcohols.length}개 · 속성 값 {model.groups.size}개 · 연결{' '}
              {model.visible.length}개
              {sampled && ' · 현재 페이지에서 최대 500개 연결을 표시합니다.'}
            </p>
          </div>
          {fullscreenError && (
            <p role="alert" className="text-xs text-red-700">
              전체화면을 열지 못했습니다. 브라우저에서 전체화면을 허용한 뒤 다시 시도하세요.
            </p>
          )}
        </div>
        <details
          open={listOpen}
          onToggle={(event) => setListOpen(event.currentTarget.open)}
          className="border-t p-3 text-xs"
        >
          <summary className="cursor-pointer text-slate-600">노드 목록으로 탐색</summary>
          <div className="mt-2 flex max-h-48 flex-wrap gap-2 overflow-auto">
            {[...model.groups.values()].map((g) => (
              <button
                key={g.id}
                aria-pressed={selection === g.id}
                aria-label={`속성: ${g.attribute.displayName} · ${displayValue(g.attribute, g.value)}`}
                className="rounded border px-2 py-1 text-left focus-visible:ring-2 focus-visible:ring-teal-700 aria-pressed:border-teal-700 aria-pressed:bg-teal-50 aria-pressed:text-teal-900"
                onClick={() => selectNode(g.id)}
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
                onClick={() => selectNode(`alcohol-${a.id}`)}
              >
                {a.name}
              </button>
            ))}
          </div>
        </details>
        <div className="overflow-hidden bg-slate-50/60 p-2">
          {!model.visibleAlcohols.length ? (
            <p className="p-10 text-center text-xs text-slate-500">표시할 연결이 없습니다.</p>
          ) : (
            <RelationshipCanvas
              data={model.data}
              selectedId={selectedGroup || selectedAlcohol ? selection : null}
              onSelect={selectNode}
              expanded={fullscreen}
            />
          )}
        </div>
        <p className="sr-only" role="status">
          {selectedGroup
            ? `${selectedGroup.attribute.displayName} ${displayValue(selectedGroup.attribute, selectedGroup.value)}`
            : (selectedAlcohol?.name ?? '선택 없음')}{' '}
          · 연결 {connections.length}개
        </p>
      </div>
      {(selectedGroup || selectedAlcohol || refinementControls) && detailsOpen && (
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
                  {onNarrow && (
                    <Button
                      className="mt-3 w-full"
                      size="sm"
                      disabled={
                        narrowDisabled ||
                        isNarrowed?.(selectedGroup.attribute.key, selectedGroup.value)
                      }
                      onClick={() => onNarrow(selectedGroup.attribute, selectedGroup.value)}
                    >
                      {isNarrowed?.(selectedGroup.attribute.key, selectedGroup.value)
                        ? '이미 적용한 조건'
                        : '이 값으로 좁히기'}
                    </Button>
                  )}
                  <p className="mt-2 whitespace-pre-wrap text-xs text-slate-500">
                    {selectedGroup.attribute.description}
                  </p>
                </>
              )}
              {refinementControls}
              <h4 className="mb-2 mt-3 border-t pt-3 text-xs font-semibold">
                {selectedGroup ? '이 값에 연결된 위스키' : '연결된 속성 값'} {connections.length}개
              </h4>
              <p className="mb-2 text-[11px] text-slate-500">
                현재 조회 범위 기준 · 최대 100건 표시
              </p>
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
                      onClick={() => selectNode(target)}
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
          {!selectedGroup && !selectedAlcohol && refinementControls}
        </aside>
      )}
    </div>
  );
}
