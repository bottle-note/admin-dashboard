import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';

import { render } from '@/test/test-utils';
import type { TastingTagListItem } from '@/types/api';

import { CurationTastingTagCombobox } from '../CurationTastingTagCombobox';

function ControlledCurationTastingTagCombobox({
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
    <CurationTastingTagCombobox
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

describe('CurationTastingTagCombobox', () => {
  it('드롭다운을 열면 검색어 없이도 기존 태그를 먼저 표시한다', async () => {
    render(<ControlledCurationTastingTagCombobox />);

    fireEvent.click(screen.getByRole('combobox', { name: '테이스팅 태그' }));

    expect(await screen.findByRole('button', { name: '바닐라 태그 선택' })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: '과일 태그 선택' })).toBeInTheDocument();
  });

  it('아래 공간이 부족하고 위 공간이 더 넓으면 드롭다운을 위쪽에 표시한다', async () => {
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 500,
    });

    render(<ControlledCurationTastingTagCombobox />);

    const trigger = screen.getByRole('combobox', { name: '테이스팅 태그' });
    const container = trigger.parentElement;

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

    fireEvent.click(trigger);
    const input = await screen.findByLabelText('테이스팅 태그 검색어');
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

    render(<ControlledCurationTastingTagCombobox selectedTagNames={['바닐라']} />);

    const trigger = screen.getByRole('combobox', { name: '테이스팅 태그' });
    const container = trigger.parentElement;

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

    fireEvent.click(trigger);
    const input = await screen.findByLabelText('테이스팅 태그 검색어');
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

    render(<ControlledCurationTastingTagCombobox onCreate={onCreate} onSelect={onSelect} />);

    fireEvent.click(screen.getByRole('combobox', { name: '테이스팅 태그' }));
    fireEvent.change(await screen.findByLabelText('테이스팅 태그 검색어'), {
      target: { value: '셰리' },
    });

    await screen.findByText('검색 결과가 없습니다');
    fireEvent.click(await screen.findByRole('button', { name: '"셰리" 직접 추가' }));

    expect(onCreate).toHaveBeenCalledWith('셰리');
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('검색 결과가 있어도 입력 문자열을 직접 추가할 수 있다', async () => {
    const onCreate = vi.fn(() => true);
    const onSelect = vi.fn();

    render(<ControlledCurationTastingTagCombobox onCreate={onCreate} onSelect={onSelect} />);

    fireEvent.click(screen.getByRole('combobox', { name: '테이스팅 태그' }));
    fireEvent.change(await screen.findByLabelText('테이스팅 태그 검색어'), {
      target: { value: '과' },
    });

    expect(await screen.findByRole('button', { name: '과일 태그 선택' })).toBeInTheDocument();
    fireEvent.click(await screen.findByRole('button', { name: '"과" 직접 추가' }));

    expect(onCreate).toHaveBeenCalledWith('과');
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('한글 조합 중 Enter는 직접 추가로 처리하지 않는다', async () => {
    const onCreate = vi.fn(() => true);

    render(<ControlledCurationTastingTagCombobox onCreate={onCreate} />);

    fireEvent.click(screen.getByRole('combobox', { name: '테이스팅 태그' }));
    const input = await screen.findByLabelText('테이스팅 태그 검색어');
    fireEvent.change(input, { target: { value: '자' } });
    fireEvent.keyDown(input, {
      key: 'Enter',
      code: 'Enter',
      keyCode: 229,
    });

    expect(onCreate).not.toHaveBeenCalled();

    fireEvent.change(input, { target: { value: '자두' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(onCreate).toHaveBeenCalledTimes(1);
    expect(onCreate).toHaveBeenCalledWith('자두');
  });

  it('이미 선택한 태그는 검색 결과에서 제외한다', async () => {
    render(<ControlledCurationTastingTagCombobox selectedTagNames={['바닐라']} />);

    fireEvent.click(screen.getByRole('combobox', { name: '테이스팅 태그' }));
    fireEvent.change(await screen.findByLabelText('테이스팅 태그 검색어'), {
      target: { value: '바' },
    });

    expect(await screen.findByText('검색 결과가 없습니다')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '바닐라 태그 선택' })).not.toBeInTheDocument();
  });
});
