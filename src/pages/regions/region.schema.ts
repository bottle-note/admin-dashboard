import { z } from 'zod';

export const regionFormSchema = z.object({
  korName: z.string().min(1, '한글명은 필수입니다'),
  engName: z.string().min(1, '영문명은 필수입니다'),
  continent: z.string().nullable(),
  description: z.string().nullable(),
  parentId: z.number().nullable(),
});

export type RegionFormValues = z.infer<typeof regionFormSchema>;

export const regionDefaultValues: RegionFormValues = {
  korName: '',
  engName: '',
  continent: null,
  description: null,
  parentId: null,
};
