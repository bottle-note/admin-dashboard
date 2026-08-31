import {
  Building2,
  Calendar,
  CalendarClock,
  ChevronRight,
  ExternalLink,
  Link as LinkIcon,
  MapPin,
  UserRound,
  Users,
} from 'lucide-react';

import type { ProgramFormValues } from '../curation-spec.schema';
import { CurationPreviewWhiskyCard } from '../components/preview/CurationPreviewWhiskyCard';
import { tastingEventPreviewThemeStyle } from '../components/preview/previewTheme';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

const PROGRAM_TYPE_LABELS = {
  MASTER_CLASS: '마스터 클래스',
  TASTING: '테이스팅',
  SEMINAR: '세미나',
  BOOTH_EVENT: '부스 이벤트',
  OTHER: '기타',
};

const PROGRAM_TAG_LABELS: Record<string, string> = {
  WHISKY: '위스키',
  TRADITIONAL_LIQUOR: '전통주',
  WINE: '와인',
  COCKTAIL: '칵테일',
  BEER: '맥주',
  OTHER_SPIRITS: '기타 주류',
};

type ProgramItem = ProgramFormValues['programs'][number];

export function ProgramPreview({ values }: { values: ProgramFormValues }) {
  const coverImageUrl = values.imageUrls[0];
  const galleryImageUrls = values.imageUrls.filter((imageUrl) => imageUrl !== coverImageUrl);
  const dateLabel = formatProgramDateRange(values.eventStartDate, values.eventEndDate);
  const entryFeeLabel = formatProgramFee(values.entryFee, values.is_tbc);
  const officialUrl = values.officialUrl?.trim();
  const registrationUrl = values.registrationUrl?.trim();
  const tagLabels = (values.programTags ?? []).map((tag) => PROGRAM_TAG_LABELS[tag] ?? tag);

  return (
    <article
      className="w-full bg-white text-[var(--preview-main-dark-gray)]"
      style={tastingEventPreviewThemeStyle}
    >
      <section className="relative h-60 w-full overflow-hidden bg-[var(--preview-section-white)]">
        {coverImageUrl ? (
          <img src={coverImageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-[var(--preview-main-gray)]">
            대표 이미지
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/75" />
        <div className="absolute bottom-5 left-5 right-5 text-white">
          <span className="inline-flex rounded-full bg-white/70 px-2.5 py-1 text-[10px] font-bold text-[var(--preview-main-black)] backdrop-blur-sm">
            프로그램
          </span>
          <h1 className="mt-3 line-clamp-2 text-[20px] font-extrabold">{values.name}</h1>
          <p className="mt-2 line-clamp-1 text-[13px] font-light">
            {[dateLabel, values.placeName, entryFeeLabel].filter(Boolean).join(' · ')}
          </p>
        </div>
      </section>

      <ProgramEventInfoCard values={values} entryFeeLabel={entryFeeLabel} />

      <section className="px-5">
        <p className="whitespace-pre-line text-[13px] font-medium leading-[1.7]">
          {values.description}
        </p>
        {officialUrl && (
          <a
            href={officialUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-5 flex w-full items-center justify-between py-2 text-[14px] font-bold text-[var(--preview-sub-coral)]"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              공식 페이지 보기
            </span>
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </a>
        )}
      </section>

      {tagLabels.length > 0 && (
        <section className="px-5 pt-6">
          <h2 className="text-[16px] font-extrabold">행사 태그</h2>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tagLabels.map((tag) => (
              <span
                key={tag}
                className="rounded-[4px] border border-[var(--preview-sub-coral)] bg-white px-2 py-1 text-[11px] font-medium text-[var(--preview-sub-coral)]"
              >
                {tag}
              </span>
            ))}
          </div>
        </section>
      )}

      {galleryImageUrls.length > 0 && <ProgramGallery imageUrls={galleryImageUrls} />}

      {values.programs.length > 0 && (
        <section className="px-5 py-7">
          <h2 className="text-[16px] font-extrabold">프로그램 및 이벤트 라인업</h2>
          <div className="mt-4 space-y-4">
            {values.programs.map((program, index) => (
              <ProgramScheduleItem key={`${program.name}-${index}`} program={program} />
            ))}
          </div>
        </section>
      )}

      {registrationUrl && (
        <section className="sticky bottom-0 px-5 pb-8 pt-2">
          <a
            href={registrationUrl}
            target="_blank"
            rel="noreferrer"
            className="flex h-[52px] w-full items-center justify-center rounded-xl bg-[var(--preview-sub-coral)]"
          >
            <span className="text-[15px] font-bold text-white">행사 참가 신청</span>
          </a>
        </section>
      )}
    </article>
  );
}

function ProgramEventInfoCard({
  values,
  entryFeeLabel,
}: {
  values: ProgramFormValues;
  entryFeeLabel: string;
}) {
  const fullAddress = [values.address, values.detailAddress, values.detailLocation]
    .filter(Boolean)
    .join(' ');
  const organizerText = [values.organizer, values.sponsor].filter(Boolean).join(' · ');
  const mapSearchKeyword = [
    values.placeName,
    values.address,
    values.detailAddress,
    values.detailLocation,
  ]
    .filter(Boolean)
    .join(' ');
  const infoItems = [
    {
      key: 'date',
      Icon: Calendar,
      title: formatProgramDateRange(values.eventStartDate, values.eventEndDate),
    },
    {
      key: 'place',
      Icon: MapPin,
      title: fullAddress,
      actionHref: mapSearchKeyword
        ? `https://map.naver.com/p/search/${encodeURIComponent(mapSearchKeyword)}`
        : '',
    },
    ...(organizerText
      ? [
          {
            key: 'organizer',
            Icon: Building2,
            title: organizerText,
          },
        ]
      : []),
    {
      key: 'programs',
      Icon: Users,
      title: `프로그램 ${values.programs.length}개`,
    },
  ];

  return (
    <section className="px-5 py-5">
      <div className="rounded-2xl bg-[var(--preview-section-white)] px-4 py-4">
        <div className="flex flex-col gap-6">
          {infoItems.map(({ key, Icon, title, actionHref }) => (
            <div key={key} className="flex gap-2.5">
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center">
                <Icon className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              </span>
              <div className="flex min-w-0 flex-1 items-start justify-between gap-2">
                <p className="min-w-0 flex-1 break-words text-[14px] font-bold leading-[18px]">
                  {title}
                </p>
                {actionHref && (
                  <a
                    href={actionHref}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 rounded-md bg-white px-3 py-1 text-[13px] font-bold leading-[17px]"
                  >
                    지도보기
                  </a>
                )}
              </div>
            </div>
          ))}

          <div className="flex items-end justify-between gap-2 border-t border-[var(--preview-bg-gray)] pt-4">
            <span className="text-[13px] font-semibold leading-[17px]">참가비</span>
            <span className="text-right text-[19px] font-bold leading-none">{entryFeeLabel}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProgramGallery({ imageUrls }: { imageUrls: string[] }) {
  return (
    <section className="relative mt-6 w-full bg-[var(--preview-section-white)]">
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
              className={`h-1.5 w-1.5 rounded-full ${index === 0 ? 'bg-white' : 'bg-white/50'}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function ProgramScheduleItem({ program }: { program: ProgramItem }) {
  const dateTime = [
    program.programDate && formatProgramDate(program.programDate),
    program.startTime && formatProgramTime(program.startTime, program.endTime),
  ]
    .filter(Boolean)
    .join(' · ');
  const applicationUrl = program.applicationUrl?.trim();

  return (
    <article className="rounded-xl border border-[var(--preview-bright-gray)] p-4">
      <span className="inline-flex rounded-full bg-[#fdf5f0] px-2 py-1 text-[11px] font-bold text-[var(--preview-sub-coral)]">
        {PROGRAM_TYPE_LABELS[program.type]}
      </span>
      <h3 className="mt-2 text-[16px] font-extrabold leading-5">{program.name}</h3>

      <div className="mt-3 space-y-2 text-[13px] font-medium leading-[17px] text-[var(--preview-main-gray)]">
        {program.venue && (
          <p className="flex gap-2">
            <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{program.venue}</span>
          </p>
        )}
        {program.host && (
          <p className="flex gap-2">
            <UserRound className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{program.host}</span>
          </p>
        )}
        {applicationUrl && (
          <a
            href={applicationUrl}
            target="_blank"
            rel="noreferrer"
            className="flex gap-2 font-bold text-[var(--preview-sub-coral)]"
          >
            <LinkIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="break-all">안내 링크 : {applicationUrl}</span>
          </a>
        )}
        {dateTime && (
          <p className="flex gap-2">
            <CalendarClock className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{dateTime}</span>
          </p>
        )}
      </div>

      {program.description && (
        <p className="mt-4 whitespace-pre-line text-[13px] font-medium leading-[1.7]">
          {program.description}
        </p>
      )}

      {program.whiskies && program.whiskies.length > 0 && (
        <section className="mt-6">
          <h4 className="text-[14px] font-extrabold">시음 위스키</h4>
          <div className="mt-3 divide-y divide-[var(--preview-bg-gray)] border-t border-[var(--preview-bg-gray)]">
            {program.whiskies.map((whisky, index) => (
              <CurationPreviewWhiskyCard
                key={
                  whisky.alcohol.alcoholId ?? `${whisky.source}-${whisky.alcohol.korName}-${index}`
                }
                {...whisky}
                order={index + 1}
              />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}

function formatProgramDate(value: string): string {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  return `${date.getMonth() + 1}월 ${date.getDate()}일 (${WEEKDAYS[date.getDay()]})`;
}

function formatProgramDateRange(startDate: string, endDate: string): string {
  const start = formatProgramDate(startDate);

  return startDate === endDate ? start : `${start} ~ ${formatProgramDate(endDate)}`;
}

function formatProgramTime(startTime: string, endTime?: string | null): string {
  return endTime ? `${startTime} - ${endTime}` : startTime;
}

function formatProgramFee(entryFee?: number | null, isTbc?: boolean): string {
  if (isTbc || entryFee === null || entryFee === undefined) return '참가비 별도 안내';

  return entryFee === 0 ? '무료' : `${entryFee.toLocaleString('ko-KR')}원`;
}
