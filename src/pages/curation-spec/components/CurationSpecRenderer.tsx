import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { JsonSchemaNode } from '@/types/api';

import { CurationSpecField } from './CurationSpecField';

export function CurationSpecRenderer({
  sections,
}: {
  sections: Record<
    string,
    {
      subtitle: string;
      contentClassName: string;
      fields: Record<
        string,
        {
          schema: JsonSchemaNode;
          required: boolean;
          className?: string;
          disabledBy?: string;
        }
      >;
    }
  >;
}) {
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
            {Object.entries(section.fields).map(([key, field]) => (
              <CurationSpecField
                key={key}
                name={key}
                schema={field.schema}
                required={field.required}
                className={field.className}
                disabledBy={field.disabledBy}
              />
            ))}
          </CardContent>
        </Card>
      ))}
    </>
  );
}
