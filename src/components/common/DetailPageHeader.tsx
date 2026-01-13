/**
 * 상세 페이지 헤더 컴포넌트
 * - 뒤로가기 버튼
 * - 제목 및 부제목
 * - 액션 버튼 영역
 */

import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * DetailPageHeader 컴포넌트의 props
 * @param title - 페이지 제목
 * @param subtitle - 부제목 (선택)
 * @param onBack - 뒤로가기 클릭 시 호출되는 콜백
 * @param actions - 액션 버튼들 (저장, 삭제 등)
 */
export interface DetailPageHeaderProps {
  title: string;
  subtitle?: string;
  onBack: () => void;
  actions?: React.ReactNode;
}

export function DetailPageHeader({ title, subtitle, onBack, actions }: DetailPageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}
