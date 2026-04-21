/**
 * 증류소 상세 페이지
 * - 신규 등록 (id가 없거나 'new'인 경우)
 * - 상세 조회 및 수정 (id가 숫자인 경우)
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { useRegionList } from '@/hooks/useRegions';

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
  const { data: regionData } = useRegionList({ size: 500 });

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
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
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
      setLogoUrl(null);
    } else if (detailData) {
      form.reset({
        korName: detailData.korName,
        engName: detailData.engName,
        regionId: detailData.regionId,
      });
      setLogoUrl(detailData.logoImgUrl);
    }
  }, [detailData, form, isNewMode]);

  // 로고 이미지 변경
  const handleLogoChange = (file: File | null, previewUrl: string | null) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setLogoUrl(previewUrl);
    }
  };

  const onSubmit = (data: DistilleryFormValues) => {
    const formData = {
      korName: data.korName,
      engName: data.engName,
      logoImgUrl: logoUrl,
      regionId: data.regionId,
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

  const regions = regionData?.items ?? [];

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
            <Button onClick={form.handleSubmit(onSubmit)} disabled={isMutating}>
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

              {/* 지역 선택 */}
              <FormField label="지역">
                <Controller
                  name="regionId"
                  control={form.control}
                  render={({ field }) => (
                    <Select
                      value={field.value ? String(field.value) : 'none'}
                      onValueChange={(val) =>
                        field.onChange(val === 'none' ? null : Number(val))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="지역을 선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">선택 안함</SelectItem>
                        {regions.map((region) => (
                          <SelectItem key={region.id} value={String(region.id)}>
                            {region.korName} ({region.engName})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>
            </CardContent>
          </Card>

          {/* 로고 카드 */}
          <Card className="flex-1">
            <CardHeader>
              <CardTitle>로고</CardTitle>
              <CardDescription>
                증류소 로고 이미지를 업로드합니다. (선택)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ImageUpload
                imageUrl={logoUrl}
                onImageChange={handleLogoChange}
                minHeight={150}
              />
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
