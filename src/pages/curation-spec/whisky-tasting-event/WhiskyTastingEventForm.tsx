import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm, type Resolver } from 'react-hook-form';
import { useNavigate } from 'react-router';

import { DetailPageHeader } from '@/components/common/DetailPageHeader';
import { useCurationCreate, useCurationUpdate } from '@/hooks/useCurations';
import type { CurationV2CreateRequest, CurationV2Spec } from '@/types/api';

import {
  createWhiskyTastingEventFormValidationSchema,
  type WhiskyTastingEventFormValues,
  type WhiskyTastingEventRequestSpec,
} from '../curation-spec.schema';
import { CurationSpecCommonSection } from '../components/CurationSpecCommonSection';
import { CurationSpecRenderer } from '../components/CurationSpecRenderer';
import { WhiskyTastingEventFormPreview } from './WhiskyTastingEventFormPreview';
import { getWhiskyTastingEventSections } from './whisky-tasting-event-sections';

export function WhiskyTastingEventForm({
  spec,
  curationId,
  requestSpec,
  initialValues,
  onBack,
}: {
  spec: CurationV2Spec;
  curationId?: number;
  requestSpec: WhiskyTastingEventRequestSpec;
  initialValues: WhiskyTastingEventFormValues;
  onBack: () => void;
}) {
  const navigate = useNavigate();
  const [isImageUploading, setIsImageUploading] = useState(false);
  const form = useForm<WhiskyTastingEventFormValues>({
    resolver: zodResolver(
      createWhiskyTastingEventFormValidationSchema(requestSpec)
    ) as Resolver<WhiskyTastingEventFormValues>,
    defaultValues: initialValues,
  });
  const createMutation = useCurationCreate({
    onSuccess: () => navigate('/dashboard/curations'),
  });
  const updateMutation = useCurationUpdate({
    onSuccess: () => navigate('/dashboard/curations'),
  });
  const isMutationPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = form.handleSubmit((values) => {
    const { isCapacityUnspecified, ...curationValues } = values;

    if (isCapacityUnspecified) {
      curationValues.capacity = 0;
    }

    const {
      name,
      description,
      imageUrls,
      exposureStartDate,
      exposureEndDate,
      displayOrder,
      isActive,
      ...payload
    } = curationValues;

    if (payload.kakaoPlaceId === '') {
      delete payload.kakaoPlaceId;
    }

    if (payload.isRecruiting === false) {
      payload.applicationLink = '';
    }

    const request: CurationV2CreateRequest = {
      specId: spec.id,
      name: name.trim(),
      description: description.trim() || null,
      imageUrls,
      exposureStartDate: exposureStartDate.trim() || null,
      exposureEndDate: exposureEndDate.trim() || null,
      displayOrder,
      isActive,
      payload,
    };

    if (curationId) {
      updateMutation.mutate({ curationId, data: request });
      return;
    }

    createMutation.mutate(request);
  });

  return (
    <div className="space-y-6">
      <DetailPageHeader
        title={curationId ? `[${spec.name}] ${initialValues.name}` : `[${spec.name}] 큐레이션 등록`}
        onBack={onBack}
        action={
          curationId
            ? {
                mode: 'edit',
                onUpdate: handleSubmit,
                isPending: isMutationPending,
                disabled: isImageUploading,
              }
            : {
                mode: 'create',
                onCreate: handleSubmit,
                isPending: isMutationPending,
                disabled: isImageUploading,
              }
        }
      />

      <FormProvider {...form}>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,24rem)] lg:items-start">
          <div className="min-w-0 space-y-6">
            <CurationSpecCommonSection onImageUploadingChange={setIsImageUploading} />
            <CurationSpecRenderer sections={getWhiskyTastingEventSections(requestSpec)} />
          </div>
          <aside className="lg:sticky lg:top-6">
            <WhiskyTastingEventFormPreview />
          </aside>
        </div>
      </FormProvider>
    </div>
  );
}
