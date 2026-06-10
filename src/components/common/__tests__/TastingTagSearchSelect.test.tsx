import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';

import { render } from '@/test/test-utils';
import type { TastingTagListItem } from '@/types/api';

import { TastingTagSearchSelect } from '../TastingTagSearchSelect';

function ControlledTastingTagSearchSelect({
  selectedTagNames = [],
  onSelect = vi.fn(),
  onCreate = vi.fn(() => true),
}: {
  selectedTagNames?: string[];
  onSelect?: (tag: TastingTagListItem) => void;
  onCreate?: (value: string) => boolean | void;
}) {
  const [value, setValue] = useState('');

  return (
    <TastingTagSearchSelect
      ariaLabel="테이스팅 태그"
      value={value}
      onValueChange={setValue}
      onSelect={onSelect}
      onCreate={onCreate}
      selectedTagNames={selectedTagNames}
      placeholder="테이스팅 태그검색 후 추가"
    />
  );
}

describe('TastingTagSearchSelect', () => {
  it('아래 공간이 부족하고 위 공간이 더 넓으면 드롭다운을 위쪽에 표시한다', async () => {
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 500,
    });

    render(<ControlledTastingTagSearchSelect />);

    const input = screen.getByPlaceholderText('테이스팅 태그검색 후 추가');
    const container = input.parentElement;

    expect(container).toBeInstanceOf(HTMLElement);
    vi.spyOn(container as HTMLElement, 'getBoundingClientRect').mockReturnValue({
      x: 20,
      y: 420,
      top: 420,
      left: 20,
      right: 340,
      bottom: 460,
      width: 320,
      height: 40,
      toJSON: vi.fn(),
    } as DOMRect);

    fireEvent.change(input, { target: { value: '과' } });

    const dropdownItem = await screen.findByRole('button', { name: '과일 태그 선택' });
    const dropdown = dropdownItem.closest('.fixed');
    const scrollContainer = dropdownItem.closest('.overflow-y-auto');

    expect(dropdown).toHaveStyle({
      bottom: '84px',
      left: '20px',
      width: '320px',
    });
    expect(scrollContainer).toHaveStyle({ maxHeight: '352px' });
  });

  it('위쪽 표시에서 검색 결과가 없어도 입력창 바로 위에 붙여 표시한다', async () => {
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 500,
    });

    render(<ControlledTastingTagSearchSelect selectedTagNames={['바닐라']} />);

    const input = screen.getByPlaceholderText('테이스팅 태그검색 후 추가');
    const container = input.parentElement;

    expect(container).toBeInstanceOf(HTMLElement);
    vi.spyOn(container as HTMLElement, 'getBoundingClientRect').mockReturnValue({
      x: 20,
      y: 420,
      top: 420,
      left: 20,
      right: 340,
      bottom: 460,
      width: 320,
      height: 40,
      toJSON: vi.fn(),
    } as DOMRect);

    fireEvent.change(input, { target: { value: '바' } });

    const emptyMessage = await screen.findByText('검색 결과가 없습니다');
    const dropdown = emptyMessage.closest('.fixed');

    expect(dropdown).toHaveStyle({
      bottom: '84px',
      left: '20px',
      width: '320px',
    });
  });

  it('검색 결과가 없으면 API 생성 없이 입력 문자열을 직접 추가할 수 있다', async () => {
    const onCreate = vi.fn(() => true);
    const onSelect = vi.fn();

    render(<ControlledTastingTagSearchSelect onCreate={onCreate} onSelect={onSelect} />);

    fireEvent.change(screen.getByLabelText('테이스팅 태그'), {
      target: { value: '셰리' },
    });

    await screen.findByText('검색 결과가 없습니다');
    fireEvent.click(await screen.findByRole('button', { name: '"셰리" 직접 추가' }));

    expect(onCreate).toHaveBeenCalledWith('셰리');
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('이미 선택한 태그는 검색 결과에서 제외한다', async () => {
    render(<ControlledTastingTagSearchSelect selectedTagNames={['바닐라']} />);

    fireEvent.change(screen.getByLabelText('테이스팅 태그'), {
      target: { value: '바' },
    });

    expect(await screen.findByText('검색 결과가 없습니다')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '바닐라 태그 선택' })).not.toBeInTheDocument();
  });
});
