/**
 * 위스키 상세 페이지
 * - 신규 등록 (id가 'new'인 경우)
 * - 상세 조회 및 수정 (id가 숫자인 경우)
 */

import { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { Save, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { DetailPageHeader } from '@/components/common/DetailPageHeader';
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog';

import {
  WhiskyBasicInfoCard,
  WhiskyImageCard,
  WhiskyStatsCard,
  WhiskyTastingTagCard,
} from './components';
import { useWhiskyDetailForm } from './useWhiskyDetailForm';

import type { AlcoholTastingTag } from '@/types/api';

export function WhiskyDetailPage() {
  const { id } = useParams<{ id: string }>();

  // 폼 관련 로직을 커스텀 훅으로 분리
  const {
    form,
    isLoading,
    isNewMode,
    isPending,
    whiskyData,
    categories,
    regions,
    distilleries,
    onSubmit,
    handleBack,
    handleDelete,
  } = useWhiskyDetailForm(id);

  // 로컬 상태
  const [tastingTags, setTastingTags] = useState<AlcoholTastingTag[]>([]);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // whiskyData 변경 시 로컬 상태 동기화
  useEffect(() => {
    if (whiskyData) {
      setTastingTags(whiskyData.tastingTags);
      setImagePreviewUrl(whiskyData.imageUrl);
    }
  }, [whiskyData]);

  const handleImageChange = (_file: File | null, previewUrl: string | null) => {
    setImagePreviewUrl(previewUrl);
    // form의 imageUrl도 업데이트하여 validation 통과하도록 함
    form.setValue('imageUrl', previewUrl ?? '');
    // TODO: 이미지 업로드 API 연동 시 file 사용
  };

  const handleSubmit = form.handleSubmit((data) => {
    onSubmit(data, { tastingTags, imagePreviewUrl });
  });

  const handleDeleteConfirm = () => {
    handleDelete();
    setIsDeleteDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <DetailPageHeader
        title={isNewMode ? '위스키 등록' : '위스키 상세'}
        subtitle={whiskyData ? `ID: ${id}` : undefined}
        onBack={handleBack}
        actions={
          <>
            {whiskyData && (
              <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
                <Trash2 className="mr-2 h-4 w-4" />
                삭제
              </Button>
            )}
            <Button onClick={handleSubmit} disabled={isPending}>
              <Save className="mr-2 h-4 w-4" />
              {isPending ? '등록 중...' : isNewMode ? '등록' : '저장'}
            </Button>
          </>
        }
      />

      {isLoading ? (
        <div className="py-8 text-center text-muted-foreground">로딩 중...</div>
      ) : (
        <div className="space-y-6">
          {/* 기본 정보 + 이미지 섹션 */}
          <div className="flex flex-col gap-6 lg:flex-row">
            <WhiskyBasicInfoCard
              form={form}
              categories={categories}
              regions={regions}
              distilleries={distilleries}
            />

            {/* 이미지 + 통계 카드 */}
            <div className="flex flex-1 flex-col gap-6">
              <WhiskyImageCard
                imageUrl={imagePreviewUrl}
                onImageChange={handleImageChange}
                error={form.formState.errors.imageUrl?.message}
              />

              {whiskyData && (
                <WhiskyStatsCard
                  avgRating={whiskyData.avgRating}
                  totalRatingsCount={whiskyData.totalRatingsCount}
                  reviewCount={whiskyData.reviewCount}
                  pickCount={whiskyData.pickCount}
                />
              )}
            </div>
          </div>

          {/* 테이스팅 태그 섹션 */}
          <WhiskyTastingTagCard tastingTags={tastingTags} onTagsChange={setTastingTags} />
        </div>
      )}

      {/* 삭제 확인 다이얼로그 */}
      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="위스키 삭제"
        description="정말 이 위스키를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
      />
    </div>
  );
}
