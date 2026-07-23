import {
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from 'react';
import { ImagePlus, RotateCcw, Upload, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { PreparedImage } from '@/lib/image-preprocessing';

import { ImageCropDialog } from './ImageCropDialog';

export interface ImageAspectRatioOption {
  label: string;
  /** null이면 크롭 영역의 가로·세로 비율을 고정하지 않는다. */
  value: number | null;
}

export interface ImageProcessingPolicy {
  allowedMimeTypes: readonly string[];
  aspectRatios: readonly ImageAspectRatioOption[];
  defaultAspectRatio: number | null;
  defaultQuality: number;
  maxInputBytes: number;
  maxOutputBytes: number;
  maxOutputLongEdge: number;
}

interface PreparedImageFieldProps {
  /** 서버에 저장된 기존 이미지 URL. local blob URL은 전달하지 않는다. */
  currentImageUrl: string | null;
  /** 아직 저장되지 않은 WebP 전처리 결과. */
  preparedImage: PreparedImage | null;
  policy: ImageProcessingPolicy;
  onPreparedImageChange: (preparedImage: PreparedImage) => void;
  onCancelPreparedImage: () => void;
  onRemoveImage: () => void;
  disabled?: boolean;
  errorMessage?: string;
}

function formatByteSize(byteSize: number) {
  if (byteSize < 1000) return `${byteSize} B`;

  const units = ['KB', 'MB', 'GB'];
  let value = byteSize;
  let unitIndex = -1;

  while (value >= 1000 && unitIndex < units.length - 1) {
    value /= 1000;
    unitIndex += 1;
  }

  const formattedValue =
    value >= 10 ? value.toFixed(0) : Number.isInteger(value) ? String(value) : value.toFixed(1);
  return `${formattedValue} ${units[unitIndex]}`;
}

function formatSizeDelta(originalByteSize: number, outputByteSize: number) {
  if (originalByteSize <= 0) return '-';

  const percentage = ((outputByteSize - originalByteSize) / originalByteSize) * 100;
  return `${percentage > 0 ? '+' : ''}${percentage.toFixed(1)}%`;
}

export function PreparedImageField({
  currentImageUrl,
  preparedImage,
  policy,
  onPreparedImageChange,
  onCancelPreparedImage,
  onRemoveImage,
  disabled = false,
  errorMessage,
}: PreparedImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false);
  const preparedPreviewUrlRef = useRef<string | null>(null);
  const [preparedPreviewUrl, setPreparedPreviewUrl] = useState<string | null>(null);

  const clearPreparedPreview = () => {
    const currentPreviewUrl = preparedPreviewUrlRef.current;
    if (currentPreviewUrl) URL.revokeObjectURL(currentPreviewUrl);

    preparedPreviewUrlRef.current = null;
    setPreparedPreviewUrl(null);
  };

  useEffect(() => {
    return () => {
      const currentPreviewUrl = preparedPreviewUrlRef.current;
      if (currentPreviewUrl) URL.revokeObjectURL(currentPreviewUrl);
    };
  }, []);

  useEffect(() => {
    if (preparedImage !== null) return;

    const currentPreviewUrl = preparedPreviewUrlRef.current;
    if (currentPreviewUrl) URL.revokeObjectURL(currentPreviewUrl);
    preparedPreviewUrlRef.current = null;
  }, [preparedImage]);

  const handleFile = (file: File | undefined) => {
    if (!file || disabled) return;

    if (!policy.allowedMimeTypes.includes(file.type)) {
      setSelectionError('JPG, PNG, WEBP 이미지만 선택할 수 있습니다.');
      return;
    }

    if (file.size > policy.maxInputBytes) {
      setSelectionError(`원본 이미지는 ${formatByteSize(policy.maxInputBytes)} 이하여야 합니다.`);
      return;
    }

    setSelectionError(null);
    setSelectedFile(file);
    setIsCropDialogOpen(true);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFile(event.target.files?.[0]);
    event.target.value = '';
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    handleFile(event.dataTransfer.files[0]);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (disabled || (event.key !== 'Enter' && event.key !== ' ')) return;

    event.preventDefault();
    inputRef.current?.click();
  };

  const handleCropDialogOpenChange = (open: boolean) => {
    setIsCropDialogOpen(open);
    if (!open) setSelectedFile(null);
  };

  const handlePrepared = (nextPreparedImage: PreparedImage) => {
    clearPreparedPreview();
    const nextPreviewUrl = URL.createObjectURL(nextPreparedImage.file);
    preparedPreviewUrlRef.current = nextPreviewUrl;
    setPreparedPreviewUrl(nextPreviewUrl);
    setSelectionError(null);
    onPreparedImageChange(nextPreparedImage);
  };

  const handleCancelPrepared = () => {
    clearPreparedPreview();
    setSelectionError(null);
    onCancelPreparedImage();
  };

  const handleRemove = () => {
    clearPreparedPreview();
    setSelectionError(null);
    onRemoveImage();
  };

  const visibleImageUrl = (preparedImage ? preparedPreviewUrl : null) ?? currentImageUrl;
  const isPendingImage = preparedImage !== null;
  const hasImage = visibleImageUrl !== null;
  const accept = policy.allowedMimeTypes.join(',');

  return (
    <div className="space-y-4">
      {hasImage ? (
        <div className="overflow-hidden rounded-lg border bg-muted/20">
          <img
            src={visibleImageUrl}
            alt="선택한 이미지 미리보기"
            className="aspect-square w-full object-cover"
          />
          <div className="space-y-3 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium">
                {isPendingImage ? '새 이미지 (저장 전)' : '현재 저장된 이미지'}
              </p>
              {isPendingImage && (
                <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                  저장 시 업로드
                </span>
              )}
            </div>

            {preparedImage && (
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>
                  원본 {preparedImage.metadata.original.width} ×{' '}
                  {preparedImage.metadata.original.height} ·{' '}
                  {formatByteSize(preparedImage.metadata.original.byteSize)}
                </p>
                <p>
                  결과 {preparedImage.metadata.output.width} ×{' '}
                  {preparedImage.metadata.output.height} ·{' '}
                  {formatByteSize(preparedImage.metadata.output.byteSize)} ·{' '}
                  {formatSizeDelta(
                    preparedImage.metadata.original.byteSize,
                    preparedImage.metadata.output.byteSize
                  )}
                </p>
                <p>WebP 품질 {preparedImage.metadata.output.quality}%</p>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled}
                onClick={() => inputRef.current?.click()}
              >
                <ImagePlus className="mr-2 h-4 w-4" />
                이미지 교체
              </Button>
              {isPendingImage && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={disabled}
                  onClick={handleCancelPrepared}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  변경 취소
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled}
                onClick={handleRemove}
              >
                <X className="mr-2 h-4 w-4" />
                이미지 삭제
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-disabled={disabled}
          className={`flex min-h-56 flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 text-center transition-colors ${
            disabled
              ? 'cursor-not-allowed border-muted-foreground/20 bg-muted/30'
              : isDragging
                ? 'cursor-pointer border-primary bg-primary/5'
                : 'cursor-pointer border-muted-foreground/25 hover:border-primary/50'
          }`}
          onClick={() => !disabled && inputRef.current?.click()}
          onKeyDown={handleKeyDown}
          onDragOver={(event) => {
            event.preventDefault();
            if (!disabled) setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <Upload className="mb-3 h-10 w-10 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm font-medium text-muted-foreground">
            이미지를 드래그하거나 클릭하여 선택
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            JPG, PNG, WEBP · 최대 {formatByteSize(policy.maxInputBytes)} · 저장 전 크롭/품질 조절
            가능
          </p>
        </div>
      )}

      <input
        ref={inputRef}
        className="hidden"
        type="file"
        accept={accept}
        aria-label="이미지 파일 선택"
        onChange={handleInputChange}
      />

      {(selectionError || errorMessage) && (
        <p className="text-sm text-destructive">{selectionError ?? errorMessage}</p>
      )}

      <ImageCropDialog
        file={selectedFile}
        open={isCropDialogOpen}
        policy={policy}
        onOpenChange={handleCropDialogOpenChange}
        onPrepared={handlePrepared}
      />
    </div>
  );
}
