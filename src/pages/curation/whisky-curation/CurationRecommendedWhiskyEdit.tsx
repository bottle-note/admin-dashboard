import { useNavigate } from 'react-router';

import type { CurationV2Detail } from '@/types/api';

import { WhiskyCurationForm } from './WhiskyCurationForm';
import { createWhiskyCurationFormModel } from './whisky-curation.schema';

export function CurationRecommendedWhiskyEditPage({ curation }: { curation: CurationV2Detail }) {
  const navigate = useNavigate();
  const formModel = createWhiskyCurationFormModel(curation.spec);

  return (
    <WhiskyCurationForm
      specDetail={curation.spec}
      formModel={formModel}
      curation={curation}
      onBack={() => navigate('/dashboard/curations')}
      presentation={{
        showCommentField: true,
      }}
    />
  );
}
