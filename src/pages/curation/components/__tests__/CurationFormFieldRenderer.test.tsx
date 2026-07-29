import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';

import type { SelectedPlace } from '@/components/common/PlaceSearchInput';

import type { CurationTextFieldModel } from '../../curation-form-model';
import { CurationFormFieldRenderer } from '../CurationFormFieldRenderer';

const selectedPlace: SelectedPlace = {
  id: '27288225',
  placeName: '보틀노트 테이스팅룸',
  address: '서울 강남구 테헤란로 123',
  roadAddress: '서울 강남구 테헤란로 123',
  lotAddress: '서울 강남구 역삼동 123',
  longitude: '127.0276',
  latitude: '37.4979',
  placeUrl: 'https://place.map.kakao.com/27288225',
};

vi.mock('@/components/common/PlaceSearchInput', () => ({
  PlaceSearchInput: ({ onPlaceSelect }: { onPlaceSelect?: (place: SelectedPlace) => void }) => (
    <button type="button" onClick={() => onPlaceSelect?.(selectedPlace)}>
      장소 선택
    </button>
  ),
}));

function FormStateProbe() {
  const values = useWatch<Record<string, string>>();

  return <output data-testid="form-values">{JSON.stringify(values)}</output>;
}

function FieldHarness({
  field,
  defaultValues,
}: {
  field: CurationTextFieldModel;
  defaultValues: Record<string, string>;
}) {
  const form = useForm<Record<string, string>>({ defaultValues });

  return (
    <FormProvider {...form}>
      <CurationFormFieldRenderer field={field} />
      <FormStateProbe />
    </FormProvider>
  );
}

describe('CurationFormFieldRenderer', () => {
  it('장소 검색 결과를 request spec에 있는 장소 필드로 함께 매핑한다', async () => {
    const user = userEvent.setup();

    render(
      <FieldHarness
        field={{
          key: 'placeName',
          label: '장소명',
          required: false,
          kind: 'address',
        }}
        defaultValues={{
          placeName: '',
          kakaoPlaceId: '',
          barAddress: '',
          detailAddress: '',
        }}
      />
    );

    await user.click(await screen.findByRole('button', { name: '장소 선택' }));

    await waitFor(() => {
      expect(JSON.parse(screen.getByTestId('form-values').textContent ?? '{}')).toMatchObject({
        placeName: '보틀노트 테이스팅룸',
        kakaoPlaceId: '27288225',
        barAddress: '서울 강남구 테헤란로 123',
        detailAddress: '',
      });
    });
  });

  it('프로그램 주소 검색도 같은 선택값을 address와 Kakao 장소 ID에 매핑한다', async () => {
    const user = userEvent.setup();

    render(
      <FieldHarness
        field={{
          key: 'address',
          label: '장소 및 주소',
          required: false,
          kind: 'address',
        }}
        defaultValues={{
          placeName: '',
          kakaoPlaceId: '',
          address: '',
          detailLocation: '',
        }}
      />
    );

    await user.click(await screen.findByRole('button', { name: '장소 선택' }));

    await waitFor(() => {
      expect(JSON.parse(screen.getByTestId('form-values').textContent ?? '{}')).toMatchObject({
        placeName: '보틀노트 테이스팅룸',
        kakaoPlaceId: '27288225',
        address: '서울 강남구 테헤란로 123',
        detailLocation: '',
      });
    });
  });

  it('hidden field는 라벨 없이 전송용 input으로만 렌더링한다', () => {
    const { container } = render(
      <FieldHarness
        field={{
          key: 'kakaoPlaceId',
          label: 'Kakao 장소 ID',
          required: false,
          kind: 'hidden',
        }}
        defaultValues={{ kakaoPlaceId: '' }}
      />
    );

    expect(screen.queryByText('Kakao 장소 ID')).not.toBeInTheDocument();
    expect(container.querySelector('input[type="hidden"][name="kakaoPlaceId"]')).not.toBeNull();
  });
});
