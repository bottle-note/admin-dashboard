import { z } from 'zod';

export const campaignContentSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, '코드는 필수입니다.')
    .max(50, '코드는 50자 이하여야 합니다.')
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, '영문 소문자, 숫자, 하이픈만 사용할 수 있습니다.'),
  name: z.string().trim().min(1, '이름은 필수입니다.').max(100, '이름은 100자 이하여야 합니다.'),
  description: z
    .string()
    .trim()
    .min(1, '설명은 필수입니다.')
    .max(255, '설명은 255자 이하여야 합니다.'),
  isActive: z.boolean(),
});
export type CampaignContentFormValues = z.infer<typeof campaignContentSchema>;
export const campaignContentDefaults: CampaignContentFormValues = {
  code: '',
  name: '',
  description: '',
  isActive: true,
};
