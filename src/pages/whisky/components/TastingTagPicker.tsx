import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Search, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import {
  useTastingTagListInfinite,
  flattenTastingTagPages,
} from '@/hooks/useTastingTags';

import type { AlcoholTastingTag } from '@/types/api';

export interface TastingTagPickerProps {
  selectedTags: AlcoholTastingTag[];
  onTagsChange: (tags: AlcoholTastingTag[]) => void;
  disabled?: boolean;
}

/**
 * 위스키 등록/상세 페이지 전용 테이스팅 태그 선택 UI.
 *
 * 한 번에 전체 태그(=500개)를 가져오던 기존 방식이 응답 13MB로 페이지를
 * 멈추게 했기에, 페이지 단위(size=20)로 점진 로딩한다. 검색은 서버 사이드.
 */
export function TastingTagPicker({
  selectedTags,
  onTagsChange,
  disabled = false,
}: TastingTagPickerProps) {
  const [keyword, setKeyword] = useState('');
  const debouncedKeyword = useDebouncedValue(keyword.trim(), 300);

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useTastingTagListInfinite(
    debouncedKeyword ? { keyword: debouncedKeyword } : undefined
  );

  const fetchedItems = useMemo(() => flattenTastingTagPages(data), [data]);

  const selectedIds = useMemo(
    () => new Set(selectedTags.map((t) => t.id)),
    [selectedTags]
  );
  const candidateTags = useMemo(
    () => fetchedItems.filter((t) => !selectedIds.has(t.id)),
    [fetchedItems, selectedIds]
  );

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { rootMargin: '120px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleAdd = (tag: { id: number; korName: string; engName: string }) => {
    onTagsChange([
      ...selectedTags,
      { id: tag.id, korName: tag.korName, engName: tag.engName },
    ]);
  };

  const handleRemove = (id: number) => {
    onTagsChange(selectedTags.filter((t) => t.id !== id));
  };

  return (
    <div className={`space-y-4 ${disabled ? 'pointer-events-none opacity-60' : ''}`}>
      <div>
        <p className="mb-2 text-sm font-medium">선택된 태그</p>
        {selectedTags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {selectedTags.map((tag) => (
              <Badge key={tag.id} variant="default" className="gap-1 pr-1">
                {tag.korName}
                <button
                  type="button"
                  onClick={() => handleRemove(tag.id)}
                  className="ml-1 rounded-full p-0.5 hover:bg-primary-foreground/20"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">선택된 태그가 없습니다.</p>
        )}
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">기존 태그에서 선택</p>
        <div className="relative mb-2">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="태그 검색..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="h-8 pl-8"
          />
        </div>

        <div className="max-h-60 overflow-y-auto rounded border p-2">
          {isLoading && fetchedItems.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">불러오는 중...</p>
          ) : candidateTags.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              {debouncedKeyword ? '검색 결과가 없습니다.' : '추가할 태그가 없습니다.'}
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {candidateTags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant="outline"
                  className="cursor-pointer hover:bg-accent"
                  onClick={() => handleAdd(tag)}
                >
                  <Plus className="mr-1 h-3 w-3" />
                  {tag.korName}
                </Badge>
              ))}
            </div>
          )}

          <div ref={sentinelRef} className="h-1" />

          {isFetchingNextPage && (
            <p className="py-2 text-center text-xs text-muted-foreground">더 불러오는 중...</p>
          )}
        </div>
      </div>
    </div>
  );
}
