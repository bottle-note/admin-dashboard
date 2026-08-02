import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { ChevronsUpDown, Loader2, Search, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { flattenTastingTagPages, useTastingTagListInfinite } from '@/hooks/useTastingTags';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { isNonComposingEnterKey } from '@/lib/keyboard';
import { cn } from '@/lib/utils';
import type { TastingTagListItem } from '@/types/api';

const DROPDOWN_GAP = 4;
const VIEWPORT_PADDING = 8;
const DROPDOWN_MAX_HEIGHT = 22 * 16;
const DROPDOWN_MIN_HEIGHT = 96;

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
  const [dropdownStyle, setDropdownStyle] = useState<CSSProperties>({});
  const [dropdownMaxHeight, setDropdownMaxHeight] = useState(DROPDOWN_MAX_HEIGHT);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const debouncedKeyword = useDebouncedValue(value.trim(), 300);
  const canLoadOptions = isOpen && !disabled;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isInsideInput = containerRef.current?.contains(target);
      const isInsideDropdown = dropdownRef.current?.contains(target);

      if (!isInsideInput && !isInsideDropdown) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) return;

    const updateDropdownPosition = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const spaceBelow = window.innerHeight - rect.bottom - DROPDOWN_GAP - VIEWPORT_PADDING;
      const spaceAbove = rect.top - DROPDOWN_GAP - VIEWPORT_PADDING;
      const shouldOpenAbove = spaceBelow < DROPDOWN_MAX_HEIGHT && spaceAbove > spaceBelow;
      const availableSpace = shouldOpenAbove ? spaceAbove : spaceBelow;
      const maxHeight = Math.max(
        DROPDOWN_MIN_HEIGHT,
        Math.min(DROPDOWN_MAX_HEIGHT, availableSpace)
      );

      setDropdownStyle(
        shouldOpenAbove
          ? {
              bottom: window.innerHeight - rect.top + DROPDOWN_GAP,
              left: rect.left,
              width: rect.width,
            }
          : {
              left: rect.left,
              top: rect.bottom + DROPDOWN_GAP,
              width: rect.width,
            }
      );
      setDropdownMaxHeight(maxHeight);
    };

    updateDropdownPosition();
    window.addEventListener('resize', updateDropdownPosition);
    window.addEventListener('scroll', updateDropdownPosition, true);

    return () => {
      window.removeEventListener('resize', updateDropdownPosition);
      window.removeEventListener('scroll', updateDropdownPosition, true);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    window.requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });
  }, [isOpen]);

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useTastingTagListInfinite(
      { keyword: debouncedKeyword || undefined, size: 20 },
      { enabled: canLoadOptions }
    );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    const root = scrollContainerRef.current;
    if (!sentinel || !root || !hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      {
        root,
        rootMargin: '180px 0px',
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const selectedTagNameSet = useMemo(
    () => new Set(selectedTagNames.map(normalizeTagName).filter(Boolean)),
    [selectedTagNames]
  );
  const fetchedItems = useMemo(() => flattenTastingTagPages(data), [data]);
  const filteredItems = useMemo(
    () => fetchedItems.filter((item) => !selectedTagNameSet.has(normalizeTagName(item.korName))),
    [fetchedItems, selectedTagNameSet]
  );
  const trimmedValue = value.trim();
  const normalizedTrimmedValue = normalizeTagName(trimmedValue);
  const canCreateDirectly = Boolean(
    onCreate && normalizedTrimmedValue && !selectedTagNameSet.has(normalizedTrimmedValue)
  );

  const handleSelect = (tag: TastingTagListItem) => {
    onSelect(tag);
    onValueChange('');
    setIsOpen(false);
  };

  const handleCreate = () => {
    if (!trimmedValue || !onCreate) return;

    const result = onCreate(trimmedValue);
    if (result !== false) {
      onValueChange('');
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    onValueChange('');
    searchInputRef.current?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
      return;
    }

    if (!isNonComposingEnterKey(event)) return;

    event.preventDefault();
    if (!trimmedValue || !onCreate) return;

    handleCreate();
  };

  const dropdown = isOpen
    ? createPortal(
        <div
          ref={dropdownRef}
          className="fixed z-[100] rounded-md border bg-popover shadow-lg"
          style={dropdownStyle}
        >
          <div className="border-b p-2">
            <div className="relative">
              <Search
                className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground"
                aria-hidden="true"
              />
              <Input
                ref={searchInputRef}
                aria-label={ariaLabel ? `${ariaLabel} 검색어` : '테이스팅 태그 검색어'}
                value={value}
                onChange={(event) => onValueChange(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="태그 검색 또는 직접 추가"
                className="h-9 rounded-md border-border pl-8 pr-20"
              />
              {value && !disabled && (
                <button
                  type="button"
                  aria-label="태그 검색어 지우기"
                  onClick={handleClear}
                  className="absolute right-14 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="absolute right-1 top-1/2 h-7 -translate-y-1/2 rounded px-2 text-xs font-medium"
                onClick={handleCreate}
                disabled={!canCreateDirectly}
              >
                추가
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filteredItems.length === 0 && !hasNextPage && !isFetchingNextPage ? (
            <div className="space-y-3 px-3 py-4 text-center">
              <p className="text-sm text-muted-foreground">검색 결과가 없습니다</p>
            </div>
          ) : (
            <div
              ref={scrollContainerRef}
              className="overflow-y-auto py-1"
              style={{ maxHeight: dropdownMaxHeight }}
            >
              <ul>
                {filteredItems.map((tag) => (
                  <li key={tag.id}>
                    <button
                      type="button"
                      aria-label={`${tag.korName} 태그 선택`}
                      onClick={() => handleSelect(tag)}
                      className={cn(
                        'flex w-full items-center gap-2 px-3 py-2 text-left',
                        'hover:bg-accent hover:text-accent-foreground',
                        'focus:bg-accent focus:text-accent-foreground focus:outline-none'
                      )}
                    >
                      {tag.icon && (
                        <img
                          src={tag.icon}
                          alt=""
                          className="h-5 w-5 flex-shrink-0 rounded object-cover"
                        />
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{tag.korName}</span>
                        {tag.engName && (
                          <span className="block truncate text-xs text-muted-foreground">
                            {tag.engName}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>

              <div
                ref={sentinelRef}
                className="flex min-h-10 items-center justify-center px-3 py-2"
              >
                {isFetchingNextPage ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : hasNextPage ? (
                  <span className="text-xs text-muted-foreground">더 불러오는 중...</span>
                ) : (
                  <span className="h-2" />
                )}
              </div>
            </div>
          )}
        </div>,
        document.body
      )
    : null;

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <Button
        type="button"
        variant="outline"
        role="combobox"
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
        disabled={disabled}
        className={cn(
          'h-9 w-full justify-between rounded-md border-border font-normal',
          'text-muted-foreground',
          inputClassName
        )}
      >
        <span className="truncate">{placeholder}</span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
      {dropdown}
    </div>
  );
}

function normalizeTagName(value: string) {
  return value.trim();
}
