/**
 * 위스키 통계 카드
 * - 평균 평점, 평점 수, 리뷰 수, 찜 수 표시
 * - 수정 모드에서만 표시
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * WhiskyStatsCard 컴포넌트의 props
 * @param avgRating - 평균 평점
 * @param totalRatingsCount - 평점 수
 * @param reviewCount - 리뷰 수
 * @param pickCount - 찜 수
 */
export interface WhiskyStatsCardProps {
  avgRating: number;
  totalRatingsCount: number;
  reviewCount: number;
  pickCount: number;
}

export function WhiskyStatsCard({
  avgRating,
  totalRatingsCount,
  reviewCount,
  pickCount,
}: WhiskyStatsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>통계</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">평균 평점</span>
          <span className="font-medium">{avgRating.toFixed(1)} / 5.0</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">평점 수</span>
          <span className="font-medium">{totalRatingsCount.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">리뷰 수</span>
          <span className="font-medium">{reviewCount.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">찜 수</span>
          <span className="font-medium">{pickCount.toLocaleString()}</span>
        </div>
      </CardContent>
    </Card>
  );
}
