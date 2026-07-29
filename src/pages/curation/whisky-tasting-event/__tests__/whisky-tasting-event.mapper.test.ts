import { describe, expect, it } from 'vitest';

import type { WhiskyTastingEventFormModel } from '../whisky-tasting-event.form-model';
import { buildWhiskyTastingEventPayload } from '../whisky-tasting-event.mapper';
import type { WhiskyTastingEventFormState } from '../whisky-tasting-event.schema';

const formModel = {
  payloadFields: [
    {
      key: 'kakaoPlaceId',
      label: 'Kakao 장소 ID',
      required: false,
      kind: 'hidden',
    },
  ],
} as unknown as WhiskyTastingEventFormModel;

describe('buildWhiskyTastingEventPayload', () => {
  it('선택하지 않은 optional Kakao 장소 ID는 전송하지 않고 선택값만 전송한다', () => {
    const emptyValues = { kakaoPlaceId: '' } as unknown as WhiskyTastingEventFormState;
    const selectedValues = { kakaoPlaceId: ' 27288225 ' } as unknown as WhiskyTastingEventFormState;

    expect(buildWhiskyTastingEventPayload(emptyValues, formModel)).not.toHaveProperty(
      'kakaoPlaceId'
    );
    expect(buildWhiskyTastingEventPayload(selectedValues, formModel)).toEqual({
      kakaoPlaceId: '27288225',
    });
  });
});
