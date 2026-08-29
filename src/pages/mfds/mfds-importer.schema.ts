import { z } from 'zod';

export const mfdsImporterFormSchema = z.object({
  officialBusinessCode: z.string(),
  licenseNo: z.string(),
  businessName: z.string().trim().min(1, '수입사명은 필수입니다.'),
  representativeName: z.string(),
  sourceListUrl: z.string(),
  description: z.string(),
  adminNote: z.string(),
  adminStatus: z.enum(['ACTIVE', 'INACTIVE']),
});

export type MfdsImporterFormValues = z.infer<typeof mfdsImporterFormSchema>;

export const mfdsImporterDefaultValues: MfdsImporterFormValues = {
  officialBusinessCode: '',
  licenseNo: '',
  businessName: '',
  representativeName: '',
  sourceListUrl: '',
  description: '',
  adminNote: '',
  adminStatus: 'ACTIVE',
};
