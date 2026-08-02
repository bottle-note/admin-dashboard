import type { CurationV2Spec } from '@/types/api';

import { CurationSpecWhiskyCurationForm } from '../components/CurationSpecWhiskyCurationForm';
import type {
  WhiskyCurationFormValues,
  WhiskyCurationRequestSpec,
} from '../curation-spec.schema';
import { WhiskyPairingFormPreview } from './WhiskyPairingFormPreview';
import { getWhiskyPairingSections } from './whisky-pairing-sections';

export function WhiskyPairingForm({
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
      sections={getWhiskyPairingSections(requestSpec)}
      initialValues={initialValues}
      preview={<WhiskyPairingFormPreview specName={spec.name} />}
      onBack={onBack}
    />
  );
}
