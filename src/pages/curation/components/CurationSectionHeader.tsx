import type { ReactNode } from 'react';

import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export interface CurationSectionHeaderProps {
  stepNumber?: number;
  title: ReactNode;
  description?: ReactNode;
  titleSuffix?: ReactNode;
}

export function CurationSectionHeader({
  stepNumber,
  title,
  description,
  titleSuffix,
}: CurationSectionHeaderProps) {
  return (
    <CardHeader className="border-b border-border bg-muted/50 px-6 py-4">
      <div className="flex items-center gap-4">
        {typeof stepNumber === 'number' && (
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-base font-semibold text-primary-foreground"
            aria-hidden="true"
          >
            {stepNumber}
          </span>
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <CardTitle className="flex min-w-0 items-center gap-2 text-lg">
            <span className="min-w-0 truncate">{title}</span>
            {titleSuffix}
          </CardTitle>
          {description && (
            <CardDescription className="min-w-0 leading-5">{description}</CardDescription>
          )}
        </div>
      </div>
    </CardHeader>
  );
}
