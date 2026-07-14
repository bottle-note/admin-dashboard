import type { ReactNode } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

import { CurationSectionHeader } from './CurationSectionHeader';
import type { CurationSectionHeaderProps } from './CurationSectionHeader';

interface CurationSectionCardProps extends CurationSectionHeaderProps {
  children: ReactNode;
  contentClassName?: string;
  formFieldName?: string;
}

export function CurationSectionCard({
  stepNumber,
  title,
  description,
  titleSuffix,
  contentClassName,
  formFieldName,
  children,
}: CurationSectionCardProps) {
  return (
    <Card
      className="overflow-hidden rounded-[10px] border-border shadow-none"
      data-form-field-name={formFieldName}
    >
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
