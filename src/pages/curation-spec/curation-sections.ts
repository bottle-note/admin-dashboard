import type { JsonSchemaNode } from '@/types/api';

export function getWhiskyTastingEventSections(requestSpec: JsonSchemaNode) {
  const fields = requestSpec.properties!;

  return {
    '날짜 및 장소': {
      subtitle: '날짜 및 장소를 입력해주세요.',
      fields: {
        eventDate: fields.eventDate!,
        eventTime: fields.eventTime!,
        placeName: fields.placeName!,
        kakaoPlaceId: fields.kakaoPlaceId!,
        barAddress: fields.barAddress!,
        detailAddress: fields.detailAddress!,
      },
    },
    '참가 정보': {
      subtitle: '참가비, 인원수, 신청 링크(구글폼, 오픈채팅방 주소) 등을 입력해주세요. ',
      fields: {
        isRecruiting: fields.isRecruiting!,
        entryFee: fields.entryFee!,
        is_tbc: fields.is_tbc!,
        capacity: fields.capacity!,
        applicationLink: fields.applicationLink!,
        guideText: fields.guideText!,
      },
    },
    '시음 위스키': {
      subtitle: '시음회에 사용될 위스키를 입력해주세요.',
      fields: {
        alcohols: fields.alcohols!,
      },
    },
  };
}
