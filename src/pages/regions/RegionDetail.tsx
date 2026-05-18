/**
 * 지역 상세 페이지
 * - 신규 등록
 * - 상세 조회 및 수정
 */

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DetailPageHeader } from '@/components/common/DetailPageHeader';
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog';
import { FormField } from '@/components/common/FormField';
import { SearchableSelect } from '@/components/common/SearchableSelect';
import {
  useRegionCreate,
  useRegionDelete,
  useRegionDetail,
  useRegionList,
  useRegionUpdate,
} from '@/hooks/useRegions';
import {
  regionDefaultValues,
  regionFormSchema,
  type RegionFormValues,
} from './region.schema';

function toNullableText(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function formatDateTime(value: string | undefined) {
  if (!value) return '-';
  return new Date(value).toLocaleString('ko-KR');
}

export function RegionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const isNewMode = !id || id === 'new';
  const regionId = isNewMode ? undefined : Number(id);

  const { data: detailData, isLoading } = useRegionDetail(regionId);
  const { data: parentRegionData } = useRegionList({ size: 100, sortOrder: 'ASC' });

  const createMutation = useRegionCreate({
    onSuccess: () => {
      navigate('/regions');
    },
  });
  const updateMutation = useRegionUpdate();
  const deleteMutation = useRegionDelete({
    onSuccess: () => {
      navigate('/regions');
    },
  });

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const form = useForm<RegionFormValues>({
    resolver: zodResolver(regionFormSchema),
    defaultValues: regionDefaultValues,
  });

  useEffect(() => {
    if (isNewMode) {
      form.reset(regionDefaultValues);
    } else if (detailData) {
      form.reset({
        korName: detailData.korName,
        engName: detailData.engName,
        continent: detailData.continent,
        description: detailData.description,
        parentId: detailData.parentId,
        sortOrder: detailData.sortOrder,
      });
    }
  }, [detailData, form, isNewMode]);

  const parentOptions = [
    { value: 'NONE', label: '상위 지역 없음' },
    ...(parentRegionData?.items ?? [])
      .filter((region) => region.id !== regionId)
      .map((region) => ({
        value: String(region.id),
        label: `${region.korName} (${region.engName})`,
      })),
  ];

  const selectedParentValue = form.watch('parentId');
  const nextCreateSortOrder =
    parentRegionData?.items.length
      ? Math.max(...parentRegionData.items.map((region) => region.sortOrder)) + 1
      : regionDefaultValues.sortOrder;

  const onSubmit = (data: RegionFormValues) => {
    const formData = {
      korName: data.korName,
      engName: data.engName,
      continent: toNullableText(data.continent),
      description: toNullableText(data.description),
      parentId: data.parentId,
      sortOrder: isNewMode ? nextCreateSortOrder : data.sortOrder,
    };

    if (isNewMode) {
      createMutation.mutate(formData);
    } else if (regionId !== undefined) {
      updateMutation.mutate({ id: regionId, data: formData });
    }
  };

  const handleDeleteConfirm = () => {
    if (regionId !== undefined) {
      deleteMutation.mutate(regionId);
    }
  };

  const handleBack = () => navigate('/regions');

  const isMutating = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <DetailPageHeader
        title={isNewMode ? '지역 등록' : '지역 상세'}
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
              disabled={isMutating}
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
          <Card className="flex-[2]">
            <CardHeader>
              <CardTitle>기본 정보</CardTitle>
              <CardDescription>지역의 기본 정보를 입력합니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label="한글명"
                  required
                  error={form.formState.errors.korName?.message}
                >
                  <Input
                    {...form.register('korName')}
                    placeholder="예: 스코틀랜드"
                  />
                </FormField>
                <FormField
                  label="영문명"
                  required
                  error={form.formState.errors.engName?.message}
                >
                  <Input
                    {...form.register('engName')}
                    placeholder="예: Scotland"
                  />
                </FormField>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label="대륙"
                  error={form.formState.errors.continent?.message}
                >
                  <Input
                    value={form.watch('continent') ?? ''}
                    onChange={(e) => form.setValue('continent', e.target.value)}
                    placeholder="예: 유럽"
                  />
                </FormField>
                <FormField
                  label="상위 지역"
                  error={form.formState.errors.parentId?.message}
                >
                  <SearchableSelect
                    value={selectedParentValue == null ? 'NONE' : String(selectedParentValue)}
                    onChange={(value) =>
                      form.setValue(
                        'parentId',
                        value === 'NONE' ? null : Number(value),
                        { shouldValidate: true }
                      )
                    }
                    options={parentOptions}
                    placeholder="상위 지역 없음"
                    searchPlaceholder="상위 지역 검색..."
                    emptyMessage="지역을 찾을 수 없습니다."
                  />
                </FormField>
              </div>

              <FormField
                label="설명"
                error={form.formState.errors.description?.message}
              >
                <Textarea
                  value={form.watch('description') ?? ''}
                  onChange={(e) => form.setValue('description', e.target.value)}
                  placeholder="지역 설명을 입력하세요."
                  rows={4}
                />
              </FormField>
            </CardContent>
          </Card>

          {!isNewMode && detailData && (
            <Card className="flex-1">
              <CardHeader>
                <CardTitle>참고 정보</CardTitle>
                <CardDescription>지역의 연결 상태와 순서를 확인합니다.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <p className="text-muted-foreground">정렬 순서</p>
                  <p className="font-mono">{detailData.sortOrder + 1}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">상위 지역</p>
                  <p>{detailData.parentKorName ?? '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">하위 지역</p>
                  <p>{detailData.hasChildren ? '있음' : '없음'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">연결 위스키</p>
                  <p>{detailData.alcoholCount.toLocaleString()}개</p>
                </div>
                <div>
                  <p className="text-muted-foreground">생성일</p>
                  <p>{formatDateTime(detailData.createAt)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">수정일</p>
                  <p>{formatDateTime(detailData.lastModifyAt)}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="지역 삭제"
        description="정말 이 지역을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
