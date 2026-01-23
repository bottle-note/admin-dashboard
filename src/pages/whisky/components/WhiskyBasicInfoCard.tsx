/**
 * 위스키 기본 정보 카드
 * - 한글명, 영문명, 카테고리, 지역, 도수, 증류소 등 기본 정보 폼
 */

import type { UseFormReturn } from 'react-hook-form';

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
import { FormField } from '@/components/common/FormField';

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

  // 카테고리 선택 시 korCategory, engCategory, categoryGroup을 함께 저장
  const handleCategoryChange = (korCategory: string) => {
    const selected = categories.find((c) => c.korCategory === korCategory);
    if (selected) {
      setValue('korCategory', selected.korCategory);
      setValue('engCategory', selected.engCategory);
      setValue('categoryGroup', selected.categoryGroup);
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
          <Select value={watch('korCategory')} onValueChange={handleCategoryChange}>
            <SelectTrigger>
              <SelectValue placeholder="카테고리 선택" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.korCategory} value={cat.korCategory}>
                  {cat.korCategory}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        {/* 지역 / 증류소 */}
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="지역" required error={errors.regionId?.message}>
            <Select
              value={String(watch('regionId') || '')}
              onValueChange={(v) => setValue('regionId', Number(v))}
            >
              <SelectTrigger>
                <SelectValue placeholder="지역 선택" />
              </SelectTrigger>
              <SelectContent>
                {regions.map((region) => (
                  <SelectItem key={region.id} value={String(region.id)}>
                    {region.korName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="증류소" required error={errors.distilleryId?.message}>
            <Select
              value={String(watch('distilleryId') || '')}
              onValueChange={(v) => setValue('distilleryId', v ? Number(v) : 0)}
            >
              <SelectTrigger>
                <SelectValue placeholder="증류소 선택" />
              </SelectTrigger>
              <SelectContent>
                {distilleries.map((distillery) => (
                  <SelectItem key={distillery.id} value={String(distillery.id)}>
                    {distillery.korName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
