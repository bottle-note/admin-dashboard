import { Search, Wine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  flattenAdminAlcoholLookupPages,
  useAdminAlcoholLookupInfinite,
} from '@/hooks/useAdminAlcohols';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import type { AlcoholLookupItem } from '@/types/api';

export function AlcoholStatisticsSearch({
  keyword,
  onKeywordChange,
  selectedIds,
  onSelect,
  disabled,
}: {
  keyword: string;
  onKeywordChange: (keyword: string) => void;
  selectedIds: number[];
  onSelect: (alcohol: AlcoholLookupItem) => void;
  disabled: boolean;
}) {
  const search = useDebouncedValue(keyword.trim(), 300);
  const query = useAdminAlcoholLookupInfinite(
    { keyword: search, size: 10 },
    { enabled: search.length > 0 }
  );
  const items = flattenAdminAlcoholLookupPages(query.data);
  const pending = keyword.trim() !== search || query.isLoading;

  return (
    <Card className="min-w-0 self-start xl:sticky xl:top-0">
      <CardHeader>
        <CardTitle className="text-base">위스키 찾기</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            aria-label="주류 검색"
            placeholder="이름으로 검색..."
            className="pl-9"
            value={keyword}
            onChange={(event) => onKeywordChange(event.target.value)}
          />
        </div>
        {disabled && (
          <p className="text-sm text-muted-foreground">
            최대 3개까지 비교할 수 있습니다. 선택한 주류를 제거하면 추가할 수 있습니다.
          </p>
        )}
        <div aria-live="polite" className="text-sm text-muted-foreground">
          {!keyword.trim()
            ? '한 글자 이상 입력하면 검색 결과가 표시됩니다.'
            : pending
              ? '검색 중...'
              : null}
        </div>
        {keyword.trim() && !pending ? (
          <>
            {query.isError ? (
              <div role="alert" className="space-y-2 text-sm">
                <p>검색 결과를 불러오지 못했습니다.</p>
                <Button variant="outline" size="sm" onClick={() => void query.refetch()}>
                  다시 시도
                </Button>
              </div>
            ) : items.length === 0 ? (
              <p className="text-sm text-muted-foreground">검색 결과가 없습니다.</p>
            ) : (
              <div
                data-testid="alcohol-statistics-search-results"
                className="max-h-80 space-y-1 overflow-y-auto xl:max-h-[calc(100vh-22rem)]"
              >
                {items.map((item) => {
                  const selected = selectedIds.includes(item.alcoholId);
                  return (
                    <Button
                      key={item.alcoholId}
                      variant={selected ? 'secondary' : 'ghost'}
                      className="h-auto w-full justify-start gap-3 whitespace-normal px-3 py-3 text-left"
                      aria-label={`${item.korName} 주류 선택`}
                      aria-pressed={selected}
                      disabled={disabled && !selected}
                      onClick={() => onSelect(item)}
                    >
                      <span className="flex h-12 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt=""
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <Wine className="h-5 w-5 text-muted-foreground" />
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block break-words font-medium">{item.korName}</span>
                        <span className="block break-words text-xs font-normal text-muted-foreground">
                          {item.engName}
                        </span>
                        <span className="block text-xs font-normal text-muted-foreground">
                          {item.korCategoryName}
                        </span>
                      </span>
                    </Button>
                  );
                })}
                {query.hasNextPage && (
                  <Button
                    className="w-full"
                    variant="outline"
                    disabled={query.isFetchingNextPage}
                    onClick={() => void query.fetchNextPage()}
                  >
                    {query.isFetchingNextPage ? '불러오는 중...' : '더 보기'}
                  </Button>
                )}
              </div>
            )}
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
