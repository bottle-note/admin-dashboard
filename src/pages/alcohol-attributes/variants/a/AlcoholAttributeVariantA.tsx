import { useState } from 'react';
import { AttributeGroupsPanel } from './AttributeGroupsPanel';
import { AttributeGroupFilter } from './AttributeGroupFilter';
import { AttributeSearchBuilder } from './AttributeSearchBuilder';
import { readAttributeSearch, readGroupIds, type AttributeSearch } from './attribute-search';
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
import { AttributeGraphPanel } from './AttributeGraphPanel';
import { MappingValueEditor } from './MappingValueEditor';
import { AttributeEditor } from './AttributeEditor';
import {
  displayValue,
  valueError,
  emptyAttribute,
  TYPE_LABELS,
  type Attribute,
} from './attribute-model';

import {
  useAlcoholAttributes,
  useAttributeSummary,
  useAttributeAlcoholLookup,
  useAttributedAlcohols,
  useCompoundAlcoholSearch,
  useAlcoholAttributeCreate,
  useAlcoholAttributeUpdate,
  useAlcoholAttributeBatchDelete,
  useAttributeLink,
  useAttributeUnlink,
  useAttributeMappingUpdate,
} from '@/hooks/useAlcoholAttributes';
import { getErrorMessage } from '@/lib/api-error';
import type { AttributeType } from '@/types/api/alcohol-attribute.api';

const tabs = [
  { value: 'attributes', label: '속성관리' },
  { value: 'groups', label: '속성 그룹' },
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
    params.get('tab') === 'groups'
      ? 'groups'
      : params.get('tab') === 'graph'
        ? 'graph'
        : params.get('tab') === 'mappings'
          ? 'mappings'
          : 'attributes';
  const groupIds = readGroupIds(params);
  const compound = readAttributeSearch(params);
  const advanced = params.has('conditions');
  const keyword = params.get('q') ?? '';
  const type = params.get('type') ?? 'ALL';
  const attributeKey = params.get('attributeKey') ?? '';
  const filterValue = params.get('attributeValue') ?? '';
  const missingKey = params.get('missingKey') ?? '';
  const linkedOnly =
    params.get('linkedOnly') === 'true' ||
    !!attributeKey ||
    !!filterValue ||
    !!missingKey ||
    type !== 'ALL' ||
    groupIds.length > 0;
  const rawPage = Number(params.get('page'));
  const page = Number.isSafeInteger(rawPage) && rawPage >= 0 ? rawPage : 0;
  const [selectedAttributes, setSelectedAttributeIds] = useState<number[]>([]);
  const [selectedAlcohols, setSelectedAlcoholIds] = useState<number[]>([]);
  const [activeAttribute, setActiveAttribute] = useState<number | null>(null);
  const [activeAlcohol, setActiveAlcohol] = useState<number | null>(null);
  const [attributeQuery, setAttributeQuery] = useState('');
  const [optionPage, setOptionPage] = useState(0);
  const [detailPage, setDetailPage] = useState(0);
  const [retainedAttributes, setRetainedAttributes] = useState<Attribute[]>([]);
  const options = useAlcoholAttributes(
    { keyword: attributeQuery || undefined, page: optionPage, size: 20 },
    tab === 'mappings'
  );
  const filterDefinition = useAlcoholAttributes(
    { keyword: attributeKey, page: 0, size: 20 },
    tab === 'mappings' && !!attributeKey
  );
  const missingDefinition = useAlcoholAttributes(
    { keyword: missingKey, page: 0, size: 20 },
    tab === 'mappings' && !!missingKey
  );
  const filterAttribute = filterDefinition.data?.items.find(
    (attribute) => attribute.key === attributeKey
  );
  const canCompare =
    !!filterAttribute &&
    ['INT', 'DOUBLE'].includes(filterAttribute.datatype) &&
    !valueError(filterAttribute.datatype, filterValue);
  const filterOperator: 'GTE' | 'EQ' =
    params.get('operator') === 'GTE' && canCompare ? 'GTE' : 'EQ';
  const dictionary = useAlcoholAttributes(
    {
      keyword: keyword || undefined,
      type: type in TYPE_LABELS ? (type as AttributeType) : undefined,
      groupIds: groupIds.length ? groupIds : undefined,
      page,
      size: 20,
    },
    tab === 'attributes'
  );
  const lookup = useAttributeAlcoholLookup(
    keyword,
    page,
    tab === 'mappings' && !linkedOnly && !advanced
  );
  const linkedLookup = useAttributedAlcohols(
    {
      keyword: keyword || undefined,
      type: type in TYPE_LABELS ? (type as AttributeType) : undefined,
      groupIds: groupIds.length ? groupIds : undefined,
      key: attributeKey || undefined,
      value: filterValue.trim() || undefined,
      operator: filterOperator,
      missingKey: missingKey || undefined,
      page,
      size: 20,
    },
    tab === 'mappings' && !advanced && linkedOnly && (!attributeKey || filterDefinition.isSuccess)
  );
  const compoundLookup = useCompoundAlcoholSearch(
    {
      keyword: keyword || undefined,
      ...compound.value,
      type: type in TYPE_LABELS ? (type as AttributeType) : undefined,
      groupIds: groupIds.length ? groupIds : undefined,
      linkedOnly: params.get('linkedOnly') === 'true',
      page,
      size: 20,
    },
    tab === 'mappings' && advanced && !compound.error
  );
  const alcoholQuery = advanced ? compoundLookup : linkedOnly ? linkedLookup : lookup;
  const initialSearch: AttributeSearch = advanced
    ? compound.value
    : {
        match: 'AND',
        conditions: [
          ...(attributeKey
            ? [
                {
                  key: attributeKey,
                  operator: filterValue ? filterOperator : ('EXISTS' as const),
                  ...(filterValue ? { value: filterValue } : {}),
                },
              ]
            : []),
          ...(missingKey ? [{ key: missingKey, operator: 'NOT_EXISTS' as const }] : []),
        ],
      };
  const applySearch = (search: AttributeSearch) => {
    setActiveAlcohol(null);
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        next.set('conditions', JSON.stringify(search.conditions));
        next.set('match', search.match);
        ['attributeKey', 'attributeValue', 'operator', 'missingKey', 'page'].forEach((key) =>
          next.delete(key)
        );
        return next;
      },
      { replace: false }
    );
  };
  const create = useAlcoholAttributeCreate();
  const update = useAlcoholAttributeUpdate();
  const remove = useAlcoholAttributeBatchDelete();
  const link = useAttributeLink();
  const unlink = useAttributeUnlink();
  const [actionError, setActionError] = useState<string | null>(null);
  const mappingUpdate = useAttributeMappingUpdate();
  const [pairValues, setPairValues] = useState<Record<string, string>>({});
  const pending =
    mappingUpdate.isPending ||
    create.isPending ||
    update.isPending ||
    remove.isPending ||
    link.isPending ||
    unlink.isPending;
  const toAttribute = (
    item: { unit: string | null; description: string | null } & Omit<
      Attribute,
      'unit' | 'description'
    >
  ): Attribute => ({
    id: item.id,
    key: item.key,
    displayName: item.displayName,
    type: item.type,
    datatype: item.datatype,
    unit: item.unit ?? '',
    description: item.description ?? '',
    groupId: item.groupId ?? null,
  });
  const active =
    (dictionary.data?.items.map(toAttribute) ?? []).find((item) => item.id === activeAttribute) ??
    retainedAttributes.find((item) => item.id === activeAttribute) ??
    (activeAttribute === null && dictionary.data?.items[0]
      ? toAttribute(dictionary.data.items[0])
      : undefined);
  const detail = useAttributedAlcohols(
    { key: active?.key, page: detailPage, size: 20 },
    tab === 'attributes' && !!active
  );
  const pageIds = (alcoholQuery.data?.items ?? []).map((item) => item.alcoholId);
  const pageSummary = useAttributeSummary(
    tab === 'mappings' ? [...new Set([...pageIds, ...(activeAlcohol ? [activeAlcohol] : [])])] : []
  );
  const selectionSummary = useAttributeSummary(tab === 'mappings' ? selectedAlcohols : []);
  const summaries = [...(pageSummary.data ?? []), ...(selectionSummary.data ?? [])];
  const attributes = [
    ...new Map(
      [
        ...retainedAttributes,
        ...(options.data?.items ?? []).map(toAttribute),
        ...(filterDefinition.data?.items ?? []).map(toAttribute),
        ...(missingDefinition.data?.items ?? []).map(toAttribute),
        ...(dictionary.data?.items ?? []).map(toAttribute),
        ...summaries.map((item) => toAttribute(item.attribute)),
      ].map((item) => [item.id, item])
    ).values(),
  ];
  function setSelectedAttributes(next: number[] | ((previous: number[]) => number[])) {
    const ids = typeof next === 'function' ? next(selectedAttributes) : next;
    setSelectedAttributeIds(ids);
    setRetainedAttributes((previous) => [
      ...new Map(
        [...previous, ...attributes.filter((item) => ids.includes(item.id))].map((item) => [
          item.id,
          item,
        ])
      ).values(),
    ]);
  }
  const detailMappings = (detail.data?.items ?? []).flatMap((alcohol) =>
    alcohol.attributes
      .filter((item) => item.attribute.id === active?.id)
      .map((item) => ({
        id: item.mappingId,
        alcoholId: alcohol.alcoholId,
        attributeId: item.attribute.id,
        value: item.value,
      }))
  );
  const mappings =
    tab === 'attributes'
      ? detailMappings
      : [
          ...new Map(
            summaries.flatMap((item) => item.mappings).map((item) => [item.id, item])
          ).values(),
        ];
  const connectedAlcohols = (detail.data?.items ?? []).map((item) => ({
    id: item.alcoholId,
    name: item.korName,
    english: item.engName ?? '',
    category: item.korCategory ?? '',
    region: '',
    imageUrl: item.imageUrl,
  }));
  const lookupAlcohols =
    linkedOnly || advanced
      ? ((advanced ? compoundLookup : linkedLookup).data?.items ?? []).map((item) => ({
          id: item.alcoholId,
          name: item.korName,
          english: item.engName ?? '',
          category: item.korCategory ?? '',
          region: '',
          imageUrl: item.imageUrl,
        }))
      : (lookup.data?.items ?? []).map((item) => ({
          id: item.alcoholId,
          name: item.korName,
          english: item.engName ?? '',
          category: item.korCategoryName ?? '',
          region: item.korRegion ?? '',
          imageUrl: item.imageUrl,
        }));
  const alcohols = [
    ...new Map([...connectedAlcohols, ...lookupAlcohols].map((item) => [item.id, item])).values(),
  ];
  const currentQuery = tab === 'attributes' ? dictionary : alcoholQuery;
  const loading = tab === 'attributes' && dictionary.isPending;
  const queryError = tab === 'attributes' ? dictionary.error : null;
  const pageMeta = tab === 'attributes' ? dictionary.data?.meta : alcoholQuery.data?.meta;
  const [selectedAlcoholNames, setSelectedAlcoholNames] = useState<Record<number, string>>({});
  function setSelectedAlcohols(next: number[] | ((previous: number[]) => number[])) {
    const ids = typeof next === 'function' ? next(selectedAlcohols) : next;
    if (ids.length > 500) {
      setNotice('위스키는 최대 500개까지 선택할 수 있습니다.');
      return;
    }
    setSelectedAlcoholIds(ids);
    setSelectedAlcoholNames((previous) => ({
      ...previous,
      ...Object.fromEntries(alcohols.map((item) => [item.id, item.name])),
    }));
  }
  const [newAttribute, setNewAttribute] = useState(false);
  const [editorVersion, setEditorVersion] = useState(0);
  const [notice, setNotice] = useState(
    '행을 열어 상세 내용을 확인하고, 체크박스로 일괄 작업 대상을 선택하세요.'
  );
  const [confirmation, setConfirmation] = useState<
    { kind: 'delete'; ids: number[] } | { kind: 'unlink'; id: number } | { kind: 'connect' } | null
  >(null);
  const linkedCount = (id: number) =>
    id === active?.id ? detail.data?.meta.totalElements : undefined;
  const currentAlcoholId = activeAlcohol ?? lookupAlcohols[0]?.id;
  const focusedAlcohol = alcohols.find((alcohol) => alcohol.id === currentAlcoholId);
  const filteredAttributes = (dictionary.data?.items ?? []).map(toAttribute);
  const filteredAlcohols = lookupAlcohols;
  const candidateAttributes = (options.data?.items ?? []).map(toAttribute);
  const selectionReady =
    !selectedAlcohols.length || (selectionSummary.isSuccess && !selectionSummary.isFetching);
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

  function updateParam(key: string, value: string) {
    if (tab === 'attributes') setDetailPage(0);
    else setActiveAlcohol(null);
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        if (key !== 'page') next.delete('page');
        if (key === 'attributeKey') {
          next.delete('attributeValue');
          next.delete('operator');
        }
        if (
          key === 'attributeValue' &&
          (!filterAttribute || valueError(filterAttribute.datatype, value))
        )
          next.delete('operator');
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
        next.delete('attributeValue');
        next.delete('operator');
        next.delete('missingKey');
        next.delete('page');
        return next;
      },
      { replace: true }
    );
  }
  async function saveAttribute(attribute: Attribute) {
    if (!attribute.id && attributes.some((item) => item.key === attribute.key))
      return '이미 등록된 키입니다. 기존 속성을 열어 수정하세요.';
    const { id, key, ...values } = attribute;
    const data = { ...values, unit: values.unit || null, description: values.description || null };
    try {
      const savedId = id
        ? (await update.mutateAsync({ id, data })).targetId
        : (await create.mutateAsync({ ...data, key })).id;
      setRetainedAttributes((previous) => [
        ...previous.filter((item) => item.id !== savedId),
        { ...attribute, id: savedId },
      ]);
      setActiveAttribute(savedId);
      setNewAttribute(false);
      setEditorVersion((previous) => previous + 1);
      setNotice(`“${attribute.displayName}” ${id ? '변경을 저장' : '속성을 등록'}했습니다.`);
      return undefined;
    } catch (error) {
      return getErrorMessage(error);
    }
  }
  async function confirmAction() {
    if (pending || (confirmation?.kind === 'connect' && !selectionReady)) return;
    setActionError(null);
    try {
      if (confirmation?.kind === 'delete') {
        await remove.mutateAsync(confirmation.ids);
        setSelectedAttributes((previous) =>
          previous.filter((id) => !confirmation.ids.includes(id))
        );
        setRetainedAttributes((previous) =>
          previous.filter((item) => !confirmation.ids.includes(item.id))
        );
        if (activeAttribute !== null && confirmation.ids.includes(activeAttribute))
          setActiveAttribute(null);
        setDetailPage(0);
        setNotice('선택한 속성과 연결을 삭제했습니다.');
      } else if (confirmation?.kind === 'unlink') {
        await unlink.mutateAsync(confirmation.id);
        setNotice('연결 1개를 해제했습니다. 공통 속성은 사전에 남아 있습니다.');
      } else if (confirmation?.kind === 'connect') {
        const items = newPairs.map((pair) => ({
          ...pair,
          value: (pairValues[`${pair.alcoholId}:${pair.attributeId}`] ?? '').trim(),
        }));
        for (const item of items) {
          const attribute = attributes.find((a) => a.id === item.attributeId);
          if (!attribute) throw new Error('속성을 다시 조회해 주세요.');
          const error = valueError(attribute.datatype, item.value);
          if (error) throw new Error(`${attribute.displayName}: ${error}`);
        }
        const result = items.length ? await link.mutateAsync(items) : { added: 0, skipped: 0 };
        setPairValues({});
        setNotice(
          `연결 ${result.added}개를 추가하고 기존 연결 ${result.skipped + pairs.length - newPairs.length}개는 건너뛰었습니다.`
        );
      }
      setConfirmation(null);
    } catch (error) {
      setActionError(getErrorMessage(error));
    }
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
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-white px-4 py-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">위스키 속성 관리</h1>
          <p className="mt-1 text-xs text-slate-500">
            속성은 공통으로 정의하고, 값은 위스키마다 입력합니다.
          </p>
        </div>
        <p className="text-xs text-slate-500">목록과 연결 정보는 현재 조회 범위만 불러옵니다.</p>
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
              {tab === 'groups'
                ? '그룹 구성 · 속성 배정'
                : tab === 'graph'
                  ? '술별 값과 연결 조회'
                  : tab === 'attributes'
                    ? '이름 · 분류 · 값 형식'
                    : '위스키 선택 · 값 입력'}
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
        {tab === 'groups' ? (
          <AttributeGroupsPanel />
        ) : queryError ? (
          <div role="alert" className="rounded border p-6">
            {getErrorMessage(queryError)}
            <Button
              variant="outline"
              onClick={() => {
                void currentQuery.refetch();
              }}
            >
              다시 조회
            </Button>
          </div>
        ) : loading ? (
          <p role="status" className="p-8">
            서버 데이터를 불러오는 중입니다.
          </p>
        ) : tab === 'graph' ? (
          <AttributeGraphPanel />
        ) : (
          <div className="grid min-w-0 items-start gap-3 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] xl:grid-cols-[minmax(0,7fr)_minmax(0,3fr)]">
            <div className="min-w-0 overflow-hidden rounded-lg border bg-white">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b p-3">
                <div className="flex items-center gap-2">
                  <ListFilter className="h-4 w-4 text-teal-800" />
                  <h2 className="text-sm font-semibold">
                    {tab === 'attributes' ? '공통 속성 사전' : '위스키 목록'}
                  </h2>
                  <Badge variant="secondary" className="font-mono text-[11px]">
                    {tab === 'mappings'
                      ? `${pageMeta?.totalElements ?? 0}개 중 ${visibleIds.length}개`
                      : visibleIds.length}
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
                  <span className="text-xs text-slate-500">
                    {linkedOnly
                      ? '조건에 맞는 속성이 연결된 위스키입니다.'
                      : '미연결 위스키도 검색합니다.'}
                  </span>
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
                      tab === 'attributes' ? '속성 이름 또는 키 검색' : '위스키 이름 검색'
                    }
                    className="bg-white pl-9 text-xs"
                  />
                </div>
                {
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
                }
                {tab === 'mappings' && (
                  <>
                    <label className="flex cursor-pointer items-center gap-2 whitespace-nowrap text-xs">
                      <Checkbox
                        checked={linkedOnly}
                        onCheckedChange={(checked) =>
                          setParams(
                            (previous) => {
                              const next = new URLSearchParams(previous);
                              next.delete('page');
                              if (checked === true) next.set('linkedOnly', 'true');
                              else {
                                next.delete('linkedOnly');
                                next.delete('attributeKey');
                                next.delete('attributeValue');
                                next.delete('operator');
                                next.delete('missingKey');
                                next.delete('type');
                                next.delete('groupIds');
                              }
                              return next;
                            },
                            { replace: true }
                          )
                        }
                      />
                      연결된 것만 보기
                    </label>
                  </>
                )}
                {(keyword ||
                  type !== 'ALL' ||
                  groupIds.length > 0 ||
                  (tab === 'mappings' && (linkedOnly || advanced))) && (
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="필터 초기화"
                    onClick={() => {
                      setParams(
                        (previous) => {
                          const next = new URLSearchParams(previous);
                          next.delete('groupIds');
                          next.delete('conditions');
                          next.delete('match');
                          next.delete('q');
                          next.delete('type');
                          next.delete('linkedOnly');
                          next.delete('attributeKey');
                          next.delete('attributeValue');
                          next.delete('operator');
                          next.delete('missingKey');
                          next.delete('page');
                          return next;
                        },
                        { replace: true }
                      );
                    }}
                  >
                    <X />
                  </Button>
                )}
              </div>
              <div className="border-b p-3">
                <AttributeGroupFilter />
              </div>
              {tab === 'mappings' && (
                <div className="border-b p-3">
                  <AttributeSearchBuilder
                    key={JSON.stringify(initialSearch)}
                    value={initialSearch}
                    onApply={applySearch}
                    error={compound.error}
                    label="연결 목록 속성 조건"
                  />
                </div>
              )}
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
                      {label}
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
                        disabled={pending || selectedAttributes.length > 500}
                        onClick={() => setConfirmation({ kind: 'delete', ids: selectedAttributes })}
                      >
                        <Trash2 />
                        삭제
                      </Button>
                    </>
                  )}
                </div>
              </div>
              {tab === 'mappings' && filterDefinition.error && attributeKey && (
                <p role="alert" className="p-3">
                  속성 검색 조건을 확인하지 못했습니다.{' '}
                  <Button variant="ghost" onClick={() => void filterDefinition.refetch()}>
                    조건 다시 조회
                  </Button>
                </p>
              )}
              {tab === 'mappings' && !compound.error && alcoholQuery.isPending && (
                <p role="status" className="border-b px-3 py-2 text-xs text-slate-500">
                  조건에 맞는 위스키를 조회 중입니다.
                </p>
              )}
              {tab === 'mappings' && alcoholQuery.error && (
                <div role="alert" className="border-b px-3 py-2 text-xs text-red-700">
                  {getErrorMessage(alcoholQuery.error)}
                  <Button variant="ghost" size="sm" onClick={() => void alcoholQuery.refetch()}>
                    다시 조회
                  </Button>
                </div>
              )}
              {tab === 'mappings' && pageIds.length > 0 && !pageSummary.isSuccess && (
                <div role={pageSummary.error ? 'alert' : 'status'} className="border-b p-3 text-xs">
                  {pageSummary.error
                    ? '연결 정보를 불러오지 못했습니다.'
                    : '연결 정보를 조회 중입니다.'}
                  {pageSummary.error && (
                    <Button variant="ghost" onClick={() => void pageSummary.refetch()}>
                      연결 정보 다시 조회
                    </Button>
                  )}
                </div>
              )}
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
                        <TableHead>값 형식 · 단위</TableHead>
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
                                setDetailPage(0);
                                setRetainedAttributes((previous) => [
                                  ...previous.filter((item) => item.id !== attribute.id),
                                  attribute,
                                ]);
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
                          <TableCell className="whitespace-nowrap text-[11px] text-slate-600">
                            <span className="rounded border bg-slate-50 px-1.5 py-0.5">
                              {
                                {
                                  STRING: '문자',
                                  INT: '정수',
                                  DOUBLE: '소수',
                                  BOOLEAN: '참 / 거짓',
                                }[attribute.datatype]
                              }
                            </span>
                            {attribute.unit ? ` · ${attribute.unit}` : ''}
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
                                      {(() => {
                                        const attribute = attributes.find(
                                          (a) => a.id === mapping.attributeId
                                        );
                                        return attribute
                                          ? `: ${displayValue(attribute, mapping.value)}`
                                          : '';
                                      })()}
                                    </span>
                                  ))
                                ) : (
                                  <span
                                    className={
                                      pageSummary.isSuccess ? 'text-amber-700' : 'text-slate-400'
                                    }
                                  >
                                    {pageSummary.isSuccess
                                      ? '미연결'
                                      : pageSummary.error
                                        ? '확인 실패'
                                        : '확인 중'}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  {!visibleIds.length && (tab !== 'mappings' || alcoholQuery.isSuccess) && (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <div className="flex flex-col items-center gap-2 py-12 text-slate-500">
                          <Filter className="h-6 w-6 text-slate-300" />
                          <p className="font-medium">
                            {!keyword &&
                            type === 'ALL' &&
                            (tab === 'attributes' ||
                              (!linkedOnly && !compound.value.conditions.length))
                              ? tab === 'attributes'
                                ? '등록된 속성이 없습니다.'
                                : '등록된 위스키가 없습니다.'
                              : '검색 조건에 맞는 항목이 없습니다.'}
                          </p>
                          <p>
                            {tab === 'attributes' && !keyword
                              ? '속성 만들기로 공통 속성을 등록하세요.'
                              : '검색어와 필터를 바꿔 다시 찾아보세요.'}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              <div className="flex flex-wrap items-center justify-between gap-2 border-t bg-slate-50 px-4 py-3 text-[11px] text-slate-500">
                <span>
                  {pageMeta?.totalElements ?? 0}개 · {page + 1}페이지
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page === 0}
                    onClick={() => updateParam('page', String(page - 1))}
                  >
                    이전
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!pageMeta?.hasNext}
                    onClick={() => updateParam('page', String(page + 1))}
                  >
                    다음
                  </Button>
                </div>
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
                      key={`${newAttribute ? 'new' : active?.id}-${editorVersion}`}
                      attribute={newAttribute ? emptyAttribute : active!}
                      linkedCount={newAttribute ? 0 : linkedCount(active?.id ?? 0)}
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
                        {detail.error && (
                          <p role="alert">
                            {getErrorMessage(detail.error)}{' '}
                            <Button variant="ghost" onClick={() => void detail.refetch()}>
                              연결 다시 조회
                            </Button>
                          </p>
                        )}
                        {detail.isPending && <p role="status">연결을 조회 중입니다.</p>}
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
                                <span className="text-xs">
                                  {displayValue(active, mapping.value)}
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
                          {detail.isSuccess && !linkedCount(active.id) && (
                            <p className="text-xs text-slate-500">아직 연결된 위스키가 없습니다.</p>
                          )}
                        </div>
                        <div className="mt-2 flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={detailPage === 0}
                            onClick={() => setDetailPage((p) => p - 1)}
                          >
                            연결 이전
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!detail.data?.meta.hasNext}
                            onClick={() => setDetailPage((p) => p + 1)}
                          >
                            연결 다음
                          </Button>
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
                      위스키와 속성을 고른 뒤 검토 화면에서 각각의 값을 입력하세요.
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
                        onChange={(event) => {
                          setAttributeQuery(event.target.value);
                          setOptionPage(0);
                        }}
                        placeholder="연결할 속성 찾기"
                        className="pl-8 text-xs"
                      />
                    </div>
                    {options.error && (
                      <p role="alert">
                        {getErrorMessage(options.error)}{' '}
                        <Button variant="ghost" onClick={() => void options.refetch()}>
                          속성 다시 조회
                        </Button>
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={optionPage === 0}
                        onClick={() => setOptionPage((p) => p - 1)}
                      >
                        속성 이전
                      </Button>
                      <span>{optionPage + 1}페이지</span>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!options.data?.meta.hasNext}
                        onClick={() => setOptionPage((p) => p + 1)}
                      >
                        속성 다음
                      </Button>
                    </div>
                    <div className="mt-2 max-h-60 overflow-y-auto pr-1">
                      {candidateAttributes.map((attribute) => (
                        <label
                          key={attribute.id}
                          className={`flex cursor-pointer items-center gap-2 rounded px-2 py-2 text-xs hover:bg-slate-50 ${selectedAttributes.includes(attribute.id) ? 'bg-teal-50' : ''}`}
                        >
                          <Checkbox
                            checked={selectedAttributes.includes(attribute.id)}
                            onCheckedChange={() => {
                              setRetainedAttributes((previous) => [
                                ...previous.filter((item) => item.id !== attribute.id),
                                attribute,
                              ]);
                              setSelectedAttributes((previous) => toggle(previous, attribute.id));
                            }}
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
                  {selectedAlcohols.length > 0 && !selectionReady && (
                    <div role={selectionSummary.error ? 'alert' : 'status'} className="p-3 text-xs">
                      {selectionSummary.error
                        ? getErrorMessage(selectionSummary.error)
                        : '선택한 위스키의 기존 연결을 확인 중입니다.'}
                      {selectionSummary.error && (
                        <Button variant="ghost" onClick={() => void selectionSummary.refetch()}>
                          연결 다시 조회
                        </Button>
                      )}
                    </div>
                  )}
                  <div className="space-y-3 border-b bg-teal-50/50 p-3">
                    <div className="flex items-center justify-between text-xs">
                      <span>새로 연결</span>
                      <strong className="font-mono text-teal-800">
                        {selectionReady ? `${newPairs.length}쌍` : '확인 중'}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>이미 연결됨 · 건너뛰기</span>
                      <span className="font-mono">
                        {selectionReady ? `${pairs.length - newPairs.length}쌍` : '확인 중'}
                      </span>
                    </div>
                    <Button
                      className="w-full bg-teal-800 hover:bg-teal-900"
                      size="sm"
                      disabled={pending || !selectionReady || !pairs.length || pairs.length > 500}
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
                      위스키는 최대 500개까지 선택합니다. 중복 연결은 건너뛰며 기존 값은 유지합니다.
                    </p>
                  </div>
                  <div className="p-3">
                    <p className="mb-1 text-[10px] text-slate-500">개별 값 편집</p>
                    <h3 className="text-sm font-semibold">
                      {focusedAlcohol?.name ?? '위스키를 선택하세요.'}
                    </h3>
                    <div className="mt-3 max-h-[45vh] space-y-2 overflow-y-auto">
                      {mappings
                        .filter((mapping) => mapping.alcoholId === currentAlcoholId)
                        .map((mapping) => (
                          <div
                            key={mapping.id}
                            className="flex items-start gap-2 rounded-md border bg-white p-3"
                          >
                            {(() => {
                              const attribute = attributes.find(
                                (item) => item.id === mapping.attributeId
                              );
                              return (
                                attribute && (
                                  <MappingValueEditor
                                    key={`${mapping.id}:${mapping.value}`}
                                    attribute={attribute}
                                    mapping={mapping}
                                    onSave={async (value) => {
                                      await mappingUpdate.mutateAsync({ id: mapping.id, value });
                                      setNotice('선택한 위스키의 값을 저장했습니다.');
                                    }}
                                  />
                                )
                              );
                            })()}
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
                      {pageSummary.isSuccess &&
                        !mappings.some((mapping) => mapping.alcoholId === currentAlcoholId) && (
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
        {tab === 'groups'
          ? '그룹 변경은 서버에 저장됩니다. 연결 목록과 그래프에서 여러 그룹을 선택해 검색할 수 있습니다.'
          : notice}
      </div>
      <p className="flex items-center gap-1.5 text-[11px] text-slate-400">
        <CircleHelp className="h-3.5 w-3.5" />
        속성 이름·분류·단위는 공통입니다. 값 변경은 선택한 위스키의 연결에만 적용됩니다.
      </p>
      <Dialog
        open={confirmation !== null}
        onOpenChange={(open) => {
          if (!open && !pending) {
            setConfirmation(null);
            setActionError(null);
          }
        }}
      >
        <DialogContent
          className={
            confirmation?.kind === 'connect'
              ? 'max-h-[90vh] w-[94vw] overflow-y-auto sm:max-w-5xl'
              : undefined
          }
        >
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
                ? `속성 ${confirmation.ids.length}개와 이 속성의 모든 연결을 삭제합니다. 위스키는 삭제되지 않습니다.`
                : confirmation?.kind === 'unlink'
                  ? '이 위스키와 속성 사이의 연결만 해제합니다. 속성은 공통 사전에 유지됩니다.'
                  : `선택한 위스키 ${selectedAlcohols.length}개에 속성 ${selectedAttributes.length}개를 연결합니다. 새 연결 ${newPairs.length}개를 추가하고 중복 ${pairs.length - newPairs.length}개는 건너뜁니다.`}
            </DialogDescription>
          </DialogHeader>
          {confirmation?.kind === 'connect' && (
            <div className="max-h-[55vh] overflow-auto rounded-md border">
              <table className="w-full min-w-[34rem] text-left text-xs">
                <thead className="sticky top-0 z-10 bg-slate-100 text-slate-600">
                  <tr>
                    <th className="px-3 py-2 font-medium">위스키</th>
                    <th className="px-3 py-2 font-medium">속성</th>
                    <th className="w-2/5 px-3 py-2 font-medium">연결할 값</th>
                  </tr>
                </thead>
                <tbody>
                  {pairs.map((pair) => {
                    const attribute = attributes.find((item) => item.id === pair.attributeId)!;
                    const key = `${pair.alcoholId}:${pair.attributeId}`;
                    const name =
                      selectedAlcoholNames[pair.alcoholId] ??
                      alcohols.find((item) => item.id === pair.alcoholId)?.name ??
                      '이름 확인 필요';
                    const existing = mappings.find(
                      (item) =>
                        item.alcoholId === pair.alcoholId && item.attributeId === pair.attributeId
                    );
                    return (
                      <tr
                        key={key}
                        className={`border-t ${existing ? 'bg-slate-50 text-slate-500' : 'bg-white'}`}
                      >
                        <td className="px-3 py-2 align-top">
                          <span className="block font-medium">{name}</span>
                          <span className="font-mono text-[10px] text-slate-400">
                            #{pair.alcoholId}
                          </span>
                        </td>
                        <td className="px-3 py-2 align-top">
                          <span className="block">{attribute.displayName}</span>
                          <span className="text-[10px] text-slate-400">
                            {attribute.datatype}
                            {attribute.unit ? ` · ${attribute.unit}` : ''}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          {existing ? (
                            <div>
                              <span>{displayValue(attribute, existing.value)}</span>
                              <span className="ml-2 rounded bg-slate-200 px-1.5 py-0.5 text-[10px]">
                                기존 값 유지
                              </span>
                            </div>
                          ) : (
                            <Input
                              aria-label={`${name} · ${attribute.displayName} 값`}
                              value={pairValues[key] ?? ''}
                              disabled={pending}
                              onChange={(event) =>
                                setPairValues((previous) => ({
                                  ...previous,
                                  [key]: event.target.value,
                                }))
                              }
                              className="h-8 bg-white font-mono text-xs"
                              placeholder={
                                attribute.datatype === 'BOOLEAN'
                                  ? 'true 또는 false'
                                  : attribute.unit
                                    ? `${attribute.unit} 단위로 입력`
                                    : '값 입력'
                              }
                            />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <p className="text-xs text-slate-500">확정하면 서버에 반영됩니다.</p>
          {actionError && (
            <p role="alert" className="text-xs text-red-700">
              {actionError}
            </p>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              disabled={pending}
              onClick={() => {
                setConfirmation(null);
                setActionError(null);
              }}
            >
              취소
            </Button>
            <Button
              variant={confirmation?.kind === 'connect' ? 'default' : 'destructive'}
              disabled={
                pending ||
                (confirmation?.kind === 'connect' && !selectionReady) ||
                (confirmation?.kind === 'delete' && confirmation.ids.length > 500)
              }
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
