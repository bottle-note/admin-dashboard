import { useState } from 'react';
import { FormProvider, useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save } from 'lucide-react';
import { useNavigate } from 'react-router';

import { DetailPageHeader } from '@/components/common/DetailPageHeader';
import { Button } from '@/components/ui/button';
import { useCurationCreate, useCurationUpdate } from '@/hooks/useCurations';
import { useToast } from '@/hooks/useToast';
import { useAuthStore } from '@/stores/auth';
import {
  type CurationV2CreateRequest,
  type CurationV2Detail,
  type CurationV2Spec,
  type CurationV2UpdateRequest,
} from '@/types/api';

import { CurationBasicInfoSection } from '../components/CurationBasicInfoSection';
import { CurationFormSection } from '../components/CurationFormSection';
import { WhiskyTastingEventPreviewPanel } from './components/WhiskyTastingEventPreviewPanel';
import type { WhiskyTastingEventFormModel } from './whisky-tasting-event.form-model';
import {
  buildWhiskyTastingEventPayload,
  createWhiskyTastingEventFormStateFromCuration,
} from './whisky-tasting-event.mapper';
import {
  createDefaultWhiskyTastingEventFormState,
  createWhiskyTastingEventFormSchema,
  type WhiskyTastingEventFormState,
} from './whisky-tasting-event.schema';

interface WhiskyTastingEventFormProps {
  specDetail: CurationV2Spec;
  formModel: WhiskyTastingEventFormModel;
  curation?: CurationV2Detail;
  onBack: () => void;
}

export function WhiskyTastingEventForm({
  specDetail,
  formModel,
  curation,
  onBack,
}: WhiskyTastingEventFormProps) {
  const navigate = useNavigate();
  const isRootAdmin = useAuthStore((state) => state.hasRole('ROOT_ADMIN'));
  const { showToast } = useToast();
  const [isCurationImageUploading, setIsCurationImageUploading] = useState(false);
  const [isWhiskyImageUploading, setIsWhiskyImageUploading] = useState(false);
  const isEditMode = Boolean(curation);
  const isImageUploading = isCurationImageUploading || isWhiskyImageUploading;
  const formSchema = createWhiskyTastingEventFormSchema(formModel, {
    mode: isEditMode ? 'edit' : 'create',
  });
  const defaultValues = curation
    ? createWhiskyTastingEventFormStateFromCuration(curation, formModel)
    : createDefaultWhiskyTastingEventFormState(formModel);

  const form = useForm<WhiskyTastingEventFormState>({
    resolver: zodResolver(formSchema as never) as unknown as Resolver<WhiskyTastingEventFormState>,
    defaultValues,
    mode: 'onSubmit',
  });

  const createMutation = useCurationCreate({
    successMessage: '시음회 큐레이션이 등록되었습니다.',
    onSuccess: () => {
      navigate('/dashboard/curations');
    },
  });
  const updateMutation = useCurationUpdate({
    onSuccess: () => {
      navigate('/dashboard/curations');
    },
  });
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = form.handleSubmit(
    (values) => {
      const request: CurationV2CreateRequest | CurationV2UpdateRequest = {
        specId: specDetail.id,
        name: values.name.trim(),
        description: toNullableTrimmedString(values.description),
        imageUrls: values.imageUrls,
        exposureStartDate: toNullableTrimmedString(values.exposureStartDate),
        exposureEndDate: toNullableTrimmedString(values.exposureEndDate),
        displayOrder: values.displayOrder,
        isActive: values.isActive,
        payload: buildWhiskyTastingEventPayload(values, formModel),
      };

      if (curation) {
        updateMutation.mutate({
          curationId: curation.id,
          data: request,
        });
        return;
      }

      createMutation.mutate(request);
    },
    () => {
      showToast({ type: 'warning', message: '입력 정보를 확인해주세요.' });
    }
  );

  return (
    <div className="space-y-6">
      <DetailPageHeader
        title={isEditMode ? '시음회 수정' : '시음회 작성'}
        subtitle={isEditMode ? `ID: ${curation?.id}` : specDetail.name}
        onBack={onBack}
        actions={
          <>
            <Button type="button" variant="outline" onClick={onBack}>
              목록
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || isImageUploading}
            >
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting ? '저장 중...' : isEditMode ? '수정' : '저장'}
            </Button>
          </>
        }
      />

      <FormProvider {...form}>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,24rem)] lg:items-start">
          <div className="min-w-0 space-y-6">
            <CurationBasicInfoSection
              isRootAdmin={isRootAdmin}
              isEditMode={isEditMode}
              canEditExposureStartDateInEditMode={!curation?.exposureStartDate}
              onImageUploadingChange={setIsCurationImageUploading}
            />
            {formModel.sections.map((section) => (
              <CurationFormSection
                key={section.id}
                section={section}
                onImageUploadingChange={setIsWhiskyImageUploading}
              />
            ))}
          </div>

          <aside className="lg:sticky lg:top-6">
            <WhiskyTastingEventPreviewPanel />
          </aside>
        </div>
      </FormProvider>
    </div>
  );
}

function toNullableTrimmedString(value: string): string | null {
  const normalized = value.trim();
  return normalized || null;
}
