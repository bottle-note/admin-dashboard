import type { ReactNode } from 'react';

export interface CurationPreviewWhiskyCardAlcohol {
  alcoholId?: number | null;
  korName?: string | null;
  engName?: string | null;
  imageUrl?: string | null;
  regionName?: string | null;
  korCategory?: string | null;
  selectedTags?: string[];
  abv?: string | null;
}

export interface CurationPreviewWhiskyCardStats {
  rating?: number | null;
  totalRatingsCount?: number | null;
}

interface CurationPreviewWhiskyCardProps {
  alcohol: CurationPreviewWhiskyCardAlcohol;
  stats?: CurationPreviewWhiskyCardStats | null;
  comment?: string | null;
  order?: number;
  fallbackName?: string;
  children?: ReactNode;
}

export function CurationPreviewWhiskyCard({
  alcohol,
  stats,
  comment,
  order,
  fallbackName = '위스키명',
  children,
}: CurationPreviewWhiskyCardProps) {
  const name = normalizeText(alcohol.korName) || fallbackName;
  const details = [formatAbv(alcohol.abv)].filter(Boolean);
  const chips = (alcohol.selectedTags ?? []).filter(Boolean);
  const normalizedComment = normalizeText(comment);

  return (
    <article className="relative py-6">
      {typeof order === 'number' && (
        <div className="absolute left-0 top-6 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--preview-main-dark-gray)] text-[10px] font-bold text-white">
          {order}
        </div>
      )}

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
                <div className="flex items-center gap-[1px] text-[12px] font-semibold text-[var(--preview-main-gray)]">
                  <StarIcon />
                  <span>{stats.rating.toFixed(1)}</span>
                  <span className="ml-[2px] text-[11px] font-medium">
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

      {children}
    </article>
  );
}

const StarIcon = () => (
  <svg viewBox="0 0 24 24" className="h-3 w-3" aria-hidden="true">
    <path
      d="m12 2 3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2Z"
      fill="currentColor"
    />
  </svg>
);

function formatAbv(value: string | null | undefined): string {
  const normalizedValue = normalizeText(value);
  if (!normalizedValue) return '';

  return normalizedValue.includes('%') ? `도수 ${normalizedValue}` : `도수 ${normalizedValue}%`;
}

function normalizeText(value: string | null | undefined): string {
  return typeof value === 'string' ? value.trim() : '';
}
