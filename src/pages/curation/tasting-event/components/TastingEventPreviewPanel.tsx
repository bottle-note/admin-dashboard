import { useFormContext, useWatch } from 'react-hook-form';
import { CalendarDays, MapPin, Star, Users } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import {
  createTastingEventPreviewModel,
  type TastingEventPreviewAlcoholItem,
  type TastingEventPreviewModel,
} from '../tasting-event.preview-model';
import type { TastingEventCreateFormState } from '../tasting-event.schema';

export function TastingEventPreviewPanel() {
  const form = useFormContext<TastingEventCreateFormState>();
  const watchedValues = useWatch({ control: form.control });
  const previewValues = {
    ...form.getValues(),
    ...watchedValues,
  } as TastingEventCreateFormState;
  const preview = createTastingEventPreviewModel(previewValues);

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>미리보기</CardTitle>
        <CardDescription>앱 노출 예시를 기준으로 작성 내용을 확인합니다.</CardDescription>
      </CardHeader>
      <CardContent>
        <TastingEventAppPreview preview={preview} />
      </CardContent>
    </Card>
  );
}

function TastingEventAppPreview({ preview }: { preview: TastingEventPreviewModel }) {
  const hasFloatingCta = preview.cta.type !== 'hidden';

  return (
    <div className="mx-auto flex h-[720px] max-h-[calc(100vh-8rem)] max-w-sm flex-col overflow-hidden rounded-[1.75rem] border bg-white shadow-sm">
      <div className="shrink-0 bg-muted/40 px-4 py-3 text-center text-xs font-medium text-muted-foreground">
        앱 노출 예시
      </div>

      <div className="relative min-h-0 flex-1 bg-white">
        <article
          className={`h-full overflow-y-auto overscroll-contain bg-white ${hasFloatingCta ? 'pb-24' : ''}`}
        >
          <PreviewHero preview={preview} />
          <PreviewInfoCard preview={preview} />
          <PreviewDescription description={preview.description} />
          <PreviewGallery imageUrls={preview.imageUrls} />
          <PreviewLineup alcohols={preview.alcohols} />
        </article>
        <PreviewCta preview={preview} />
      </div>
    </div>
  );
}

function PreviewHero({ preview }: { preview: TastingEventPreviewModel }) {
  return (
    <section className="relative h-60 w-full overflow-hidden bg-[#F7F7F7]">
      {preview.coverImageUrl ? (
        <img
          src={preview.coverImageUrl}
          alt="시음회 대표 이미지 미리보기"
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-sm font-medium text-[#666666]">
          대표 이미지
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/10 to-black/70" />
      <div className="absolute bottom-5 left-5 right-5 text-black">
        <span className="inline-flex rounded-full bg-white/70 px-2.5 py-1 text-[10px] font-bold leading-[14px] backdrop-blur-sm">
          시음회
        </span>
        <h1 className="mt-3 line-clamp-2 text-[20px] font-extrabold leading-6 text-white">
          {preview.title}
        </h1>
        <p className="mt-2 line-clamp-1 text-[10px] font-light leading-[14px] text-white">
          {preview.eventDateLabel} · {preview.placeLabel} · {preview.capacityLabel}
        </p>
      </div>
    </section>
  );
}

function PreviewInfoCard({ preview }: { preview: TastingEventPreviewModel }) {
  const infoItems = [
    {
      key: 'date',
      icon: <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />,
      title: preview.eventDateTimeLabel,
      description: preview.guideText,
    },
    {
      key: 'place',
      icon: <MapPin className="h-3.5 w-3.5" aria-hidden="true" />,
      title: preview.placeLabel,
      description: preview.fullAddress,
      actionHref: preview.mapSearchUrl,
    },
    {
      key: 'capacity',
      icon: <Users className="h-3.5 w-3.5" aria-hidden="true" />,
      title: preview.capacityLabel,
    },
  ];

  return (
    <section className="px-5 py-5">
      <div className="flex flex-col gap-2 rounded-2xl bg-[#E6E6DD] px-4 py-4">
        <span className="inline-flex w-fit rounded-full bg-[#EF9A6E] px-2.5 py-1 text-[8px] font-bold leading-none text-white">
          시음회 정보
        </span>

        <div className="mt-2 flex h-full flex-col gap-4">
          {infoItems.map(({ key, icon, title, description, actionHref }) => (
            <div key={key} className="flex gap-2.5">
              <span className="mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center text-[#252525]">
                {icon}
              </span>

              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex min-w-0 items-start gap-2">
                  <p className="min-w-0 flex-1 truncate text-[11px] font-bold leading-[15px] text-[#252525]">
                    {title}
                  </p>
                  {actionHref && (
                    <a
                      href={actionHref}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[10px] font-bold leading-[14px] text-[#252525]"
                    >
                      지도 보기
                    </a>
                  )}
                </div>
                {description && (
                  <p className="truncate text-[10px] font-light leading-[14px] text-[#666666]">
                    {description}
                  </p>
                )}
              </div>
            </div>
          ))}

          <div className="mt-auto flex items-end gap-2">
            <span className="text-[10px] font-bold leading-none text-[#252525]">참가비</span>
            <span className="text-[20px] font-black leading-none text-[#252525]">
              {preview.entryFeeLabel}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function PreviewDescription({ description }: { description: string }) {
  return (
    <section className="px-5">
      <p className="whitespace-pre-line text-[13px] font-medium leading-[17px] text-[#252525]">
        {description}
      </p>
    </section>
  );
}

function PreviewGallery({ imageUrls }: { imageUrls: string[] }) {
  if (!imageUrls.length) {
    return null;
  }

  return (
    <section className="mt-5 flex w-full snap-x overflow-x-auto bg-[#F7F7F7]">
      {imageUrls.map((imageUrl) => (
        <img
          key={imageUrl}
          src={imageUrl}
          alt="시음회 추가 이미지 미리보기"
          className="h-60 w-full shrink-0 snap-start object-cover"
        />
      ))}
    </section>
  );
}

function PreviewLineup({ alcohols }: { alcohols: TastingEventPreviewAlcoholItem[] }) {
  return (
    <section className="px-5 py-6">
      <h2 className="text-[16px] font-extrabold leading-5 text-[#252525]">시음회 라인업</h2>

      {alcohols.length > 0 ? (
        <div className="mt-4 divide-y divide-[#E6E6DD] border-t border-[#E6E6DD]">
          {alcohols.map((item, index) => (
            <PreviewLineupItem key={item.id} item={item} order={index + 1} />
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-[#BFBFBF] py-8 text-center text-[13px] font-medium leading-[17px] text-[#666666]">
          시음 위스키가 여기에 표시됩니다.
        </div>
      )}
    </section>
  );
}

function PreviewLineupItem({
  item,
  order,
}: {
  item: TastingEventPreviewAlcoholItem;
  order: number;
}) {
  const { alcohol, stats, comment } = item;
  const details = [alcohol.abv && `도수 ${alcohol.abv}`, alcohol.korCategory].filter(Boolean);
  const chips = [
    ...alcohol.selectedTags,
    alcohol.korCategory,
    alcohol.regionName,
    alcohol.volume,
    alcohol.cask,
  ].filter((chip): chip is string => Boolean(chip));

  return (
    <article className="relative py-6">
      <div className="absolute left-0 top-6 flex h-5 w-5 items-center justify-center rounded-full bg-[#252525] text-[10px] font-bold leading-[14px] text-white">
        {order}
      </div>

      <div className="flex w-full overflow-hidden pl-8 text-[#101010]">
        <div className="flex min-w-0 flex-1 gap-3">
          <div className="flex h-32 w-[95px] shrink-0 items-center justify-center p-2">
            {alcohol.imageUrl ? (
              <img
                src={alcohol.imageUrl}
                alt={alcohol.korName}
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-lg bg-[#F7F7F7] text-[11px] font-medium leading-[15px] text-[#666666]">
                No
              </div>
            )}
          </div>

          <div className="flex min-w-0 flex-1 flex-col items-start justify-center space-y-2">
            <div className="min-w-0 space-y-2">
              <h3 className="line-clamp-2 text-[15px] font-bold leading-[1.3] text-[#252525]">
                {alcohol.korName}
              </h3>
              {alcohol.engName && (
                <p className="line-clamp-1 text-[13px] leading-[17px] text-[#252525]">
                  {alcohol.engName.toUpperCase()}
                </p>
              )}
              {details.length > 0 && (
                <p className="text-[13px] leading-[17px] text-[#252525]">
                  {details.join(' · ')}
                </p>
              )}
            </div>

            {typeof stats?.rating === 'number' && (
              <div className="flex items-center gap-1 text-[#666666]">
                <span className="text-[12px] font-medium leading-4">유저평균</span>
                <div className="flex items-center gap-px text-[12px] font-semibold leading-4 text-[#666666]">
                  <Star className="h-3 w-3 fill-current" aria-hidden="true" />
                  <span>{stats.rating.toFixed(1)}</span>
                  <span className="ml-0.5 text-[11px] font-medium leading-[15px]">
                    ({stats.totalRatingsCount ?? 0})
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {chips.length > 0 && (
        <div className="mt-5 flex w-full flex-wrap gap-1.5">
          {chips.map((chip) => (
            <span
              key={chip}
              className="rounded-full border border-[#666666] px-2 py-1 text-[11px] font-medium leading-[15px] text-[#666666]"
            >
              {chip}
            </span>
          ))}
        </div>
      )}

      {comment && (
        <p className="mt-5 whitespace-pre-line text-[13px] font-medium leading-[1.8] text-[#666666]">
          {comment}
        </p>
      )}
    </article>
  );
}

function PreviewCta({ preview }: { preview: TastingEventPreviewModel }) {
  if (preview.cta.type === 'hidden') {
    return null;
  }

  return (
    <section className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-white via-white to-white/0 px-5 pb-5 pt-8">
      {preview.cta.type === 'apply' ? (
        <a
          href={preview.cta.href}
          target="_blank"
          rel="noreferrer"
          className="pointer-events-auto flex h-[52px] w-full items-center justify-center rounded-xl bg-[#E58257] shadow-[0_8px_20px_rgba(16,16,16,0.18)]"
        >
          <span className="text-[15px] font-bold leading-[19px] text-white">
            {preview.cta.label}
          </span>
        </a>
      ) : (
        <button
          type="button"
          disabled
          className="pointer-events-auto flex h-[52px] w-full cursor-not-allowed items-center justify-center rounded-xl bg-[#BFBFBF] shadow-[0_8px_20px_rgba(16,16,16,0.12)]"
        >
          <span className="text-[15px] font-bold leading-[19px] text-white">
            {preview.cta.label}
          </span>
        </button>
      )}
    </section>
  );
}
