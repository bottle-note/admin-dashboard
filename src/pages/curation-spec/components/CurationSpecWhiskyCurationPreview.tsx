import { useFormContext, useWatch } from 'react-hook-form';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { WhiskyCurationFormValues } from '../curation-spec.schema';
import { CurationPreviewFrame } from './preview/CurationPreviewFrame';
import { WhiskyCurationPreview } from './preview/WhiskyCurationPreview';

export function CurationSpecWhiskyCurationPreview({ specName }: { specName: string }) {
  const form = useFormContext<WhiskyCurationFormValues>();
  const values = useWatch({ control: form.control }) as WhiskyCurationFormValues;

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>미리보기</CardTitle>
      </CardHeader>
      <CardContent>
        <CurationPreviewFrame title={values.name}>
          <WhiskyCurationPreview
            curation={{
              specName,
              name: values.name,
              description: values.description,
              imageUrls: values.imageUrls,
              items: values.alcohols.map((item) => ({
                ...item,
                pairings: item.pairings?.map((pairing) => ({
                  ...pairing,
                  itemImageUrl: pairing.itemImageUrl ?? undefined,
                })),
              })),
            }}
          />
        </CurationPreviewFrame>
      </CardContent>
    </Card>
  );
}
