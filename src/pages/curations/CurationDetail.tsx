/**
 * 큐레이션 상세/등록 페이지
 * - 신규 등록 (id가 'new'인 경우)
 * - 상세 조회 및 수정 (id가 숫자인 경우)
 * - 위스키 연결은 로컬 상태로 관리하다가 저장 시 PUT API로 일괄 처리
 */

import { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { Save, Trash2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DetailPageHeader } from '@/components/common/DetailPageHeader';
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog';
import { ImageUpload } from '@/components/common/ImageUpload';
import { FormField } from '@/components/common/FormField';
import { WhiskySearchSelect, type SelectedWhisky } from '@/components/common/WhiskySearchSelect';

import { useCurationDetailForm } from './useCurationDetailForm';
import { useImageUpload, S3UploadPath } from '@/hooks/useImageUpload';

export function CurationDetailPage() {
  const { id } = useParams<{ id: string }>();

  // 폼 관련 로직을 커스텀 훅으로 분리
  const {
    form,
    isLoading,
    isNewMode,
    isPending,
    curationData,
    onSubmit,
    handleBack,
    handleDelete,
  } = useCurationDetailForm(id);

  // 이미지 업로드 훅
  const { upload: uploadImage, isUploading: isImageUploading } = useImageUpload({
    rootPath: S3UploadPath.BANNER, // TODO: Create S3UploadPath.CURATION if needed
  });

  // 로컬 상태
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedWhiskies, setSelectedWhiskies] = useState<SelectedWhisky[]>([]);

  // curationData 변경 시 로컬 상태 동기화
  useEffect(() => {
    if (curationData) {
      setImagePreviewUrl(curationData.coverImageUrl);
      setSelectedWhiskies(
        curationData.alcohols.map((a) => ({
          alcoholId: a.alcoholId,
          korName: a.korName,
          engName: a.engName,
          imageUrl: a.imageUrl,
        }))
      );
    }
  }, [curationData]);

  const handleImageChange = async (file: File | null, previewUrl: string | null) => {
    // 즉시 프리뷰 표시
    setImagePreviewUrl(previewUrl);

    if (file) {
      // S3에 업로드하고 CDN URL 획득
      const viewUrl = await uploadImage(file);
      if (viewUrl) {
        // 업로드 성공 시 CDN URL로 업데이트
        form.setValue('coverImageUrl', viewUrl);
      } else {
        // 업로드 실패 시 프리뷰 URL 유지 (에러는 훅에서 처리)
        form.setValue('coverImageUrl', previewUrl ?? '');
      }
    } else {
      // 이미지 삭제 시
      form.setValue('coverImageUrl', previewUrl ?? '');
    }
  };

  // 위스키 추가 (로컬 상태만 - 저장 시 API 호출)
  const handleAddWhisky = (whisky: SelectedWhisky) => {
    // 폼 상태에 추가 (유효성 검사용)
    const currentIds = form.getValues('alcoholIds');
    form.setValue('alcoholIds', [...currentIds, whisky.alcoholId], { shouldValidate: true });
    // 로컬 상태에 추가
    setSelectedWhiskies((prev) => [...prev, whisky]);
  };

  // 위스키 제거 (로컬 상태만 - 저장 시 API 호출)
  const handleRemoveWhisky = (alcoholId: number) => {
    // 폼 상태에서 제거 (유효성 검사용)
    const currentIds = form.getValues('alcoholIds');
    form.setValue(
      'alcoholIds',
      currentIds.filter((id) => id !== alcoholId),
      { shouldValidate: true }
    );
    // 로컬 상태에서 제거
    setSelectedWhiskies((prev) => prev.filter((w) => w.alcoholId !== alcoholId));
  };

  const handleSubmit = form.handleSubmit(
    (data) => {
      // PUT API가 alcoholIds를 포함하므로 단일 호출로 처리
      onSubmit(data);
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
  const isActive = form.watch('isActive');

  // 현재 선택된 위스키 ID 목록 (excludeIds용)
  const alcoholIds = form.watch('alcoholIds');

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <DetailPageHeader
        title={isNewMode ? '큐레이션 등록' : '큐레이션 수정'}
        subtitle={curationData ? `ID: ${id}` : undefined}
        onBack={handleBack}
        actions={
          <>
            {curationData && (
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
                <FormField
                  label="큐레이션명"
                  required
                  error={form.formState.errors.name?.message}
                >
                  <Input
                    id="name"
                    {...form.register('name')}
                    placeholder="큐레이션명을 입력하세요"
                  />
                </FormField>

                <FormField
                  label="설명"
                  required
                  error={form.formState.errors.description?.message}
                >
                  <Textarea
                    id="description"
                    {...form.register('description')}
                    placeholder="큐레이션에 대한 설명을 입력하세요"
                    rows={4}
                  />
                </FormField>

                <FormField
                  label="노출 순서"
                  required
                  error={form.formState.errors.displayOrder?.message}
                >
                  <Input
                    id="displayOrder"
                    type="number"
                    {...form.register('displayOrder', { valueAsNumber: true })}
                    min={0}
                  />
                </FormField>

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

            {/* 포함된 위스키 */}
            <Card>
              <CardHeader>
                <CardTitle>
                  포함된 위스키 <span className="text-destructive">*</span>
                  {selectedWhiskies.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {selectedWhiskies.length}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 위스키 검색 선택 */}
                <WhiskySearchSelect
                  onSelect={handleAddWhisky}
                  excludeIds={alcoholIds}
                  placeholder="위스키 검색하여 추가..."
                />
                {form.formState.errors.alcoholIds && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.alcoholIds.message}
                  </p>
                )}

                {/* 선택된 위스키 목록 */}
                {selectedWhiskies.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    포함된 위스키가 없습니다.
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {selectedWhiskies.map((whisky) => (
                      <li
                        key={whisky.alcoholId}
                        className="flex items-center gap-3 rounded-lg border p-3"
                      >
                        {/* 이미지 썸네일 */}
                        <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                          {whisky.imageUrl ? (
                            <img
                              src={whisky.imageUrl}
                              alt={whisky.korName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                              No
                            </div>
                          )}
                        </div>
                        {/* 이름 */}
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-medium">{whisky.korName}</div>
                          <div className="truncate text-sm text-muted-foreground">
                            {whisky.engName}
                          </div>
                        </div>
                        {/* 제거 버튼 */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveWhisky(whisky.alcoholId)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 오른쪽 컬럼 */}
          <div className="space-y-6">
            {/* 커버 이미지 */}
            <Card>
              <CardHeader>
                <CardTitle>커버 이미지 <span className="text-destructive">*</span></CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ImageUpload
                  imageUrl={imagePreviewUrl}
                  onImageChange={handleImageChange}
                  minHeight={200}
                />
                <p className="text-sm text-muted-foreground">권장 사이즈: 400x300px</p>
                {form.formState.errors.coverImageUrl && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.coverImageUrl.message}
                  </p>
                )}
                {isImageUploading && (
                  <p className="text-sm text-muted-foreground">이미지 업로드 중...</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* 삭제 확인 다이얼로그 */}
      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="큐레이션 삭제"
        description="정말 이 큐레이션을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
      />
    </div>
  );
}
