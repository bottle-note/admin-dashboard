import { CurationSpecCode } from '@/types/api';

import { WhiskyPairingFields } from './components/WhiskyPairingFields';
import { WhiskyCurationCreateGate } from './WhiskyCurationCreateGate';
import { WhiskyCurationForm } from './WhiskyCurationForm';

export function CurationWhiskyPairingCreatePage() {
  return (
    <WhiskyCurationCreateGate
      specCode={CurationSpecCode.WHISKY_PAIRING}
      fallbackTitle="위스키 페어링 작성"
    >
      {({ specDetail, formModel, onBack }) => (
        <WhiskyCurationForm
          specDetail={specDetail}
          formModel={formModel}
          onBack={onBack}
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
      )}
    </WhiskyCurationCreateGate>
  );
}
