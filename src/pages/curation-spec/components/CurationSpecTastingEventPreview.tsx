import { useFormContext, useWatch } from 'react-hook-form';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { WhiskyTastingEventFormValues } from '../curation-spec.schema';
import { CurationPreviewFrame } from './preview/CurationPreviewFrame';
import { TastingEventPreview } from './preview/TastingEventPreview';

export function CurationSpecTastingEventPreview() {
  const form = useFormContext<WhiskyTastingEventFormValues>();
  const values = useWatch({ control: form.control }) as WhiskyTastingEventFormValues;

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>미리보기</CardTitle>
      </CardHeader>
      <CardContent>
        <CurationPreviewFrame title={values.name}>
          <TastingEventPreview values={values} />
        </CurationPreviewFrame>
      </CardContent>
    </Card>
  );
}
