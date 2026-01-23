/**
 * 테이스팅 태그 상세 페이지
 * - 신규 등록 (id가 'new'인 경우)
 * - 상세 조회 및 수정 (id가 숫자인 경우)
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { DetailPageHeader } from '@/components/common/DetailPageHeader';
import { ImageUpload } from '@/components/common/ImageUpload';
import { FormField } from '@/components/common/FormField';
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog';

import {
  useTastingTagList,
  useTastingTagCreate,
  useTastingTagUpdate,
  useTastingTagDelete,
} from '@/hooks/useTastingTags';

// Zod 스키마 정의
const tastingTagFormSchema = z.object({
  korName: z.string().min(1, '한글명은 필수입니다'),
  engName: z.string().min(1, '영문명은 필수입니다'),
  description: z.string().optional(),
});

type TastingTagFormValues = z.infer<typeof tastingTagFormSchema>;

export function TastingTagDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const isNewMode = id === 'new';
  const tagId = isNewMode ? undefined : Number(id);

  // API 조회 (목록에서 해당 태그 찾기 - 상세 API 미구현)
  const { data: listData, isLoading } = useTastingTagList(
    { size: 100 },
  );
  const tagData = tagId ? listData?.items.find((t) => t.id === tagId) : undefined;

  // Mutations
  const createMutation = useTastingTagCreate({
    onSuccess: () => {
      navigate('/tasting-tags');
    },
  });

  const updateMutation = useTastingTagUpdate({
    onSuccess: () => {
      // 수정 완료 후 페이지에 남아있음
    },
  });

  const deleteMutation = useTastingTagDelete({
    onSuccess: () => {
      navigate('/tasting-tags');
    },
  });

  // 상태
  const [iconBase64, setIconBase64] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // React Hook Form 설정
  const form = useForm<TastingTagFormValues>({
    resolver: zodResolver(tastingTagFormSchema),
    defaultValues: {
      korName: '',
      engName: '',
      description: '',
    },
  });

  // API 데이터로 폼 초기화 (수정 모드)
  useEffect(() => {
    if (tagData) {
      form.reset({
        korName: tagData.korName,
        engName: tagData.engName,
        description: tagData.description ?? '',
      });
      setIconBase64(tagData.icon);
    }
  }, [tagData, form]);

  // 아이콘 이미지 변경 (File → base64 변환)
  const handleIconChange = (file: File | null, previewUrl: string | null) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setIconBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setIconBase64(previewUrl);
    }
  };

  const onSubmit = (data: TastingTagFormValues) => {
    const formData = {
      korName: data.korName,
      engName: data.engName,
      icon: iconBase64,
      description: data.description || null,
    };

    if (isNewMode) {
      createMutation.mutate(formData);
    } else if (tagId) {
      updateMutation.mutate({ id: tagId, data: formData });
    }
  };

  const handleDeleteConfirm = () => {
    if (tagId) {
      deleteMutation.mutate(tagId);
    }
  };

  const handleBack = () => navigate('/tasting-tags');

  const isMutating = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <DetailPageHeader
        title={isNewMode ? '태그 등록' : '태그 상세'}
        subtitle={tagData ? `ID: ${id}` : undefined}
        onBack={handleBack}
        actions={
          <>
            {tagData && (
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
        <div className="space-y-6">
          {/* 기본 정보 + 아이콘 섹션 */}
          <div className="flex flex-col gap-6 lg:flex-row">
            {/* 기본 정보 카드 */}
            <Card className="flex-[2]">
              <CardHeader>
                <CardTitle>기본 정보</CardTitle>
                <CardDescription>태그의 기본 정보를 입력합니다.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 한글명 / 영문명 */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="한글명" required error={form.formState.errors.korName?.message}>
                    <Input {...form.register('korName')} placeholder="예: 바닐라" />
                  </FormField>
                  <FormField label="영문명" required error={form.formState.errors.engName?.message}>
                    <Input {...form.register('engName')} placeholder="예: Vanilla" />
                  </FormField>
                </div>

                {/* 설명 */}
                <FormField label="설명">
                  <Textarea
                    {...form.register('description')}
                    placeholder="태그에 대한 설명을 입력하세요..."
                    rows={4}
                  />
                </FormField>
              </CardContent>
            </Card>

            {/* 아이콘 카드 */}
            <Card className="flex-1">
              <CardHeader>
                <CardTitle>아이콘</CardTitle>
                <CardDescription>태그 아이콘 이미지를 업로드합니다. (선택)</CardDescription>
              </CardHeader>
              <CardContent>
                <ImageUpload
                  imageUrl={iconBase64}
                  onImageChange={handleIconChange}
                  minHeight={150}
                />
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
        title="태그 삭제"
        description="정말 이 태그를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
