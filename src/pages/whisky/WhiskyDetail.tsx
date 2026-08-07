/**
 * 위스키 상세 페이지
 * - 신규 등록 (id가 'new'인 경우)
 * - 상세 조회 및 수정 (id가 숫자인 경우)
 */

import { useState } from 'react';
import { useParams } from 'react-router';
import { Save, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DetailPageHeader } from '@/components/common/DetailPageHeader';
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog';

import {
  WhiskyBasicInfoCard,
  WhiskyImageCard,
  WhiskyStatsCard,
  WhiskyTastingTagCard,
  WhiskyRelatedKeywordsCard,
} from './components';
import { useWhiskyDetailForm } from './useWhiskyDetailForm';
import { useFileUpload, S3UploadPath } from '@/hooks/useFileUpload';
import { useToast } from '@/hooks/useToast';

import type { AlcoholTastingTag } from '@/types/api';

function normalizeTastingTags(tags: AlcoholTastingTag[]) {
  const seenTagIds = new Set<number>();

  return tags
    .filter((tag) => {
      if (seenTagIds.has(tag.id)) return false;
      seenTagIds.add(tag.id);
      return true;
    })
    .sort((a, b) => a.id - b.id);
}

export function WhiskyDetailPage() {
  const { id } = useParams<{ id: string }>();

  // 폼 관련 로직을 커스텀 훅으로 분리
  const {
    form,
    isLoading,
    isNewMode,
    isDeleted,
    isPending,
    whiskyData,
    groupedCategories,
    regions,
    distilleries,
    onSubmit,
    handleBack,
    handleDelete,
  } = useWhiskyDetailForm(id);

  // Toast 알림
  const { showToast } = useToast();

  // 이미지 업로드 훅
  const { upload: uploadImage, isUploading: isImageUploading } = useFileUpload({
    rootPath: S3UploadPath.ALCOHOL,
  });

  // 현재 경로에서 사용자가 편집한 태그만 별도로 보관한다.
  // 수정 전에는 서버 상세값을 그대로 사용하므로, refetch가 로컬 편집값을 덮어쓰지 않는다.
  const [editedTastingTags, setEditedTastingTags] = useState<{
    targetId: string;
    tags: AlcoholTastingTag[];
  } | null>(null);
  const [relatedKeywords, setRelatedKeywords] = useState<string[]>([]);
  const [editedImagePreview, setEditedImagePreview] = useState<{
    targetId: string;
    previewUrl: string | null;
  } | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const currentTargetId = id ?? 'new';
  const tastingTags = normalizeTastingTags(
    editedTastingTags?.targetId === currentTargetId
      ? editedTastingTags.tags
      : (whiskyData?.tastingTags ?? [])
  );
  const imagePreviewUrl =
    editedImagePreview?.targetId === currentTargetId
      ? editedImagePreview.previewUrl
      : (whiskyData?.imageUrl ?? null);

  const handleTastingTagsChange = (tags: AlcoholTastingTag[]) => {
    setEditedTastingTags({
      targetId: currentTargetId,
      tags: normalizeTastingTags(tags),
    });
  };

  const handleImageChange = async (file: File | null, previewUrl: string | null) => {
    // 즉시 프리뷰 표시
    setEditedImagePreview({ targetId: currentTargetId, previewUrl });

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
      onSubmit(data, { tastingTags, relatedKeywords, imagePreviewUrl });
    },
    () => {
      showToast({ type: 'warning', message: '입력 정보를 확인해주세요.' });
    }
  );

  const handleDeleteConfirm = () => {
    handleDelete();
    setIsDeleteDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <DetailPageHeader
        title={isNewMode ? '위스키 등록' : '위스키 상세'}
        subtitle={isDeleted ? undefined : whiskyData ? `ID: ${id}` : undefined}
        onBack={handleBack}
        actions={
          isDeleted ? (
            <Badge variant="destructive">삭제됨</Badge>
          ) : (
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
          )
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
              groupedCategories={groupedCategories}
              regions={regions}
              distilleries={distilleries}
              disabled={isDeleted}
            />

            {/* 이미지 + 통계 카드 */}
            <div className="flex flex-1 flex-col gap-6">
              <WhiskyImageCard
                imageUrl={imagePreviewUrl}
                onImageChange={handleImageChange}
                error={form.formState.errors.imageUrl?.message}
                isUploading={isImageUploading}
                disabled={isDeleted}
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
          <WhiskyTastingTagCard
            tastingTags={tastingTags}
            onTagsChange={handleTastingTagsChange}
            disabled={isDeleted}
          />

          {/* 연관 키워드 섹션 */}
          <WhiskyRelatedKeywordsCard
            keywords={relatedKeywords}
            onKeywordsChange={setRelatedKeywords}
            disabled={isDeleted}
          />
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
