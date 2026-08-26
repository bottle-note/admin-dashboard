import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type Key,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const DROPDOWN_GAP = 4;
const VIEWPORT_PADDING = 8;
const DROPDOWN_MAX_HEIGHT = 22 * 16;
const DROPDOWN_MIN_HEIGHT = 96;

export interface LookupSearchSelectProps<TItem> {
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: TItem[];
  getItemKey: (item: TItem) => Key;
  renderItem: (item: TItem) => ReactNode;
  onSelect: (item: TItem) => void;
  getItemAriaLabel?: (item: TItem) => string;
  placeholder?: string;
  ariaLabel?: string;
  minimumSearchLength?: number;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  leftElement?: ReactNode;
  rightElement?: ReactNode;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  isFetchingNextPage?: boolean;
  hasNextPage?: boolean;
  onLoadMore?: () => Promise<unknown> | void;
  emptyMessage?: string;
  onInputKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
  dropdownTestId?: string;
}

export function LookupSearchSelect<TItem>({
  value,
  onValueChange,
  open,
  onOpenChange,
  items,
  getItemKey,
  renderItem,
  onSelect,
  getItemAriaLabel,
  placeholder = '검색...',
  ariaLabel,
  minimumSearchLength = 0,
  disabled = false,
  className,
  inputClassName,
  leftElement,
  rightElement,
  isLoading = false,
  isError = false,
  onRetry,
  isFetchingNextPage = false,
  hasNextPage = false,
  onLoadMore,
  emptyMessage = '검색 결과가 없습니다',
  onInputKeyDown,
  dropdownTestId,
}: LookupSearchSelectProps<TItem>) {
  const [dropdownStyle, setDropdownStyle] = useState<CSSProperties>({});
  const [dropdownMaxHeight, setDropdownMaxHeight] = useState(DROPDOWN_MAX_HEIGHT);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const canShowDropdown = open && !disabled && value.trim().length >= minimumSearchLength;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!(event.target instanceof Node)) return;

      const isInsideInput = containerRef.current?.contains(event.target);
      const isInsideDropdown = dropdownRef.current?.contains(event.target);

      if (!isInsideInput && !isInsideDropdown) onOpenChange(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onOpenChange]);

  useLayoutEffect(() => {
    if (!canShowDropdown) return;

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
  }, [canShowDropdown]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    const root = scrollContainerRef.current;
    if (!sentinel || !root || !hasNextPage || !onLoadMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) void onLoadMore();
      },
      { root, rootMargin: '180px 0px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, onLoadMore]);

  const dropdown = canShowDropdown
    ? createPortal(
        <div
          ref={dropdownRef}
          data-testid={dropdownTestId}
          className="fixed z-[100] rounded-md border bg-popover shadow-lg"
          style={dropdownStyle}
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : isError ? (
            <div className="space-y-3 px-3 py-5 text-center">
              <p className="text-sm text-muted-foreground">검색 결과를 불러오지 못했습니다.</p>
              {onRetry && (
                <Button type="button" variant="outline" size="sm" onClick={onRetry}>
                  다시 시도
                </Button>
              )}
            </div>
          ) : items.length === 0 && !hasNextPage && !isFetchingNextPage ? (
            <div className="py-6 text-center text-sm text-muted-foreground">{emptyMessage}</div>
          ) : (
            <div
              ref={scrollContainerRef}
              className="overflow-y-auto py-1"
              style={{ maxHeight: dropdownMaxHeight }}
            >
              <ul>
                {items.map((item) => (
                  <li key={getItemKey(item)}>
                    <button
                      type="button"
                      aria-label={getItemAriaLabel?.(item)}
                      onClick={() => {
                        onSelect(item);
                        onOpenChange(false);
                      }}
                      className={cn(
                        'flex w-full items-center gap-3 px-3 py-2 text-left',
                        'hover:bg-accent hover:text-accent-foreground',
                        'focus:bg-accent focus:text-accent-foreground focus:outline-none'
                      )}
                    >
                      {renderItem(item)}
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
      <div className="relative">
        {leftElement && (
          <div className="absolute left-3 top-1/2 z-10 -translate-y-1/2">{leftElement}</div>
        )}
        <Input
          role="combobox"
          aria-label={ariaLabel}
          aria-expanded={canShowDropdown}
          aria-autocomplete="list"
          value={value}
          onChange={(event) => {
            onValueChange(event.target.value);
            onOpenChange(true);
          }}
          onFocus={() => onOpenChange(true)}
          onClick={() => onOpenChange(true)}
          onKeyDown={onInputKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(leftElement && 'pl-9', rightElement && 'pr-10', inputClassName)}
        />
        {rightElement && (
          <div className="absolute right-2 top-1/2 z-10 flex -translate-y-1/2 items-center gap-1">
            {rightElement}
          </div>
        )}
      </div>
      {dropdown}
    </div>
  );
}
