/**
 * 이미지 업로드 컴포넌트
 * - 드래그 앤 드롭 지원
 * - 클릭하여 파일 선택
 * - 미리보기 및 삭제 기능
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * ImageUpload 컴포넌트의 props
 * @param imageUrl - 현재 이미지 URL (초기값 또는 서버에서 로드된 값)
 * @param onImageChange - 이미지 변경 시 호출되는 콜백
 * @param minHeight - 최소 높이 (기본: 200px)
 */
export interface ImageUploadProps {
  imageUrl: string | null;
  onImageChange: (file: File | null, previewUrl: string | null) => void;
  minHeight?: number;
}

export function ImageUpload({ imageUrl, onImageChange, minHeight = 200 }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(imageUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPreviewUrl(imageUrl);
  }, [imageUrl]);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) {
        return;
      }

      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      onImageChange(file, url);
    },
    [onImageChange]
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
    setPreviewUrl(null);
    onImageChange(null, null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {previewUrl ? (
        <div className="relative">
          <img src={previewUrl} alt="업로드된 이미지" className="w-full rounded-lg border" />
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
          <p className="text-sm text-muted-foreground">이미지를 드래그하거나 클릭하여 업로드</p>
          <p className="mt-1 text-xs text-muted-foreground">PNG, JPG, WEBP 지원</p>
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  );
}
