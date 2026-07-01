import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

import type { CurationWhiskyMirror, CurationWhiskyStats } from '../curation-whisky-card-list.types';
import { tastingEventPreviewThemeStyle } from './previewTheme';

export interface WhiskyCardCurationPreviewPairing {
  itemName: string;
  pairingNote: string;
  itemImageUrl?: string;
}

export interface WhiskyCardCurationPreviewData {
  specName: string;
  name: string;
  description?: string | null;
  imageUrls: string[];
  alcohol: CurationWhiskyMirror;
  stats?: CurationWhiskyStats | null;
  comment?: string | null;
  pairings?: WhiskyCardCurationPreviewPairing[];
}

interface WhiskyCardCurationPreviewProps {
  curation: WhiskyCardCurationPreviewData;
  pairingTitle?: string;
  className?: string;
}

export function WhiskyCardCurationPreview({
  curation,
  pairingTitle = '페어링 음식',
  className,
}: WhiskyCardCurationPreviewProps) {
  const coverImageUrl = curation.imageUrls[0] ?? curation.alcohol.imageUrl ?? '';
  const galleryImageUrls = curation.imageUrls.filter((imageUrl) => imageUrl !== coverImageUrl);
  const description = normalizeText(curation.description);
  const hasDescription = Boolean(description);
  const visiblePairings =
    curation.pairings?.filter((pairing) => pairing.itemName.trim() || pairing.pairingNote.trim()) ??
    [];

  return (
    <article className={cn('w-full bg-white', className)} style={tastingEventPreviewThemeStyle}>
      <CurationPreviewHero
        title={curation.name || curation.specName}
        label={curation.specName}
        coverImageUrl={coverImageUrl}
      />

      {hasDescription && <CurationPreviewDescription>{description}</CurationPreviewDescription>}

      <CurationPreviewGallery imageUrls={galleryImageUrls} />

      <section className="px-5 py-6">
        <h2 className="text-[16px] font-extrabold text-[var(--preview-main-dark-gray)]">
          큐레이션 위스키
        </h2>
        <div className="mt-4 divide-y divide-[var(--preview-bg-gray)] border-t border-[var(--preview-bg-gray)]">
          <WhiskyPreviewItem
            alcohol={curation.alcohol}
            stats={curation.stats}
            comment={curation.comment}
          />
        </div>
      </section>

      {visiblePairings.length > 0 && (
        <section className="px-5 pb-8">
          <h2 className="text-[16px] font-extrabold text-[var(--preview-main-dark-gray)]">
            {pairingTitle}
          </h2>
          <div className="mt-4 space-y-4">
            {visiblePairings.map((pairing, index) => (
              <PairingPreviewItem key={`${pairing.itemName}-${index}`} pairing={pairing} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}

function CurationPreviewHero({
  title,
  label,
  coverImageUrl,
}: {
  title: string;
  label: string;
  coverImageUrl: string;
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
          {label}
        </span>
        <h1 className="mt-3 line-clamp-2 text-[20px] font-extrabold text-white">{title}</h1>
      </div>
    </section>
  );
}

function CurationPreviewDescription({ children }: { children: ReactNode }) {
  return (
    <section className="px-5 py-5">
      <p className="whitespace-pre-line text-[13px] font-medium leading-[1.8] text-[var(--preview-main-dark-gray)]">
        {children}
      </p>
    </section>
  );
}

function CurationPreviewGallery({ imageUrls }: { imageUrls: string[] }) {
  if (!imageUrls.length) return null;

  return (
    <section className="relative w-full bg-[var(--preview-section-white)]">
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
              className={cn('h-1.5 w-1.5 rounded-full', index === 0 ? 'bg-white' : 'bg-white/50')}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function WhiskyPreviewItem({
  alcohol,
  stats,
  comment,
}: {
  alcohol: CurationWhiskyMirror;
  stats?: CurationWhiskyStats | null;
  comment?: string | null;
}) {
  const name = normalizeText(alcohol.korName) || '위스키명';
  const details = [formatAbv(alcohol.abv), alcohol.korCategory].filter(Boolean);
  const chips = [...(alcohol.selectedTags ?? []), alcohol.korCategory, alcohol.regionName].filter(
    Boolean
  );
  const normalizedComment = normalizeText(comment);

  return (
    <article className="py-6">
      <div className="flex w-full overflow-hidden text-[var(--preview-main-black)]">
        <div className="flex min-w-0 flex-1 gap-3">
          <div className="flex h-[128px] w-[95px] shrink-0 items-center justify-center p-2">
            <div className="relative h-full w-full">
              {alcohol.imageUrl ? (
                <img src={alcohol.imageUrl} alt={name} className="h-full w-full object-contain" />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-lg bg-[var(--preview-section-white)] text-[11px] text-[var(--preview-main-gray)]">
                  이미지
                </div>
              )}
            </div>
          </div>

          <div className="flex min-w-0 flex-1 flex-col items-start justify-center space-y-2">
            <div className="min-w-0 space-y-2">
              <h3 className="line-clamp-2 text-[15px] font-bold leading-[1.3] text-[var(--preview-main-dark-gray)]">
                {name}
              </h3>
              {alcohol.engName && (
                <p className="text-[13px] text-[var(--preview-main-dark-gray)]">
                  {alcohol.engName.toUpperCase()}
                </p>
              )}
              {details.length > 0 && (
                <p className="text-[13px] text-[var(--preview-main-dark-gray)]">
                  {details.join(' · ')}
                </p>
              )}
            </div>

            {typeof stats?.rating === 'number' && (
              <div className="flex items-center gap-1 text-[var(--preview-main-gray)]">
                <span className="text-[12px] font-medium">유저평균</span>
                <span className="text-[12px] font-semibold text-[var(--preview-main-gray)]">
                  ★ {stats.rating.toFixed(1)}
                </span>
                <span className="text-[11px] font-medium">({stats.totalRatingsCount ?? 0})</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {chips.length > 0 && (
        <div className="mt-5 flex w-full flex-wrap gap-1.5">
          {chips.map((chip, index) => (
            <span
              key={`${chip}-${index}`}
              className="rounded-[4px] border border-[var(--preview-main-gray)] px-2 py-1 text-[11px] font-medium text-[var(--preview-main-gray)]"
            >
              {chip}
            </span>
          ))}
        </div>
      )}

      {normalizedComment && (
        <p className="mt-5 whitespace-pre-line text-[13px] font-medium leading-[1.8] text-[var(--preview-main-gray)]">
          {normalizedComment}
        </p>
      )}
    </article>
  );
}

function PairingPreviewItem({ pairing }: { pairing: WhiskyCardCurationPreviewPairing }) {
  return (
    <article className="border-t border-[var(--preview-bg-gray)] pt-4">
      <div className="flex gap-3">
        <div className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-[10px] bg-[var(--preview-section-white)]">
          {pairing.itemImageUrl ? (
            <img
              src={pairing.itemImageUrl}
              alt={pairing.itemName}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[11px] text-[var(--preview-main-gray)]">
              음식
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[14px] font-bold text-[var(--preview-main-dark-gray)]">
            {pairing.itemName || '음식명'}
          </h3>
          {pairing.pairingNote && (
            <p className="mt-2 line-clamp-3 whitespace-pre-line text-[12px] font-medium leading-[1.7] text-[var(--preview-main-gray)]">
              {pairing.pairingNote}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

function formatAbv(value: string | undefined): string {
  const normalizedValue = normalizeText(value);
  if (!normalizedValue) return '';

  return normalizedValue.includes('%') ? `도수 ${normalizedValue}` : `도수 ${normalizedValue}%`;
}

function normalizeText(value: string | null | undefined): string {
  return typeof value === 'string' ? value.trim() : '';
}
