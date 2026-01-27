/**
 * 위스키 기본 정보 카드
 * - 한글명, 영문명, 카테고리, 지역, 도수, 증류소 등 기본 정보 폼
 */

import { useMemo } from 'react';
import type { UseFormReturn } from 'react-hook-form';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/common/FormField';
import { SearchableSelect } from '@/components/common/SearchableSelect';

import type { WhiskyFormValues } from '../whisky.schema';
import type { CategoryReference } from '@/types/api';

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
}

export function WhiskyBasicInfoCard({
  form,
  categories,
  regions,
  distilleries,
}: WhiskyBasicInfoCardProps) {
  const { register, watch, setValue, formState } = form;
  const { errors } = formState;

  // 옵션 목록 변환
  const categoryOptions = useMemo(
    () => categories.map((cat) => ({ value: cat.korCategory, label: cat.korCategory })),
    [categories]
  );

  const regionOptions = useMemo(
    () => regions.map((region) => ({ value: String(region.id), label: region.korName })),
    [regions]
  );

  const distilleryOptions = useMemo(
    () => distilleries.map((distillery) => ({ value: String(distillery.id), label: distillery.korName })),
    [distilleries]
  );

  // 카테고리 선택 시 korCategory, engCategory, categoryGroup을 함께 저장
  const handleCategoryChange = (korCategory: string) => {
    const selected = categories.find((c) => c.korCategory === korCategory);
    if (selected) {
      setValue('korCategory', selected.korCategory);
      setValue('engCategory', selected.engCategory);
      // API에서 categoryGroup이 없을 수 있으므로 기본값 'OTHER' 사용
      setValue('categoryGroup', selected.categoryGroup ?? 'OTHER');
    }
  };

  return (
    <Card className="flex-[2]">
      <CardHeader>
        <CardTitle>기본 정보</CardTitle>
        <CardDescription>위스키의 기본 정보를 입력합니다.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 한글명 / 영문명 */}
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="한글명" required error={errors.korName?.message}>
            <Input {...register('korName')} placeholder="예: 글렌피딕 12년" />
          </FormField>
          <FormField label="영문명" required error={errors.engName?.message}>
            <Input {...register('engName')} placeholder="예: Glenfiddich 12 Years" />
          </FormField>
        </div>

        {/* 카테고리 */}
        <FormField label="카테고리" required error={errors.korCategory?.message}>
          <SearchableSelect
            value={watch('korCategory')}
            onChange={handleCategoryChange}
            options={categoryOptions}
            placeholder="카테고리 선택"
            searchPlaceholder="카테고리 검색..."
            emptyMessage="카테고리를 찾을 수 없습니다."
          />
        </FormField>

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
          <FormField label="증류소" required error={errors.distilleryId?.message}>
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
          <FormField label="숙성년도" required error={errors.age?.message}>
            <Input {...register('age')} placeholder="예: 12" />
          </FormField>
        </div>

        {/* 용량 / 캐스크 */}
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="용량" required error={errors.volume?.message}>
            <Input {...register('volume')} placeholder="예: 700ml" />
          </FormField>
          <FormField label="캐스크" required error={errors.cask?.message}>
            <Input {...register('cask')} placeholder="예: 아메리칸 오크 & 스패니시 셰리" />
          </FormField>
        </div>

        {/* 설명 */}
        <FormField label="설명" required error={errors.description?.message}>
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
