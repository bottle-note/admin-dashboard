import { useState } from 'react';
import { FormProvider, useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Loader2, Save } from 'lucide-react';
import { useNavigate } from 'react-router';

import { DetailPageHeader } from '@/components/common/DetailPageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCurationCreate, useCurationUpdate } from '@/hooks/useCurations';
import { useToast } from '@/hooks/useToast';
import { useAuthStore } from '@/stores/auth';
import {
  CurationSpecCode,
  type CurationV2CreateRequest,
  type CurationV2Detail,
  type CurationV2Spec,
  type CurationV2UpdateRequest,
} from '@/types/api';

import { useCurationSpecFormModel } from '../useCurationSpecFormModel';
import { TastingEventBasicInfoSection } from './components/TastingEventBasicInfoSection';
import { TastingEventImageSection } from './components/TastingEventImageSection';
import { TastingEventPreviewPanel } from './components/TastingEventPreviewPanel';
import {
  createTastingEventFormModel,
  type TastingEventFormModel,
} from './tasting-event.form-model';
import {
  buildTastingEventPayload,
  createTastingEventFormStateFromCuration,
} from './tasting-event.mapper';
import {
  createCurationTastingEventFormSchema,
  createDefaultTastingEventCreateFormState,
  type TastingEventCreateFormState,
} from './tasting-event.schema';
import { CurationFormSection } from '../components/CurationFormSection';

interface BlockingStateProps {
  title: string;
  description: string;
  onRetry?: () => void;
  onBack: () => void;
}

type CreatePageViewState =
  | 'specs-loading'
  | 'specs-error'
  | 'spec-missing'
  | 'detail-loading'
  | 'detail-error'
  | 'form';

export function CurationTastingEventCreatePage() {
  const navigate = useNavigate();
  const { specsQuery, targetSpec, specDetailQuery, specDetail, formModel } =
    useCurationSpecFormModel({
      specCode: CurationSpecCode.WHISKY_TASTING_EVENT,
      createFormModel: createTastingEventFormModel,
    });

  const handleBack = () => {
    navigate('/dashboard/curations');
  };

  let viewState: CreatePageViewState = 'form';
  if (specsQuery.isLoading) {
    viewState = 'specs-loading';
  } else if (specsQuery.isError) {
    viewState = 'specs-error';
  } else if (!targetSpec) {
    viewState = 'spec-missing';
  } else if (specDetailQuery.isLoading) {
    viewState = 'detail-loading';
  } else if (specDetailQuery.isError) {
    viewState = 'detail-error';
  } else if (!specDetail || !formModel) {
    viewState = 'detail-loading';
  }

  const renderContent = () => {
    switch (viewState) {
      case 'specs-loading':
        return <LoadingState message="큐레이션 스펙을 불러오는 중입니다." />;
      case 'specs-error':
        return (
          <BlockingState
            title="시음회 스펙 목록을 불러오지 못했습니다."
            description="큐레이션 스펙 목록 조회에 실패했습니다. 잠시 후 다시 시도해 주세요."
            onRetry={() => void specsQuery.refetch()}
            onBack={handleBack}
          />
        );
      case 'spec-missing':
        return (
          <BlockingState
            title="시음회 스펙을 찾을 수 없습니다."
            description="활성화된 시음회 큐레이션 스펙이 등록되어 있지 않습니다."
            onBack={handleBack}
          />
        );
      case 'detail-loading':
        return <LoadingState message="시음회 스펙 상세를 불러오는 중입니다." />;
      case 'detail-error':
        return (
          <BlockingState
            title="시음회 스펙 상세를 불러올 권한이 없습니다."
            description="상세 스펙 조회에 실패해 작성 화면을 열 수 없습니다. 권한을 확인해 주세요."
            onRetry={() => void specDetailQuery.refetch()}
            onBack={handleBack}
          />
        );
      case 'form':
        if (!specDetail || !formModel) {
          return <LoadingState message="시음회 스펙 상세를 불러오는 중입니다." />;
        }

        return (
          <TastingEventReadyForm
            specDetail={specDetail}
            formModel={formModel}
            onBack={handleBack}
          />
        );
    }
  };

  if (viewState === 'form') {
    return renderContent();
  }

  return (
    <div className="space-y-6">
      <DetailPageHeader
        title="시음회 작성"
        subtitle={specDetail?.name ?? '위스키 시음회'}
        onBack={handleBack}
        actions={
          <Button type="button" variant="outline" onClick={handleBack}>
            목록
          </Button>
        }
      />

      {renderContent()}
    </div>
  );
}

export function CurationTastingEventEditPage({ curation }: { curation: CurationV2Detail }) {
  const navigate = useNavigate();
  const formModel = createTastingEventFormModel(curation.spec);

  return (
    <TastingEventReadyForm
      specDetail={curation.spec}
      formModel={formModel}
      curation={curation}
      onBack={() => navigate('/dashboard/curations')}
    />
  );
}

interface TastingEventReadyFormProps {
  specDetail: CurationV2Spec;
  formModel: TastingEventFormModel;
  curation?: CurationV2Detail;
  onBack: () => void;
}

function TastingEventReadyForm({
  specDetail,
  formModel,
  curation,
  onBack,
}: TastingEventReadyFormProps) {
  const navigate = useNavigate();
  const isRootAdmin = useAuthStore((state) => state.hasRole('ROOT_ADMIN'));
  const { showToast } = useToast();
  const [isImageUploading, setIsImageUploading] = useState(false);
  const isEditMode = Boolean(curation);
  const formSchema = createCurationTastingEventFormSchema(formModel, {
    mode: isEditMode ? 'edit' : 'create',
  });
  const defaultValues = curation
    ? createTastingEventFormStateFromCuration(curation, formModel)
    : createDefaultTastingEventCreateFormState(formModel);

  const form = useForm<TastingEventCreateFormState>({
    resolver: zodResolver(formSchema as never) as unknown as Resolver<TastingEventCreateFormState>,
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
        payload: buildTastingEventPayload(values, formModel),
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
            <TastingEventBasicInfoSection isRootAdmin={isRootAdmin} isEditMode={isEditMode} />
            <TastingEventImageSection onUploadingChange={setIsImageUploading} />
            {formModel.sections.map((section) => (
              <CurationFormSection key={section.id} section={section} />
            ))}
          </div>

          <aside className="lg:sticky lg:top-6">
            <TastingEventPreviewPanel />
          </aside>
        </div>
      </FormProvider>
    </div>
  );
}

function LoadingState({ message }: { message: string }) {
  return (
    <Card className="shadow-none">
      <CardContent className="flex items-center gap-3 p-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        {message}
      </CardContent>
    </Card>
  );
}

function BlockingState({ title, description, onRetry, onBack }: BlockingStateProps) {
  return (
    <Card className="shadow-none">
      <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 text-destructive" aria-hidden="true" />
          <div>
            <h2 className="text-base font-semibold">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {onRetry && (
            <Button type="button" variant="outline" onClick={onRetry}>
              다시 시도
            </Button>
          )}
          <Button type="button" onClick={onBack}>
            목록
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function toNullableTrimmedString(value: string): string | null {
  const normalized = value.trim();
  return normalized || null;
}
