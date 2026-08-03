/**
 * 이미지와 동영상 파일 선택 컴포넌트
 * - 드래그 앤 드롭 지원
 * - 클릭하여 파일 선택
 * - 미리보기 및 삭제 기능
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  accept?: string;
  onFileRejected?: (file: File) => void;
  description?: string;
  supportText?: string;
  disabled?: boolean;
}

export function MediaUpload({
  mediaUrl,
  mediaType = 'IMAGE',
  onMediaChange,
  minHeight = 200,
  accept = DEFAULT_ACCEPT,
  onFileRejected,
  description = '이미지를 드래그하거나 클릭하여 업로드',
  supportText = 'PNG, JPG, WEBP 지원',
  disabled = false,
}: MediaUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedMediaType, setSelectedMediaType] = useState<'IMAGE' | 'VIDEO' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const blobUrlRef = useRef<string | null>(null);
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

  const handleFile = useCallback(
    (file: File) => {
      if (disabled) return;

      if (!isFileTypeAllowed(file.type, accept)) {
        onFileRejected?.(file);
        return;
      }

      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
      setSelectedMediaType(file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE');
      const url = URL.createObjectURL(file);
      blobUrlRef.current = url;
      onMediaChange(file, url);
    },
    [accept, disabled, onFileRejected, onMediaChange]
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
    onMediaChange(null, null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {mediaUrl ? (
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
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        disabled={disabled}
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  );
}
