import type { CurationSpecSections } from '../curation-sections.type';
import type { WhiskyTastingEventRequestSpec } from '../curation-spec.schema';

export function getWhiskyTastingEventSections(requestSpec: WhiskyTastingEventRequestSpec) {
  const fields = requestSpec.properties;
  const required = requestSpec.required;

  return {
    '날짜 및 장소': {
      subtitle: '날짜 및 장소를 입력해주세요.',
      contentClassName: 'grid gap-4 md:grid-cols-2',
      fields: {
        eventDate: { schema: fields.eventDate, required: required.includes('eventDate') },
        eventTime: { schema: fields.eventTime, required: required.includes('eventTime') },
        placeName: { schema: fields.placeName, required: true, className: 'md:col-span-2' },
        kakaoPlaceId: {
          schema: fields.kakaoPlaceId,
          required: required.includes('kakaoPlaceId'),
        },
        barAddress: {
          schema: fields.barAddress,
          required: required.includes('barAddress'),
          className: 'md:col-span-2',
        },
        detailAddress: {
          schema: fields.detailAddress,
          required: required.includes('detailAddress'),
          className: 'md:col-span-2',
        },
      },
    },
    '참가 정보': {
      subtitle: '참가비, 인원수, 신청 링크(구글폼, 오픈채팅방 주소) 등을 입력해주세요. ',
      contentClassName: 'grid gap-4 md:grid-cols-2',
      fields: {
        capacity: { schema: fields.capacity, required: required.includes('capacity') },
        entryFee: {
          schema: fields.entryFee,
          required: required.includes('entryFee'),
          disabledWhen: { field: 'is_tbc', equals: true },
        },
        is_tbc: {
          schema: fields.is_tbc,
          required: required.includes('is_tbc'),
          className: 'flex items-end pb-2 md:col-start-2',
        },
        guideText: {
          schema: fields.guideText,
          required: required.includes('guideText'),
          className: 'md:col-span-2',
        },
        applicationLink: {
          schema: fields.applicationLink,
          required: required.includes('applicationLink'),
          className: 'md:col-span-2',
          requiredWhen: { field: 'isRecruiting', equals: true },
          disabledWhen: { field: 'isRecruiting', equals: false },
        },
        isRecruiting: {
          schema: fields.isRecruiting,
          required: required.includes('isRecruiting'),
          label: '시음회 참여자를 모집하시겠습니까?',
        },
      },
    },
    라인업: {
      subtitle: '시음회에 사용될 라인업을 입력해주세요.',
      contentClassName: 'space-y-4',
      fields: {
        alcohols: { schema: fields.alcohols, required: required.includes('alcohols') },
      },
    },
  } satisfies CurationSpecSections;
}
