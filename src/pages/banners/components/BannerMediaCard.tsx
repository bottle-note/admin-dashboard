import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MediaUpload } from '@/components/common/MediaUpload';
import { useToast } from '@/hooks/useToast';
import type { MediaType } from '@/types/api';

/** 배너에서 허용하는 파일 타입 */
const BANNER_ACCEPT = 'image/*,video/mp4';

interface BannerMediaCardProps {
  mediaPreviewUrl: string | null;
  posterPreviewUrl: string | null;
  mediaType: MediaType;
  onMediaChange: (file: File | null, previewUrl: string | null) => void;
  isExtractingPoster: boolean;
  isUploading: boolean;
  error?: string;
}

export function BannerMediaCard({
  mediaPreviewUrl,
  posterPreviewUrl,
  mediaType,
  onMediaChange,
  isExtractingPoster,
  isUploading,
  error,
}: BannerMediaCardProps) {
  const { showToast } = useToast();
  const isProcessing = isExtractingPoster || isUploading;

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
        <MediaUpload
          mediaUrl={mediaPreviewUrl}
          mediaType={mediaType}
          onMediaChange={onMediaChange}
          onFileRejected={handleFileRejected}
          accept={BANNER_ACCEPT}
          description="파일을 드래그하거나 클릭하여 업로드"
          supportText="이미지(PNG, JPG, WEBP) 또는 동영상(MP4) 지원"
          minHeight={200}
          disabled={isProcessing}
        />
        <p className="text-sm text-muted-foreground">
          권장 사이즈: 936x454px (2x 기준, 비율 약 2:1)
        </p>
        {mediaType === 'VIDEO' && posterPreviewUrl && (
          <div className="space-y-2">
            <p className="text-sm font-medium">동영상 대표 이미지</p>
            <img
              src={posterPreviewUrl}
              alt="추출된 동영상 대표 이미지"
              className="w-full rounded-lg border object-cover"
            />
          </div>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
        {isExtractingPoster && (
          <p className="text-sm text-muted-foreground">동영상 대표 이미지 추출 중...</p>
        )}
        {isUploading && <p className="text-sm text-muted-foreground">파일 업로드 중...</p>}
      </CardContent>
    </Card>
  );
}
