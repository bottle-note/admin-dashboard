import { useNavigate } from 'react-router';

import type { CurationV2Detail } from '@/types/api';

import { WhiskyPairingFields } from './components/WhiskyPairingFields';
import { WhiskyCurationForm } from './WhiskyCurationForm';
import { createWhiskyCurationFormModel } from './whisky-curation.schema';

export function CurationWhiskyPairingEditPage({ curation }: { curation: CurationV2Detail }) {
  const navigate = useNavigate();
  const formModel = createWhiskyCurationFormModel(curation.spec);

  return (
    <WhiskyCurationForm
      specDetail={curation.spec}
      formModel={formModel}
      curation={curation}
      onBack={() => navigate('/dashboard/curations')}
      presentation={{
        showCommentField: false,
        renderItemExtra: ({ index, formModel, onUploadingChange }) => (
          <WhiskyPairingFields
            index={index}
            formModel={formModel}
            onUploadingChange={onUploadingChange}
          />
        ),
      }}
    />
  );
}
