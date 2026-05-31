import { useMemo } from 'react';

import { useCurationV2Spec, useCurationV2Specs } from '@/hooks/useCurationV2';

import {
  INITIAL_TASTING_EVENT_FORM_CONTRACT,
  createTastingEventFormContract,
} from './curation-v2-tasting-event.contract';

const TASTING_EVENT_SPEC_CODE = 'WHISKY_TASTING_EVENT';

export function useTastingEventSpecContract() {
  const specsQuery = useCurationV2Specs();
  const tastingEventSpec = useMemo(
    () => specsQuery.data?.find((spec) => spec.code === TASTING_EVENT_SPEC_CODE && spec.isActive),
    [specsQuery.data]
  );
  const specDetailQuery = useCurationV2Spec(tastingEventSpec?.id, {
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
