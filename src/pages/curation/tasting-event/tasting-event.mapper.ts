import type {
  TastingEventCreateFormState,
  TastingEventCreatePayload,
} from './tasting-event.schema';
import type { TastingEventFormModel } from './tasting-event.form-model';

const ALCOHOL_OPTIONAL_TEXT_FIELDS = [
  'engName',
  'imageUrl',
  'abv',
  'cask',
  'volume',
  'regionName',
  'korCategory',
] as const;

// 6. submit mapper 레이어: form 값을 서버 payload 필드 목록에 맞춰 동적으로 조립합니다.
export function buildTastingEventPayload(
  values: TastingEventCreateFormState,
  formModel: TastingEventFormModel
): TastingEventCreatePayload {
  return formModel.payloadFields.reduce<TastingEventCreatePayload>((payload, field) => {
    const key = field.key;
    const value = values[key];

    if (key === 'alcohols') {
      payload[key] = mapTastingEventAlcohols(values.alcohols);
      return payload;
    }

    payload[key] = normalizePayloadValue(value);
    return payload;
  }, {});
}

// 문자열은 trim하고 나머지 값은 서버 전송값으로 그대로 유지합니다.
function normalizePayloadValue(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

// 시음 위스키 form 값을 서버가 받는 alcohols payload 배열로 변환합니다.
function mapTastingEventAlcohols(values: TastingEventCreateFormState['alcohols']) {
  return values.map((item) => {
    const comment = item.comment?.trim();
    const alcohol = {
      alcoholId: item.source === 'MANUAL' ? null : item.alcohol.alcoholId,
      korName: item.alcohol.korName.trim(),
      selectedTags: item.alcohol.selectedTags.map((tag) => tag.trim()).filter(Boolean),
    } as typeof item.alcohol;

    ALCOHOL_OPTIONAL_TEXT_FIELDS.forEach((key) => {
      const value = item.alcohol[key]?.trim();
      if (value) {
        alcohol[key] = value;
      }
    });

    return {
      source: item.source,
      alcohol,
      ...(comment ? { comment } : {}),
    };
  });
}
