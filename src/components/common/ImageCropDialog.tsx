import { useEffect, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';

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

function toCropPixels(area: Area) {
  return {
    x: Math.round(area.x),
    y: Math.round(area.y),
    width: Math.round(area.width),
    height: Math.round(area.height),
  };
}

export function ImageCropDialog({
  file,
  open,
  policy,
  onOpenChange,
  onPrepared,
}: ImageCropDialogProps) {
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [quality, setQuality] = useState(policy.defaultQuality);
  const [aspectRatio, setAspectRatio] = useState(policy.defaultAspectRatio);
  const [cropPixels, setCropPixels] = useState<Area | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!file || !open) return;

    const nextSourceUrl = URL.createObjectURL(file);
    setSourceUrl(nextSourceUrl);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setQuality(policy.defaultQuality);
    setAspectRatio(policy.defaultAspectRatio);
    setCropPixels(null);
    setErrorMessage(null);

    return () => URL.revokeObjectURL(nextSourceUrl);
  }, [file, open, policy.defaultAspectRatio, policy.defaultQuality]);

  const handleApply = async () => {
    if (!file || !cropPixels) {
      setErrorMessage('크롭 영역을 준비하지 못했습니다. 이미지를 다시 선택해주세요.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const preparedImage = await preprocessImageToWebP(file, {
        crop: toCropPixels(cropPixels),
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>이미지 크롭 및 변환</DialogTitle>
          <DialogDescription>
            비율을 선택한 뒤 이미지를 드래그하고 확대 수준을 조절해 원하는 영역을 정하세요.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="relative h-80 overflow-hidden rounded-md bg-muted sm:h-96">
            {sourceUrl && (
              <Cropper
                image={sourceUrl}
                crop={crop}
                zoom={zoom}
                aspect={aspectRatio}
                minZoom={1}
                maxZoom={3}
                showGrid
                onCropChange={setCrop}
                onCropComplete={(_, croppedAreaPixels) => setCropPixels(croppedAreaPixels)}
                onZoomChange={setZoom}
              />
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-medium">
              <span>크롭 비율</span>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                value={String(aspectRatio)}
                disabled={isProcessing}
                onChange={(event) => {
                  setAspectRatio(Number(event.target.value));
                  setCropPixels(null);
                }}
              >
                {policy.aspectRatios.map((option) => (
                  <option key={option.label} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm font-medium">
              <span>확대 수준: {zoom.toFixed(1)}배</span>
              <input
                className="w-full accent-primary"
                type="range"
                min="1"
                max="3"
                step="0.1"
                value={zoom}
                disabled={isProcessing}
                onChange={(event) => setZoom(Number(event.target.value))}
              />
            </label>
          </div>

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
