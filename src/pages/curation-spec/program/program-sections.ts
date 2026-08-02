import type { CurationSpecSections } from '../curation-sections.type';
import type { ProgramRequestSpec } from '../curation-spec.schema';

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
        organizer: { schema: fields.organizer, required: required.includes('organizer') },
        sponsor: { schema: fields.sponsor, required: required.includes('sponsor') },
        entryFee: {
          schema: fields.entryFee,
          required: required.includes('entryFee'),
          disabledWhen: { field: 'is_tbc', equals: true },
        },
        is_tbc: {
          schema: fields.is_tbc,
          required: required.includes('is_tbc'),
          className: 'flex items-end pb-2',
        },
        officialUrl: { schema: fields.officialUrl, required: required.includes('officialUrl') },
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
              description: { className: 'min-w-0 md:col-span-2' },
              applicationUrl: { className: 'min-w-0 md:col-span-2' },
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
