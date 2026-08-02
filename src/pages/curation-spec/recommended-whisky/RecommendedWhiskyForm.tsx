import type { CurationV2Spec } from '@/types/api';

import { CurationSpecWhiskyCurationForm } from '../components/CurationSpecWhiskyCurationForm';
import type {
  WhiskyCurationFormValues,
  WhiskyCurationRequestSpec,
} from '../curation-spec.schema';
import { RecommendedWhiskyFormPreview } from './RecommendedWhiskyFormPreview';
import { getRecommendedWhiskySections } from './recommended-whisky-sections';

export function RecommendedWhiskyForm({
  spec,
  curationId,
  requestSpec,
  initialValues,
  onBack,
}: {
  spec: CurationV2Spec;
  curationId?: number;
  requestSpec: WhiskyCurationRequestSpec;
  initialValues: WhiskyCurationFormValues;
  onBack: () => void;
}) {
  return (
    <CurationSpecWhiskyCurationForm
      spec={spec}
      curationId={curationId}
      requestSpec={requestSpec}
      sections={getRecommendedWhiskySections(requestSpec)}
      initialValues={initialValues}
      preview={<RecommendedWhiskyFormPreview specName={spec.name} />}
      onBack={onBack}
    />
  );
}
