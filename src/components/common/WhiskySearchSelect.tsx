/**
 * 위스키 검색 및 선택 컴포넌트
 * - 검색어 입력 시 드롭다운으로 위스키 목록 표시
 * - 이미지와 이름을 함께 표시
 * - 선택 시 콜백 호출
 */

import { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useAdminAlcoholList } from '@/hooks/useAdminAlcohols';

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
  const containerRef = useRef<HTMLDivElement>(null);

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
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 위스키 검색 (최소 1글자 이상일 때만)
  const { data, isLoading } = useAdminAlcoholList(
    debouncedKeyword.length >= 1
      ? { keyword: debouncedKeyword, size: 10 }
      : undefined
  );

  // 제외 ID를 필터링한 결과
  const filteredItems = data?.items.filter(
    (item) => !excludeIds.includes(item.alcoholId)
  ) ?? [];

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
      {isOpen && debouncedKeyword.length >= 1 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              검색 결과가 없습니다
            </div>
          ) : (
            <ul className="max-h-64 overflow-auto py-1">
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
          )}
        </div>
      )}
    </div>
  );
}
