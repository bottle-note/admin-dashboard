import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useForm } from 'react-hook-form';

import { AddressSearchInput } from '../AddressSearchInput';

// 다음 우편번호 임베드는 외부 iframe을 띄우므로 테스트에서는 모킹한다.
// 선택 버튼을 누르면 onComplete에 도로명 주소가 담긴 결과를 넘긴다.
vi.mock('react-daum-postcode', () => ({
  KakaoPostcodeEmbed: ({ onComplete }: { onComplete: (data: unknown) => void }) => (
    <button
      type="button"
      onClick={() =>
        onComplete({
          roadAddress: '서울 강남구 테헤란로 123',
          address: '서울 강남구 역삼동 123-45',
          zonecode: '06234',
        })
      }
    >
      mock-select-address
    </button>
  ),
}));

// register/setValue 통합을 실제 form으로 검증하기 위한 테스트 하네스.
function Harness({ defaultValue = '' }: { defaultValue?: string }) {
  const { register, setValue } = useForm({ defaultValues: { addr: defaultValue } });

  return (
    <AddressSearchInput
      aria-label="주소"
      registration={register('addr')}
      onAddressSelect={(addr) => setValue('addr', addr)}
    />
  );
}

describe('AddressSearchInput', () => {
  it('주소 검색 버튼을 누르면 모달이 열리고, 주소 선택 시 도로명 주소가 입력값에 채워진다', () => {
    render(<Harness />);

    // 처음엔 검색 모달이 닫혀 있다.
    expect(screen.queryByText('mock-select-address')).not.toBeInTheDocument();

    // 주소 검색 버튼 클릭 → 모달 열림.
    fireEvent.click(screen.getByRole('button', { name: '주소 검색' }));
    expect(screen.getByText('mock-select-address')).toBeInTheDocument();

    // 주소 선택 → 도로명 주소가 입력값에 반영 + 모달 닫힘.
    fireEvent.click(screen.getByText('mock-select-address'));
    expect(screen.getByLabelText('주소')).toHaveValue('서울 강남구 테헤란로 123');
    expect(screen.queryByText('mock-select-address')).not.toBeInTheDocument();
  });

  it('입력창은 readonly여서 직접 타이핑할 수 없고, 클릭하면 검색 모달이 열린다', () => {
    render(<Harness />);

    const input = screen.getByLabelText('주소');
    expect(input).toHaveAttribute('readonly');

    // 입력창 클릭만으로도 검색 모달이 열린다.
    fireEvent.click(input);
    expect(screen.getByText('mock-select-address')).toBeInTheDocument();
  });

  it('기존 값(defaultValues)을 input에 표시한다', () => {
    render(<Harness defaultValue="서울 종로구 1" />);

    expect(screen.getByLabelText('주소')).toHaveValue('서울 종로구 1');
  });
});
