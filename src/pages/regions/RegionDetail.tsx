/**
 * 지역(Region) 상세/등록 페이지
 * - 신규 등록 (id가 없거나 'new'인 경우)
 * - 상세 조회 및 수정 (id가 숫자인 경우)
 * - sortOrder는 읽기 전용 표시 (변경은 목록 페이지의 순서 변경 모드에서)
 */

import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { DetailPageHeader } from '@/components/common/DetailPageHeader';
import { FormField } from '@/components/common/FormField';
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog';

import {
  useRegionDetail,
  useRegionList,
  useRegionCreate,
  useRegionUpdate,
  useRegionDelete,
} from '@/hooks/useRegions';

import {
  regionFormSchema,
  regionDefaultValues,
  type RegionFormValues,
} from './region.schema';

const NULL_PARENT_VALUE = '__NULL__';

export function RegionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const isNewMode = !id || id === 'new';
  const regionId = isNewMode ? undefined : Number(id);

  // 상세 데이터
  const { data: detailData, isLoading } = useRegionDetail(regionId);

  // 상위 지역 후보 (parentId=null인 region들)
  const { data: allRegions } = useRegionList({ size: 200, sortOrder: 'ASC' });

  const parentCandidates = useMemo(() => {
    if (!allRegions) return [];
    return allRegions.items.filter(
      (r) => r.parentId === null && (regionId ? r.id !== regionId : true)
    );
  }, [allRegions, regionId]);

  // Mutations
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
        continent: detailData.continent ?? null,
        description: detailData.description ?? null,
        parentId: detailData.parentId ?? null,
      });
    }
  }, [detailData, form, isNewMode]);

  const onSubmit = (values: RegionFormValues) => {
    const formData = {
      korName: values.korName,
      engName: values.engName,
      continent: values.continent || null,
      description: values.description || null,
      parentId: values.parentId,
    };

    if (isNewMode) {
      createMutation.mutate(formData);
    } else if (regionId) {
      updateMutation.mutate({ id: regionId, data: formData });
    }
  };

  const handleDeleteConfirm = () => {
    if (regionId) {
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
              <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
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
        <div className="flex flex-col gap-6">
          {/* 기본 정보 카드 */}
          <Card>
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
                  <Input {...form.register('korName')} placeholder="예: 스코틀랜드" />
                </FormField>
                <FormField
                  label="영문명"
                  required
                  error={form.formState.errors.engName?.message}
                >
                  <Input {...form.register('engName')} placeholder="예: Scotland" />
                </FormField>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="대륙" error={form.formState.errors.continent?.message}>
                  <Input
                    {...form.register('continent')}
                    placeholder="예: EUROPE / ASIA / AMERICA"
                  />
                </FormField>

                <FormField label="상위 지역" error={form.formState.errors.parentId?.message}>
                  <Controller
                    control={form.control}
                    name="parentId"
                    render={({ field }) => (
                      <Select
                        value={field.value === null ? NULL_PARENT_VALUE : String(field.value)}
                        onValueChange={(val) =>
                          field.onChange(val === NULL_PARENT_VALUE ? null : Number(val))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="최상위 지역" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NULL_PARENT_VALUE}>
                            (최상위 — 부모 없음)
                          </SelectItem>
                          {parentCandidates.map((r) => (
                            <SelectItem key={r.id} value={String(r.id)}>
                              {r.korName} ({r.engName})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </FormField>
              </div>

              <FormField label="설명" error={form.formState.errors.description?.message}>
                <Textarea
                  {...form.register('description')}
                  placeholder="지역 설명 (선택)"
                  rows={4}
                />
              </FormField>
            </CardContent>
          </Card>

          {/* 정렬 순서 (읽기 전용) */}
          {!isNewMode && detailData && (
            <Card>
              <CardHeader>
                <CardTitle>정렬 순서</CardTitle>
                <CardDescription>
                  현재 노출 순서입니다. 변경은 목록 페이지의 <strong>순서 변경</strong> 모드에서 드래그앤드롭으로 진행하세요.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="font-mono text-lg">
                  {detailData.sortOrder === 9999 ? '미설정 (9999)' : detailData.sortOrder}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* 삭제 확인 다이얼로그 */}
      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="지역 삭제"
        description="정말 이 지역을 삭제하시겠습니까? 자식 지역이나 연관된 위스키가 있다면 삭제할 수 없습니다."
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
