import { useMemo, useState, type KeyboardEvent } from 'react';
import { Search, X } from 'lucide-react';

import { LookupSearchSelect } from '@/components/common/LookupSearchSelect';
import { Button } from '@/components/ui/button';
import { flattenTastingTagPages, useTastingTagListInfinite } from '@/hooks/useTastingTags';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { isNonComposingEnterKey } from '@/lib/keyboard';
import type { TastingTagListItem } from '@/types/api';

interface CurationTastingTagComboboxProps {
  value: string;
  onValueChange: (value: string) => void;
  onSelect: (tag: TastingTagListItem) => void;
  onCreate?: (value: string) => boolean | void;
  selectedTagNames?: string[];
  ariaLabel?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
}

export function CurationTastingTagCombobox({
  value,
  onValueChange,
  onSelect,
  onCreate,
  selectedTagNames = [],
  ariaLabel,
  placeholder = '태그 검색...',
  disabled = false,
  className,
  inputClassName,
}: CurationTastingTagComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const debouncedKeyword = useDebouncedValue(value.trim(), 300);
  const query = useTastingTagListInfinite(
    { keyword: debouncedKeyword || undefined, size: 20 },
    { enabled: isOpen && !disabled }
  );
  const selectedTagNameSet = useMemo(
    () => new Set(selectedTagNames.map(normalizeTagName).filter(Boolean)),
    [selectedTagNames]
  );
  const fetchedItems = useMemo(() => flattenTastingTagPages(query.data), [query.data]);
  const items = useMemo(
    () => fetchedItems.filter((item) => !selectedTagNameSet.has(normalizeTagName(item.korName))),
    [fetchedItems, selectedTagNameSet]
  );
  const trimmedValue = value.trim();
  const normalizedValue = normalizeTagName(trimmedValue);
  const canCreate = Boolean(
    onCreate && normalizedValue && !selectedTagNameSet.has(normalizedValue)
  );

  const handleCreate = () => {
    if (!trimmedValue || !onCreate) return;

    const result = onCreate(trimmedValue);
    if (result !== false) {
      onValueChange('');
      setIsOpen(false);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
      return;
    }
    if (!isNonComposingEnterKey(event)) return;

    event.preventDefault();
    handleCreate();
  };

  return (
    <LookupSearchSelect
      value={value}
      onValueChange={onValueChange}
      open={isOpen}
      onOpenChange={setIsOpen}
      items={items}
      getItemKey={(tag) => tag.id}
      getItemAriaLabel={(tag) => `${tag.korName} 태그 선택`}
      renderItem={(tag) => (
        <>
          {tag.icon && (
            <img src={tag.icon} alt="" className="h-5 w-5 flex-shrink-0 rounded object-cover" />
          )}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{tag.korName}</span>
            {tag.engName && (
              <span className="block truncate text-xs text-muted-foreground">{tag.engName}</span>
            )}
          </span>
        </>
      )}
      onSelect={(tag) => {
        onSelect(tag);
        onValueChange('');
      }}
      placeholder={placeholder}
      ariaLabel={ariaLabel ?? '테이스팅 태그 검색'}
      disabled={disabled}
      className={className}
      inputClassName={onCreate ? `pr-24 ${inputClassName ?? ''}` : inputClassName}
      leftElement={<Search className="h-4 w-4 text-muted-foreground" aria-hidden="true" />}
      rightElement={
        value || onCreate ? (
          <>
            {value && (
              <button
                type="button"
                aria-label="태그 검색어 지우기"
                onClick={() => onValueChange('')}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            {onCreate && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 rounded px-2 text-xs font-medium"
                onClick={handleCreate}
                disabled={!canCreate}
              >
                추가
              </Button>
            )}
          </>
        ) : undefined
      }
      isLoading={query.isLoading}
      isError={query.isError}
      onRetry={() => query.refetch()}
      isFetchingNextPage={query.isFetchingNextPage}
      hasNextPage={query.hasNextPage}
      onLoadMore={query.fetchNextPage}
      onInputKeyDown={handleKeyDown}
    />
  );
}

function normalizeTagName(value: string) {
  return value.trim();
}
