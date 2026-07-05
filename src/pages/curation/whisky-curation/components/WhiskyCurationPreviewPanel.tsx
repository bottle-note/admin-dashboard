import { useFormContext, useWatch } from 'react-hook-form';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { CurationPreviewFrame, WhiskyCurationPreview } from '../../_preview';
import type {
  WhiskyCurationFormModel,
  WhiskyCurationFormState,
} from '../whisky-curation.schema';

interface WhiskyCurationPreviewPanelProps {
  formModel: WhiskyCurationFormModel;
}

export function WhiskyCurationPreviewPanel({ formModel }: WhiskyCurationPreviewPanelProps) {
  const form = useFormContext<WhiskyCurationFormState>();
  const watchedValues = useWatch({ control: form.control });
  const previewValues = {
    ...form.getValues(),
    ...watchedValues,
  } as WhiskyCurationFormState;

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>미리보기</CardTitle>
        <CardDescription>앱 노출 예시를 기준으로 작성 내용을 확인합니다.</CardDescription>
      </CardHeader>
      <CardContent>
        <CurationPreviewFrame title={formModel.spec.name}>
          <WhiskyCurationPreview
            curation={{
              specName: formModel.spec.name,
              name: previewValues.name.trim() || formModel.spec.name,
              description: previewValues.description,
              imageUrls: previewValues.imageUrls,
              alcohol: previewValues.alcohols[0]?.alcohol,
              items: previewValues.alcohols,
            }}
            pairingTitle={formModel.pairings?.label}
          />
        </CurationPreviewFrame>
      </CardContent>
    </Card>
  );
}
