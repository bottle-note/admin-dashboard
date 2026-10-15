/**
 * 위스키 속성 관리
 * - 탭 "속성 목록": 속성이 붙은 위스키를 필터·페이지로 보고, 이름을 누르면 그 위스키의 속성 시트,
 *   체크로 여러 개를 골라 일괄 편집 시트를 연다.
 * - 탭 "통계": 전체 기준 항목 집계와 키워드 값
 * - 탭·필터·페이지·열린 위스키는 URL 쿼리로 관리한다.
 */

import { useEffect, useMemo, useState } from 'react';
import { Layers, Plus, RotateCcw, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog';
import { PageHeader } from '@/components/common/PageHeader';
import { TabBar } from '@/components/common/TabBar';
import { Pagination } from '@/components/common/Pagination';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useUrlParams } from '@/hooks/useUrlParams';
import {
  useAlcoholAttributeBatchDelete,
  useAlcoholAttributeCreate,
  useAlcoholAttributeDelete,
  useAlcoholAttributeEnums,
  useAlcoholAttributeKeyStats,
  useAlcoholAttributeKeywords,
  useAlcoholAttributeRows,
  useAlcoholAttributeSummary,
  useAttributedAlcohols,
} from '@/hooks/useAlcoholAttributes';
import type {
  AlcoholAttributeRow,
  AlcoholAttributeSummaryItem,
  AttributedAlcoholItem,
  AttributedAlcoholSearchParams,
} from '@/types/api';
import { AlcoholAttributeAlcoholSheet } from './AlcoholAttributeAlcoholSheet';
import { AlcoholAttributeBulkSheet } from './AlcoholAttributeBulkSheet';
import { AlcoholAttributeFormDialog } from './AlcoholAttributeFormDialog';
import { AlcoholAttributeOverview } from './AlcoholAttributeOverview';
import { AlcoholAttributeTable } from './AlcoholAttributeTable';
import { DEFAULT_KEYWORD_KEY, labelsOf, pickPivotKeys } from './alcohol-attribute.schema';

export interface SelectedWhisky {
  alcoholId: number;
  korName: string;
  engName: string;
}

const TABS = [
  { value: 'list', label: '속성 목록' },
  { value: 'stats', label: '통계' },
] as const;
type TabValue = (typeof TABS)[number]['value'];
const ALL = 'ALL';
const DEFAULT_SIZE = 20;

function isTabValue(value: string | null): value is TabValue {
  return TABS.some((tab) => tab.value === value);
}
function toWhisky(item: AttributedAlcoholItem): SelectedWhisky {
  return { alcoholId: item.alcoholId, korName: item.korName, engName: item.engName };
}

type DeleteTarget =
  | { kind: 'row'; id: number; label: string }
  | { kind: 'batch'; ids: number[]; label: string };

export function AlcoholAttributeListPage() {
  const { params: urlParams, update: updateParams } = useUrlParams();
  const tabParam = urlParams.get('tab');
  const tab: TabValue = isTabValue(tabParam) ? tabParam : 'list';
  const { data: enums } = useAlcoholAttributeEnums();
  const labels = useMemo(() => labelsOf(enums), [enums]);
  const typeOrder = useMemo(() => (enums?.types ?? []).map((item) => item.code), [enums]);
  const typeParam = urlParams.get('type');
  const filters = {
    keyword: urlParams.get('q') ?? '',
    type: typeOrder.find((type) => type === typeParam),
    key: urlParams.get('key') ?? undefined,
    value: urlParams.get('value') ?? undefined,
    missingKey: urlParams.get('missing') ?? undefined,
  };
  const page = Math.max(0, Number(urlParams.get('page') ?? 0) || 0);
  const size = Math.min(
    100,
    Math.max(1, Number(urlParams.get('size') ?? DEFAULT_SIZE) || DEFAULT_SIZE)
  );
  const openId = Number(urlParams.get('open')) || null;

  // 필터가 바뀌면 첫 페이지로 돌아간다
  const setFilter = (updates: Record<string, string | null>) =>
    updateParams({ ...updates, page: null });

  // 검색어는 입력을 멈춘 뒤에만 URL에 반영한다
  const [keywordInput, setKeywordInput] = useState(filters.keyword);
  const debouncedKeyword = useDebouncedValue(keywordInput.trim(), 300);
  useEffect(() => {
    if (debouncedKeyword !== filters.keyword) setFilter({ q: debouncedKeyword });
    // filters.keyword·setFilter는 URL에서 매번 새로 만들어진다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedKeyword]);

  const searchParams = useMemo<AttributedAlcoholSearchParams>(
    () => ({
      keyword: filters.keyword || undefined,
      type: filters.type,
      key: filters.key,
      value: filters.value,
      missingKey: filters.missingKey,
      page,
      size,
    }),
    [filters.keyword, filters.type, filters.key, filters.value, filters.missingKey, page, size]
  );

  const { data: keyStats = [], isLoading: isKeyStatsLoading } = useAlcoholAttributeKeyStats();
  const { data: keywords = [], isLoading: isKeywordsLoading } = useAlcoholAttributeKeywords();
  const { data: list, isLoading: isListLoading } = useAttributedAlcohols(
    searchParams,
    tab === 'list'
  );
  const items = useMemo(() => list?.items ?? [], [list]);
  const pivotKeys = useMemo(() => pickPivotKeys(keyStats), [keyStats]);
  const keyOptions = useMemo(
    () => Array.from(new Set(keyStats.map((stat) => stat.key))).sort(),
    [keyStats]
  );
  /** 키워드 바로 추가에 쓸 항목: 집계에서 가장 많이 쓰인 KEYWORD 항목 */
  const keywordKey = useMemo(
    () =>
      keyStats.filter((stat) => stat.type === 'KEYWORD').sort((a, b) => b.count - a.count)[0]
        ?.key ?? DEFAULT_KEYWORD_KEY,
    [keyStats]
  );
  const isKeywordFilterKey = keyStats.some(
    (stat) => stat.key === filters.key && stat.type === 'KEYWORD'
  );

  // 체크로 고른 위스키. 페이지를 넘겨도 유지되도록 이름까지 같이 둔다
  const [selected, setSelected] = useState<Record<number, SelectedWhisky>>({});
  const selectedList = useMemo(
    () => Object.values(selected).sort((a, b) => a.alcoholId - b.alcoholId),
    [selected]
  );
  const selectedIds = useMemo(() => selectedList.map((whisky) => whisky.alcoholId), [selectedList]);
  const toggle = (item: AttributedAlcoholItem, checked: boolean) =>
    setSelected((prev) => {
      const next = { ...prev };
      if (checked) next[item.alcoholId] = toWhisky(item);
      else delete next[item.alcoholId];
      return next;
    });
  const toggleAll = (pageItems: AttributedAlcoholItem[], checked: boolean) =>
    setSelected((prev) => {
      const next = { ...prev };
      pageItems.forEach((item) => {
        if (checked) next[item.alcoholId] = toWhisky(item);
        else delete next[item.alcoholId];
      });
      return next;
    });
  const removeSelected = (alcoholId: number) =>
    setSelected((prev) => {
      const next = { ...prev };
      delete next[alcoholId];
      return next;
    });

  // 열린 위스키 시트
  const openWhisky = useMemo<SelectedWhisky | null>(() => {
    if (!openId) return null;
    const item = items.find((entry) => entry.alcoholId === openId);
    return item
      ? toWhisky(item)
      : (selected[openId] ?? { alcoholId: openId, korName: `#${openId}`, engName: '' });
  }, [openId, items, selected]);
  const openIds = useMemo(() => (openId ? [openId] : []), [openId]);
  const { data: openRows = [], isLoading: isOpenRowsLoading } = useAlcoholAttributeRows(openIds);

  // 일괄 편집 시트
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const { data: bulkSummary = [], isLoading: isBulkLoading } = useAlcoholAttributeSummary(
    isBulkOpen ? selectedIds : []
  );

  const createMutation = useAlcoholAttributeCreate();
  const deleteMutation = useAlcoholAttributeDelete({ onSuccess: () => setDeleteTarget(null) });
  const batchDeleteMutation = useAlcoholAttributeBatchDelete({
    onSuccess: () => setDeleteTarget(null),
  });
  const isMutating =
    createMutation.isPending || deleteMutation.isPending || batchDeleteMutation.isPending;

  const [formTarget, setFormTarget] = useState<{
    open: boolean;
    row: AlcoholAttributeRow | null;
    whiskies: SelectedWhisky[];
  }>({ open: false, row: null, whiskies: [] });
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  const chipsFor = (presentValues: Set<string>) =>
    keywords.filter((keyword) => !presentValues.has(keyword.value));
  const openKeywordChips = useMemo(
    () =>
      chipsFor(new Set(openRows.filter((row) => row.type === 'KEYWORD').map((row) => row.value))),
    // chipsFor는 keywords만 본다
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [keywords, openRows]
  );
  const bulkKeywordChips = useMemo(
    () =>
      keywords.filter(
        (keyword) =>
          !bulkSummary.some(
            (item) =>
              item.type === 'KEYWORD' &&
              item.value === keyword.value &&
              item.registeredCount >= item.selectedCount
          )
      ),
    [keywords, bulkSummary]
  );

  const addKeyword = (alcoholIds: number[], value: string) =>
    createMutation.mutate({
      alcoholIds,
      key: keywordKey,
      type: 'KEYWORD',
      datatype: 'STRING',
      value,
      description: null,
      basedAt: null,
    });
  const applyToRest = (item: AlcoholAttributeSummaryItem, value: string) => {
    const missing = selectedIds.filter((id) => !item.alcoholIds.includes(id));
    if (missing.length === 0) return;
    createMutation.mutate({
      alcoholIds: missing,
      key: item.key,
      type: item.type,
      datatype: item.datatype,
      value,
      description: null,
      basedAt: null,
    });
  };
  const confirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.kind === 'row') deleteMutation.mutate(deleteTarget.id);
    else batchDeleteMutation.mutate(deleteTarget.ids);
  };

  const hasFilter = Boolean(
    filters.keyword || filters.type || filters.key || filters.value || filters.missingKey
  );
  const resetFilters = () => {
    setKeywordInput('');
    setFilter({ q: null, type: null, key: null, value: null, missing: null });
  };

  return (
    <div className="flex h-full flex-col gap-3">
      <PageHeader
        compact
        title="위스키 속성 관리"
        description="키워드·가격·대중성 점수 같은 부가 속성이 붙은 위스키를 찾아보고 고쳐 넣습니다."
        actions={
          <>
            {selectedIds.length > 0 && (
              <Button size="sm" variant="outline" onClick={() => setIsBulkOpen(true)}>
                <Layers className="mr-1.5 h-4 w-4" />
                선택 {selectedIds.length}개 일괄 편집
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => setFormTarget({ open: true, row: null, whiskies: [] })}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              속성 추가
            </Button>
          </>
        }
      />

      <TabBar
        tabs={TABS}
        value={tab}
        onChange={(next) => updateParams({ tab: next === 'list' ? null : next })}
        ariaLabel="속성 관리 보기"
        tools={
          tab === 'list' && (
            <span className="text-xs tabular-nums text-muted-foreground">
              {isListLoading ? '불러오는 중...' : `위스키 ${list?.meta.totalElements ?? 0}개`}
            </span>
          )
        }
      />

      {tab === 'stats' ? (
        <div
          id="panel-stats"
          role="tabpanel"
          aria-labelledby="tab-stats"
          className="flex min-h-0 flex-1 flex-col"
        >
          <AlcoholAttributeOverview
            keyStats={keyStats}
            keywords={keywords}
            isLoading={isKeyStatsLoading || isKeywordsLoading}
            typeLabels={labels.types}
            datatypeLabels={labels.datatypes}
          />
        </div>
      ) : (
        <div
          id="panel-list"
          role="tabpanel"
          aria-labelledby="tab-list"
          className="flex min-h-0 flex-1 flex-col gap-3"
        >
          <div
            className="flex flex-wrap items-center gap-2"
            role="search"
            aria-label="속성 위스키 필터"
          >
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                placeholder="위스키 이름"
                aria-label="위스키 검색"
                className="h-8 w-48 pl-7 text-xs"
              />
            </div>
            <Select
              value={filters.type ?? ALL}
              onValueChange={(next) => setFilter({ type: next === ALL ? null : next })}
            >
              <SelectTrigger className="h-8 w-[130px] text-xs" aria-label="분류">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>전체 분류</SelectItem>
                {typeOrder.map((type) => (
                  <SelectItem key={type} value={type}>
                    {labels.types[type] ?? type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.key ?? ALL}
              onValueChange={(next) => setFilter({ key: next === ALL ? null : next, value: null })}
            >
              <SelectTrigger className="h-8 w-[170px] text-xs" aria-label="항목">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>전체 항목</SelectItem>
                {keyOptions.map((key) => (
                  <SelectItem key={key} value={key}>
                    <span className="font-mono">{key}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isKeywordFilterKey ? (
              <Select
                value={filters.value ?? ALL}
                onValueChange={(next) => setFilter({ value: next === ALL ? null : next })}
              >
                <SelectTrigger className="h-8 w-[150px] text-xs" aria-label="값">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>전체 값</SelectItem>
                  {keywords.map((keyword) => (
                    <SelectItem key={keyword.value} value={keyword.value}>
                      {keyword.value}
                      <span className="ml-1 text-muted-foreground">{keyword.alcoholCount}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                key={filters.key ?? ''}
                defaultValue={filters.value ?? ''}
                placeholder="값 (정확히 일치)"
                aria-label="값"
                className="h-8 w-36 text-xs"
                disabled={!filters.key}
                onKeyDown={(e) => {
                  if (e.key === 'Enter')
                    setFilter({ value: (e.target as HTMLInputElement).value.trim() || null });
                }}
                onBlur={(e) => {
                  const next = e.target.value.trim() || null;
                  if (next !== (filters.value ?? null)) setFilter({ value: next });
                }}
              />
            )}
            <Select
              value={filters.missingKey ?? ALL}
              onValueChange={(next) => setFilter({ missing: next === ALL ? null : next })}
            >
              <SelectTrigger className="h-8 w-[170px] text-xs" aria-label="값 없는 항목">
                <SelectValue placeholder="값 없는 항목" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>값 없는 항목 없음</SelectItem>
                {keyOptions.map((key) => (
                  <SelectItem key={key} value={key}>
                    <span className="font-mono">{key}</span> 없음
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasFilter && (
              <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={resetFilters}>
                <RotateCcw className="mr-1 h-3.5 w-3.5" />
                필터 초기화
              </Button>
            )}
          </div>

          <AlcoholAttributeTable
            items={items}
            isLoading={isListLoading}
            pivotKeys={pivotKeys}
            typeLabels={labels.types}
            selectedIds={selectedIds}
            onToggle={toggle}
            onToggleAll={toggleAll}
            onOpen={(item) => updateParams({ open: String(item.alcoholId) })}
          />

          {list && list.items.length > 0 && (
            <Pagination
              currentPage={list.meta.page}
              totalPages={list.meta.totalPages}
              totalElements={list.meta.totalElements}
              pageSize={size}
              currentItemCount={list.items.length}
              hasNext={list.meta.hasNext}
              onPageChange={(next) => updateParams({ page: next === 0 ? null : String(next) })}
              onPageSizeChange={(next) =>
                updateParams({ size: next === DEFAULT_SIZE ? null : String(next), page: null })
              }
            />
          )}
        </div>
      )}

      <AlcoholAttributeAlcoholSheet
        open={openWhisky !== null}
        onOpenChange={(open) => !open && updateParams({ open: null })}
        whisky={openWhisky}
        rows={openRows}
        isLoading={isOpenRowsLoading}
        typeLabels={labels.types}
        keywordChips={openKeywordChips}
        isMutating={isMutating}
        onCreate={() =>
          openWhisky && setFormTarget({ open: true, row: null, whiskies: [openWhisky] })
        }
        onEdit={(row) => setFormTarget({ open: true, row, whiskies: [] })}
        onDelete={(row) =>
          setDeleteTarget({ kind: 'row', id: row.id, label: `${row.key} · ${row.value}` })
        }
        onAddKeyword={(value) => openWhisky && addKeyword([openWhisky.alcoholId], value)}
      />
      <AlcoholAttributeBulkSheet
        open={isBulkOpen}
        onOpenChange={setIsBulkOpen}
        whiskies={selectedList}
        onRemoveWhisky={removeSelected}
        summary={bulkSummary}
        isLoading={isBulkLoading}
        typeOrder={typeOrder}
        typeLabels={labels.types}
        keywordChips={bulkKeywordChips}
        isMutating={isMutating}
        onCreate={() => setFormTarget({ open: true, row: null, whiskies: selectedList })}
        onApplyToRest={applyToRest}
        onDeleteGroup={(item) =>
          setDeleteTarget({
            kind: 'batch',
            ids: item.attributeIds,
            label: `'${item.key}' 묶음의 속성 ${item.attributeIds.length}건`,
          })
        }
        onAddKeyword={(value) => addKeyword(selectedIds, value)}
      />
      <AlcoholAttributeFormDialog
        open={formTarget.open}
        onOpenChange={(open) => setFormTarget((prev) => ({ ...prev, open }))}
        whiskies={formTarget.whiskies}
        row={formTarget.row}
      />
      <DeleteConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="속성 삭제"
        description={
          deleteTarget
            ? `${deleteTarget.label}을(를) 삭제합니다. 되살리려면 다시 추가해야 합니다.`
            : undefined
        }
        isPending={deleteMutation.isPending || batchDeleteMutation.isPending}
      />
    </div>
  );
}
