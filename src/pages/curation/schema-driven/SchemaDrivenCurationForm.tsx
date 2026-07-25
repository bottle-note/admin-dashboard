import { useState } from 'react';
import { FormProvider, useForm, type FieldErrors, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save } from 'lucide-react';
import { useNavigate } from 'react-router';

import { DetailPageHeader } from '@/components/common/DetailPageHeader';
import { Button } from '@/components/ui/button';
import { useCurationCreate, useCurationUpdate } from '@/hooks/useCurations';
import { useToast } from '@/hooks/useToast';
import { useAuthStore } from '@/stores/auth';
import type {
  CurationV2CreateRequest,
  CurationV2Detail,
  CurationV2UpdateRequest,
} from '@/types/api';

import { CurationBasicInfoSection } from '../components/CurationBasicInfoSection';
import { CurationFormErrorFocusProvider } from '../components/CurationFormErrorFocusProvider';
import { CurationFormSection } from '../components/CurationFormSection';
import { useCurationFormErrorFocus } from '../form-error-focus';
import {
  buildSchemaDrivenCurationPayload,
  createSchemaDrivenCurationFormStateFromCuration,
} from './schema-driven-curation.mapper';
import type { SchemaDrivenCurationFormModel } from './schema-driven-curation.form-model';
import {
  createDefaultSchemaDrivenCurationFormState,
  createSchemaDrivenCurationFormSchema,
  type SchemaDrivenCurationFormState,
} from './schema-driven-curation.schema';

interface SchemaDrivenCurationFormProps {
  formModel: SchemaDrivenCurationFormModel;
  curation?: CurationV2Detail;
  onBack: () => void;
}

export function SchemaDrivenCurationForm({
  formModel,
  curation,
  onBack,
}: SchemaDrivenCurationFormProps) {
  const navigate = useNavigate();
  const isRootAdmin = useAuthStore((state) => state.hasRole('ROOT_ADMIN'));
  const { showToast } = useToast();
  const [isCurationImageUploading, setIsCurationImageUploading] = useState(false);
  const [isWhiskyImageUploading, setIsWhiskyImageUploading] = useState(false);
  const isEditMode = Boolean(curation);
  const formSchema = createSchemaDrivenCurationFormSchema(formModel, {
    mode: isEditMode ? 'edit' : 'create',
  });
  const defaultValues = curation
    ? createSchemaDrivenCurationFormStateFromCuration(curation, formModel)
    : createDefaultSchemaDrivenCurationFormState(formModel);
  const errorFocus = useCurationFormErrorFocus<SchemaDrivenCurationFormState>();
  const form = useForm<SchemaDrivenCurationFormState>({
    resolver: zodResolver(
      formSchema as never
    ) as unknown as Resolver<SchemaDrivenCurationFormState>,
    defaultValues,
    mode: 'onSubmit',
    shouldFocusError: false,
  });
  const createMutation = useCurationCreate({
    successMessage: `${formModel.spec.name} 큐레이션이 등록되었습니다.`,
    onSuccess: () => navigate('/dashboard/curations'),
  });
  const updateMutation = useCurationUpdate({
    onSuccess: () => navigate('/dashboard/curations'),
  });
  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const isImageUploading = isCurationImageUploading || isWhiskyImageUploading;

  const handleSubmit = form.handleSubmit(
    (values) => {
      const request: CurationV2CreateRequest | CurationV2UpdateRequest = {
        specId: formModel.spec.id,
        name: values.name.trim(),
        description: values.description.trim() || null,
        imageUrls: values.imageUrls,
        exposureStartDate: values.exposureStartDate || null,
        exposureEndDate: values.exposureEndDate || null,
        displayOrder: values.displayOrder,
        isActive: values.isActive,
        payload: buildSchemaDrivenCurationPayload(values, formModel),
      };

      if (curation) {
        updateMutation.mutate({ curationId: curation.id, data: request });
      } else {
        createMutation.mutate(request);
      }
    },
    (errors: FieldErrors<SchemaDrivenCurationFormState>) => {
      showToast({ type: 'warning', message: '입력 정보를 확인해주세요.' });
      errorFocus.focusFirstError(errors);
    }
  );

  return (
    <div className="space-y-6">
      <DetailPageHeader
        title={isEditMode ? formModel.editTitle : formModel.title}
        subtitle={isEditMode ? `ID: ${curation?.id}` : formModel.spec.name}
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
        <CurationFormErrorFocusProvider registry={errorFocus.registry}>
          <div className="space-y-6">
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
        </CurationFormErrorFocusProvider>
      </FormProvider>
    </div>
  );
}
