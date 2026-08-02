import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm, type Resolver } from 'react-hook-form';
import { useNavigate } from 'react-router';

import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog';
import { DetailPageHeader } from '@/components/common/DetailPageHeader';
import { useCurationCreate, useCurationDelete, useCurationUpdate } from '@/hooks/useCurations';
import type { CurationV2CreateRequest, CurationV2Spec } from '@/types/api';

import {
  createProgramFormValidationSchema,
  type ProgramFormValues,
  type ProgramRequestSpec,
} from '../curation-spec.schema';
import { getProgramSections } from '../curation-sections';
import { CurationSpecCommonSection } from './CurationSpecCommonSection';
import { CurationSpecProgramPreview } from './CurationSpecProgramPreview';
import { CurationSpecRenderer } from './CurationSpecRenderer';

export function CurationSpecProgramForm({
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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
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
  const deleteMutation = useCurationDelete({
    onSuccess: () => navigate('/dashboard/curations'),
  });
  const isMutationPending =
    createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

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
      programs: programs.map((program) => ({
        name: program.name,
        type: program.type,
        programDate: program.programDate,
        startTime: program.startTime,
        description: program.description,
        ...(program.endTime ? { endTime: program.endTime } : {}),
        ...(program.venue ? { venue: program.venue } : {}),
        ...(program.host ? { host: program.host } : {}),
        ...(program.applicationUrl ? { applicationUrl: program.applicationUrl } : {}),
        ...(program.whiskies?.length ? { whiskies: program.whiskies } : {}),
      })),
      ...(kakaoPlaceId ? { kakaoPlaceId } : {}),
      ...(detailLocation ? { detailLocation } : {}),
      ...(organizer ? { organizer } : {}),
      ...(sponsor ? { sponsor } : {}),
      ...(!is_tbc && Number.isFinite(entryFee) ? { entryFee } : {}),
      ...(is_tbc !== undefined ? { is_tbc } : {}),
      ...(officialUrl ? { officialUrl } : {}),
      ...(registrationUrl ? { registrationUrl } : {}),
      ...(programTags?.length ? { programTags } : {}),
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

  const handleDelete = () => {
    if (!curationId) return;
    deleteMutation.mutate(curationId);
  };

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
                onDelete: () => setIsDeleteDialogOpen(true),
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
            <CurationSpecProgramPreview />
          </aside>
        </div>
      </FormProvider>

      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDelete}
        title="큐레이션 삭제"
        description="정말 이 큐레이션을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
