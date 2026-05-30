import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { render } from '@/test/test-utils';
import { CurationV2EntryPage } from '../CurationV2Entry';

describe('CurationV2EntryPage', () => {
  const getFirstPreviewButton = () => {
    const [firstPreviewButton] = screen.getAllByRole('button', { name: /미리보기/ });

    if (!firstPreviewButton) {
      throw new Error('미리보기 버튼을 찾을 수 없습니다.');
    }

    return firstPreviewButton;
  };

  it('큐레이션 타입을 시음회, 일반 큐레이션, 페어링 순서로 표시한다', () => {
    render(<CurationV2EntryPage />);

    const typeSection = screen.getByLabelText('큐레이션 유형 선택');
    const headings = within(typeSection).getAllByRole('heading', { level: 2 });

    expect(headings.map((heading) => heading.textContent)).toEqual([
      '시음회',
      '일반 큐레이션',
      '페어링',
    ]);
  });

  it('각 타입 카드에 작성하기와 미리보기 액션을 표시한다', () => {
    render(<CurationV2EntryPage />);

    expect(screen.getAllByRole('link', { name: /작성하기/ })).toHaveLength(3);
    expect(screen.getAllByRole('button', { name: /미리보기/ })).toHaveLength(3);
  });

  it('미리보기 패널은 빈 공간을 확보한다', () => {
    render(<CurationV2EntryPage />);

    expect(screen.getByRole('heading', { name: '미리보기' })).toBeInTheDocument();
    expect(screen.getByLabelText('비어 있는 미리보기 공간')).toBeInTheDocument();
  });

  it.skip('미리보기 버튼을 누르면 선택한 유형의 미리보기 이미지를 표시한다', async () => {
    const user = userEvent.setup();

    render(<CurationV2EntryPage />);

    await user.click(getFirstPreviewButton());

    expect(screen.getByRole('img', { name: '시음회 미리보기' })).toBeInTheDocument();
  });

  it('미리보기 버튼을 누르면 선택된 타입만 표시한다', async () => {
    const user = userEvent.setup();

    render(<CurationV2EntryPage />);

    await user.click(getFirstPreviewButton());

    expect(screen.getByText('시음회 미리보기 선택됨')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '큐레이션' })).toBeInTheDocument();
  });
});
