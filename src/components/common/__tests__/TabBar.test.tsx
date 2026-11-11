import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TabBar } from '../TabBar';

const TABS = [
  { value: 'first', label: '첫 탭' },
  { value: 'second', label: '둘째 탭' },
  { value: 'third', label: '셋째 탭' },
];

function TabsDemo() {
  const [value, setValue] = useState('first');
  return <TabBar tabs={TABS} value={value} onChange={setValue} ariaLabel="검증 탭" />;
}

describe('TabBar 키보드 이동', () => {
  it('좌우 방향키로 선택과 초점을 함께 옮기고 양 끝에서 순환한다', async () => {
    const user = userEvent.setup();
    render(<TabsDemo />);
    const first = screen.getByRole('tab', { name: '첫 탭' });
    const second = screen.getByRole('tab', { name: '둘째 탭' });
    const third = screen.getByRole('tab', { name: '셋째 탭' });
    await user.tab();
    expect(first).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(second).toHaveFocus();
    expect(second).toHaveAttribute('aria-selected', 'true');
    expect(first).toHaveAttribute('tabindex', '-1');
    await user.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(third).toHaveFocus();
    expect(third).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{ArrowRight}');
    expect(first).toHaveFocus();
    expect(first).toHaveAttribute('aria-selected', 'true');
  });

  it('Home과 End로 처음과 마지막 탭에 접근한다', async () => {
    const user = userEvent.setup();
    render(<TabsDemo />);
    await user.tab();
    await user.keyboard('{End}');
    expect(screen.getByRole('tab', { name: '셋째 탭' })).toHaveFocus();
    await user.keyboard('{Home}');
    expect(screen.getByRole('tab', { name: '첫 탭' })).toHaveFocus();
    expect(screen.getByRole('tab', { selected: true })).toHaveAccessibleName('첫 탭');
  });

  it('브라우저 탐색용 조합키를 가로채지 않는다', () => {
    const onChange = vi.fn();
    render(<TabBar tabs={TABS} value="first" onChange={onChange} ariaLabel="검증 탭" />);
    fireEvent.keyDown(screen.getByRole('tab', { name: '첫 탭' }), {
      key: 'ArrowLeft',
      altKey: true,
    });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('탭이 하나여도 방향키 이동이 동작한다', async () => {
    const user = userEvent.setup();
    render(
      <TabBar
        tabs={TABS.slice(0, 1)}
        value="first"
        onChange={() => undefined}
        ariaLabel="검증 탭"
      />
    );
    await user.tab();
    await user.keyboard('{ArrowRight}{ArrowLeft}{End}{Home}');
    expect(screen.getByRole('tab', { name: '첫 탭' })).toHaveFocus();
  });

  it('부모가 선택을 늦게 반영하면 전환 commit 이후에 초점을 옮긴다', () => {
    function DelayedTabs() {
      const [value, setValue] = useState('first');
      return (
        <TabBar
          tabs={TABS}
          value={value}
          onChange={(next) => {
            setTimeout(() => setValue(next), 0);
          }}
          ariaLabel="검증 탭"
        />
      );
    }
    vi.useFakeTimers();
    try {
      render(<DelayedTabs />);
      const first = screen.getByRole('tab', { name: '첫 탭' });
      const second = screen.getByRole('tab', { name: '둘째 탭' });
      first.focus();
      fireEvent.keyDown(first, { key: 'ArrowRight' });
      expect(first).toHaveFocus();
      expect(first).toHaveAttribute('aria-selected', 'true');
      act(() => {
        vi.runOnlyPendingTimers();
      });
      expect(second).toHaveAttribute('aria-selected', 'true');
      expect(second).toHaveFocus();
    } finally {
      vi.useRealTimers();
    }
  });
});
