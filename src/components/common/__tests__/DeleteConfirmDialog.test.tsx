import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/test/test-utils';
import { DeleteConfirmDialog } from '../DeleteConfirmDialog';

function Harness({ onConfirm = vi.fn() }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  return (
    <DeleteConfirmDialog
      open={open}
      onOpenChange={setOpen}
      title="최종 확인"
      trigger={<button>검토 완료</button>}
      description={<p>검토한 대상 10개</p>}
      confirmText="병합 실행"
      pendingText="병합 중..."
      isPending={pending}
      closeOnConfirm={false}
      onConfirm={() => {
        onConfirm();
        setPending(true);
      }}
    />
  );
}

describe('DeleteConfirmDialog interaction', () => {
  it('키보드 취소 후 자신을 연 버튼으로 초점이 돌아온다', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const trigger = screen.getByRole('button', { name: '검토 완료' });
    trigger.focus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('button', { name: '취소' })).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(trigger).toHaveFocus();
  });

  it('실행 중에는 처리 상태를 유지하고 취소나 중복 실행을 막는다', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<Harness onConfirm={onConfirm} />);
    await user.click(screen.getByRole('button', { name: '검토 완료' }));
    await user.click(screen.getByRole('button', { name: '병합 실행' }));
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '취소' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '병합 중...' })).toBeDisabled();
    expect(screen.getByRole('alertdialog')).toContainElement(document.activeElement as HTMLElement);
    await user.keyboard('{Escape}');
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
