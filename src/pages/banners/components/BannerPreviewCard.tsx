import type { UseFormReturn } from 'react-hook-form';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { BannerFormValues } from '../banner.schema';
import type { TextPosition } from '@/types/api';

interface BannerPreviewCardProps {
  form: UseFormReturn<BannerFormValues>;
  imagePreviewUrl: string | null;
}

export function BannerPreviewCard({ form, imagePreviewUrl }: BannerPreviewCardProps) {
  if (!imagePreviewUrl) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>미리보기</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative aspect-[16/5] overflow-hidden rounded-lg">
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

  const isNameFirst = textPosition === 'LB' || textPosition === 'RB';

  return (
    <div
      className={`absolute ${positionClasses[textPosition]} ${textAlignClasses[textPosition]} max-w-[60%]`}
    >
      {isNameFirst ? (
        <>
          <p
            className="text-lg font-bold drop-shadow-lg"
            style={{ color: `#${nameFontColor}` }}
          >
            {name}
          </p>
          {(descriptionA || descriptionB) && (
            <div style={{ color: `#${descriptionFontColor}` }} className="drop-shadow">
              {descriptionA && <p className="text-sm">{descriptionA}</p>}
              {descriptionB && <p className="text-sm">{descriptionB}</p>}
            </div>
          )}
        </>
      ) : (
        <>
          {(descriptionA || descriptionB) && (
            <div style={{ color: `#${descriptionFontColor}` }} className="drop-shadow">
              {descriptionA && <p className="text-sm">{descriptionA}</p>}
              {descriptionB && <p className="text-sm">{descriptionB}</p>}
            </div>
          )}
          <p
            className="text-lg font-bold drop-shadow-lg"
            style={{ color: `#${nameFontColor}` }}
          >
            {name}
          </p>
        </>
      )}
    </div>
  );
}
