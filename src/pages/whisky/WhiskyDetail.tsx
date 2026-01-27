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
  WhiskyRelatedKeywordsCard,
} from './components';
import { useWhiskyDetailForm } from './useWhiskyDetailForm';
import { useImageUpload, S3UploadPath } from '@/hooks/useImageUpload';

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

  // 이미지 업로드 훅
  const { upload: uploadImage, isUploading: isImageUploading } = useImageUpload({
    rootPath: S3UploadPath.ALCOHOL,
  });

  // 로컬 상태
  const [tastingTags, setTastingTags] = useState<AlcoholTastingTag[]>([]);
  const [relatedKeywords, setRelatedKeywords] = useState<string[]>([]);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // whiskyData 변경 시 로컬 상태 동기화
  useEffect(() => {
    if (whiskyData) {
      setTastingTags(whiskyData.tastingTags);
      setImagePreviewUrl(whiskyData.imageUrl);
      // TODO: API에 relatedKeywords 필드 추가 시 아래 주석 해제
      // setRelatedKeywords(whiskyData.relatedKeywords ?? []);
    }
  }, [whiskyData]);

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
      console.log('[DEBUG] handleSubmit callback called', data);
      onSubmit(data, { tastingTags, relatedKeywords, imagePreviewUrl });
    },
    (errors) => {
      console.log('[DEBUG] handleSubmit validation errors', errors);
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
            <Button onClick={() => { console.log('[DEBUG] Button clicked, isPending:', isPending); handleSubmit(); }} disabled={isPending}>
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
                isUploading={isImageUploading}
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

          {/* 연관 키워드 섹션 */}
          <WhiskyRelatedKeywordsCard keywords={relatedKeywords} onKeywordsChange={setRelatedKeywords} />
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
