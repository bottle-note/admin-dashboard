import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/test/test-utils';
import { Pagination } from '../Pagination';

describe('Pagination boundaries', () => {
  it('범위를 벗어난 빈 페이지는 숫자를 역전시키지 않고 마지막 페이지로 복구한다', async () => {
    const onPageChange = vi.fn();
    render(
      <Pagination
        currentPage={2}
        totalPages={1}
        totalElements={1}
        pageSize={20}
        currentItemCount={0}
        hasNext={false}
        onPageChange={onPageChange}
        onPageSizeChange={vi.fn()}
      />
    );
    expect(screen.queryByText(/41-1/)).not.toBeInTheDocument();
    expect(screen.queryByText('3 / 1 페이지')).not.toBeInTheDocument();
    expect(screen.getByText('요청한 페이지가 없습니다.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '마지막 페이지로' }));
    expect(onPageChange).toHaveBeenCalledWith(0);
  });

  it('일부 항목만 있는 현재 페이지의 실제 표시 개수를 사용한다', () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={3}
        totalElements={50}
        pageSize={20}
        currentItemCount={3}
        hasNext
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />
    );
    expect(screen.getByText('총 50개 중 21-23개 표시')).toBeInTheDocument();
  });
});
