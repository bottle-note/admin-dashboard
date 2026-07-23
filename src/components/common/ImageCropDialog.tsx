import { useEffect, useRef, useState } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop, type Crop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ImagePreprocessingError,
  preprocessImageToWebP,
  type PreparedImage,
} from '@/lib/image-preprocessing';

import type { ImageProcessingPolicy } from './PreparedImageField';

interface ImageCropDialogProps {
  file: File | null;
  open: boolean;
  policy: ImageProcessingPolicy;
  onOpenChange: (open: boolean) => void;
  onPrepared: (preparedImage: PreparedImage) => void;
}

function createInitialCrop(image: HTMLImageElement, aspectRatio: number | null): Crop {
  if (aspectRatio === null) {
    return { unit: '%', x: 5, y: 5, width: 90, height: 90 };
  }

  const width = image.width || image.naturalWidth;
  const height = image.height || image.naturalHeight;

  return centerCrop(
    makeAspectCrop({ unit: '%', width: 90 }, aspectRatio, width, height),
    width,
    height
  );
}

function toPixelCrop(crop: Crop, image: HTMLImageElement): PixelCrop {
  if (crop.unit === 'px') return crop as PixelCrop;

  const width = image.width || image.naturalWidth;
  const height = image.height || image.naturalHeight;

  return {
    unit: 'px',
    x: (crop.x ?? 0) * (width / 100),
    y: (crop.y ?? 0) * (height / 100),
    width: crop.width * (width / 100),
    height: crop.height * (height / 100),
  };
}

function toSourceCrop(crop: PixelCrop, image: HTMLImageElement) {
  const renderedWidth = image.width || image.naturalWidth;
  const renderedHeight = image.height || image.naturalHeight;

  if (!renderedWidth || !renderedHeight || !image.naturalWidth || !image.naturalHeight) return null;

  const scaleX = image.naturalWidth / renderedWidth;
  const scaleY = image.naturalHeight / renderedHeight;

  return {
    x: Math.round(crop.x * scaleX),
    y: Math.round(crop.y * scaleY),
    width: Math.round(crop.width * scaleX),
    height: Math.round(crop.height * scaleY),
  };
}

export function ImageCropDialog({
  file,
  open,
  policy,
  onOpenChange,
  onPrepared,
}: ImageCropDialogProps) {
  const imageRef = useRef<HTMLImageElement>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [cropPixels, setCropPixels] = useState<PixelCrop | null>(null);
  const [quality, setQuality] = useState(policy.defaultQuality);
  const [aspectRatio, setAspectRatio] = useState<number | null>(policy.defaultAspectRatio);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!file || !open) return;

    const nextSourceUrl = URL.createObjectURL(file);
    setSourceUrl(nextSourceUrl);
    setCrop(undefined);
    setCropPixels(null);
    setQuality(policy.defaultQuality);
    setAspectRatio(policy.defaultAspectRatio);
    setErrorMessage(null);

    return () => URL.revokeObjectURL(nextSourceUrl);
  }, [file, open, policy.defaultAspectRatio, policy.defaultQuality]);

  const handleCropComplete = (nextCrop: PixelCrop) => {
    setCropPixels(nextCrop);
  };

  const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const initialCrop = createInitialCrop(event.currentTarget, aspectRatio);
    setCrop(initialCrop);
    setCropPixels(toPixelCrop(initialCrop, event.currentTarget));
  };

  const handleAspectRatioChange = (value: string) => {
    const nextAspectRatio = value === 'free' ? null : Number(value);
    setAspectRatio(nextAspectRatio);
    setCropPixels(null);

    if (imageRef.current) {
      const initialCrop = createInitialCrop(imageRef.current, nextAspectRatio);
      setCrop(initialCrop);
      setCropPixels(toPixelCrop(initialCrop, imageRef.current));
    }
  };

  const handleApply = async () => {
    const image = imageRef.current;
    if (!file || !image || !cropPixels) {
      setErrorMessage('크롭 영역을 준비하지 못했습니다. 이미지를 다시 선택해주세요.');
      return;
    }

    const sourceCrop = toSourceCrop(cropPixels, image);
    if (!sourceCrop) {
      setErrorMessage('이미지 크기를 확인하지 못했습니다. 이미지를 다시 선택해주세요.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const preparedImage = await preprocessImageToWebP(file, {
        crop: sourceCrop,
        quality,
        allowedMimeTypes: policy.allowedMimeTypes,
        maxInputBytes: policy.maxInputBytes,
        maxOutputBytes: policy.maxOutputBytes,
        maxOutputLongEdge: policy.maxOutputLongEdge,
      });

      onPrepared(preparedImage);
      onOpenChange(false);
    } catch (error) {
      setErrorMessage(
        error instanceof ImagePreprocessingError
          ? error.message
          : '이미지를 처리하지 못했습니다. 다른 이미지를 선택해주세요.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const sourceCrop =
    cropPixels && imageRef.current ? toSourceCrop(cropPixels, imageRef.current) : null;
  const cropSizeLabel = sourceCrop ? `크롭 ${sourceCrop.width} × ${sourceCrop.height}px` : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>이미지 크롭 및 변환</DialogTitle>
          <DialogDescription>
            자유 비율 또는 고정 비율을 선택한 뒤, 크롭 영역을 드래그하거나 모서리 핸들로 크기를
            조절하세요.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="flex min-h-80 items-center justify-center overflow-auto rounded-md bg-muted p-3 sm:min-h-96">
            {sourceUrl && (
              <ReactCrop
                crop={crop}
                aspect={aspectRatio ?? undefined}
                keepSelection
                ruleOfThirds
                disabled={isProcessing}
                onChange={(pixelCrop, percentCrop) => {
                  setCrop(percentCrop);
                  setCropPixels(pixelCrop);
                }}
                onComplete={handleCropComplete}
                renderSelectionAddon={() =>
                  cropSizeLabel ? (
                    <span
                      className="pointer-events-none absolute bottom-1 right-1 rounded bg-black/75 px-1.5 py-0.5 text-xs font-medium text-white"
                      aria-label={`원본 기준 ${cropSizeLabel}`}
                    >
                      {cropSizeLabel}
                    </span>
                  ) : null
                }
              >
                <img
                  ref={imageRef}
                  src={sourceUrl}
                  alt="크롭할 원본 이미지"
                  className="max-h-[24rem] w-full object-contain"
                  onLoad={handleImageLoad}
                />
              </ReactCrop>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-medium">
              <span>크롭 비율</span>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                value={aspectRatio === null ? 'free' : String(aspectRatio)}
                disabled={isProcessing}
                onChange={(event) => handleAspectRatioChange(event.target.value)}
              >
                {policy.aspectRatios.map((option) => (
                  <option key={option.label} value={option.value === null ? 'free' : option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm font-medium">
              <span>WebP 품질: {quality}%</span>
              <input
                className="w-full accent-primary"
                type="range"
                min="40"
                max="95"
                step="5"
                value={quality}
                disabled={isProcessing}
                onChange={(event) => setQuality(Number(event.target.value))}
              />
              <span className="block text-xs font-normal text-muted-foreground">
                변환 후 실제 해상도와 파일 크기는 적용 결과에서 확인할 수 있습니다.
              </span>
            </label>
          </div>

          {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isProcessing}
            onClick={() => onOpenChange(false)}
          >
            취소
          </Button>
          <Button
            type="button"
            disabled={isProcessing || !cropPixels}
            onClick={() => void handleApply()}
          >
            {isProcessing ? '변환 중...' : '크롭 적용'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
