/**
 * 배너 상세/등록 페이지
 * - 신규 등록 (id가 'new'인 경우)
 * - 상세 조회 및 수정 (id가 숫자인 경우)
 */

import { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { Save, Trash2, ExternalLink, Link } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DetailPageHeader } from '@/components/common/DetailPageHeader';
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog';
import { ImageUpload } from '@/components/common/ImageUpload';

import { useBannerDetailForm } from './useBannerDetailForm';
import { useImageUpload, S3UploadPath } from '@/hooks/useImageUpload';
import { BANNER_TYPE_LABELS, TEXT_POSITION_LABELS, type BannerType, type TextPosition } from '@/types/api';

export function BannerDetailPage() {
  const { id } = useParams<{ id: string }>();

  // 폼 관련 로직을 커스텀 훅으로 분리
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

  // 이미지 업로드 훅
  const { upload: uploadImage, isUploading: isImageUploading } = useImageUpload({
    rootPath: S3UploadPath.BANNER,
  });

  // 로컬 상태
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // bannerData 변경 시 로컬 상태 동기화
  useEffect(() => {
    if (bannerData) {
      setImagePreviewUrl(bannerData.imageUrl);
    }
  }, [bannerData]);

  const handleImageChange = async (file: File | null, previewUrl: string | null) => {
    // 즉시 프리뷰 표시
    setImagePreviewUrl(previewUrl);

    if (file) {
      // S3에 업로드하고 CDN URL 획득
      const viewUrl = await uploadImage(file);
      if (viewUrl) {
        // 업로드 성공 시 CDN URL로 업데이트
        form.setValue('imageUrl', viewUrl);
      } else {
        // 업로드 실패 시 프리뷰 URL 유지 (에러는 훅에서 처리)
        form.setValue('imageUrl', previewUrl ?? '');
      }
    } else {
      // 이미지 삭제 시
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

  // 폼 값 watch
  const isAlwaysVisible = form.watch('isAlwaysVisible');
  const isActive = form.watch('isActive');
  const isExternalUrl = form.watch('isExternalUrl');

  return (
    <div className="space-y-6">
      {/* 헤더 */}
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
          {/* 왼쪽 컬럼 */}
          <div className="space-y-6">
            {/* 기본 정보 */}
            <Card>
              <CardHeader>
                <CardTitle>기본 정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">배너명 *</Label>
                  <Input
                    id="name"
                    {...form.register('name')}
                    placeholder="배너명을 입력하세요"
                  />
                  {form.formState.errors.name && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bannerType">배너 타입 *</Label>
                  <Select
                    value={form.watch('bannerType')}
                    onValueChange={(value) => form.setValue('bannerType', value as BannerType)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="배너 타입 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(BANNER_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={isActive}
                    onCheckedChange={(checked) => form.setValue('isActive', checked)}
                  />
                  <Label htmlFor="isActive">활성화 상태</Label>
                </div>
              </CardContent>
            </Card>

            {/* 텍스트 설정 */}
            <Card>
              <CardHeader>
                <CardTitle>텍스트 설정</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="descriptionA">설명 A</Label>
                  <Input
                    id="descriptionA"
                    {...form.register('descriptionA')}
                    placeholder="첫 번째 줄 설명"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descriptionB">설명 B</Label>
                  <Input
                    id="descriptionB"
                    {...form.register('descriptionB')}
                    placeholder="두 번째 줄 설명"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="textPosition">텍스트 위치 *</Label>
                  <Select
                    value={form.watch('textPosition')}
                    onValueChange={(value) => form.setValue('textPosition', value as TextPosition)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="텍스트 위치 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TEXT_POSITION_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nameFontColor">제목 색상</Label>
                    <div className="flex gap-2">
                      <div
                        className="w-10 h-10 rounded border"
                        style={{ backgroundColor: `#${form.watch('nameFontColor')}` }}
                      />
                      <Input
                        id="nameFontColor"
                        {...form.register('nameFontColor')}
                        placeholder="ffffff"
                        maxLength={6}
                      />
                    </div>
                    {form.formState.errors.nameFontColor && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.nameFontColor.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="descriptionFontColor">설명 색상</Label>
                    <div className="flex gap-2">
                      <div
                        className="w-10 h-10 rounded border"
                        style={{ backgroundColor: `#${form.watch('descriptionFontColor')}` }}
                      />
                      <Input
                        id="descriptionFontColor"
                        {...form.register('descriptionFontColor')}
                        placeholder="ffffff"
                        maxLength={6}
                      />
                    </div>
                    {form.formState.errors.descriptionFontColor && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.descriptionFontColor.message}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 링크 설정 */}
            <Card>
              <CardHeader>
                <CardTitle>링크 설정</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="targetUrl">이동 URL</Label>
                  <div className="relative">
                    {isExternalUrl ? (
                      <ExternalLink className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    ) : (
                      <Link className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    )}
                    <Input
                      id="targetUrl"
                      {...form.register('targetUrl')}
                      placeholder={isExternalUrl ? 'https://example.com' : '/path/to/page'}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isExternalUrl"
                    checked={isExternalUrl}
                    onCheckedChange={(checked) => form.setValue('isExternalUrl', !!checked)}
                  />
                  <Label htmlFor="isExternalUrl">외부 URL (새 탭에서 열기)</Label>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 오른쪽 컬럼 */}
          <div className="space-y-6">
            {/* 배너 이미지 */}
            <Card>
              <CardHeader>
                <CardTitle>배너 이미지 *</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ImageUpload
                  imageUrl={imagePreviewUrl}
                  onImageChange={handleImageChange}
                  minHeight={200}
                />
                <p className="text-sm text-muted-foreground">
                  권장 사이즈: 1920x600px
                </p>
                {form.formState.errors.imageUrl && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.imageUrl.message}
                  </p>
                )}
                {isImageUploading && (
                  <p className="text-sm text-muted-foreground">이미지 업로드 중...</p>
                )}
              </CardContent>
            </Card>

            {/* 노출 설정 */}
            <Card>
              <CardHeader>
                <CardTitle>노출 설정</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isAlwaysVisible"
                    checked={isAlwaysVisible}
                    onCheckedChange={(checked) => {
                      form.setValue('isAlwaysVisible', !!checked);
                      if (checked) {
                        form.setValue('startDate', null);
                        form.setValue('endDate', null);
                      }
                    }}
                  />
                  <Label htmlFor="isAlwaysVisible">상시 노출</Label>
                </div>

                {!isAlwaysVisible && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">시작일</Label>
                      <Input
                        id="startDate"
                        type="datetime-local"
                        value={form.watch('startDate') ?? ''}
                        onChange={(e) => form.setValue('startDate', e.target.value || null)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="endDate">종료일</Label>
                      <Input
                        id="endDate"
                        type="datetime-local"
                        value={form.watch('endDate') ?? ''}
                        onChange={(e) => form.setValue('endDate', e.target.value || null)}
                      />
                    </div>
                  </div>
                )}

                {form.formState.errors.startDate && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.startDate.message}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* 배너 미리보기 */}
            {imagePreviewUrl && (
              <Card>
                <CardHeader>
                  <CardTitle>미리보기</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative aspect-[16/5] overflow-hidden rounded-lg">
                    <img
                      src={imagePreviewUrl}
                      alt="배너 미리보기"
                      className="h-full w-full object-cover"
                    />
                    <BannerTextOverlay
                      name={form.watch('name')}
                      descriptionA={form.watch('descriptionA')}
                      descriptionB={form.watch('descriptionB')}
                      textPosition={form.watch('textPosition')}
                      nameFontColor={form.watch('nameFontColor')}
                      descriptionFontColor={form.watch('descriptionFontColor')}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* 삭제 확인 다이얼로그 */}
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

/**
 * 배너 텍스트 오버레이 컴포넌트
 */
interface BannerTextOverlayProps {
  name: string;
  descriptionA?: string;
  descriptionB?: string;
  textPosition: TextPosition;
  nameFontColor: string;
  descriptionFontColor: string;
}

function BannerTextOverlay({
  name,
  descriptionA,
  descriptionB,
  textPosition,
  nameFontColor,
  descriptionFontColor,
}: BannerTextOverlayProps) {
  // 위치 클래스 계산
  const positionClasses: Record<TextPosition, string> = {
    LT: 'top-4 left-4',
    LB: 'bottom-4 left-4',
    RT: 'top-4 right-4',
    RB: 'bottom-4 right-4',
    CENTER: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
  };

  const textAlignClasses: Record<TextPosition, string> = {
    LT: 'text-left',
    LB: 'text-left',
    RT: 'text-right',
    RB: 'text-right',
    CENTER: 'text-center',
  };

  // 텍스트 순서 (LT, RT, CENTER는 description 위, name 아래)
  const isNameFirst = textPosition === 'LB' || textPosition === 'RB';

  return (
    <div
      className={`absolute ${positionClasses[textPosition]} ${textAlignClasses[textPosition]} max-w-[60%]`}
    >
      {isNameFirst ? (
        <>
          <p
            className="text-lg font-bold drop-shadow-lg"
            style={{ color: `#${nameFontColor}` }}
          >
            {name}
          </p>
          {(descriptionA || descriptionB) && (
            <div style={{ color: `#${descriptionFontColor}` }} className="drop-shadow">
              {descriptionA && <p className="text-sm">{descriptionA}</p>}
              {descriptionB && <p className="text-sm">{descriptionB}</p>}
            </div>
          )}
        </>
      ) : (
        <>
          {(descriptionA || descriptionB) && (
            <div style={{ color: `#${descriptionFontColor}` }} className="drop-shadow">
              {descriptionA && <p className="text-sm">{descriptionA}</p>}
              {descriptionB && <p className="text-sm">{descriptionB}</p>}
            </div>
          )}
          <p
            className="text-lg font-bold drop-shadow-lg"
            style={{ color: `#${nameFontColor}` }}
          >
            {name}
          </p>
        </>
      )}
    </div>
  );
}
