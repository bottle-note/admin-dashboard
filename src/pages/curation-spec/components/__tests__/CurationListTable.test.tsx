import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';

import { render } from '@/test/test-utils';

import { CurationListTable } from '../CurationListTable';

describe('CurationListTable', () => {
  it('목록 행을 누르면 해당 큐레이션 상세 이동 콜백을 호출한다', async () => {
    const user = userEvent.setup();
    const onItemClick = vi.fn();

    render(
      <CurationListTable
        items={[
          {
            id: 10,
            specId: 3,
            specCode: 'WHISKY_TASTING_EVENT',
            name: '6월 싱글몰트 시음회',
            displayOrder: 1,
            isActive: true,
            createdAt: '2026-05-15T00:00:00',
          },
        ]}
        specNames={{ WHISKY_TASTING_EVENT: '위스키 시음회' }}
        isLoading={false}
        isError={false}
        onRetry={vi.fn()}
        onItemClick={onItemClick}
      />
    );

    await user.click(screen.getByText('6월 싱글몰트 시음회').closest('tr')!);

    expect(onItemClick).toHaveBeenCalledWith(10);
  });
});
