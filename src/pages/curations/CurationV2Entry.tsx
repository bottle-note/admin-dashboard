import { useState } from 'react';
import { Link } from 'react-router';
import { ArrowRight, CalendarDays, Eye, Layers, Utensils } from 'lucide-react';

import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const CURATION_TYPES = [
  {
    key: 'tasting-event',
    label: '시음회',
    description: '일시, 장소, 모집 정보와 시음 위스키 라인업을 작성합니다.',
    href: '/dashboard/curations/tasting-events/new',
    icon: CalendarDays,
    summary: ['날짜', '장소', '참가비', '정원', '시음 위스키'],
  },
  {
    key: 'general',
    label: '일반 큐레이션',
    description: '위스키 카드와 큐레이터 코멘트를 작성합니다.',
    href: '/dashboard/curations/general/new',
    icon: Layers,
    summary: ['위스키 카드', '태그', '코멘트', '노출 이미지'],
  },
  {
    key: 'pairing',
    label: '페어링',
    description: '위스키와 어울리는 음식/아이템 페어링을 작성합니다.',
    href: '/dashboard/curations/pairings/new',
    icon: Utensils,
    summary: ['위스키', '페어링 음식', '이미지', '설명'],
  },
] as const;

export function CurationV2EntryPage() {
  const [selectedPreview, setSelectedPreview] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="큐레이션"
        description="운영 목적에 맞는 큐레이션 유형을 선택해 작성합니다."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="space-y-4 lg:col-span-2" aria-label="큐레이션 유형 선택">
          {CURATION_TYPES.map((type) => {
            const Icon = type.icon;

            return (
              <Card key={type.key} className="shadow-none">
                <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border bg-muted/40">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="text-base font-semibold">{type.label}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{type.description}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {type.summary.map((item) => (
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
                      onClick={() => setSelectedPreview(type.label)}
                    >
                      <Eye className="h-4 w-4" />
                      미리보기
                    </Button>
                    <Button asChild>
                      <Link to={type.href}>
                        작성하기
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
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
