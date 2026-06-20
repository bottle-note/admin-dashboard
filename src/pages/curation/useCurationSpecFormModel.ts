import { useCurationSpec, useCurationSpecByCode } from '@/hooks/useCurations';
import type { CurationV2Spec, CurationV2SpecCode } from '@/types/api';

interface UseCurationSpecFormModelOptions<TFormModel> {
  specCode: CurationV2SpecCode;
  createFormModel: (spec: CurationV2Spec) => TFormModel;
  showErrorToast?: boolean;
}

// 큐레이션 스펙 목록/상세 조회 후 타입별 form model 생성 함수로 연결합니다.
export function useCurationSpecFormModel<TFormModel>({
  specCode,
  createFormModel,
  showErrorToast = false,
}: UseCurationSpecFormModelOptions<TFormModel>) {
  const specsQuery = useCurationSpecByCode(specCode);
  const targetSpec = specsQuery.data?.isActive ? specsQuery.data : null;
  const specDetailQuery = useCurationSpec(targetSpec?.id, {
    showErrorToast,
  });
  const specDetail = specDetailQuery.data;
  const formModel = specDetail ? createFormModel(specDetail) : null;

  return {
    specsQuery,
    targetSpec,
    specDetailQuery,
    specDetail,
    formModel,
  };
}
