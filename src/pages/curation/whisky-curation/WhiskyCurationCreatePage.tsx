import type { CurationV2SpecCode } from '@/types/api';

import { WhiskyCurationCreateGate } from './WhiskyCurationCreateGate';
import { WhiskyCurationForm } from './WhiskyCurationForm';

interface WhiskyCurationCreatePageProps {
  specCode: CurationV2SpecCode;
  fallbackTitle: string;
}

// 추천/페어링 큐레이션 작성 페이지. 코멘트·페어링 표시 여부는 폼이 스펙에서 판별합니다.
export function WhiskyCurationCreatePage({
  specCode,
  fallbackTitle,
}: WhiskyCurationCreatePageProps) {
  return (
    <WhiskyCurationCreateGate specCode={specCode} fallbackTitle={fallbackTitle}>
      {({ specDetail, formModel, onBack }) => (
        <WhiskyCurationForm specDetail={specDetail} formModel={formModel} onBack={onBack} />
      )}
    </WhiskyCurationCreateGate>
  );
}
