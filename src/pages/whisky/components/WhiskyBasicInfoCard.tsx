/**
 * 위스키 기본 정보 카드
 * - 한글명, 영문명, 카테고리, 지역, 도수, 증류소 등 기본 정보 폼
 */

import type { UseFormReturn } from 'react-hook-form';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormField } from '@/components/common/FormField';
import { SearchableSelect } from '@/components/common/SearchableSelect';

import type { WhiskyFormValues } from '../whisky.schema';
import type { AlcoholCategory, CategoryReference } from '@/types/api';
import { ALCOHOL_CATEGORIES, CATEGORY_GROUP_LABELS, GROUP_TO_CATEGORY } from '@/types/api';

/**
 * WhiskyBasicInfoCard 컴포넌트의 props
 * @param form - React Hook Form 인스턴스
 * @param categories - 카테고리 레퍼런스 목록 (API에서 조회)
 * @param regions - 지역 목록
 * @param distilleries - 증류소 목록
 */
export interface WhiskyBasicInfoCardProps {
  form: UseFormReturn<WhiskyFormValues>;
  categories: CategoryReference[];
  regions: Array<{ id: number; korName: string }>;
  distilleries: Array<{ id: number; korName: string }>;
  disabled?: boolean;
}

export function WhiskyBasicInfoCard({
  form,
  categories,
  regions,
  distilleries,
  disabled = false,
}: WhiskyBasicInfoCardProps) {
  const { register, watch, setValue, formState } = form;
  const { errors } = formState;

  const regionOptions = regions.map((region) => ({ value: String(region.id), label: region.korName }));
  const distilleryOptions = distilleries.map((distillery) => ({ value: String(distillery.id), label: distillery.korName }));

  const currentCategoryGroup = watch('categoryGroup');
  const isOtherCategory = currentCategoryGroup === 'OTHER';

  // OTHER일 때 기존 서브카테고리 옵션 (CategoryReference API에서 메인 그룹 제외)
  const mainKorCategories = new Set(Object.values(GROUP_TO_CATEGORY).map((c) => c.korCategory));
  const otherCategoryOptions = categories
    .filter((cat) => !mainKorCategories.has(cat.korCategory))
    .map((cat) => ({ value: cat.korCategory, label: `${cat.korCategory} (${cat.engCategory})` }));

  // 카테고리 그룹 변경 시 korCategory/engCategory 자동 세팅
  const handleCategoryGroupChange = (group: AlcoholCategory) => {
    setValue('categoryGroup', group);
    if (group !== 'OTHER') {
      const mapped = GROUP_TO_CATEGORY[group];
      setValue('korCategory', mapped.korCategory);
      setValue('engCategory', mapped.engCategory);
    } else {
      setValue('korCategory', '');
      setValue('engCategory', '');
    }
  };

  // OTHER 서브카테고리 선택 시 engCategory도 함께 세팅
  const handleOtherCategorySelect = (korCategory: string) => {
    setValue('korCategory', korCategory);
    const matched = categories.find((c) => c.korCategory === korCategory);
    if (matched) {
      setValue('engCategory', matched.engCategory);
    }
  };

  return (
    <Card className="flex-[2]">
      <CardHeader>
        <CardTitle>기본 정보</CardTitle>
        <CardDescription>위스키의 기본 정보를 입력합니다.</CardDescription>
      </CardHeader>
      <CardContent className={`space-y-4 ${disabled ? 'pointer-events-none opacity-60' : ''}`}>
        {/* 한글명 / 영문명 */}
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="한글명" required error={errors.korName?.message}>
            <Input {...register('korName')} placeholder="예: 글렌피딕 12년" />
          </FormField>
          <FormField label="영문명" required error={errors.engName?.message}>
            <Input {...register('engName')} placeholder="예: Glenfiddich 12 Years" />
          </FormField>
        </div>

        {/* 카테고리 그룹 (1차 선택) */}
        <FormField label="카테고리 그룹" required error={errors.categoryGroup?.message}>
          <Select
            value={currentCategoryGroup}
            onValueChange={(v) => handleCategoryGroupChange(v as AlcoholCategory)}
          >
            <SelectTrigger className="sm:w-[240px]">
              <SelectValue placeholder="카테고리 그룹 선택" />
            </SelectTrigger>
            <SelectContent>
              {ALCOHOL_CATEGORIES.map((value) => (
                <SelectItem key={value} value={value}>{CATEGORY_GROUP_LABELS[value]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        {/* 카테고리: 메인 그룹은 읽기 전용, OTHER는 선택+입력 */}
        {isOtherCategory ? (
          <>
            {otherCategoryOptions.length > 0 && (
              <FormField label="기존 카테고리">
                <SearchableSelect
                  value={watch('korCategory')}
                  onChange={handleOtherCategorySelect}
                  options={otherCategoryOptions}
                  placeholder="기존 카테고리에서 선택..."
                  searchPlaceholder="카테고리 검색..."
                  emptyMessage="카테고리를 찾을 수 없습니다."
                />
              </FormField>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="한글 카테고리" required error={errors.korCategory?.message}>
                <Input {...register('korCategory')} placeholder="예: 테네시" />
              </FormField>
              <FormField label="영문 카테고리" required error={errors.engCategory?.message}>
                <Input {...register('engCategory')} placeholder="예: Tennessee" />
              </FormField>
            </div>
          </>
        ) : (
          currentCategoryGroup && (
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="한글 카테고리">
                <Input value={watch('korCategory')} readOnly className="bg-muted" />
              </FormField>
              <FormField label="영문 카테고리">
                <Input value={watch('engCategory')} readOnly className="bg-muted" />
              </FormField>
            </div>
          )
        )}

        {/* 지역 / 증류소 */}
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="지역" required error={errors.regionId?.message}>
            <SearchableSelect
              value={String(watch('regionId') || '')}
              onChange={(v) => setValue('regionId', Number(v))}
              options={regionOptions}
              placeholder="지역 선택"
              searchPlaceholder="지역 검색..."
              emptyMessage="지역을 찾을 수 없습니다."
            />
          </FormField>
          <FormField label="증류소" error={errors.distilleryId?.message}>
            <SearchableSelect
              value={String(watch('distilleryId') || '')}
              onChange={(v) => setValue('distilleryId', v ? Number(v) : 0)}
              options={distilleryOptions}
              placeholder="증류소 선택"
              searchPlaceholder="증류소 검색..."
              emptyMessage="증류소를 찾을 수 없습니다."
            />
          </FormField>
        </div>

        {/* 도수 / 숙성년도 */}
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="도수 (ABV %)" required error={errors.abv?.message}>
            <Input
              type="number"
              step="0.1"
              {...register('abv', { valueAsNumber: true })}
              placeholder="예: 40"
            />
          </FormField>
          <FormField label="숙성년도" error={errors.age?.message}>
            <Input {...register('age')} placeholder="예: 12" />
          </FormField>
        </div>

        {/* 용량 / 캐스크 */}
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="용량" required error={errors.volume?.message}>
            <Input {...register('volume')} placeholder="예: 700ml" />
          </FormField>
          <FormField label="캐스크" error={errors.cask?.message}>
            <Input {...register('cask')} placeholder="예: 아메리칸 오크 & 스패니시 셰리" />
          </FormField>
        </div>

        {/* 설명 */}
        <FormField label="설명" error={errors.description?.message}>
          <Textarea
            {...register('description')}
            placeholder="위스키에 대한 설명을 입력하세요..."
            rows={4}
          />
        </FormField>
      </CardContent>
    </Card>
  );
}
