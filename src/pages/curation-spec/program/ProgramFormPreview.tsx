import { useFormContext, useWatch } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { ProgramFormValues } from '../curation-spec.schema';
import { CurationPreviewFrame } from '../components/preview/CurationPreviewFrame';
import { ProgramPreview } from './ProgramPreview';

export function ProgramFormPreview() {
  const form = useFormContext<ProgramFormValues>();
  const values = useWatch({ control: form.control }) as ProgramFormValues;

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>미리보기</CardTitle>
      </CardHeader>
      <CardContent>
        <CurationPreviewFrame title={values.name}>
          <ProgramPreview values={values} />
        </CurationPreviewFrame>
      </CardContent>
    </Card>
  );
}
