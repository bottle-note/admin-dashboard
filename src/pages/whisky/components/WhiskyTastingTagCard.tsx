/**
 * 위스키 테이스팅 태그 카드
 * - 테이스팅 노트 선택 및 추가 (무한 스크롤 + 검색)
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { TastingTagPicker } from './TastingTagPicker';

import type { AlcoholTastingTag } from '@/types/api';

export interface WhiskyTastingTagCardProps {
  tastingTags: AlcoholTastingTag[];
  onTagsChange: (tags: AlcoholTastingTag[]) => void;
  disabled?: boolean;
}

export function WhiskyTastingTagCard({
  tastingTags,
  onTagsChange,
  disabled = false,
}: WhiskyTastingTagCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>테이스팅 태그</CardTitle>
        <CardDescription>
          이 위스키의 테이스팅 노트를 선택할 수 있습니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <TastingTagPicker
          selectedTags={tastingTags}
          onTagsChange={onTagsChange}
          disabled={disabled}
        />
      </CardContent>
    </Card>
  );
}
