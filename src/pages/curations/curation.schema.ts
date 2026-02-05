import { z } from 'zod';

export const curationFormSchema = z.object({
  name: z.string().min(1, '큐레이션명은 필수입니다'),
  description: z.string().min(1, '설명은 필수입니다'),
  coverImageUrl: z.string().min(1, '커버 이미지를 업로드해주세요'),
  displayOrder: z.number().int().min(0, '순서는 0 이상이어야 합니다'),
  isActive: z.boolean(),
  alcoholIds: z.array(z.number()).min(1, '최소 1개 이상의 위스키를 추가해주세요'),
});

export type CurationFormValues = z.infer<typeof curationFormSchema>;

export const DEFAULT_CURATION_FORM: CurationFormValues = {
  name: '',
  description: '',
  coverImageUrl: '',
  displayOrder: 0,
  isActive: false,
  alcoholIds: [],
};
