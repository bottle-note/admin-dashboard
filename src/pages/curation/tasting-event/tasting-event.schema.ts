import { z } from 'zod';

import {
  INITIAL_TASTING_EVENT_FORM_CONTRACT,
  type TastingEventFormContract,
} from './tasting-event.contract';

export function createTastingEventAlcoholSchema(contract: TastingEventFormContract) {
  return z.object({
    source: z.enum(['BOTTLE_NOTE', 'MANUAL']),
    alcohol: z.object({
      alcoholId: z.number().nullable(),
      korName: z.string().min(1, '위스키 한글명은 필수입니다.'),
      engName: z.string().optional(),
      imageUrl: z.string().nullable().optional(),
      abv: z.string().optional(),
      cask: z.string().optional(),
      volume: z.string().optional(),
      regionName: z.string().optional(),
      korCategory: z.string().optional(),
      selectedTags: z
        .array(z.string().min(1, `${contract.alcohols.selectedTags.label}를 입력해주세요.`))
        .min(
          contract.alcohols.selectedTags.minItems,
          `${contract.alcohols.selectedTags.label}를 최소 ${contract.alcohols.selectedTags.minItems}개 이상 추가해주세요.`
        )
        .max(
          contract.alcohols.selectedTags.maxItems,
          `${contract.alcohols.selectedTags.label}는 최대 ${contract.alcohols.selectedTags.maxItems}개까지 추가할 수 있습니다.`
        ),
    }),
    comment: z
      .string()
      .max(
        contract.alcohols.comment.maxLength,
        `${contract.alcohols.comment.label}은 최대 ${contract.alcohols.comment.maxLength}자까지 입력할 수 있습니다.`
      )
      .optional(),
  });
}

export function createCurationTastingEventFormSchema(
  contract: TastingEventFormContract = INITIAL_TASTING_EVENT_FORM_CONTRACT
) {
  return z.object({
    name: z.string().min(1, '큐레이션명은 필수입니다.'),
    description: z.string().min(1, '설명은 필수입니다.'),
    imageUrls: z.array(z.string()).max(3, '이미지는 최대 3개까지 등록할 수 있습니다.'),
    exposureStartDate: z.string().min(1, '노출 시작일은 필수입니다.'),
    exposureEndDate: z.string().min(1, '노출 종료일은 필수입니다.'),
    displayOrder: z
      .number()
      .int('노출 순서는 정수로 입력해주세요.')
      .min(0, '노출 순서는 0 이상이어야 합니다.'),
    isActive: z.boolean(),
    eventDate: z.string().min(1, `${contract.eventDate.label}는 필수입니다.`),
    eventTime: z.string().min(1, `${contract.eventTime.label}은 필수입니다.`),
    barAddress: z
      .string()
      .min(1, `${contract.barAddress.label}는 필수입니다.`)
      .max(
        contract.barAddress.maxLength,
        `${contract.barAddress.label}는 최대 ${contract.barAddress.maxLength}자까지 입력할 수 있습니다.`
      ),
    detailAddress: z
      .string()
      .min(1, `${contract.detailAddress.label}는 필수입니다.`)
      .max(
        contract.detailAddress.maxLength,
        `${contract.detailAddress.label}는 최대 ${contract.detailAddress.maxLength}자까지 입력할 수 있습니다.`
      ),
    isRecruiting: z.boolean(),
    entryFee: z
      .number()
      .int(`${contract.entryFee.label}는 정수로 입력해주세요.`)
      .min(
        contract.entryFee.minimum,
        `${contract.entryFee.label}는 ${contract.entryFee.minimum} 이상이어야 합니다.`
      ),
    capacity: z
      .number()
      .int(`${contract.capacity.label}는 정수로 입력해주세요.`)
      .min(
        contract.capacity.minimum,
        `${contract.capacity.label}는 ${contract.capacity.minimum} 이상이어야 합니다.`
      )
      .max(
        contract.capacity.maximum,
        `${contract.capacity.label}는 최대 ${contract.capacity.maximum}명까지 입력할 수 있습니다.`
      ),
    applicationLink: z
      .string()
      .min(1, `${contract.applicationLink.label}는 필수입니다.`)
      .max(
        contract.applicationLink.maxLength,
        `${contract.applicationLink.label}는 최대 ${contract.applicationLink.maxLength}자까지 입력할 수 있습니다.`
      ),
    guideText: z
      .string()
      .min(1, `${contract.guideText.label}은 필수입니다.`)
      .max(
        contract.guideText.maxLength,
        `${contract.guideText.label}은 최대 ${contract.guideText.maxLength}자까지 입력할 수 있습니다.`
      ),
    alcohols: z
      .array(createTastingEventAlcoholSchema(contract))
      .min(
        contract.alcohols.minItems,
        `${contract.alcohols.label}를 최소 ${contract.alcohols.minItems}개 이상 추가해주세요.`
      )
      .max(
        contract.alcohols.maxItems,
        `${contract.alcohols.label}는 최대 ${contract.alcohols.maxItems}개까지 추가할 수 있습니다.`
      ),
  });
}

export type CurationTastingEventFormValues = z.infer<
  ReturnType<typeof createCurationTastingEventFormSchema>
>;

export type CurationTastingEventPayload = Pick<
  CurationTastingEventFormValues,
  | 'eventDate'
  | 'eventTime'
  | 'barAddress'
  | 'detailAddress'
  | 'isRecruiting'
  | 'entryFee'
  | 'capacity'
  | 'applicationLink'
  | 'guideText'
  | 'alcohols'
>;

export const DEFAULT_CURATION_TASTING_EVENT_FORM: CurationTastingEventFormValues = {
  name: '',
  description: '',
  imageUrls: [],
  exposureStartDate: '',
  exposureEndDate: '',
  displayOrder: 0,
  isActive: true,
  eventDate: '',
  eventTime: '',
  barAddress: '',
  detailAddress: '',
  isRecruiting: true,
  entryFee: 0,
  capacity: 1,
  applicationLink: '',
  guideText: '',
  alcohols: [],
};
