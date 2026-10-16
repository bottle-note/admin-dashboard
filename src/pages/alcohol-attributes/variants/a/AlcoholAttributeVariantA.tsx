import { useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import {
  ArrowRight,
  Check,
  ChevronRight,
  CircleHelp,
  Filter,
  Link2,
  ListFilter,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  Unlink,
  X,
} from 'lucide-react';
import { TabBar } from '@/components/common/TabBar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AttributeRelationshipGraph } from './AttributeRelationshipGraph';
import { AttributeEditor } from './AttributeEditor';
import {
  alcohols,
  displayValue,
  emptyAttribute,
  initialAttributes,
  initialMappings,
  TYPE_LABELS,
  type Attribute,
} from './mock-data';

const tabs = [
  { value: 'attributes', label: '속성관리' },
  { value: 'mappings', label: '속성 연결' },
  { value: 'graph', label: '관계 그래프' },
] as const;
const selectClass =
  'h-9 rounded-md border bg-white px-3 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700';
const toggle = (items: number[], id: number) =>
  items.includes(id) ? items.filter((item) => item !== id) : [...items, id];

export function AlcoholAttributeVariantA() {
  const [params, setParams] = useSearchParams();
  const tab =
    params.get('tab') === 'graph'
      ? 'graph'
      : params.get('tab') === 'mappings'
        ? 'mappings'
        : 'attributes';
  const keyword = params.get('q') ?? '';
  const type = params.get('type') ?? 'ALL';
  const [attributes, setAttributes] = useState(initialAttributes);
  const [mappings, setMappings] = useState(initialMappings);
  const [selectedAttributes, setSelectedAttributes] = useState<number[]>([]);
  const [selectedAlcohols, setSelectedAlcohols] = useState<number[]>([]);
  const [activeAttribute, setActiveAttribute] = useState(101);
  const [activeAlcohol, setActiveAlcohol] = useState(2001);
  const [newAttribute, setNewAttribute] = useState(false);
  const [editorVersion, setEditorVersion] = useState(0);
  const [connectionFilter, setConnectionFilter] = useState('ALL');
  const [attributeQuery, setAttributeQuery] = useState('');
  const [notice, setNotice] = useState(
    '행을 열어 상세 내용을 확인하고, 체크박스로 일괄 작업 대상을 선택하세요.'
  );
  const [confirmation, setConfirmation] = useState<
    { kind: 'delete'; ids: number[] } | { kind: 'unlink'; id: number } | { kind: 'connect' } | null
  >(null);
  const nextAttributeId = useRef(113);
  const nextMappingId = useRef(5021);
  const linkedCount = (id: number) =>
    mappings.filter((mapping) => mapping.attributeId === id).length;
  const active = attributes.find((attribute) => attribute.id === activeAttribute);
  const focusedAlcohol = alcohols.find((alcohol) => alcohol.id === activeAlcohol)!;
  const filteredAttributes = attributes.filter(
    (attribute) =>
      `${attribute.displayName} ${attribute.key} ${attribute.value}`
        .toLowerCase()
        .includes(keyword.trim().toLowerCase()) &&
      (type === 'ALL' || attribute.type === type) &&
      (connectionFilter !== 'EMPTY' || linkedCount(attribute.id) === 0)
  );
  const filteredAlcohols = alcohols.filter((alcohol) => {
    const connected = mappings.filter((mapping) => mapping.alcoholId === alcohol.id);
    return (
      `${alcohol.name} ${alcohol.english} ${alcohol.id}`
        .toLowerCase()
        .includes(keyword.trim().toLowerCase()) &&
      (connectionFilter === 'ALL' ||
        (connectionFilter === 'EMPTY' ? connected.length === 0 : connected.length > 0))
    );
  });
  const candidateAttributes = attributes.filter((attribute) =>
    `${attribute.displayName} ${attribute.key}`
      .toLowerCase()
      .includes(attributeQuery.trim().toLowerCase())
  );
  const pairs = selectedAlcohols.flatMap((alcoholId) =>
    selectedAttributes.map((attributeId) => ({ alcoholId, attributeId }))
  );
  const newPairs = pairs.filter(
    (pair) =>
      !mappings.some(
        (mapping) =>
          mapping.alcoholId === pair.alcoholId && mapping.attributeId === pair.attributeId
      )
  );
  const deleteCount =
    confirmation?.kind === 'delete'
      ? mappings.filter((mapping) => confirmation.ids.includes(mapping.attributeId)).length
      : 0;

  function updateParam(key: string, value: string) {
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        if (value) next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true }
    );
  }
  function changeTab(value: string) {
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        next.set('tab', value);
        next.delete('q');
        next.delete('type');
        return next;
      },
      { replace: true }
    );
    setConnectionFilter('ALL');
  }
  function saveAttribute(attribute: Attribute) {
    if (
      attributes.some(
        (item) => item.id !== attribute.id && item.displayName === attribute.displayName
      )
    )
      return '같은 이름의 속성이 있습니다. 다른 이름을 입력하세요.';
    if (!attribute.id && attributes.some((item) => item.key === attribute.key))
      return '이미 등록된 키입니다. 기존 속성을 열어 수정하세요.';
    const saved = { ...attribute, id: attribute.id || nextAttributeId.current++ };
    setAttributes((previous) =>
      attribute.id
        ? previous.map((item) => (item.id === attribute.id ? saved : item))
        : [...previous, saved]
    );
    setActiveAttribute(saved.id);
    setNewAttribute(false);
    setEditorVersion((previous) => previous + 1);
    setNotice(
      `“${saved.displayName}” ${attribute.id ? '변경을 저장' : '속성을 등록'}했습니다. 이 화면의 모의 데이터에만 반영됩니다.`
    );
    return undefined;
  }
  function confirmAction() {
    if (confirmation?.kind === 'delete') {
      setAttributes((previous) =>
        previous.filter((attribute) => !confirmation.ids.includes(attribute.id))
      );
      setMappings((previous) =>
        previous.filter((mapping) => !confirmation.ids.includes(mapping.attributeId))
      );
      setSelectedAttributes((previous) => previous.filter((id) => !confirmation.ids.includes(id)));
      setNotice(
        `속성 ${confirmation.ids.length}개와 연결 ${deleteCount}개를 삭제했습니다. 모의 데이터에만 반영됩니다.`
      );
    } else if (confirmation?.kind === 'unlink') {
      setMappings((previous) => previous.filter((mapping) => mapping.id !== confirmation.id));
      setNotice('연결 1개를 해제했습니다. 공통 속성은 사전에 남아 있습니다.');
    } else if (confirmation?.kind === 'connect') {
      setMappings((previous) => [
        ...previous,
        ...newPairs.map((pair) => ({ ...pair, id: nextMappingId.current++ })),
      ]);
      setNotice(
        `연결 ${newPairs.length}개를 추가하고 기존 연결 ${pairs.length - newPairs.length}개는 건너뛰었습니다.`
      );
    }
    setConfirmation(null);
  }
  function selectVisible(ids: number[], selected: number[], setSelected: (ids: number[]) => void) {
    const allSelected = ids.every((id) => selected.includes(id));
    setSelected(
      allSelected ? selected.filter((id) => !ids.includes(id)) : [...new Set([...selected, ...ids])]
    );
  }
  const visibleIds =
    tab === 'attributes'
      ? filteredAttributes.map((attribute) => attribute.id)
      : filteredAlcohols.map((alcohol) => alcohol.id);
  const selected = tab === 'attributes' ? selectedAttributes : selectedAlcohols;
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.includes(id));
  const partlySelected = visibleIds.some((id) => selected.includes(id));

  return (
    <div className="flex min-w-0 flex-col gap-3 text-xs text-slate-800 [&_button]:text-xs [&_input]:text-xs [&_td]:text-xs [&_th]:text-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-teal-200 bg-teal-50 px-4 py-2 text-xs text-teal-900">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded bg-teal-800 font-mono font-semibold text-white">
            <SlidersHorizontal className="h-4 w-4" />
          </span>
          <strong>속성 관리</strong>
          <span className="text-teal-700">디자인 시안 · 모의 데이터</span>
        </div>
        <span>변경은 현재 화면에서만 유지됩니다.</span>
      </div>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-1 text-[11px] font-medium tracking-[0.14em] text-slate-500">
            BOTTLE NOTE / ATTRIBUTE WORKSPACE
          </p>
          <h1 className="text-xl font-bold tracking-tight">위스키 속성 관리</h1>
          <p className="mt-1 text-sm text-slate-500">
            목록에서 빠르게 찾고, 선택한 항목을 한 번에 처리하세요.
          </p>
        </div>
        <div className="flex gap-5 text-xs text-slate-500">
          <span>
            공통 속성{' '}
            <strong className="ml-1 font-mono text-base text-slate-800">{attributes.length}</strong>
          </span>
          <span>
            전체 연결{' '}
            <strong className="ml-1 font-mono text-base text-slate-800">{mappings.length}</strong>
          </span>
          <span>
            미연결 속성{' '}
            <strong className="ml-1 font-mono text-base text-amber-700">
              {attributes.filter((attribute) => linkedCount(attribute.id) === 0).length}
            </strong>
          </span>
        </div>
      </header>
      <div
        onKeyDown={(event) => {
          if (
            (event.key === 'ArrowRight' || event.key === 'ArrowLeft') &&
            (event.target as HTMLElement).getAttribute('role') === 'tab'
          ) {
            event.preventDefault();
            const index = tabs.findIndex((item) => item.value === tab);
            const next =
              tabs[(index + (event.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length]!
                .value;
            changeTab(next);
            document.getElementById(`tab-${next}`)?.focus();
          }
        }}
      >
        <TabBar
          tabs={tabs}
          value={tab}
          onChange={changeTab}
          ariaLabel="속성 작업"
          tools={
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              {tab === 'graph' ? '조회 전용' : '목록 + 상세 패널'}
            </span>
          }
        />
      </div>
      <section
        role="tabpanel"
        id={`panel-${tab}`}
        aria-labelledby={`tab-${tab}`}
        className="min-w-0"
      >
        {tab === 'graph' ? (
          <AttributeRelationshipGraph
            attributes={attributes}
            alcohols={alcohols}
            mappings={mappings}
          />
        ) : (
          <div className="grid min-w-0 items-start gap-3 lg:grid-cols-[minmax(0,7fr)_minmax(0,3fr)]">
            <div className="min-w-0 overflow-hidden rounded-lg border bg-white">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b p-3">
                <div className="flex items-center gap-2">
                  <ListFilter className="h-4 w-4 text-teal-800" />
                  <h2 className="text-sm font-semibold">
                    {tab === 'attributes' ? '공통 속성 사전' : '위스키 목록'}
                  </h2>
                  <Badge variant="secondary" className="font-mono text-[11px]">
                    {visibleIds.length}
                  </Badge>
                </div>
                {tab === 'attributes' ? (
                  <Button
                    size="sm"
                    className="bg-teal-800 hover:bg-teal-900"
                    onClick={() => {
                      setNewAttribute(true);
                      setEditorVersion((previous) => previous + 1);
                    }}
                  >
                    <Plus />
                    속성 만들기
                  </Button>
                ) : (
                  <span className="text-xs text-slate-500">미연결 위스키도 검색합니다.</span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 border-b bg-slate-50/70 p-3">
                <div className="relative min-w-44 flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    aria-label={tab === 'attributes' ? '속성 검색' : '위스키 검색'}
                    value={keyword}
                    onChange={(event) => updateParam('q', event.target.value)}
                    placeholder={
                      tab === 'attributes' ? '속성 이름, 키, 값 검색' : '위스키 이름 또는 ID 검색'
                    }
                    className="bg-white pl-9 text-xs"
                  />
                </div>
                {tab === 'attributes' && (
                  <select
                    aria-label="분류 필터"
                    value={type}
                    onChange={(event) => updateParam('type', event.target.value)}
                    className={selectClass}
                  >
                    <option value="ALL">모든 분류</option>
                    {Object.entries(TYPE_LABELS).map(([value, label]) => (
                      <option value={value} key={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                )}
                <select
                  aria-label="연결 상태 필터"
                  value={connectionFilter}
                  onChange={(event) => setConnectionFilter(event.target.value)}
                  className={selectClass}
                >
                  <option value="ALL">전체 상태</option>
                  <option value="EMPTY">미연결만</option>
                  {tab === 'mappings' && <option value="LINKED">연결된 위스키</option>}
                </select>
                {(keyword || type !== 'ALL' || connectionFilter !== 'ALL') && (
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="필터 초기화"
                    onClick={() => {
                      setParams(
                        (previous) => {
                          const next = new URLSearchParams(previous);
                          next.delete('q');
                          next.delete('type');
                          return next;
                        },
                        { replace: true }
                      );
                      setConnectionFilter('ALL');
                    }}
                  >
                    <X />
                  </Button>
                )}
              </div>
              {tab === 'attributes' && (
                <div className="flex flex-wrap gap-1.5 border-b px-3 py-2">
                  {(
                    [
                      ['ALL', '전체'],
                      ['KEYWORD', '키워드'],
                      ['PRICE', '가격'],
                      ['POPULARITY', '대중성'],
                      ['NOTE', '메모'],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={type === value}
                      onClick={() => updateParam('type', value)}
                      className={`rounded px-2.5 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 ${type === value ? 'bg-slate-800 font-medium text-white' : 'text-slate-500 hover:bg-slate-100'}`}
                    >
                      {label}{' '}
                      <span className="ml-1 font-mono opacity-75">
                        {value === 'ALL'
                          ? attributes.length
                          : attributes.filter((attribute) => attribute.type === value).length}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              <div
                className={`flex min-h-9 flex-wrap items-center justify-between gap-2 border-b px-3 py-2 text-xs ${selected.length ? 'bg-teal-50 text-teal-900' : 'bg-white text-slate-500'}`}
              >
                <span>
                  {selected.length ? (
                    <>
                      <strong>{selected.length}개 선택</strong> · 검색해도 선택은 유지됩니다.
                    </>
                  ) : (
                    '체크박스로 여러 항목을 선택하세요.'
                  )}
                </span>
                <div className="flex gap-1">
                  {selected.length > 0 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        tab === 'attributes' ? setSelectedAttributes([]) : setSelectedAlcohols([])
                      }
                    >
                      선택 해제
                    </Button>
                  )}
                  {tab === 'attributes' && selectedAttributes.length > 0 && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => changeTab('mappings')}>
                        <Link2 />
                        위스키 연결
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-700 hover:bg-red-50 hover:text-red-800"
                        onClick={() => setConfirmation({ kind: 'delete', ids: selectedAttributes })}
                      >
                        <Trash2 />
                        삭제
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <Table className="text-xs [&_td]:!py-1.5">
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="w-10 pl-4">
                      <Checkbox
                        aria-label="현재 목록 전체 선택"
                        checked={allSelected ? true : partlySelected ? 'indeterminate' : false}
                        disabled={!visibleIds.length}
                        onCheckedChange={() =>
                          selectVisible(
                            visibleIds,
                            selected,
                            tab === 'attributes' ? setSelectedAttributes : setSelectedAlcohols
                          )
                        }
                      />
                    </TableHead>
                    <TableHead>
                      {tab === 'attributes' ? '속성 이름 / 고유 키' : '위스키 / ID'}
                    </TableHead>
                    {tab === 'attributes' ? (
                      <>
                        <TableHead>분류</TableHead>
                        <TableHead>값 · 조건</TableHead>
                        <TableHead className="text-right">연결</TableHead>
                      </>
                    ) : (
                      <>
                        <TableHead>분류</TableHead>
                        <TableHead>연결된 속성</TableHead>
                      </>
                    )}
                    <TableHead className="w-8">
                      <span className="sr-only">상세</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tab === 'attributes'
                    ? filteredAttributes.map((attribute) => (
                        <TableRow
                          key={attribute.id}
                          className={
                            activeAttribute === attribute.id && !newAttribute
                              ? 'bg-teal-50/60 hover:bg-teal-50'
                              : ''
                          }
                        >
                          <TableCell className="pl-4">
                            <Checkbox
                              aria-label={`${attribute.displayName} 선택`}
                              checked={selectedAttributes.includes(attribute.id)}
                              onCheckedChange={() =>
                                setSelectedAttributes((previous) => toggle(previous, attribute.id))
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <button
                              className="block text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700"
                              onClick={() => {
                                setActiveAttribute(attribute.id);
                                setNewAttribute(false);
                              }}
                            >
                              <span className="block whitespace-nowrap font-semibold text-slate-800">
                                {attribute.displayName}
                              </span>
                              <span className="mt-1 block font-mono text-[10px] text-slate-400">
                                {attribute.key}
                              </span>
                            </button>
                          </TableCell>
                          <TableCell>
                            <span
                              className={`whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] ${attribute.type === 'PRICE' ? 'bg-amber-50 text-amber-800' : attribute.type === 'KEYWORD' ? 'bg-sky-50 text-sky-800' : 'bg-slate-100 text-slate-600'}`}
                            >
                              {TYPE_LABELS[attribute.type]}
                            </span>
                          </TableCell>
                          <TableCell className="whitespace-nowrap font-mono text-[11px] text-slate-600">
                            {displayValue(attribute)}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            <span
                              className={
                                linkedCount(attribute.id) ? 'text-slate-700' : 'text-amber-700'
                              }
                            >
                              {linkedCount(attribute.id)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <ChevronRight
                              className={`h-3.5 w-3.5 ${activeAttribute === attribute.id ? 'text-teal-700' : 'text-slate-300'}`}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    : filteredAlcohols.map((alcohol) => {
                        const linked = mappings.filter(
                          (mapping) => mapping.alcoholId === alcohol.id
                        );
                        return (
                          <TableRow
                            key={alcohol.id}
                            className={
                              activeAlcohol === alcohol.id ? 'bg-teal-50/60 hover:bg-teal-50' : ''
                            }
                          >
                            <TableCell className="pl-4">
                              <Checkbox
                                aria-label={`${alcohol.name} 선택`}
                                checked={selectedAlcohols.includes(alcohol.id)}
                                onCheckedChange={() =>
                                  setSelectedAlcohols((previous) => toggle(previous, alcohol.id))
                                }
                              />
                            </TableCell>
                            <TableCell>
                              <button
                                className="block text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700"
                                onClick={() => setActiveAlcohol(alcohol.id)}
                              >
                                <span className="block whitespace-nowrap font-semibold">
                                  {alcohol.name}
                                </span>
                                <span className="mt-1 block text-[10px] text-slate-400">
                                  <span className="font-mono">#{alcohol.id}</span> ·{' '}
                                  {alcohol.region}
                                </span>
                              </button>
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-slate-500">
                              {alcohol.category}
                            </TableCell>
                            <TableCell>
                              <div className="flex max-w-64 flex-wrap gap-1">
                                {linked.length ? (
                                  linked.map((mapping) => (
                                    <span
                                      key={mapping.id}
                                      className="whitespace-nowrap rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] text-slate-600"
                                    >
                                      {
                                        attributes.find(
                                          (attribute) => attribute.id === mapping.attributeId
                                        )?.displayName
                                      }
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-amber-700">미연결</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  {!visibleIds.length && (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <div className="flex flex-col items-center gap-2 py-12 text-slate-500">
                          <Filter className="h-6 w-6 text-slate-300" />
                          <p className="font-medium">검색 조건에 맞는 항목이 없습니다.</p>
                          <p>검색어와 필터를 바꿔 다시 찾아보세요.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              <div className="flex flex-wrap items-center justify-between gap-2 border-t bg-slate-50 px-4 py-3 text-[11px] text-slate-500">
                <span>
                  {visibleIds.length ? `1–${visibleIds.length}` : '0'} / {visibleIds.length}개 ·
                  모의 목록 전체 표시
                </span>
                <span>이름을 클릭하면 오른쪽에 상세가 열립니다.</span>
              </div>
            </div>
            <aside
              className="min-w-0 overflow-hidden rounded-lg border bg-white lg:sticky lg:top-3"
              aria-label={tab === 'attributes' ? '속성 상세 패널' : '연결 작업 패널'}
            >
              {tab === 'attributes' ? (
                newAttribute || active ? (
                  <>
                    <AttributeEditor
                      key={`${newAttribute ? 'new' : activeAttribute}-${editorVersion}`}
                      attribute={newAttribute ? emptyAttribute : active!}
                      linkedCount={newAttribute ? 0 : linkedCount(activeAttribute)}
                      onSave={saveAttribute}
                      onCancel={() => {
                        setNewAttribute(false);
                        setEditorVersion((previous) => previous + 1);
                      }}
                    />
                    {!newAttribute && active && (
                      <div className="border-t p-3">
                        <div className="mb-3 flex items-center justify-between">
                          <h3 className="text-xs font-semibold">
                            연결된 위스키{' '}
                            <span className="ml-1 font-mono text-teal-700">
                              {linkedCount(active.id)}
                            </span>
                          </h3>
                          <button
                            className="text-[11px] text-teal-800 underline-offset-2 hover:underline"
                            onClick={() => {
                              setSelectedAttributes([active.id]);
                              changeTab('mappings');
                            }}
                          >
                            연결 관리
                          </button>
                        </div>
                        <div className="space-y-2">
                          {mappings
                            .filter((mapping) => mapping.attributeId === active.id)
                            .map((mapping) => (
                              <div
                                key={mapping.id}
                                className="flex items-center justify-between gap-2 text-xs"
                              >
                                <span className="truncate text-slate-600">
                                  {
                                    alcohols.find((alcohol) => alcohol.id === mapping.alcoholId)
                                      ?.name
                                  }
                                </span>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6 shrink-0 text-slate-400 hover:text-red-700"
                                  aria-label={`${alcohols.find((alcohol) => alcohol.id === mapping.alcoholId)?.name} 연결 해제`}
                                  onClick={() =>
                                    setConfirmation({ kind: 'unlink', id: mapping.id })
                                  }
                                >
                                  <Unlink className="!h-3 !w-3" />
                                </Button>
                              </div>
                            ))}
                          {!linkedCount(active.id) && (
                            <p className="text-xs text-slate-500">아직 연결된 위스키가 없습니다.</p>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-8 text-center text-sm text-slate-500">
                    목록에서 속성을 선택하세요.
                  </div>
                )
              ) : (
                <>
                  <div className="border-b bg-slate-800 p-3 text-white">
                    <div className="mb-2 flex items-center justify-between">
                      <h2 className="flex items-center gap-2 text-sm font-semibold">
                        <Link2 className="h-4 w-4" />
                        일괄 연결 작업
                      </h2>
                      <span className="rounded bg-white/10 px-2 py-0.5 font-mono text-[10px]">
                        최대 500쌍
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-slate-300">
                      왼쪽에서 위스키를 고르고 아래에서 속성을 선택하세요.
                    </p>
                  </div>
                  <div className="border-b p-3">
                    <div className="mb-3 flex items-center gap-2 text-xs">
                      <span className="rounded bg-slate-100 px-2 py-1">
                        위스키 <strong>{selectedAlcohols.length}</strong>개
                      </span>
                      <X className="h-3 w-3 text-slate-400" />
                      <span className="rounded bg-slate-100 px-2 py-1">
                        속성 <strong>{selectedAttributes.length}</strong>개
                      </span>
                      <ArrowRight className="h-3 w-3 text-slate-400" />
                      <strong className="text-teal-800">{pairs.length}쌍</strong>
                    </div>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                      <Input
                        aria-label="연결할 속성 검색"
                        value={attributeQuery}
                        onChange={(event) => setAttributeQuery(event.target.value)}
                        placeholder="연결할 속성 찾기"
                        className="pl-8 text-xs"
                      />
                    </div>
                    <div className="mt-2 max-h-60 overflow-y-auto pr-1">
                      {candidateAttributes.map((attribute) => (
                        <label
                          key={attribute.id}
                          className={`flex cursor-pointer items-center gap-2 rounded px-2 py-2 text-xs hover:bg-slate-50 ${selectedAttributes.includes(attribute.id) ? 'bg-teal-50' : ''}`}
                        >
                          <Checkbox
                            checked={selectedAttributes.includes(attribute.id)}
                            onCheckedChange={() =>
                              setSelectedAttributes((previous) => toggle(previous, attribute.id))
                            }
                          />
                          <span className="flex-1">{attribute.displayName}</span>
                          <span className="text-[10px] text-slate-400">
                            {TYPE_LABELS[attribute.type]}
                          </span>
                        </label>
                      ))}
                      {!candidateAttributes.length && (
                        <p className="py-4 text-xs text-slate-500">일치하는 속성이 없습니다.</p>
                      )}
                    </div>
                    {selectedAttributes.length > 0 && (
                      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                        <span>속성 {selectedAttributes.length}개 선택됨</span>
                        <button
                          className="text-teal-800 hover:underline"
                          onClick={() => setSelectedAttributes([])}
                        >
                          모두 해제
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="space-y-3 border-b bg-teal-50/50 p-3">
                    <div className="flex items-center justify-between text-xs">
                      <span>새로 연결</span>
                      <strong className="font-mono text-teal-800">{newPairs.length}쌍</strong>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>이미 연결됨 · 건너뛰기</span>
                      <span className="font-mono">{pairs.length - newPairs.length}쌍</span>
                    </div>
                    <Button
                      className="w-full bg-teal-800 hover:bg-teal-900"
                      size="sm"
                      disabled={!pairs.length || pairs.length > 500}
                      onClick={() => setConfirmation({ kind: 'connect' })}
                    >
                      <Link2 />
                      {pairs.length ? `${pairs.length}쌍 연결 검토` : '위스키와 속성을 선택하세요'}
                    </Button>
                    {pairs.length > 500 && (
                      <p role="alert" className="text-xs text-red-700">
                        500쌍 이하로 나눠 선택하세요.
                      </p>
                    )}
                    <p className="text-[10px] leading-relaxed text-slate-500">
                      중복 연결은 건너뛰며 기존 연결 정보는 유지합니다.
                    </p>
                  </div>
                  <div className="p-3">
                    <p className="mb-1 text-[10px] text-slate-500">선택 행의 현재 연결</p>
                    <h3 className="text-sm font-semibold">{focusedAlcohol.name}</h3>
                    <div className="mt-3 space-y-1">
                      {mappings
                        .filter((mapping) => mapping.alcoholId === activeAlcohol)
                        .map((mapping) => (
                          <div
                            key={mapping.id}
                            className="flex items-center justify-between rounded bg-slate-50 px-2 py-1"
                          >
                            <span className="text-xs">
                              {
                                attributes.find((attribute) => attribute.id === mapping.attributeId)
                                  ?.displayName
                              }
                            </span>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-slate-400 hover:text-red-700"
                              aria-label={`${attributes.find((attribute) => attribute.id === mapping.attributeId)?.displayName} 연결 해제`}
                              onClick={() => setConfirmation({ kind: 'unlink', id: mapping.id })}
                            >
                              <Unlink className="!h-3.5 !w-3.5" />
                            </Button>
                          </div>
                        ))}
                      {!mappings.some((mapping) => mapping.alcoholId === activeAlcohol) && (
                        <p className="text-xs text-slate-500">
                          연결된 속성이 없습니다. 위스키를 체크해 첫 속성을 연결하세요.
                        </p>
                      )}
                    </div>
                    <p className="mt-3 text-[10px] text-slate-400">
                      연결을 해제해도 공통 속성은 삭제되지 않습니다.
                    </p>
                  </div>
                </>
              )}
            </aside>
          </div>
        )}
      </section>
      <div
        role="status"
        aria-live="polite"
        className="flex items-start gap-2 rounded-md border bg-white px-3 py-2.5 text-xs leading-relaxed text-slate-600"
      >
        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-700" />
        {notice}
      </div>
      <p className="flex items-center gap-1.5 text-[11px] text-slate-400">
        <CircleHelp className="h-3.5 w-3.5" />
        속성은 공통 사전입니다. 값과 조건을 수정하면 연결된 모든 위스키가 같은 변경을 공유합니다.
      </p>
      <Dialog
        open={confirmation !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmation(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmation?.kind === 'delete'
                ? '선택한 속성을 삭제할까요?'
                : confirmation?.kind === 'unlink'
                  ? '이 연결을 해제할까요?'
                  : '일괄 연결을 확인하세요'}
            </DialogTitle>
            <DialogDescription>
              {confirmation?.kind === 'delete'
                ? `속성 ${confirmation.ids.length}개와 이 속성에 연결된 ${deleteCount}개의 연결을 모두 삭제합니다. 위스키는 삭제되지 않습니다.`
                : confirmation?.kind === 'unlink'
                  ? '이 위스키와 속성 사이의 연결만 해제합니다. 속성은 공통 사전에 유지됩니다.'
                  : `선택한 위스키 ${selectedAlcohols.length}개에 속성 ${selectedAttributes.length}개를 연결합니다. 새 연결 ${newPairs.length}개를 추가하고 중복 ${pairs.length - newPairs.length}개는 건너뜁니다.`}
            </DialogDescription>
          </DialogHeader>
          {confirmation?.kind === 'connect' && (
            <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border bg-slate-50 p-3 text-xs">
              <p className="font-semibold">연결할 속성</p>
              {attributes
                .filter((attribute) => selectedAttributes.includes(attribute.id))
                .map((attribute) => (
                  <p key={attribute.id}>
                    {attribute.displayName}
                    <span className="ml-2 text-slate-500">{displayValue(attribute)}</span>
                  </p>
                ))}
            </div>
          )}
          <p className="text-xs text-slate-500">디자인 시안의 모의 데이터에만 적용합니다.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmation(null)}>
              취소
            </Button>
            <Button
              variant={confirmation?.kind === 'connect' ? 'default' : 'destructive'}
              onClick={confirmAction}
            >
              {confirmation?.kind === 'delete'
                ? '속성과 연결 삭제'
                : confirmation?.kind === 'unlink'
                  ? '연결 해제'
                  : '연결 적용'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
