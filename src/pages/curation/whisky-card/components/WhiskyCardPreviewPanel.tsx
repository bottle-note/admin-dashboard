import { useFormContext, useWatch } from 'react-hook-form';
import { Heart, MessageSquare, Star } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import type {
  CurationWhiskyMirror,
  CurationWhiskyStats,
} from '../../curation-whisky-card-list.types';
import { CurationPreviewFrame } from '../../_preview';
import type {
  PairingFoodValue,
  WhiskyCardCurationFormModel,
  WhiskyCardCurationFormState,
} from '../whisky-card-curation.schema';

interface WhiskyCardPreviewPanelProps {
  formModel: WhiskyCardCurationFormModel;
}

export function WhiskyCardPreviewPanel({ formModel }: WhiskyCardPreviewPanelProps) {
  const form = useFormContext<WhiskyCardCurationFormState>();
  const watchedValues = useWatch({ control: form.control });
  const previewValues = {
    ...form.getValues(),
    ...watchedValues,
  } as WhiskyCardCurationFormState;

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>미리보기</CardTitle>
        <CardDescription>앱 노출 예시를 기준으로 작성 내용을 확인합니다.</CardDescription>
      </CardHeader>
      <CardContent>
        <CurationPreviewFrame title={formModel.spec.name}>
          <WhiskyCardAppPreview formModel={formModel} values={previewValues} />
        </CurationPreviewFrame>
      </CardContent>
    </Card>
  );
}

function WhiskyCardAppPreview({
  formModel,
  values,
}: {
  formModel: WhiskyCardCurationFormModel;
  values: WhiskyCardCurationFormState;
}) {
  const title = values.name.trim() || formModel.spec.name;
  const description = values.description.trim();
  const heroImageUrl = values.imageUrls[0];

  return (
    <div className="space-y-5 p-4">
      <div className="overflow-hidden rounded-2xl bg-muted">
        {heroImageUrl ? (
          <img
            src={heroImageUrl}
            alt="큐레이션 대표 이미지 미리보기"
            className="aspect-[4/3] w-full object-cover"
          />
        ) : (
          <div className="flex aspect-[4/3] items-center justify-center text-sm text-muted-foreground">
            대표 이미지
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{formModel.spec.name}</Badge>
          {values.imageUrls.length > 1 && (
            <Badge variant="outline">이미지 {values.imageUrls.length}</Badge>
          )}
        </div>
        <h2 className="line-clamp-2 text-xl font-bold leading-tight">{title}</h2>
        {description && (
          <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">{description}</p>
        )}
      </div>

      <PreviewWhiskyCard alcohol={values.alcohol} stats={values.stats} comment={values.comment} />

      {formModel.pairings && (
        <PreviewPairings pairings={values.pairings} title={formModel.pairings.label} />
      )}
    </div>
  );
}

function PreviewWhiskyCard({
  alcohol,
  stats,
  comment,
}: {
  alcohol: CurationWhiskyMirror;
  stats?: CurationWhiskyStats | null;
  comment?: string;
}) {
  const name = alcohol.korName.trim() || '위스키명';
  const meta = getWhiskyMeta(alcohol);
  const normalizedComment = comment?.trim();

  return (
    <div className="rounded-xl border p-3">
      <div className="flex gap-3">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
          {alcohol.imageUrl ? (
            <img src={alcohol.imageUrl} alt={name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
              No
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{name}</p>
          {alcohol.engName && (
            <p className="truncate text-xs text-muted-foreground">{alcohol.engName}</p>
          )}
          {meta && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{meta}</p>}
          {getWhiskyStatsLabel(stats) && (
            <p className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
              {getWhiskyStatsLabel(stats)}
            </p>
          )}
        </div>
      </div>

      {alcohol.selectedTags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {alcohol.selectedTags.map((tag) => (
            <Badge key={tag} variant="secondary" className="px-2 py-0 text-[11px]">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {normalizedComment && (
        <p className="mt-3 line-clamp-4 whitespace-pre-line text-xs leading-5 text-muted-foreground">
          {normalizedComment}
        </p>
      )}
    </div>
  );
}

function PreviewPairings({ title, pairings }: { title: string; pairings: PairingFoodValue[] }) {
  const visiblePairings = pairings.filter(
    (item) => item.itemName.trim() || item.pairingNote.trim()
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="text-xs text-muted-foreground">{visiblePairings.length}개</span>
      </div>

      {visiblePairings.length > 0 ? (
        <div className="space-y-3">
          {visiblePairings.map((pairing, index) => (
            <div key={`${pairing.itemName}-${index}`} className="rounded-xl border p-3">
              <div className="flex gap-3">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {pairing.itemImageUrl ? (
                    <img
                      src={pairing.itemImageUrl}
                      alt={pairing.itemName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                      Food
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{pairing.itemName || '음식명'}</p>
                  {pairing.pairingNote && (
                    <p className="mt-1 line-clamp-3 whitespace-pre-line text-xs leading-5 text-muted-foreground">
                      {pairing.pairingNote}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed py-8 text-center text-sm text-muted-foreground">
          페어링 음식이 여기에 표시됩니다.
        </div>
      )}
    </div>
  );
}

function getWhiskyMeta(alcohol: CurationWhiskyMirror): string {
  return [
    formatAbv(alcohol.abv),
    normalizeText(alcohol.volume),
    normalizeText(alcohol.cask),
    normalizeText(alcohol.regionName),
    normalizeText(alcohol.korCategory),
  ]
    .filter(Boolean)
    .join(' · ');
}

function getWhiskyStatsLabel(stats: CurationWhiskyStats | null | undefined) {
  if (!stats) return null;

  const items = [
    { icon: <Star className="h-3 w-3" aria-hidden="true" />, value: formatRating(stats.rating) },
    {
      icon: <MessageSquare className="h-3 w-3" aria-hidden="true" />,
      value: formatCount(stats.reviewCount),
    },
    {
      icon: <Heart className="h-3 w-3" aria-hidden="true" />,
      value: formatCount(stats.totalPickCount),
    },
  ].filter((item) => item.value);

  if (items.length === 0) return null;

  return items.map((item) => (
    <span key={item.value} className="inline-flex items-center gap-1">
      {item.icon}
      {item.value}
    </span>
  ));
}

function formatRating(value: number | null | undefined): string {
  return typeof value === 'number' && Number.isFinite(value) ? value.toFixed(1) : '';
}

function formatCount(value: number | null | undefined): string {
  return typeof value === 'number' && Number.isFinite(value) ? value.toLocaleString('ko-KR') : '';
}

function formatAbv(value: string | undefined): string {
  const normalizedValue = normalizeText(value);
  if (!normalizedValue) return '';

  return normalizedValue.includes('%') ? normalizedValue : `${normalizedValue}%`;
}

function normalizeText(value: string | null | undefined): string {
  return typeof value === 'string' ? value.trim() : '';
}
