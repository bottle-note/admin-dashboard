import { useFormContext, useWatch } from 'react-hook-form';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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
        <CardDescription>현재 입력값을 앱 화면 기준으로 확인합니다.</CardDescription>
      </CardHeader>
      <CardContent>
        <CurationPreviewFrame title="시음회">
          <TastingEventPreview values={values} />
        </CurationPreviewFrame>
      </CardContent>
    </Card>
  );
}
