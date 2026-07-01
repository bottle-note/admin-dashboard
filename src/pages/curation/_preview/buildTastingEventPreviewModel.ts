import type {
  TastingEventPreviewCta,
  TastingEventPreviewData,
  TastingEventPreviewModel,
  TastingEventPreviewPayload,
} from './types';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

const getDateOnlyTime = (dateValue: string) => {
  const [datePart = ''] = dateValue.split('T');
  const [year, month, date] = datePart.split('-').map(Number);

  if (year && month && date) {
    return new Date(year, month - 1, date).getTime();
  }

  const parsedDate = new Date(dateValue);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return new Date(
    parsedDate.getFullYear(),
    parsedDate.getMonth(),
    parsedDate.getDate(),
  ).getTime();
};

const getTodayTime = (today: Date) => {
  return new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  ).getTime();
};

const isBeforeDate = (dateValue: string, today: Date) => {
  const dateOnlyTime = getDateOnlyTime(dateValue);

  return dateOnlyTime !== null && dateOnlyTime < getTodayTime(today);
};

const getEventDateLabel = (eventDateValue: string) => {
  const eventDate = new Date(eventDateValue);

  if (Number.isNaN(eventDate.getTime())) {
    return eventDateValue;
  }

  return `${eventDate.getMonth() + 1}월 ${eventDate.getDate()}일 (${
    WEEKDAYS[eventDate.getDay()]
  })`;
};

const getEventTimeLabel = (eventTimeValue: string) => {
  const [hour, minute] = eventTimeValue.split(':');

  return hour && minute ? `${hour}:${minute}` : eventTimeValue;
};

const buildCta = (
  payload: TastingEventPreviewPayload,
  today: Date,
): TastingEventPreviewCta => {
  const applicationLink = payload.applicationLink?.trim() ?? '';

  if (!applicationLink) {
    return { type: 'hidden' };
  }

  if (payload.isRecruiting && !isBeforeDate(payload.eventDate, today)) {
    return {
      type: 'apply',
      label: '시음회 신청하기',
      href: applicationLink,
    };
  }

  return {
    type: 'closed',
    label: '모집 마감',
  };
};

interface BuildTastingEventPreviewModelOptions {
  today?: Date;
}

export const buildTastingEventPreviewModel = (
  event: TastingEventPreviewData,
  options: BuildTastingEventPreviewModelOptions = {},
): TastingEventPreviewModel => {
  const { payload } = event;
  const today = options.today ?? new Date();
  const eventDateLabel = getEventDateLabel(payload.eventDate);
  const eventTimeLabel = getEventTimeLabel(payload.eventTime);
  const fullAddress = [payload.barAddress, payload.detailAddress]
    .filter(Boolean)
    .join(' ');
  const imageUrls = event.imageUrls.filter(
    (imageUrl) => imageUrl !== event.coverImageUrl,
  );

  return {
    title: event.name,
    description: event.description,
    coverImageUrl: event.coverImageUrl,
    imageUrls,
    eventDateLabel,
    eventTimeLabel,
    eventDateTimeLabel: `${eventDateLabel} · ${eventTimeLabel}`,
    placeLabel: payload.placeName ?? payload.barAddress,
    barAddress: payload.barAddress,
    detailAddress: payload.detailAddress ?? '',
    fullAddress,
    capacityLabel: `${payload.capacity.toLocaleString('ko-KR')}명 정원`,
    entryFeeLabel:
      payload.entryFee > 0
        ? `${payload.entryFee.toLocaleString('ko-KR')}원`
        : '무료',
    mapSearchUrl: fullAddress
      ? `https://map.naver.com/p/search/${encodeURIComponent(fullAddress)}`
      : '',
    guideText: payload.guideText,
    alcohols: payload.alcohols ?? [],
    cta: buildCta(payload, today),
  };
};
