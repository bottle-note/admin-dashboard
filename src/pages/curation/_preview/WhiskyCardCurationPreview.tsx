import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

import type {
  CurationWhiskyCardValue,
  CurationWhiskyMirror,
} from '../curation-whisky-card-list.types';
import { CurationPreviewWhiskyCard } from './CurationPreviewWhiskyCard';
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
  alcohol?: CurationWhiskyMirror;
  stats?: CurationWhiskyCardValue['stats'];
  comment?: string | null;
  pairings?: WhiskyCardCurationPreviewPairing[];
  items?: Array<CurationWhiskyCardValue & { pairings?: WhiskyCardCurationPreviewPairing[] }>;
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
  const visibleItems = getVisibleItems(curation);
  const coverImageUrl = curation.imageUrls[0] ?? visibleItems[0]?.alcohol.imageUrl ?? '';
  const galleryImageUrls = curation.imageUrls.filter((imageUrl) => imageUrl !== coverImageUrl);
  const description = normalizeText(curation.description);
  const hasDescription = Boolean(description);

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
          {visibleItems.length > 0 ? (
            visibleItems.map((item, index) => (
              <WhiskyPreviewItem
                key={`${item.alcohol.korName}-${index}`}
                item={item}
                pairingTitle={pairingTitle}
              />
            ))
          ) : (
            <WhiskyPreviewItem
              item={{ source: 'MANUAL', alcohol: createPreviewFallbackAlcohol(), comment: '' }}
              pairingTitle={pairingTitle}
            />
          )}
        </div>
      </section>
    </article>
  );
}

function getVisibleItems(
  curation: WhiskyCardCurationPreviewData
): Array<CurationWhiskyCardValue & { pairings?: WhiskyCardCurationPreviewPairing[] }> {
  const visibleItems =
    curation.items?.filter(
      (item) =>
        normalizeText(item.alcohol.korName) ||
        normalizeText(item.alcohol.engName) ||
        normalizeText(item.comment) ||
        item.alcohol.selectedTags.length > 0
    ) ?? [];

  if (visibleItems.length > 0) return visibleItems;
  if (!curation.alcohol) return [];

  return [
    {
      source: 'MANUAL',
      alcohol: curation.alcohol,
      stats: curation.stats,
      comment: curation.comment,
      pairings: curation.pairings,
    },
  ];
}

function createPreviewFallbackAlcohol(): CurationWhiskyMirror {
  return {
    alcoholId: null,
    korName: '',
    engName: '',
    imageUrl: '',
    selectedTags: [],
  };
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
  item,
  pairingTitle,
}: {
  item: CurationWhiskyCardValue & { pairings?: WhiskyCardCurationPreviewPairing[] };
  pairingTitle: string;
}) {
  const visiblePairings =
    item.pairings?.filter((pairing) => pairing.itemName.trim() || pairing.pairingNote.trim()) ??
    [];

  return (
    <CurationPreviewWhiskyCard
      alcohol={item.alcohol}
      stats={item.stats}
      comment={item.comment}
      fallbackName="위스키명"
    >
      {visiblePairings.length > 0 && (
        <div className="mt-5">
          <h4 className="text-[14px] font-extrabold text-[var(--preview-main-dark-gray)]">
            {pairingTitle}
          </h4>
          <div className="mt-3 space-y-4">
            {visiblePairings.map((pairing, index) => (
              <PairingPreviewItem key={`${pairing.itemName}-${index}`} pairing={pairing} />
            ))}
          </div>
        </div>
      )}
    </CurationPreviewWhiskyCard>
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

function normalizeText(value: string | null | undefined): string {
  return typeof value === 'string' ? value.trim() : '';
}
