import type { ReactNode } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { CalendarDays, LinkIcon, MapPin, Ticket, Users } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import {
  createTastingEventPreviewModel,
  type TastingEventPreviewModel,
  type TastingEventPreviewWhisky,
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
  return (
    <div className="mx-auto flex h-[720px] max-h-[calc(100vh-8rem)] max-w-sm flex-col overflow-hidden rounded-[1.75rem] border bg-background shadow-sm">
      <div className="shrink-0 bg-muted/40 px-4 py-3 text-center text-xs font-medium text-muted-foreground">
        앱 노출 예시
      </div>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain p-4">
        <div className="overflow-hidden rounded-2xl bg-muted">
          {preview.imageUrl ? (
            <img
              src={preview.imageUrl}
              alt="시음회 대표 이미지 미리보기"
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
            <Badge variant="secondary">{preview.recruitingLabel}</Badge>
            {preview.imageCount > 1 && <Badge variant="outline">이미지 {preview.imageCount}</Badge>}
          </div>
          <h2 className="line-clamp-2 text-xl font-bold leading-tight">{preview.title}</h2>
          <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">
            {preview.description}
          </p>
        </div>

        <div className="space-y-2 rounded-xl bg-muted/40 p-3">
          <PreviewInfoRow
            icon={<CalendarDays className="h-4 w-4" />}
            label={preview.scheduleLabel}
          />
          <PreviewInfoRow icon={<MapPin className="h-4 w-4" />} label={preview.locationLabel} />
          <PreviewInfoRow icon={<Ticket className="h-4 w-4" />} label={preview.entryFeeLabel} />
          <PreviewInfoRow icon={<Users className="h-4 w-4" />} label={preview.capacityLabel} />
          {preview.applicationLink && (
            <PreviewInfoRow
              icon={<LinkIcon className="h-4 w-4" />}
              label={preview.applicationLink}
              truncate
            />
          )}
        </div>

        {preview.guideText && (
          <div className="rounded-xl border bg-background p-3">
            <h3 className="text-sm font-semibold">안내사항</h3>
            <p className="mt-1 line-clamp-4 whitespace-pre-line text-sm leading-6 text-muted-foreground">
              {preview.guideText}
            </p>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">시음 위스키</h3>
            <span className="text-xs text-muted-foreground">{preview.whiskies.length}개</span>
          </div>

          {preview.whiskies.length > 0 ? (
            <div className="space-y-3">
              {preview.whiskies.map((whisky) => (
                <PreviewWhiskyItem key={whisky.id} whisky={whisky} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed py-8 text-center text-sm text-muted-foreground">
              시음 위스키가 여기에 표시됩니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PreviewInfoRow({
  icon,
  label,
  truncate = false,
}: {
  icon: ReactNode;
  label: string;
  truncate?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="shrink-0 text-muted-foreground">{icon}</span>
      <span className={truncate ? 'min-w-0 truncate' : 'min-w-0'}>{label}</span>
    </div>
  );
}

function PreviewWhiskyItem({ whisky }: { whisky: TastingEventPreviewWhisky }) {
  return (
    <div className="rounded-xl border p-3">
      <div className="flex gap-3">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
          {whisky.imageUrl ? (
            <img src={whisky.imageUrl} alt={whisky.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
              No
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{whisky.name}</p>
          {whisky.englishName && (
            <p className="truncate text-xs text-muted-foreground">{whisky.englishName}</p>
          )}
          {whisky.meta.length > 0 && (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
              {whisky.meta.join(' · ')}
            </p>
          )}
          {getWhiskyStatsLabel(whisky) && (
            <p className="mt-1 text-xs text-muted-foreground">{getWhiskyStatsLabel(whisky)}</p>
          )}
        </div>
      </div>

      {whisky.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {whisky.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="px-2 py-0 text-[11px]">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {whisky.comment && (
        <p className="mt-3 line-clamp-3 text-xs leading-5 text-muted-foreground">
          {whisky.comment}
        </p>
      )}
    </div>
  );
}

function getWhiskyStatsLabel(whisky: TastingEventPreviewWhisky): string {
  const stats = whisky.stats;
  if (!stats) return '';

  return [
    formatRating(stats.rating),
    formatCount('유저평가', stats.totalRatingsCount),
  ]
    .filter(Boolean)
    .join(' · ');
}

function formatRating(value: number | null | undefined): string {
  return typeof value === 'number' && Number.isFinite(value)
    ? `평균별점 ${value.toFixed(1)}`
    : '';
}

function formatCount(label: string, value: number | null | undefined): string {
  return typeof value === 'number' && Number.isFinite(value)
    ? `${label} ${value.toLocaleString('ko-KR')}`
    : '';
}
