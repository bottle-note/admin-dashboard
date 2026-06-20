import { useState } from 'react';
import { Link } from 'react-router';
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  Eye,
  Layers,
  Loader2,
  Utensils,
  type LucideIcon,
} from 'lucide-react';

import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCurationSpecs } from '@/hooks/useCurations';
import { useToast } from '@/hooks/useToast';
import type { CurationV2SpecListItem, KnownCurationV2SpecCode } from '@/types/api';

interface CurationSpecUiConfig {
  href: string;
  icon: LucideIcon;
  order: number;
  fallbackDescription: string;
  summary: string[];
}

const CURATION_SPEC_UI_CONFIG: Record<KnownCurationV2SpecCode, CurationSpecUiConfig> = {
  WHISKY_TASTING_EVENT: {
    href: '/dashboard/curations/tasting-events/new',
    icon: CalendarDays,
    order: 1,
    fallbackDescription: '일시, 장소, 모집 정보와 시음 위스키 라인업을 작성합니다.',
    summary: ['날짜', '장소', '참가비', '정원', '시음 위스키'],
  },
  RECOMMENDED_WHISKY: {
    href: '/dashboard/curations/general/new',
    icon: Layers,
    order: 2,
    fallbackDescription: '위스키 카드와 큐레이터 코멘트를 작성합니다.',
    summary: ['위스키 카드', '태그', '코멘트', '노출 이미지'],
  },
  WHISKY_PAIRING: {
    href: '/dashboard/curations/pairings/new',
    icon: Utensils,
    order: 3,
    fallbackDescription: '위스키와 어울리는 음식/아이템 페어링을 작성합니다.',
    summary: ['위스키', '페어링 음식', '이미지', '설명'],
  },
};

function getCurationSpecUiConfig(spec: CurationV2SpecListItem) {
  return CURATION_SPEC_UI_CONFIG[spec.code as KnownCurationV2SpecCode];
}

function compareCurationSpecs(a: CurationV2SpecListItem, b: CurationV2SpecListItem) {
  const aConfig = getCurationSpecUiConfig(a);
  const bConfig = getCurationSpecUiConfig(b);
  const aOrder = aConfig?.order ?? Number.MAX_SAFE_INTEGER;
  const bOrder = bConfig?.order ?? Number.MAX_SAFE_INTEGER;

  return aOrder - bOrder || a.id - b.id;
}

export function CurationEntryPage() {
  const [selectedPreview, setSelectedPreview] = useState<string | null>(null);
  const { showToast } = useToast();
  const { data: specs = [], isError, isLoading, refetch } = useCurationSpecs();

  const activeSpecs = specs.filter((spec) => spec.isActive).sort(compareCurationSpecs);

  return (
    <div className="space-y-6">
      <PageHeader
        title="큐레이션"
        description="운영 목적에 맞는 큐레이션 유형을 선택해 작성합니다."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="space-y-4 lg:col-span-2" aria-label="큐레이션 유형 선택">
          {isLoading ? (
            <Card className="shadow-none">
              <CardContent className="flex items-center gap-3 p-5 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                큐레이션 스펙을 불러오는 중입니다.
              </CardContent>
            </Card>
          ) : isError ? (
            <Card className="shadow-none">
              <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 text-destructive" aria-hidden="true" />
                  <div>
                    <h2 className="text-base font-semibold">
                      큐레이션 스펙을 불러오지 못했습니다.
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      잠시 후 다시 시도하거나 관리자에게 문의해 주세요.
                    </p>
                  </div>
                </div>
                <Button type="button" variant="outline" onClick={() => void refetch()}>
                  다시 불러오기
                </Button>
              </CardContent>
            </Card>
          ) : activeSpecs.length === 0 ? (
            <Card className="shadow-none">
              <CardContent className="p-5">
                <h2 className="text-base font-semibold">생성 가능한 큐레이션 스펙이 없습니다.</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  활성화된 큐레이션 스펙이 등록되면 이 영역에 표시됩니다.
                </p>
              </CardContent>
            </Card>
          ) : (
            activeSpecs.map((spec) => {
              const config = getCurationSpecUiConfig(spec);
              const Icon = config?.icon ?? Layers;
              const label = spec.name;
              const description =
                spec.description ??
                config?.fallbackDescription ??
                '스펙 기반 큐레이션을 작성합니다.';
              const summary = config?.summary ?? ['스펙 기반', 'payload', '이미지', '노출 설정'];

              return (
                <Card key={spec.id} className="shadow-none">
                  <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border bg-muted/40">
                      <Icon className="h-6 w-6" aria-hidden="true" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h2 className="text-base font-semibold">{label}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {summary.map((item) => (
                          <span
                            key={item}
                            className="inline-flex rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex shrink-0 gap-2 sm:justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setSelectedPreview(label)}
                      >
                        <Eye className="h-4 w-4" />
                        미리보기
                      </Button>
                      {config ? (
                        <Button asChild>
                          <Link to={config.href}>
                            작성하기
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          onClick={() =>
                            showToast({
                              type: 'info',
                              message: '준비중입니다',
                            })
                          }
                        >
                          작성하기
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </section>

        <Card className="shadow-none lg:sticky lg:top-20 lg:col-span-1">
          <CardHeader>
            <CardTitle>
              <h2 className="text-base">미리보기</h2>
            </CardTitle>
            <CardDescription>선택한 유형의 미리보기 이미지가 표시될 영역입니다.</CardDescription>
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {selectedPreview ? `${selectedPreview} 미리보기 선택됨` : '선택된 유형 없음'}
            </p>
          </CardHeader>
          <CardContent>
            <div
              className="min-h-96 rounded-lg border border-dashed bg-muted/20"
              aria-label="비어 있는 미리보기 공간"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
