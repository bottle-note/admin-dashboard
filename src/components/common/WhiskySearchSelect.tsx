import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';

import { LookupSearchSelect } from '@/components/common/LookupSearchSelect';
import {
  flattenAdminAlcoholLookupPages,
  useAdminAlcoholLookupInfinite,
} from '@/hooks/useAdminAlcohols';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

export interface SelectedWhisky {
  alcoholId: number;
  korName: string;
  engName: string;
  imageUrl: string | null;
}

export interface WhiskySearchSelectProps {
  onSelect: (whisky: SelectedWhisky) => void;
  excludeIds?: number[];
  placeholder?: string;
  disabled?: boolean;
}

export function WhiskySearchSelect({
  onSelect,
  excludeIds = [],
  placeholder = '위스키 이름으로 검색...',
  disabled = false,
}: WhiskySearchSelectProps) {
  const [keyword, setKeyword] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const debouncedKeyword = useDebouncedValue(keyword.trim(), 300);
  const canSearch = debouncedKeyword.length >= 1;
  const query = useAdminAlcoholLookupInfinite(
    canSearch ? { keyword: debouncedKeyword, pageSize: 10 } : undefined,
    { enabled: canSearch }
  );
  const fetchedItems = useMemo(() => flattenAdminAlcoholLookupPages(query.data), [query.data]);
  const items = useMemo(
    () => fetchedItems.filter((item) => !excludeIds.includes(item.alcoholId)),
    [excludeIds, fetchedItems]
  );

  return (
    <LookupSearchSelect
      value={keyword}
      onValueChange={setKeyword}
      open={isOpen}
      onOpenChange={setIsOpen}
      items={items}
      getItemKey={(item) => item.alcoholId}
      getItemAriaLabel={(item) => `${item.korName} 위스키 선택`}
      renderItem={(item) => (
        <>
          <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-md bg-muted">
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.korName} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                No
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate font-medium">{item.korName}</div>
            <div className="truncate text-sm text-muted-foreground">{item.engName}</div>
          </div>
        </>
      )}
      onSelect={(item) => {
        onSelect(item);
        setKeyword('');
      }}
      placeholder={placeholder}
      ariaLabel="위스키 검색"
      minimumSearchLength={1}
      disabled={disabled}
      leftElement={<Search className="h-4 w-4 text-muted-foreground" />}
      rightElement={
        keyword ? (
          <button
            type="button"
            aria-label="위스키 검색어 지우기"
            onClick={() => setKeyword('')}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        ) : undefined
      }
      isLoading={query.isLoading}
      isError={query.isError}
      onRetry={() => query.refetch()}
      isFetchingNextPage={query.isFetchingNextPage}
      hasNextPage={query.hasNextPage}
      onLoadMore={query.fetchNextPage}
      dropdownTestId="whisky-search-dropdown"
    />
  );
}
