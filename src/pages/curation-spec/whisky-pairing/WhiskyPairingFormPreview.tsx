import { useFormContext, useWatch } from 'react-hook-form';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { CurationPreviewFrame } from '../components/preview/CurationPreviewFrame';
import type { WhiskyCurationFormValues } from '../curation-spec.schema';
import { WhiskyPairingPreview } from './WhiskyPairingPreview';

export function WhiskyPairingFormPreview({ specName }: { specName: string }) {
  const form = useFormContext<WhiskyCurationFormValues>();
  const values = useWatch({ control: form.control }) as WhiskyCurationFormValues;

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>미리보기</CardTitle>
      </CardHeader>
      <CardContent>
        <CurationPreviewFrame title={values.name}>
          <WhiskyPairingPreview specName={specName} values={values} />
        </CurationPreviewFrame>
      </CardContent>
    </Card>
  );
}
