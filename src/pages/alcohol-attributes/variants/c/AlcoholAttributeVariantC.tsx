import { useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import {
  ArrowRight,
  Check,
  CircleHelp,
  GitBranch,
  Link2,
  Maximize2,
  Minus,
  Network,
  Pencil,
  Plus,
  Search,
  Trash2,
  Unlink,
  Wine,
} from 'lucide-react';
import { TabBar } from '@/components/common/TabBar';
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AttributeDefinitionDialog } from './AttributeDefinitionDialog';
import {
  attributeMeaning,
  attributeTypes,
  initialAttributes,
  initialMappings,
  whiskies,
  type Attribute,
  type AttributeType,
  type Mapping,
} from './mock-data';
import './variant-c.css';

const tabs = [
  { value: 'attributes', label: '속성관리' },
  { value: 'mappings', label: '속성 연결' },
] as const;
type Selection =
  | { kind: 'attribute'; id: number }
  | { kind: 'whisky'; id: number }
  | { kind: 'pair'; alcoholId: number; attributeId: number };
type DeleteTarget =
  | { kind: 'attribute'; attribute: Attribute }
  | { kind: 'mapping'; mapping: Mapping };

function position(index: number, total: number, outer: boolean) {
  const angle = -Math.PI / 2 + (index / Math.max(total, 1)) * Math.PI * 2;
  return {
    x: 450 + Math.cos(angle) * (outer ? 325 : 155),
    y: 298 + Math.sin(angle) * (outer ? 222 : 108),
  };
}

function RelationshipCanvas({
  attributes,
  alcohols,
  mappings,
  selection,
  onSelect,
}: {
  attributes: Attribute[];
  alcohols: typeof whiskies;
  mappings: Mapping[];
  selection: Selection;
  onSelect: (selection: Selection) => void;
}) {
  const [zoom, setZoom] = useState(1);
  const isActive = (mapping: Mapping) =>
    selection.kind === 'attribute'
      ? mapping.attributeId === selection.id
      : selection.kind === 'whisky'
        ? mapping.alcoholId === selection.id
        : mapping.alcoholId === selection.alcoholId &&
          mapping.attributeId === selection.attributeId;
  const visibleMappings = mappings.filter(
    (mapping) =>
      attributes.some((attribute) => attribute.id === mapping.attributeId) &&
      alcohols.some((whisky) => whisky.id === mapping.alcoholId)
  );
  const activeMappings = mappings.filter(isActive);
  return (
    <div className="c-canvas">
      <div className="c-canvas-caption">
        <Network size={16} />
        <span>공통 속성으로 만나는 위스키</span>
      </div>
      <svg
        viewBox="0 0 900 590"
        className="c-graph"
        role="group"
        aria-label="위스키와 공통 속성의 연결망"
      >
        <g transform={`translate(450 295) scale(${zoom}) translate(-450 -295)`}>
          <ellipse cx="450" cy="298" rx="325" ry="222" className="c-orbit" />
          <ellipse cx="450" cy="298" rx="155" ry="108" className="c-orbit c-orbit-inner" />
          {visibleMappings.map((mapping) => {
            const attributeIndex = attributes.findIndex(
              (attribute) => attribute.id === mapping.attributeId
            );
            const alcoholIndex = alcohols.findIndex((whisky) => whisky.id === mapping.alcoholId);
            const from = position(attributeIndex, attributes.length, true);
            const to = position(alcoholIndex, alcohols.length, false);
            return (
              <g
                key={mapping.id}
                className={`c-edge ${isActive(mapping) ? 'c-edge-active' : ''}`}
                role="button"
                tabIndex={0}
                aria-label={`${alcohols[alcoholIndex]?.name}의 ${attributes[attributeIndex]?.displayName} 연결 보기`}
                onClick={() =>
                  onSelect({
                    kind: 'pair',
                    alcoholId: mapping.alcoholId,
                    attributeId: mapping.attributeId,
                  })
                }
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onSelect({
                      kind: 'pair',
                      alcoholId: mapping.alcoholId,
                      attributeId: mapping.attributeId,
                    });
                  }
                }}
              >
                <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} className="c-edge-line" />
                <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} className="c-edge-hit" />
                <title>직접 연결 · #{mapping.id}</title>
              </g>
            );
          })}
          {alcohols.map((whisky, index) => {
            const point = position(index, alcohols.length, false);
            const selected = selection.kind === 'whisky' && selection.id === whisky.id;
            const related =
              selected ||
              activeMappings.some((mapping) => mapping.alcoholId === whisky.id) ||
              (selection.kind === 'pair' && selection.alcoholId === whisky.id);
            return (
              <g
                key={whisky.id}
                transform={`translate(${point.x} ${point.y})`}
                className={`c-node c-bottle ${selected ? 'c-selected' : ''}`}
                data-muted={!related}
                role="button"
                tabIndex={0}
                aria-label={`위스키: ${whisky.name}`}
                aria-pressed={selected}
                onClick={() => onSelect({ kind: 'whisky', id: whisky.id })}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onSelect({ kind: 'whisky', id: whisky.id });
                  }
                }}
              >
                <circle r="37" className="c-bottle-halo" />
                <path
                  d="M-7 -32 H7 V-17 L17 -7 V27 Q17 31 13 31 H-13 Q-17 31 -17 27 V-7 L-7 -17 Z"
                  className="c-bottle-shape"
                />
                <rect x="-11" y="0" width="22" height="19" rx="2" className="c-bottle-label" />
                <text y="14" className="c-bottle-initial">
                  {whisky.initial}
                </text>
                <text y="50" className="c-node-name">
                  {whisky.shortName}
                </text>
              </g>
            );
          })}
          {attributes.map((attribute, index) => {
            const point = position(index, attributes.length, true);
            const selected = selection.kind === 'attribute' && selection.id === attribute.id;
            const related =
              selected ||
              activeMappings.some((mapping) => mapping.attributeId === attribute.id) ||
              (selection.kind === 'pair' && selection.attributeId === attribute.id);
            const count = mappings.filter((mapping) => mapping.attributeId === attribute.id).length;
            return (
              <g
                key={attribute.id}
                transform={`translate(${point.x} ${point.y})`}
                className={`c-node c-attribute-node c-type-${attribute.type} ${selected ? 'c-selected' : ''}`}
                data-muted={!related}
                role="button"
                tabIndex={0}
                aria-label={`속성: ${attribute.displayName}, 연결 ${count}개`}
                aria-pressed={selected}
                onClick={() => onSelect({ kind: 'attribute', id: attribute.id })}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onSelect({ kind: 'attribute', id: attribute.id });
                  }
                }}
              >
                <rect x="-77" y="-28" width="154" height="56" rx="14" />
                <text y="-3" className="c-node-name">
                  {attribute.displayName.length > 12
                    ? `${attribute.displayName.slice(0, 11)}…`
                    : attribute.displayName}
                </text>
                <text y="15" className="c-node-detail">
                  {attributeTypes[attribute.type]} · {count ? `${count}개 연결` : '미연결'}
                </text>
                {selected && <circle cx="68" cy="-23" r="5" className="c-selected-pin" />}
                <title>
                  {attribute.displayName}: {attributeMeaning(attribute)}
                </title>
              </g>
            );
          })}
        </g>
      </svg>
      <div className="c-canvas-bottom">
        <span>노드나 연결선을 선택해 살펴보세요.</span>
        <div className="c-zoom">
          <Button
            variant="ghost"
            size="icon"
            aria-label="연결망 축소"
            disabled={zoom <= 0.7}
            onClick={() => setZoom((value) => Math.max(0.7, value - 0.15))}
          >
            <Minus />
          </Button>
          <span>{Math.round(zoom * 100)}%</span>
          <Button
            variant="ghost"
            size="icon"
            aria-label="연결망 확대"
            disabled={zoom >= 1.3}
            onClick={() => setZoom((value) => Math.min(1.3, value + 0.15))}
          >
            <Plus />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="연결망 크기 초기화"
            onClick={() => setZoom(1)}
          >
            <Maximize2 />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function AlcoholAttributeVariantC() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') === 'mappings' ? 'mappings' : 'attributes';
  const [attributes, setAttributes] = useState(initialAttributes);
  const [mappings, setMappings] = useState(initialMappings);
  const [selection, setSelection] = useState<Selection>({ kind: 'attribute', id: 102 });
  const [query, setQuery] = useState('');
  const [type, setType] = useState<AttributeType | 'ALL'>('ALL');
  const [onlyUnlinked, setOnlyUnlinked] = useState(false);
  const [definition, setDefinition] = useState<Attribute | 'new' | null>(null);
  const [deletion, setDeletion] = useState<DeleteTarget | null>(null);
  const [connectionAttributeId, setConnectionAttributeId] = useState<number | null>(null);
  const [selectedAlcoholIds, setSelectedAlcoholIds] = useState<number[]>([]);
  const [lookup, setLookup] = useState('');
  const [notice, setNotice] = useState('연결망에서 선물용 위스키 3개의 공통점을 살펴보세요.');
  const nextAttributeId = useRef(108);
  const nextMappingId = useRef(1016);
  const selectedAttribute = attributes.find(
    (attribute) =>
      attribute.id ===
      (selection.kind === 'attribute'
        ? selection.id
        : selection.kind === 'pair'
          ? selection.attributeId
          : -1)
  );
  const selectedWhisky = whiskies.find(
    (whisky) =>
      whisky.id ===
      (selection.kind === 'whisky'
        ? selection.id
        : selection.kind === 'pair'
          ? selection.alcoholId
          : -1)
  );
  const selectedMapping =
    selection.kind === 'pair'
      ? mappings.find(
          (mapping) =>
            mapping.alcoholId === selection.alcoholId &&
            mapping.attributeId === selection.attributeId
        )
      : undefined;
  const attributeMappings = selectedAttribute
    ? mappings.filter((mapping) => mapping.attributeId === selectedAttribute.id)
    : [];
  const whiskyMappings = selectedWhisky
    ? mappings.filter((mapping) => mapping.alcoholId === selectedWhisky.id)
    : [];
  const connectionAttribute = attributes.find(
    (attribute) => attribute.id === connectionAttributeId
  );
  const keyword = query.trim().toLocaleLowerCase();
  const matchingWhiskyIds = whiskies
    .filter((whisky) => `${whisky.name} ${whisky.region}`.toLocaleLowerCase().includes(keyword))
    .map((whisky) => whisky.id);
  const matchingAttributeIds = attributes
    .filter((attribute) =>
      `${attribute.displayName} ${attribute.key} ${attribute.value}`
        .toLocaleLowerCase()
        .includes(keyword)
    )
    .map((attribute) => attribute.id);
  const filteredAttributes = attributes.filter(
    (attribute) =>
      (type === 'ALL' || attribute.type === type) &&
      (!onlyUnlinked || !mappings.some((mapping) => mapping.attributeId === attribute.id)) &&
      (!keyword ||
        matchingAttributeIds.includes(attribute.id) ||
        mappings.some(
          (mapping) =>
            mapping.attributeId === attribute.id && matchingWhiskyIds.includes(mapping.alcoholId)
        ))
  );
  const filteredWhiskies = whiskies.filter(
    (whisky) =>
      !keyword ||
      matchingWhiskyIds.includes(whisky.id) ||
      mappings.some(
        (mapping) =>
          mapping.alcoholId === whisky.id && matchingAttributeIds.includes(mapping.attributeId)
      )
  );
  const unlinkedCount = attributes.filter(
    (attribute) => !mappings.some((mapping) => mapping.attributeId === attribute.id)
  ).length;

  function openConnections(attributeId: number | undefined) {
    if (attributeId === undefined) return;
    setConnectionAttributeId(attributeId);
    setSelectedAlcoholIds([]);
    setLookup('');
  }

  function addConnections(attributeId: number, alcoholIds: number[]) {
    const uniqueIds = [...new Set(alcoholIds)];
    const created = uniqueIds
      .filter(
        (id) =>
          !mappings.some(
            (mapping) => mapping.attributeId === attributeId && mapping.alcoholId === id
          )
      )
      .map((alcoholId) => ({ id: nextMappingId.current++, alcoholId, attributeId }));
    setMappings((previous) => [...previous, ...created]);
    setNotice(
      `${created.length}개 연결을 추가했습니다.${uniqueIds.length > created.length ? ` 이미 연결된 ${uniqueIds.length - created.length}개는 유지했습니다.` : ''} 모의 데이터에만 반영했습니다.`
    );
  }

  function resetFilters() {
    setQuery('');
    setType('ALL');
    setOnlyUnlinked(false);
  }

  return (
    <div className="attribute-c">
      <header className="c-page-header">
        <div>
          <div className="c-eyebrow">
            CURATOR’S ATLAS <span>C</span>
          </div>
          <h1>위스키를 잇는 공통점</h1>
          <p>하나의 속성에서 시작해, 함께 추천할 위스키를 발견하세요.</p>
        </div>
        <span className="c-demo-badge">디자인 시안 · 모의 데이터</span>
      </header>
      <TabBar
        tabs={tabs}
        value={tab}
        ariaLabel="C안 속성 관리"
        onChange={(value) =>
          setSearchParams((previous) => {
            const next = new URLSearchParams(previous);
            next.set('tab', value);
            return next;
          })
        }
        tools={<span className="c-session-note">변경은 이 화면에서만 유지됩니다</span>}
      />
      <section id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`}>
        <div className="c-workspace-heading">
          <div>
            <h2>{tab === 'attributes' ? '속성 연결망' : '연결 비교'}</h2>
            <p>
              {tab === 'attributes'
                ? '속성을 선택하면 연결된 위스키가 드러납니다.'
                : '같은 속성을 공유하는 위스키를 비교하고, 빈칸을 선택해 연결하세요.'}
            </p>
          </div>
          <Button
            onClick={() =>
              tab === 'attributes'
                ? setDefinition('new')
                : openConnections(selectedAttribute?.id ?? attributes[0]?.id)
            }
            disabled={tab === 'mappings' && attributes.length === 0}
          >
            <Plus />
            {tab === 'attributes' ? '속성 만들기' : '위스키 연결'}
          </Button>
        </div>
        <div className="c-toolbar">
          <div className="c-search">
            <Search size={16} />
            <Input
              aria-label="속성 또는 위스키 검색"
              placeholder="속성, key 또는 위스키 검색"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <select
            aria-label="속성 분류 필터"
            value={type}
            onChange={(event) => setType(event.target.value as AttributeType | 'ALL')}
          >
            <option value="ALL">모든 분류</option>
            {Object.entries(attributeTypes).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
          <label className="c-filter-check">
            <input
              type="checkbox"
              checked={onlyUnlinked}
              onChange={(event) => setOnlyUnlinked(event.target.checked)}
            />
            미연결 속성 <span>{unlinkedCount}</span>
          </label>
          {(query || type !== 'ALL' || onlyUnlinked) && (
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              필터 초기화
            </Button>
          )}
        </div>
        <div className="c-workspace">
          <div className="c-exploration">
            <div className="c-view-meta">
              <span>
                <i className="c-legend-attribute" />
                속성 {filteredAttributes.length}
                <i className="c-legend-whisky" />
                위스키 {filteredWhiskies.length}
              </span>
              <span>
                <GitBranch size={13} />
                전체 직접 연결 {mappings.length}
              </span>
            </div>
            {filteredAttributes.length === 0 ? (
              <div className="c-empty">
                <Search size={32} />
                <h3>
                  {attributes.length
                    ? '조건에 맞는 속성이 없습니다'
                    : '첫 공통 속성을 만들어 보세요'}
                </h3>
                <p>
                  {attributes.length
                    ? '검색어나 분류를 바꾸면 다른 연결을 살펴볼 수 있습니다.'
                    : '속성을 만들고 추천할 위스키를 직접 연결하세요.'}
                </p>
                <Button
                  variant="outline"
                  onClick={attributes.length ? resetFilters : () => setDefinition('new')}
                >
                  {attributes.length ? '필터 초기화' : '속성 만들기'}
                </Button>
              </div>
            ) : tab === 'attributes' ? (
              <RelationshipCanvas
                attributes={filteredAttributes}
                alcohols={filteredWhiskies}
                mappings={mappings}
                selection={selection}
                onSelect={setSelection}
              />
            ) : (
              <div className="c-matrix-scroll">
                <table className="c-matrix">
                  <caption className="sr-only">
                    위스키별 속성 연결 비교. 셀을 선택하면 오른쪽 패널에서 연결하거나 해제할 수
                    있습니다.
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">
                        <span className="c-eyebrow">공통 속성</span>
                        <p>연결을 골라보세요</p>
                      </th>
                      {filteredWhiskies.map((whisky) => (
                        <th key={whisky.id} scope="col">
                          <button onClick={() => setSelection({ kind: 'whisky', id: whisky.id })}>
                            <span className="c-mini-bottle">
                              <Wine size={24} />
                            </span>
                            <strong>{whisky.shortName}</strong>
                            <small>{whisky.region}</small>
                          </button>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAttributes.map((attribute) => (
                      <tr key={attribute.id}>
                        <th scope="row">
                          <button
                            onClick={() => setSelection({ kind: 'attribute', id: attribute.id })}
                          >
                            <span className={`c-category-dot c-type-${attribute.type}`} />
                            {attribute.displayName}
                            <small>{attributeTypes[attribute.type]}</small>
                          </button>
                        </th>
                        {filteredWhiskies.map((whisky) => {
                          const connected = mappings.some(
                            (mapping) =>
                              mapping.alcoholId === whisky.id &&
                              mapping.attributeId === attribute.id
                          );
                          const selected =
                            selection.kind === 'pair' &&
                            selection.alcoholId === whisky.id &&
                            selection.attributeId === attribute.id;
                          return (
                            <td key={whisky.id}>
                              <button
                                className={`c-matrix-cell ${connected ? 'c-connected' : ''} ${selected ? 'c-cell-selected' : ''}`}
                                aria-label={`${whisky.name} / ${attribute.displayName}: ${connected ? '연결됨' : '미연결'}`}
                                aria-pressed={selected}
                                onClick={() =>
                                  setSelection({
                                    kind: 'pair',
                                    alcoholId: whisky.id,
                                    attributeId: attribute.id,
                                  })
                                }
                              >
                                {connected ? <Check size={18} /> : <Plus size={16} />}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="c-explorer-foot">
              <CircleHelp size={15} />
              <p>
                {tab === 'attributes'
                  ? '병 모양은 위스키, 둥근 카드는 공통 속성입니다. 선 하나가 직접 등록한 연결 하나를 뜻합니다.'
                  : '초록색은 연결된 상태입니다. 빈칸을 선택해도 즉시 저장되지 않으며, 옆 패널에서 확인 후 연결합니다.'}
              </p>
            </div>
          </div>
          <aside className="c-inspector" aria-label="선택 항목 상세">
            <div className="c-inspector-kicker">
              <span className="c-eyebrow">INSPECTOR</span>
              <span>
                {selection.kind === 'pair'
                  ? '선택한 연결'
                  : selection.kind === 'attribute'
                    ? '선택한 속성'
                    : '선택한 위스키'}
              </span>
            </div>
            {selection.kind === 'pair' && selectedAttribute && selectedWhisky ? (
              <>
                <div className="c-pair-preview">
                  <Wine size={24} />
                  <strong>{selectedWhisky.name}</strong>
                  <span className="c-pair-line" />
                  <span className={`c-type-pill c-type-${selectedAttribute.type}`}>
                    {selectedAttribute.displayName}
                  </span>
                </div>
                <div className={`c-connection-status ${selectedMapping ? 'c-is-connected' : ''}`}>
                  {selectedMapping ? <Check size={15} /> : <Plus size={15} />}
                  {selectedMapping ? '직접 연결되어 있습니다' : '아직 연결하지 않았습니다'}
                </div>
                <dl className="c-details">
                  <div>
                    <dt>공통 정의</dt>
                    <dd>{attributeMeaning(selectedAttribute)}</dd>
                  </div>
                  <div>
                    <dt>연결 방식</dt>
                    <dd>관리자 직접 선정</dd>
                  </div>
                  {selectedMapping && (
                    <div>
                      <dt>연결 ID</dt>
                      <dd>#{selectedMapping.id}</dd>
                    </div>
                  )}
                </dl>
                <p className="c-inspector-copy">{selectedAttribute.description}</p>
                <p className="c-note">
                  값과 조건은 공통 속성에 저장됩니다. 이 위스키만의 값을 별도로 입력하지 않습니다.
                </p>
                {selectedMapping ? (
                  <Button
                    variant="outline"
                    className="c-full-button"
                    onClick={() => setDeletion({ kind: 'mapping', mapping: selectedMapping })}
                  >
                    <Unlink />이 연결 해제
                  </Button>
                ) : (
                  <Button
                    className="c-full-button"
                    onClick={() => addConnections(selectedAttribute.id, [selectedWhisky.id])}
                  >
                    <Link2 />이 위스키에 연결
                  </Button>
                )}
                <Button
                  variant="ghost"
                  className="c-full-button"
                  onClick={() => setSelection({ kind: 'attribute', id: selectedAttribute.id })}
                >
                  공통 속성 살펴보기
                  <ArrowRight />
                </Button>
              </>
            ) : selectedAttribute ? (
              <>
                <span className={`c-type-pill c-type-${selectedAttribute.type}`}>
                  {attributeTypes[selectedAttribute.type]}
                </span>
                <h3>{selectedAttribute.displayName}</h3>
                <code className="c-key">{selectedAttribute.key}</code>
                <div className="c-meaning">
                  <span>공통 정의</span>
                  <strong>{attributeMeaning(selectedAttribute)}</strong>
                  <small>
                    {selectedAttribute.datatype} ·{' '}
                    {selectedAttribute.operator === 'GTE' ? '이상' : '같음'}
                  </small>
                </div>
                <p className="c-inspector-copy">
                  {selectedAttribute.description || '등록된 설명이 없습니다.'}
                </p>
                {selectedAttribute.operator === 'GTE' && (
                  <p className="c-note">
                    ‘이상’은 속성의 의미입니다. 조건을 충족한 위스키가 자동으로 연결되지는 않습니다.
                  </p>
                )}
                <div className="c-section-label">
                  <h4>함께 연결된 위스키</h4>
                  <span>{attributeMappings.length}</span>
                </div>
                <div className="c-related-list">
                  {attributeMappings.length === 0 && (
                    <p className="c-muted">연결된 위스키가 없습니다. 첫 위스키를 골라보세요.</p>
                  )}
                  {attributeMappings.map((mapping) => {
                    const whisky = whiskies.find((item) => item.id === mapping.alcoholId)!;
                    const otherCommon = mappings.filter(
                      (item) =>
                        item.alcoholId === whisky.id && item.attributeId !== selectedAttribute.id
                    ).length;
                    return (
                      <button
                        key={mapping.id}
                        onClick={() =>
                          setSelection({
                            kind: 'pair',
                            alcoholId: mapping.alcoholId,
                            attributeId: mapping.attributeId,
                          })
                        }
                      >
                        <span className="c-whisky-monogram">{whisky.initial}</span>
                        <span>
                          <strong>{whisky.shortName}</strong>
                          <small>
                            {otherCommon ? `다른 속성 ${otherCommon}개` : '이 속성만 연결'}
                          </small>
                        </span>
                        <ArrowRight size={14} />
                      </button>
                    );
                  })}
                </div>
                <Button
                  className="c-full-button"
                  onClick={() => openConnections(selectedAttribute.id)}
                >
                  <Link2 />
                  위스키 연결
                </Button>
                <div className="c-inspector-actions">
                  <Button variant="outline" onClick={() => setDefinition(selectedAttribute)}>
                    <Pencil />
                    정의 편집
                  </Button>
                  <Button
                    variant="ghost"
                    aria-label={`${selectedAttribute.displayName} 속성 삭제`}
                    onClick={() => setDeletion({ kind: 'attribute', attribute: selectedAttribute })}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </>
            ) : selectedWhisky ? (
              <>
                <div className="c-whisky-hero">
                  <Wine size={38} />
                  <span>{selectedWhisky.region}</span>
                </div>
                <h3>{selectedWhisky.name}</h3>
                <p className="c-muted">싱글 몰트 · {selectedWhisky.abv}</p>
                <div className="c-section-label">
                  <h4>연결된 공통 속성</h4>
                  <span>{whiskyMappings.length}</span>
                </div>
                <div className="c-whisky-attributes">
                  {whiskyMappings.map((mapping) => {
                    const attribute = attributes.find((item) => item.id === mapping.attributeId)!;
                    return (
                      <button
                        key={mapping.id}
                        onClick={() =>
                          setSelection({
                            kind: 'pair',
                            alcoholId: mapping.alcoholId,
                            attributeId: mapping.attributeId,
                          })
                        }
                      >
                        <span className={`c-category-dot c-type-${attribute.type}`} />
                        <span>{attribute.displayName}</span>
                        <ArrowRight size={14} />
                      </button>
                    );
                  })}
                  {whiskyMappings.length === 0 && (
                    <p className="c-note">
                      아직 연결된 속성이 없습니다. 비교 화면에서 추가할 속성을 선택하세요.
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  className="c-full-button"
                  onClick={() => {
                    setSearchParams((previous) => {
                      const next = new URLSearchParams(previous);
                      next.set('tab', 'mappings');
                      return next;
                    });
                    resetFilters();
                  }}
                >
                  연결 비교에서 살펴보기
                  <ArrowRight />
                </Button>
              </>
            ) : (
              <p className="c-muted">속성을 만들거나 위스키를 선택하세요.</p>
            )}
          </aside>
        </div>
      </section>
      <div className="c-status" role="status">
        <span className="c-status-dot" />
        {notice}
      </div>
      {definition !== null && (
        <AttributeDefinitionDialog
          attribute={definition === 'new' ? null : definition}
          count={
            definition === 'new'
              ? 0
              : mappings.filter((mapping) => mapping.attributeId === definition.id).length
          }
          onClose={() => setDefinition(null)}
          onSave={(values) => {
            const editingId = definition === 'new' ? null : definition.id;
            if (
              attributes.some(
                (attribute) =>
                  attribute.id !== editingId &&
                  (attribute.key === values.key || attribute.displayName === values.displayName)
              )
            )
              return '이미 사용 중인 key 또는 표시 이름입니다. 다른 이름을 입력하세요.';
            const saved: Attribute = { ...values, id: editingId ?? nextAttributeId.current++ };
            setAttributes((previous) =>
              editingId
                ? previous.map((attribute) => (attribute.id === editingId ? saved : attribute))
                : [...previous, saved]
            );
            setSelection({ kind: 'attribute', id: saved.id });
            setDefinition(null);
            resetFilters();
            setNotice(
              editingId
                ? '공통 정의를 수정했습니다. 기존 연결은 유지됩니다. 모의 데이터에만 반영했습니다.'
                : '미연결 속성을 만들었습니다. 연결할 위스키를 직접 골라보세요.'
            );
            return undefined;
          }}
        />
      )}
      {deletion !== null && (
        <DeleteConfirmDialog
          open={deletion !== null}
          onOpenChange={(open) => {
            if (!open) setDeletion(null);
          }}
          title={
            deletion?.kind === 'attribute'
              ? `${deletion.attribute.displayName} 속성을 삭제할까요?`
              : '이 위스키와 속성의 연결을 해제할까요?'
          }
          description={
            deletion?.kind === 'attribute'
              ? '공통 속성과 모든 연결을 함께 삭제합니다. 다른 위스키에서도 이 속성이 사라집니다.'
              : '이 연결만 해제합니다. 공통 속성과 다른 위스키의 연결은 유지합니다.'
          }
          warningMessage={
            deletion?.kind === 'attribute'
              ? `연결 ${mappings.filter((mapping) => mapping.attributeId === deletion.attribute.id).length}개가 함께 삭제됩니다.`
              : undefined
          }
          confirmText={deletion?.kind === 'attribute' ? '속성과 연결 삭제' : '연결 해제'}
          onConfirm={() => {
            if (!deletion) return;
            if (deletion.kind === 'attribute') {
              setAttributes((previous) =>
                previous.filter((attribute) => attribute.id !== deletion.attribute.id)
              );
              setMappings((previous) =>
                previous.filter((mapping) => mapping.attributeId !== deletion.attribute.id)
              );
              setSelection({
                kind: 'attribute',
                id:
                  attributes.find((attribute) => attribute.id !== deletion.attribute.id)?.id ?? -1,
              });
              setNotice('공통 속성과 연결을 삭제했습니다. 모의 데이터에만 반영했습니다.');
            } else {
              setMappings((previous) =>
                previous.filter((mapping) => mapping.id !== deletion.mapping.id)
              );
              setNotice(
                '연결을 해제했습니다. 공통 속성은 유지됩니다. 모의 데이터에만 반영했습니다.'
              );
            }
            setDeletion(null);
          }}
        />
      )}
      {connectionAttributeId !== null && (
        <Dialog
          open={connectionAttributeId !== null}
          onOpenChange={(open) => {
            if (!open) setConnectionAttributeId(null);
          }}
        >
          <DialogContent className="attribute-c c-connect-dialog">
            <DialogHeader>
              <DialogTitle>위스키 직접 연결</DialogTitle>
              <DialogDescription>
                공통 속성 하나에 여러 위스키를 연결합니다. 이미 연결된 위스키는 그대로 유지합니다.
              </DialogDescription>
            </DialogHeader>
            <label className="c-field">
              연결할 속성
              <select
                value={connectionAttributeId ?? ''}
                onChange={(event) => setConnectionAttributeId(Number(event.target.value))}
              >
                {attributes.map((attribute) => (
                  <option key={attribute.id} value={attribute.id}>
                    {attribute.displayName}
                  </option>
                ))}
              </select>
            </label>
            {connectionAttribute && (
              <p className="c-note">
                {attributeMeaning(connectionAttribute)} · 조건과 상관없이 관리자가 직접 선택한
                위스키만 연결됩니다.
              </p>
            )}
            <Input
              aria-label="연결할 위스키 검색"
              placeholder="미연결 위스키도 이름으로 검색"
              value={lookup}
              onChange={(event) => setLookup(event.target.value)}
            />
            <div className="c-lookup-list">
              {whiskies
                .filter((whisky) => whisky.name.includes(lookup.trim()))
                .map((whisky) => {
                  const connected = mappings.some(
                    (mapping) =>
                      mapping.alcoholId === whisky.id &&
                      mapping.attributeId === connectionAttributeId
                  );
                  return (
                    <label key={whisky.id}>
                      <input
                        type="checkbox"
                        checked={selectedAlcoholIds.includes(whisky.id)}
                        onChange={(event) =>
                          setSelectedAlcoholIds((previous) =>
                            event.target.checked
                              ? [...previous, whisky.id]
                              : previous.filter((id) => id !== whisky.id)
                          )
                        }
                      />
                      <span className="c-whisky-monogram">{whisky.initial}</span>
                      <span>
                        <strong>{whisky.name}</strong>
                        <small>{whisky.region}</small>
                      </span>
                      <span className={connected ? 'c-already-linked' : 'c-muted'}>
                        {connected ? '이미 연결됨' : '연결 가능'}
                      </span>
                    </label>
                  );
                })}
              {!whiskies.some((whisky) => whisky.name.includes(lookup.trim())) && (
                <p className="c-note">검색 결과가 없습니다. 위스키 이름을 바꿔보세요.</p>
              )}
            </div>
            <div className="c-dialog-actions">
              <span>{selectedAlcoholIds.length}개 선택</span>
              <Button variant="outline" onClick={() => setConnectionAttributeId(null)}>
                취소
              </Button>
              <Button
                disabled={selectedAlcoholIds.length === 0 || !connectionAttribute}
                onClick={() => {
                  if (connectionAttributeId !== null) {
                    addConnections(connectionAttributeId, selectedAlcoholIds);
                    setSelection({ kind: 'attribute', id: connectionAttributeId });
                    setConnectionAttributeId(null);
                  }
                }}
              >
                선택한 위스키 연결
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
