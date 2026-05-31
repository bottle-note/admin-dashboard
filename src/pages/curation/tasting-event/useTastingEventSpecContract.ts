import { useMemo } from 'react';

import { useCurationSpec, useCurationSpecs } from '@/hooks/useCurations';

import {
  INITIAL_TASTING_EVENT_FORM_CONTRACT,
  createTastingEventFormContract,
} from './tasting-event.contract';

const TASTING_EVENT_SPEC_CODE = 'WHISKY_TASTING_EVENT';

export function useTastingEventSpecContract() {
  const specsQuery = useCurationSpecs();
  const tastingEventSpec = useMemo(
    () => specsQuery.data?.find((spec) => spec.code === TASTING_EVENT_SPEC_CODE && spec.isActive),
    [specsQuery.data]
  );
  const specDetailQuery = useCurationSpec(tastingEventSpec?.id, {
    showErrorToast: false,
  });
  const specDetail = specDetailQuery.data;
  const formContract = useMemo(
    () =>
      specDetail
        ? createTastingEventFormContract(specDetail)
        : INITIAL_TASTING_EVENT_FORM_CONTRACT,
    [specDetail]
  );

  return {
    specsQuery,
    tastingEventSpec,
    specDetailQuery,
    specDetail,
    formContract,
    canShowForm: Boolean(specDetail),
  };
}
