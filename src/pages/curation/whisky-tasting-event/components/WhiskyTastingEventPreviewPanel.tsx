import { useFormContext, useWatch } from 'react-hook-form';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { CurationPreviewFrame, TastingEventPreview } from '../../_preview';
import { createWhiskyTastingEventPreviewModel } from '../whisky-tasting-event.preview-model';
import type { WhiskyTastingEventFormState } from '../whisky-tasting-event.schema';

export function WhiskyTastingEventPreviewPanel() {
  const form = useFormContext<WhiskyTastingEventFormState>();
  const watchedValues = useWatch({ control: form.control });
  const previewValues = {
    ...form.getValues(),
    ...watchedValues,
  } as WhiskyTastingEventFormState;
  const preview = createWhiskyTastingEventPreviewModel(previewValues);

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>미리보기</CardTitle>
        <CardDescription>앱 노출 예시를 기준으로 작성 내용을 확인합니다.</CardDescription>
      </CardHeader>
      <CardContent>
        <CurationPreviewFrame title="시음회">
          <TastingEventPreview event={preview} />
        </CurationPreviewFrame>
      </CardContent>
    </Card>
  );
}
