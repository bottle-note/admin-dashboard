import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import type { CurationSpecSections, ProgramSectionConfig } from '../curation-sections';
import type {
  ProgramListRequestSpec,
  WhiskyCurationRequestSpec,
} from '../curation-spec.schema';
import { CurationSpecAlcoholCardListField } from './CurationSpecAlcoholCardListField';
import { CurationSpecField } from './CurationSpecField';
import { CurationSpecProgramListField } from './CurationSpecProgramListField';

export function CurationSpecRenderer({ sections }: { sections: CurationSpecSections }) {
  return (
    <>
      {Object.entries(sections).map(([title, section], index) => (
        <Card key={title} className="overflow-hidden rounded-[10px] border-border shadow-none">
          {/* 섹션 헤더*/}
          <CardHeader className="border-b border-border bg-muted/50 px-6 py-4">
            <div className="flex items-center gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-base font-semibold text-primary-foreground">
                {index + 2}
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <CardTitle className="text-lg">{title}</CardTitle>
                <CardDescription className="leading-5">{section.subtitle}</CardDescription>
              </div>
            </div>
          </CardHeader>
          {/* 섹션 컨텐츠 */}
          <CardContent className={`pt-6 ${section.contentClassName}`}>
            {Object.entries(section.fields).map(([key, field]) =>
              key === 'programs' ? (
                <CurationSpecProgramListField
                  key={key}
                  name={key}
                  schema={field.schema as ProgramListRequestSpec}
                  required={field.required}
                  config={field.program as ProgramSectionConfig}
                />
              ) : field.schema['x-container'] === 'array' ? (
                <CurationSpecAlcoholCardListField
                  key={key}
                  name={key}
                  schema={field.schema as WhiskyCurationRequestSpec}
                  required={field.required}
                  config={field.alcohol}
                />
              ) : (
                <CurationSpecField
                  key={key}
                  name={key}
                  schema={field.schema}
                  required={field.required}
                  label={field.label}
                  className={field.className}
                  disabledWhen={field.disabledWhen}
                  requiredWhen={field.requiredWhen}
                  optionLabels={field.optionLabels}
                  alcoholConfig={field.alcohol}
                />
              )
            )}
          </CardContent>
        </Card>
      ))}
    </>
  );
}
