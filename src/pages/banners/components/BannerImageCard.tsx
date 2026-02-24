import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageUpload } from '@/components/common/ImageUpload';

interface BannerImageCardProps {
  imagePreviewUrl: string | null;
  onImageChange: (file: File | null, previewUrl: string | null) => void;
  isUploading: boolean;
  error?: string;
}

export function BannerImageCard({ imagePreviewUrl, onImageChange, isUploading, error }: BannerImageCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>배너 이미지 *</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ImageUpload
          imageUrl={imagePreviewUrl}
          onImageChange={onImageChange}
          minHeight={200}
        />
        <p className="text-sm text-muted-foreground">
          권장 사이즈: 936x454px (2x 기준, 비율 약 2:1)
        </p>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        {isUploading && (
          <p className="text-sm text-muted-foreground">이미지 업로드 중...</p>
        )}
      </CardContent>
    </Card>
  );
}
