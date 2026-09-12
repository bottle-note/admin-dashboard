import { useEffect, useRef, useState } from 'react';
import { DEFAULT_IMAGE_PROCESSING_POLICY } from '@/components/common/image-processing-policy';
import { preprocessImageToWebP } from '@/lib/image-preprocessing';
import { s3Service } from '@/services/s3.service';
import { S3UploadPath } from '@/types/api/s3.api';

export interface BulkAlcoholImage {
  url: string | null;
  /** 현재 성공 URL과 같은 이미지. 실패한 교체 파일과 구분한다. */
  editFile?: File;
  file?: File;
  prepared?: boolean;
  uploading?: boolean;
  error?: string;
}

/** 행별 성공 URL과 실패 파일을 보존한다. 새 Excel 검증은 별도 세션이다. */
export function useBulkAlcoholImages() {
  const [images, setImages] = useState<Record<string, BulkAlcoholImage>>({});
  const [isUploading, setIsUploading] = useState(false);
  const generation = useRef(0);
  const busy = useRef(false);

  useEffect(
    () => () => {
      generation.current += 1;
    },
    []
  );

  const reset = (initial: Record<string, BulkAlcoholImage> = {}) => {
    generation.current += 1;
    busy.current = false;
    setIsUploading(false);
    setImages(initial);
  };

  const upload = async (entries: { clientRowId: string; file: File; prepared?: boolean }[]) => {
    if (busy.current || entries.length === 0) return;
    busy.current = true;
    setIsUploading(true);
    const currentGeneration = generation.current;
    let nextIndex = 0;
    const results: Record<string, boolean> = {};
    setImages((current) => {
      const next = { ...current };
      for (const entry of entries)
        next[entry.clientRowId] = {
          ...current[entry.clientRowId],
          url: current[entry.clientRowId]?.url ?? null,
          file: entry.file,
          prepared: entry.prepared,
          uploading: true,
        };
      return next;
    });
    await Promise.all(
      Array.from({ length: Math.min(3, entries.length) }, async () => {
        while (nextIndex < entries.length && currentGeneration === generation.current) {
          const entry = entries[nextIndex++];
          if (!entry) return;
          try {
            let file = entry.file;
            if (!entry.prepared) {
              const policy = DEFAULT_IMAGE_PROCESSING_POLICY;
              if (!policy.allowedMimeTypes.includes(file.type))
                throw new Error('JPG, PNG, WEBP 이미지만 사용할 수 있습니다.');
              const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
              const crop = { x: 0, y: 0, width: bitmap.width, height: bitmap.height };
              bitmap.close();
              file = (
                await preprocessImageToWebP(file, {
                  ...policy,
                  quality: policy.defaultQuality,
                  crop,
                })
              ).file;
            }
            if (currentGeneration !== generation.current) return;
            setImages((current) => ({
              ...current,
              [entry.clientRowId]: {
                ...current[entry.clientRowId],
                url: current[entry.clientRowId]?.url ?? null,
                file,
                prepared: true,
                uploading: true,
              },
            }));
            const url = await s3Service.uploadFile(file, S3UploadPath.ALCOHOL);
            if (currentGeneration !== generation.current) return;
            results[entry.clientRowId] = true;
            setImages((current) => ({ ...current, [entry.clientRowId]: { url, editFile: file } }));
          } catch (error) {
            if (currentGeneration !== generation.current) return;
            results[entry.clientRowId] = false;
            setImages((current) => ({
              ...current,
              [entry.clientRowId]: {
                ...current[entry.clientRowId],
                url: current[entry.clientRowId]?.url ?? null,
                uploading: false,
                error: error instanceof Error ? error.message : '이미지 업로드에 실패했습니다.',
              },
            }));
          }
        }
      })
    );
    if (currentGeneration === generation.current) {
      busy.current = false;
      setIsUploading(false);
    }
    return results;
  };

  const remove = (id: string) => setImages((current) => ({ ...current, [id]: { url: null } }));
  const dismissError = (id: string) =>
    setImages((current) => ({
      ...current,
      [id]: { url: current[id]?.url ?? null, editFile: current[id]?.editFile },
    }));
  const getImageFile = async (id: string) => {
    const image = images[id];
    if (image?.editFile) return image.editFile;
    if (!image?.url) throw new Error('수정할 이미지가 없습니다.');
    return s3Service.downloadImage(image.url);
  };
  return { images, isUploading, reset, upload, remove, dismissError, getImageFile };
}
