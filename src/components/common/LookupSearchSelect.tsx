import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type CompositionEventHandler,
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
  isItemSelected?: (item: TItem) => boolean;
  isItemDisabled?: (item: TItem) => boolean;
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
  idleMessage?: string;
  showOnFocus?: boolean;
  onInputKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
  onInputCompositionStart?: CompositionEventHandler<HTMLInputElement>;
  onInputCompositionEnd?: CompositionEventHandler<HTMLInputElement>;
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
  isItemSelected,
  isItemDisabled,
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
  idleMessage,
  showOnFocus = false,
  onInputKeyDown,
  onInputCompositionStart,
  onInputCompositionEnd,
  dropdownTestId,
}: LookupSearchSelectProps<TItem>) {
  const [dropdownStyle, setDropdownStyle] = useState<CSSProperties>({});
  const [dropdownMaxHeight, setDropdownMaxHeight] = useState(DROPDOWN_MAX_HEIGHT);
  const [active, setActive] = useState<{ key: Key; query: string } | null>(null);
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const optionRefs = useRef(new Map<Key, HTMLButtonElement>());
  const composing = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const hasSearchTerm = value.trim().length >= minimumSearchLength;
  const canShowDropdown = open && !disabled && (hasSearchTerm || showOnFocus);
  const activeItem =
    !isLoading && !isError && active?.query === value
      ? items.find((item) => getItemKey(item) === active.key && !isItemDisabled?.(item))
      : undefined;
  const optionId = (item: TItem) => `${listId}-option-${String(getItemKey(item))}`;

  const select = (item: TItem) => {
    if (disabled || isItemDisabled?.(item)) return;
    onSelect(item);
    setActive(null);
    inputRef.current?.focus();
    onOpenChange(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (composing.current || event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229) {
      onInputKeyDown?.(event);
      return;
    }
    if (!event.altKey && !event.ctrlKey && !event.metaKey) {
      if (event.key === 'Escape' && canShowDropdown) {
        event.preventDefault();
        event.stopPropagation();
        setActive(null);
        onOpenChange(false);
        return;
      }
      if (event.key === 'Tab') {
        setActive(null);
        onOpenChange(false);
      }
      if (event.key === 'Enter' && canShowDropdown && activeItem) {
        event.preventDefault();
        select(activeItem);
        return;
      }
      const direction = event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0;
      const edge = canShowDropdown && activeItem && (event.key === 'Home' || event.key === 'End');
      if (direction || edge) {
        event.preventDefault();
        onOpenChange(true);
        const available =
          isLoading || isError ? [] : items.filter((item) => !isItemDisabled?.(item));
        if (available.length) {
          const current = activeItem ? available.indexOf(activeItem) : -1;
          const index =
            event.key === 'Home'
              ? 0
              : event.key === 'End'
                ? available.length - 1
                : current < 0
                  ? direction > 0
                    ? 0
                    : available.length - 1
                  : (current + direction + available.length) % available.length;
          const next = available[index]!;
          const key = getItemKey(next);
          setActive({ key, query: value });
          optionRefs.current.get(key)?.scrollIntoView({ block: 'nearest' });
        }
        return;
      }
    }
    onInputKeyDown?.(event);
  };

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
      const maxHeight = Math.max(0, Math.min(DROPDOWN_MAX_HEIGHT, availableSpace));

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
  }, [canShowDropdown, hasNextPage, isFetchingNextPage, isLoading, isError, onLoadMore]);

  const dropdown = canShowDropdown
    ? createPortal(
        <div
          ref={dropdownRef}
          data-testid={dropdownTestId}
          className="fixed z-[100] overflow-y-auto rounded-md border bg-popover shadow-lg"
          // 모달 다이얼로그 안에서는 body가 pointer-events:none이라 인라인으로 되살린다
          style={{ ...dropdownStyle, maxHeight: dropdownMaxHeight, pointerEvents: 'auto' }}
        >
          {isLoading ? (
            <div
              role="status"
              className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground"
            >
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              검색 중...
            </div>
          ) : isError ? (
            <div role="alert" className="space-y-3 px-3 py-5 text-center">
              <p className="text-sm text-muted-foreground">검색 결과를 불러오지 못했습니다.</p>
              {onRetry && (
                <Button type="button" variant="outline" size="sm" onClick={onRetry}>
                  다시 시도
                </Button>
              )}
            </div>
          ) : items.length === 0 && !hasNextPage && !isFetchingNextPage ? (
            <div role="status" className="py-6 text-center text-sm text-muted-foreground">
              {!hasSearchTerm && idleMessage ? idleMessage : emptyMessage}
            </div>
          ) : null}
          <div
            ref={scrollContainerRef}
            className={cn('overflow-y-auto', !isLoading && !isError && items.length > 0 && 'py-1')}
            style={{ maxHeight: dropdownMaxHeight }}
          >
            <ul
              id={listId}
              role="listbox"
              aria-label={ariaLabel ? `${ariaLabel} 결과` : '검색 결과'}
              aria-busy={isLoading || isFetchingNextPage}
              aria-multiselectable={isItemSelected ? true : undefined}
            >
              {!isLoading &&
                !isError &&
                items.map((item) => (
                  <li key={getItemKey(item)} role="presentation">
                    <button
                      type="button"
                      role="option"
                      id={optionId(item)}
                      tabIndex={-1}
                      ref={(element) => {
                        if (element) optionRefs.current.set(getItemKey(item), element);
                        else optionRefs.current.delete(getItemKey(item));
                      }}
                      aria-label={getItemAriaLabel?.(item)}
                      aria-selected={isItemSelected?.(item) ?? activeItem === item}
                      aria-disabled={isItemDisabled?.(item) || undefined}
                      disabled={isItemDisabled?.(item)}
                      onMouseDown={(event) => event.preventDefault()}
                      onMouseEnter={() => {
                        if (!isItemDisabled?.(item))
                          setActive({ key: getItemKey(item), query: value });
                      }}
                      onClick={() => select(item)}
                      className={cn(
                        'flex w-full items-center gap-3 px-3 py-2 text-left',
                        'hover:bg-accent hover:text-accent-foreground',
                        'focus:bg-accent focus:text-accent-foreground focus:outline-none',
                        'disabled:pointer-events-none disabled:opacity-50',
                        activeItem === item && 'bg-accent text-accent-foreground'
                      )}
                    >
                      {renderItem(item)}
                    </button>
                  </li>
                ))}
            </ul>

            {!isLoading && !isError && (items.length > 0 || hasNextPage) && (
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
            )}
          </div>
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
          ref={inputRef}
          role="combobox"
          aria-label={ariaLabel}
          aria-expanded={canShowDropdown}
          aria-autocomplete="list"
          aria-controls={canShowDropdown ? listId : undefined}
          aria-activedescendant={canShowDropdown && activeItem ? optionId(activeItem) : undefined}
          value={value}
          onChange={(event) => {
            onValueChange(event.target.value);
            setActive(null);
            onOpenChange(true);
          }}
          onFocus={() => onOpenChange(true)}
          onClick={() => onOpenChange(true)}
          onKeyDown={handleKeyDown}
          onCompositionStart={(event) => {
            composing.current = true;
            onInputCompositionStart?.(event);
          }}
          onCompositionEnd={(event) => {
            composing.current = false;
            onInputCompositionEnd?.(event);
          }}
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
