import type { ReactNode } from 'react';

export interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  /** 화면을 세로로 꽉 채우는 페이지용. 제목과 설명을 작게 쓴다 */
  compact?: boolean;
}

export function PageHeader({ title, description, actions, compact = false }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className={compact ? 'text-xl font-bold' : 'text-2xl font-bold'}>{title}</h1>
        {description && (
          <p className={compact ? 'text-xs text-muted-foreground' : 'text-muted-foreground'}>
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">{actions}</div>}
    </div>
  );
}
