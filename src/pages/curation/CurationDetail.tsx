import { useNavigate, useParams } from 'react-router';
import { ImageIcon } from 'lucide-react';

import { DetailPageHeader } from '@/components/common/DetailPageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCurationDetail } from '@/hooks/useCurations';
import { CurationSpecCode, type CurationV2Detail } from '@/types/api';

import { CurationWhiskyTastingEventEditPage } from './whisky-tasting-event/CurationWhiskyTastingEventEdit';
import { WhiskyCurationEditPage } from './whisky-curation/WhiskyCurationEditPage';
import {
  formatCurationDateTime,
  formatCurationExposurePeriod,
  formatCurationSpecCode,
  formatPayloadValue,
  getCurationPayloadEntries,
} from './curation-display-utils';

export function CurationDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const curationId = id ? Number(id) : undefined;
  const { data: curation, isLoading, isError, refetch } = useCurationDetail(curationId);

  if (!isLoading && !isError && curation?.spec.code === CurationSpecCode.WHISKY_TASTING_EVENT) {
    return <CurationWhiskyTastingEventEditPage curation={curation} />;
  }

  if (
    !isLoading &&
    !isError &&
    (curation?.spec.code === CurationSpecCode.RECOMMENDED_WHISKY ||
      curation?.spec.code === CurationSpecCode.WHISKY_PAIRING)
  ) {
    return <WhiskyCurationEditPage curation={curation} />;
  }

  return (
    <div className="space-y-6">
      <DetailPageHeader
        title="큐레이션 상세"
        subtitle={curation ? `ID: ${curation.id}` : undefined}
        onBack={() => navigate('/dashboard/curations')}
        actions={
          <Button variant="outline" onClick={() => navigate('/dashboard/curations')}>
            목록
          </Button>
        }
      />

      {isLoading ? (
        <div className="py-8 text-center text-muted-foreground">로딩 중...</div>
      ) : isError || !curation ? (
        <Card className="shadow-none">
          <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold">큐레이션을 불러오지 못했습니다.</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                큐레이션 상세 조회에 실패했습니다. 잠시 후 다시 시도해 주세요.
              </p>
            </div>
            <Button type="button" onClick={() => void refetch()}>
              다시 시도
            </Button>
          </CardContent>
        </Card>
      ) : (
        <CurationDetailContent curation={curation} />
      )}
    </div>
  );
}

function CurationDetailContent({ curation }: { curation: CurationV2Detail }) {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-semibold">{curation.name}</h2>
                <Badge variant={curation.isActive ? 'default' : 'secondary'}>
                  {curation.isActive ? '활성' : '비활성'}
                </Badge>
              </div>
              {curation.description && (
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted-foreground">
                  {curation.description}
                </p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <DetailItem label="스펙" value={formatCurationSpecCode(curation.spec.code)} />
              <DetailItem label="노출 순서" value={String(curation.displayOrder)} />
              <DetailItem
                label="노출 기간"
                value={formatCurationExposurePeriod(
                  curation.exposureStartDate,
                  curation.exposureEndDate
                )}
              />
              <DetailItem label="생성일" value={formatCurationDateTime(curation.createdAt)} />
              <DetailItem label="수정일" value={formatCurationDateTime(curation.modifiedAt)} />
            </div>
          </CardContent>
        </Card>

        <CurationPayloadCard curation={curation} />
      </div>

      <aside className="space-y-6">
        <CurationImageCard curation={curation} />
        <CurationSpecCard curation={curation} />
      </aside>
    </div>
  );
}

function CurationImageCard({ curation }: { curation: CurationV2Detail }) {
  const imageUrls = curation.imageUrls.length > 0 ? curation.imageUrls : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>이미지</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {curation.coverImageUrl ? (
          <img
            src={curation.coverImageUrl}
            alt={`${curation.name} 대표 이미지`}
            className="aspect-video w-full rounded-lg border object-cover"
          />
        ) : (
          <div className="flex aspect-video w-full items-center justify-center rounded-lg border border-dashed bg-muted/30 text-sm text-muted-foreground">
            <ImageIcon className="mr-2 h-4 w-4" />
            대표 이미지 없음
          </div>
        )}

        {imageUrls.length > 1 && (
          <div className="grid grid-cols-3 gap-2">
            {imageUrls.map((imageUrl, index) => (
              <img
                key={`${imageUrl}-${index}`}
                src={imageUrl}
                alt={`${curation.name} 이미지 ${index + 1}`}
                className="aspect-square rounded-md border object-cover"
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CurationSpecCard({ curation }: { curation: CurationV2Detail }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>스펙 정보</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <DetailItem label="스펙 ID" value={String(curation.spec.id)} />
        <DetailItem label="스펙 코드" value={curation.spec.code} />
        <DetailItem label="버전" value={String(curation.spec.version)} />
        <DetailItem label="Hydrator" value={curation.spec.hydratorKey ?? '-'} />
        <DetailItem label="스펙 상태" value={curation.spec.isActive ? '활성' : '비활성'} />
      </CardContent>
    </Card>
  );
}

function CurationPayloadCard({ curation }: { curation: CurationV2Detail }) {
  const entries = getCurationPayloadEntries(curation.spec.requestSpec, curation.payload);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payload</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {entries.length === 0 ? (
          <div className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
            표시할 payload가 없습니다.
          </div>
        ) : (
          entries.map((entry) => (
            <PayloadEntry key={entry.key} label={entry.label} value={entry.value} />
          ))
        )}
      </CardContent>
    </Card>
  );
}

function PayloadEntry({ label, value }: { label: string; value: unknown }) {
  if (Array.isArray(value)) {
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">{label}</h3>
        {value.length === 0 ? (
          <p className="text-sm text-muted-foreground">-</p>
        ) : (
          <div className="space-y-2">
            {value.map((item, index) => (
              <div key={index} className="rounded-lg border bg-muted/20 p-3 text-sm">
                <PayloadObject value={item} />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (value && typeof value === 'object') {
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">{label}</h3>
        <div className="rounded-lg border bg-muted/20 p-3 text-sm">
          <PayloadObject value={value} />
        </div>
      </div>
    );
  }

  return <DetailItem label={label} value={formatPayloadValue(value)} />;
}

function PayloadObject({ value }: { value: unknown }) {
  if (!value || typeof value !== 'object') {
    return <span>{formatPayloadValue(value)}</span>;
  }

  return (
    <dl className="space-y-2">
      {Object.entries(value as Record<string, unknown>).map(([key, entryValue]) => (
        <div key={key} className="grid gap-1 sm:grid-cols-[8rem_minmax(0,1fr)]">
          <dt className="text-muted-foreground">{key}</dt>
          <dd className="min-w-0 break-words">
            {entryValue && typeof entryValue === 'object' ? (
              <PayloadObject value={entryValue} />
            ) : (
              formatPayloadValue(entryValue)
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="min-w-0 break-words text-sm font-medium">{value}</p>
    </div>
  );
}
