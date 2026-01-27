/**
 * 대시보드 페이지
 */

import { Wine, MessageSquare, Tag, Image } from 'lucide-react';
import { useAdminAlcoholList } from '@/hooks/useAdminAlcohols';
import { useHelpList } from '@/hooks/useHelps';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  isLoading?: boolean;
}

function StatCard({ title, value, icon, isLoading }: StatCardProps) {
  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <div className="text-muted-foreground">{icon}</div>
      </div>
      <p className="mt-2 text-2xl font-bold">
        {isLoading ? (
          <span className="text-muted-foreground">...</span>
        ) : (
          typeof value === 'number' ? value.toLocaleString() : value
        )}
      </p>
    </div>
  );
}

export function DashboardPage() {
  // 통계 데이터 조회 (최소 데이터만 요청)
  const { data: alcoholData, isLoading: isAlcoholLoading } = useAdminAlcoholList({
    size: 1,
  });
  const { data: helpData, isLoading: isHelpLoading } = useHelpList({
    pageSize: 1,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">대시보드</h1>
        <p className="text-muted-foreground">
          안녕하세요! BottleNote Admin에 오신 것을 환영합니다.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="총 위스키"
          value={alcoholData?.meta.totalElements ?? 0}
          icon={<Wine className="h-5 w-5" />}
          isLoading={isAlcoholLoading}
        />
        <StatCard
          title="테이스팅 태그"
          value="-"
          icon={<Tag className="h-5 w-5" />}
        />
        <StatCard
          title="배너"
          value="-"
          icon={<Image className="h-5 w-5" />}
        />
        <StatCard
          title="문의"
          value={helpData?.totalCount ?? 0}
          icon={<MessageSquare className="h-5 w-5" />}
          isLoading={isHelpLoading}
        />
      </div>
    </div>
  );
}
