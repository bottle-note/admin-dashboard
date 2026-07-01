/**
 * 위스키 검색 및 선택 컴포넌트
 * - 검색어 입력 시 드롭다운으로 위스키 목록 표시
 * - 이미지와 이름을 함께 표시
 * - 선택 시 콜백 호출
 */

import { useState, useEffect, useLayoutEffect, useMemo, useRef, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { flattenAdminAlcoholPages, useAdminAlcoholListInfinite } from '@/hooks/useAdminAlcohols';

const DROPDOWN_GAP = 4;
const VIEWPORT_PADDING = 8;
const DROPDOWN_MAX_HEIGHT = 22 * 16;
const DROPDOWN_MIN_HEIGHT = 96;

/**
 * 선택된 위스키 정보
 */
export interface SelectedWhisky {
  alcoholId: number;
  korName: string;
  engName: string;
  imageUrl: string | null;
}

/**
 * WhiskySearchSelect의 props
 * @param onSelect - 위스키 선택 시 콜백
 * @param excludeIds - 제외할 위스키 ID 목록 (이미 선택된 항목)
 * @param placeholder - 검색창 placeholder
 * @param disabled - 비활성화 여부
 */
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
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<CSSProperties>({});
  const [dropdownMaxHeight, setDropdownMaxHeight] = useState(DROPDOWN_MAX_HEIGHT);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // 디바운스 처리
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(keyword);
    }, 300);
    return () => clearTimeout(timer);
  }, [keyword]);

  // 외부 클릭 감지
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

  const canSearch = debouncedKeyword.trim().length >= 1;

  useLayoutEffect(() => {
    if (!isOpen || !canSearch) return;

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
  }, [canSearch, isOpen]);

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useAdminAlcoholListInfinite(
      canSearch ? { keyword: debouncedKeyword.trim(), size: 10 } : undefined,
      { enabled: canSearch }
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

  const fetchedItems = useMemo(() => flattenAdminAlcoholPages(data), [data]);

  // 제외 ID를 필터링한 결과
  const filteredItems = useMemo(
    () => fetchedItems.filter((item) => !excludeIds.includes(item.alcoholId)),
    [excludeIds, fetchedItems]
  );

  const handleSelect = (item: (typeof filteredItems)[0]) => {
    onSelect({
      alcoholId: item.alcoholId,
      korName: item.korName,
      engName: item.engName,
      imageUrl: item.imageUrl,
    });
    setKeyword('');
    setIsOpen(false);
  };

  const handleClear = () => {
    setKeyword('');
    setDebouncedKeyword('');
  };

  const dropdown =
    isOpen && canSearch
      ? createPortal(
          <div
            ref={dropdownRef}
            data-testid="whisky-search-dropdown"
            className="fixed z-[100] rounded-md border bg-popover shadow-lg"
            style={dropdownStyle}
          >
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : filteredItems.length === 0 && !hasNextPage && !isFetchingNextPage ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                검색 결과가 없습니다
              </div>
            ) : (
              <div
                ref={scrollContainerRef}
                className="overflow-y-auto py-1"
                style={{ maxHeight: dropdownMaxHeight }}
              >
                <ul>
                  {filteredItems.map((item) => (
                    <li key={item.alcoholId}>
                      <button
                        type="button"
                        onClick={() => handleSelect(item)}
                        className={cn(
                          'flex w-full items-center gap-3 px-3 py-2 text-left',
                          'hover:bg-accent hover:text-accent-foreground',
                          'focus:bg-accent focus:text-accent-foreground focus:outline-none'
                        )}
                      >
                        {/* 이미지 */}
                        <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.korName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                              No
                            </div>
                          )}
                        </div>
                        {/* 이름 */}
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-medium">{item.korName}</div>
                          <div className="truncate text-sm text-muted-foreground">
                            {item.engName}
                          </div>
                        </div>
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
    <div ref={containerRef} className="relative">
      {/* 검색 입력 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={keyword}
          onChange={(e) => {
            setKeyword(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className="pl-9 pr-9"
        />
        {keyword && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* 드롭다운 목록 */}
      {dropdown}
    </div>
  );
}
