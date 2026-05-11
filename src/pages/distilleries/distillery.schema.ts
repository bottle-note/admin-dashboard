import { z } from 'zod';

export const distilleryFormSchema = z.object({
  korName: z.string().min(1, '한글명은 필수입니다'),
  engName: z.string().min(1, '영문명은 필수입니다'),
  sortOrder: z
    .number({ message: '정렬 순서는 숫자여야 합니다' })
    .int('정렬 순서는 정수여야 합니다')
    .min(0, '정렬 순서는 0 이상이어야 합니다'),
});

export type DistilleryFormValues = z.infer<typeof distilleryFormSchema>;

export const distilleryDefaultValues: DistilleryFormValues = {
  korName: '',
  engName: '',
  sortOrder: 9999,
};
