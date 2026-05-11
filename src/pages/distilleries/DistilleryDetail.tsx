/**
 * 증류소 상세 페이지
 * - 신규 등록 (id가 없거나 'new'인 경우)
 * - 상세 조회 및 수정 (id가 숫자인 경우)
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { DetailPageHeader } from '@/components/common/DetailPageHeader';
import { ImageUpload } from '@/components/common/ImageUpload';
import { FormField } from '@/components/common/FormField';
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog';

import {
  useDistilleryDetail,
  useDistilleryCreate,
  useDistilleryUpdate,
  useDistilleryDelete,
} from '@/hooks/useDistilleries';
import { useImageUpload, S3UploadPath } from '@/hooks/useImageUpload';

import {
  distilleryFormSchema,
  distilleryDefaultValues,
  type DistilleryFormValues,
} from './distillery.schema';

export function DistilleryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const isNewMode = !id || id === 'new';
  const distilleryId = isNewMode ? undefined : Number(id);

  // API 조회
  const { data: detailData, isLoading } = useDistilleryDetail(distilleryId);

  // 이미지 업로드 (S3 Presigned URL)
  const { upload: uploadImage, isUploading: isImageUploading } = useImageUpload({
    rootPath: S3UploadPath.DISTILLERY,
  });

  // Mutations
  const createMutation = useDistilleryCreate({
    onSuccess: () => {
      navigate('/distilleries');
    },
  });

  const updateMutation = useDistilleryUpdate({
    onSuccess: () => {
      // 수정 완료 후 페이지에 남아있음
    },
  });

  const deleteMutation = useDistilleryDelete({
    onSuccess: () => {
      navigate('/distilleries');
    },
  });

  // 상태
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // React Hook Form 설정
  const form = useForm<DistilleryFormValues>({
    resolver: zodResolver(distilleryFormSchema),
    defaultValues: distilleryDefaultValues,
  });

  // API 데이터로 폼 초기화
  useEffect(() => {
    if (isNewMode) {
      form.reset(distilleryDefaultValues);
      setImagePreviewUrl(null);
    } else if (detailData) {
      form.reset({
        korName: detailData.korName,
        engName: detailData.engName,
        imageUrl: detailData.imageUrl,
        sortOrder: detailData.sortOrder,
      });
      setImagePreviewUrl(detailData.imageUrl);
    }
  }, [detailData, form, isNewMode]);

  // 이미지 변경 (S3 업로드 후 viewUrl을 폼 값으로 설정)
  const handleImageChange = async (file: File | null, previewUrl: string | null) => {
    setImagePreviewUrl(previewUrl);

    if (file) {
      const viewUrl = await uploadImage(file);
      form.setValue('imageUrl', viewUrl ?? previewUrl ?? null);
    } else {
      form.setValue('imageUrl', previewUrl);
    }
  };

  const onSubmit = (data: DistilleryFormValues) => {
    const formData = {
      korName: data.korName,
      engName: data.engName,
      imageUrl: data.imageUrl,
      sortOrder: data.sortOrder,
    };

    if (isNewMode) {
      createMutation.mutate(formData);
    } else if (distilleryId) {
      updateMutation.mutate({ id: distilleryId, data: formData });
    }
  };

  const handleDeleteConfirm = () => {
    if (distilleryId) {
      deleteMutation.mutate(distilleryId);
    }
  };

  const handleBack = () => navigate('/distilleries');

  const isMutating = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <DetailPageHeader
        title={isNewMode ? '증류소 등록' : '증류소 상세'}
        subtitle={detailData ? `ID: ${id}` : undefined}
        onBack={handleBack}
        actions={
          <>
            {detailData && (
              <Button
                variant="destructive"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                삭제
              </Button>
            )}
            <Button
              onClick={form.handleSubmit(onSubmit)}
              disabled={isMutating || isImageUploading}
            >
              <Save className="mr-2 h-4 w-4" />
              {isMutating ? '저장 중...' : isNewMode ? '등록' : '저장'}
            </Button>
          </>
        }
      />

      {isLoading ? (
        <div className="py-8 text-center text-muted-foreground">로딩 중...</div>
      ) : (
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* 기본 정보 카드 */}
          <Card className="flex-[2]">
            <CardHeader>
              <CardTitle>기본 정보</CardTitle>
              <CardDescription>증류소의 기본 정보를 입력합니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 한글명 / 영문명 */}
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label="한글명"
                  required
                  error={form.formState.errors.korName?.message}
                >
                  <Input
                    {...form.register('korName')}
                    placeholder="예: 맥캘란"
                  />
                </FormField>
                <FormField
                  label="영문명"
                  required
                  error={form.formState.errors.engName?.message}
                >
                  <Input
                    {...form.register('engName')}
                    placeholder="예: Macallan"
                  />
                </FormField>
              </div>

              {/* 정렬 순서 */}
              <FormField
                label="정렬 순서"
                required
                error={form.formState.errors.sortOrder?.message}
              >
                <Input
                  type="number"
                  min={0}
                  {...form.register('sortOrder', { valueAsNumber: true })}
                  placeholder="미지정 시 9999"
                />
              </FormField>
            </CardContent>
          </Card>

          {/* 이미지 카드 */}
          <Card className="flex-1">
            <CardHeader>
              <CardTitle>이미지</CardTitle>
              <CardDescription>
                증류소 이미지를 업로드합니다. (선택)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ImageUpload
                imageUrl={imagePreviewUrl}
                onImageChange={handleImageChange}
                minHeight={150}
              />
              {isImageUploading && (
                <p className="text-sm text-muted-foreground">파일 업로드 중...</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* 삭제 확인 다이얼로그 */}
      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="증류소 삭제"
        description="정말 이 증류소를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
