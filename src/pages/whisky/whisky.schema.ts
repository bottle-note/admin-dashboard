/**
 * 위스키 상세 페이지 폼 스키마 및 상수
 */

import { z } from 'zod';
import type { AlcoholCategory } from '@/types/api';

/** 카테고리 그룹 옵션 */
export const CATEGORY_GROUP_OPTIONS: { value: AlcoholCategory; label: string }[] = [
  { value: 'SINGLE_MALT', label: '싱글몰트 위스키' },
  { value: 'BLEND', label: '블렌디드 위스키' },
  { value: 'BLENDED_MALT', label: '블렌디드 몰트 위스키' },
  { value: 'BOURBON', label: '버번 위스키' },
  { value: 'RYE', label: '라이 위스키' },
  { value: 'OTHER', label: '기타 위스키' },
];

/** 위스키 폼 Zod 스키마 */
export const whiskyFormSchema = z.object({
  korName: z.string().min(1, '한글명은 필수입니다'),
  engName: z.string().min(1, '영문명은 필수입니다'),
  korCategory: z.string().min(1, '카테고리는 필수입니다'),
  engCategory: z.string().min(1, '카테고리는 필수입니다'),
  categoryGroup: z.enum(['SINGLE_MALT', 'BLEND', 'BLENDED_MALT', 'BOURBON', 'RYE', 'OTHER'], {
    message: '카테고리 그룹은 필수입니다',
  }),
  regionId: z.number().min(1, '지역은 필수입니다'),
  distilleryId: z.number().min(1, '증류소는 필수입니다'),
  abv: z.number().min(0, '도수는 0 이상이어야 합니다').max(100, '도수는 100 이하여야 합니다'),
  age: z.string().min(1, '숙성년도는 필수입니다'),
  cask: z.string().min(1, '캐스크는 필수입니다'),
  volume: z.string().min(1, '용량은 필수입니다'),
  description: z.string().min(1, '설명은 필수입니다'),
  imageUrl: z.string().min(1, '이미지는 필수입니다'),
});

/** 위스키 폼 타입 */
export type WhiskyFormValues = z.infer<typeof whiskyFormSchema>;
