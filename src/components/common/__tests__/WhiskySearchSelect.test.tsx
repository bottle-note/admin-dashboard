import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';

import { render } from '@/test/test-utils';

import { WhiskySearchSelect } from '../WhiskySearchSelect';

describe('WhiskySearchSelect', () => {
  it('아래 공간이 부족하고 위 공간이 더 넓으면 드롭다운을 위쪽에 표시한다', async () => {
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 500,
    });

    render(<WhiskySearchSelect onSelect={vi.fn()} />);

    const input = screen.getByPlaceholderText('위스키 이름으로 검색...');
    const container = input.parentElement?.parentElement;

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

    fireEvent.change(input, { target: { value: '글렌' } });

    const dropdownItem = await screen.findByText('글렌피딕 12년');
    const dropdown = dropdownItem.closest('.fixed');
    const scrollContainer = dropdownItem.closest('.overflow-y-auto');

    expect(dropdown).toHaveStyle({
      bottom: '84px',
      left: '20px',
      width: '320px',
    });
    expect(scrollContainer).toHaveStyle({ maxHeight: '352px' });
  });
});
