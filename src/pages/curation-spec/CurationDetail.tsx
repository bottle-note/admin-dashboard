import { useNavigate, useParams } from 'react-router';

import { DetailPageHeader } from '@/components/common/DetailPageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCurationDetail } from '@/hooks/useCurations';
import { CurationSpecCode, type CurationV2Detail } from '@/types/api';

import { CurationSpecTastingEventForm } from './components/CurationSpecTastingEventForm';
import {
  whiskyTastingEventPayloadSchema,
  whiskyTastingEventRequestSpecSchema,
} from './curation-spec.schema';

export function CurationDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const parsedId = Number(id);
  const curationId = Number.isInteger(parsedId) && parsedId > 0 ? parsedId : undefined;
  const { data, isLoading, isError, refetch } = useCurationDetail(curationId);
  const handleBack = () => navigate('/dashboard/curations');

  if (isLoading) {
    return (
      <div className="space-y-6">
        <DetailPageHeader title="큐레이션 상세" onBack={handleBack} />
        <div className="py-12 text-center text-muted-foreground">
          큐레이션 정보를 불러오는 중입니다.
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-6">
        <DetailPageHeader title="큐레이션 상세" onBack={handleBack} />
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
      </div>
    );
  }

  return <CurationDetailContent curation={data} onBack={handleBack} />;
}

function CurationDetailContent({
  curation,
  onBack,
}: {
  curation: CurationV2Detail;
  onBack: () => void;
}) {
  switch (curation.spec.code) {
    case CurationSpecCode.WHISKY_TASTING_EVENT: {
      const requestSpec = whiskyTastingEventRequestSpecSchema.safeParse(curation.spec.requestSpec);
      const payload = whiskyTastingEventPayloadSchema.safeParse(curation.payload);

      if (!requestSpec.success || !payload.success) {
        return (
          <div className="space-y-6">
            <DetailPageHeader title="큐레이션 상세" onBack={onBack} />
            <Card className="shadow-none">
              <CardContent className="p-6">
                <h2 className="font-semibold">큐레이션 스펙을 해석하지 못했습니다.</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  시음회 스펙 또는 상세 데이터가 현재 화면의 계약과 일치하지 않습니다.
                </p>
              </CardContent>
            </Card>
          </div>
        );
      }

      return (
        <CurationSpecTastingEventForm
          spec={curation.spec}
          curationId={curation.id}
          requestSpec={requestSpec.data}
          initialValues={{
            ...payload.data,
            name: curation.name,
            description: curation.description ?? '',
            imageUrls: curation.imageUrls,
            exposureStartDate: curation.exposureStartDate ?? '',
            exposureEndDate: curation.exposureEndDate ?? '',
            displayOrder: curation.displayOrder,
            isActive: curation.isActive,
          }}
          onBack={onBack}
        />
      );
    }
    case CurationSpecCode.RECOMMENDED_WHISKY:
    case CurationSpecCode.WHISKY_PAIRING:
    case CurationSpecCode.PROGRAM:
      return (
        <div className="space-y-6">
          <DetailPageHeader title={`[${curation.spec.name}] ${curation.name}`} onBack={onBack} />
        </div>
      );
  }

  return (
    <div className="space-y-6">
      <DetailPageHeader title={`[${curation.spec.name}] ${curation.name}`} onBack={onBack} />
    </div>
  );
}
