import type { CurationFormSectionModel } from '../curation-form-model';
import { CurationFormFieldRenderer } from './CurationFormFieldRenderer';
import { CurationSectionCard } from './CurationSectionCard';

interface CurationFormSectionProps {
  section: CurationFormSectionModel;
}

// form renderer 레이어: section model의 필드 목록을 공통 field renderer로 렌더링합니다.
export function CurationFormSection({ section }: CurationFormSectionProps) {
  const firstField = section.fields[0]?.field;

  if (section.fields.length === 1 && firstField?.kind === 'alcohol-card-list') {
    return (
      <CurationFormFieldRenderer
        field={firstField}
        sectionHeader={{
          stepNumber: section.stepNumber,
          description: section.description,
        }}
      />
    );
  }

  return (
    <CurationSectionCard
      stepNumber={section.stepNumber}
      title={section.title}
      description={section.description}
      contentClassName={section.contentClassName}
    >
      {section.fields.map(({ field, className }) => (
        <CurationFormFieldRenderer key={field.key} field={field} className={className} />
      ))}
    </CurationSectionCard>
  );
}
