import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageUpload } from '@/components/common/ImageUpload';
import { useToast } from '@/hooks/useToast';
import type { MediaType } from '@/types/api';

/** 배너에서 허용하는 파일 타입 */
const BANNER_ACCEPT = 'image/*,video/mp4';

interface BannerImageCardProps {
  imagePreviewUrl: string | null;
  onImageChange: (file: File | null, previewUrl: string | null) => void;
  onMediaTypeChange: (mediaType: MediaType) => void;
  isUploading: boolean;
  error?: string;
}

export function BannerImageCard({
  imagePreviewUrl,
  onImageChange,
  onMediaTypeChange,
  isUploading,
  error,
}: BannerImageCardProps) {
  const { showToast } = useToast();

  const handleImageChange = (file: File | null, previewUrl: string | null) => {
    if (file) {
      onMediaTypeChange(file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE');
    }
    onImageChange(file, previewUrl);
  };

  const handleFileRejected = (file: File) => {
    showToast({
      type: 'error',
      message: `지원하지 않는 파일 형식입니다: ${file.name}. 이미지(PNG, JPG, WEBP) 또는 동영상(MP4)만 업로드 가능합니다.`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>배너 미디어 *</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ImageUpload
          imageUrl={imagePreviewUrl}
          onImageChange={handleImageChange}
          onFileRejected={handleFileRejected}
          accept={BANNER_ACCEPT}
          description="파일을 드래그하거나 클릭하여 업로드"
          supportText="이미지(PNG, JPG, WEBP) 또는 동영상(MP4) 지원"
          minHeight={200}
        />
        <p className="text-sm text-muted-foreground">
          권장 사이즈: 936x454px (2x 기준, 비율 약 2:1)
        </p>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        {isUploading && (
          <p className="text-sm text-muted-foreground">파일 업로드 중...</p>
        )}
      </CardContent>
    </Card>
  );
}
