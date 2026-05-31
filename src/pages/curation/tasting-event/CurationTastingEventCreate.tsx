import { useMemo, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Loader2, Save } from 'lucide-react';
import { useNavigate } from 'react-router';

import { DetailPageHeader } from '@/components/common/DetailPageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCurationCreate } from '@/hooks/useCurations';
import { useAuthStore } from '@/stores/auth';
import type { CurationV2CreateRequest } from '@/types/api';

import { TastingEventAlcoholLineupSection } from './components/TastingEventAlcoholLineupSection';
import { TastingEventBasicInfoSection } from './components/TastingEventBasicInfoSection';
import { TastingEventDateLocationSection } from './components/TastingEventDateLocationSection';
import { TastingEventImageSection } from './components/TastingEventImageSection';
import { TastingEventParticipationSection } from './components/TastingEventParticipationSection';
import { TastingEventPreviewPanel } from './components/TastingEventPreviewPanel';
import { buildTastingEventPayload } from './tasting-event.mapper';
import {
  DEFAULT_CURATION_TASTING_EVENT_FORM,
  createCurationTastingEventFormSchema,
  type CurationTastingEventFormValues,
} from './tasting-event.schema';
import { useTastingEventSpecContract } from './useTastingEventSpecContract';

interface BlockingStateProps {
  title: string;
  description: string;
  onRetry?: () => void;
  onBack: () => void;
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

export function CurationTastingEventCreatePage() {
  const navigate = useNavigate();
  const isRootAdmin = useAuthStore((state) => state.hasRole('ROOT_ADMIN'));
  const [isImageUploading, setIsImageUploading] = useState(false);
  const {
    specsQuery,
    tastingEventSpec,
    specDetailQuery,
    specDetail,
    formContract,
    canShowForm,
  } = useTastingEventSpecContract();
  const formSchema = useMemo(
    () => createCurationTastingEventFormSchema(formContract),
    [formContract]
  );

  const form = useForm<CurationTastingEventFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: DEFAULT_CURATION_TASTING_EVENT_FORM,
    mode: 'onSubmit',
  });

  const createMutation = useCurationCreate({
    successMessage: '시음회 큐레이션이 등록되었습니다.',
    onSuccess: () => {
      navigate('/dashboard/curations');
    },
  });

  const handleBack = () => {
    navigate('/dashboard/curations');
  };

  const handleSubmit = form.handleSubmit((values) => {
    if (!specDetail) return;

    const request: CurationV2CreateRequest = {
      specId: specDetail.id,
      name: values.name.trim(),
      description: values.description.trim(),
      imageUrls: values.imageUrls,
      exposureStartDate: values.exposureStartDate,
      exposureEndDate: values.exposureEndDate,
      displayOrder: values.displayOrder,
      isActive: values.isActive,
      payload: buildTastingEventPayload(values),
    };

    createMutation.mutate(request);
  });

  return (
    <div className="space-y-6">
      <DetailPageHeader
        title="시음회 작성"
        subtitle={specDetail?.name ?? '위스키 시음회'}
        onBack={handleBack}
        actions={
          <>
            <Button type="button" variant="outline" onClick={handleBack}>
              목록
            </Button>
            {canShowForm && (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={createMutation.isPending || isImageUploading}
              >
                <Save className="mr-2 h-4 w-4" />
                {createMutation.isPending ? '저장 중...' : '저장'}
              </Button>
            )}
          </>
        }
      />

      {specsQuery.isLoading ? (
        <Card className="shadow-none">
          <CardContent className="flex items-center gap-3 p-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            큐레이션 스펙을 불러오는 중입니다.
          </CardContent>
        </Card>
      ) : specsQuery.isError ? (
        <BlockingState
          title="시음회 스펙 목록을 불러오지 못했습니다."
          description="큐레이션 스펙 목록 조회에 실패했습니다. 잠시 후 다시 시도해 주세요."
          onRetry={() => void specsQuery.refetch()}
          onBack={handleBack}
        />
      ) : !tastingEventSpec ? (
        <BlockingState
          title="시음회 스펙을 찾을 수 없습니다."
          description="활성화된 시음회 큐레이션 스펙이 등록되어 있지 않습니다."
          onBack={handleBack}
        />
      ) : specDetailQuery.isLoading ? (
        <Card className="shadow-none">
          <CardContent className="flex items-center gap-3 p-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            시음회 스펙 상세를 불러오는 중입니다.
          </CardContent>
        </Card>
      ) : specDetailQuery.isError ? (
        <BlockingState
          title="시음회 스펙 상세를 불러올 권한이 없습니다."
          description="상세 스펙 조회에 실패해 작성 화면을 열 수 없습니다. 권한을 확인해 주세요."
          onRetry={() => void specDetailQuery.refetch()}
          onBack={handleBack}
        />
      ) : (
        <FormProvider {...form}>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <TastingEventBasicInfoSection isRootAdmin={isRootAdmin} />
              <TastingEventImageSection onUploadingChange={setIsImageUploading} />
              <TastingEventDateLocationSection contract={formContract} />
              <TastingEventParticipationSection contract={formContract} />
              <TastingEventAlcoholLineupSection contract={formContract.alcohols} />
            </div>

            <aside className="space-y-6 lg:col-span-1">
              <TastingEventPreviewPanel />
            </aside>
          </div>
        </FormProvider>
      )}
    </div>
  );
}
