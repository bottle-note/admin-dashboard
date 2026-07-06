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
import { CurationImageSection } from '../components/CurationImageSection';
import { WhiskyPairingFields } from './components/WhiskyPairingFields';
import { WhiskyCurationPreviewPanel } from './components/WhiskyCurationPreviewPanel';
import {
  buildWhiskyCurationPayload,
  createWhiskyCurationFormStateFromCuration,
} from './whisky-curation.mapper';
import {
  createCurationWhiskyFormSchema,
  createDefaultPairings,
  createDefaultWhiskyCurationFormState,
  createEmptyWhiskyCurationItem,
  type WhiskyCurationFormModel,
  type WhiskyCurationFormState,
} from './whisky-curation.schema';

interface WhiskyCurationFormProps {
  specDetail: CurationV2Spec;
  formModel: WhiskyCurationFormModel;
  curation?: CurationV2Detail;
  onBack: () => void;
}

export function WhiskyCurationForm({
  specDetail,
  formModel,
  curation,
  onBack,
}: WhiskyCurationFormProps) {
  const navigate = useNavigate();
  const isRootAdmin = useAuthStore((state) => state.hasRole('ROOT_ADMIN'));
  const { showToast } = useToast();
  const [isCurationImageUploading, setIsCurationImageUploading] = useState(false);
  const [isWhiskyImageUploading, setIsWhiskyImageUploading] = useState(false);
  const isEditMode = Boolean(curation);
  const isImageUploading = isCurationImageUploading || isWhiskyImageUploading;
  // 스펙에 pairings가 있으면 페어링(코멘트 숨김 + 페어링 UI), 없으면 추천(코멘트 표시).
  const hasPairings = Boolean(formModel.pairings);
  const formSchema = createCurationWhiskyFormSchema(formModel, {
    mode: isEditMode ? 'edit' : 'create',
  });
  const defaultValues = curation
    ? createWhiskyCurationFormStateFromCuration(curation, formModel)
    : createDefaultWhiskyCurationFormState(formModel);

  const form = useForm<WhiskyCurationFormState>({
    resolver: zodResolver(formSchema as never) as unknown as Resolver<WhiskyCurationFormState>,
    defaultValues,
    mode: 'onSubmit',
  });

  const createMutation = useCurationCreate({
    successMessage: `${specDetail.name} 큐레이션이 등록되었습니다.`,
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
        payload: buildWhiskyCurationPayload(values, formModel),
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
        title={isEditMode ? formModel.editTitle : formModel.title}
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
        <section className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <div className="min-w-0 flex-1 space-y-6">
            <CurationBasicInfoSection
              isRootAdmin={isRootAdmin}
              isEditMode={isEditMode}
              canEditExposureStartDateInEditMode={!curation?.exposureStartDate}
              exposureStartDateLabel="노출 시작일"
              exposureEndDateLabel="노출 종료일"
              exposureStartDateHelpText="노출 시작일은 등록 후 변경할 수 없습니다."
              exposurePeriodTooltipLabel="노출기간 안내"
              exposurePeriodTooltipContent="설정한 노출 기간동안 보틀노트 앱에서 노출됩니다."
            />
            <CurationImageSection onUploadingChange={setIsCurationImageUploading} />
            {formModel.sections.map((section) => (
              <CurationFormSection
                key={section.id}
                section={section}
                onImageUploadingChange={setIsWhiskyImageUploading}
                alcoholCardListOptions={{
                  createEmptyItem: () => createEmptyWhiskyCurationItem(formModel),
                  transformItem: (item) => ({
                    ...item,
                    pairings: createDefaultPairings(formModel),
                  }),
                  showCommentField: !hasPairings,
                  renderItemExtra: hasPairings
                    ? ({ index }) => (
                        <WhiskyPairingFields
                          index={index}
                          formModel={formModel}
                          onUploadingChange={setIsWhiskyImageUploading}
                        />
                      )
                    : undefined,
                }}
              />
            ))}
          </div>

          <aside className="w-full shrink-0 lg:sticky lg:top-6 lg:w-96">
            <WhiskyCurationPreviewPanel formModel={formModel} />
          </aside>
        </section>
      </FormProvider>
    </div>
  );
}

function toNullableTrimmedString(value: string): string | null {
  const normalized = value.trim();
  return normalized || null;
}
