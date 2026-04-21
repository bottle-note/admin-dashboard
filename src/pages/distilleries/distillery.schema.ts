import { z } from 'zod';

export const distilleryFormSchema = z.object({
  korName: z.string().min(1, '한글명은 필수입니다'),
  engName: z.string().min(1, '영문명은 필수입니다'),
  regionId: z.number().nullable(),
});

export type DistilleryFormValues = z.infer<typeof distilleryFormSchema>;

export const distilleryDefaultValues: DistilleryFormValues = {
  korName: '',
  engName: '',
  regionId: null,
};
