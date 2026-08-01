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
  it('시음회 스펙이 선언한 target만 장소 검색 결과로 매핑한다', async () => {
    const user = userEvent.setup();

    render(
      <FieldHarness
        field={{
          key: 'placeName',
          label: '장소명',
          required: false,
          kind: 'address',
          placeSearchTargets: {
            placeName: 'placeName',
            kakaoPlaceId: 'id',
            barAddress: 'address',
          },
        }}
        defaultValues={{
          placeName: '',
          kakaoPlaceId: '',
          barAddress: '',
          address: '프로그램 주소는 변경하지 않음',
          detailAddress: '2층 안쪽 입구',
        }}
      />
    );

    await user.click(await screen.findByRole('button', { name: '장소 선택' }));

    await waitFor(() => {
      expect(JSON.parse(screen.getByTestId('form-values').textContent ?? '{}')).toEqual({
        placeName: '보틀노트 테이스팅룸',
        kakaoPlaceId: '27288225',
        barAddress: '서울 강남구 테헤란로 123',
        address: '프로그램 주소는 변경하지 않음',
        detailAddress: '2층 안쪽 입구',
      });
    });
  });

  it('프로그램 스펙은 address target만 장소 검색 결과로 매핑한다', async () => {
    const user = userEvent.setup();

    render(
      <FieldHarness
        field={{
          key: 'placeName',
          label: '장소명',
          required: false,
          kind: 'address',
          placeSearchTargets: {
            placeName: 'placeName',
            kakaoPlaceId: 'id',
            address: 'address',
          },
        }}
        defaultValues={{
          placeName: '',
          kakaoPlaceId: '',
          address: '',
          barAddress: '시음회 주소는 변경하지 않음',
          detailAddress: 'B홀 2층',
        }}
      />
    );

    await user.click(await screen.findByRole('button', { name: '장소 선택' }));

    await waitFor(() => {
      expect(JSON.parse(screen.getByTestId('form-values').textContent ?? '{}')).toEqual({
        placeName: '보틀노트 테이스팅룸',
        kakaoPlaceId: '27288225',
        address: '서울 강남구 테헤란로 123',
        barAddress: '시음회 주소는 변경하지 않음',
        detailAddress: 'B홀 2층',
      });
    });
  });

  it('x-read-only plain text는 disabled가 아닌 readOnly input으로 렌더링한다', () => {
    render(
      <FieldHarness
        field={{
          key: 'barAddress',
          label: '장소 및 바 주소',
          required: true,
          kind: 'text',
          readOnly: true,
        }}
        defaultValues={{ barAddress: '서울 강남구 테헤란로 123' }}
      />
    );

    const input = screen.getByLabelText('장소 및 바 주소');
    expect(input).toHaveValue('서울 강남구 테헤란로 123');
    expect(input).toHaveProperty('readOnly', true);
    expect(input).not.toBeDisabled();
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
