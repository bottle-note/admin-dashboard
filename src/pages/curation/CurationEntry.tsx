import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  AlertCircle,
  CalendarDays,
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
import { cn } from '@/lib/utils';
import {
  CurationSpecCode,
  type CurationV2SpecListItem,
  type KnownCurationV2SpecCode,
} from '@/types/api';

import {
  CurationPreviewFrame,
  TastingEventPreview,
  WhiskyCardCurationPreview,
  type TastingEventPreviewData,
  type WhiskyCardCurationPreviewData,
} from './_preview';

interface CurationSpecUiConfig {
  href: string;
  icon: LucideIcon;
  order: number;
  label: string;
  description: string;
  useCases: string[];
  example: string;
  fields: string[];
  headerClassName: string;
  previewButtonClassName: string;
}

const CURATION_SPEC_UI_CONFIG: Record<KnownCurationV2SpecCode, CurationSpecUiConfig> = {
  WHISKY_TASTING_EVENT: {
    href: '/dashboard/curations/tasting-events/new',
    icon: CalendarDays,
    order: 1,
    label: '시음회',
    description: '특정 바에서 특정 기간 동안 위스키를 시음하는 모집을 만듭니다.',
    useCases: ['오프라인 시음회 모집', '위스키 위주의 유료 행사', '바와 협업한 시음 이벤트'],
    example: '도시남 X 보틀노트 시음회 — 성수 오가닉바 · 5/15 19:30',
    fields: [
      '이름',
      '설명',
      '커버',
      '시음 기간',
      '장소(바)',
      '참가비',
      '정원',
      '위스키 목록',
      '참가 링크',
    ],
    headerClassName: 'bg-[#d87955]',
    previewButtonClassName: 'bg-white/20 text-white hover:bg-white/30',
  },
  RECOMMENDED_WHISKY: {
    href: '/dashboard/curations/general/new',
    icon: Layers,
    order: 2,
    label: '일반 큐레이션',
    description: '위스키 리스트만 노출하는 가장 단순한 큐레이션입니다.',
    useCases: ['에디터 픽 / 입문자 추천', '계절별 추천', '주제별 위스키 모음'],
    example: '입문자를 위한 스카치 베스트 6',
    fields: ['이름', '설명', '커버', '위스키 목록'],
    headerClassName: 'bg-[#d9a782]',
    previewButtonClassName: 'bg-white/25 text-white hover:bg-white/35',
  },
  WHISKY_PAIRING: {
    href: '/dashboard/curations/pairings/new',
    icon: Utensils,
    order: 3,
    label: '페어링 · 위스키 → 음식',
    description: '한 위스키를 기준으로 어울리는 음식들을 추천합니다.',
    useCases: [
      '위스키 상세에서 어울리는 안주 추천',
      '브랜드 협업 페어링',
      '한 병의 다양한 즐기는 법',
    ],
    example: '라가불린 16년 — 다크초콜릿·훈제연어·블루치즈',
    fields: ['이름', '설명', '커버', '기준 위스키 1종', '추천 음식 N개(자유 입력)'],
    headerClassName: 'bg-[#687c53]',
    previewButtonClassName: 'bg-white/20 text-white hover:bg-white/30',
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
  const navigate = useNavigate();
  const [selectedPreviewCode, setSelectedPreviewCode] = useState<KnownCurationV2SpecCode>(
    CurationSpecCode.WHISKY_TASTING_EVENT
  );
  const { showToast } = useToast();
  const { data: specs = [], isError, isLoading, refetch } = useCurationSpecs();

  const activeSpecs = specs.filter((spec) => spec.isActive).sort(compareCurationSpecs);
  const selectedPreviewConfig = CURATION_SPEC_UI_CONFIG[selectedPreviewCode];

  return (
    <div className="space-y-6">
      <PageHeader
        title="어떤 큐레이션을 만드시겠어요?"
        description="템플릿마다 입력 항목과 모바일 노출 방식이 달라집니다. 시작 후엔 템플릿을 변경할 수 없으니 신중히 선택해주세요."
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
              const label = config?.label ?? spec.name;
              const description =
                config?.description ?? spec.description ?? '스펙 기반 큐레이션을 작성합니다.';
              const useCases = config?.useCases ?? ['스펙 기반 큐레이션 작성'];
              const example = config?.example ?? spec.name;
              const fields = config?.fields ?? ['이름', '설명', '커버', 'payload'];
              const handleStart = () => {
                if (config) {
                  navigate(config.href);
                  return;
                }

                showToast({
                  type: 'info',
                  message: '준비중입니다',
                });
              };

              return (
                <Card
                  key={spec.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`${label} 작성하기`}
                  className="cursor-pointer overflow-hidden shadow-none transition-colors hover:bg-muted/20 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  onClick={handleStart}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      handleStart();
                    }
                  }}
                >
                  <div
                    className={cn(
                      'flex min-h-16 items-center justify-between gap-4 px-5 py-4 text-white',
                      config?.headerClassName ?? 'bg-slate-600'
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <h2 className="truncate text-base font-bold">{label}</h2>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      className={cn(
                        'h-10 shrink-0 rounded-lg border-0 px-6 font-semibold shadow-none',
                        config?.previewButtonClassName ?? 'bg-white/20 text-white hover:bg-white/30'
                      )}
                      onClick={(event) => {
                        event.stopPropagation();
                        if (config) {
                          setSelectedPreviewCode(spec.code as KnownCurationV2SpecCode);
                        }
                      }}
                    >
                      미리보기
                    </Button>
                  </div>

                  <CardContent className="space-y-5 p-5">
                    <p className="text-sm leading-6 text-foreground">{description}</p>

                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">이럴 때 사용</p>
                      <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                        {useCases.map((item) => (
                          <li key={item} className="flex gap-2">
                            <span aria-hidden="true">·</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">예시</p>
                      <p className="mt-2 text-sm font-medium leading-6 text-muted-foreground">
                        {example}
                      </p>
                    </div>

                    <div className="border-t pt-4">
                      <p className="text-xs font-semibold text-muted-foreground">입력 항목</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {fields.map((item) => (
                          <span
                            key={item}
                            className="inline-flex rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
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
            <CardDescription>선택한 유형의 앱 노출 예시입니다.</CardDescription>
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {selectedPreviewConfig.label} 미리보기 선택됨
            </p>
          </CardHeader>
          <CardContent>
            <CurationEntryPreview specCode={selectedPreviewCode} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CurationEntryPreview({ specCode }: { specCode: KnownCurationV2SpecCode }) {
  const config = CURATION_SPEC_UI_CONFIG[specCode];

  return (
    <CurationPreviewFrame title={config.label}>
      {specCode === CurationSpecCode.WHISKY_TASTING_EVENT ? (
        <TastingEventPreview event={TASTING_EVENT_PREVIEW_SAMPLE} />
      ) : (
        <WhiskyCardCurationPreview
          curation={
            specCode === CurationSpecCode.WHISKY_PAIRING
              ? WHISKY_PAIRING_PREVIEW_SAMPLE
              : GENERAL_CURATION_PREVIEW_SAMPLE
          }
          pairingTitle="추천 페어링"
        />
      )}
    </CurationPreviewFrame>
  );
}

const SAMPLE_WHISKY = {
  alcoholId: 10,
  korName: '글렌피딕 12년',
  engName: 'Glenfiddich 12',
  imageUrl:
    'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?auto=format&fit=crop&w=500&q=80',
  abv: '40',
  regionName: '스코틀랜드',
  korCategory: '싱글몰트',
  selectedTags: ['바닐라', '꿀', '과일'],
};

const TASTING_EVENT_PREVIEW_SAMPLE: TastingEventPreviewData = {
  name: '도시남 X 보틀노트 시음회',
  description: '성수의 작은 바에서 입문자도 편하게 즐길 수 있는 싱글몰트 라인업을 소개합니다.',
  coverImageUrl:
    'https://images.unsplash.com/photo-1527281400683-1aae777175f8?auto=format&fit=crop&w=800&q=80',
  imageUrls: [
    'https://images.unsplash.com/photo-1527281400683-1aae777175f8?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80',
  ],
  payload: {
    capacity: 12,
    entryFee: 35000,
    eventDate: '2026-07-18',
    eventTime: '19:30',
    guideText: '시음 시작 10분 전까지 도착해주세요.',
    placeName: '성수 오가닉바',
    barAddress: '서울 성동구 연무장길 1',
    detailAddress: '2층',
    isRecruiting: true,
    applicationLink: 'https://bottle-note.example.com',
    alcohols: [
      {
        source: 'BOTTLE_NOTE',
        alcohol: SAMPLE_WHISKY,
        stats: { rating: 4.2, totalRatingsCount: 128 },
        comment: '부드러운 바닐라와 꿀 향이 선명해 첫 잔으로 좋습니다.',
      },
    ],
  },
};

const GENERAL_CURATION_PREVIEW_SAMPLE: WhiskyCardCurationPreviewData = {
  specName: '일반 큐레이션',
  name: '입문자를 위한 스카치 베스트 6',
  description: '처음 위스키를 시작하는 사용자에게 권하기 좋은 부드러운 스카치 위스키입니다.',
  imageUrls: [
    'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1606765962248-7ff407b51667?auto=format&fit=crop&w=800&q=80',
  ],
  alcohol: SAMPLE_WHISKY,
  stats: { rating: 4.2, totalRatingsCount: 128, reviewCount: 42, totalPickCount: 210 },
  comment: '밸런스가 좋아 니트와 하이볼 모두 부담 없이 즐길 수 있습니다.',
};

const WHISKY_PAIRING_PREVIEW_SAMPLE: WhiskyCardCurationPreviewData = {
  specName: '페어링 · 위스키 → 음식',
  name: '글렌피딕 12년과 어울리는 디저트',
  description: '부드러운 과일 향과 꿀 향을 살려주는 달콤한 페어링을 추천합니다.',
  imageUrls: [
    'https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=800&q=80',
  ],
  alcohol: SAMPLE_WHISKY,
  stats: { rating: 4.2, totalRatingsCount: 128, reviewCount: 42, totalPickCount: 210 },
  comment: '가벼운 단맛과 산미가 살아 있는 디저트와 잘 어울립니다.',
  pairings: [
    {
      itemName: '바닐라 아이스크림',
      pairingNote: '바닐라와 꿀 향을 더 부드럽게 이어줍니다.',
      itemImageUrl:
        'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=500&q=80',
    },
    {
      itemName: '다크초콜릿',
      pairingNote: '은은한 쌉싸름함이 과일 향을 또렷하게 만듭니다.',
      itemImageUrl:
        'https://images.unsplash.com/photo-1606312619070-d48b4c652a52?auto=format&fit=crop&w=500&q=80',
    },
  ],
};
