/**
 * 대시보드 페이지
 */

import { Link } from 'react-router';
import { Wine, MessageSquare, Tag, Image, BookOpen } from 'lucide-react';
import { TimeSeriesChart } from '@/components/common/TimeSeriesChart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminAlcoholList } from '@/hooks/useAdminAlcohols';
import { useHelpList } from '@/hooks/useHelps';
import { useTastingTagList } from '@/hooks/useTastingTags';
import { useBannerList } from '@/hooks/useBanners';
import { useCurationList } from '@/hooks/useCurations';
import {
  useActiveVisitorStatistics,
  useVisitorRetentionStatistics,
} from '@/hooks/useStatistics';
import { createVisitorComposition } from '@/pages/statistics/visitor-composition';
import type { TimeSeriesPayload, VisitorStatisticsParams } from '@/types/api';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  isLoading?: boolean;
  href: string;
}

function StatCard({ title, value, icon, isLoading, href }: StatCardProps) {
  return (
    <Link to={href}>
      <div className="rounded-lg border bg-card p-6 transition-shadow hover:shadow-md">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          <div className="text-muted-foreground">{icon}</div>
        </div>
        <p className="mt-2 text-2xl font-bold">
          {isLoading ? (
            <span className="text-muted-foreground">...</span>
          ) : typeof value === 'number' ? (
            value.toLocaleString()
          ) : (
            value
          )}
        </p>
      </div>
    </Link>
  );
}

interface StatisticsCardProps {
  title: string;
  payload?: TimeSeriesPayload;
  seriesKeys: string[];
  stacked?: boolean;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

function StatisticsCard({
  title,
  payload,
  seriesKeys,
  stacked,
  isLoading,
  isError,
  onRetry,
}: StatisticsCardProps) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>최근 7일</CardDescription>
      </CardHeader>
      <CardContent className="min-w-0">
        <TimeSeriesChart
          payload={payload}
          seriesKeys={seriesKeys}
          stacked={stacked}
          isLoading={isLoading}
          isError={isError}
          onRetry={onRetry}
        />
      </CardContent>
    </Card>
  );
}

function getDashboardStatisticsParams(): VisitorStatisticsParams {
  const today = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const to = today.toISOString().slice(0, 10);
  today.setUTCDate(today.getUTCDate() - 6);

  return {
    from: today.toISOString().slice(0, 10),
    to,
    granularity: 'DAY',
  };
}

const DASHBOARD_STATISTICS_PARAMS = getDashboardStatisticsParams();

export function DashboardPage() {
  // 통계 데이터 조회 (최소 데이터만 요청)
  const { data: alcoholData, isLoading: isAlcoholLoading } = useAdminAlcoholList({
    size: 1,
  });
  const { data: tagData, isLoading: isTagLoading } = useTastingTagList({
    size: 1,
  });
  const { data: bannerData, isLoading: isBannerLoading } = useBannerList({
    size: 1,
  });
  const { data: curationData, isLoading: isCurationLoading } = useCurationList({
    size: 1,
  });
  const { data: helpData, isLoading: isHelpLoading } = useHelpList({
    size: 1,
    status: 'WAITING',
  });
  const activeVisitorsQuery = useActiveVisitorStatistics(DASHBOARD_STATISTICS_PARAMS);
  const retentionQuery = useVisitorRetentionStatistics(DASHBOARD_STATISTICS_PARAMS);
  const visitorComposition = createVisitorComposition(activeVisitorsQuery.data);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">대시보드</h1>
        <p className="text-muted-foreground">
          안녕하세요! BottleNote Admin에 오신 것을 환영합니다.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="총 위스키"
          value={alcoholData?.meta.totalElements ?? 0}
          icon={<Wine className="h-5 w-5" />}
          isLoading={isAlcoholLoading}
          href="/whisky"
        />
        <StatCard
          title="테이스팅 태그"
          value={tagData?.meta.totalElements ?? 0}
          icon={<Tag className="h-5 w-5" />}
          isLoading={isTagLoading}
          href="/tasting-tags"
        />
        <StatCard
          title="배너"
          value={bannerData?.meta.totalElements ?? 0}
          icon={<Image className="h-5 w-5" />}
          isLoading={isBannerLoading}
          href="/banners"
        />
        <StatCard
          title="큐레이션"
          value={curationData?.meta.totalElements ?? 0}
          icon={<BookOpen className="h-5 w-5" />}
          isLoading={isCurationLoading}
          href="/dashboard/curations"
        />
        <StatCard
          title="처리 대기 문의"
          value={helpData?.meta.totalElements ?? 0}
          icon={<MessageSquare className="h-5 w-5" />}
          isLoading={isHelpLoading}
          href="/inquiries"
        />
      </div>

      <section className="space-y-4" aria-labelledby="dashboard-statistics-title">
        <div>
          <h2 id="dashboard-statistics-title" className="text-lg font-semibold">
            방문자 통계
          </h2>
          <p className="text-sm text-muted-foreground">한국 시간 기준 최근 7일 추이입니다.</p>
        </div>
        <div className="space-y-4">
          <StatisticsCard
            title="방문자 DAU"
            payload={visitorComposition}
            seriesKeys={['members', 'guestVisitors']}
            stacked
            isLoading={activeVisitorsQuery.isLoading}
            isError={activeVisitorsQuery.isError}
            onRetry={() => void activeVisitorsQuery.refetch()}
          />
          <StatisticsCard
            title="재방문율"
            payload={retentionQuery.data}
            seriesKeys={['retentionRate']}
            isLoading={retentionQuery.isLoading}
            isError={retentionQuery.isError}
            onRetry={() => void retentionQuery.refetch()}
          />
        </div>
      </section>
    </div>
  );
}
