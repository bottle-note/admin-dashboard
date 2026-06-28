import { useFormContext, useWatch } from 'react-hook-form';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { TastingEventPreview } from '../../_preview';
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
        <div className="mx-auto flex h-[720px] max-h-[calc(100vh-8rem)] max-w-sm flex-col overflow-hidden rounded-[1.75rem] border bg-background shadow-sm lg:h-[min(720px,calc(100vh-15rem))] lg:max-h-none">
          <div className="shrink-0 bg-muted/40 px-4 py-3 text-center text-xs font-medium text-muted-foreground">
            앱 노출 예시
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-white">
            <TastingEventPreview event={preview} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
