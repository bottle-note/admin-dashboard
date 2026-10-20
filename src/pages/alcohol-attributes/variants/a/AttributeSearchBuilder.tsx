import { useEffect, useState } from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { useQueries } from '@tanstack/react-query';
import { Plus, X } from 'lucide-react';
import { useAlcoholAttributes } from '@/hooks/useAlcoholAttributes';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import {
  alcoholAttributeKeys,
  alcoholAttributeService,
} from '@/services/alcohol-attribute.service';
import type { AttributeSearchOperator } from '@/types/api/alcohol-attribute.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverTrigger } from '@/components/ui/popover';
import {
  allowedOperators,
  conditionError,
  emptySearch,
  requiresSearchValue,
  searchOperators,
  type AttributeSearch,
} from './attribute-search';

const selectClass =
  'h-9 min-w-0 rounded-md border bg-white px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700';

export function AttributeSearchBuilder({
  value,
  onApply,
  label = '속성 조건 검색',
  error,
}: {
  value: AttributeSearch;
  onApply: (value: AttributeSearch) => void;
  label?: string;
  error?: string;
}) {
  const [draft, setDraft] = useState(value);
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
  useEffect(() => {
    const close = () => setOpen(false);
    document.addEventListener('fullscreenchange', close);
    return () => document.removeEventListener('fullscreenchange', close);
  }, []);
  const dirty = JSON.stringify(draft) !== JSON.stringify(value);
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(0);
  const [attempted, setAttempted] = useState(false);
  const debounced = useDebouncedValue(keyword, 200);
  const options = useAlcoholAttributes({ keyword: debounced || undefined, page, size: 20 });
  const keys = [...new Set(draft.conditions.map((c) => c.key))];
  const definitions = useQueries({
    queries: keys.map((key) => ({
      queryKey: alcoholAttributeKeys.list({ keyword: key, page: 0, size: 100 }),
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        alcoholAttributeService.list({ keyword: key, page: 0, size: 100 }, signal),
      staleTime: 60_000,
    })),
  });
  const attributes = new Map(
    [
      ...(options.data?.items ?? []),
      ...definitions.flatMap((result) => result.data?.items ?? []),
    ].map((attribute) => [attribute.key, attribute])
  );
  const errors = draft.conditions.map((condition) =>
    conditionError(condition, attributes.get(condition.key))
  );
  const selectedCount = keys.length;
  const update = (index: number, update: Partial<AttributeSearch['conditions'][number]>) => {
    setDraft((previous) => ({
      ...previous,
      conditions: previous.conditions.map((condition, i) =>
        i === index ? { ...condition, ...update } : condition
      ),
    }));
  };
  return (
    <section aria-label={label} className="space-y-3 rounded-lg border bg-slate-50/60 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium text-slate-700">
          적용된 속성 조건:{' '}
          {value.conditions.length
            ? `${value.conditions.length}개 · ${value.match === 'AND' ? '모두 충족' : '하나 이상 충족'}`
            : '없음'}
        </p>
        <Button
          size="sm"
          variant="ghost"
          aria-expanded={!collapsed}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? '조건 펼치기' : '조건 접기'}
        </Button>
      </div>
      {value.conditions.length > 0 && (
        <p className="break-words text-xs text-slate-500">
          {value.conditions
            .map(
              (condition) =>
                `${attributes.get(condition.key)?.displayName ?? condition.key} ${searchOperators[condition.operator]}${condition.value ? ` ${condition.value}` : ''}`
            )
            .join(' · ')}
        </p>
      )}
      {dirty && (
        <p role="status" className="text-xs font-medium text-amber-800">
          변경한 조건을 아직 적용하지 않았습니다.
        </p>
      )}
      <div
        hidden={collapsed}
        className={collapsed ? 'hidden' : 'flex flex-wrap items-center gap-2'}
      >
        <Popover
          open={open}
          onOpenChange={(next) => {
            setPortalContainer(
              document.fullscreenElement instanceof HTMLElement ? document.fullscreenElement : null
            );
            setOpen(next);
          }}
        >
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="h-3.5 w-3.5" />
              속성 선택{selectedCount > 0 && ` (${selectedCount})`}
            </Button>
          </PopoverTrigger>
          <PopoverPrimitive.Portal container={portalContainer}>
            <PopoverPrimitive.Content
              align="start"
              sideOffset={4}
              className="z-50 w-80 max-w-[calc(100vw-32px)] space-y-2 rounded-md border bg-popover p-3 text-popover-foreground shadow-md outline-none"
            >
              <Input
                aria-label="검색 조건 속성 찾기"
                placeholder="속성 이름 또는 키 검색"
                value={keyword}
                onChange={(event) => {
                  setKeyword(event.target.value);
                  setPage(0);
                }}
              />
              <div className="max-h-64 space-y-1 overflow-auto">
                {options.isFetching && (
                  <p className="p-2 text-xs text-slate-500">속성을 불러오는 중입니다.</p>
                )}
                {options.error ? (
                  <div role="alert" className="text-xs text-red-700">
                    속성을 불러오지 못했습니다.
                    <Button variant="ghost" size="sm" onClick={() => void options.refetch()}>
                      다시 조회
                    </Button>
                  </div>
                ) : (
                  options.data?.items.map((attribute) => (
                    <label
                      key={attribute.id}
                      className="flex cursor-pointer items-start gap-2 rounded p-2 text-xs hover:bg-slate-50"
                    >
                      <Checkbox
                        aria-label={`검색 속성 ${attribute.displayName}`}
                        checked={keys.includes(attribute.key)}
                        disabled={!keys.includes(attribute.key) && draft.conditions.length >= 20}
                        onCheckedChange={(checked) =>
                          setDraft((previous) => ({
                            ...previous,
                            conditions:
                              checked === true
                                ? [
                                    ...previous.conditions,
                                    { key: attribute.key, operator: 'EXISTS' },
                                  ]
                                : previous.conditions.filter(
                                    (condition) => condition.key !== attribute.key
                                  ),
                          }))
                        }
                      />
                      <span className="min-w-0 break-words">{attribute.displayName}</span>
                    </label>
                  ))
                )}
                {!options.isFetching && options.data?.items.length === 0 && (
                  <p className="p-2 text-xs text-slate-500">검색 결과가 없습니다.</p>
                )}
              </div>
              <div className="flex items-center justify-between border-t pt-2">
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={page === 0 || options.isFetching}
                  onClick={() => setPage(page - 1)}
                >
                  속성 이전
                </Button>
                <span className="text-xs">{page + 1}페이지</span>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={!options.data?.meta.hasNext || options.isFetching}
                  onClick={() => setPage(page + 1)}
                >
                  속성 다음
                </Button>
              </div>
            </PopoverPrimitive.Content>
          </PopoverPrimitive.Portal>
        </Popover>
        <select
          aria-label="조건 결합 방식"
          className={selectClass}
          value={draft.match}
          onChange={(event) =>
            setDraft((previous) => ({
              ...previous,
              match: event.target.value as AttributeSearch['match'],
            }))
          }
        >
          <option value="AND">모두 충족 (AND)</option>
          <option value="OR">하나 이상 충족 (OR)</option>
        </select>
        <span className="text-xs text-slate-500">조건 {draft.conditions.length}/20</span>
      </div>
      {!collapsed &&
        draft.conditions.map((condition, index) => {
          const attribute = attributes.get(condition.key);
          const name = attribute?.displayName ?? condition.key;
          return (
            <div key={`${condition.key}-${index}`} className="space-y-1">
              <div className="flex flex-wrap items-center gap-2 rounded-md border bg-white p-2">
                <span className="min-w-0 flex-1 basis-40 break-words text-xs font-medium">
                  {name}
                </span>
                <select
                  aria-label={`조건 ${index + 1} 연산자`}
                  className={selectClass}
                  value={condition.operator}
                  disabled={!attribute}
                  onChange={(event) => {
                    const operator = event.target.value as AttributeSearchOperator;
                    update(index, {
                      operator,
                      value: requiresSearchValue(operator) ? (condition.value ?? '') : undefined,
                    });
                  }}
                >
                  {(attribute ? allowedOperators(attribute.datatype) : [condition.operator]).map(
                    (operator) => (
                      <option key={operator} value={operator}>
                        {searchOperators[operator]}
                      </option>
                    )
                  )}
                </select>
                {requiresSearchValue(condition.operator) &&
                  (attribute?.datatype === 'BOOLEAN' ? (
                    <select
                      aria-label={`조건 ${index + 1} 값`}
                      className={selectClass}
                      value={condition.value ?? ''}
                      onChange={(event) => update(index, { value: event.target.value })}
                    >
                      <option value="">값 선택</option>
                      <option value="true">예</option>
                      <option value="false">아니오</option>
                    </select>
                  ) : (
                    <Input
                      aria-label={`조건 ${index + 1} 값`}
                      className="h-9 w-40 text-xs"
                      maxLength={255}
                      placeholder={attribute?.unit ? `값 (${attribute.unit})` : '값 입력'}
                      value={condition.value ?? ''}
                      onChange={(event) => update(index, { value: event.target.value })}
                    />
                  ))}
                <Button
                  aria-label={`조건 ${index + 1} 복제`}
                  title="같은 속성에 범위 조건 추가"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  disabled={draft.conditions.length >= 20}
                  onClick={() =>
                    setDraft((previous) => ({
                      ...previous,
                      conditions: [...previous.conditions, { ...condition }],
                    }))
                  }
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
                <Button
                  aria-label={`조건 ${index + 1} 삭제`}
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() =>
                    setDraft((previous) => ({
                      ...previous,
                      conditions: previous.conditions.filter((_, i) => i !== index),
                    }))
                  }
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
              {attempted && errors[index] && (
                <p role="alert" className="text-xs text-red-700">
                  {name}: {errors[index]}
                </p>
              )}
            </div>
          );
        })}
      {definitions.some((result) => result.isError) && (
        <p role="alert" className="text-xs text-red-700">
          선택한 속성 정보를 불러오지 못했습니다.
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              definitions
                .filter((result) => result.isError)
                .forEach((result) => void result.refetch());
            }}
          >
            다시 조회
          </Button>
        </p>
      )}
      {error && (
        <p role="alert" className="text-xs text-red-700">
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          disabled={definitions.some((result) => result.isFetching && !result.data)}
          onClick={() => {
            setAttempted(true);
            if (!errors.some(Boolean))
              onApply({
                ...draft,
                conditions: draft.conditions.map((condition) =>
                  requiresSearchValue(condition.operator)
                    ? { ...condition, value: condition.value?.trim() }
                    : { key: condition.key, operator: condition.operator }
                ),
              });
          }}
        >
          검색 적용
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setDraft(emptySearch);
            setAttempted(false);
            onApply(emptySearch);
          }}
        >
          조건 초기화
        </Button>
        <span className="text-[11px] text-slate-500">
          여러 속성을 체크하세요. 같은 속성의 + 버튼으로 범위를 추가할 수 있습니다.
        </span>
      </div>
    </section>
  );
}
