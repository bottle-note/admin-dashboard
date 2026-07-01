import { useFormContext, useWatch } from 'react-hook-form';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { CurationPreviewFrame, TastingEventPreview } from '../../_preview';
import { createTastingEventPreviewModel } from '../tasting-event.preview-model';
import type { TastingEventCreateFormState } from '../tasting-event.schema';

export function TastingEventPreviewPanel() {
  const form = useFormContext<TastingEventCreateFormState>();
  const watchedValues = useWatch({ control: form.control });
  const previewValues = {
    ...form.getValues(),
    ...watchedValues,
  } as TastingEventCreateFormState;
  const preview = createTastingEventPreviewModel(previewValues);

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
