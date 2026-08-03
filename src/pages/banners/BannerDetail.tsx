import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router';
import { Save, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { DetailPageHeader } from '@/components/common/DetailPageHeader';
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog';
import { useToast } from '@/hooks/useToast';
import { useFileUpload, S3UploadPath } from '@/hooks/useFileUpload';
import { extractVideoPoster } from '@/lib/video-poster';

import { useBannerDetailForm } from './useBannerDetailForm';
import { useCurationList } from '@/hooks/useCurations';

import { BannerBasicInfoCard } from './components/BannerBasicInfoCard';
import { BannerTextSettingsCard } from './components/BannerTextSettingsCard';
import { BannerLinkSettingsCard } from './components/BannerLinkSettingsCard';
import { BannerMediaCard } from './components/BannerMediaCard';
import { BannerExposureCard } from './components/BannerExposureCard';
import { BannerPreviewCard } from './components/BannerPreviewCard';

type BannerMediaUploadResult =
  | {
      mediaType: 'IMAGE';
      imageUrl: string;
    }
  | {
      mediaType: 'VIDEO';
      imageUrl: string;
      posterUrl: string;
    };

export function BannerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();

  const { form, isLoading, isNewMode, isPending, bannerData, onSubmit, handleBack, handleDelete } =
    useBannerDetailForm(id);

  const {
    upload: uploadFile,
    uploadMultiple: uploadFiles,
    isUploading,
  } = useFileUpload({ rootPath: S3UploadPath.BANNER });

  const { data: curationData } = useCurationList({ isActive: true });
  const curations = curationData?.items ?? [];

  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(null);
  const [posterPreviewUrl, setPosterPreviewUrl] = useState<string | null>(null);
  const [isExtractingPoster, setIsExtractingPoster] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const localPosterUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (localPosterUrlRef.current) {
      URL.revokeObjectURL(localPosterUrlRef.current);
      localPosterUrlRef.current = null;
    }

    if (bannerData) {
      setMediaPreviewUrl(bannerData.imageUrl);
      setPosterPreviewUrl(bannerData.posterUrl);
      setMediaError(null);
    } else if (isNewMode) {
      setMediaPreviewUrl(null);
      setPosterPreviewUrl(null);
      setMediaError(null);
    }
  }, [bannerData, isNewMode]);

  useEffect(() => {
    return () => {
      if (localPosterUrlRef.current) {
        URL.revokeObjectURL(localPosterUrlRef.current);
      }
    };
  }, []);

  const uploadImageBanner = async (imageFile: File): Promise<BannerMediaUploadResult> => {
    const imageUrl = await uploadFile(imageFile);
    if (!imageUrl) {
      throw new Error('배너 이미지 업로드에 실패했습니다.');
    }

    return { mediaType: 'IMAGE', imageUrl };
  };

  const uploadVideoBanner = async (videoFile: File): Promise<BannerMediaUploadResult> => {
    setIsExtractingPoster(true);

    let posterFile: File;
    try {
      posterFile = await extractVideoPoster(videoFile);
    } finally {
      setIsExtractingPoster(false);
    }

    if (localPosterUrlRef.current) {
      URL.revokeObjectURL(localPosterUrlRef.current);
    }
    const localPosterUrl = URL.createObjectURL(posterFile);
    localPosterUrlRef.current = localPosterUrl;
    setPosterPreviewUrl(localPosterUrl);

    const [imageUrl, posterUrl] = await uploadFiles([videoFile, posterFile]);
    if (!imageUrl || !posterUrl) {
      throw new Error('배너 동영상 업로드에 실패했습니다.');
    }

    return { mediaType: 'VIDEO', imageUrl, posterUrl };
  };

  const handleBannerMediaChange = async (file: File | null, previewUrl: string | null) => {
    setMediaPreviewUrl(previewUrl);
    setMediaError(null);
    form.clearErrors(['imageUrl', 'posterUrl']);

    if (localPosterUrlRef.current) {
      URL.revokeObjectURL(localPosterUrlRef.current);
      localPosterUrlRef.current = null;
    }
    setPosterPreviewUrl(null);

    if (!file) {
      form.setValue('mediaType', 'IMAGE', { shouldDirty: true });
      form.setValue('imageUrl', '', { shouldDirty: true });
      form.setValue('posterUrl', undefined, { shouldDirty: true });
      return;
    }

    form.setValue('imageUrl', '', { shouldDirty: true });
    form.setValue('posterUrl', undefined, { shouldDirty: true });

    try {
      let result: BannerMediaUploadResult;

      if (file.type === 'video/mp4') {
        form.setValue('mediaType', 'VIDEO', { shouldDirty: true });
        result = await uploadVideoBanner(file);
      } else if (file.type.startsWith('image/')) {
        form.setValue('mediaType', 'IMAGE', { shouldDirty: true });
        result = await uploadImageBanner(file);
      } else {
        throw new Error('지원하지 않는 배너 미디어 형식입니다.');
      }

      form.setValue('mediaType', result.mediaType, { shouldDirty: true });
      form.setValue('imageUrl', result.imageUrl, {
        shouldDirty: true,
        shouldValidate: true,
      });
      form.setValue('posterUrl', result.mediaType === 'VIDEO' ? result.posterUrl : undefined, {
        shouldDirty: true,
        shouldValidate: true,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '배너 미디어 처리에 실패했습니다.';
      const retryMessage = `${message} 파일을 다시 선택해주세요.`;
      setMediaError(retryMessage);
      showToast({ type: 'error', message: retryMessage });

      if (file.type === 'video/mp4') {
        form.setError('posterUrl', { message: retryMessage });
      } else {
        form.setError('imageUrl', { message: retryMessage });
      }
    }
  };

  const handleSubmit = form.handleSubmit((data) => {
    onSubmit(data);
  });

  const handleDeleteConfirm = () => {
    handleDelete();
    setIsDeleteDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <DetailPageHeader
        title={isNewMode ? '배너 등록' : '배너 수정'}
        subtitle={bannerData ? `ID: ${id}` : undefined}
        onBack={handleBack}
        actions={
          <>
            {bannerData && (
              <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
                <Trash2 className="mr-2 h-4 w-4" />
                삭제
              </Button>
            )}
            <Button
              onClick={handleSubmit}
              disabled={isPending || isExtractingPoster || isUploading}
            >
              <Save className="mr-2 h-4 w-4" />
              {isPending ? '저장 중...' : isNewMode ? '등록' : '저장'}
            </Button>
          </>
        }
      />

      {isLoading ? (
        <div className="py-8 text-center text-muted-foreground">로딩 중...</div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <BannerBasicInfoCard form={form} />
            <BannerTextSettingsCard form={form} />
            <BannerLinkSettingsCard form={form} curations={curations} />
          </div>

          <div className="space-y-6">
            <BannerMediaCard
              mediaPreviewUrl={mediaPreviewUrl}
              posterPreviewUrl={posterPreviewUrl}
              mediaType={form.watch('mediaType')}
              onMediaChange={handleBannerMediaChange}
              isExtractingPoster={isExtractingPoster}
              isUploading={isUploading}
              error={
                mediaError ??
                form.formState.errors.imageUrl?.message ??
                form.formState.errors.posterUrl?.message
              }
            />
            <BannerExposureCard form={form} />
            <BannerPreviewCard
              form={form}
              mediaPreviewUrl={mediaPreviewUrl}
              posterPreviewUrl={posterPreviewUrl}
            />
          </div>
        </div>
      )}

      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="배너 삭제"
        description="정말 이 배너를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
      />
    </div>
  );
}
