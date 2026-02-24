/**
 * 위스키 테이스팅 태그 카드
 * - 테이스팅 노트 선택 및 추가
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TagSelector } from '@/components/common/TagSelector';

import type { AlcoholTastingTag } from '@/types/api';

/** 태그 목록 아이템 (ID 매핑용) */
interface TagListItem {
  id: number;
  korName: string;
  engName: string;
}

/**
 * WhiskyTastingTagCard 컴포넌트의 props
 * @param tastingTags - 현재 선택된 테이스팅 태그 목록
 * @param availableTags - 선택 가능한 태그 이름 목록
 * @param tagListItems - 전체 태그 목록 (ID 매핑용)
 * @param onTagsChange - 태그 변경 콜백
 */
export interface WhiskyTastingTagCardProps {
  tastingTags: AlcoholTastingTag[];
  availableTags?: string[];
  tagListItems?: TagListItem[];
  onTagsChange: (tags: AlcoholTastingTag[]) => void;
  disabled?: boolean;
}

/** 이름으로 태그 객체를 찾아 반환. 선택 목록 → 전체 목록 → 폴백 순서 */
function resolveTag(name: string, selected: AlcoholTastingTag[], all: TagListItem[]): AlcoholTastingTag {
  const fromSelected = selected.find((t) => t.korName === name);
  if (fromSelected) return fromSelected;
  const fromAll = all.find((t) => t.korName === name);
  if (fromAll) return { id: fromAll.id, korName: fromAll.korName, engName: fromAll.engName };
  return { id: 0, korName: name, engName: name };
}

export function WhiskyTastingTagCard({
  tastingTags,
  availableTags = [],
  tagListItems = [],
  onTagsChange,
  disabled = false,
}: WhiskyTastingTagCardProps) {
  const handleTagsChange = (tags: string[]) => {
    onTagsChange(tags.map((name) => resolveTag(name, tastingTags, tagListItems)));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>테이스팅 태그</CardTitle>
        <CardDescription>
          이 위스키의 테이스팅 노트를 선택하거나 직접 추가할 수 있습니다.
        </CardDescription>
      </CardHeader>
      <CardContent className={disabled ? 'pointer-events-none opacity-60' : ''}>
        <TagSelector
          selectedTags={tastingTags.map((tag) => tag.korName)}
          availableTags={availableTags}
          onTagsChange={handleTagsChange}
        />
      </CardContent>
    </Card>
  );
}
