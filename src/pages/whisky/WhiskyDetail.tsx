/**
 * 위스키 상세 페이지
 * - 신규 등록 (id가 'new'인 경우)
 * - 상세 조회 및 수정 (id가 숫자인 경우)
 * - API 연동 전 Mock 데이터로 동작
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/useToast';

import { DetailPageHeader } from '@/components/common/DetailPageHeader';
import { ImageUpload } from '@/components/common/ImageUpload';
import { TagSelector } from '@/components/common/TagSelector';

import type { WhiskyCategory } from '@/types/api';
import {
  MOCK_WHISKY_DETAIL,
  MOCK_REGIONS,
  WHISKY_CATEGORY_OPTIONS,
  DEFAULT_WHISKY_FORM,
} from '@/data/mock/whisky.mock';

// Mock 테이스팅 태그 목록 (실제로는 API에서 조회)
const AVAILABLE_TASTING_TAGS: string[] = [
  '바닐라',
  '꿀',
  '캐러멜',
  '오크',
  '스모키',
  '피트',
  '과일향',
  '시트러스',
  '꽃향',
  '스파이시',
  '초콜릿',
  '견과류',
  '토피',
  '바다향',
  '요오드',
  '후추',
  '부드러운',
  '드라이',
  '복합적인',
  '균형잡힌',
  '셰리',
];

// Zod 스키마 정의
const whiskyFormSchema = z.object({
  korName: z.string().min(1, '한글명은 필수입니다'),
  engName: z.string().min(1, '영문명은 필수입니다'),
  category: z.enum(['SINGLE_MALT', 'BLEND', 'BLENDED_MALT', 'BOURBON', 'RYE', 'OTHER'], {
    message: '카테고리는 필수입니다',
  }),
  regionId: z.number().min(1, '지역은 필수입니다'),
  abv: z.number().min(0, '도수는 0 이상이어야 합니다').max(100, '도수는 100 이하여야 합니다'),
  description: z.string().optional(),
  distillery: z.string().optional(),
  cask: z.string().optional(),
});

type WhiskyFormValues = z.infer<typeof whiskyFormSchema>;

// 폼 필드 래퍼 컴포넌트
interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}

function FormField({ label, required, error, children }: FormFieldProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

export function WhiskyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  // 데이터 조회 (신규 등록 시 null)
  const whiskyData = id && id !== 'new' ? MOCK_WHISKY_DETAIL[id] ?? null : null;
  const isNewMode = id === 'new';

  // 상태
  const [isLoading, setIsLoading] = useState(false);
  const [tastingTags, setTastingTags] = useState<string[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  // React Hook Form 설정
  const form = useForm<WhiskyFormValues>({
    resolver: zodResolver(whiskyFormSchema),
    defaultValues: DEFAULT_WHISKY_FORM,
  });

  // Mock 데이터 로드 (수정 모드일 때만)
  useEffect(() => {
    if (whiskyData) {
      setIsLoading(true);
      // 실제 API 연동 시 TanStack Query로 교체
      setTimeout(() => {
        form.reset({
          korName: whiskyData.korName,
          engName: whiskyData.engName,
          category: whiskyData.category,
          regionId: whiskyData.regionId,
          abv: parseFloat(whiskyData.abv),
          description: whiskyData.description || '',
          distillery: whiskyData.korDistillery ?? '',
          cask: whiskyData.cask ?? '',
        });
        setTastingTags(whiskyData.alcoholsTastingTags);
        setImagePreviewUrl(whiskyData.alcoholUrlImg);
        setIsLoading(false);
      }, 300);
    }
  }, [whiskyData, form]);

  const handleImageChange = (file: File | null, previewUrl: string | null) => {
    setImageFile(file);
    setImagePreviewUrl(previewUrl);
    if (file) {
      console.log('Image file selected:', file.name, file.size);
    }
  };

  const onSubmit = (data: WhiskyFormValues) => {
    console.log('Submit:', { ...data, tastingTags, imageFile, isNew: isNewMode });
    showToast({
      type: 'success',
      message: isNewMode ? '위스키가 등록되었습니다.' : '위스키 정보가 저장되었습니다.',
    });

    if (isNewMode) {
      navigate('/whisky');
    }
  };

  const handleDelete = () => {
    if (confirm('정말 삭제하시겠습니까?')) {
      showToast({
        type: 'error',
        message: '위스키가 삭제되었습니다.',
      });
      navigate('/whisky');
    }
  };

  const handleBack = () => navigate('/whisky');

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
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                삭제
              </Button>
            )}
            <Button onClick={form.handleSubmit(onSubmit)}>
              <Save className="mr-2 h-4 w-4" />
              {isNewMode ? '등록' : '저장'}
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
            {/* 기본 정보 카드 */}
            <Card className="flex-[2]">
              <CardHeader>
                <CardTitle>기본 정보</CardTitle>
                <CardDescription>위스키의 기본 정보를 입력합니다.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 한글명 / 영문명 */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="한글명" required error={form.formState.errors.korName?.message}>
                    <Input {...form.register('korName')} placeholder="예: 글렌피딕 12년" />
                  </FormField>
                  <FormField label="영문명" required error={form.formState.errors.engName?.message}>
                    <Input {...form.register('engName')} placeholder="예: Glenfiddich 12 Years" />
                  </FormField>
                </div>

                {/* 카테고리 / 지역 */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="카테고리" required>
                    <Select
                      value={form.watch('category')}
                      onValueChange={(v) => form.setValue('category', v as WhiskyCategory)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="카테고리 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {WHISKY_CATEGORY_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="지역" required>
                    <Select
                      value={String(form.watch('regionId'))}
                      onValueChange={(v) => form.setValue('regionId', Number(v))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="지역 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {MOCK_REGIONS.map((region) => (
                          <SelectItem key={region.id} value={String(region.id)}>
                            {region.korName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                </div>

                {/* 도수 / 증류소 */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="도수 (ABV %)" required error={form.formState.errors.abv?.message}>
                    <Input
                      type="number"
                      step="0.1"
                      {...form.register('abv', { valueAsNumber: true })}
                      placeholder="예: 40"
                    />
                  </FormField>
                  <FormField label="증류소">
                    <Input {...form.register('distillery')} placeholder="예: 글렌피딕 증류소" />
                  </FormField>
                </div>

                {/* 캐스크 */}
                <FormField label="캐스크">
                  <Input {...form.register('cask')} placeholder="예: 아메리칸 오크 & 스패니시 셰리" />
                </FormField>

                {/* 설명 */}
                <FormField label="설명">
                  <Textarea
                    {...form.register('description')}
                    placeholder="위스키에 대한 설명을 입력하세요..."
                    rows={4}
                  />
                </FormField>
              </CardContent>
            </Card>

            {/* 이미지 + 통계 카드 */}
            <div className="flex flex-1 flex-col gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>이미지</CardTitle>
                  <CardDescription>이미지를 드래그하거나 클릭하여 업로드합니다.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ImageUpload imageUrl={imagePreviewUrl} onImageChange={handleImageChange} />
                </CardContent>
              </Card>

              {/* 통계 카드 (수정 모드만) */}
              {whiskyData && (
                <Card>
                  <CardHeader>
                    <CardTitle>통계</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">평균 평점</span>
                      <span className="font-medium">{whiskyData.rating.toFixed(1)} / 5.0</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">리뷰 수</span>
                      <span className="font-medium">
                        {whiskyData.totalRatingsCount.toLocaleString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* 테이스팅 태그 섹션 */}
          <Card>
            <CardHeader>
              <CardTitle>테이스팅 태그</CardTitle>
              <CardDescription>
                이 위스키의 테이스팅 노트를 선택하거나 직접 추가할 수 있습니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TagSelector
                selectedTags={tastingTags}
                availableTags={AVAILABLE_TASTING_TAGS}
                onTagsChange={setTastingTags}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
