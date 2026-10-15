/**
 * 태그 연결 측면 패널
 * - 전송 목록 구조: 왼쪽은 미소속 태그(즉시 검색·결과 전체 선택), 오른쪽은 이 그룹의 태그(역할 변경·제거)
 * - 고른 태그는 칩으로 쌓이고 칩마다 역할(대표/보조)을 바꿀 수 있어 한 번에 섞어서 추가한다
 * - 추가 뒤에도 패널은 열린 채 선택만 비워 연속 작업이 가능하다
 * - 키보드: ↑↓ 이동, Enter 체크, Backspace(빈 검색창) 마지막 칩 삭제, Cmd/Ctrl+A 결과 전체 선택
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeftRight, Check, Search, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatNumber } from '@/lib/format';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  useTastingGroupAddTags,
  useTastingGroupChangeTagRole,
  useTastingGroupRemoveTag,
  useUngroupedTastingTags,
} from '@/hooks/useTastingGroups';
import type { TastingGroupItem, TastingGroupRole, UngroupedTastingTag } from '@/types/api';
import { OTHER_ROLE, ROLE_LABEL } from './tasting-group.schema';

interface TastingGroupTagConnectSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: TastingGroupItem | null;
}

interface Picked {
  tag: UngroupedTastingTag;
  role: TastingGroupRole;
}

const SEARCH_DEBOUNCE_MS = 200;

function useDebounced(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function TastingGroupTagConnectSheet({
  open,
  onOpenChange,
  group,
}: TastingGroupTagConnectSheetProps) {
  const [keywordInput, setKeywordInput] = useState('');
  const keyword = useDebounced(keywordInput.trim(), SEARCH_DEBOUNCE_MS);
  const [picked, setPicked] = useState<Picked[]>([]);
  const [defaultRole, setDefaultRole] = useState<TastingGroupRole>('CORE');
  const [highlight, setHighlight] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);

  const { data: results = [], isLoading } = useUngroupedTastingTags(keyword, open);
  const sorted = useMemo(
    () => [...results].sort((a, b) => b.alcoholCount - a.alcoholCount),
    [results]
  );
  const maxCount = sorted[0]?.alcoholCount ?? 0;
  const pickedIds = useMemo(() => new Set(picked.map((item) => item.tag.id)), [picked]);

  const addTagsMutation = useTastingGroupAddTags({ onSuccess: () => setPicked([]) });
  const changeRoleMutation = useTastingGroupChangeTagRole();
  const removeTagMutation = useTastingGroupRemoveTag();
  const isMutating =
    addTagsMutation.isPending || changeRoleMutation.isPending || removeTagMutation.isPending;

  // 닫을 때 입력 상태를 비워 다음에 열 때 깨끗한 상태로 시작한다
  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setKeywordInput('');
      setPicked([]);
      setDefaultRole('CORE');
      setHighlight(0);
    }
    onOpenChange(next);
  };

  const togglePick = (tag: UngroupedTastingTag) => {
    setPicked((prev) =>
      prev.some((item) => item.tag.id === tag.id)
        ? prev.filter((item) => item.tag.id !== tag.id)
        : [...prev, { tag, role: defaultRole }]
    );
  };

  const selectAllResults = () => {
    setPicked((prev) => {
      const existing = new Set(prev.map((item) => item.tag.id));
      const additions = sorted
        .filter((tag) => !existing.has(tag.id))
        .map((tag) => ({ tag, role: defaultRole }));
      return [...prev, ...additions];
    });
  };

  const flipPickedRole = (id: number) => {
    setPicked((prev) =>
      prev.map((item) => (item.tag.id === id ? { ...item, role: OTHER_ROLE[item.role] } : item))
    );
  };

  const submit = () => {
    if (!group || picked.length === 0) return;
    const byRole = (role: TastingGroupRole) =>
      picked.filter((item) => item.role === role).map((item) => item.tag.id);
    addTagsMutation.mutate({
      code: group.code,
      data: [
        { tastingTagIds: byRole('CORE'), role: 'CORE' },
        { tastingTagIds: byRole('PERIPHERAL'), role: 'PERIPHERAL' },
      ],
    });
  };

  const onSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlight((h) => Math.min(h + 1, Math.max(sorted.length - 1, 0)));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const target = sorted[highlight];
      if (target) togglePick(target);
    } else if (event.key === 'Backspace' && keywordInput === '' && picked.length > 0) {
      event.preventDefault();
      setPicked((prev) => prev.slice(0, -1));
    } else if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'a') {
      event.preventDefault();
      selectAllResults();
    }
  };

  const currentTags = group?.tags ?? [];

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-3xl">
        <SheetHeader className="border-b px-5 py-4">
          <SheetTitle className="text-base">
            {group ? `${group.name} 태그 연결` : '태그 연결'}
          </SheetTitle>
          <SheetDescription className="text-xs">
            왼쪽에서 미소속 태그를 골라 추가합니다. 오른쪽에서는 이 그룹에 이미 있는 태그의 역할을
            바꾸거나 제거합니다. 패널은 추가 뒤에도 열려 있습니다.
          </SheetDescription>
        </SheetHeader>

        <div className="grid min-h-0 flex-1 grid-cols-2 divide-x">
          {/* 왼쪽: 미소속 태그 */}
          <section className="flex min-h-0 flex-col" aria-label="미소속 태그">
            <div className="space-y-2 border-b px-4 py-3">
              {picked.length > 0 && (
                <div
                  className="flex max-h-20 flex-wrap gap-1.5 overflow-auto"
                  role="list"
                  aria-label="추가할 태그"
                >
                  {picked.map(({ tag, role }) => {
                    const isCore = role === 'CORE';
                    return (
                      <span
                        key={tag.id}
                        role="listitem"
                        className={`inline-flex items-center gap-0.5 rounded-full border py-0 pl-2 pr-0.5 text-[11px] ${
                          isCore ? 'border-primary bg-primary/10 font-medium' : 'border-border'
                        }`}
                      >
                        {tag.korName}
                        <button
                          type="button"
                          className="flex h-6 min-w-6 items-center justify-center rounded px-1.5 text-[11px] text-muted-foreground hover:bg-muted"
                          aria-label={`${tag.korName} 역할 전환 (현재 ${ROLE_LABEL[role]})`}
                          title={`${ROLE_LABEL[OTHER_ROLE[role]]}로 전환`}
                          onClick={() => flipPickedRole(tag.id)}
                        >
                          {isCore ? '대표' : '보조'}
                        </button>
                        <button
                          type="button"
                          className="flex h-6 w-6 items-center justify-center rounded hover:bg-muted"
                          aria-label={`${tag.korName} 선택 해제`}
                          onClick={() => togglePick(tag)}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  ref={searchRef}
                  value={keywordInput}
                  onChange={(e) => {
                    setKeywordInput(e.target.value);
                    setHighlight(0);
                  }}
                  onKeyDown={onSearchKeyDown}
                  placeholder="태그 이름으로 검색"
                  aria-label="미소속 태그 검색"
                  aria-activedescendant={
                    sorted[highlight] ? `ungrouped-${sorted[highlight].id}` : undefined
                  }
                  className="h-8 pl-8 text-xs"
                  autoFocus
                />
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {isLoading ? '검색 중...' : `${sorted.length}개`}
                  {keyword ? ` · "${keyword}"` : ''}
                </span>
                <div className="flex items-center gap-1">
                  <span>새 태그 역할</span>
                  {(['CORE', 'PERIPHERAL'] as const).map((role) => (
                    <Button
                      key={role}
                      type="button"
                      size="sm"
                      variant={defaultRole === role ? 'default' : 'ghost'}
                      className="h-7 px-2 text-[11px]"
                      aria-pressed={defaultRole === role}
                      onClick={() => setDefaultRole(role)}
                    >
                      {ROLE_LABEL[role]}
                    </Button>
                  ))}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="ml-1 h-7 px-2 text-[11px]"
                    disabled={sorted.length === 0}
                    onClick={selectAllResults}
                  >
                    결과 전체 선택
                  </Button>
                </div>
              </div>
            </div>

            <ul className="min-h-0 flex-1 overflow-auto" role="listbox" aria-multiselectable="true">
              {!isLoading && sorted.length === 0 && (
                <li className="p-6 text-center text-xs text-muted-foreground">
                  연결할 수 있는 미소속 태그가 없습니다.
                </li>
              )}
              {sorted.map((tag, index) => {
                const checked = pickedIds.has(tag.id);
                const ratio = maxCount > 0 ? tag.alcoholCount / maxCount : 0;
                return (
                  <li
                    key={tag.id}
                    id={`ungrouped-${tag.id}`}
                    role="option"
                    aria-selected={checked}
                    aria-label={tag.korName}
                    tabIndex={-1}
                    className={`flex cursor-pointer select-none items-center gap-2 border-b px-4 py-1.5 text-xs ${
                      index === highlight ? 'bg-muted/60' : ''
                    } ${checked ? 'bg-primary/5' : ''}`}
                    onMouseEnter={() => setHighlight(index)}
                    onClick={() => togglePick(tag)}
                  >
                    <span
                      aria-hidden="true"
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                        checked
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-input'
                      }`}
                    >
                      {checked && <Check className="h-3 w-3" />}
                    </span>
                    <span className="w-28 shrink-0 truncate font-medium">{tag.korName}</span>
                    <span className="w-20 shrink-0 truncate text-muted-foreground">
                      {tag.engName}
                    </span>
                    <span className="h-1.5 flex-1 overflow-hidden rounded bg-muted">
                      <span
                        className="block h-full rounded bg-primary/40"
                        style={{ width: `${Math.max(2, ratio * 100)}%` }}
                      />
                    </span>
                    <span className="w-12 shrink-0 text-right tabular-nums text-muted-foreground">
                      {formatNumber(tag.alcoholCount)}
                    </span>
                  </li>
                );
              })}
            </ul>

            <div className="flex items-center justify-between border-t px-4 py-3">
              <span className="text-xs text-muted-foreground">
                {picked.length > 0
                  ? `대표 ${picked.filter((p) => p.role === 'CORE').length} · 보조 ${picked.filter((p) => p.role === 'PERIPHERAL').length}`
                  : '↑↓ 이동 · Enter 선택 · Backspace 마지막 칩 삭제'}
              </span>
              <Button
                type="button"
                size="sm"
                className="h-8"
                disabled={picked.length === 0 || addTagsMutation.isPending}
                onClick={submit}
              >
                {addTagsMutation.isPending
                  ? '추가 중...'
                  : picked.length > 0
                    ? `${picked.length}개 추가`
                    : '추가'}
              </Button>
            </div>
          </section>

          {/* 오른쪽: 이 그룹의 태그 */}
          <section className="flex min-h-0 flex-col" role="region" aria-label="이 그룹의 태그">
            <div className="border-b px-4 py-3 text-xs">
              <span className="font-medium">이 그룹의 태그 {currentTags.length}개</span>
              <span className="ml-2 text-muted-foreground">
                대표 {currentTags.filter((tag) => tag.role.code === 'CORE').length} · 보조{' '}
                {currentTags.filter((tag) => tag.role.code === 'PERIPHERAL').length}
              </span>
            </div>
            <ul className="min-h-0 flex-1 overflow-auto">
              {currentTags.length === 0 && (
                <li className="p-6 text-center text-xs text-muted-foreground">
                  아직 연결된 태그가 없습니다.
                </li>
              )}
              {currentTags.map((tag) => {
                const nextRole = OTHER_ROLE[tag.role.code];
                return (
                  <li
                    key={tag.tastingTagId}
                    className="flex items-center gap-2 border-b px-4 py-1.5 text-xs"
                  >
                    <span className="w-28 shrink-0 truncate font-medium">{tag.korName}</span>
                    <Badge
                      variant={tag.role.code === 'CORE' ? 'default' : 'secondary'}
                      className="px-1.5 py-0 text-[11px] font-medium"
                    >
                      {ROLE_LABEL[tag.role.code]}
                    </Badge>
                    <span className="flex-1 text-right tabular-nums text-muted-foreground">
                      {formatNumber(tag.alcoholCount)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-1.5 text-[11px]"
                      aria-label={`${tag.korName} 역할을 ${ROLE_LABEL[nextRole]}로 변경`}
                      disabled={isMutating || !group}
                      onClick={() =>
                        group &&
                        changeRoleMutation.mutate({
                          code: group.code,
                          tagId: tag.tastingTagId,
                          data: { role: nextRole },
                        })
                      }
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
                      disabled={isMutating || !group}
                      onClick={() =>
                        group &&
                        removeTagMutation.mutate({ code: group.code, tagId: tag.tastingTagId })
                      }
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
