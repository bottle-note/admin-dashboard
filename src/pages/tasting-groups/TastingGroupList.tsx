/**
 * 태그 그룹 관리
 * - 상단: 제목·추가 버튼, 탭(목록/그래프) 줄 오른쪽에 계열 필터·요약(목록) 또는 보기 방식(그래프)
 * - 목록 탭: 왼쪽 그룹 레일 + 오른쪽 작업대(헤더, 대표/보조 태그 보드, 빠른 추가)
 * - 그래프 탭: 캔버스가 남는 높이를 모두 쓴다
 * - 탭·보기 방식·계열 필터는 URL 쿼리로 관리한다
 */

import { useMemo, useState } from 'react';
import { ArrowLeftRight, Pencil, Plus, Search, Trash2, UserPlus, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { formatNumber } from '@/lib/format';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChipButton } from '@/components/common/ChipButton';
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog';
import { PageHeader } from '@/components/common/PageHeader';
import { TabBar } from '@/components/common/TabBar';
import { useUrlParams } from '@/hooks/useUrlParams';
import {
  useTastingGroupAddTags,
  useTastingGroupChangeTagRole,
  useTastingGroupDelete,
  useTastingGroupList,
  useTastingGroupRemoveTag,
  useUngroupedTastingTags,
} from '@/hooks/useTastingGroups';
import type { TastingGroupItem, TastingGroupRole, TastingGroupTag } from '@/types/api';
import { TastingGroupFormDialog } from './TastingGroupFormDialog';
import { TastingGroupGraph } from './TastingGroupGraph';
import { TastingGroupTagConnectSheet } from './TastingGroupTagConnectSheet';
import {
  DEFAULT_GRAPH_LAYOUT,
  GRAPH_LAYOUTS,
  NO_FAMILY,
  OTHER_ROLE,
  ROLE_LABEL,
  familyColorScale,
  isGraphLayout,
  type GraphLayout,
} from './tasting-group.schema';

const ALL_FAMILIES = 'ALL';
/** 빠른 추가 줄에 보여줄 미소속 태그 수. 나머지는 검색이나 태그 연결 패널로 */
const QUICK_ADD_LIMIT = 12;

const TABS = [
  { value: 'list', label: '목록' },
  { value: 'graph', label: '그래프' },
] as const;
type TabValue = (typeof TABS)[number]['value'];

function isTabValue(value: string | null): value is TabValue {
  return TABS.some((tab) => tab.value === value);
}

function FamilyDot({ color, className = '' }: { color: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${className}`}
      style={{ background: color }}
    />
  );
}

export function TastingGroupListPage() {
  const { params: urlParams, update: updateParams } = useUrlParams();
  const tabParam = urlParams.get('tab');
  const tab: TabValue = isTabValue(tabParam) ? tabParam : 'list';
  const viewParam = urlParams.get('view');
  const graphLayout: GraphLayout = isGraphLayout(viewParam) ? viewParam : DEFAULT_GRAPH_LAYOUT;
  const family = urlParams.get('family') ?? ALL_FAMILIES;

  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<TastingGroupTag | null>(null);
  const [formTarget, setFormTarget] = useState<{ open: boolean; group: TastingGroupItem | null }>({
    open: false,
    group: null,
  });
  const [isConnectOpen, setIsConnectOpen] = useState(false);
  const [showPeripheral, setShowPeripheral] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [quickAddKeyword, setQuickAddKeyword] = useState('');

  const { data, isLoading } = useTastingGroupList();
  const { data: ungroupedTags = [] } = useUngroupedTastingTags('');
  const deleteMutation = useTastingGroupDelete({
    onSuccess: () => {
      setIsDeleteOpen(false);
      setSelectedCode(null);
    },
  });
  const changeRoleMutation = useTastingGroupChangeTagRole();
  const removeTagMutation = useTastingGroupRemoveTag();
  const quickAddMutation = useTastingGroupAddTags();

  const allGroups = useMemo(() => data?.groups ?? [], [data]);
  const families = data?.families ?? [];
  const { colorOf } = useMemo(() => familyColorScale(allGroups), [allGroups]);
  // 서버는 계열명 순으로 내려주므로 화면은 표시 순서(없으면 뒤)로 다시 정렬한다.
  // 그래프가 배열 동일성으로 재생성 여부를 판단하므로 메모이즈한다.
  const groups = useMemo(
    () =>
      (family === ALL_FAMILIES ? allGroups : allGroups.filter((group) => group.family === family))
        .slice()
        .sort(
          (a, b) =>
            (a.displayOrder ?? Number.MAX_SAFE_INTEGER) -
            (b.displayOrder ?? Number.MAX_SAFE_INTEGER)
        ),
    [allGroups, family]
  );
  // 선택이 없거나 삭제돼 사라졌으면 화면 순서의 첫 그룹을 선택한 것으로 본다.
  const effectiveCode =
    selectedCode && allGroups.some((group) => group.code === selectedCode)
      ? selectedCode
      : (groups[0]?.code ?? null);
  const selected = allGroups.find((group) => group.code === effectiveCode) ?? null;
  const selectedColor = selected ? colorOf(selected.family) : null;

  const coreTags = selected?.tags.filter((tag) => tag.role.code === 'CORE') ?? [];
  const peripheralTags = selected?.tags.filter((tag) => tag.role.code === 'PERIPHERAL') ?? [];

  const quickAddCandidates = useMemo(() => {
    const keyword = quickAddKeyword.trim();
    const pool = keyword
      ? ungroupedTags.filter((tag) => tag.korName.includes(keyword))
      : ungroupedTags;
    return pool.slice(0, QUICK_ADD_LIMIT);
  }, [ungroupedTags, quickAddKeyword]);

  const nextDisplayOrder =
    allGroups.reduce((max, group) => Math.max(max, group.displayOrder ?? 0), 0) + 1;

  const selectTab = (next: TabValue) => updateParams({ tab: next === 'list' ? null : next });
  const selectGraphLayout = (next: GraphLayout) =>
    updateParams({ view: next === DEFAULT_GRAPH_LAYOUT ? null : next });
  const setFamily = (next: string) => updateParams({ family: next === ALL_FAMILIES ? null : next });

  const isTagMutating =
    changeRoleMutation.isPending || removeTagMutation.isPending || quickAddMutation.isPending;

  const changeRole = (tag: TastingGroupTag, role: TastingGroupRole) => {
    if (!selected) return;
    changeRoleMutation.mutate({ code: selected.code, tagId: tag.tastingTagId, data: { role } });
  };

  const renderRoleColumn = (role: TastingGroupRole, tags: TastingGroupTag[]) => {
    const nextRole = OTHER_ROLE[role];
    return (
      <section
        role="region"
        aria-label={ROLE_LABEL[role]}
        className="flex min-h-0 flex-col rounded-md border"
      >
        <h3 className="flex items-center justify-between border-b px-3 py-2 text-xs font-medium">
          <span>
            {ROLE_LABEL[role]} {tags.length}
          </span>
          <span className="font-normal text-muted-foreground">
            가중치 {role === 'CORE' ? '1.0' : '0.4'}
          </span>
        </h3>
        <ul className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          {tags.length === 0 && (
            <li className="px-3 py-6 text-center text-xs text-muted-foreground">
              {role === 'CORE'
                ? '대표 태그가 없습니다. 보조 태그에서 "대표로"를 누르거나 아래에서 추가하세요.'
                : '보조 태그가 없습니다.'}
            </li>
          )}
          {tags.map((tag) => (
            <li
              key={tag.tastingTagId}
              className="group flex items-center gap-2 border-b px-3 py-1.5 text-xs last:border-b-0"
            >
              <span className="min-w-0 flex-1 truncate font-medium">{tag.korName}</span>
              <span className="w-12 shrink-0 text-right tabular-nums text-muted-foreground">
                {formatNumber(tag.alcoholCount)}
              </span>
              <span className="flex shrink-0 gap-0.5 opacity-60 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-1.5 text-[11px]"
                  aria-label={`${tag.korName} 역할을 ${ROLE_LABEL[nextRole]}로 변경`}
                  disabled={isTagMutating}
                  onClick={() => changeRole(tag, nextRole)}
                >
                  <ArrowLeftRight className="mr-1 h-3 w-3" />
                  {nextRole === 'CORE' ? '대표로' : '보조로'}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive"
                  aria-label={`${tag.korName} 제거`}
                  title="그룹에서 제거"
                  disabled={isTagMutating}
                  onClick={() => setRemoveTarget(tag)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </span>
            </li>
          ))}
        </ul>
      </section>
    );
  };

  return (
    <div className="flex h-full flex-col gap-3">
      <PageHeader
        compact
        title="태그 그룹 관리"
        description="테이스팅 태그를 맛 계열별로 묶어 추천 점수에 쓰는 사전을 관리합니다."
        actions={
          <Button size="sm" onClick={() => setFormTarget({ open: true, group: null })}>
            <Plus className="mr-1.5 h-4 w-4" />
            태그 그룹 추가
          </Button>
        }
      />

      <TabBar
        tabs={TABS}
        value={tab}
        onChange={selectTab}
        ariaLabel="태그 그룹 보기"
        tools={
          <>
            <Select value={family} onValueChange={setFamily}>
              <SelectTrigger className="h-8 w-[150px] text-xs" aria-label="계열 필터">
                <SelectValue placeholder="계열" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FAMILIES}>전체 계열</SelectItem>
                {families.map((item) => (
                  <SelectItem key={item} value={item}>
                    <span className="inline-flex items-center gap-1.5">
                      <FamilyDot color={colorOf(item)} />
                      {item}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-xs tabular-nums text-muted-foreground">
              {isLoading
                ? '불러오는 중...'
                : `그룹 ${groups.length}개 · 미소속 태그 ${ungroupedTags.length}개`}
            </span>
            {tab === 'graph' && (
              <>
                <div
                  className="flex gap-0.5 rounded-md border p-0.5"
                  role="group"
                  aria-label="그래프 보기 방식"
                >
                  {GRAPH_LAYOUTS.map((item) => (
                    <Button
                      key={item.value}
                      type="button"
                      size="sm"
                      variant={graphLayout === item.value ? 'default' : 'ghost'}
                      className="h-7 px-2 text-xs"
                      aria-pressed={graphLayout === item.value}
                      onClick={() => selectGraphLayout(item.value)}
                    >
                      {item.label}
                    </Button>
                  ))}
                </div>
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Switch
                    checked={showPeripheral}
                    onCheckedChange={setShowPeripheral}
                    aria-label="보조 태그 표시"
                  />
                  보조 태그까지
                </label>
              </>
            )}
          </>
        }
      />

      {tab === 'graph' ? (
        <div
          id="panel-graph"
          role="tabpanel"
          aria-labelledby="tab-graph"
          className="flex min-h-0 flex-1 flex-col"
        >
          <TastingGroupGraph
            groups={groups}
            layout={graphLayout}
            showPeripheral={showPeripheral}
            selectedCode={effectiveCode}
            onSelect={setSelectedCode}
          />
        </div>
      ) : (
        <div
          id="panel-list"
          role="tabpanel"
          aria-labelledby="tab-list"
          className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] gap-4 lg:grid-cols-[280px_minmax(0,1fr)] lg:grid-rows-1 xl:grid-cols-[320px_minmax(0,1fr)]"
        >
          {/* 그룹 레일: 넓은 화면은 세로 목록, 좁은 화면은 가로 칩 */}
          <ul
            role="listbox"
            aria-label="태그 그룹 목록"
            className="flex min-h-0 gap-1 overflow-x-auto rounded-md border p-1 lg:flex-col lg:overflow-y-auto"
          >
            {isLoading &&
              Array.from({ length: 6 }).map((_, index) => (
                <li key={`skeleton-${index}`} aria-hidden="true" className="px-3 py-2">
                  <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
                </li>
              ))}
            {!isLoading && groups.length === 0 && (
              <li className="px-3 py-8 text-center text-xs text-muted-foreground">
                등록된 태그 그룹이 없습니다.
              </li>
            )}
            {groups.map((group) => {
              const isSelected = group.code === effectiveCode;
              const color = colorOf(group.family);
              const core = group.tags.filter((tag) => tag.role.code === 'CORE').length;
              return (
                <li
                  key={group.id}
                  role="option"
                  aria-selected={isSelected}
                  tabIndex={0}
                  className={`flex min-w-[180px] cursor-pointer items-start gap-2 rounded-md border-l-2 px-2.5 py-2 text-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring lg:min-w-0 ${
                    isSelected ? 'bg-muted' : 'border-l-transparent hover:bg-muted/50'
                  }`}
                  style={isSelected ? { borderLeftColor: color } : undefined}
                  onClick={() => setSelectedCode(group.code)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setSelectedCode(group.code);
                    }
                  }}
                >
                  <FamilyDot color={color} className="mt-1" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-[13px] font-medium">{group.name}</span>
                      <span className="shrink-0 tabular-nums text-muted-foreground">
                        {group.tags.length}
                        <span className="text-[10px]"> · 대표 {core}</span>
                      </span>
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span className="truncate font-mono">{group.code}</span>
                      <span aria-hidden="true">·</span>
                      <span className="shrink-0">{group.family ?? NO_FAMILY}</span>
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>

          {/* 작업대 */}
          {selected ? (
            <section
              role="region"
              aria-label="선택한 태그 그룹"
              className="flex min-h-0 flex-col gap-3 rounded-md border p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold">{selected.name}</h2>
                    <span
                      className="inline-flex items-center gap-1 rounded-full border px-2 py-0 text-[11px]"
                      style={selectedColor ? { borderColor: selectedColor } : undefined}
                    >
                      {selectedColor && <FamilyDot color={selectedColor} />}
                      {selected.family ?? NO_FAMILY}
                    </span>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {selected.code}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      표시 순서 {selected.displayOrder ?? '-'}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {selected.description ?? '설명이 없습니다.'}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button size="sm" className="h-8" onClick={() => setIsConnectOpen(true)}>
                    <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                    태그 연결
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    aria-label="수정"
                    title="그룹 정보 수정"
                    onClick={() => setFormTarget({ open: true, group: selected })}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    aria-label="삭제"
                    title={
                      selected.tags.length > 0
                        ? '태그가 연결된 그룹은 삭제할 수 없습니다. 먼저 태그를 제거하세요.'
                        : '그룹 삭제'
                    }
                    disabled={selected.tags.length > 0}
                    onClick={() => setIsDeleteOpen(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid min-h-0 flex-1 grid-rows-2 gap-3 xl:grid-cols-2 xl:grid-rows-1">
                {renderRoleColumn('CORE', coreTags)}
                {renderRoleColumn('PERIPHERAL', peripheralTags)}
              </div>

              {/* 빠른 추가: 미소속 태그를 보조 태그로 바로 붙인다. 칩은 한 줄에서 가로 스크롤한다 */}
              <div className="flex items-center gap-2 border-t pt-3">
                <span className="shrink-0 text-xs font-medium">빠른 추가</span>
                <div className="relative shrink-0">
                  <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={quickAddKeyword}
                    onChange={(e) => setQuickAddKeyword(e.target.value)}
                    placeholder="미소속 태그 검색"
                    aria-label="미소속 태그 검색"
                    className="h-7 w-40 pl-7 text-xs"
                  />
                </div>
                <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto py-0.5">
                  {quickAddCandidates.length === 0 ? (
                    <span className="text-xs text-muted-foreground">
                      {ungroupedTags.length === 0
                        ? '미소속 태그가 없습니다.'
                        : '검색 결과가 없습니다.'}
                    </span>
                  ) : (
                    quickAddCandidates.map((tag) => (
                      <ChipButton
                        key={tag.id}
                        count={tag.alcoholCount}
                        aria-label={`${tag.korName} 보조 태그로 추가`}
                        title={`${selected.name}에 보조 태그로 추가`}
                        disabled={quickAddMutation.isPending}
                        onClick={() =>
                          quickAddMutation.mutate({
                            code: selected.code,
                            data: { tastingTagIds: [tag.id], role: 'PERIPHERAL' },
                          })
                        }
                      >
                        {tag.korName}
                      </ChipButton>
                    ))
                  )}
                </div>
                {ungroupedTags.length > QUICK_ADD_LIMIT && (
                  <Button
                    variant="link"
                    size="sm"
                    className="h-6 shrink-0 px-1 text-xs"
                    onClick={() => setIsConnectOpen(true)}
                  >
                    전체 {ungroupedTags.length}개
                  </Button>
                )}
              </div>
            </section>
          ) : (
            // 로딩 중에는 region을 붙이지 않아 작업대가 준비된 뒤에만 보조 기술이 찾게 한다
            <section
              role={isLoading ? undefined : 'region'}
              aria-label={isLoading ? undefined : '선택한 태그 그룹'}
              aria-busy={isLoading || undefined}
              className="flex items-center justify-center rounded-md border border-dashed p-8 text-sm text-muted-foreground"
            >
              {isLoading ? '불러오는 중...' : '왼쪽에서 그룹을 고르거나 새 그룹을 추가하세요.'}
            </section>
          )}
        </div>
      )}

      <TastingGroupFormDialog
        open={formTarget.open}
        onOpenChange={(open) => setFormTarget((prev) => ({ ...prev, open }))}
        group={formTarget.group}
        families={families}
        nextDisplayOrder={nextDisplayOrder}
      />
      <TastingGroupTagConnectSheet
        open={isConnectOpen}
        onOpenChange={setIsConnectOpen}
        group={selected}
      />
      <DeleteConfirmDialog
        open={removeTarget !== null}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
        onConfirm={() => {
          if (!selected || !removeTarget) return;
          removeTagMutation.mutate(
            { code: selected.code, tagId: removeTarget.tastingTagId },
            { onSuccess: () => setRemoveTarget(null) }
          );
        }}
        title="태그 제거"
        description={
          removeTarget && selected
            ? `'${removeTarget.korName}' 태그를 '${selected.name}' 그룹에서 제거합니다. 태그 자체는 남고 다시 연결할 수 있습니다.`
            : undefined
        }
        confirmText="제거"
        isPending={removeTagMutation.isPending}
      />
      <DeleteConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={() => selected && deleteMutation.mutate(selected.code)}
        title="태그 그룹 삭제"
        description={selected ? `'${selected.name}' 그룹을 삭제합니다.` : undefined}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
