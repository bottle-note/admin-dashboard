import { useNavigate } from 'react-router';

import type { CurationV2Detail } from '@/types/api';

import { WhiskyTastingEventForm } from './WhiskyTastingEventForm';
import { createWhiskyTastingEventFormModel } from './whisky-tasting-event.form-model';

export function CurationWhiskyTastingEventEditPage({ curation }: { curation: CurationV2Detail }) {
  const navigate = useNavigate();
  const formModel = createWhiskyTastingEventFormModel(curation.spec);

  return (
    <WhiskyTastingEventForm
      specDetail={curation.spec}
      formModel={formModel}
      curation={curation}
      onBack={() => navigate('/dashboard/curations')}
    />
  );
}
