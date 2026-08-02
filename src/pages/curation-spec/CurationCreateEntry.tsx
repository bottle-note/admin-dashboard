import { useNavigate, useSearchParams } from 'react-router';

import { DetailPageHeader } from '@/components/common/DetailPageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCurationSpec, useCurationSpecs } from '@/hooks/useCurations';
import { CurationSpecCode } from '@/types/api';

import { CurationSpecProgramForm } from './components/CurationSpecProgramForm';
import { CurationSpecTastingEventForm } from './components/CurationSpecTastingEventForm';
import {
  programRequestSpecSchema,
  whiskyTastingEventRequestSpecSchema,
} from './curation-spec.schema';

export function CurationCreateEntry() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const specsQuery = useCurationSpecs();
  const selectedCode = searchParams.get('code');
  const selectedSpec = specsQuery.data?.find((spec) => spec.code === selectedCode && spec.isActive);
  const specQuery = useCurationSpec(selectedSpec?.id, selectedSpec?.version);
  const handleBack = () => navigate('/dashboard/curations');

  if (specsQuery.isLoading || (selectedCode && specQuery.isLoading)) {
    return (
      <div className="space-y-6">
        <DetailPageHeader title="큐레이션 등록" onBack={handleBack} />
        <div className="py-12 text-center text-muted-foreground">
          큐레이션 스펙을 불러오는 중입니다.
        </div>
      </div>
    );
  }

  if (!selectedCode && !specsQuery.isError) {
    return (
      <div className="space-y-6">
        <DetailPageHeader title="큐레이션 등록" onBack={handleBack} />
        <div className="grid gap-4 md:grid-cols-2">
          {specsQuery.data
            ?.filter(
              (spec) =>
                spec.isActive &&
                (spec.code === CurationSpecCode.WHISKY_TASTING_EVENT ||
                  spec.code === CurationSpecCode.PROGRAM)
            )
            .map((spec) => (
              <button
                key={spec.id}
                type="button"
                className="rounded-[10px] border bg-card p-6 text-left transition-colors hover:border-primary"
                onClick={() => setSearchParams({ code: spec.code })}
              >
                <h2 className="font-semibold">{spec.name}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{spec.description}</p>
              </button>
            ))}
        </div>
      </div>
    );
  }

  if (specsQuery.isError || specQuery.isError || !selectedSpec || !specQuery.data) {
    return (
      <div className="space-y-6">
        <DetailPageHeader title="큐레이션 등록" onBack={handleBack} />
        <Card className="shadow-none">
          <CardContent className="flex items-center justify-between gap-4 p-6">
            <p className="text-sm text-muted-foreground">큐레이션 스펙을 불러오지 못했습니다.</p>
            <Button
              type="button"
              onClick={() => {
                void specsQuery.refetch();
                if (selectedSpec) {
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

  if (specQuery.data.code === CurationSpecCode.PROGRAM) {
    const requestSpec = programRequestSpecSchema.safeParse(specQuery.data.requestSpec);

    if (!requestSpec.success) {
      return <InvalidSpec onBack={handleBack} specName="프로그램" />;
    }

    return (
      <CurationSpecProgramForm
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
          eventStartDate: '',
          eventEndDate: '',
          placeName: '',
          kakaoPlaceId: '',
          address: '',
          detailLocation: '',
          organizer: '',
          sponsor: '',
          entryFee: 0,
          is_tbc: false,
          officialUrl: '',
          registrationUrl: '',
          programTags: [],
          programs: [
            {
              name: '',
              type: 'MASTER_CLASS',
              programDate: '',
              startTime: '',
              endTime: '',
              venue: '',
              host: '',
              description: '',
              applicationUrl: '',
              whiskies: [],
            },
          ],
        }}
        onBack={handleBack}
      />
    );
  }

  const requestSpec = whiskyTastingEventRequestSpecSchema.safeParse(specQuery.data.requestSpec);

  if (!requestSpec.success) {
    return <InvalidSpec onBack={handleBack} specName="시음회" />;
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

function InvalidSpec({ onBack, specName }: { onBack: () => void; specName: string }) {
  return (
    <div className="space-y-6">
      <DetailPageHeader title={`${specName} 큐레이션 등록`} onBack={onBack} />
      <Card className="shadow-none">
        <CardContent className="p-6">
          <h2 className="font-semibold">큐레이션 스펙을 해석하지 못했습니다.</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {specName} 스펙이 현재 화면의 계약과 일치하지 않습니다.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
