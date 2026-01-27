/**
 * 태그 선택 컴포넌트
 * - 기존 태그에서 선택 (chip 형태)
 * - 새 태그 직접 입력
 * - 검색 필터링
 */

import { useState } from 'react';
import { Plus, Search, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/**
 * TagSelector 컴포넌트의 props
 * @param selectedTags - 현재 선택된 태그 목록
 * @param availableTags - 선택 가능한 전체 태그 목록
 * @param onTagsChange - 태그 변경 시 호출되는 콜백
 */
export interface TagSelectorProps {
  selectedTags: string[];
  availableTags: string[];
  onTagsChange: (tags: string[]) => void;
}

export function TagSelector({ selectedTags, availableTags, onTagsChange }: TagSelectorProps) {
  const [customTag, setCustomTag] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isComposing, setIsComposing] = useState(false);

  // 선택되지 않은 태그만 필터링
  const unselectedTags = availableTags.filter((tag) => !selectedTags.includes(tag));

  // 검색어로 필터링
  const filteredUnselectedTags = searchKeyword
    ? unselectedTags.filter((tag) => tag.toLowerCase().includes(searchKeyword.toLowerCase()))
    : unselectedTags;

  const handleAddTag = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      onTagsChange([...selectedTags, tag]);
    }
  };

  const handleRemoveTag = (tag: string) => {
    onTagsChange(selectedTags.filter((t) => t !== tag));
  };

  const handleAddCustomTag = () => {
    const trimmed = customTag.trim();
    if (trimmed && !selectedTags.includes(trimmed)) {
      onTagsChange([...selectedTags, trimmed]);
      setCustomTag('');
    }
  };

  const handleCustomTagKeyDown = (e: React.KeyboardEvent) => {
    // 한글 IME 조합 중에는 Enter 무시 (글자 중복 방지)
    if (e.key === 'Enter' && !isComposing) {
      e.preventDefault();
      handleAddCustomTag();
    }
  };

  return (
    <div className="space-y-4">
      {/* 선택된 태그 */}
      <div>
        <p className="mb-2 text-sm font-medium">선택된 태그</p>
        {selectedTags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {selectedTags.map((tag) => (
              <Badge key={tag} variant="default" className="gap-1 pr-1">
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
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

      {/* 직접 입력 */}
      <div>
        <p className="mb-2 text-sm font-medium">새 태그 추가</p>
        <div className="flex gap-2">
          <Input
            placeholder="태그 입력 후 Enter..."
            value={customTag}
            onChange={(e) => setCustomTag(e.target.value)}
            onKeyDown={handleCustomTagKeyDown}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            className="h-8 flex-1"
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleAddCustomTag}
            disabled={!customTag.trim()}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 기존 태그 목록 (Chip 형태) */}
      <div>
        <p className="mb-2 text-sm font-medium">기존 태그에서 선택</p>
        <div className="relative mb-2">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="태그 검색..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="h-8 pl-8"
          />
        </div>
        {filteredUnselectedTags.length > 0 ? (
          <div className="flex max-h-32 flex-wrap gap-1.5 overflow-y-auto">
            {filteredUnselectedTags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="cursor-pointer hover:bg-accent"
                onClick={() => handleAddTag(tag)}
              >
                <Plus className="mr-1 h-3 w-3" />
                {tag}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {searchKeyword ? '검색 결과가 없습니다.' : '추가할 태그가 없습니다.'}
          </p>
        )}
      </div>
    </div>
  );
}
