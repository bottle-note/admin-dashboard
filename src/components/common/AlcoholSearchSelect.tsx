import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';

import { LookupSearchSelect } from '@/components/common/LookupSearchSelect';
import {
  flattenAdminAlcoholLookupPages,
  useAdminAlcoholLookupInfinite,
} from '@/hooks/useAdminAlcohols';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import type { AlcoholLookupItem } from '@/types/api';

export interface AlcoholSearchSelectProps {
  onSelect: (alcohol: AlcoholLookupItem) => void;
  excludeIds?: number[];
  placeholder?: string;
  ariaLabel?: string;
  selectionLabel?: string;
  disabled?: boolean;
  dropdownTestId?: string;
}

export function AlcoholSearchSelect({
  onSelect,
  excludeIds = [],
  placeholder = '주류 이름으로 검색...',
  ariaLabel = '주류 검색',
  selectionLabel = '주류',
  disabled = false,
  dropdownTestId = 'alcohol-search-dropdown',
}: AlcoholSearchSelectProps) {
  const [keyword, setKeyword] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const debouncedKeyword = useDebouncedValue(keyword.trim(), 300);
  const canSearch = debouncedKeyword.length >= 1;
  const query = useAdminAlcoholLookupInfinite(
    canSearch ? { keyword: debouncedKeyword, size: 10 } : undefined,
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
      getItemAriaLabel={(item) => `${item.korName} ${selectionLabel} 선택`}
      renderItem={(item) => (
        <>
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted">
            {item.imageUrl ? (
              <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No</div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{item.korName}</p>
            <p className="truncate text-sm text-muted-foreground">{item.engName}</p>
          </div>
        </>
      )}
      onSelect={(item) => {
        onSelect(item);
        setKeyword('');
      }}
      placeholder={placeholder}
      ariaLabel={ariaLabel}
      minimumSearchLength={1}
      disabled={disabled}
      leftElement={<Search className="h-4 w-4 text-muted-foreground" />}
      rightElement={
        keyword ? (
          <button type="button" aria-label={`${selectionLabel} 검색어 지우기`} onClick={() => setKeyword('')}>
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        ) : undefined
      }
      isLoading={query.isLoading}
      isError={query.isError}
      onRetry={() => void query.refetch()}
      isFetchingNextPage={query.isFetchingNextPage}
      hasNextPage={query.hasNextPage}
      onLoadMore={query.fetchNextPage}
      idleMessage="한 글자 이상 입력하면 검색 결과가 표시됩니다."
      showOnFocus
      dropdownTestId={dropdownTestId}
    />
  );
}
