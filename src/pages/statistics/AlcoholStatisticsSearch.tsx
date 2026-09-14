import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Search, Wine } from 'lucide-react';
import { LookupSearchSelect } from '@/components/common/LookupSearchSelect';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  flattenAdminAlcoholLookupPages,
  useAdminAlcoholLookupInfinite,
} from '@/hooks/useAdminAlcohols';
import type { AlcoholLookupItem } from '@/types/api';

export function AlcoholStatisticsSearch({
  keyword,
  onSearch,
  selectedIds,
  onSelect,
  disabled,
}: {
  keyword: string;
  onSearch: (keyword: string) => void;
  selectedIds: number[];
  onSelect: (alcohol: AlcoholLookupItem) => void;
  disabled: boolean;
}) {
  const [input, setInput] = useState(keyword);
  const [isOpen, setIsOpen] = useState(false);
  const composing = useRef(false);
  useEffect(() => {
    setInput(keyword);
  }, [keyword]);
  const search = keyword.trim();
  const query = useAdminAlcoholLookupInfinite({ keyword: search, size: 10 }, { enabled: isOpen });
  const items = useMemo(() => flattenAdminAlcoholLookupPages(query.data), [query.data]);

  return (
    <Card className="min-w-0 self-start xl:sticky xl:top-0">
      <CardHeader>
        <CardTitle className="text-base">위스키 찾기</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (composing.current) return;
            const next = input.trim();
            setInput(next);
            onSearch(next);
          }}
        >
          <LookupSearchSelect
            value={input}
            onValueChange={setInput}
            open={isOpen}
            onOpenChange={setIsOpen}
            items={items}
            getItemKey={(item) => item.alcoholId}
            getItemAriaLabel={(item) => `${item.korName} 주류 선택`}
            isItemSelected={(item) => selectedIds.includes(item.alcoholId)}
            isItemDisabled={(item) => disabled && !selectedIds.includes(item.alcoholId)}
            renderItem={(item) => {
              const selected = selectedIds.includes(item.alcoholId);
              return (
                <>
                  <span className="flex h-12 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt="" className="h-full w-full object-contain" />
                    ) : (
                      <Wine className="h-5 w-5 text-muted-foreground" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block break-words font-medium">{item.korName}</span>
                    <span className="block break-words text-xs text-muted-foreground">
                      {item.engName}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {item.korCategoryName}
                    </span>
                  </span>
                  {selected && <Check className="h-4 w-4 shrink-0" aria-label="선택됨" />}
                </>
              );
            }}
            onSelect={onSelect}
            placeholder="이름으로 검색..."
            ariaLabel="주류 검색"
            minimumSearchLength={0}
            disabled={false}
            leftElement={<Search className="h-4 w-4 text-muted-foreground" />}
            isLoading={query.isLoading}
            isError={query.isError}
            onRetry={() => void query.refetch()}
            isFetchingNextPage={query.isFetchingNextPage}
            hasNextPage={query.hasNextPage}
            onLoadMore={query.fetchNextPage}
            showOnFocus
            dropdownTestId="alcohol-statistics-search-results"
            onInputKeyDown={(event) => {
              if (
                event.key === 'Enter' &&
                (composing.current ||
                  event.nativeEvent.isComposing ||
                  event.nativeEvent.keyCode === 229)
              ) {
                event.preventDefault();
              }
            }}
            onInputCompositionStart={() => {
              composing.current = true;
            }}
            onInputCompositionEnd={() => {
              composing.current = false;
            }}
          />
        </form>
        {disabled && (
          <p className="text-sm text-muted-foreground">
            최대 3개까지 비교할 수 있습니다. 선택한 주류를 제거하면 추가할 수 있습니다.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
