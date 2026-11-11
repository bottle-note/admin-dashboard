import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/test/test-utils';
import { LookupSearchSelect } from '../LookupSearchSelect';

const items = [
  { id: 1, name: '첫 번째' },
  { id: 2, name: '선택 불가' },
  { id: 3, name: '마지막' },
];

function Harness({ onSelect = vi.fn(), onInputKeyDown = vi.fn() }) {
  const [value, setValue] = useState('검색');
  const [open, setOpen] = useState(true);
  return (
    <LookupSearchSelect
      value={value}
      onValueChange={setValue}
      open={open}
      onOpenChange={setOpen}
      items={items}
      getItemKey={(item) => item.id}
      renderItem={(item) => item.name}
      getItemAriaLabel={(item) => item.name}
      isItemDisabled={(item) => item.id === 2}
      onSelect={onSelect}
      onInputKeyDown={onInputKeyDown}
      ariaLabel="검증용 검색"
    />
  );
}

describe('LookupSearchSelect keyboard', () => {
  it('목록을 연결하고 비활성 항목을 건너뛰며 마지막 항목을 Enter로 선택한다', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<Harness onSelect={onSelect} />);
    const input = screen.getByRole('combobox', { name: '검증용 검색' });
    input.focus();
    expect(document.getElementById(input.getAttribute('aria-controls')!)).toHaveAttribute(
      'role',
      'listbox'
    );
    await user.keyboard('{ArrowDown}');
    expect(document.getElementById(input.getAttribute('aria-activedescendant')!)).toHaveTextContent(
      '첫 번째'
    );
    await user.keyboard('{ArrowDown}');
    expect(document.getElementById(input.getAttribute('aria-activedescendant')!)).toHaveTextContent(
      '마지막'
    );
    await user.keyboard('{Home}{End}{Enter}');
    expect(onSelect).toHaveBeenCalledExactlyOnceWith(items[2]);
    expect(input).toHaveFocus();
    expect(input).toHaveAttribute('aria-expanded', 'false');
  });

  it('Escape는 검색어를 보존하고 목록을 닫으며 조합 중 Enter는 선택하지 않는다', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<Harness onSelect={onSelect} />);
    const input = screen.getByRole('combobox');
    input.focus();
    await user.keyboard('{ArrowDown}');
    fireEvent.compositionStart(input);
    fireEvent.keyDown(input, { key: 'Enter', keyCode: 229, isComposing: true });
    expect(onSelect).not.toHaveBeenCalled();
    fireEvent.compositionEnd(input);
    await user.keyboard('{Escape}');
    expect(input).toHaveValue('검색');
    expect(input).toHaveFocus();
    expect(input).toHaveAttribute('aria-expanded', 'false');
  });

  it('활성 후보를 선택하는 Enter와 새 항목을 추가하는 Enter를 구분한다', async () => {
    const onSelect = vi.fn();
    const onInputKeyDown = vi.fn();
    const user = userEvent.setup();
    render(<Harness onSelect={onSelect} onInputKeyDown={onInputKeyDown} />);
    const input = screen.getByRole('combobox');
    input.focus();
    await user.keyboard('{Enter}');
    expect(onInputKeyDown).toHaveBeenCalledTimes(1);
    await user.keyboard('{ArrowDown}');
    onInputKeyDown.mockClear();
    await user.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledExactlyOnceWith(items[0]);
    expect(onInputKeyDown).not.toHaveBeenCalled();
  });
});
