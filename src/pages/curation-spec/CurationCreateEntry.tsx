import { useNavigate } from 'react-router';

import { DetailPageHeader } from '@/components/common/DetailPageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCurationSpec, useCurationSpecs } from '@/hooks/useCurations';
import { CurationSpecCode } from '@/types/api';

import { CurationSpecTastingEventForm } from './components/CurationSpecTastingEventForm';
import { whiskyTastingEventRequestSpecSchema } from './curation-spec.schema';

export function CurationCreateEntry() {
  const navigate = useNavigate();
  const specsQuery = useCurationSpecs();
  const tastingEventSpec = specsQuery.data?.find(
    (spec) => spec.code === CurationSpecCode.WHISKY_TASTING_EVENT && spec.isActive
  );
  const specQuery = useCurationSpec(tastingEventSpec?.id, tastingEventSpec?.version);
  const handleBack = () => navigate('/dashboard/curations');

  if (specsQuery.isLoading || specQuery.isLoading) {
    return (
      <div className="space-y-6">
        <DetailPageHeader title="시음회 큐레이션 등록" onBack={handleBack} />
        <div className="py-12 text-center text-muted-foreground">
          큐레이션 스펙을 불러오는 중입니다.
        </div>
      </div>
    );
  }

  if (specsQuery.isError || specQuery.isError || !tastingEventSpec || !specQuery.data) {
    return (
      <div className="space-y-6">
        <DetailPageHeader title="시음회 큐레이션 등록" onBack={handleBack} />
        <Card className="shadow-none">
          <CardContent className="flex items-center justify-between gap-4 p-6">
            <p className="text-sm text-muted-foreground">
              시음회 큐레이션 스펙을 불러오지 못했습니다.
            </p>
            <Button
              type="button"
              onClick={() => {
                void specsQuery.refetch();
                if (tastingEventSpec) {
                  void specQuery.refetch();
                }
              }}
            >
              다시 시도
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const requestSpec = whiskyTastingEventRequestSpecSchema.safeParse(specQuery.data.requestSpec);

  if (!requestSpec.success) {
    return (
      <div className="space-y-6">
        <DetailPageHeader title="시음회 큐레이션 등록" onBack={handleBack} />
        <Card className="shadow-none">
          <CardContent className="p-6">
            <h2 className="font-semibold">큐레이션 스펙을 해석하지 못했습니다.</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              시음회 스펙이 현재 화면의 계약과 일치하지 않습니다.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <CurationSpecTastingEventForm
      spec={specQuery.data}
      requestSpec={requestSpec.data}
      initialValues={{
        name: '',
        description: '',
        imageUrls: [],
        exposureStartDate: '',
        exposureEndDate: '',
        displayOrder: 0,
        isActive: true,
        eventDate: '',
        eventTime: '',
        placeName: '',
        barAddress: '',
        detailAddress: '',
        capacity: 0,
        entryFee: 0,
        isRecruiting: false,
        is_tbc: false,
        guideText: '',
        applicationLink: '',
        alcohols: [],
      }}
      onBack={handleBack}
    />
  );
}
