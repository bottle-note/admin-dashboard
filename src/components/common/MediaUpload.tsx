/**
 * 이미지와 동영상 파일 선택 컴포넌트
 * - 드래그 앤 드롭 지원
 * - 클릭하여 파일 선택
 * - 미리보기 및 삭제 기능
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PreparedImage } from '@/lib/image-preprocessing';

import { ImageCropDialog } from './ImageCropDialog';
import type { ImageProcessingPolicy } from './image-processing-policy';

/** 허용 파일 타입 */
const DEFAULT_ACCEPT = 'image/*';

/**
 * 파일 MIME 타입이 허용 목록에 포함되는지 확인
 * @param fileType - 파일의 MIME 타입 (예: 'image/webp', 'video/mp4')
 * @param accept - accept 속성 문자열 (예: 'image/*,video/mp4')
 */
export function isFileTypeAllowed(fileType: string, accept: string): boolean {
  return accept.split(',').some((pattern) => {
    const trimmed = pattern.trim();
    if (trimmed.endsWith('/*')) {
      return fileType.startsWith(trimmed.replace('/*', '/'));
    }
    return fileType === trimmed;
  });
}

/** 선택한 파일이 동영상인지 확인한다. */
export function isVideoFile(file: File | null): boolean {
  return file?.type.startsWith('video/') ?? false;
}

/**
 * MediaUpload 컴포넌트의 props
 * @param mediaUrl - 현재 미디어 URL (초기값 또는 서버에서 로드된 값)
 * @param mediaType - 서버 URL의 미디어 유형. URL 확장자로 유형을 추론하지 않는다.
 * @param onMediaChange - 미디어 변경 시 호출되는 콜백
 * @param minHeight - 최소 높이 (기본: 200px)
 * @param accept - 허용 파일 타입 (기본: 'image/*')
 * @param onFileRejected - 허용되지 않은 파일 업로드 시 콜백
 * @param description - 업로드 영역 안내 텍스트
 * @param supportText - 지원 포맷 안내 텍스트
 */
export interface MediaUploadProps {
  mediaUrl: string | null;
  mediaType?: 'IMAGE' | 'VIDEO';
  onMediaChange: (file: File | null, previewUrl: string | null) => void;
  minHeight?: number;
  variant?: 'default' | 'compact';
  label?: string;
  accept?: string;
  onFileRejected?: (file: File) => void;
  description?: string;
  supportText?: string;
  disabled?: boolean;
  imageProcessingPolicy?: ImageProcessingPolicy;
  /** 현재 mediaUrl에 해당하는 파일을 제공하면 compact에서 다시 크롭할 수 있다. */
  loadImageFile?: () => Promise<File>;
}

export function MediaUpload({
  mediaUrl,
  mediaType = 'IMAGE',
  onMediaChange,
  minHeight = 200,
  variant = 'default',
  label = '이미지',
  accept = DEFAULT_ACCEPT,
  onFileRejected,
  description = '이미지를 드래그하거나 클릭하여 업로드',
  supportText = 'PNG, JPG, WEBP 지원',
  disabled = false,
  imageProcessingPolicy,
  loadImageFile,
}: MediaUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedMediaType, setSelectedMediaType] = useState<'IMAGE' | 'VIDEO' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const blobUrlRef = useRef<string | null>(null);
  const [cropTargetFile, setCropTargetFile] = useState<File | null>(null);
  const [isLoadingEdit, setIsLoadingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const editRequest = useRef(0);
  const canEdit = !!mediaUrl && mediaType === 'IMAGE' && !!imageProcessingPolicy && !!loadImageFile;
  useEffect(
    () => () => {
      editRequest.current += 1;
    },
    [mediaUrl, disabled]
  );

  const handleEdit = async () => {
    if (disabled || isLoadingEdit || !canEdit || !loadImageFile || !imageProcessingPolicy) return;
    const request = ++editRequest.current;
    setIsLoadingEdit(true);
    setEditError(null);
    try {
      const file = await loadImageFile();
      if (request !== editRequest.current) return;
      if (!imageProcessingPolicy.allowedMimeTypes.includes(file.type))
        throw new Error('JPG, PNG, WEBP 이미지만 수정할 수 있습니다. 파일을 교체해주세요.');
      setCropTargetFile(file);
    } catch {
      if (request === editRequest.current)
        setEditError('이미지를 불러오지 못했습니다. 다시 시도하거나 파일을 교체해주세요.');
    } finally {
      setIsLoadingEdit(false);
    }
  };
  const inputAccept = imageProcessingPolicy
    ? [
        ...imageProcessingPolicy.allowedMimeTypes,
        ...accept
          .split(',')
          .map((pattern) => pattern.trim())
          .filter((pattern) => !pattern.startsWith('image/')),
      ].join(',')
    : accept;
  const isVideo = mediaUrl?.startsWith('blob:')
    ? selectedMediaType === 'VIDEO'
    : mediaType === 'VIDEO';

  useEffect(() => {
    return () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    };
  }, []);

  useEffect(() => {
    if (blobUrlRef.current && mediaUrl !== blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
  }, [mediaUrl]);

  const commitFile = useCallback(
    (file: File) => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
      setSelectedMediaType(file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE');
      const url = URL.createObjectURL(file);
      blobUrlRef.current = url;
      onMediaChange(file, url);
    },
    [onMediaChange]
  );

  const handleFile = useCallback(
    (file: File) => {
      if (disabled || isLoadingEdit) return;
      setEditError(null);

      if (!isFileTypeAllowed(file.type, accept)) {
        onFileRejected?.(file);
        return;
      }

      if (file.type.startsWith('image/') && imageProcessingPolicy) {
        if (!imageProcessingPolicy.allowedMimeTypes.includes(file.type)) {
          onFileRejected?.(file);
          return;
        }

        setCropTargetFile(file);
        return;
      }

      commitFile(file);
    },
    [accept, commitFile, disabled, isLoadingEdit, imageProcessingPolicy, onFileRejected]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) {
      handleFile(file);
    }
  };

  const handleRemove = () => {
    if (disabled) return;

    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setSelectedMediaType(null);
    setEditError(null);
    onMediaChange(null, null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCropDialogOpenChange = (open: boolean) => {
    if (!open) setCropTargetFile(null);
  };

  const handlePreparedImage = (preparedImage: PreparedImage) => {
    commitFile(preparedImage.file);
  };

  return (
    <div className="space-y-4">
      {variant === 'compact' ? (
        <div
          className="flex items-center gap-2"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <button
            type="button"
            aria-label={`${label} 미리보기 · ${canEdit ? '수정' : mediaUrl ? '교체' : '추가'}`}
            disabled={disabled || isLoadingEdit}
            onClick={() => (canEdit ? void handleEdit() : fileInputRef.current?.click())}
            className={`flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md border disabled:opacity-50 ${mediaUrl ? '' : 'border-dashed'} ${isDragging ? 'border-primary bg-primary/5' : ''}`}
          >
            {mediaUrl ? (
              <img src={mediaUrl} alt={label} className="h-full w-full object-contain" />
            ) : (
              <Plus className="h-5 w-5 text-muted-foreground" />
            )}
          </button>
          <div className="flex flex-wrap gap-1">
            {canEdit && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled || isLoadingEdit}
                aria-label={`${label} 수정`}
                onClick={() => void handleEdit()}
              >
                {isLoadingEdit ? '불러오는 중...' : '수정'}
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled || isLoadingEdit}
              aria-label={`${label} ${mediaUrl ? '교체' : '추가'}`}
              onClick={() => fileInputRef.current?.click()}
            >
              {mediaUrl ? '교체' : '추가'}
            </Button>
            {mediaUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled || isLoadingEdit}
                aria-label={`${label} 제거`}
                onClick={handleRemove}
              >
                제거
              </Button>
            )}
          </div>
        </div>
      ) : mediaUrl ? (
        <div className="relative">
          {isVideo ? (
            <video
              src={mediaUrl}
              className="w-full rounded-lg border"
              controls
              muted
              loop
              playsInline
            />
          ) : (
            <img src={mediaUrl} alt="업로드된 이미지" className="w-full rounded-lg border" />
          )}
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute right-2 top-2 h-8 w-8"
            disabled={disabled}
            aria-label={`${label} 제거`}
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
            disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
          } ${
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary/50'
          }`}
          style={{ minHeight }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => {
            if (!disabled) fileInputRef.current?.click();
          }}
        >
          <Upload className="mb-2 h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{description}</p>
          <p className="mt-1 text-xs text-muted-foreground">{supportText}</p>
        </div>
      )}
      {variant === 'compact' && editError && (
        <p role="alert" className="max-w-64 text-xs text-destructive">
          {editError}
        </p>
      )}
      <input
        ref={fileInputRef}
        type="file"
        aria-label={`${label} 파일 선택`}
        accept={inputAccept}
        disabled={disabled || isLoadingEdit}
        className="hidden"
        onChange={handleFileSelect}
      />
      {imageProcessingPolicy && (
        <ImageCropDialog
          file={cropTargetFile}
          open={cropTargetFile !== null}
          policy={imageProcessingPolicy}
          onOpenChange={handleCropDialogOpenChange}
          onPrepared={handlePreparedImage}
          applyLabel={variant === 'compact' && loadImageFile ? '이미지 저장' : undefined}
          initialCropPercent={variant === 'compact' && loadImageFile ? 100 : undefined}
        />
      )}
    </div>
  );
}
