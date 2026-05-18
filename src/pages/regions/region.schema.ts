import { z } from 'zod';

export const regionFormSchema = z.object({
  korName: z.string().min(1, '한글명은 필수입니다'),
  engName: z.string().min(1, '영문명은 필수입니다'),
  continent: z.string().nullable(),
  description: z.string().nullable(),
  parentId: z.number().nullable(),
  sortOrder: z
    .number({ message: '정렬 순서는 숫자여야 합니다' })
    .int('정렬 순서는 정수여야 합니다')
    .min(0, '정렬 순서는 0 이상이어야 합니다'),
});

export type RegionFormValues = z.infer<typeof regionFormSchema>;

export const regionDefaultValues: RegionFormValues = {
  korName: '',
  engName: '',
  continent: null,
  description: null,
  parentId: null,
  sortOrder: 9999,
};
