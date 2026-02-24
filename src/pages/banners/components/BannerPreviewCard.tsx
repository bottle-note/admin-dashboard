import { useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';

import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { BannerFormValues } from '../banner.schema';
import type { TextPosition } from '@/types/api';

const PREVIEW_WIDTHS = [
  { label: 'SE', width: 320 },
  { label: '표준', width: 375 },
  { label: 'Max', width: 414 },
  { label: '전체', width: 468 },
] as const;

const BANNER_HEIGHT = 227;

interface BannerPreviewCardProps {
  form: UseFormReturn<BannerFormValues>;
  imagePreviewUrl: string | null;
}

export function BannerPreviewCard({ form, imagePreviewUrl }: BannerPreviewCardProps) {
  const [selectedWidth, setSelectedWidth] = useState<number>(PREVIEW_WIDTHS[1].width);

  if (!imagePreviewUrl) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle>미리보기</CardTitle>
        <div className="flex gap-1">
          {PREVIEW_WIDTHS.map(({ label, width }) => (
            <button
              key={width}
              type="button"
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                selectedWidth === width
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80',
              )}
              onClick={() => setSelectedWidth(width)}
            >
              {label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center rounded-lg bg-muted/40 p-4">
          <div
            className="relative overflow-hidden"
            style={{ width: selectedWidth, height: BANNER_HEIGHT }}
          >
            <img
              src={imagePreviewUrl}
              alt="배너 미리보기"
              className="h-full w-full object-cover"
            />
            <BannerTextOverlay
              name={form.watch('name')}
              descriptionA={form.watch('descriptionA')}
              descriptionB={form.watch('descriptionB')}
              textPosition={form.watch('textPosition')}
              nameFontColor={form.watch('nameFontColor')}
              descriptionFontColor={form.watch('descriptionFontColor')}
            />
          </div>
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          {selectedWidth} × {BANNER_HEIGHT}px
        </p>
      </CardContent>
    </Card>
  );
}

interface BannerTextOverlayProps {
  name: string;
  descriptionA?: string;
  descriptionB?: string;
  textPosition: TextPosition;
  nameFontColor: string;
  descriptionFontColor: string;
}

function BannerTextOverlay({
  name,
  descriptionA,
  descriptionB,
  textPosition,
  nameFontColor,
  descriptionFontColor,
}: BannerTextOverlayProps) {
  const positionClasses: Record<TextPosition, string> = {
    LT: 'top-4 left-4',
    LB: 'bottom-4 left-4',
    RT: 'top-4 right-4',
    RB: 'bottom-4 right-4',
    CENTER: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
  };

  const textAlignClasses: Record<TextPosition, string> = {
    LT: 'text-left',
    LB: 'text-left',
    RT: 'text-right',
    RB: 'text-right',
    CENTER: 'text-center',
  };

  const isBottom = textPosition === 'LB' || textPosition === 'RB';

  const titleBlock = (descriptionA || descriptionB) ? (
    <div style={{ color: `#${descriptionFontColor}` }}>
      {descriptionA && <p className="text-xl font-semibold leading-tight">{descriptionA}</p>}
      {descriptionB && <p className="text-xl font-semibold leading-tight">{descriptionB}</p>}
    </div>
  ) : null;

  const descBlock = name ? (
    <p
      className="text-sm"
      style={{ color: `#${nameFontColor}` }}
    >
      {name}
    </p>
  ) : null;

  return (
    <div
      className={`absolute ${positionClasses[textPosition]} ${textAlignClasses[textPosition]} flex flex-col gap-2 max-w-[60%]`}
    >
      {isBottom ? (
        <>
          {descBlock}
          {titleBlock}
        </>
      ) : (
        <>
          {titleBlock}
          {descBlock}
        </>
      )}
    </div>
  );
}
