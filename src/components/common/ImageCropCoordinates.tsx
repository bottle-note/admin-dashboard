import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Coordinates = { x: number; y: number; width: number; height: number };

export function ImageCropCoordinates({
  crop,
  imageWidth,
  imageHeight,
  aspectRatio,
  disabled,
  onApply,
}: {
  crop: Coordinates;
  imageWidth: number;
  imageHeight: number;
  aspectRatio: number | null;
  disabled: boolean;
  onApply: (crop: Coordinates) => void;
}) {
  const schema = z
    .object({
      x: z.number({ error: '정수를 입력하세요.' }).int().min(0, '0 이상으로 입력하세요.'),
      y: z.number({ error: '정수를 입력하세요.' }).int().min(0, '0 이상으로 입력하세요.'),
      width: z.number({ error: '정수를 입력하세요.' }).int().min(1, '1 이상으로 입력하세요.'),
      height: z.number({ error: '정수를 입력하세요.' }).int().min(1, '1 이상으로 입력하세요.'),
    })
    .superRefine((value, context) => {
      if (value.x + value.width > imageWidth || value.y + value.height > imageHeight) {
        context.addIssue({
          code: 'custom',
          path: ['width'],
          message: '크롭 영역이 원본 이미지 범위를 벗어납니다.',
        });
      }
      if (
        aspectRatio !== null &&
        Math.abs(value.width - value.height * aspectRatio) > Math.max(1, aspectRatio)
      ) {
        context.addIssue({
          code: 'custom',
          path: ['height'],
          message: '선택한 크롭 비율에 맞게 입력하세요. 임의 크기는 자유 비율을 선택하세요.',
        });
      }
    });
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Coordinates>({
    resolver: zodResolver(schema),
    defaultValues: crop,
  });
  const { x, y, width, height } = crop;
  useEffect(() => {
    reset({ x, y, width, height });
  }, [x, y, width, height, reset]);

  return (
    <details className="rounded-md border p-3">
      <summary className="cursor-pointer text-sm font-medium">상세 설정 · 크롭 좌표</summary>
      <form
        className="mt-3 space-y-3"
        onSubmit={(event) => {
          event.stopPropagation();
          void handleSubmit(onApply)(event);
        }}
      >
        <p className="text-xs text-muted-foreground">
          원본 {imageWidth} × {imageHeight}px 기준입니다. 왼쪽 위가 X 0, Y 0입니다. 좌표 적용 후
          이미지를 저장하세요.
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(
            [
              { key: 'x', label: 'X' },
              { key: 'y', label: 'Y' },
              { key: 'width', label: '너비' },
              { key: 'height', label: '높이' },
            ] as const
          ).map(({ key, label }) => (
            <label key={key} className="space-y-1 text-sm">
              <span>{label} (px)</span>
              <Input
                type="number"
                step={1}
                min={key === 'x' || key === 'y' ? 0 : 1}
                disabled={disabled}
                aria-invalid={Boolean(errors[key])}
                {...register(key, { valueAsNumber: true })}
              />
            </label>
          ))}
        </div>
        {Object.entries(errors).map(([key, error]) => (
          <p key={key} role="alert" className="text-xs text-destructive">
            {error.message}
          </p>
        ))}
        <div className="flex flex-wrap gap-2">
          <Button type="submit" size="sm" variant="outline" disabled={disabled}>
            좌표 적용
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={disabled}
            onClick={() =>
              onApply({
                ...crop,
                x: Math.floor((imageWidth - crop.width) / 2),
                y: Math.floor((imageHeight - crop.height) / 2),
              })
            }
          >
            가운데 정렬
          </Button>
          {aspectRatio === null && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={disabled}
              onClick={() => onApply({ x: 0, y: 0, width: imageWidth, height: imageHeight })}
            >
              전체 이미지 선택
            </Button>
          )}
        </div>
      </form>
    </details>
  );
}
