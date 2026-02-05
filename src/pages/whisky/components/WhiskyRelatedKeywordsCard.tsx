/**
 * 위스키 연관 키워드 카드
 * - 검색 보정을 위한 연관 키워드 입력
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TagSelector } from '@/components/common/TagSelector';

/**
 * WhiskyRelatedKeywordsCard 컴포넌트의 props
 * @param keywords - 현재 등록된 연관 키워드 목록
 * @param onKeywordsChange - 키워드 변경 콜백
 */
export interface WhiskyRelatedKeywordsCardProps {
  keywords: string[];
  onKeywordsChange: (keywords: string[]) => void;
}

export function WhiskyRelatedKeywordsCard({
  keywords,
  onKeywordsChange,
}: WhiskyRelatedKeywordsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>연관 키워드</CardTitle>
        <CardDescription>
          검색 시 이 위스키를 찾을 수 있도록 연관 키워드를 입력합니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <TagSelector
          selectedTags={keywords}
          availableTags={[]}
          onTagsChange={onKeywordsChange}
        />
      </CardContent>
    </Card>
  );
}
