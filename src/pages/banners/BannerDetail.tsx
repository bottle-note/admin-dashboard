import { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { Save, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { DetailPageHeader } from '@/components/common/DetailPageHeader';
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog';

import { useBannerDetailForm } from './useBannerDetailForm';
import { useImageUpload, S3UploadPath } from '@/hooks/useImageUpload';
import { useCurationList } from '@/hooks/useCurations';

import { BannerBasicInfoCard } from './components/BannerBasicInfoCard';
import { BannerTextSettingsCard } from './components/BannerTextSettingsCard';
import { BannerLinkSettingsCard } from './components/BannerLinkSettingsCard';
import { BannerImageCard } from './components/BannerImageCard';
import { BannerExposureCard } from './components/BannerExposureCard';
import { BannerPreviewCard } from './components/BannerPreviewCard';

export function BannerDetailPage() {
  const { id } = useParams<{ id: string }>();

  const {
    form,
    isLoading,
    isNewMode,
    isPending,
    bannerData,
    onSubmit,
    handleBack,
    handleDelete,
  } = useBannerDetailForm(id);

  const { upload: uploadImage, isUploading: isImageUploading } = useImageUpload({
    rootPath: S3UploadPath.BANNER,
  });

  const { data: curationData } = useCurationList();
  const curations = curationData?.items ?? [];

  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (bannerData) {
      setImagePreviewUrl(bannerData.imageUrl);
    }
  }, [bannerData]);

  const handleImageChange = async (file: File | null, previewUrl: string | null) => {
    setImagePreviewUrl(previewUrl);

    if (file) {
      const viewUrl = await uploadImage(file);
      if (viewUrl) {
        form.setValue('imageUrl', viewUrl);
      } else {
        form.setValue('imageUrl', previewUrl ?? '');
      }
    } else {
      form.setValue('imageUrl', previewUrl ?? '');
    }
  };

  const handleSubmit = form.handleSubmit(
    (data) => {
      onSubmit(data, { imagePreviewUrl });
    },
    (errors) => {
      console.log('[DEBUG] Form validation errors:', errors);
    }
  );

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
            <Button onClick={handleSubmit} disabled={isPending || isImageUploading}>
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
            <BannerImageCard
              imagePreviewUrl={imagePreviewUrl}
              onImageChange={handleImageChange}
              isUploading={isImageUploading}
              error={form.formState.errors.imageUrl?.message}
            />
            <BannerExposureCard form={form} />
            <BannerPreviewCard form={form} imagePreviewUrl={imagePreviewUrl} />
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
