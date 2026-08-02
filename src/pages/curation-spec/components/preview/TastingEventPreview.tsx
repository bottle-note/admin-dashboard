import { cn } from '@/lib/utils';

import type { WhiskyTastingEventFormValues } from '../../curation-spec.schema';
import { CurationPreviewWhiskyCard } from './CurationPreviewWhiskyCard';
import { tastingEventPreviewThemeStyle } from './previewTheme';

export type TastingEventPreviewValues = Pick<
  WhiskyTastingEventFormValues,
  | 'name'
  | 'description'
  | 'imageUrls'
  | 'capacity'
  | 'entryFee'
  | 'is_tbc'
  | 'eventDate'
  | 'eventTime'
  | 'guideText'
  | 'placeName'
  | 'barAddress'
  | 'detailAddress'
  | 'isRecruiting'
  | 'applicationLink'
  | 'alcohols'
>;

type TastingEventPreviewAlcoholItem = TastingEventPreviewValues['alcohols'][number];

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
    <path
      d="M7 2v3M17 2v3M4 9h16M6 5h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    />
  </svg>
);

const PinIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
    <path
      d="M12 21s7-5.4 7-12a7 7 0 1 0-14 0c0 6.6 7 12 7 12Z"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    />
    <circle cx="12" cy="9" r="2.5" fill="none" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const UsersIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
    <path
      d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M9.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    />
  </svg>
);

interface TastingEventPreviewProps {
  values: TastingEventPreviewValues;
  today?: Date;
  className?: string;
}

export function TastingEventPreview({ values, today, className }: TastingEventPreviewProps) {
  const coverImageUrl = values.imageUrls[0];
  const galleryImageUrls = values.imageUrls.filter((imageUrl) => imageUrl !== coverImageUrl);
  const eventDateLabel = formatEventDate(values.eventDate);
  const eventTimeLabel = formatEventTime(values.eventTime);
  const capacityLabel = formatCapacity(values.capacity);

  return (
    <article className={cn('w-full bg-white', className)} style={tastingEventPreviewThemeStyle}>
      <TastingEventPreviewHero
        values={values}
        coverImageUrl={coverImageUrl}
        eventDateLabel={eventDateLabel}
        capacityLabel={capacityLabel}
      />
      <TastingEventPreviewInfoCard
        values={values}
        eventDateTimeLabel={`${eventDateLabel} · ${eventTimeLabel}`}
        capacityLabel={capacityLabel}
      />
      <TastingEventPreviewDescription description={values.description} />
      <TastingEventPreviewGallery imageUrls={galleryImageUrls} />
      <TastingEventPreviewLineup alcohols={values.alcohols} />
      <TastingEventPreviewCta values={values} today={today} />
    </article>
  );
}

function TastingEventPreviewHero({
  values,
  coverImageUrl,
  eventDateLabel,
  capacityLabel,
}: {
  values: TastingEventPreviewValues;
  coverImageUrl?: string;
  eventDateLabel: string;
  capacityLabel: string;
}) {
  return (
    <section className="relative h-60 w-full overflow-hidden bg-[var(--preview-section-white)]">
      {coverImageUrl ? (
        <img src={coverImageUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-sm text-[var(--preview-main-gray)]">
          대표 이미지
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/10 to-black/70" />
      <div className="absolute bottom-5 left-5 right-5">
        <span className="inline-flex rounded-full bg-white/70 px-2.5 py-1 text-[10px] font-bold text-[var(--preview-main-black)] backdrop-blur-sm">
          시음회
        </span>
        <h1 className="mt-3 line-clamp-2 text-[20px] font-extrabold text-white">{values.name}</h1>
        <p className="mt-2 line-clamp-1 text-[10px] font-light text-white">
          {eventDateLabel} · {values.placeName || values.barAddress} · {capacityLabel}
        </p>
      </div>
    </section>
  );
}

function TastingEventPreviewInfoCard({
  values,
  eventDateTimeLabel,
  capacityLabel,
}: {
  values: TastingEventPreviewValues;
  eventDateTimeLabel: string;
  capacityLabel: string;
}) {
  const fullAddress = [values.barAddress, values.detailAddress].filter(Boolean).join(' ');
  const infoItems = [
    {
      key: 'date',
      Icon: CalendarIcon,
      title: eventDateTimeLabel,
      description: values.guideText,
    },
    {
      key: 'place',
      Icon: PinIcon,
      title: values.barAddress,
      description: values.detailAddress,
      actionHref: fullAddress
        ? `https://map.naver.com/p/search/${encodeURIComponent(fullAddress)}`
        : '',
    },
    {
      key: 'capacity',
      Icon: UsersIcon,
      title: capacityLabel,
    },
  ];

  return (
    <section className="px-5 py-5">
      <div className="flex flex-col gap-2 rounded-2xl bg-[var(--preview-bg-gray)] px-4 py-4">
        <span className="inline-flex w-fit rounded-full bg-[var(--preview-main-coral)] px-2.5 py-1 text-[12px] font-bold text-white">
          정보
        </span>

        <div className="mt-2 flex h-full flex-col gap-4">
          {infoItems.map(({ key, Icon, title, description, actionHref }) => (
            <div key={key} className="flex gap-2.5">
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center text-[var(--preview-main-dark-gray)]">
                <Icon />
              </span>

              <div className="flex w-full min-w-0 flex-col gap-1">
                <div className="flex w-full min-w-0 items-start justify-between gap-2">
                  <p className="min-w-0 flex-1 truncate text-[13px] font-bold text-[var(--preview-main-dark-gray)]">
                    {title}
                  </p>
                  {actionHref && (
                    <a
                      href={actionHref}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 rounded-md bg-white px-3 py-1 text-[12px] font-bold leading-tight text-[var(--preview-main-dark-gray)]"
                    >
                      지도보기
                    </a>
                  )}
                </div>
                {description && (
                  <p className="truncate text-[12px] font-light text-[var(--preview-main-gray)]">
                    {description}
                  </p>
                )}
              </div>
            </div>
          ))}

          <div className="mt-auto flex items-end gap-2">
            <span className="text-[10px] font-semibold leading-none text-[var(--preview-main-dark-gray)]">
              참가비
            </span>
            <span className="text-[19px] font-bold leading-none text-[var(--preview-main-dark-gray)]">
              {formatEntryFee(values.entryFee, values.is_tbc)}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function TastingEventPreviewDescription({ description }: { description: string }) {
  return (
    <section className="px-5">
      <p className="whitespace-pre-line text-[13px] font-medium text-[var(--preview-main-dark-gray)]">
        {description}
      </p>
    </section>
  );
}

function TastingEventPreviewGallery({ imageUrls }: { imageUrls: string[] }) {
  if (!imageUrls.length) {
    return null;
  }

  return (
    <section className="relative mt-5 w-full bg-[var(--preview-section-white)]">
      <div className="flex w-full snap-x overflow-x-auto">
        {imageUrls.map((imageUrl, index) => (
          <img
            key={`${imageUrl}-${index}`}
            src={imageUrl}
            alt=""
            className="h-60 w-full shrink-0 snap-start object-cover"
          />
        ))}
      </div>
      {imageUrls.length > 1 && (
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
          {imageUrls.map((imageUrl, index) => (
            <span
              key={`${imageUrl}-${index}`}
              className={cn('h-1.5 w-1.5 rounded-full', index === 0 ? 'bg-white' : 'bg-white/50')}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function TastingEventPreviewLineup({ alcohols }: { alcohols: TastingEventPreviewAlcoholItem[] }) {
  if (!alcohols.length) {
    return null;
  }

  return (
    <section className="px-5 py-6">
      <h2 className="text-[16px] font-extrabold text-[var(--preview-main-dark-gray)]">
        시음회 라인업
      </h2>
      <div className="mt-4 divide-y divide-[var(--preview-bg-gray)] border-t border-[var(--preview-bg-gray)]">
        {alcohols.map((item, index) => (
          <TastingEventPreviewLineupItem
            key={item.alcohol.alcoholId ?? `${item.source}-${item.alcohol.korName}-${index}`}
            item={item}
            order={index + 1}
          />
        ))}
      </div>
    </section>
  );
}

function TastingEventPreviewLineupItem({
  item,
  order,
}: {
  item: TastingEventPreviewAlcoholItem;
  order: number;
}) {
  return <CurationPreviewWhiskyCard {...item} order={order} />;
}

function TastingEventPreviewCta({
  values,
  today = new Date(),
}: {
  values: TastingEventPreviewValues;
  today?: Date;
}) {
  const applicationLink = values.applicationLink?.trim() ?? '';

  if (!applicationLink) {
    return null;
  }

  const isApplicationOpen = values.isRecruiting && !isBeforeDate(values.eventDate, today);

  return (
    <section className="sticky bottom-0 px-5 pb-8 pt-2">
      {isApplicationOpen ? (
        <a
          href={applicationLink}
          target="_blank"
          rel="noreferrer"
          className="flex h-[52px] w-full items-center justify-center rounded-xl bg-[var(--preview-sub-coral)]"
        >
          <span className="text-[15px] font-bold text-white">시음회 신청하기</span>
        </a>
      ) : (
        <button
          type="button"
          disabled
          className="flex h-[52px] w-full cursor-not-allowed items-center justify-center rounded-xl bg-[var(--preview-bright-gray)]"
        >
          <span className="text-[15px] font-bold text-white">모집 마감</span>
        </button>
      )}
    </section>
  );
}

function formatEventDate(value: string): string {
  const eventDate = new Date(value);

  if (Number.isNaN(eventDate.getTime())) return value;

  return `${eventDate.getMonth() + 1}월 ${eventDate.getDate()}일 (${WEEKDAYS[eventDate.getDay()]})`;
}

function formatEventTime(value: string): string {
  const [hour, minute] = value.split(':');
  return hour && minute ? `${hour}:${minute}` : value;
}

function formatCapacity(value: number): string {
  return value === 0 ? '모집 인원 미정' : `${value.toLocaleString('ko-KR')}명 정원`;
}

function formatEntryFee(value: number, isTbc?: boolean): string {
  if (isTbc) return '가격 미정';
  return value > 0 ? `${value.toLocaleString('ko-KR')}원` : '무료';
}

function isBeforeDate(value: string, today: Date): boolean {
  const eventDate = toDateOnlyTime(value);
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

  return eventDate !== null && eventDate < todayDate;
}

function toDateOnlyTime(value: string): number | null {
  const [datePart = ''] = value.split('T');
  const [year, month, date] = datePart.split('-').map(Number);

  if (year && month && date) {
    return new Date(year, month - 1, date).getTime();
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return null;

  return new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate()).getTime();
}
