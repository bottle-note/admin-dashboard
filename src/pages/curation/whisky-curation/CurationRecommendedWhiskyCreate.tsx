import { CurationSpecCode } from '@/types/api';

import { WhiskyCurationCreateGate } from './WhiskyCurationCreateGate';
import { WhiskyCurationForm } from './WhiskyCurationForm';

export function CurationRecommendedWhiskyCreatePage() {
  return (
    <WhiskyCurationCreateGate
      specCode={CurationSpecCode.RECOMMENDED_WHISKY}
      fallbackTitle="추천 위스키 작성"
    >
      {({ specDetail, formModel, onBack }) => (
        <WhiskyCurationForm
          specDetail={specDetail}
          formModel={formModel}
          onBack={onBack}
          presentation={{
            showCommentField: true,
          }}
        />
      )}
    </WhiskyCurationCreateGate>
  );
}
