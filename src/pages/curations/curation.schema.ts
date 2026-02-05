import { z } from 'zod';

export const curationFormSchema = z.object({
  name: z.string().min(1, '큐레이션명은 필수입니다'),
  description: z.string().optional(),
  coverImageUrl: z.string().optional(),
  displayOrder: z.number().int().min(0, '순서는 0 이상이어야 합니다'),
  isActive: z.boolean(),
  alcoholIds: z.array(z.number()),
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
