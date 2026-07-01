import { useFormContext, useWatch } from 'react-hook-form';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { CurationPreviewFrame, WhiskyCardCurationPreview } from '../../_preview';
import type {
  WhiskyCardCurationFormModel,
  WhiskyCardCurationFormState,
} from '../whisky-card-curation.schema';

interface WhiskyCardPreviewPanelProps {
  formModel: WhiskyCardCurationFormModel;
}

export function WhiskyCardPreviewPanel({ formModel }: WhiskyCardPreviewPanelProps) {
  const form = useFormContext<WhiskyCardCurationFormState>();
  const watchedValues = useWatch({ control: form.control });
  const previewValues = {
    ...form.getValues(),
    ...watchedValues,
  } as WhiskyCardCurationFormState;

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>미리보기</CardTitle>
        <CardDescription>앱 노출 예시를 기준으로 작성 내용을 확인합니다.</CardDescription>
      </CardHeader>
      <CardContent>
        <CurationPreviewFrame title={formModel.spec.name}>
          <WhiskyCardCurationPreview
            curation={{
              specName: formModel.spec.name,
              name: previewValues.name.trim() || formModel.spec.name,
              description: previewValues.description,
              imageUrls: previewValues.imageUrls,
              alcohol: previewValues.alcohol,
              stats: previewValues.stats,
              comment: previewValues.comment,
              pairings: formModel.pairings ? previewValues.pairings : undefined,
            }}
            pairingTitle={formModel.pairings?.label}
          />
        </CurationPreviewFrame>
      </CardContent>
    </Card>
  );
}
