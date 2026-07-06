import { useNavigate } from 'react-router';

import type { CurationV2Detail } from '@/types/api';

import { WhiskyCurationForm } from './WhiskyCurationForm';
import { createWhiskyCurationFormModel } from './whisky-curation.schema';

// 추천/페어링 큐레이션 수정 페이지. 코멘트·페어링 표시 여부는 폼이 스펙에서 판별합니다.
export function WhiskyCurationEditPage({ curation }: { curation: CurationV2Detail }) {
  const navigate = useNavigate();
  const formModel = createWhiskyCurationFormModel(curation.spec);

  return (
    <WhiskyCurationForm
      specDetail={curation.spec}
      formModel={formModel}
      curation={curation}
      onBack={() => navigate('/dashboard/curations')}
    />
  );
}
