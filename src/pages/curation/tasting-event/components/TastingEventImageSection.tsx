import { type ChangeEvent, type DragEvent, useEffect, useRef, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { GripVertical, Upload, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { S3UploadPath, useImageUpload } from '@/hooks/useImageUpload';

import { CurationSectionCard } from '../../components/CurationSectionCard';
import type { TastingEventCreateFormState } from '../tasting-event.schema';

const MAX_IMAGE_COUNT = 3;
const IMAGE_UPLOAD_ACCEPT = 'image/png,image/jpeg,image/webp';
const SUPPORTED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
const EMPTY_IMAGE_URLS: string[] = [];

interface TastingEventImageSectionProps {
  onUploadingChange: (isUploading: boolean) => void;
}

export function TastingEventImageSection({ onUploadingChange }: TastingEventImageSectionProps) {
  const form = useFormContext<TastingEventCreateFormState>();
  const imageUploadInputRef = useRef<HTMLInputElement>(null);
  const imageUrlsRef = useRef<string[]>([]);
  const localImageUrlsRef = useRef<Set<string>>(new Set());
  const [isImageUploadDragging, setIsImageUploadDragging] = useState(false);
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null);
  const [dragOverImageIndex, setDragOverImageIndex] = useState<number | null>(null);
  const watchedImageUrls = useWatch({
    control: form.control,
    name: 'imageUrls',
  });
  const imageUrls = watchedImageUrls ?? EMPTY_IMAGE_URLS;

  const { uploadMultiple: uploadImages, isUploading: isImageUploading } = useImageUpload({
    rootPath: S3UploadPath.CURATION,
  });

  useEffect(() => {
    imageUrlsRef.current = imageUrls;
  }, [imageUrls]);

  useEffect(() => {
    onUploadingChange(isImageUploading);
  }, [isImageUploading, onUploadingChange]);

  useEffect(() => {
    const localImageUrls = localImageUrlsRef.current;

    return () => {
      localImageUrls.forEach((url) => URL.revokeObjectURL(url));
      localImageUrls.clear();
    };
  }, []);

  const updateImageUrls = (nextOrUpdater: string[] | ((current: string[]) => string[])) => {
    const next =
      typeof nextOrUpdater === 'function' ? nextOrUpdater(imageUrlsRef.current) : nextOrUpdater;

    imageUrlsRef.current = next;
    form.setValue('imageUrls', next, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const revokeLocalImageUrl = (url: string) => {
    if (!localImageUrlsRef.current.has(url)) return;

    URL.revokeObjectURL(url);
    localImageUrlsRef.current.delete(url);
  };

  const handleImageFiles = async (fileList: FileList | File[]) => {
    if (isImageUploading) return;

    const remainingCount = MAX_IMAGE_COUNT - imageUrlsRef.current.length;
    if (remainingCount <= 0) return;

    const files = Array.from(fileList)
      .filter((file) => SUPPORTED_IMAGE_TYPES.has(file.type))
      .slice(0, remainingCount);
    if (files.length === 0) return;

    const previewUrls = files.map((file) => {
      const url = URL.createObjectURL(file);
      localImageUrlsRef.current.add(url);
      return url;
    });

    updateImageUrls((current) => [...current, ...previewUrls].slice(0, MAX_IMAGE_COUNT));

    const uploadedUrls = await uploadImages(files);

    if (uploadedUrls.length !== files.length) {
      updateImageUrls((current) => current.filter((url) => !previewUrls.includes(url)));
      previewUrls.forEach(revokeLocalImageUrl);
      return;
    }

    updateImageUrls((current) =>
      current.map((url) => {
        const previewIndex = previewUrls.indexOf(url);
        return previewIndex === -1 ? url : uploadedUrls[previewIndex]!;
      })
    );
    previewUrls.forEach(revokeLocalImageUrl);
  };

  const handleImageInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      void handleImageFiles(files);
    }
    event.target.value = '';
  };

  const handleImageUploadDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsImageUploadDragging(false);
    if (event.dataTransfer.files.length > 0) {
      void handleImageFiles(event.dataTransfer.files);
    }
  };

  const handleRemoveImage = (index: number) => {
    updateImageUrls((current) => {
      const removedUrl = current[index];
      if (removedUrl) {
        revokeLocalImageUrl(removedUrl);
      }
      return current.filter((_, currentIndex) => currentIndex !== index);
    });
  };

  const handleImageDragStart = (index: number, event: DragEvent<HTMLDivElement>) => {
    setDraggedImageIndex(index);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(index));
  };

  const handleImageDragOver = (index: number, event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDragOverImageIndex(index);
  };

  const handleImageDrop = (targetIndex: number, event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const sourceIndex = draggedImageIndex ?? Number(event.dataTransfer.getData('text/plain'));

    if (!Number.isInteger(sourceIndex) || sourceIndex === targetIndex) {
      setDraggedImageIndex(null);
      setDragOverImageIndex(null);
      return;
    }

    updateImageUrls((current) => {
      if (sourceIndex < 0 || sourceIndex >= current.length || targetIndex >= current.length) {
        return current;
      }

      const next = [...current];
      const [movedUrl] = next.splice(sourceIndex, 1);
      if (movedUrl) {
        next.splice(targetIndex, 0, movedUrl);
      }
      return next;
    });
    setDraggedImageIndex(null);
    setDragOverImageIndex(null);
  };

  const handleImageDragEnd = () => {
    setDraggedImageIndex(null);
    setDragOverImageIndex(null);
  };

  return (
    <CurationSectionCard
      title="이미지"
      description="최대 3장까지 등록할 수 있고, 등록된 순서대로 노출됩니다."
      contentClassName="space-y-4"
    >
      <div
        role="button"
        tabIndex={imageUrls.length >= MAX_IMAGE_COUNT || isImageUploading ? -1 : 0}
        aria-label="큐레이션 이미지 업로드"
        aria-disabled={imageUrls.length >= MAX_IMAGE_COUNT || isImageUploading}
        className={`flex min-h-44 flex-col items-center justify-center rounded-lg border-2 border-dashed text-center transition-colors ${
          imageUrls.length >= MAX_IMAGE_COUNT || isImageUploading
            ? 'cursor-not-allowed border-muted-foreground/20 bg-muted/30'
            : isImageUploadDragging
              ? 'cursor-pointer border-primary bg-primary/5'
              : 'cursor-pointer border-muted-foreground/25 hover:border-primary/50'
        }`}
        onClick={() => {
          if (imageUrls.length < MAX_IMAGE_COUNT && !isImageUploading) {
            imageUploadInputRef.current?.click();
          }
        }}
        onKeyDown={(event) => {
          if (
            (event.key === 'Enter' || event.key === ' ') &&
            imageUrls.length < MAX_IMAGE_COUNT &&
            !isImageUploading
          ) {
            event.preventDefault();
            imageUploadInputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (imageUrls.length < MAX_IMAGE_COUNT && !isImageUploading) {
            setIsImageUploadDragging(true);
          }
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setIsImageUploadDragging(false);
        }}
        onDrop={handleImageUploadDrop}
      >
        <Upload className="mb-3 h-10 w-10 text-muted-foreground" aria-hidden="true" />
        <p className="text-sm font-medium text-muted-foreground">
          이미지를 드래그하거나 클릭하여 업로드
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          PNG, JPG, WEBP 지원 · {imageUrls.length}/{MAX_IMAGE_COUNT}
        </p>
      </div>

      <input
        ref={imageUploadInputRef}
        type="file"
        accept={IMAGE_UPLOAD_ACCEPT}
        multiple
        className="hidden"
        aria-label="큐레이션 이미지 파일 선택"
        onChange={handleImageInputChange}
      />

      {imageUrls.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          {imageUrls.map((imageUrl, index) => (
            <div
              key={imageUrl}
              draggable
              aria-label={`큐레이션 이미지 ${index + 1} 순서 변경`}
              className={`group relative overflow-hidden rounded-lg border bg-muted transition-colors ${
                dragOverImageIndex === index ? 'border-primary bg-primary/5' : ''
              }`}
              onDragStart={(event) => handleImageDragStart(index, event)}
              onDragOver={(event) => handleImageDragOver(index, event)}
              onDragLeave={() => setDragOverImageIndex(null)}
              onDrop={(event) => handleImageDrop(index, event)}
              onDragEnd={handleImageDragEnd}
            >
              <img
                src={imageUrl}
                alt={`큐레이션 이미지 ${index + 1}`}
                className="aspect-video w-full object-cover"
              />
              <div className="absolute left-2 top-2 rounded bg-background/90 px-2 py-1 text-xs font-medium shadow">
                {index === 0 ? '대표' : index + 1}
              </div>
              <GripVertical
                className="absolute bottom-2 left-2 h-4 w-4 text-background drop-shadow"
                aria-hidden="true"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute right-2 top-2 h-7 w-7"
                aria-label={`큐레이션 이미지 ${index + 1} 삭제`}
                onClick={() => handleRemoveImage(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {form.formState.errors.imageUrls?.message && (
        <p className="text-sm text-destructive">{form.formState.errors.imageUrls.message}</p>
      )}
      {isImageUploading && <p className="text-sm text-muted-foreground">이미지 업로드 중...</p>}
    </CurationSectionCard>
  );
}
