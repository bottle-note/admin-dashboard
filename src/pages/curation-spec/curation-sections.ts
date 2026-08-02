import type { JsonSchemaNode } from '@/types/api';

import type { ProgramRequestSpec, WhiskyTastingEventRequestSpec } from './curation-spec.schema';

export type CurationSpecSections = Record<
  string,
  {
    subtitle: string;
    contentClassName: string;
    fields: Record<
      string,
      {
        schema: JsonSchemaNode;
        required: boolean;
        label?: string;
        className?: string;
        disabledWhen?: {
          field: string;
          equals: unknown;
        };
        requiredWhen?: {
          field: string;
          equals: unknown;
        };
        optionLabels?: Record<string, string>;
      }
    >;
  }
>;

export function getWhiskyTastingEventSections(requestSpec: WhiskyTastingEventRequestSpec) {
  const fields = requestSpec.properties;
  const required = requestSpec.required;

  return {
    '날짜 및 장소': {
      subtitle: '날짜 및 장소를 입력해주세요.',
      contentClassName: 'grid gap-4 md:grid-cols-2',
      fields: {
        eventDate: {
          schema: fields.eventDate,
          required: required.includes('eventDate'),
        },
        eventTime: {
          schema: fields.eventTime,
          required: required.includes('eventTime'),
        },
        placeName: {
          schema: fields.placeName,
          required: true,
          className: 'md:col-span-2',
        },
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
        capacity: {
          schema: fields.capacity,
          required: required.includes('capacity'),
        },
        entryFee: {
          schema: fields.entryFee,
          required: required.includes('entryFee'),
          disabledWhen: {
            field: 'is_tbc',
            equals: true,
          },
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
          requiredWhen: {
            field: 'isRecruiting',
            equals: true,
          },
          disabledWhen: {
            field: 'isRecruiting',
            equals: false,
          },
        },
        isRecruiting: {
          schema: fields.isRecruiting,
          required: required.includes('isRecruiting'),
          label: '시음회 참여자를 모집하시겠습니까?',
        },
      },
    },
    '시음 위스키': {
      subtitle: '시음회에 사용될 위스키를 입력해주세요.',
      contentClassName: 'space-y-4',
      fields: {
        alcohols: {
          schema: fields.alcohols,
          required: required.includes('alcohols'),
        },
      },
    },
  } satisfies CurationSpecSections;
}

export function getProgramSections(requestSpec: ProgramRequestSpec) {
  const fields = requestSpec.properties;
  const required = requestSpec.required;

  return {
    '행사 기간 및 장소': {
      subtitle: '행사 기간과 장소를 입력해주세요.',
      contentClassName: 'grid gap-4 md:grid-cols-2',
      fields: {
        eventStartDate: {
          schema: fields.eventStartDate,
          required: required.includes('eventStartDate'),
        },
        eventEndDate: {
          schema: fields.eventEndDate,
          required: required.includes('eventEndDate'),
        },
        placeName: {
          schema: fields.placeName,
          required: required.includes('placeName'),
          className: 'md:col-span-2',
        },
        kakaoPlaceId: {
          schema: fields.kakaoPlaceId,
          required: required.includes('kakaoPlaceId'),
        },
        address: {
          schema: fields.address,
          required: required.includes('address'),
          className: 'md:col-span-2',
        },
        detailLocation: {
          schema: fields.detailLocation,
          required: required.includes('detailLocation'),
          className: 'md:col-span-2',
        },
      },
    },
    '주최 · 노출 정보': {
      subtitle: '주최 정보와 참가 안내를 입력해주세요.',
      contentClassName: 'grid gap-4 md:grid-cols-2',
      fields: {
        organizer: {
          schema: fields.organizer,
          required: required.includes('organizer'),
        },
        sponsor: {
          schema: fields.sponsor,
          required: required.includes('sponsor'),
        },
        entryFee: {
          schema: fields.entryFee,
          required: required.includes('entryFee'),
          disabledWhen: {
            field: 'is_tbc',
            equals: true,
          },
        },
        is_tbc: {
          schema: fields.is_tbc,
          required: required.includes('is_tbc'),
          className: 'flex items-end pb-2',
        },
        officialUrl: {
          schema: fields.officialUrl,
          required: required.includes('officialUrl'),
        },
        registrationUrl: {
          schema: fields.registrationUrl,
          required: required.includes('registrationUrl'),
        },
        programTags: {
          schema: fields.programTags,
          required: required.includes('programTags'),
          className: 'md:col-span-2',
          optionLabels: {
            WHISKY: '위스키',
            TRADITIONAL_LIQUOR: '전통주',
            WINE: '와인',
            COCKTAIL: '칵테일',
            BEER: '맥주',
            OTHER_SPIRITS: '기타 증류주',
          },
        },
      },
    },
    프로그램: {
      subtitle: '행사에서 진행할 프로그램과 시음 위스키를 입력해주세요.',
      contentClassName: 'space-y-4',
      fields: {
        programs: {
          schema: fields.programs,
          required: required.includes('programs'),
        },
      },
    },
  } satisfies CurationSpecSections;
}
