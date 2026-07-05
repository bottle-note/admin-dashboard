import type {
  TastingEventPreviewAlcoholItem,
  TastingEventPreviewData,
  TastingEventPreviewModel,
} from './types';
import { buildTastingEventPreviewModel } from './buildTastingEventPreviewModel';
import { CurationPreviewWhiskyCard } from './CurationPreviewWhiskyCard';
import { tastingEventPreviewThemeStyle } from './previewTheme';

const cx = (...classNames: Array<string | false | null | undefined>) => {
  return classNames.filter(Boolean).join(' ');
};

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
  event: TastingEventPreviewData;
  today?: Date;
  className?: string;
}

export function TastingEventPreview({ event, today, className }: TastingEventPreviewProps) {
  const model = buildTastingEventPreviewModel(event, { today });

  return (
    <article className={cx('w-full bg-white', className)} style={tastingEventPreviewThemeStyle}>
      <TastingEventPreviewHero model={model} />
      <TastingEventPreviewInfoCard model={model} />
      <TastingEventPreviewDescription description={model.description} />
      <TastingEventPreviewGallery imageUrls={model.imageUrls} />
      <TastingEventPreviewLineup alcohols={model.alcohols} />
      <TastingEventPreviewCta model={model} />
    </article>
  );
}

function TastingEventPreviewHero({ model }: { model: TastingEventPreviewModel }) {
  return (
    <section className="relative h-60 w-full overflow-hidden bg-[var(--preview-section-white)]">
      {model.coverImageUrl ? (
        <img src={model.coverImageUrl} alt="" className="h-full w-full object-cover" />
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
        <h1 className="mt-3 line-clamp-2 text-[20px] font-extrabold text-white">{model.title}</h1>
        <p className="mt-2 line-clamp-1 text-[10px] font-light text-white">
          {model.eventDateLabel} · {model.placeLabel} · {model.capacityLabel}
        </p>
      </div>
    </section>
  );
}

function TastingEventPreviewInfoCard({ model }: { model: TastingEventPreviewModel }) {
  const infoItems = [
    {
      key: 'date',
      Icon: CalendarIcon,
      title: model.eventDateTimeLabel,
      description: model.guideText,
    },
    {
      key: 'place',
      Icon: PinIcon,
      title: model.barAddress,
      description: model.detailAddress,
      actionHref: model.mapSearchUrl,
    },
    {
      key: 'capacity',
      Icon: UsersIcon,
      title: model.capacityLabel,
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
              {model.entryFeeLabel}
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
        {imageUrls.map((imageUrl) => (
          <img
            key={imageUrl}
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
              key={imageUrl}
              className={cx('h-1.5 w-1.5 rounded-full', index === 0 ? 'bg-white' : 'bg-white/50')}
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
            key={item.source ?? item.alcohol.alcoholId ?? `${item.alcohol.korName}-${index}`}
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

function TastingEventPreviewCta({ model }: { model: TastingEventPreviewModel }) {
  if (model.cta.type === 'hidden') {
    return null;
  }

  return (
    <section className="sticky bottom-0 px-5 pb-8 pt-2">
      {model.cta.type === 'apply' ? (
        <a
          href={model.cta.href}
          target="_blank"
          rel="noreferrer"
          className="flex h-[52px] w-full items-center justify-center rounded-xl bg-[var(--preview-sub-coral)]"
        >
          <span className="text-[15px] font-bold text-white">{model.cta.label}</span>
        </a>
      ) : (
        <button
          type="button"
          disabled
          className="flex h-[52px] w-full cursor-not-allowed items-center justify-center rounded-xl bg-[var(--preview-bright-gray)]"
        >
          <span className="text-[15px] font-bold text-white">{model.cta.label}</span>
        </button>
      )}
    </section>
  );
}
