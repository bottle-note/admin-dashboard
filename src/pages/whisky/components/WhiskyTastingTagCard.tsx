/**
 * 위스키 테이스팅 태그 카드
 * - 테이스팅 노트 선택 및 추가
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TagSelector } from '@/components/common/TagSelector';

import type { AlcoholTastingTag } from '@/types/api';

/**
 * WhiskyTastingTagCard 컴포넌트의 props
 * @param tastingTags - 현재 선택된 테이스팅 태그 목록
 * @param availableTags - 선택 가능한 태그 목록
 * @param onTagsChange - 태그 변경 콜백
 */
export interface WhiskyTastingTagCardProps {
  tastingTags: AlcoholTastingTag[];
  availableTags?: string[];
  onTagsChange: (tags: AlcoholTastingTag[]) => void;
}

export function WhiskyTastingTagCard({
  tastingTags,
  availableTags = [],
  onTagsChange,
}: WhiskyTastingTagCardProps) {
  const handleTagsChange = (tags: string[]) => {
    const newTags = tags.map((name) => {
      const existing = tastingTags.find((t) => t.korName === name);
      return existing ?? { id: 0, korName: name, engName: name };
    });
    onTagsChange(newTags);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>테이스팅 태그</CardTitle>
        <CardDescription>
          이 위스키의 테이스팅 노트를 선택하거나 직접 추가할 수 있습니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <TagSelector
          selectedTags={tastingTags.map((tag) => tag.korName)}
          availableTags={availableTags}
          onTagsChange={handleTagsChange}
        />
      </CardContent>
    </Card>
  );
}
