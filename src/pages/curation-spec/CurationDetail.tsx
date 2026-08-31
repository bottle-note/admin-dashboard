import { useNavigate, useParams } from 'react-router';

import { DetailPageHeader } from '@/components/common/DetailPageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCurationDetail } from '@/hooks/useCurations';
import { CurationSpecCode, type CurationV2Detail } from '@/types/api';

import { ProgramForm } from './program/ProgramForm';
import { RecommendedWhiskyForm } from './recommended-whisky/RecommendedWhiskyForm';
import { WhiskyPairingForm } from './whisky-pairing/WhiskyPairingForm';
import { WhiskyTastingEventForm } from './whisky-tasting-event/WhiskyTastingEventForm';
import {
  programPayloadSchema,
  programRequestSpecSchema,
  whiskyCurationDetailPayloadSchema,
  whiskyCurationRequestSpecSchema,
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
        <WhiskyTastingEventForm
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
            isCapacityUnspecified: payload.data.capacity === 0,
          }}
          onBack={onBack}
        />
      );
    }
    case CurationSpecCode.PROGRAM: {
      const requestSpec = programRequestSpecSchema.safeParse(curation.spec.requestSpec);
      const payload = programPayloadSchema.safeParse(curation.payload);

      if (!requestSpec.success || !payload.success) {
        return (
          <div className="space-y-6">
            <DetailPageHeader title="큐레이션 상세" onBack={onBack} />
            <Card className="shadow-none">
              <CardContent className="p-6">
                <h2 className="font-semibold">큐레이션 스펙을 해석하지 못했습니다.</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  프로그램 스펙 또는 상세 데이터가 현재 화면의 계약과 일치하지 않습니다.
                </p>
              </CardContent>
            </Card>
          </div>
        );
      }

      return (
        <ProgramForm
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
            kakaoPlaceId: payload.data.kakaoPlaceId ?? '',
            detailAddress: payload.data.detailAddress ?? '',
            detailLocation: payload.data.detailLocation ?? '',
            organizer: payload.data.organizer ?? '',
            sponsor: payload.data.sponsor ?? '',
            entryFee: payload.data.entryFee ?? 0,
            is_tbc: payload.data.is_tbc ?? false,
            officialUrl: payload.data.officialUrl ?? '',
            registrationUrl: payload.data.registrationUrl ?? '',
            programTags: payload.data.programTags ?? [],
            programs: (payload.data.programs ?? []).map((program) => ({
              ...program,
              programDate: program.programDate ?? '',
              startTime: program.startTime ?? '',
              endTime: program.endTime ?? '',
              venue: program.venue ?? '',
              host: program.host ?? '',
              applicationUrl: program.applicationUrl ?? '',
              whiskies: program.whiskies ?? [],
            })),
          }}
          onBack={onBack}
        />
      );
    }
    case CurationSpecCode.RECOMMENDED_WHISKY: {
      const requestSpec = whiskyCurationRequestSpecSchema.safeParse(curation.spec.requestSpec);
      const payload = whiskyCurationDetailPayloadSchema.safeParse(curation.payload);

      if (!requestSpec.success || !payload.success) {
        return <InvalidCurationSpec specName="추천 위스키" onBack={onBack} />;
      }

      return (
        <RecommendedWhiskyForm
          spec={curation.spec}
          curationId={curation.id}
          requestSpec={requestSpec.data}
          initialValues={createWhiskyCurationInitialValues(curation, payload.data)}
          onBack={onBack}
        />
      );
    }
    case CurationSpecCode.WHISKY_PAIRING: {
      const requestSpec = whiskyCurationRequestSpecSchema.safeParse(curation.spec.requestSpec);
      const payload = whiskyCurationDetailPayloadSchema.safeParse(curation.payload);

      if (!requestSpec.success || !payload.success) {
        return <InvalidCurationSpec specName="위스키 페어링" onBack={onBack} />;
      }

      return (
        <WhiskyPairingForm
          spec={curation.spec}
          curationId={curation.id}
          requestSpec={requestSpec.data}
          initialValues={createWhiskyCurationInitialValues(curation, payload.data)}
          onBack={onBack}
        />
      );
    }
  }

  return (
    <div className="space-y-6">
      <DetailPageHeader title={`[${curation.spec.name}] ${curation.name}`} onBack={onBack} />
    </div>
  );
}

function createWhiskyCurationInitialValues(
  curation: CurationV2Detail,
  alcohols: ReturnType<typeof whiskyCurationDetailPayloadSchema.parse>
) {
  return {
    name: curation.name,
    description: curation.description ?? '',
    imageUrls: curation.imageUrls,
    exposureStartDate: curation.exposureStartDate ?? '',
    exposureEndDate: curation.exposureEndDate ?? '',
    displayOrder: curation.displayOrder,
    isActive: curation.isActive,
    alcohols: alcohols.map((item) => ({
      ...item,
      alcohol: {
        ...item.alcohol,
        alcoholId: item.alcohol.alcoholId ?? null,
        engName: item.alcohol.engName ?? '',
        imageUrl: item.alcohol.imageUrl ?? '',
        abv: item.alcohol.abv ?? '',
        cask: item.alcohol.cask ?? '',
        volume: item.alcohol.volume ?? '',
        regionName: item.alcohol.regionName ?? '',
        korCategory: item.alcohol.korCategory ?? '',
      },
      comment: item.comment ?? '',
      pairings: item.pairings?.map((pairing) => ({
        ...pairing,
        itemImageUrl: pairing.itemImageUrl ?? '',
      })),
    })),
  };
}

function InvalidCurationSpec({ specName, onBack }: { specName: string; onBack: () => void }) {
  return (
    <div className="space-y-6">
      <DetailPageHeader title="큐레이션 상세" onBack={onBack} />
      <Card className="shadow-none">
        <CardContent className="p-6">
          <h2 className="font-semibold">큐레이션 스펙을 해석하지 못했습니다.</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {specName} 스펙 또는 상세 데이터가 현재 화면의 계약과 일치하지 않습니다.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
