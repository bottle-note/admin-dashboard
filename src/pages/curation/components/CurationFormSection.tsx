import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { CurationFormSectionModel } from '../curation-form-model';
import { CurationFormFieldRenderer } from './CurationFormFieldRenderer';

interface CurationFormSectionProps {
  section: CurationFormSectionModel;
}

// form renderer 레이어: section model의 필드 목록을 공통 field renderer로 렌더링합니다.
export function CurationFormSection({ section }: CurationFormSectionProps) {
  const firstField = section.fields[0]?.field;

  if (section.fields.length === 1 && firstField?.kind === 'alcohol-card-list') {
    return <CurationFormFieldRenderer field={firstField} />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{section.title}</CardTitle>
      </CardHeader>
      <CardContent className={section.contentClassName}>
        {section.fields.map(({ field, className }) => (
          <CurationFormFieldRenderer key={field.key} field={field} className={className} />
        ))}
      </CardContent>
    </Card>
  );
}
