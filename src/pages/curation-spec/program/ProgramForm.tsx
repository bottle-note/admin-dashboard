import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm, type Resolver } from 'react-hook-form';
import { useNavigate } from 'react-router';

import { DetailPageHeader } from '@/components/common/DetailPageHeader';
import { useCurationCreate, useCurationUpdate } from '@/hooks/useCurations';
import type { CurationV2CreateRequest, CurationV2Spec } from '@/types/api';

import {
  createProgramFormValidationSchema,
  type ProgramFormValues,
  type ProgramRequestSpec,
} from '../curation-spec.schema';
import { CurationSpecCommonSection } from '../components/CurationSpecCommonSection';
import { CurationSpecRenderer } from '../components/CurationSpecRenderer';
import { ProgramFormPreview } from './ProgramFormPreview';
import { getProgramSections } from './program-sections';

export function ProgramForm({
  spec,
  curationId,
  requestSpec,
  initialValues,
  onBack,
}: {
  spec: CurationV2Spec;
  curationId?: number;
  requestSpec: ProgramRequestSpec;
  initialValues: ProgramFormValues;
  onBack: () => void;
}) {
  const navigate = useNavigate();
  const [isImageUploading, setIsImageUploading] = useState(false);
  const form = useForm<ProgramFormValues>({
    resolver: zodResolver(
      createProgramFormValidationSchema(requestSpec)
    ) as Resolver<ProgramFormValues>,
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
    const {
      name,
      description,
      imageUrls,
      exposureStartDate,
      exposureEndDate,
      displayOrder,
      isActive,
      eventStartDate,
      eventEndDate,
      placeName,
      kakaoPlaceId,
      address,
      detailAddress,
      detailLocation,
      organizer,
      sponsor,
      entryFee,
      is_tbc,
      officialUrl,
      registrationUrl,
      programTags,
      programs,
    } = values;

    const payload = {
      eventStartDate,
      eventEndDate,
      placeName,
      address,
      ...(kakaoPlaceId ? { kakaoPlaceId } : {}),
      ...(detailAddress ? { detailAddress } : {}),
      ...(detailLocation ? { detailLocation } : {}),
      ...(organizer ? { organizer } : {}),
      ...(sponsor ? { sponsor } : {}),
      ...(!is_tbc && Number.isFinite(entryFee) ? { entryFee } : {}),
      ...(is_tbc !== undefined ? { is_tbc } : {}),
      ...(officialUrl ? { officialUrl } : {}),
      ...(registrationUrl ? { registrationUrl } : {}),
      ...(programTags?.length ? { programTags } : {}),
      ...(programs.length
        ? {
            programs: programs.map((program) => ({
              name: program.name,
              type: program.type,
              description: program.description,
              ...(program.programDate ? { programDate: program.programDate } : {}),
              ...(program.startTime ? { startTime: program.startTime } : {}),
              ...(program.endTime ? { endTime: program.endTime } : {}),
              ...(program.venue ? { venue: program.venue } : {}),
              ...(program.host ? { host: program.host } : {}),
              ...(program.applicationUrl ? { applicationUrl: program.applicationUrl } : {}),
              ...(program.whiskies?.length ? { whiskies: program.whiskies } : {}),
            })),
          }
        : {}),
    };

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
            <CurationSpecRenderer sections={getProgramSections(requestSpec)} />
          </div>
          <aside className="lg:sticky lg:top-6">
            <ProgramFormPreview />
          </aside>
        </div>
      </FormProvider>
    </div>
  );
}
