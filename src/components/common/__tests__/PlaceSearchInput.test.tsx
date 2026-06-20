import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useForm } from 'react-hook-form';

import { PlaceSearchInput, type SelectedPlace } from '../PlaceSearchInput';

const keywordSearchMock = vi.fn();

function setKakaoPlacesMock() {
  class MockPlaces {
    keywordSearch = keywordSearchMock;
  }

  window.kakao = {
    maps: {
      load: (callback: () => void) => callback(),
      services: {
        Places: MockPlaces,
        Status: {
          OK: 'OK',
          ZERO_RESULT: 'ZERO_RESULT',
          ERROR: 'ERROR',
        },
      },
    },
  };
}

function Harness({
  defaultValue = '',
  onPlaceSelect,
}: {
  defaultValue?: string;
  onPlaceSelect?: (place: SelectedPlace) => void;
}) {
  const { register, setValue } = useForm({ defaultValues: { addr: defaultValue } });

  return (
    <PlaceSearchInput
      aria-label="장소"
      registration={register('addr')}
      onAddressSelect={(addr) => setValue('addr', addr)}
      onPlaceSelect={onPlaceSelect}
    />
  );
}

describe('PlaceSearchInput', () => {
  afterEach(() => {
    keywordSearchMock.mockReset();
    vi.unstubAllEnvs();
    delete window.kakao;
  });

  it('장소 검색 후 선택하면 도로명 주소가 입력값에 채워지고 장소 정보를 전달한다', async () => {
    const handlePlaceSelect = vi.fn();
    setKakaoPlacesMock();
    keywordSearchMock.mockImplementation((keyword, callback) => {
      expect(keyword).toBe('도시남');
      callback(
        [
          {
            id: '123',
            place_name: '도시남 바',
            category_name: '음식점 > 술집',
            phone: '02-123-4567',
            address_name: '서울 강남구 역삼동 123-45',
            road_address_name: '서울 강남구 테헤란로 123',
            x: '127.0276',
            y: '37.4979',
            place_url: 'https://place.map.kakao.com/123',
          },
        ],
        'OK'
      );
    });

    render(<Harness onPlaceSelect={handlePlaceSelect} />);

    fireEvent.click(screen.getByRole('button', { name: '장소 검색' }));
    fireEvent.change(screen.getByLabelText('장소 검색어'), { target: { value: '도시남' } });
    fireEvent.click(screen.getByRole('button', { name: '검색' }));

    expect(await screen.findByText('도시남 바')).toBeInTheDocument();
    fireEvent.click(screen.getByText('도시남 바'));

    expect(screen.getByLabelText('장소')).toHaveValue('서울 강남구 테헤란로 123');
    expect(handlePlaceSelect).toHaveBeenCalledWith({
      id: '123',
      placeName: '도시남 바',
      address: '서울 강남구 테헤란로 123',
      roadAddress: '서울 강남구 테헤란로 123',
      lotAddress: '서울 강남구 역삼동 123-45',
      longitude: '127.0276',
      latitude: '37.4979',
      placeUrl: 'https://place.map.kakao.com/123',
    });
    expect(screen.queryByText('도시남 바')).not.toBeInTheDocument();
  });

  it('검색 결과가 없으면 빈 상태 메시지를 표시한다', async () => {
    setKakaoPlacesMock();
    keywordSearchMock.mockImplementation((keyword, callback) => {
      expect(keyword).toBe('없는장소');
      callback([], 'ZERO_RESULT');
    });

    render(<Harness />);

    fireEvent.click(screen.getByRole('button', { name: '장소 검색' }));
    fireEvent.change(screen.getByLabelText('장소 검색어'), { target: { value: '없는장소' } });
    fireEvent.click(screen.getByRole('button', { name: '검색' }));

    expect(await screen.findByText('검색 결과가 없습니다.')).toBeInTheDocument();
  });

  it('카카오 SDK 키가 없고 SDK도 로드되지 않은 경우 설정 안내를 표시한다', async () => {
    vi.stubEnv('VITE_KAKAO_MAP_JAVASCRIPT_KEY', '');
    render(<Harness />);

    fireEvent.click(screen.getByRole('button', { name: '장소 검색' }));
    fireEvent.change(screen.getByLabelText('장소 검색어'), { target: { value: '도시남' } });
    fireEvent.click(screen.getByRole('button', { name: '검색' }));

    await waitFor(() => {
      expect(
        screen.getByText('VITE_KAKAO_MAP_JAVASCRIPT_KEY 환경변수를 설정해주세요.')
      ).toBeInTheDocument();
    });
  });

  it('기존 값(defaultValues)을 input에 표시한다', () => {
    render(<Harness defaultValue="서울 종로구 1" />);

    expect(screen.getByLabelText('장소')).toHaveValue('서울 종로구 1');
  });
});
