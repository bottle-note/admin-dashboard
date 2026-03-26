/**
 * 이미지 업로드 컴포넌트
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

/** 파일이 비디오 타입인지 확인 */
export function isVideoFile(file: File | null): boolean;
export function isVideoFile(url: string | null): boolean;
export function isVideoFile(input: File | string | null): boolean {
  if (!input) return false;
  if (typeof input === 'string') {
    return input.match(/\.(mp4|webm|mov)(\?|$)/i) !== null;
  }
  return input.type.startsWith('video/');
}

/**
 * ImageUpload 컴포넌트의 props
 * @param imageUrl - 현재 미디어 URL (초기값 또는 서버에서 로드된 값)
 * @param onImageChange - 미디어 변경 시 호출되는 콜백
 * @param minHeight - 최소 높이 (기본: 200px)
 * @param accept - 허용 파일 타입 (기본: 'image/*')
 * @param onFileRejected - 허용되지 않은 파일 업로드 시 콜백
 * @param description - 업로드 영역 안내 텍스트
 * @param supportText - 지원 포맷 안내 텍스트
 */
export interface ImageUploadProps {
  imageUrl: string | null;
  onImageChange: (file: File | null, previewUrl: string | null) => void;
  minHeight?: number;
  accept?: string;
  onFileRejected?: (file: File) => void;
  description?: string;
  supportText?: string;
}

export function ImageUpload({
  imageUrl,
  onImageChange,
  minHeight = 200,
  accept = DEFAULT_ACCEPT,
  onFileRejected,
  description = '이미지를 드래그하거나 클릭하여 업로드',
  supportText = 'PNG, JPG, WEBP 지원',
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(imageUrl);
  const [isVideo, setIsVideo] = useState(() => isVideoFile(imageUrl));
  const fileInputRef = useRef<HTMLInputElement>(null);
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    setPreviewUrl(imageUrl);
    if (!imageUrl) {
      setIsVideo(false);
    } else if (!imageUrl.startsWith('blob:')) {
      // CDN URL은 확장자로 판별, blob URL은 handleFile에서 설정한 값을 유지
      setIsVideo(isVideoFile(imageUrl));
    }
  }, [imageUrl]);

  const handleFile = useCallback(
    (file: File) => {
      if (!isFileTypeAllowed(file.type, accept)) {
        onFileRejected?.(file);
        return;
      }

      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
      setIsVideo(file.type.startsWith('video/'));
      const url = URL.createObjectURL(file);
      blobUrlRef.current = url;
      setPreviewUrl(url);
      onImageChange(file, url);
    },
    [accept, onFileRejected, onImageChange]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

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
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setPreviewUrl(null);
    setIsVideo(false);
    onImageChange(null, null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {previewUrl ? (
        <div className="relative">
          {isVideo ? (
            <video
              src={previewUrl}
              className="w-full rounded-lg border"
              controls
              muted
              loop
              playsInline
            />
          ) : (
            <img src={previewUrl} alt="업로드된 이미지" className="w-full rounded-lg border" />
          )}
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute right-2 top-2 h-8 w-8"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary/50'
          }`}
          style={{ minHeight }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
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
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  );
}
