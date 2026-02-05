/**
 * 배너 상세 페이지 폼 스키마
 */

import { z } from 'zod';

/** 배너 폼 Zod 스키마 */
export const bannerFormSchema = z.object({
  name: z.string().min(1, '배너명은 필수입니다'),
  bannerType: z.enum(['SURVEY', 'CURATION', 'AD', 'PARTNERSHIP'], {
    message: '배너 타입을 선택해주세요',
  }),
  isActive: z.boolean(),
  imageUrl: z.string().min(1, '이미지를 업로드해주세요'),
  descriptionA: z.string(),
  descriptionB: z.string(),
  textPosition: z.enum(['LT', 'LB', 'RT', 'RB', 'CENTER'], {
    message: '텍스트 위치를 선택해주세요',
  }),
  nameFontColor: z.string().regex(/^[0-9a-fA-F]{6}$/, '올바른 HEX 색상을 입력해주세요 (예: ffffff)'),
  descriptionFontColor: z.string().regex(/^[0-9a-fA-F]{6}$/, '올바른 HEX 색상을 입력해주세요 (예: ffffff)'),
  targetUrl: z.string(),
  isExternalUrl: z.boolean(),
  isAlwaysVisible: z.boolean(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  /** 큐레이션 ID (CURATION 타입인 경우에만 사용) */
  curationId: z.number().nullable(),
}).refine(
  (data) => {
    // 상시 노출이 아닌 경우 시작일/종료일 필수
    if (!data.isAlwaysVisible) {
      return data.startDate && data.endDate;
    }
    return true;
  },
  {
    message: '노출 기간을 설정해주세요',
    path: ['startDate'],
  }
).refine(
  (data) => {
    // CURATION 타입인 경우 큐레이션 선택 필수
    if (data.bannerType === 'CURATION') {
      return data.curationId !== null;
    }
    return true;
  },
  {
    message: '큐레이션을 선택해주세요',
    path: ['curationId'],
  }
);

/** 배너 폼 타입 */
export type BannerFormValues = z.infer<typeof bannerFormSchema>;

/** 배너 폼 기본값 */
export const DEFAULT_BANNER_FORM: BannerFormValues = {
  name: '',
  bannerType: 'CURATION',
  isActive: true,
  imageUrl: '',
  descriptionA: '',
  descriptionB: '',
  textPosition: 'LB',
  nameFontColor: 'ffffff',
  descriptionFontColor: 'ffffff',
  targetUrl: '',
  isExternalUrl: false,
  isAlwaysVisible: false,
  startDate: null,
  endDate: null,
  curationId: null,
};
