import { FormProvider, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router';

import { DetailPageHeader } from '@/components/common/DetailPageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCurationDetail } from '@/hooks/useCurations';
import { CurationSpecCode, type CurationV2Detail } from '@/types/api';

import { CurationSpecRenderer } from './components/CurationSpecRenderer';
import {
  whiskyTastingEventPayloadSchema,
  whiskyTastingEventRequestSpecSchema,
  type WhiskyTastingEventPayload,
  type WhiskyTastingEventRequestSpec,
} from './curation-spec.schema';
import { getWhiskyTastingEventSections } from './curation-sections';

export function CurationDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const parsedId = Number(id);
  const curationId = Number.isInteger(parsedId) && parsedId > 0 ? parsedId : undefined;
  const { data, isLoading, isError, refetch } = useCurationDetail(curationId);

  return (
    <div className="space-y-6">
      <DetailPageHeader
        title={data ? `[${data.spec.name}] ${data.name}` : '큐레이션 상세'}
        onBack={() => navigate('/dashboard/curations')}
        action={
          data
            ? {
                mode: 'edit',
                onUpdate: () => console.log('Update curation:', data),
                onDelete: () => console.log('Delete curation:', data),
              }
            : undefined
        }
      />

      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground">
          큐레이션 정보를 불러오는 중입니다.
        </div>
      ) : isError || !data ? (
        <Card className="shadow-none">
          <CardContent className="flex items-center justify-between gap-4 p-6">
            <p className="text-sm text-muted-foreground">
              큐레이션 상세 정보를 불러오지 못했습니다.
            </p>
            <Button type="button" onClick={() => void refetch()}>
              다시 시도
            </Button>
          </CardContent>
        </Card>
      ) : (
        <CurationDetailContent curation={data} />
      )}
    </div>
  );
}

function CurationDetailContent({ curation }: { curation: CurationV2Detail }) {
  switch (curation.spec.code) {
    case CurationSpecCode.WHISKY_TASTING_EVENT: {
      const requestSpec = whiskyTastingEventRequestSpecSchema.safeParse(curation.spec.requestSpec);
      const payload = whiskyTastingEventPayloadSchema.safeParse(curation.payload);

      if (!requestSpec.success || !payload.success) {
        return (
          <Card className="shadow-none">
            <CardContent className="p-6">
              <h2 className="font-semibold">큐레이션 스펙을 해석하지 못했습니다.</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                시음회 스펙 또는 상세 데이터가 현재 화면의 계약과 일치하지 않습니다.
              </p>
            </CardContent>
          </Card>
        );
      }

      return <WhiskyTastingEventDetail requestSpec={requestSpec.data} payload={payload.data} />;
    }
    case CurationSpecCode.RECOMMENDED_WHISKY:
    case CurationSpecCode.WHISKY_PAIRING:
    case CurationSpecCode.PROGRAM:
      return null;
  }

  return null;
}

function WhiskyTastingEventDetail({
  requestSpec,
  payload,
}: {
  requestSpec: WhiskyTastingEventRequestSpec;
  payload: WhiskyTastingEventPayload;
}) {
  const form = useForm<WhiskyTastingEventPayload>({
    defaultValues: payload,
  });

  return (
    <FormProvider {...form}>
      <CurationSpecRenderer sections={getWhiskyTastingEventSections(requestSpec)} />
    </FormProvider>
  );
}
