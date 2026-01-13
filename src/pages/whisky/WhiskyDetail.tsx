/**
 * 위스키 상세 페이지
 * - 신규 등록 (id가 'new'인 경우)
 * - 상세 조회 및 수정 (id가 숫자인 경우)
 * - API 연동 전 Mock 데이터로 동작
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, Trash2, Upload, X, Plus, Search } from 'lucide-react';

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
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/useToast';

import type { WhiskyCategory } from '@/types/api';
import {
  MOCK_WHISKY_DETAIL,
  MOCK_REGIONS,
  WHISKY_CATEGORY_OPTIONS,
  DEFAULT_WHISKY_FORM,
} from '@/data/mock/whisky.mock';

// Mock 테이스팅 태그 목록 (TastingTagList와 동일한 데이터 - 실제로는 API에서 조회)
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

// 이미지 업로드 컴포넌트
interface ImageUploadProps {
  imageUrl: string | null;
  onImageChange: (file: File | null, previewUrl: string | null) => void;
}

function ImageUpload({ imageUrl, onImageChange }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(imageUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPreviewUrl(imageUrl);
  }, [imageUrl]);

  const handleFile = useCallback(
    (file: File) => {
      // 이미지 파일인지 확인
      if (!file.type.startsWith('image/')) {
        return;
      }

      // 미리보기 URL 생성
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      onImageChange(file, url);
    },
    [onImageChange]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    onImageChange(null, null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {previewUrl ? (
        <div className="relative">
          <img src={previewUrl} alt="위스키 이미지" className="w-full rounded-lg border" />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute right-2 top-2 h-8 w-8"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          className={`flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary/50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="mb-2 h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">이미지를 드래그하거나 클릭하여 업로드</p>
          <p className="mt-1 text-xs text-muted-foreground">PNG, JPG, WEBP 지원</p>
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  );
}

// 태그 선택 컴포넌트 (Chip 형태)
interface TagSelectorProps {
  selectedTags: string[];
  availableTags: string[];
  onTagsChange: (tags: string[]) => void;
}

function TagSelector({ selectedTags, availableTags, onTagsChange }: TagSelectorProps) {
  const [customTag, setCustomTag] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');

  // 선택되지 않은 태그만 필터링
  const unselectedTags = availableTags.filter((tag) => !selectedTags.includes(tag));

  // 검색어로 필터링
  const filteredUnselectedTags = searchKeyword
    ? unselectedTags.filter((tag) => tag.toLowerCase().includes(searchKeyword.toLowerCase()))
    : unselectedTags;

  const handleAddTag = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      onTagsChange([...selectedTags, tag]);
    }
  };

  const handleRemoveTag = (tag: string) => {
    onTagsChange(selectedTags.filter((t) => t !== tag));
  };

  const handleAddCustomTag = () => {
    const trimmed = customTag.trim();
    if (trimmed && !selectedTags.includes(trimmed)) {
      onTagsChange([...selectedTags, trimmed]);
      setCustomTag('');
    }
  };

  const handleCustomTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCustomTag();
    }
  };

  return (
    <div className="space-y-4">
      {/* 선택된 태그 */}
      <div>
        <p className="mb-2 text-sm font-medium">선택된 태그</p>
        {selectedTags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {selectedTags.map((tag) => (
              <Badge key={tag} variant="default" className="gap-1 pr-1">
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1 rounded-full p-0.5 hover:bg-primary-foreground/20"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">선택된 태그가 없습니다.</p>
        )}
      </div>

      {/* 직접 입력 */}
      <div>
        <p className="mb-2 text-sm font-medium">새 태그 추가</p>
        <div className="flex gap-2">
          <Input
            placeholder="태그 입력 후 Enter..."
            value={customTag}
            onChange={(e) => setCustomTag(e.target.value)}
            onKeyDown={handleCustomTagKeyDown}
            className="h-8 flex-1"
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleAddCustomTag}
            disabled={!customTag.trim()}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 기존 태그 목록 (Chip 형태) */}
      <div>
        <p className="mb-2 text-sm font-medium">기존 태그에서 선택</p>
        <div className="relative mb-2">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="태그 검색..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="h-8 pl-8"
          />
        </div>
        {filteredUnselectedTags.length > 0 ? (
          <div className="flex max-h-32 flex-wrap gap-1.5 overflow-y-auto">
            {filteredUnselectedTags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="cursor-pointer hover:bg-accent"
                onClick={() => handleAddTag(tag)}
              >
                <Plus className="mr-1 h-3 w-3" />
                {tag}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {searchKeyword ? '검색 결과가 없습니다.' : '추가할 태그가 없습니다.'}
          </p>
        )}
      </div>
    </div>
  );
}

export function WhiskyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  // 신규 등록 모드 여부
  const isNewMode = id === 'new';

  // 상태
  const [isLoading, setIsLoading] = useState(!isNewMode);
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
    if (!isNewMode && id) {
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
          });
          setTastingTags(mockData.alcoholsTastingTags);
          setImagePreviewUrl(mockData.alcoholUrlImg);
        }
        setIsLoading(false);
      }, 300);
    }
  }, [id, isNewMode, form]);

  const handleImageChange = (file: File | null, previewUrl: string | null) => {
    setImageFile(file);
    setImagePreviewUrl(previewUrl);
    // TODO: presigned URL로 업로드 후 imageUrl 저장
    if (file) {
      console.log('Image file selected:', file.name, file.size);
    }
  };

  const onSubmit = (data: WhiskyFormValues) => {
    console.log('Submit:', { ...data, tastingTags, imageFile, isNew: isNewMode });
    // TODO: API 연동 시 mutation 호출
    // 1. imageFile이 있으면 presigned URL로 업로드
    // 2. 위스키 정보 저장 (imageUrl, tastingTags 포함)
    showToast({
      type: 'success',
      message: isNewMode ? '위스키가 등록되었습니다.' : '위스키 정보가 저장되었습니다.',
    });

    if (isNewMode) {
      // 등록 후 목록으로 이동
      navigate('/whisky');
    }
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
            <h1 className="text-2xl font-bold">{isNewMode ? '위스키 등록' : '위스키 상세'}</h1>
            {!isNewMode && <p className="text-muted-foreground">ID: {id}</p>}
          </div>
        </div>
        <div className="flex gap-2">
          {!isNewMode && (
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              삭제
            </Button>
          )}
          <Button onClick={form.handleSubmit(onSubmit)}>
            <Save className="mr-2 h-4 w-4" />
            {isNewMode ? '등록' : '저장'}
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

          {/* 이미지 & 통계 카드 (1/3 너비) */}
          <div className="space-y-6">
            {/* 이미지 카드 */}
            <Card>
              <CardHeader>
                <CardTitle>이미지</CardTitle>
                <CardDescription>이미지를 드래그하거나 클릭하여 업로드합니다.</CardDescription>
              </CardHeader>
              <CardContent>
                <ImageUpload imageUrl={imagePreviewUrl} onImageChange={handleImageChange} />
              </CardContent>
            </Card>

            {/* 통계 카드 (수정 모드에서만, 읽기 전용) */}
            {!isNewMode && id && MOCK_WHISKY_DETAIL[id] && (
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

          {/* 테이스팅 태그 카드 (전체 너비) */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">테이스팅 태그</CardTitle>
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
