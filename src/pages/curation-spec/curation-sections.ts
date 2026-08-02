import type { JsonSchemaNode } from '@/types/api';

import type {
  ProgramRequestSpec,
  WhiskyCurationRequestSpec,
  WhiskyTastingEventRequestSpec,
} from './curation-spec.schema';

export type AlcoholSectionConfig = {
  itemLabel: string;
  emptyMessage: string;
  fields: Partial<
    Record<
      | 'korName'
      | 'engName'
      | 'imageUrl'
      | 'abv'
      | 'volume'
      | 'cask'
      | 'regionName'
      | 'korCategory'
      | 'selectedTags'
      | 'comment',
      {
        label?: string;
      }
    >
  >;
};

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
        alcohol?: AlcoholSectionConfig;
        pairing?: {
          itemLabel: string;
          addButtonLabel: string;
          fields: Partial<
            Record<
              'itemName' | 'pairingNote' | 'itemImageUrl',
              {
                label?: string;
                placeholder?: string;
              }
            >
          >;
        };
        // code가 프로그램인 경우.
        program?: {
          itemLabel: string;
          addButtonLabel: string;
          fields: Record<
            string,
            {
              className?: string;
              optionLabels?: Record<string, string>;
              title?: string;
              subtitle?: string;
              alcohol?: AlcoholSectionConfig;
            }
          >;
        };
      }
    >;
  }
>;

export function getRecommendedWhiskySections(requestSpec: WhiskyCurationRequestSpec) {
  return {
    라인업: {
      subtitle: '큐레이션에 노출할 라인업을 입력해주세요.',
      contentClassName: 'space-y-4',
      fields: {
        alcohols: {
          schema: requestSpec as JsonSchemaNode,
          required: true,
        },
      },
    },
  } satisfies CurationSpecSections;
}

export function getWhiskyPairingSections(requestSpec: WhiskyCurationRequestSpec) {
  return {
    라인업: {
      subtitle: '페어링할 라인업과 음식을 입력해주세요.',
      contentClassName: 'space-y-4',
      fields: {
        alcohols: {
          schema: requestSpec as JsonSchemaNode,
          required: true,
          pairing: {
            itemLabel: '페어링 음식',
            addButtonLabel: '페어링 음식 추가',
            fields: {
              itemName: {
                label: '음식명',
                placeholder: '예: 바닐라 아이스크림',
              },
              pairingNote: {
                label: '페어링 설명',
                placeholder: '라인업의 풍미와 잘 어울리는 이유를 입력해주세요.',
              },
              itemImageUrl: { label: '음식 이미지' },
            },
          },
        },
      },
    },
  } satisfies CurationSpecSections;
}

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
    라인업: {
      subtitle: '시음회에 사용될 라인업을 입력해주세요.',
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
    '프로그램 및 이벤트': {
      subtitle: '행사에 포함된 프로그램(마스터클래스·테이스팅 등)을 추가해주세요. 1개 이상.',
      contentClassName: 'space-y-4',
      fields: {
        programs: {
          schema: fields.programs,
          required: required.includes('programs'),
          program: {
            itemLabel: '프로그램',
            addButtonLabel: '프로그램 추가',
            fields: {
              name: {},
              type: {
                optionLabels: {
                  MASTER_CLASS: '마스터 클래스',
                  TASTING: '테이스팅',
                  SEMINAR: '세미나',
                  BOOTH_EVENT: '부스 이벤트',
                  OTHER: '기타',
                },
              },
              description: {
                className: 'min-w-0 md:col-span-2',
              },
              applicationUrl: {
                className: 'min-w-0 md:col-span-2',
              },
              whiskies: {
                title: '라인업',
                subtitle: '프로그램에서 소개할 라인업을 등록해주세요.',
                alcohol: {
                  itemLabel: '라인업',
                  emptyMessage: '라인업을 추가해주세요.',
                  fields: {
                    korName: { label: '한글명' },
                    engName: { label: '영문명' },
                    imageUrl: { label: '이미지' },
                    comment: { label: '기대평' },
                  },
                },
              },
            },
          },
        },
      },
    },
  } satisfies CurationSpecSections;
}

export type ProgramSectionConfig = ReturnType<
  typeof getProgramSections
>['프로그램 및 이벤트']['fields']['programs']['program'];
