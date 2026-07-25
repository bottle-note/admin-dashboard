import { AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { CurationV2Detail } from '@/types/api';

import { SchemaDrivenCurationForm } from './SchemaDrivenCurationForm';
import { createSchemaDrivenCurationFormModel } from './schema-driven-curation.form-model';

export function SchemaDrivenCurationEditPage({ curation }: { curation: CurationV2Detail }) {
  const navigate = useNavigate();
  const handleBack = () => navigate('/dashboard/curations');
  let formModel = null;
  let schemaError: Error | null = null;

  try {
    formModel = createSchemaDrivenCurationFormModel(curation.spec);
  } catch (error) {
    schemaError = error instanceof Error ? error : new Error('스펙을 해석하지 못했습니다.');
  }

  if (formModel) {
    return (
      <SchemaDrivenCurationForm formModel={formModel} curation={curation} onBack={handleBack} />
    );
  }

  return (
    <Card className="shadow-none">
      <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 text-destructive" aria-hidden="true" />
          <div>
            <h2 className="font-semibold">이 스펙은 아직 자동 폼에서 지원하지 않습니다.</h2>
            <p className="mt-1 text-sm text-muted-foreground">{schemaError?.message}</p>
          </div>
        </div>
        <Button type="button" variant="outline" onClick={handleBack}>
          목록
        </Button>
      </CardContent>
    </Card>
  );
}
