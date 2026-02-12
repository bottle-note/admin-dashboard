/**
 * 위스키 상세 페이지 폼 스키마
 */

import { z } from 'zod';

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
  distilleryId: z.number().min(0),
  abv: z.number().min(0, '도수는 0 이상이어야 합니다').max(100, '도수는 100 이하여야 합니다'),
  age: z.string(),
  cask: z.string(),
  volume: z.string().min(1, '용량은 필수입니다'),
  description: z.string(),
  imageUrl: z.string(),
});

/** 위스키 폼 타입 */
export type WhiskyFormValues = z.infer<typeof whiskyFormSchema>;
