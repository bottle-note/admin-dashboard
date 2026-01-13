/**
 * 위스키 상세 페이지
 * - 상세 조회 및 수정 (id가 숫자인 경우)
 * - API 연동 전 Mock 데이터로 동작
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';

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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/useToast';

import type { WhiskyCategory } from '@/types/api';
import {
  MOCK_WHISKY_DETAIL,
  MOCK_REGIONS,
  WHISKY_CATEGORY_OPTIONS,
  DEFAULT_WHISKY_FORM,
} from '@/data/mock/whisky.mock';

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
  imageUrl: z
    .string()
    .url('올바른 URL 형식이 아닙니다')
    .optional()
    .or(z.literal('')),
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

  // 상태
  const [isLoading, setIsLoading] = useState(true);
  const [tastingTags, setTastingTags] = useState<string[]>([]);

  // React Hook Form 설정
  const form = useForm<WhiskyFormValues>({
    resolver: zodResolver(whiskyFormSchema),
    defaultValues: DEFAULT_WHISKY_FORM,
  });

  // Mock 데이터 로드
  useEffect(() => {
    if (id) {
      // 실제 API 연동 시 이 부분을 TanStack Query로 교체
      setTimeout(() => {
        const mockData = MOCK_WHISKY_DETAIL[id];
        if (mockData) {
          form.reset({
            korName: mockData.korName,
            engName: mockData.engName,
            category: mockData.category,
            regionId: mockData.regionId,
            abv: parseFloat(mockData.abv),
            description: mockData.description || '',
            distillery: mockData.korDistillery ?? '',
            cask: mockData.cask ?? '',
            imageUrl: mockData.alcoholUrlImg ?? '',
          });
          setTastingTags(mockData.alcoholsTastingTags);
        }
        setIsLoading(false);
      }, 300);
    } else {
      setIsLoading(false);
    }
  }, [id, form]);

  const onSubmit = (data: WhiskyFormValues) => {
    console.log('Submit:', data);
    // TODO: API 연동 시 mutation 호출
    showToast({
      type: 'success',
      message: '위스키 정보가 저장되었습니다.',
    });
  };

  const handleDelete = () => {
    if (confirm('정말 삭제하시겠습니까?')) {
      // TODO: API 연동 시 delete mutation 호출
      showToast({
        type: 'error',
        message: '위스키가 삭제되었습니다.',
      });
      navigate('/whisky');
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/whisky')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">위스키 상세</h1>
            <p className="text-muted-foreground">ID: {id}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            삭제
          </Button>
          <Button onClick={form.handleSubmit(onSubmit)}>
            <Save className="mr-2 h-4 w-4" />
            저장
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-muted-foreground">로딩 중...</div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* 기본 정보 카드 (2/3 너비) */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>기본 정보</CardTitle>
              <CardDescription>위스키의 기본 정보를 입력합니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 한글명 / 영문명 */}
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label="한글명"
                  required
                  error={form.formState.errors.korName?.message}
                >
                  <Input {...form.register('korName')} placeholder="예: 글렌피딕 12년" />
                </FormField>
                <FormField
                  label="영문명"
                  required
                  error={form.formState.errors.engName?.message}
                >
                  <Input
                    {...form.register('engName')}
                    placeholder="예: Glenfiddich 12 Years"
                  />
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
                <FormField
                  label="도수 (ABV %)"
                  required
                  error={form.formState.errors.abv?.message}
                >
                  <Input
                    type="number"
                    step="0.1"
                    {...form.register('abv', { valueAsNumber: true })}
                    placeholder="예: 40"
                  />
                </FormField>
                <FormField label="증류소">
                  <Input
                    {...form.register('distillery')}
                    placeholder="예: 글렌피딕 증류소"
                  />
                </FormField>
              </div>

              {/* 캐스크 */}
              <FormField label="캐스크">
                <Input
                  {...form.register('cask')}
                  placeholder="예: 아메리칸 오크 & 스패니시 셰리"
                />
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

          {/* 이미지 & 태그 카드 (1/3 너비) */}
          <div className="space-y-6">
            {/* 이미지 카드 */}
            <Card>
              <CardHeader>
                <CardTitle>이미지</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {form.watch('imageUrl') && (
                  <img
                    src={form.watch('imageUrl')}
                    alt="위스키 이미지"
                    className="w-full rounded-lg border"
                  />
                )}
                <FormField label="이미지 URL" error={form.formState.errors.imageUrl?.message}>
                  <Input {...form.register('imageUrl')} placeholder="https://..." />
                </FormField>
              </CardContent>
            </Card>

            {/* 테이스팅 태그 카드 */}
            <Card>
              <CardHeader>
                <CardTitle>테이스팅 태그</CardTitle>
                <CardDescription>이 위스키의 테이스팅 노트입니다.</CardDescription>
              </CardHeader>
              <CardContent>
                {tastingTags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {tastingTags.map((tag, idx) => (
                      <Badge key={idx} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">등록된 태그가 없습니다.</p>
                )}
              </CardContent>
            </Card>

            {/* 통계 카드 (읽기 전용) */}
            {id && MOCK_WHISKY_DETAIL[id] && (
              <Card>
                <CardHeader>
                  <CardTitle>통계</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">평균 평점</span>
                    <span className="font-medium">
                      {MOCK_WHISKY_DETAIL[id].rating.toFixed(1)} / 5.0
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">리뷰 수</span>
                    <span className="font-medium">
                      {MOCK_WHISKY_DETAIL[id].totalRatingsCount.toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
