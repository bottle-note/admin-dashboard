import { forwardRef, type ReactNode } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

import { CurationSectionHeader } from './CurationSectionHeader';
import type { CurationSectionHeaderProps } from './CurationSectionHeader';

interface CurationSectionCardProps extends CurationSectionHeaderProps {
  children: ReactNode;
  contentClassName?: string;
}

export const CurationSectionCard = forwardRef<HTMLDivElement, CurationSectionCardProps>(
  function CurationSectionCard(
    { stepNumber, title, description, titleSuffix, contentClassName, children },
    ref
  ) {
    return (
      <Card ref={ref} className="overflow-hidden rounded-[10px] border-border shadow-none">
        <CurationSectionHeader
          stepNumber={stepNumber}
          title={title}
          description={description}
          titleSuffix={titleSuffix}
        />
        <CardContent className={cn('pt-6', contentClassName)}>{children}</CardContent>
      </Card>
    );
  }
);
