/**
 * 위스키 이미지 카드
 * - 이미지 업로드 및 미리보기
 */

import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageUpload } from '@/components/common/ImageUpload';

/**
 * WhiskyImageCard 컴포넌트의 props
 * @param imageUrl - 현재 이미지 URL
 * @param onImageChange - 이미지 변경 콜백
 * @param error - 에러 메시지
 * @param isUploading - 업로드 진행 중 여부
 */
export interface WhiskyImageCardProps {
  imageUrl: string | null;
  onImageChange: (file: File | null, previewUrl: string | null) => void;
  error?: string;
  isUploading?: boolean;
}

export function WhiskyImageCard({
  imageUrl,
  onImageChange,
  error,
  isUploading = false,
}: WhiskyImageCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          이미지 <span className="text-destructive">*</span>
          {isUploading && (
            <span className="flex items-center gap-1 text-sm font-normal text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              업로드 중...
            </span>
          )}
        </CardTitle>
        <CardDescription>이미지를 드래그하거나 클릭하여 업로드합니다.</CardDescription>
      </CardHeader>
      <CardContent>
        <ImageUpload imageUrl={imageUrl} onImageChange={onImageChange} />
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
